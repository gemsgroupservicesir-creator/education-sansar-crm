import { Router, Request, Response } from 'express';
import { db, logAudit, logLeadActivity, createNotification } from '../db/database.ts';
import { checkDuplicate, createLead, updateLead, reassignLead, convertLeadToStudent } from '../services/leadService.ts';
import { getDashboardKPIs, getCampaignROIReport } from '../services/analyticsService.ts';
import { 
  verifyMetaWebhook, 
  handleMetaLeadWebhook, 
  sendWhatsAppMessage, 
  handleGoogleSheetsLeadWebhook, 
  exportLeadToGoogleSheet, 
  getGoogleAppsScriptTemplate,
  fetchLiveGoogleSheetData,
  syncLiveGoogleSheetLeads,
  parseGoogleSheetUrl,
  getAllGoogleSheetConnections,
  addOrConnectGoogleSheet,
  updateGoogleSheetConnection,
  deleteGoogleSheetConnection,
  syncAllActiveGoogleSheets
} from '../services/integrationService.ts';
import { Lead, FollowUp, Application, Student, University, Course, Campaign, DocumentItem } from '../types/index.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTH & ROLES
// ==========================================
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, username, password, role } = req.body || {};

    // 1. Role-based instant demo login
    if (role) {
      let user = db.prepare('SELECT * FROM users WHERE LOWER(role) = LOWER(?) AND is_active = 1 LIMIT 1').get(role) as any;
      if (!user) {
        user = db.prepare('SELECT * FROM users WHERE is_active = 1 LIMIT 1').get() as any;
      }
      if (user) {
        const { password_hash, ...safeUser } = user;
        return res.json({ success: true, user: safeUser, token: 'demo-token-' + user.id });
      }
    }

    const identifier = (email || username || '').trim().toLowerCase();
    if (!identifier) {
      return res.status(400).json({ error: 'Email or Username is required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // 2. Look up by email or counselor username (case-insensitive)
    let user = db.prepare(`
      SELECT * FROM users 
      WHERE (LOWER(email) = ? OR id IN (SELECT user_id FROM counselors WHERE LOWER(username) = ?))
        AND is_active = 1
      LIMIT 1
    `).get(identifier, identifier) as any;

    // 3. Convenience fallbacks for common aliases & test accounts
    if (!user && (identifier === 'admin' || identifier === 'superadmin' || identifier.includes('admin@'))) {
      user = db.prepare("SELECT * FROM users WHERE email = 'admin@educationsansar.com' AND is_active = 1").get() as any;
    }
    if (!user && identifier.includes('aarav')) {
      user = db.prepare("SELECT * FROM users WHERE email = 'aarav@educationsansar.com' AND is_active = 1").get() as any;
    }
    if (!user && identifier.includes('priya')) {
      user = db.prepare("SELECT * FROM users WHERE email = 'priya@educationsansar.com' AND is_active = 1").get() as any;
    }
    if (!user && identifier.includes('sunil')) {
      user = db.prepare("SELECT * FROM users WHERE email = 'sunil@educationsansar.com' AND is_active = 1").get() as any;
    }
    if (!user && identifier.includes('counselor')) {
      user = db.prepare("SELECT * FROM users WHERE role = 'Counselor' AND is_active = 1 LIMIT 1").get() as any;
    }

    if (!user) {
      return res.status(401).json({ error: 'User account not found. Please verify your email or username.' });
    }

    // Verify password (or allow demo passwords admin123 / pass123)
    if (user.password_hash !== password && password !== 'admin123' && password !== 'pass123') {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    try {
      logAudit({
        userName: user.name,
        action: 'USER_LOGIN',
        entity: 'user',
        entityId: user.id,
        newValue: { role: user.role, email: user.email }
      });
    } catch (auditErr) {
      console.warn('Audit log write skipped:', auditErr);
    }

    const { password_hash, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, token: 'session-token-' + user.id });
  } catch (err: any) {
    console.error('Login Route Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during authentication' });
  }
});

apiRouter.get('/auth/users', (req: Request, res: Response) => {
  const users = db.prepare('SELECT id, name, email, role, phone, is_active FROM users ORDER BY name ASC').all();
  res.json(users);
});

// ==========================================
// 2. LEADS
// ==========================================
apiRouter.get('/leads', (req: Request, res: Response) => {
  const {
    search,
    status,
    counselorId,
    city,
    university,
    course,
    source,
    campaign,
    temperature,
    startDate,
    endDate,
    page = '1',
    limit = '25'
  } = req.query;

  const whereClauses: string[] = ['is_deleted = 0'];
  const params: any[] = [];

  if (search) {
    const s = `%${search}%`;
    whereClauses.push('(student_name LIKE ? OR phone LIKE ? OR email LIKE ? OR lead_id LIKE ? OR city LIKE ?)');
    params.push(s, s, s, s, s);
  }
  if (status) {
    whereClauses.push('lead_status = ?');
    params.push(status);
  }
  if (counselorId) {
    whereClauses.push('assigned_counselor_id = ?');
    params.push(counselorId);
  }
  if (city) {
    whereClauses.push('city = ?');
    params.push(city);
  }
  if (university) {
    whereClauses.push('preferred_university = ?');
    params.push(university);
  }
  if (course) {
    whereClauses.push('preferred_course = ?');
    params.push(course);
  }
  if (source) {
    whereClauses.push('lead_source = ?');
    params.push(source);
  }
  if (campaign) {
    whereClauses.push('campaign = ?');
    params.push(campaign);
  }
  if (temperature) {
    whereClauses.push('lead_temperature = ?');
    params.push(temperature);
  }
  if (startDate) {
    whereClauses.push('date(created_at) >= date(?)');
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push('date(created_at) <= date(?)');
    params.push(endDate);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

  const total = (db.prepare(`SELECT count(*) as count FROM leads ${whereSql}`).get(...params) as { count: number }).count;

  const p = Math.max(1, parseInt(page as string, 10));
  const l = Math.max(1, parseInt(limit as string, 10));
  const offset = (p - 1) * l;

  const leads = db.prepare(`
    SELECT * FROM leads 
    ${whereSql}
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(...params, l, offset) as Lead[];

  res.json({
    data: leads,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l)
    }
  });
});

apiRouter.post('/leads/check-duplicate', (req: Request, res: Response) => {
  const result = checkDuplicate(req.body);
  res.json(result);
});

apiRouter.post('/leads', (req: Request, res: Response) => {
  try {
    const { bypassDuplicateCheck, ...leadData } = req.body;

    if (!leadData.student_name && !leadData.first_name) {
      return res.status(400).json({ error: 'Student name is required' });
    }
    if (!leadData.phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check duplicate unless explicitly bypassed
    if (!bypassDuplicateCheck) {
      const dupCheck = checkDuplicate({
        phone: leadData.phone,
        whatsapp_number: leadData.whatsapp_number || leadData.phone,
        email: leadData.email,
        facebook_lead_id: leadData.facebook_lead_id
      });

      if (dupCheck.hasDuplicate) {
        return res.status(409).json({
          error: 'Possible duplicate lead found',
          duplicates: dupCheck.duplicates,
          reasons: dupCheck.matchReasons
        });
      }
    }

    const lead = createLead(leadData, req.body.performedBy || 'User');
    res.status(201).json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Unable to create lead' });
  }
});

apiRouter.get('/leads/:id', (req: Request, res: Response) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND is_deleted = 0').get(req.params.id) as Lead | undefined;
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  // Linked Applications
  const applications = db.prepare('SELECT * FROM applications WHERE lead_id = ? ORDER BY created_at DESC').all(lead.id);

  // Linked Documents
  const documents = db.prepare('SELECT * FROM documents WHERE lead_id = ? ORDER BY created_at DESC').all(lead.id);

  // Activities timeline
  const activities = db.prepare('SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC').all(lead.id);

  // Follow-ups
  const followups = db.prepare('SELECT * FROM followups WHERE lead_id = ? ORDER BY follow_up_date DESC, follow_up_time DESC').all(lead.id);

  // Status history
  const statusHistory = db.prepare('SELECT * FROM lead_status_history WHERE lead_id = ? ORDER BY created_at DESC').all(lead.id);

  // Assignment history
  const assignmentHistory = db.prepare('SELECT * FROM lead_assignments WHERE lead_id = ? ORDER BY assigned_date DESC').all(lead.id);

  res.json({
    lead,
    applications,
    documents,
    activities,
    followups,
    statusHistory,
    assignmentHistory
  });
});

apiRouter.put('/leads/:id', (req: Request, res: Response) => {
  try {
    const updated = updateLead(req.params.id, req.body, req.body.performedBy || 'User');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Unable to update lead' });
  }
});

apiRouter.delete('/leads/:id', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to delete leads.' });
  }

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id) as Lead | undefined;
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  // Soft delete
  db.prepare("UPDATE leads SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  logAudit({
    userName: req.body.performedBy || 'User',
    action: 'LEAD_DELETED_SOFT',
    entity: 'lead',
    entityId: req.params.id,
    oldValue: { lead_id: lead.lead_id, student_name: lead.student_name }
  });

  res.json({ success: true, message: 'Lead soft-deleted successfully' });
});

apiRouter.post('/leads/:id/reassign', (req: Request, res: Response) => {
  try {
    const { counselorId, performedBy } = req.body;
    if (!counselorId) return res.status(400).json({ error: 'Please select a counselor' });

    const updated = reassignLead(req.params.id, counselorId, performedBy || 'User');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Unable to reassign lead' });
  }
});

apiRouter.post('/leads/:id/activities', (req: Request, res: Response) => {
  const { activity_type, title, description, performed_by } = req.body;
  if (!title || !activity_type) {
    return res.status(400).json({ error: 'Activity title and type are required' });
  }

  logLeadActivity({
    leadId: req.params.id,
    activityType: activity_type,
    title,
    description: description || '',
    performedBy: performed_by || 'User'
  });

  // Update lead's last_contact_date if it's a contact activity
  if (['Phone Call', 'WhatsApp', 'Meeting', 'Email'].includes(activity_type)) {
    db.prepare("UPDATE leads SET last_contact_date = date('now'), updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  }

  res.json({ success: true });
});

// ==========================================
// 3. COUNSELORS
// ==========================================
apiRouter.get('/counselors', (req: Request, res: Response) => {
  const counselors = db.prepare(`
    SELECT c.*,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.is_deleted = 0) as total_leads_count,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status IN ('New Lead', 'Contacted', 'Counseling Scheduled', 'Interested', 'Application Started', 'Documents Pending') AND l.is_deleted = 0) as active_leads_count
    FROM counselors c
    ORDER BY c.name ASC
  `).all();
  res.json(counselors);
});

apiRouter.put('/counselors/:id/toggle-active', (req: Request, res: Response) => {
  const c = db.prepare('SELECT is_active, name FROM counselors WHERE id = ?').get(req.params.id) as any;
  if (!c) return res.status(404).json({ error: 'Counselor not found' });

  const newActive = c.is_active === 1 ? 0 : 1;
  db.prepare("UPDATE counselors SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(newActive, req.params.id);

  logAudit({
    userName: req.body.performedBy || 'Admin',
    action: newActive ? 'COUNSELOR_ACTIVATED' : 'COUNSELOR_DEACTIVATED',
    entity: 'counselor',
    entityId: req.params.id,
    newValue: { is_active: newActive, name: c.name }
  });

  res.json({ success: true, is_active: newActive });
});

apiRouter.post('/counselors', (req: Request, res: Response) => {
  const { name, email, phone, specialization_country, assigned_cities, max_capacity, password, username } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ error: 'Name, email and phone are required' });

  const cId = 'c-' + Date.now();
  const uId = 'u-' + Date.now();
  const pwd = password || 'counselor123';
  const uname = username || email.split('@')[0];

  db.prepare(`
    INSERT INTO counselors (id, user_id, name, username, email, phone, specialization_country, assigned_cities, max_capacity, is_active, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Active')
  `).run(cId, uId, name, uname, email, phone, specialization_country || 'Nepal & India', JSON.stringify(assigned_cities || []), max_capacity || 100);

  db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active)
    VALUES (?, ?, ?, ?, 'Counselor', ?, 1)
  `).run(uId, name, email, pwd, phone);

  logAudit({
    userName: req.body.performedBy || 'Admin',
    action: 'COUNSELOR_CREATED',
    entity: 'counselor',
    entityId: cId,
    newValue: { name, email, phone }
  });

  res.status(201).json({ success: true, id: cId, user_id: uId });
});

apiRouter.put('/counselors/:id', (req: Request, res: Response) => {
  const { name, email, phone, specialization_country, assigned_cities, max_capacity, is_active, status } = req.body;
  const counselor = db.prepare('SELECT * FROM counselors WHERE id = ?').get(req.params.id) as any;
  if (!counselor) return res.status(404).json({ error: 'Counselor not found' });

  const activeVal = is_active !== undefined ? is_active : (status === 'Inactive' ? 0 : (status === 'Active' ? 1 : counselor.is_active));
  const statusVal = status || (activeVal === 1 ? 'Active' : 'Inactive');

  db.prepare(`
    UPDATE counselors 
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        specialization_country = COALESCE(?, specialization_country),
        assigned_cities = COALESCE(?, assigned_cities),
        max_capacity = COALESCE(?, max_capacity),
        is_active = COALESCE(?, is_active),
        status = COALESCE(?, status),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(name, email, phone, specialization_country, assigned_cities ? JSON.stringify(assigned_cities) : null, max_capacity, activeVal, statusVal, req.params.id);

  if (email || name || phone || is_active !== undefined) {
    db.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          is_active = COALESCE(?, is_active),
          updated_at = datetime('now')
      WHERE email = ? OR id = ?
    `).run(name, email, phone, activeVal, counselor.email, counselor.user_id);
  }

  logAudit({
    userName: req.body.performedBy || 'Admin',
    action: 'COUNSELOR_UPDATED',
    entity: 'counselor',
    entityId: req.params.id,
    newValue: { name, email, phone, status: statusVal }
  });

  res.json({ success: true });
});

apiRouter.delete('/counselors/:id', (req: Request, res: Response) => {
  const counselor = db.prepare('SELECT * FROM counselors WHERE id = ?').get(req.params.id) as any;
  if (!counselor) return res.status(404).json({ error: 'Counselor not found' });

  const activeLeadCount = (db.prepare('SELECT count(*) as count FROM leads WHERE assigned_counselor_id = ? AND is_deleted = 0').get(req.params.id) as any).count;
  const reassignToCounselorId = req.body?.reassignToCounselorId || req.query?.reassignToCounselorId;

  if (activeLeadCount > 0) {
    if (!reassignToCounselorId) {
      return res.status(400).json({
        error: `Counselor has ${activeLeadCount} active leads. Please select a counselor to reassign leads before deleting.`,
        activeLeadCount
      });
    }
    const targetCounselor = db.prepare('SELECT id, name FROM counselors WHERE id = ?').get(reassignToCounselorId) as any;
    if (!targetCounselor) {
      return res.status(400).json({ error: 'Target reassignment counselor not found' });
    }
    db.prepare(`
      UPDATE leads 
      SET assigned_counselor_id = ?, assigned_counselor_name = ?, updated_at = datetime('now')
      WHERE assigned_counselor_id = ? AND is_deleted = 0
    `).run(targetCounselor.id, targetCounselor.name, req.params.id);

    logAudit({
      userName: req.body.performedBy || 'Admin',
      action: 'COUNSELOR_LEADS_REASSIGNED_ON_DELETE',
      entity: 'counselor',
      entityId: req.params.id,
      newValue: { reassignedTo: targetCounselor.name, count: activeLeadCount }
    });
  }

  db.prepare('DELETE FROM users WHERE email = ? OR id = ?').run(counselor.email, counselor.user_id);
  db.prepare('DELETE FROM counselors WHERE id = ?').run(req.params.id);

  logAudit({
    userName: req.body.performedBy || 'Admin',
    action: 'COUNSELOR_DELETED',
    entity: 'counselor',
    entityId: req.params.id,
    oldValue: { name: counselor.name, email: counselor.email }
  });

  res.json({ success: true, message: `Counselor ${counselor.name} deleted successfully.` });
});

apiRouter.post('/counselors/:id/reset-password', (req: Request, res: Response) => {
  const { password, performedBy } = req.body;
  if (!password || password.trim().length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }
  const counselor = db.prepare('SELECT * FROM counselors WHERE id = ?').get(req.params.id) as any;
  if (!counselor) return res.status(404).json({ error: 'Counselor not found' });

  db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = datetime('now')
    WHERE email = ? OR id = ?
  `).run(password, counselor.email, counselor.user_id);

  logAudit({
    userName: performedBy || 'Admin',
    action: 'COUNSELOR_PASSWORD_RESET',
    entity: 'counselor',
    entityId: req.params.id,
    newValue: { email: counselor.email }
  });

  res.json({ success: true, message: `Password reset successfully for ${counselor.name}.` });
});

// ==========================================
// 4. FOLLOW-UPS
// ==========================================
apiRouter.get('/followups', (req: Request, res: Response) => {
  const { counselorId, status, view, date } = req.query;

  let sql = `
    SELECT f.*, 
      l.student_name as lead_name, 
      l.phone as lead_phone,
      l.preferred_course,
      l.preferred_university,
      c.name as counselor_name
    FROM followups f
    JOIN leads l ON f.lead_id = l.id
    LEFT JOIN counselors c ON f.counselor_id = c.id
    WHERE l.is_deleted = 0
  `;
  const params: any[] = [];

  if (counselorId) {
    sql += ' AND f.counselor_id = ?';
    params.push(counselorId);
  }

  if (view === 'today') {
    sql += " AND date(f.follow_up_date) = date('now') AND f.status = 'Pending'";
  } else if (view === 'overdue') {
    sql += " AND date(f.follow_up_date) < date('now') AND f.status = 'Pending'";
  } else if (view === 'upcoming') {
    sql += " AND date(f.follow_up_date) > date('now') AND f.status = 'Pending'";
  } else if (view === 'completed') {
    sql += " AND f.status = 'Completed'";
  } else if (status) {
    sql += ' AND f.status = ?';
    params.push(status);
  }

  if (date) {
    sql += ' AND date(f.follow_up_date) = date(?)';
    params.push(date);
  }

  sql += ' ORDER BY f.follow_up_date ASC, f.follow_up_time ASC';

  const followups = db.prepare(sql).all(...params);
  res.json(followups);
});

apiRouter.post('/followups', (req: Request, res: Response) => {
  const { lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, performedBy } = req.body;
  if (!lead_id || !follow_up_date) {
    return res.status(400).json({ error: 'Lead ID and follow up date are required' });
  }

  const id = 'fup-' + Date.now();
  db.prepare(`
    INSERT INTO followups (id, lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
  `).run(id, lead_id, counselor_id || null, follow_up_date, follow_up_time || '10:00', type || 'Call', priority || 'MEDIUM', notes || '', performedBy || 'User');

  // Update lead's next follow-up date
  db.prepare("UPDATE leads SET next_follow_up_date = ?, updated_at = datetime('now') WHERE id = ?").run(follow_up_date, lead_id);

  // Log activity
  logLeadActivity({
    leadId: lead_id,
    activityType: 'Meeting',
    title: `Follow-up Scheduled: ${type || 'Call'}`,
    description: `Scheduled for ${follow_up_date} at ${follow_up_time || '10:00'}. Priority: ${priority || 'MEDIUM'}. Note: ${notes || 'None'}`,
    performedBy: performedBy || 'User'
  });

  res.status(201).json({ success: true, id });
});

apiRouter.put('/followups/:id/complete', (req: Request, res: Response) => {
  const { outcomeNotes, performedBy } = req.body;
  const fup = db.prepare('SELECT * FROM followups WHERE id = ?').get(req.params.id) as any;
  if (!fup) return res.status(404).json({ error: 'Follow-up not found' });

  db.prepare(`
    UPDATE followups 
    SET status = 'Completed', 
        completed_at = datetime('now'),
        notes = CASE WHEN notes IS NOT NULL THEN notes || ' | Outcome: ' || ? ELSE ? END,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(outcomeNotes || 'Completed', outcomeNotes || 'Completed', req.params.id);

  // Update lead last contact
  db.prepare("UPDATE leads SET last_contact_date = date('now'), updated_at = datetime('now') WHERE id = ?").run(fup.lead_id);

  // Log activity
  logLeadActivity({
    leadId: fup.lead_id,
    activityType: fup.type === 'Call' ? 'Phone Call' : fup.type === 'WhatsApp' ? 'WhatsApp' : 'Meeting',
    title: `Follow-up Completed: ${fup.type}`,
    description: outcomeNotes ? `Outcome: ${outcomeNotes}` : 'Follow-up marked as completed.',
    performedBy: performedBy || 'User'
  });

  res.json({ success: true });
});

// ==========================================
// 5. APPLICATIONS
// ==========================================
apiRouter.get('/applications', (req: Request, res: Response) => {
  const { status, counselorId, universityId, search } = req.query;

  let sql = `
    SELECT a.*, l.phone as student_phone, l.email as student_email
    FROM applications a
    JOIN leads l ON a.lead_id = l.id
    WHERE l.is_deleted = 0
  `;
  const params: any[] = [];

  if (status) {
    sql += ' AND a.application_status = ?';
    params.push(status);
  }
  if (counselorId) {
    sql += ' AND a.counselor_id = ?';
    params.push(counselorId);
  }
  if (universityId) {
    sql += ' AND a.university_id = ?';
    params.push(universityId);
  }
  if (search) {
    sql += ' AND (a.student_name LIKE ? OR a.application_id LIKE ? OR a.application_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY a.created_at DESC';

  const apps = db.prepare(sql).all(...params);
  res.json(apps);
});

apiRouter.post('/applications', (req: Request, res: Response) => {
  const { lead_id, university_id, university_name, course_id, course_name, application_fee, deadline, remarks, performedBy } = req.body;
  if (!lead_id || !university_name || !course_name) {
    return res.status(400).json({ error: 'Lead, University and Course are required' });
  }

  const lead = db.prepare('SELECT student_name, assigned_counselor_id, assigned_counselor_name FROM leads WHERE id = ?').get(lead_id) as any;
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const currentYear = new Date().getFullYear();
  const countRow = db.prepare("SELECT count(*) as count FROM applications WHERE application_id LIKE ?").get(`APP-${currentYear}-%`) as { count: number };
  const appId = `APP-${currentYear}-${(countRow.count + 1).toString().padStart(3, '0')}`;
  const id = 'app-' + Date.now();

  db.prepare(`
    INSERT INTO applications (
      id, application_id, lead_id, student_name, university_id, university_name, course_id, course_name,
      application_date, application_status, application_fee, payment_status, deadline, counselor_id, counselor_name, remarks
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      date('now'), 'Application Started', ?, 'Unpaid', ?, ?, ?, ?
    )
  `).run(
    id, appId, lead_id, lead.student_name, university_id || null, university_name, course_id || null, course_name,
    application_fee || 0, deadline || null, lead.assigned_counselor_id || null, lead.assigned_counselor_name || null, remarks || ''
  );

  // Update lead status to Application Started if it was earlier stage
  db.prepare(`
    UPDATE leads 
    SET lead_status = 'Application Started', updated_at = datetime('now')
    WHERE id = ? AND lead_status IN ('New Lead', 'Contacted', 'Counseling Scheduled', 'Counseling Done', 'Interested')
  `).run(lead_id);

  // Log activity
  logLeadActivity({
    leadId: lead_id,
    activityType: 'Application Update',
    title: `New Application Created: ${appId}`,
    description: `Applied for ${course_name} at ${university_name}`,
    performedBy: performedBy || 'User'
  });

  res.status(201).json({ success: true, id, application_id: appId });
});

apiRouter.put('/applications/:id', (req: Request, res: Response) => {
  const { application_status, payment_status, application_number, remarks, performedBy } = req.body;
  const currentApp = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as Application | undefined;
  if (!currentApp) return res.status(404).json({ error: 'Application not found' });

  db.prepare(`
    UPDATE applications 
    SET application_status = COALESCE(?, application_status),
        payment_status = COALESCE(?, payment_status),
        application_number = COALESCE(?, application_number),
        remarks = COALESCE(?, remarks),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(application_status, payment_status, application_number, remarks, req.params.id);

  // If status is Admission Confirmed, trigger lead conversion
  if (application_status === 'Admission Confirmed') {
    convertLeadToStudent(currentApp.lead_id, performedBy || 'User');
  }

  // Log activity
  logLeadActivity({
    leadId: currentApp.lead_id,
    activityType: 'Application Update',
    title: `Application ${currentApp.application_id} Updated`,
    description: `Status: ${application_status || currentApp.application_status}, Payment: ${payment_status || currentApp.payment_status}`,
    performedBy: performedBy || 'User'
  });

  res.json({ success: true });
});

// ==========================================
// 6. STUDENTS (Enrolled)
// ==========================================
apiRouter.get('/students', (req: Request, res: Response) => {
  const { search, university, course } = req.query;

  let sql = 'SELECT * FROM students WHERE 1=1';
  const params: any[] = [];

  if (search) {
    sql += ' AND (student_name LIKE ? OR student_id LIKE ? OR phone LIKE ? OR email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (university) {
    sql += ' AND university = ?';
    params.push(university);
  }
  if (course) {
    sql += ' AND course = ?';
    params.push(course);
  }

  sql += ' ORDER BY admission_date DESC';

  const students = db.prepare(sql).all(...params);
  res.json(students);
});

apiRouter.get('/students/:id', (req: Request, res: Response) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id) as Student | undefined;
  if (!student) return res.status(404).json({ error: 'Student not found' });

  // Get historical lead data
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(student.lead_id);
  const applications = db.prepare('SELECT * FROM applications WHERE lead_id = ?').all(student.lead_id);
  const documents = db.prepare('SELECT * FROM documents WHERE lead_id = ?').all(student.lead_id);
  const activities = db.prepare('SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC').all(student.lead_id);

  res.json({
    student,
    lead,
    applications,
    documents,
    activities
  });
});

// ==========================================
// 7. UNIVERSITIES & COURSES
// ==========================================
// ==========================================
// 7. UNIVERSITIES & COURSES
// ==========================================
apiRouter.get('/universities', (req: Request, res: Response) => {
  const unis = db.prepare(`
    SELECT u.*,
      (SELECT count(*) FROM university_courses uc WHERE uc.university_id = u.id) as fee_structures_count,
      (SELECT count(*) FROM courses c WHERE c.university_id = u.id) as legacy_courses_count,
      (SELECT count(*) FROM applications a WHERE a.university_id = u.id) as applications_count
    FROM universities u
    ORDER BY u.name ASC
  `).all();
  res.json(unis);
});

apiRouter.post('/universities', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to add universities.' });
  }

  const { name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status } = req.body;
  if (!name || !city || !state) return res.status(400).json({ error: 'University name, city and state are required' });

  const id = 'uni-' + Date.now();
  db.prepare(`
    INSERT INTO universities (id, name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status, is_active, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `).run(id, name, short_name || '', campus || '', city, state, country || 'India', university_type || 'Private', accreditation || '', ranking || '', website || '', contact || '', description || '', status || 'Active');

  res.status(201).json({ success: true, id });
});

apiRouter.put('/universities/:id', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to modify universities.' });
  }

  const { name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status, is_active } = req.body;
  db.prepare(`
    UPDATE universities 
    SET name = COALESCE(?, name),
        short_name = COALESCE(?, short_name),
        campus = COALESCE(?, campus),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        country = COALESCE(?, country),
        university_type = COALESCE(?, university_type),
        accreditation = COALESCE(?, accreditation),
        ranking = COALESCE(?, ranking),
        website = COALESCE(?, website),
        contact = COALESCE(?, contact),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status, is_active, req.params.id);

  res.json({ success: true });
});

apiRouter.delete('/universities/:id', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to delete universities.' });
  }

  db.prepare('DELETE FROM university_courses WHERE university_id = ?').run(req.params.id);
  db.prepare('DELETE FROM courses WHERE university_id = ?').run(req.params.id);
  db.prepare('DELETE FROM universities WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

apiRouter.get('/courses', (req: Request, res: Response) => {
  const { university_id, stream, course_level, search } = req.query;
  let sql = 'SELECT * FROM courses WHERE 1=1';
  const params: any[] = [];
  if (university_id) {
    sql += ' AND university_id = ?';
    params.push(university_id);
  }
  if (stream) {
    sql += ' AND stream = ?';
    params.push(stream);
  }
  if (course_level) {
    sql += ' AND course_level = ?';
    params.push(course_level);
  }
  if (search) {
    sql += ' AND (course_name LIKE ? OR stream LIKE ? OR short_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY course_name ASC';
  const courses = db.prepare(sql).all(...params);
  res.json(courses);
});

apiRouter.post('/courses', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to add courses.' });
  }

  const { university_id, university_name, course_name, short_name, course_level, stream, degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info, intake, application_deadline, description } = req.body;
  if (!course_name) return res.status(400).json({ error: 'Course name is required' });

  const id = 'crs-' + Date.now();
  db.prepare(`
    INSERT INTO courses (
      id, university_id, university_name, course_name, short_name, course_level, stream,
      degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info,
      intake, application_deadline, description, is_active, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `).run(
    id, university_id || null, university_name || 'Multiple Universities', course_name, short_name || '',
    course_level || degree_level || 'Undergraduate', stream || 'General', degree_level || course_level || 'Undergraduate',
    duration || '4 Years', eligibility || '', entrance_requirement || '', fees_range || '', scholarship_info || '',
    intake || 'Fall 2026', application_deadline || null, description || ''
  );

  res.status(201).json({ success: true, id });
});

apiRouter.put('/courses/:id', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to edit courses.' });
  }

  const { course_name, short_name, course_level, stream, degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info, intake, application_deadline, description, is_active } = req.body;
  db.prepare(`
    UPDATE courses 
    SET course_name = COALESCE(?, course_name),
        short_name = COALESCE(?, short_name),
        course_level = COALESCE(?, course_level),
        stream = COALESCE(?, stream),
        degree_level = COALESCE(?, degree_level),
        duration = COALESCE(?, duration),
        eligibility = COALESCE(?, eligibility),
        entrance_requirement = COALESCE(?, entrance_requirement),
        fees_range = COALESCE(?, fees_range),
        scholarship_info = COALESCE(?, scholarship_info),
        intake = COALESCE(?, intake),
        application_deadline = COALESCE(?, application_deadline),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(course_name, short_name, course_level, stream, degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info, intake, application_deadline, description, is_active, req.params.id);

  res.json({ success: true });
});

apiRouter.delete('/courses/:id', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to delete courses.' });
  }

  db.prepare('DELETE FROM university_courses WHERE course_id = ?').run(req.params.id);
  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// 7.1 UNIVERSITY COURSES & FEE DATABASE (SECTION 7)
// ==========================================
apiRouter.get('/university-courses', (req: Request, res: Response) => {
  const { search, university_id, course_id, stream, course_level, max_fee, city, state } = req.query;
  let sql = `
    SELECT 
      uc.*,
      u.name as university_name,
      u.short_name as university_short_name,
      u.city as university_city,
      u.state as university_state,
      u.country as university_country,
      u.ranking as university_ranking,
      u.accreditation as university_accreditation,
      u.university_type,
      c.course_name,
      c.short_name as course_short_name,
      c.course_level,
      c.stream,
      c.duration as course_duration,
      c.eligibility as course_eligibility,
      c.entrance_requirement
    FROM university_courses uc
    JOIN universities u ON uc.university_id = u.id
    JOIN courses c ON uc.course_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (search) {
    const s = `%${search}%`;
    sql += ` AND (u.name LIKE ? OR c.course_name LIKE ? OR u.city LIKE ? OR c.stream LIKE ? OR u.short_name LIKE ?)`;
    params.push(s, s, s, s, s);
  }
  if (university_id) {
    sql += ` AND uc.university_id = ?`;
    params.push(university_id);
  }
  if (course_id) {
    sql += ` AND uc.course_id = ?`;
    params.push(course_id);
  }
  if (stream) {
    sql += ` AND c.stream = ?`;
    params.push(stream);
  }
  if (course_level) {
    sql += ` AND c.course_level = ?`;
    params.push(course_level);
  }
  if (city) {
    sql += ` AND u.city LIKE ?`;
    params.push(`%${city}%`);
  }
  if (state) {
    sql += ` AND u.state LIKE ?`;
    params.push(`%${state}%`);
  }
  if (max_fee) {
    const feeNum = parseFloat(max_fee as string);
    if (!isNaN(feeNum)) {
      sql += ` AND (uc.tuition_fee_per_year <= ? OR uc.total_first_year_fee <= ?)`;
      params.push(feeNum, feeNum);
    }
  }
  sql += ` ORDER BY c.course_name ASC, uc.total_first_year_fee ASC`;
  const results = db.prepare(sql).all(...params);
  res.json(results);
});

apiRouter.get('/university-courses/compare', (req: Request, res: Response) => {
  const ids = req.query.ids as string;
  if (!ids) return res.json([]);
  const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
  if (idList.length === 0) return res.json([]);

  const placeholders = idList.map(() => '?').join(',');
  const sql = `
    SELECT 
      uc.*,
      u.name as university_name,
      u.short_name as university_short_name,
      u.city as university_city,
      u.state as university_state,
      u.country as university_country,
      u.ranking as university_ranking,
      u.accreditation as university_accreditation,
      u.university_type,
      c.course_name,
      c.short_name as course_short_name,
      c.course_level,
      c.stream,
      c.duration as course_duration,
      c.eligibility as course_eligibility,
      c.entrance_requirement
    FROM university_courses uc
    JOIN universities u ON uc.university_id = u.id
    JOIN courses c ON uc.course_id = c.id
    WHERE uc.id IN (${placeholders})
  `;
  const results = db.prepare(sql).all(...idList);
  res.json(results);
});

apiRouter.get('/university-courses/:id', (req: Request, res: Response) => {
  const sql = `
    SELECT 
      uc.*,
      u.name as university_name,
      u.short_name as university_short_name,
      u.city as university_city,
      u.state as university_state,
      u.ranking as university_ranking,
      u.accreditation as university_accreditation,
      u.university_type,
      c.course_name,
      c.course_level,
      c.stream,
      c.duration as course_duration,
      c.eligibility as course_eligibility,
      c.entrance_requirement
    FROM university_courses uc
    JOIN universities u ON uc.university_id = u.id
    JOIN courses c ON uc.course_id = c.id
    WHERE uc.id = ?
  `;
  const item = db.prepare(sql).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Fee structure not found' });
  res.json(item);
});

apiRouter.post('/university-courses', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to add fee structures.' });
  }

  const {
    university_id,
    course_id,
    tuition_fee_per_year,
    hostel_fee_per_year,
    one_time_fee,
    other_charges,
    total_first_year_fee,
    total_full_course_fee,
    currency,
    eligibility_notes,
    scholarship_available,
    scholarship_details,
    application_deadline,
    admission_process,
    remarks
  } = req.body;

  if (!university_id || !course_id) {
    return res.status(400).json({ error: 'University and Course are required' });
  }

  const tuition = Number(tuition_fee_per_year) || 0;
  const hostel = Number(hostel_fee_per_year) || 0;
  const oneTime = Number(one_time_fee) || 0;
  const other = Number(other_charges) || 0;
  const total1st = Number(total_first_year_fee) || (tuition + hostel + oneTime + other);

  const id = 'uc-' + Date.now();
  db.prepare(`
    INSERT INTO university_courses (
      id, university_id, course_id, tuition_fee_per_year, hostel_fee_per_year, one_time_fee,
      other_charges, total_first_year_fee, total_full_course_fee, currency, eligibility_notes,
      scholarship_available, scholarship_details, application_deadline, admission_process, remarks, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id, university_id, course_id, tuition, hostel, oneTime, other, total1st,
    total_full_course_fee ? Number(total_full_course_fee) : null, currency || 'INR', eligibility_notes || '',
    scholarship_available !== undefined ? (scholarship_available ? 1 : 0) : 1, scholarship_details || '',
    application_deadline || null, admission_process || 'Direct Merit / Counseling', remarks || ''
  );

  res.status(201).json({ success: true, id });
});

apiRouter.put('/university-courses/:id', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to edit fee structures.' });
  }

  const current = db.prepare('SELECT * FROM university_courses WHERE id = ?').get(req.params.id) as any;
  if (!current) return res.status(404).json({ error: 'Fee structure not found' });

  const {
    tuition_fee_per_year,
    hostel_fee_per_year,
    one_time_fee,
    other_charges,
    total_first_year_fee,
    total_full_course_fee,
    currency,
    eligibility_notes,
    scholarship_available,
    scholarship_details,
    application_deadline,
    admission_process,
    remarks,
    is_active
  } = req.body;

  db.prepare(`
    UPDATE university_courses
    SET tuition_fee_per_year = COALESCE(?, tuition_fee_per_year),
        hostel_fee_per_year = COALESCE(?, hostel_fee_per_year),
        one_time_fee = COALESCE(?, one_time_fee),
        other_charges = COALESCE(?, other_charges),
        total_first_year_fee = COALESCE(?, total_first_year_fee),
        total_full_course_fee = COALESCE(?, total_full_course_fee),
        currency = COALESCE(?, currency),
        eligibility_notes = COALESCE(?, eligibility_notes),
        scholarship_available = COALESCE(?, scholarship_available),
        scholarship_details = COALESCE(?, scholarship_details),
        application_deadline = COALESCE(?, application_deadline),
        admission_process = COALESCE(?, admission_process),
        remarks = COALESCE(?, remarks),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    tuition_fee_per_year !== undefined ? Number(tuition_fee_per_year) : null,
    hostel_fee_per_year !== undefined ? Number(hostel_fee_per_year) : null,
    one_time_fee !== undefined ? Number(one_time_fee) : null,
    other_charges !== undefined ? Number(other_charges) : null,
    total_first_year_fee !== undefined ? Number(total_first_year_fee) : null,
    total_full_course_fee !== undefined ? Number(total_full_course_fee) : null,
    currency,
    eligibility_notes,
    scholarship_available !== undefined ? (scholarship_available ? 1 : 0) : null,
    scholarship_details,
    application_deadline,
    admission_process,
    remarks,
    is_active,
    req.params.id
  );

  res.json({ success: true });
});

apiRouter.delete('/university-courses/:id', (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to delete fee structures.' });
  }

  db.prepare('DELETE FROM university_courses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// 8. DOCUMENTS
// ==========================================
apiRouter.get('/documents', (req: Request, res: Response) => {
  const { lead_id, status } = req.query;
  let sql = 'SELECT * FROM documents WHERE 1=1';
  const params: any[] = [];
  if (lead_id) {
    sql += ' AND lead_id = ?';
    params.push(lead_id);
  }
  if (status) {
    sql += ' AND verification_status = ?';
    params.push(status);
  }
  sql += ' ORDER BY upload_date DESC';
  const docs = db.prepare(sql).all(...params);
  res.json(docs);
});

apiRouter.post('/documents/upload', (req: Request, res: Response) => {
  const { lead_id, student_id, application_id, file_name, file_url, document_type, uploaded_by } = req.body;
  if (!lead_id || !file_name || !document_type) {
    return res.status(400).json({ error: 'Lead, file name and document type are required' });
  }

  const id = 'doc-' + Date.now();
  db.prepare(`
    INSERT INTO documents (
      id, lead_id, student_id, application_id, file_name, file_url, file_size, mime_type,
      document_type, verification_status, uploaded_by, upload_date, is_demo
    ) VALUES (
      ?, ?, ?, ?, ?, ?, 250000, 'application/pdf',
      ?, 'Uploaded', ?, datetime('now'), 0
    )
  `).run(id, lead_id, student_id || null, application_id || null, file_name, file_url || `/uploads/${file_name}`, document_type, uploaded_by || 'Counselor');

  // Log activity
  logLeadActivity({
    leadId: lead_id,
    activityType: 'Document Upload',
    title: `Document Uploaded: ${document_type}`,
    description: `File: ${file_name}`,
    performedBy: uploaded_by || 'Counselor'
  });

  res.status(201).json({ success: true, id });
});

apiRouter.put('/documents/:id/verify', (req: Request, res: Response) => {
  const { status, verification_notes, verified_by } = req.body;
  if (!['Verified', 'Rejected', 'Pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid verification status' });
  }

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as DocumentItem | undefined;
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  db.prepare(`
    UPDATE documents 
    SET verification_status = ?,
        verification_notes = ?,
        verified_by = ?,
        verified_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, verification_notes || '', verified_by || 'Admin', req.params.id);

  // Log activity
  logLeadActivity({
    leadId: doc.lead_id,
    activityType: 'Document Upload',
    title: `Document ${status}: ${doc.document_type}`,
    description: verification_notes ? `Notes: ${verification_notes}` : `Status marked as ${status}`,
    performedBy: verified_by || 'Admin'
  });

  res.json({ success: true });
});

// ==========================================
// 9. CAMPAIGNS
// ==========================================
apiRouter.get('/campaigns', (req: Request, res: Response) => {
  const report = getCampaignROIReport();
  res.json(report);
});

apiRouter.post('/campaigns', (req: Request, res: Response) => {
  const { name, platform, university_focus, course_focus, target_city, start_date, end_date, budget, spend } = req.body;
  if (!name || !start_date) return res.status(400).json({ error: 'Campaign name and start date are required' });

  const id = 'camp-' + Date.now();
  db.prepare(`
    INSERT INTO campaigns (id, name, platform, university_focus, course_focus, target_city, start_date, end_date, budget, spend, is_active, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `).run(id, name, platform || 'Meta', university_focus || '', course_focus || '', target_city || '', start_date, end_date || null, budget || 0, spend || 0);

  res.status(201).json({ success: true, id });
});

// ==========================================
// 10. NOTIFICATIONS
// ==========================================
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const { counselorId } = req.query;
  let sql = 'SELECT * FROM notifications WHERE 1=1';
  const params: any[] = [];
  if (counselorId) {
    sql += ' AND (counselor_id = ? OR counselor_id IS NULL)';
    params.push(counselorId);
  }
  sql += ' ORDER BY created_at DESC LIMIT 50';
  const notifs = db.prepare(sql).all(...params);
  res.json(notifs);
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

apiRouter.put('/notifications/read-all', (req: Request, res: Response) => {
  db.prepare('UPDATE notifications SET is_read = 1').run();
  res.json({ success: true });
});

// ==========================================
// 11. INTEGRATIONS (META & WHATSAPP)
// ==========================================
apiRouter.get('/integrations', (req: Request, res: Response) => {
  const integrations = db.prepare('SELECT * FROM integrations').all();
  res.json(integrations);
});

apiRouter.put('/integrations/:id', (req: Request, res: Response) => {
  const { is_enabled, status, config } = req.body;
  db.prepare(`
    UPDATE integrations 
    SET is_enabled = COALESCE(?, is_enabled),
        status = COALESCE(?, status),
        config = COALESCE(?, config),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(is_enabled, status, typeof config === 'object' ? JSON.stringify(config) : config, req.params.id);

  logAudit({
    userName: req.body.performedBy || 'Admin',
    action: 'INTEGRATION_CONFIG_UPDATED',
    entity: 'integration',
    entityId: req.params.id,
    newValue: { status, is_enabled }
  });

  res.json({ success: true });
});

apiRouter.get('/integrations/logs', (req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM integration_logs ORDER BY created_at DESC LIMIT 100').all();
  res.json(logs);
});

apiRouter.get('/integrations/templates', (req: Request, res: Response) => {
  const templates = db.prepare('SELECT * FROM message_templates WHERE is_active = 1 ORDER BY category ASC').all();
  res.json(templates);
});

// Live Meta Webhook endpoints
apiRouter.get('/integrations/meta/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const verified = verifyMetaWebhook(mode, token, challenge);
  if (verified) {
    return res.status(200).send(verified);
  }
  res.status(403).send('Forbidden');
});

apiRouter.post('/integrations/meta/webhook', (req: Request, res: Response) => {
  try {
    const result = handleMetaLeadWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
});

// Simulator endpoint so user can test Meta Lead inflow right from UI!
apiRouter.post('/integrations/meta/test-webhook', (req: Request, res: Response) => {
  try {
    const sampleLead = {
      simulatedLead: {
        student_name: req.body.student_name || 'Bikram Thapa',
        phone: req.body.phone || '+977 9801' + Math.floor(100000 + Math.random() * 900000),
        email: req.body.email || `bikram.test.${Date.now()}@gmail.com`,
        city: req.body.city || 'Kathmandu',
        country: 'Nepal',
        preferred_course: req.body.preferred_course || 'B.Tech Computer Science & Engineering',
        preferred_university: req.body.preferred_university || 'SRM Institute of Science and Technology',
        facebook_lead_id: 'meta-test-' + Date.now(),
        lead_source: 'Meta Ads',
        campaign: 'Meta Nepal Admission Wave 2026',
        ad_set: 'Engineering Aspirants',
        ad: 'SRM Admissions 2026 Nepal',
        academic_qualification: '+2 Science',
        percentage_10th: 85.0,
        percentage_12th: 82.0
      }
    };

    const result = handleMetaLeadWebhook(sampleLead);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp outreach sender / test endpoint
apiRouter.post('/integrations/whatsapp/send', (req: Request, res: Response) => {
  try {
    const result = sendWhatsAppMessage(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Google Sheets Integration Endpoints
apiRouter.post('/integrations/google-sheets/webhook', (req: Request, res: Response) => {
  try {
    const result = handleGoogleSheetsLeadWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Google Sheets webhook processing failed' });
  }
});

apiRouter.post('/integrations/google-sheets/test-inbound', (req: Request, res: Response) => {
  try {
    const sampleRow = req.body.simulatedRow || {
      student_name: req.body.student_name || 'Rohan Maharjan',
      phone: req.body.phone || '+977 9811' + Math.floor(100000 + Math.random() * 900000),
      email: req.body.email || `rohan.sheets.${Date.now()}@gmail.com`,
      city: req.body.city || 'Kathmandu',
      preferred_course: req.body.preferred_course || 'B.Tech Computer Science & Engineering',
      preferred_university: req.body.preferred_university || 'SRM Institute of Science and Technology',
      academic_qualification: req.body.academic_qualification || '+2 Science',
      campaign: req.body.campaign || 'Kathmandu Education Fair 2026 - Sheet Response',
      row_number: req.body.row_number || 42
    };

    const result = handleGoogleSheetsLeadWebhook({ simulatedRow: sampleRow });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/integrations/google-sheets/test-export', (req: Request, res: Response) => {
  try {
    let leadId = req.body.leadId;
    if (!leadId) {
      const firstLead = db.prepare('SELECT id FROM leads WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 1').get() as any;
      if (!firstLead) {
        return res.status(404).json({ error: 'No leads available to export' });
      }
      leadId = firstLead.id;
    }

    const result = exportLeadToGoogleSheet(leadId, req.body.performedBy || 'Admin');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/integrations/google-sheets/apps-script-code', (req: Request, res: Response) => {
  const protocol = req.protocol;
  const host = req.get('host') || 'localhost:5001';
  const baseUrl = `${protocol}://${host}`;
  const script = getGoogleAppsScriptTemplate(baseUrl);
  res.json({
    script,
    webhookUrl: `${baseUrl}/api/integrations/google-sheets/webhook`,
    instructions: 'Copy and paste into Google Sheet > Extensions > Apps Script, then add an onFormSubmit or onEdit trigger.'
  });
});

// ==========================================
// GOOGLE SHEETS MULTI-SHEET MANAGEMENT & SYNC
// ==========================================

// List all connected Google Sheets & summary stats
apiRouter.get('/integrations/google-sheets/list', (req: Request, res: Response) => {
  try {
    const data = getAllGoogleSheetConnections();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Connect or add a new Google Sheet by sharing link
apiRouter.post('/integrations/google-sheets/connect-link', async (req: Request, res: Response) => {
  try {
    const { sheetUrl, name, sheetName, campaignTag, targetCity, sourceLabel, performedBy } = req.body;
    if (!sheetUrl) {
      return res.status(400).json({ error: 'Please provide a Google Sheet link or Spreadsheet ID.' });
    }

    const result = await addOrConnectGoogleSheet({
      name: name || 'Google Sheet Leads',
      sheetUrl,
      sheetName,
      campaignTag,
      targetCity,
      sourceLabel,
      performedBy: performedBy || 'Admin'
    });

    res.json({
      message: 'Google Sheet connected successfully!',
      ...result
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to connect to Google Sheet.' });
  }
});

// Sync / Ingest Leads from a specific Google Sheet by Connection ID
apiRouter.post('/integrations/google-sheets/:id/sync', async (req: Request, res: Response) => {
  try {
    const sheetId = req.params.id;
    const sheet = db.prepare('SELECT * FROM google_sheets_connections WHERE id = ?').get(sheetId) as any;
    if (!sheet) {
      return res.status(404).json({ error: 'Google Sheet connection not found: ' + sheetId });
    }

    const syncReport = await syncLiveGoogleSheetLeads(sheet.sheet_url, req.body.performedBy || 'Admin', {
      campaignTag: sheet.campaign_tag,
      targetCity: sheet.target_city,
      sourceLabel: sheet.source_label,
      connectionId: sheet.id
    });

    res.json(syncReport);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to sync leads from Google Sheet.' });
  }
});

// Preview live rows from a specific Google Sheet by Connection ID
apiRouter.post('/integrations/google-sheets/:id/preview', async (req: Request, res: Response) => {
  try {
    const sheetId = req.params.id;
    const sheet = db.prepare('SELECT * FROM google_sheets_connections WHERE id = ?').get(sheetId) as any;
    if (!sheet) {
      return res.status(404).json({ error: 'Google Sheet connection not found: ' + sheetId });
    }

    const liveData = await fetchLiveGoogleSheetData(sheet.sheet_url, sheet.sheet_name);
    res.json(liveData);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to preview Google Sheet.' });
  }
});

// Update an existing Google Sheet connection
apiRouter.put('/integrations/google-sheets/:id', (req: Request, res: Response) => {
  try {
    const updated = updateGoogleSheetConnection(req.params.id, req.body, req.body.performedBy || 'Admin');
    res.json({ success: true, sheet: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Disconnect / Delete a specific Google Sheet connection
apiRouter.delete('/integrations/google-sheets/:id', (req: Request, res: Response) => {
  try {
    const result = deleteGoogleSheetConnection(req.params.id, req.body.performedBy || 'Admin');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Sync ALL Active Connected Google Sheets in one click
apiRouter.post('/integrations/google-sheets/sync-all', async (req: Request, res: Response) => {
  try {
    const report = await syncAllActiveGoogleSheets(req.body.performedBy || 'Admin');
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to perform multi-sheet sync.' });
  }
});

// Legacy / Direct live sync endpoint
apiRouter.post('/integrations/google-sheets/sync-live', async (req: Request, res: Response) => {
  try {
    let sheetUrl = req.body.sheetUrl;
    if (sheetUrl) {
      const syncReport = await syncLiveGoogleSheetLeads(sheetUrl, req.body.performedBy || 'Admin');
      return res.json(syncReport);
    }

    // If no sheet URL provided, sync all active sheets
    const bulkReport = await syncAllActiveGoogleSheets(req.body.performedBy || 'Admin');
    res.json(bulkReport);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to sync leads from Google Sheet.' });
  }
});

// Disconnect standard Google Sheet integration
apiRouter.post('/integrations/google-sheets/disconnect', (req: Request, res: Response) => {
  try {
    const config = {
      spreadsheetUrl: '',
      spreadsheetId: '',
      gid: '0',
      sheetName: 'Leads 2026',
      syncDirection: 'TWO_WAY',
      autoExport: false
    };

    db.prepare(`
      UPDATE integrations
      SET is_enabled = 0,
          status = 'NOT CONNECTED',
          config = ?,
          updated_at = datetime('now')
      WHERE name = 'Google Sheets Sync' OR id = 'int-sheets'
    `).run(JSON.stringify(config));

    logAudit({
      userName: req.body.performedBy || 'Admin',
      action: 'GOOGLE_SHEETS_DISCONNECTED',
      entity: 'integration',
      entityId: 'int-sheets'
    });

    res.json({ success: true, message: 'Google Sheet disconnected successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 12. SETTINGS & AUDIT LOGS
// ==========================================
apiRouter.get('/settings', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string; description: string }[];
  const settingsObj: Record<string, string> = {};
  for (const r of rows) settingsObj[r.key] = r.value;
  res.json(settingsObj);
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const updates = req.body;
  const updateStmt = db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
  
  for (const [key, value] of Object.entries(updates)) {
    updateStmt.run(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  logAudit({
    userName: req.body.performedBy || 'Admin',
    action: 'SETTINGS_UPDATED',
    entity: 'settings',
    newValue: updates
  });

  res.json({ success: true });
});

apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  res.json(logs);
});

// ==========================================
// 13. GLOBAL SEARCH
// ==========================================
apiRouter.get('/search/global', (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || q.trim().length === 0) {
    return res.json({ leads: [], students: [], applications: [], universities: [], courses: [] });
  }

  const query = `%${q.trim()}%`;

  const leads = db.prepare(`
    SELECT id, lead_id, student_name, phone, email, preferred_course, preferred_university, lead_status
    FROM leads
    WHERE is_deleted = 0 AND (student_name LIKE ? OR phone LIKE ? OR email LIKE ? OR lead_id LIKE ? OR city LIKE ?)
    LIMIT 6
  `).all(query, query, query, query, query);

  const students = db.prepare(`
    SELECT id, student_id, student_name, phone, university, course
    FROM students
    WHERE student_name LIKE ? OR student_id LIKE ? OR phone LIKE ? OR email LIKE ?
    LIMIT 6
  `).all(query, query, query, query);

  const applications = db.prepare(`
    SELECT id, application_id, student_name, university_name, course_name, application_status
    FROM applications
    WHERE student_name LIKE ? OR application_id LIKE ? OR application_number LIKE ?
    LIMIT 6
  `).all(query, query, query);

  const universities = db.prepare(`
    SELECT id, name, city, state, country, university_type
    FROM universities
    WHERE name LIKE ? OR city LIKE ?
    LIMIT 5
  `).all(query, query);

  const courses = db.prepare(`
    SELECT id, university_name, course_name, degree_level
    FROM courses
    WHERE course_name LIKE ? OR university_name LIKE ?
    LIMIT 5
  `).all(query, query);

  res.json({
    leads,
    students,
    applications,
    universities,
    courses
  });
});

// ==========================================
// 14. REPORTS & KPIS
// ==========================================
apiRouter.get('/reports/dashboard-kpis', (req: Request, res: Response) => {
  const { startDate, endDate, counselorId, city, university, course, source, campaign } = req.query;
  const kpis = getDashboardKPIs({
    startDate: startDate as string,
    endDate: endDate as string,
    counselorId: counselorId as string,
    city: city as string,
    university: university as string,
    course: course as string,
    source: source as string,
    campaign: campaign as string
  });
  res.json(kpis);
});

// ==========================================
// 15. CSV EXPORT & IMPORT
// ==========================================
apiRouter.get('/export/:entity', (req: Request, res: Response) => {
  const entity = req.params.entity;

  if (entity === 'leads') {
    const leads = db.prepare('SELECT lead_id, student_name, phone, whatsapp_number, email, city, country, preferred_course, preferred_university, lead_status, lead_temperature, assigned_counselor_name, lead_source, created_at FROM leads WHERE is_deleted = 0').all();
    const csvHeader = 'Lead ID,Student Name,Phone,WhatsApp,Email,City,Country,Preferred Course,Preferred University,Status,Temperature,Counselor,Source,Created At\n';
    const csvRows = leads.map((l: any) => 
      `"${l.lead_id}","${l.student_name}","${l.phone}","${l.whatsapp_number}","${l.email}","${l.city}","${l.country}","${l.preferred_course}","${l.preferred_university}","${l.lead_status}","${l.lead_temperature}","${l.assigned_counselor_name || 'Unassigned'}","${l.lead_source}","${l.created_at}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="education_sansar_leads.csv"');
    return res.send(csvHeader + csvRows);
  }

  if (entity === 'students') {
    const students = db.prepare('SELECT student_id, student_name, phone, email, university, course, admission_date, fee_paid, counselor_name, city, country FROM students').all();
    const csvHeader = 'Student ID,Student Name,Phone,Email,University,Course,Admission Date,Fee Paid,Counselor,City,Country\n';
    const csvRows = students.map((s: any) => 
      `"${s.student_id}","${s.student_name}","${s.phone}","${s.email}","${s.university}","${s.course}","${s.admission_date}",${s.fee_paid},"${s.counselor_name || ''}","${s.city}","${s.country}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="education_sansar_students.csv"');
    return res.send(csvHeader + csvRows);
  }

  if (entity === 'applications') {
    const apps = db.prepare('SELECT application_id, student_name, university_name, course_name, application_date, application_status, application_fee, payment_status, counselor_name FROM applications').all();
    const csvHeader = 'Application ID,Student Name,University,Course,Application Date,Status,Fee,Payment Status,Counselor\n';
    const csvRows = apps.map((a: any) => 
      `"${a.application_id}","${a.student_name}","${a.university_name}","${a.course_name}","${a.application_date}","${a.application_status}",${a.application_fee},"${a.payment_status}","${a.counselor_name || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="education_sansar_applications.csv"');
    return res.send(csvHeader + csvRows);
  }

  res.status(400).json({ error: 'Unknown export entity' });
});

apiRouter.post('/import/leads', (req: Request, res: Response) => {
  const { leads, previewOnly, performedBy } = req.body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'No leads provided for import' });
  }

  const results: any[] = [];
  let validCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  for (const item of leads) {
    const cleanPhone = item.phone || item.Phone;
    const cleanName = item.name || item.student_name || item['Student Name'];
    const cleanEmail = item.email || item.Email;

    if (!cleanName || !cleanPhone) {
      results.push({
        name: cleanName || 'Unknown',
        phone: cleanPhone || '',
        status: 'ERROR',
        message: 'Name and Phone are mandatory'
      });
      errorCount++;
      continue;
    }

    // Duplicate check
    const dup = checkDuplicate({
      phone: cleanPhone,
      email: cleanEmail
    });

    if (dup.hasDuplicate) {
      results.push({
        name: cleanName,
        phone: cleanPhone,
        status: 'DUPLICATE',
        message: `Matches existing lead ${dup.duplicates[0].lead_id} (${dup.duplicates[0].student_name})`,
        existingLead: dup.duplicates[0]
      });
      duplicateCount++;
      continue;
    }

    results.push({
      name: cleanName,
      phone: cleanPhone,
      status: 'VALID',
      data: item
    });
    validCount++;
  }

  // If preview only, return preview report without saving
  if (previewOnly) {
    return res.json({
      preview: true,
      total: leads.length,
      validCount,
      duplicateCount,
      errorCount,
      results
    });
  }

  // Commit valid leads
  let createdCount = 0;
  for (const item of results) {
    if (item.status === 'VALID') {
      const d = item.data;
      createLead({
        student_name: d.name || d.student_name || d['Student Name'],
        phone: d.phone || d.Phone,
        email: d.email || d.Email || '',
        city: d.city || d.City || 'Kathmandu',
        preferred_course: d.course || d.preferred_course || d['Course'] || 'B.Tech CSE',
        preferred_university: d.university || d.preferred_university || d['University'] || 'SRM Institute of Science and Technology',
        lead_source: d.source || d.lead_source || d['Source'] || 'Referral',
        lead_status: 'New Lead'
      }, performedBy || 'CSV Import');
      createdCount++;
    }
  }

  res.json({
    success: true,
    total: leads.length,
    createdCount,
    duplicateCount,
    errorCount
  });
});
