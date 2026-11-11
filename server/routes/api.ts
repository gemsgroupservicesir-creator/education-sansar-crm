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
  syncAllActiveGoogleSheets,
  verifyMetaCredentials
} from '../services/integrationService.ts';
import { Lead, FollowUp, Application, Student, University, Course, Campaign, DocumentItem } from '../types/index.ts';

import { 
  isNeonEnabled, 
  sql,
  findUserInNeon, 
  persistUserToNeon, 
  persistCounselorToNeon, 
  persistLeadToNeon, 
  persistDeletedRecordToNeon, 
  deleteLeadFromNeon, 
  deleteCounselorAndUserFromNeon,
  deleteEmployeeFromNeon,
  deleteTransactionFromNeon,
  deleteInvoiceFromNeon,
  deleteStudentFromNeon,
  deleteApplicationFromNeon,
  deleteFollowupFromNeon,
  deleteUniversityFromNeon,
  deleteCourseFromNeon,
  deleteUniversityCourseFromNeon,
  deleteRoutingRuleFromNeon,
  deleteMessageTemplateFromNeon,
  persistUniversityCourseToNeon,
  persistUniversityToNeon,
  persistCourseToNeon,
  findGoogleSheetInNeon,
  getAllGoogleSheetsFromNeon 
} from '../db/neon.ts';

import { scrapeUniversityAndCourses } from '../services/universityScraperService.ts';

import {
  getRoutingRules,
  createRoutingRule,
  updateRoutingRule,
  deleteRoutingRule,
  distributeUnassignedLeads,
  simulateLeadRouting
} from '../services/leadDistributionEngine.ts';

import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAttendance,
  recordAttendance,
  getLeaves,
  applyLeave,
  updateLeaveStatus,
  getPayroll,
  generateMonthlyPayroll,
  markPayrollPaid
} from '../services/hrService.ts';

import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getInvoices,
  createInvoice,
  deleteInvoice,
  recordInvoicePayment,
  getFinanceOverview,
  getUniversityCommissionsSummary
} from '../services/financeService.ts';


import {
  getEmailTemplates,
  saveEmailTemplate,
  deleteEmailTemplate,
  previewEmailResolution,
  getTargetLeadsForBulkEmail,
  sendBulkEmailCampaign,
  getBulkEmailCampaigns,
  getBulkEmailFilterOptions
} from '../services/emailService.ts';

import {
  getAISettings,
  updateAISettings,
  testGeminiConnection,
  autoDispatchWelcomeOutreach,
  analyzeLeadAndScore,
  generateSalesPitch,
  handleSalesChat,
  getAIDashboardMetrics,
  resolveCounselorProfile
} from '../services/aiSalesService.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTH & ROLES
// ==========================================
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, username, identifier: rawId, password, role } = req.body || {};

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

    const identifier = (rawId || email || username || '').trim().toLowerCase();
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

    // 2b. If not in local SQLite, query server-side Neon PostgreSQL database directly
    if (!user && isNeonEnabled()) {
      const neonUser = await findUserInNeon(identifier);
      if (neonUser) {
        user = neonUser;
        try {
          db.prepare(`
            INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role
          `).run(user.id, user.name, user.email, user.password_hash, user.role, user.phone, user.avatar_url, user.is_active);
        } catch (e) {}
      }
    }

    // 3. Convenience fallbacks for common aliases & test accounts
    if (!user && (identifier === 'admin' || identifier === 'superadmin' || identifier.includes('admin@'))) {
      user = db.prepare("SELECT * FROM users WHERE (email = 'admin@gemsgroupservices.com' OR email = 'admin@educationsansar.com') AND is_active = 1").get() as any;
    }
    if (!user && identifier.includes('aarav')) {
      user = db.prepare("SELECT * FROM users WHERE (email = 'aarav@gemsgroupservices.com' OR email = 'aarav@educationsansar.com') AND is_active = 1").get() as any;
    }
    if (!user && identifier.includes('priya')) {
      user = db.prepare("SELECT * FROM users WHERE (email = 'priya@gemsgroupservices.com' OR email = 'priya@educationsansar.com') AND is_active = 1").get() as any;
    }
    if (!user && identifier.includes('sunil')) {
      user = db.prepare("SELECT * FROM users WHERE (email = 'sunil@gemsgroupservices.com' OR email = 'sunil@educationsansar.com') AND is_active = 1").get() as any;
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

// User Registration endpoint (stored permanently server-side on Neon PostgreSQL)
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'Counselor', phone } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email Address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone?.trim() || null;

    // Check duplicate in SQLite and Neon
    let existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (!existing && isNeonEnabled()) {
      const neonUser = await findUserInNeon(cleanEmail);
      if (neonUser) existing = neonUser;
    }
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const userId = 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    // 1. Insert into local SQLite
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(userId, cleanName, cleanEmail, password, role, cleanPhone, now, now);

    // 2. Persist to Neon PostgreSQL server-side
    if (isNeonEnabled()) {
      await persistUserToNeon({
        id: userId,
        name: cleanName,
        email: cleanEmail,
        password_hash: password,
        role,
        phone: cleanPhone,
        is_active: 1
      });
    }

    // 3. If role is Counselor or Telecaller, also create a counselor profile
    if (role === 'Counselor' || role === 'Telecaller') {
      const counselorId = 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const username = cleanEmail.split('@')[0];
      try {
        db.prepare(`
          INSERT INTO counselors (id, user_id, name, email, phone, specialization_country, assigned_cities, is_active, max_capacity, username, joining_date, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'Nepal & India', '[]', 1, 100, ?, ?, 'Active', ?, ?)
        `).run(counselorId, userId, cleanName, cleanEmail, cleanPhone || '+977 9800000000', username, now, now, now);

        if (isNeonEnabled()) {
          await persistCounselorToNeon({
            id: counselorId,
            user_id: userId,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone || '+977 9800000000',
            username,
            joining_date: now,
            status: 'Active',
            is_active: 1
          });
        }
      } catch (cErr: any) {
        console.warn('Counselor profile creation notice:', cErr.message);
      }
    }

    logAudit({
      userName: cleanName,
      action: 'USER_REGISTER',
      entity: 'user',
      entityId: userId,
      newValue: { role, email: cleanEmail }
    });

    const safeUser = { id: userId, name: cleanName, email: cleanEmail, role, phone: cleanPhone, is_active: 1, created_at: now };
    return res.status(201).json({
      success: true,
      message: 'Account created successfully in server-side Neon database!',
      user: safeUser,
      token: 'session-token-' + userId
    });
  } catch (err: any) {
    console.error('Registration Route Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create user account' });
  }
});

// Admin User creation endpoint
apiRouter.post('/users', async (req: Request, res: Response) => {
  // Delegate to registration handler
  const { name, email, password, role, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPhone = phone?.trim() || null;

  let existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
  if (!existing && isNeonEnabled()) {
    const neonUser = await findUserInNeon(cleanEmail);
    if (neonUser) existing = neonUser;
  }
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const userId = 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(userId, cleanName, cleanEmail, password, role || 'Counselor', cleanPhone, now, now);

  if (isNeonEnabled()) {
    await persistUserToNeon({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password_hash: password,
      role: role || 'Counselor',
      phone: cleanPhone,
      is_active: 1
    });
  }

  const safeUser = { id: userId, name: cleanName, email: cleanEmail, role: role || 'Counselor', phone: cleanPhone, is_active: 1 };
  res.status(201).json({ success: true, user: safeUser });
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

  const performedBy = req.body.performedBy || 'User';

  // Record tombstone suppression so Google Sheets sync or webhooks never resurrect this deleted lead
  const recordTombstone = (identifier: string | null | undefined) => {
    if (!identifier) return;
    const clean = String(identifier).trim();
    if (!clean) return;
    const tombId = 'DEL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9) + '-' + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by)
      VALUES (?, 'lead', ?, ?, ?, ?)
    `).run(tombId, lead.id, clean, JSON.stringify({ lead_id: lead.lead_id, student_name: lead.student_name }), performedBy);

    if (isNeonEnabled()) {
      persistDeletedRecordToNeon({
        id: tombId,
        entity_type: 'lead',
        entity_id: lead.id,
        identifier: clean,
        details: JSON.stringify({ lead_id: lead.lead_id, student_name: lead.student_name }),
        deleted_by: performedBy
      }).catch(e => console.warn('[Neon Tombstone] Deferred:', e.message));
    }
  };

  // Permanent Hard Delete with Cascade
  const deleteTx = db.transaction((id: string) => {
    if (lead.phone) {
      recordTombstone(lead.phone);
      const digits = lead.phone.replace(/[^0-9]/g, '');
      if (digits) recordTombstone(digits);
      if (digits.length >= 10) recordTombstone(digits.slice(-10));
    }
    if (lead.whatsapp_number && lead.whatsapp_number !== lead.phone) {
      recordTombstone(lead.whatsapp_number);
      const waDigits = lead.whatsapp_number.replace(/[^0-9]/g, '');
      if (waDigits) recordTombstone(waDigits);
      if (waDigits.length >= 10) recordTombstone(waDigits.slice(-10));
    }
    if (lead.email) {
      recordTombstone(lead.email.toLowerCase().trim());
    }
    if (lead.lead_id) {
      recordTombstone(lead.lead_id);
    }

    db.prepare('DELETE FROM students WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM followups WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM lead_activities WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM lead_status_history WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM lead_assignments WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM applications WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM documents WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM messages WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM campaign_leads WHERE lead_id = ?').run(id);
    db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  });
  deleteTx(req.params.id);

  if (isNeonEnabled()) {
    deleteLeadFromNeon(lead.id).catch(e => console.warn('[Neon Delete] Deferred:', e.message));
  }

  logAudit({
    userName: performedBy,
    action: 'LEAD_DELETED_PERMANENT',
    entity: 'lead',
    entityId: req.params.id,
    oldValue: { lead_id: lead.lead_id, student_name: lead.student_name }
  });

  res.json({ success: true, message: 'Lead deleted permanently' });
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
      COALESCE(u.role, 'Counselor') as role,
      u.permissions as permissions,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.is_deleted = 0) as total_leads_count,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status IN ('New Lead', 'Contacted', 'Counseling Scheduled', 'Interested', 'Application Started', 'Documents Pending') AND l.is_deleted = 0) as active_leads_count
    FROM counselors c
    LEFT JOIN users u ON (c.user_id = u.id OR LOWER(c.email) = LOWER(u.email))
    ORDER BY c.name ASC
  `).all();
  res.json(counselors);
});

apiRouter.get('/counselors/:id', (req: Request, res: Response) => {
  const counselor = db.prepare(`
    SELECT c.*,
      COALESCE(u.role, 'Counselor') as role,
      u.permissions as permissions,
      u.avatar_url,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.is_deleted = 0) as total_leads_count,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status IN ('New Lead', 'Contacted', 'Counseling Scheduled', 'Interested', 'Application Started', 'Documents Pending') AND l.is_deleted = 0) as active_leads_count,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status IN ('Admitted', 'Visa Approved', 'Fee Paid') AND l.is_deleted = 0) as converted_leads_count,
      (SELECT count(*) FROM followups f WHERE f.counselor_id = c.id AND f.status = 'Pending') as pending_followups_count
    FROM counselors c
    LEFT JOIN users u ON (c.user_id = u.id OR LOWER(c.email) = LOWER(u.email))
    WHERE c.id = ?
  `).get(req.params.id) as any;

  if (!counselor) return res.status(404).json({ error: 'Staff member not found' });

  const recentLeads = db.prepare(`
    SELECT id, lead_id, student_name, preferred_course, preferred_university, lead_status, lead_temperature, created_at
    FROM leads
    WHERE assigned_counselor_id = ? AND is_deleted = 0
    ORDER BY created_at DESC LIMIT 10
  `).all(req.params.id);

  let assignedCities: string[] = [];
  let specCourses: string[] = [];
  let specUnis: string[] = [];
  let permissions: string[] = [];
  try { assignedCities = JSON.parse(counselor.assigned_cities || '[]'); } catch { assignedCities = []; }
  try { specCourses = JSON.parse(counselor.specialization_courses || '[]'); } catch { specCourses = []; }
  try { specUnis = JSON.parse(counselor.specialization_universities || '[]'); } catch { specUnis = []; }
  try { permissions = JSON.parse(counselor.permissions || '[]'); } catch { permissions = []; }

  res.json({
    ...counselor,
    assigned_cities: assignedCities,
    specialization_courses: specCourses,
    specialization_universities: specUnis,
    permissions,
    recent_leads: recentLeads
  });
});

apiRouter.put('/counselors/:id/toggle-active', async (req: Request, res: Response) => {
  const c = db.prepare('SELECT is_active, name, email, user_id FROM counselors WHERE id = ?').get(req.params.id) as any;
  if (!c) return res.status(404).json({ error: 'Counselor not found' });

  const newActive = c.is_active === 1 ? 0 : 1;
  db.prepare("UPDATE counselors SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(newActive, req.params.id);
  db.prepare("UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE email = ? OR id = ?").run(newActive, c.email, c.user_id);

  if (isNeonEnabled()) {
    const updated = db.prepare('SELECT * FROM counselors WHERE id = ?').get(req.params.id) as any;
    if (updated) await persistCounselorToNeon(updated);
  }

  logAudit({
    userName: req.body.performedBy || 'Admin',
    action: newActive ? 'COUNSELOR_ACTIVATED' : 'COUNSELOR_DEACTIVATED',
    entity: 'counselor',
    entityId: req.params.id,
    newValue: { is_active: newActive, name: c.name }
  });

  res.json({ success: true, is_active: newActive });
});

apiRouter.post('/counselors', async (req: Request, res: Response) => {
  try {
    const { 
      name, email, phone, specialization_country, assigned_cities, 
      max_capacity, password, username, role, permissions,
      specialization_courses, specialization_universities, daily_lead_quota,
      designation, department, employee_code, alternate_phone, work_location, notes
    } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone number are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const userRole = role || 'Counselor';
    const permsJson = JSON.stringify(permissions || []);
    const specCoursesJson = JSON.stringify(specialization_courses || []);
    const specUnisJson = JSON.stringify(specialization_universities || []);

    // Check duplicate in SQLite or Neon
    let existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (!existingUser && isNeonEnabled()) {
      existingUser = await findUserInNeon(cleanEmail);
    }
    if (existingUser) {
      return res.status(400).json({ error: 'A staff or login account with this email address already exists' });
    }

    const cId = 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const uId = 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const pwd = password && password.trim().length >= 4 ? password.trim() : 'counselor123';
    const uname = username ? username.trim() : cleanEmail.split('@')[0];
    const now = new Date().toISOString();

    // 1. Insert into users in SQLite with selected role & permissions FIRST
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active, permissions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(uId, cleanName, cleanEmail, pwd, userRole, cleanPhone, permsJson, now, now);

    // 2. Insert into counselors in SQLite
    db.prepare(`
      INSERT INTO counselors (
        id, user_id, name, username, email, phone, specialization_country, assigned_cities,
        max_capacity, is_active, status, joining_date, specialization_courses,
        specialization_universities, daily_lead_quota, designation, department,
        employee_code, alternate_phone, work_location, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cId,
      uId,
      cleanName,
      uname,
      cleanEmail,
      cleanPhone,
      specialization_country || 'Nepal & India',
      JSON.stringify(assigned_cities || []),
      max_capacity || 100,
      now,
      specCoursesJson,
      specUnisJson,
      daily_lead_quota || 25,
      designation || (userRole === 'Counselor' ? 'Senior Admission Counselor' : userRole),
      department || 'Admissions',
      employee_code || ('EMP-' + Math.floor(1000 + Math.random() * 9000)),
      alternate_phone || null,
      work_location || 'Kathmandu HQ',
      notes || null,
      now,
      now
    );

    // 3. Persist to Neon PostgreSQL server-side
    if (isNeonEnabled()) {
      await persistUserToNeon({
        id: uId,
        name: cleanName,
        email: cleanEmail,
        password_hash: pwd,
        role: userRole,
        phone: cleanPhone,
        is_active: 1
      });

      await persistCounselorToNeon({
        id: cId,
        user_id: uId,
        name: cleanName,
        username: uname,
        email: cleanEmail,
        phone: cleanPhone,
        specialization_country: specialization_country || 'Nepal & India',
        assigned_cities: JSON.stringify(assigned_cities || []),
        max_capacity: max_capacity || 100,
        is_active: 1,
        status: 'Active',
        joining_date: now
      });
    }

    logAudit({
      userName: req.body.performedBy || 'Admin',
      action: 'COUNSELOR_CREATED',
      entity: 'counselor',
      entityId: cId,
      newValue: { name: cleanName, email: cleanEmail, phone: cleanPhone, role: userRole, permissions }
    });

    res.status(201).json({ success: true, id: cId, user_id: uId, role: userRole });
  } catch (err: any) {
    console.error('Error creating staff/counselor:', err);
    res.status(500).json({ error: err.message || 'Failed to create staff member' });
  }
});

apiRouter.put('/counselors/:id', async (req: Request, res: Response) => {
  try {
    const { 
      name, email, phone, specialization_country, assigned_cities, max_capacity, 
      is_active, status, role, permissions, specialization_courses, 
      specialization_universities, daily_lead_quota,
      designation, department, employee_code, alternate_phone, work_location, notes
    } = req.body;
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
          specialization_courses = COALESCE(?, specialization_courses),
          specialization_universities = COALESCE(?, specialization_universities),
          daily_lead_quota = COALESCE(?, daily_lead_quota),
          designation = COALESCE(?, designation),
          department = COALESCE(?, department),
          employee_code = COALESCE(?, employee_code),
          alternate_phone = COALESCE(?, alternate_phone),
          work_location = COALESCE(?, work_location),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name, 
      email, 
      phone, 
      specialization_country, 
      assigned_cities ? JSON.stringify(assigned_cities) : null, 
      max_capacity, 
      activeVal, 
      statusVal,
      specialization_courses ? JSON.stringify(specialization_courses) : null,
      specialization_universities ? JSON.stringify(specialization_universities) : null,
      daily_lead_quota || null,
      designation || null,
      department || null,
      employee_code || null,
      alternate_phone || null,
      work_location || null,
      notes || null,
      req.params.id
    );

    if (email || name || phone || is_active !== undefined || role || permissions !== undefined) {
      db.prepare(`
        UPDATE users
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone),
            role = COALESCE(?, role),
            permissions = COALESCE(?, permissions),
            is_active = COALESCE(?, is_active),
            updated_at = datetime('now')
        WHERE email = ? OR id = ?
      `).run(
        name, 
        email, 
        phone, 
        role || null, 
        permissions !== undefined ? JSON.stringify(permissions) : null,
        activeVal, 
        counselor.email, 
        counselor.user_id
      );
    }

    if (isNeonEnabled()) {
      const updatedCounselor = db.prepare('SELECT * FROM counselors WHERE id = ?').get(req.params.id) as any;
      if (updatedCounselor) {
        await persistCounselorToNeon(updatedCounselor);
      }
      const updatedUser = db.prepare('SELECT * FROM users WHERE email = ? OR id = ?').get(counselor.email, counselor.user_id) as any;
      if (updatedUser) {
        await persistUserToNeon(updatedUser);
      }
    }

    logAudit({
      userName: req.body.performedBy || 'Admin',
      action: 'COUNSELOR_UPDATED',
      entity: 'counselor',
      entityId: req.params.id,
      newValue: { name, email, phone, status: statusVal, role, permissions }
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating counselor:', err);
    res.status(500).json({ error: err.message || 'Failed to update counselor' });
  }
});

apiRouter.delete('/counselors/:id', async (req: Request, res: Response) => {
  try {
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

    // Clean referencing records to avoid foreign key errors
    db.prepare('DELETE FROM lead_assignments WHERE new_counselor_id = ? OR previous_counselor_id = ?').run(req.params.id, req.params.id);
    db.prepare('DELETE FROM notifications WHERE counselor_id = ?').run(req.params.id);
    db.prepare('UPDATE students SET counselor_id = NULL, counselor_name = NULL WHERE counselor_id = ?').run(req.params.id);
    db.prepare('UPDATE applications SET counselor_id = NULL, counselor_name = NULL WHERE counselor_id = ?').run(req.params.id);
    db.prepare('UPDATE followups SET counselor_id = NULL WHERE counselor_id = ?').run(req.params.id);
    db.prepare('DELETE FROM hr_employees WHERE counselor_id = ? OR user_id = ?').run(req.params.id, counselor.user_id);
    db.prepare('DELETE FROM lead_routing_rules WHERE counselor_id = ?').run(req.params.id);

    // Delete both user login and counselor profile from local SQLite
    db.prepare('DELETE FROM users WHERE email = ? OR id = ?').run(counselor.email, counselor.user_id);
    db.prepare('DELETE FROM counselors WHERE id = ?').run(req.params.id);

    // Delete permanently from Neon PostgreSQL server-side
    if (isNeonEnabled()) {
      await deleteCounselorAndUserFromNeon(req.params.id, counselor.email, counselor.user_id);
    }

    const tombId = 'DEL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    db.prepare('INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
      tombId, 'counselor', req.params.id, counselor.email, JSON.stringify({ name: counselor.name }), req.body.performedBy || 'Admin'
    );

    if (isNeonEnabled()) {
      await persistDeletedRecordToNeon({
        id: tombId,
        entity_type: 'counselor',
        entity_id: req.params.id,
        identifier: counselor.email,
        details: JSON.stringify({ name: counselor.name }),
        deleted_by: req.body.performedBy || 'Admin'
      });
    }

    logAudit({
      userName: req.body.performedBy || 'Admin',
      action: 'COUNSELOR_DELETED',
      entity: 'counselor',
      entityId: req.params.id,
      oldValue: { name: counselor.name, email: counselor.email }
    });

    res.json({ success: true, message: `Staff member ${counselor.name} and login account deleted successfully.` });
  } catch (err: any) {
    console.error('Error deleting counselor:', err);
    res.status(500).json({ error: err.message || 'Failed to delete staff member' });
  }
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

apiRouter.delete('/followups/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM followups WHERE id = ?').run(req.params.id);
  const tombId = 'DEL-FLW-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  db.prepare('INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
    tombId, 'followup', req.params.id, req.params.id, null, 'User'
  );
  if (isNeonEnabled()) {
    deleteFollowupFromNeon(req.params.id).catch(e => console.warn('[Neon Delete] Followup defer:', e.message));
  }
  res.json({ success: true, message: 'Follow-up deleted permanently.' });
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

apiRouter.delete('/applications/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  const tombId = 'DEL-APP-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  db.prepare('INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
    tombId, 'application', req.params.id, req.params.id, null, 'User'
  );
  if (isNeonEnabled()) {
    deleteApplicationFromNeon(req.params.id).catch(e => console.warn('[Neon Delete] Application defer:', e.message));
  }
  res.json({ success: true, message: 'Application deleted permanently.' });
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

apiRouter.delete('/students/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  const tombId = 'DEL-STU-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  db.prepare('INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
    tombId, 'student', req.params.id, req.params.id, null, 'User'
  );
  if (isNeonEnabled()) {
    deleteStudentFromNeon(req.params.id).catch(e => console.warn('[Neon Delete] Student defer:', e.message));
  }
  res.json({ success: true, message: 'Student record deleted permanently.' });
});

// ==========================================
// 7. UNIVERSITIES & COURSES
// ==========================================
// ==========================================
// 7. UNIVERSITIES & COURSES
// ==========================================
apiRouter.get('/universities', async (req: Request, res: Response) => {
  if (isNeonEnabled() && sql) {
    try {
      const neonUnis = await sql.query(`
        SELECT u.*,
          (SELECT count(*) FROM university_courses uc WHERE uc.university_id = u.id) as fee_structures_count,
          (SELECT count(*) FROM courses c WHERE c.university_id = u.id) as legacy_courses_count,
          (SELECT count(*) FROM applications a WHERE a.university_id = u.id) as applications_count
        FROM universities u
        ORDER BY u.name ASC
      `);
      if (neonUnis && neonUnis.length > 0) {
        return res.json(neonUnis);
      }
    } catch (e: any) {
      console.warn('[Neon Universities] Falling back to SQLite:', e.message);
    }
  }

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

// Fetch university & courses directly from official university website link
apiRouter.post('/universities/fetch-from-website', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Please enter a valid website link (e.g. https://www.sharda.ac.in)' });
    }
    const result = await scrapeUniversityAndCourses(url);
    res.json({ success: true, university: result, courses: result.courses, source_url: url });
  } catch (err: any) {
    console.error('[Fetch University Error]:', err.message);
    res.status(500).json({ error: err.message || 'Failed to extract university details from the provided website link.' });
  }
});

// Import university along with selected courses and fee structures in one go
apiRouter.post('/universities/import-with-courses', async (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to add universities.' });
  }

  try {
    const { university, selectedCourses } = req.body;
    if (!university || !university.name) {
      return res.status(400).json({ error: 'University name is required.' });
    }

    // 1. Check if university already exists
    let existingUni = db.prepare('SELECT * FROM universities WHERE name = ? COLLATE NOCASE').get(university.name) as any;
    let uniId = existingUni ? existingUni.id : ('uni-' + Date.now());

    if (!existingUni) {
      db.prepare(`
        INSERT INTO universities (
          id, name, short_name, campus, city, state, country, university_type,
          accreditation, ranking, website, contact, description, status, is_active, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
      `).run(
        uniId,
        university.name,
        university.short_name || '',
        university.campus || '',
        university.city || 'Greater Noida',
        university.state || 'Uttar Pradesh',
        university.country || 'India',
        university.university_type || 'Private',
        university.accreditation || '',
        university.ranking || '',
        university.website || '',
        university.contact || '',
        university.description || '',
        university.status || 'Active'
      );
    } else {
      // Update with new information
      db.prepare(`
        UPDATE universities 
        SET short_name = COALESCE(NULLIF(?, ''), short_name),
            campus = COALESCE(NULLIF(?, ''), campus),
            city = COALESCE(NULLIF(?, ''), city),
            state = COALESCE(NULLIF(?, ''), state),
            country = COALESCE(NULLIF(?, ''), country),
            university_type = COALESCE(NULLIF(?, ''), university_type),
            accreditation = COALESCE(NULLIF(?, ''), accreditation),
            ranking = COALESCE(NULLIF(?, ''), ranking),
            website = COALESCE(NULLIF(?, ''), website),
            contact = COALESCE(NULLIF(?, ''), contact),
            description = COALESCE(NULLIF(?, ''), description),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(
        university.short_name || '',
        university.campus || '',
        university.city || '',
        university.state || '',
        university.country || '',
        university.university_type || '',
        university.accreditation || '',
        university.ranking || '',
        university.website || '',
        university.contact || '',
        university.description || '',
        uniId
      );
    }

    const savedUni = db.prepare('SELECT * FROM universities WHERE id = ?').get(uniId) as any;
    if (isNeonEnabled() && savedUni) {
      persistUniversityToNeon(savedUni).catch(e => console.warn('[Neon Sync] University failed:', e.message));
    }

    // 2. Import selected courses
    let coursesCreated = 0;
    let feesCreated = 0;

    if (Array.isArray(selectedCourses) && selectedCourses.length > 0) {
      for (const crs of selectedCourses) {
        if (!crs.course_name) continue;

        let existingCourse = db.prepare(`
          SELECT * FROM courses 
          WHERE (university_id = ? OR university_name = ?) 
            AND course_name = ? COLLATE NOCASE
        `).get(uniId, university.name, crs.course_name) as any;

        let courseId = existingCourse ? existingCourse.id : ('crs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));

        if (!existingCourse) {
          db.prepare(`
            INSERT INTO courses (
              id, university_id, university_name, course_name, short_name, course_level, stream,
              degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info,
              intake, application_deadline, description, is_active, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
          `).run(
            courseId,
            uniId,
            university.name,
            crs.course_name,
            crs.short_name || '',
            crs.course_level || 'UG',
            crs.stream || 'General',
            crs.degree_level || 'Undergraduate',
            crs.duration || '4 Years',
            crs.eligibility || '',
            crs.entrance_requirement || '',
            crs.fees_range || '',
            crs.scholarship_info || '',
            'Fall 2026',
            null,
            crs.description || ''
          );
          coursesCreated++;
        }

        const savedCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as any;
        if (isNeonEnabled() && savedCourse) {
          persistCourseToNeon(savedCourse).catch(e => console.warn('[Neon Sync] Course failed:', e.message));
        }

        // 3. Create or update fee structure in university_courses
        const tuitionFee = typeof crs.tuition_fee_per_year === 'number' ? crs.tuition_fee_per_year : 0;
        const hostelFee = typeof crs.hostel_fee_per_year === 'number' ? crs.hostel_fee_per_year : 0;
        const totalFee = tuitionFee + hostelFee;

        let existingFee = db.prepare(`
          SELECT * FROM university_courses 
          WHERE university_id = ? AND course_id = ?
        `).get(uniId, courseId) as any;

        const ucId = existingFee ? existingFee.id : ('uc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));

        if (!existingFee) {
          db.prepare(`
            INSERT INTO university_courses (
              id, university_id, course_id, tuition_fee_per_year, hostel_fee_per_year,
              one_time_fee, other_charges, total_first_year_fee, total_full_course_fee,
              currency, eligibility_notes, scholarship_available, scholarship_details,
              application_deadline, admission_process, remarks, is_active,
              tuition_fee, hostel_fee, total_fee, duration, eligibility
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
          `).run(
            ucId,
            uniId,
            courseId,
            tuitionFee,
            hostelFee,
            0,
            0,
            totalFee,
            totalFee * (crs.duration?.includes('2') ? 2 : (crs.duration?.includes('3') ? 3 : (crs.duration?.includes('5') ? 5 : 4))),
            'INR',
            crs.eligibility || '',
            crs.scholarship_info ? 1 : 0,
            crs.scholarship_info || '',
            null,
            'Direct Merit / Counseling',
            'Imported via University Website Fetcher',
            tuitionFee,
            hostelFee,
            totalFee,
            crs.duration || '4 Years',
            crs.eligibility || ''
          );
          feesCreated++;
        }

        const savedUC = db.prepare('SELECT * FROM university_courses WHERE id = ?').get(ucId) as any;
        if (isNeonEnabled() && savedUC) {
          persistUniversityCourseToNeon(savedUC).catch(e => console.warn('[Neon Sync] UC failed:', e.message));
        }
      }
    }

    logAudit({
      user_id: 'SYSTEM',
      user_name: 'Admin',
      action: 'IMPORT_UNIVERSITY_WEBSITE',
      module: 'Universities',
      entity_id: uniId,
      entity_name: university.name,
      new_values: { courses_imported: coursesCreated, fees_imported: feesCreated, website: university.website }
    });

    res.json({
      success: true,
      university_id: uniId,
      university_name: university.name,
      courses_created: coursesCreated,
      fees_created: feesCreated
    });
  } catch (err: any) {
    console.error('[Import University Error]:', err.message);
    res.status(500).json({ error: err.message || 'Failed to import university and courses.' });
  }
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

  const tombId = 'DEL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
    tombId, 'university', req.params.id, req.params.id, null, 'User'
  );

  if (isNeonEnabled()) {
    deleteUniversityFromNeon(req.params.id).catch(e => console.warn('[Neon Delete] University defer:', e.message));
  }

  res.json({ success: true });
});

apiRouter.get('/courses', async (req: Request, res: Response) => {
  const { university_id, stream, course_level, search } = req.query;

  if (isNeonEnabled() && sql) {
    try {
      let neonSql = 'SELECT * FROM courses WHERE 1=1';
      const neonParams: any[] = [];
      let pIdx = 1;
      if (university_id) {
        neonSql += ` AND university_id = $${pIdx++}`;
        neonParams.push(university_id);
      }
      if (stream) {
        neonSql += ` AND stream = $${pIdx++}`;
        neonParams.push(stream);
      }
      if (course_level) {
        neonSql += ` AND course_level = $${pIdx++}`;
        neonParams.push(course_level);
      }
      if (search) {
        neonSql += ` AND (course_name ILIKE $${pIdx} OR stream ILIKE $${pIdx} OR short_name ILIKE $${pIdx} OR university_name ILIKE $${pIdx})`;
        neonParams.push(`%${search}%`);
        pIdx++;
      }
      neonSql += ' ORDER BY course_name ASC LIMIT 1000';
      const neonCourses = await sql.query(neonSql, neonParams);
      if (neonCourses && neonCourses.length > 0) {
        return res.json(neonCourses);
      }
    } catch (e: any) {
      console.warn('[Neon Courses] Falling back to SQLite:', e.message);
    }
  }

  let sqlQuery = 'SELECT * FROM courses WHERE 1=1';
  const params: any[] = [];
  if (university_id) {
    sqlQuery += ' AND university_id = ?';
    params.push(university_id);
  }
  if (stream) {
    sqlQuery += ' AND stream = ?';
    params.push(stream);
  }
  if (course_level) {
    sqlQuery += ' AND course_level = ?';
    params.push(course_level);
  }
  if (search) {
    sqlQuery += ' AND (course_name LIKE ? OR stream LIKE ? OR short_name LIKE ? OR university_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  sqlQuery += ' ORDER BY course_name ASC LIMIT 1000';
  const courses = db.prepare(sqlQuery).all(...params);
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

  const tombId = 'DEL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
    tombId, 'course', req.params.id, req.params.id, null, 'User'
  );

  if (isNeonEnabled()) {
    deleteCourseFromNeon(req.params.id).catch(e => console.warn('[Neon Delete] Course defer:', e.message));
  }

  res.json({ success: true });
});

// Fetch course details & catalog from website URL
apiRouter.post('/courses/fetch-from-website', async (req: Request, res: Response) => {
  try {
    const { url, university_id, university_name } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Please enter a valid website link (e.g. https://chandigarhuniversity.ac.in)' });
    }
    const result = await scrapeUniversityAndCourses(url);
    res.json({
      success: true,
      source_url: url,
      detected_university: {
        name: result.name,
        short_name: result.short_name,
        city: result.city,
        state: result.state,
        website: result.website
      },
      courses: result.courses
    });
  } catch (err: any) {
    console.error('[Fetch Courses Error]:', err.message);
    res.status(500).json({ error: err.message || 'Failed to extract courses from the provided link.' });
  }
});

// Batch import courses (with optional university linkage and fee structures)
apiRouter.post('/courses/batch-import', async (req: Request, res: Response) => {
  const userRole = (req.headers['x-user-role'] as string) || '';
  if (userRole.toLowerCase() === 'counselor') {
    return res.status(403).json({ error: 'Counselors do not have permission to add courses.' });
  }

  try {
    const { university_id, university_name, courses } = req.body;
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: 'No courses provided to import.' });
    }

    let uniId = university_id || null;
    let uniName = university_name || 'Multiple Universities';

    // If university_id provided, fetch official name if not passed
    if (uniId && (!uniName || uniName === 'Multiple Universities')) {
      const u = db.prepare('SELECT id, name FROM universities WHERE id = ?').get(uniId) as any;
      if (u) {
        uniName = u.name;
      }
    }

    let coursesCreated = 0;
    let feesCreated = 0;

    for (const crs of courses) {
      if (!crs.course_name) continue;

      let existingCourse = db.prepare(`
        SELECT * FROM courses 
        WHERE (university_id = ? OR university_name = ?) 
          AND course_name = ? COLLATE NOCASE
      `).get(uniId, uniName, crs.course_name) as any;

      let courseId = existingCourse ? existingCourse.id : ('crs-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));

      if (!existingCourse) {
        db.prepare(`
          INSERT INTO courses (
            id, university_id, university_name, course_name, short_name, course_level, stream,
            degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info,
            intake, application_deadline, description, is_active, is_demo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
        `).run(
          courseId,
          uniId,
          uniName,
          crs.course_name,
          crs.short_name || '',
          crs.course_level || 'UG',
          crs.stream || 'General',
          crs.degree_level || 'Undergraduate',
          crs.duration || '4 Years',
          crs.eligibility || '',
          crs.entrance_requirement || '',
          crs.fees_range || '',
          crs.scholarship_info || '',
          'Fall 2026',
          null,
          crs.description || ''
        );
        coursesCreated++;
      }

      const savedCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as any;
      if (isNeonEnabled() && savedCourse) {
        persistCourseToNeon(savedCourse).catch(e => console.warn('[Neon Sync] Course failed:', e.message));
      }

      // If linked to a university, create fee record in university_courses as well
      if (uniId) {
        const tuitionFee = typeof crs.tuition_fee_per_year === 'number' ? crs.tuition_fee_per_year : 0;
        const hostelFee = typeof crs.hostel_fee_per_year === 'number' ? crs.hostel_fee_per_year : 0;
        const totalFee = tuitionFee + hostelFee;

        let existingFee = db.prepare(`
          SELECT * FROM university_courses 
          WHERE university_id = ? AND course_id = ?
        `).get(uniId, courseId) as any;

        const ucId = existingFee ? existingFee.id : ('uc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));

        if (!existingFee) {
          db.prepare(`
            INSERT INTO university_courses (
              id, university_id, course_id, tuition_fee_per_year, hostel_fee_per_year,
              one_time_fee, other_charges, total_first_year_fee, total_full_course_fee,
              currency, eligibility_notes, scholarship_available, scholarship_details,
              application_deadline, admission_process, remarks, is_active,
              tuition_fee, hostel_fee, total_fee, duration, eligibility
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
          `).run(
            ucId,
            uniId,
            courseId,
            tuitionFee,
            hostelFee,
            0,
            0,
            totalFee,
            totalFee * (crs.duration?.includes('2') ? 2 : (crs.duration?.includes('3') ? 3 : (crs.duration?.includes('5') ? 5 : 4))),
            'INR',
            crs.eligibility || '',
            crs.scholarship_info ? 1 : 0,
            crs.scholarship_info || '',
            null,
            'Direct Merit / Counseling',
            'Imported via Website Courses Fetcher',
            tuitionFee,
            hostelFee,
            totalFee,
            crs.duration || '4 Years',
            crs.eligibility || ''
          );
          feesCreated++;
        }

        const savedUC = db.prepare('SELECT * FROM university_courses WHERE id = ?').get(ucId) as any;
        if (isNeonEnabled() && savedUC) {
          persistUniversityCourseToNeon(savedUC).catch(e => console.warn('[Neon Sync] UC failed:', e.message));
        }
      }
    }

    logAudit({
      user_id: 'SYSTEM',
      user_name: 'Admin',
      action: 'BATCH_IMPORT_COURSES',
      module: 'Courses',
      entity_id: uniId || 'GLOBAL',
      entity_name: uniName,
      new_values: { courses_imported: coursesCreated, fees_imported: feesCreated }
    });

    res.json({
      success: true,
      courses_created: coursesCreated,
      fees_created: feesCreated,
      total_processed: courses.length
    });
  } catch (err: any) {
    console.error('[Batch Import Courses Error]:', err.message);
    res.status(500).json({ error: err.message || 'Failed to batch import courses.' });
  }
});

// ==========================================
// 7.1 UNIVERSITY COURSES & FEE DATABASE (SECTION 7)
// ==========================================
apiRouter.get('/university-courses', async (req: Request, res: Response) => {
  const { search, university_id, course_id, stream, course_level, max_fee, city, state } = req.query;

  if (isNeonEnabled() && sql) {
    try {
      let neonSql = `
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
      const neonParams: any[] = [];
      let pIdx = 1;

      if (search) {
        neonSql += ` AND (u.name ILIKE $${pIdx} OR c.course_name ILIKE $${pIdx} OR u.city ILIKE $${pIdx} OR c.stream ILIKE $${pIdx} OR u.short_name ILIKE $${pIdx})`;
        neonParams.push(`%${search}%`);
        pIdx++;
      }
      if (university_id) {
        neonSql += ` AND uc.university_id = $${pIdx++}`;
        neonParams.push(university_id);
      }
      if (course_id) {
        neonSql += ` AND uc.course_id = $${pIdx++}`;
        neonParams.push(course_id);
      }
      if (stream) {
        neonSql += ` AND c.stream = $${pIdx++}`;
        neonParams.push(stream);
      }
      if (course_level) {
        neonSql += ` AND c.course_level = $${pIdx++}`;
        neonParams.push(course_level);
      }
      if (city) {
        neonSql += ` AND u.city ILIKE $${pIdx++}`;
        neonParams.push(`%${city}%`);
      }
      if (state) {
        neonSql += ` AND u.state ILIKE $${pIdx++}`;
        neonParams.push(`%${state}%`);
      }
      if (max_fee) {
        const feeNum = parseFloat(max_fee as string);
        if (!isNaN(feeNum)) {
          neonSql += ` AND (uc.tuition_fee_per_year <= $${pIdx++} OR uc.total_first_year_fee <= $${pIdx++})`;
          neonParams.push(feeNum, feeNum);
        }
      }
      neonSql += ` ORDER BY c.course_name ASC, uc.total_first_year_fee ASC LIMIT 500`;
      const neonResults = await sql.query(neonSql, neonParams);
      if (neonResults && neonResults.length > 0) {
        return res.json(neonResults);
      }
    } catch (e: any) {
      console.warn('[Neon University Courses] Falling back to SQLite:', e.message);
    }
  }

  let sqliteQuery = `
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
    sqliteQuery += ` AND (u.name LIKE ? OR c.course_name LIKE ? OR u.city LIKE ? OR c.stream LIKE ? OR u.short_name LIKE ?)`;
    params.push(s, s, s, s, s);
  }
  if (university_id) {
    sqliteQuery += ` AND uc.university_id = ?`;
    params.push(university_id);
  }
  if (course_id) {
    sqliteQuery += ` AND uc.course_id = ?`;
    params.push(course_id);
  }
  if (stream) {
    sqliteQuery += ` AND c.stream = ?`;
    params.push(stream);
  }
  if (course_level) {
    sqliteQuery += ` AND c.course_level = ?`;
    params.push(course_level);
  }
  if (city) {
    sqliteQuery += ` AND u.city LIKE ?`;
    params.push(`%${city}%`);
  }
  if (state) {
    sqliteQuery += ` AND u.state LIKE ?`;
    params.push(`%${state}%`);
  }
  if (max_fee) {
    const feeNum = parseFloat(max_fee as string);
    if (!isNaN(feeNum)) {
      sqliteQuery += ` AND (uc.tuition_fee_per_year <= ? OR uc.total_first_year_fee <= ?)`;
      params.push(feeNum, feeNum);
    }
  }
  sqliteQuery += ` ORDER BY c.course_name ASC, uc.total_first_year_fee ASC LIMIT 500`;
  const results = db.prepare(sqliteQuery).all(...params);
  res.json(results);
});

apiRouter.get('/university-courses/compare', (req: Request, res: Response) => {
  const ids = req.query.ids as string;
  if (!ids) return res.json([]);
  const idList = ids.split(',').map(s => s.trim()).filter(Boolean);
  if (idList.length === 0) return res.json([]);

  const placeholders = idList.map(() => '?').join(',');
  const compareSql = `
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
  const results = db.prepare(compareSql).all(...idList);
  res.json(results);
});

apiRouter.get('/university-courses/:id', async (req: Request, res: Response) => {
  if (isNeonEnabled() && sql) {
    try {
      const neonItemSql = `
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
        WHERE uc.id = $1
      `;
      const rows = await sql.query(neonItemSql, [req.params.id]);
      if (rows && rows.length > 0) return res.json(rows[0]);
    } catch (e: any) {}
  }

  const itemSql = `
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
  const item = db.prepare(itemSql).get(req.params.id);
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

  const tombId = 'DEL-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  db.prepare('INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)').run(
    tombId, 'university_course', req.params.id, req.params.id, null, 'User'
  );

  if (isNeonEnabled()) {
    deleteUniversityCourseFromNeon(req.params.id).catch(e => console.warn('[Neon Delete] Uni course defer:', e.message));
  }

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

apiRouter.delete('/documents/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Document deleted permanently.' });
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

apiRouter.post('/integrations/meta/webhook', async (req: Request, res: Response) => {
  try {
    const result = await handleMetaLeadWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
});

// Universal Direct Instant Form Ingest Webhook (for Landing Pages, Zapier, Make, LeadSync, etc.)
apiRouter.post('/integrations/forms/instant-capture', async (req: Request, res: Response) => {
  try {
    const result = await handleMetaLeadWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Instant form capture failed' });
  }
});

// Meta Graph API Token Verifier & Form Inspector
apiRouter.post('/integrations/meta/verify-credentials', async (req: Request, res: Response) => {
  try {
    const { pageAccessToken, pageId } = req.body;
    const result = await verifyMetaCredentials({ pageAccessToken, pageId });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Verification check failed' });
  }
});

// Simulator endpoint so user can test Meta Lead inflow right from UI!
apiRouter.post('/integrations/meta/test-webhook', async (req: Request, res: Response) => {
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
        campaign: req.body.campaign || 'Meta Nepal Admission Wave 2026',
        ad_set: 'Engineering Aspirants',
        ad: 'SRM Admissions 2026 Nepal',
        academic_qualification: '+2 Science',
        percentage_10th: 85.0,
        percentage_12th: 82.0
      }
    };

    const result = await handleMetaLeadWebhook(sampleLead);
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
      full_name: req.body.full_name || req.body.student_name || 'Aarav Sharma',
      phone_number: req.body.phone_number || req.body.phone || '+977 9811' + Math.floor(100000 + Math.random() * 900000),
      email: req.body.email || `aarav.sheets.${Date.now()}@gmail.com`,
      'which_course_are_you_interested_in?': req.body['which_course_are_you_interested_in?'] || req.body.preferred_course || 'B.Tech Computer Science & Engineering',
      'which_univsities_are_you_looking_for?': req.body['which_univsities_are_you_looking_for?'] || req.body.preferred_university || 'SRM Institute of Science and Technology'
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
apiRouter.get('/integrations/google-sheets/list', async (req: Request, res: Response) => {
  try {
    const data = await getAllGoogleSheetConnections();
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
    let sheet = db.prepare('SELECT * FROM google_sheets_connections WHERE id = ?').get(sheetId) as any;

    if (!sheet && isNeonEnabled()) {
      sheet = await findGoogleSheetInNeon(sheetId);
      if (sheet) {
        db.prepare(`
          INSERT INTO google_sheets_connections (
            id, name, sheet_url, spreadsheet_id, gid, sheet_name, campaign_tag, target_city, source_label, status, total_leads_imported, last_rows_count, is_demo, column_mapping
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET name = excluded.name, sheet_url = excluded.sheet_url
        `).run(
          sheet.id, sheet.name, sheet.sheet_url, sheet.spreadsheet_id, sheet.gid,
          sheet.sheet_name, sheet.campaign_tag, sheet.target_city, sheet.source_label,
          sheet.status || 'ACTIVE', Number(sheet.total_leads_imported) || 0, Number(sheet.last_rows_count) || 0, sheet.is_demo || 0,
          sheet.column_mapping || null
        );
      }
    }

    // Auto-heal fallback: If missing from storage, check global integration config
    if (!sheet) {
      const globalInt = db.prepare("SELECT config FROM integrations WHERE id = 'int-sheets' OR name = 'Google Sheets Sync'").get() as any;
      let fallbackUrl = req.body?.sheetUrl;
      if (!fallbackUrl && globalInt?.config) {
        try {
          const cfg = JSON.parse(globalInt.config);
          if (cfg.spreadsheetUrl) fallbackUrl = cfg.spreadsheetUrl;
        } catch {}
      }

      if (fallbackUrl) {
        const reconnected = await addOrConnectGoogleSheet({
          name: 'Google Sheet Leads',
          sheetUrl: fallbackUrl,
          performedBy: req.body?.performedBy || 'Admin'
        });
        sheet = db.prepare('SELECT * FROM google_sheets_connections WHERE id = ?').get(reconnected.connectionId) as any;
      }
    }

    if (!sheet) {
      return res.status(404).json({
        error: `Google Sheet connection '${sheetId}' was not found in permanent storage. Please click "Connect New Sheet" to link your Google Sheet URL.`,
        connectionNotFound: true,
        sheetId
      });
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
    let sheet = db.prepare('SELECT * FROM google_sheets_connections WHERE id = ?').get(sheetId) as any;

    if (!sheet && isNeonEnabled()) {
      sheet = await findGoogleSheetInNeon(sheetId);
      if (sheet) {
        db.prepare(`
          INSERT INTO google_sheets_connections (
            id, name, sheet_url, spreadsheet_id, gid, sheet_name, campaign_tag, target_city, source_label, status, total_leads_imported, last_rows_count, is_demo, column_mapping
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET name = excluded.name, sheet_url = excluded.sheet_url
        `).run(
          sheet.id, sheet.name, sheet.sheet_url, sheet.spreadsheet_id, sheet.gid,
          sheet.sheet_name, sheet.campaign_tag, sheet.target_city, sheet.source_label,
          sheet.status || 'ACTIVE', Number(sheet.total_leads_imported) || 0, Number(sheet.last_rows_count) || 0, sheet.is_demo || 0,
          sheet.column_mapping || null
        );
      }
    }

    if (!sheet) {
      return res.status(404).json({
        error: `Google Sheet connection '${sheetId}' was not found in permanent storage. Please re-enter your Google Sheet link in Integrations.`,
        connectionNotFound: true,
        sheetId
      });
    }

    const liveData = await fetchLiveGoogleSheetData(sheet.sheet_url, sheet.sheet_name);
    res.json(liveData);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to preview Google Sheet.' });
  }
});

// Update an existing Google Sheet connection
apiRouter.put('/integrations/google-sheets/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateGoogleSheetConnection(req.params.id, req.body, req.body.performedBy || 'Admin');
    res.json({ success: true, sheet: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Disconnect / Delete a specific Google Sheet connection
apiRouter.delete('/integrations/google-sheets/:id', async (req: Request, res: Response) => {
  try {
    const result = await deleteGoogleSheetConnection(req.params.id, req.body.performedBy || 'Admin');
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
    res.setHeader('Content-Disposition', 'attachment; filename="gems_group_services_leads.csv"');
    return res.send(csvHeader + csvRows);
  }

  if (entity === 'students') {
    const students = db.prepare('SELECT student_id, student_name, phone, email, university, course, admission_date, fee_paid, counselor_name, city, country FROM students').all();
    const csvHeader = 'Student ID,Student Name,Phone,Email,University,Course,Admission Date,Fee Paid,Counselor,City,Country\n';
    const csvRows = students.map((s: any) => 
      `"${s.student_id}","${s.student_name}","${s.phone}","${s.email}","${s.university}","${s.course}","${s.admission_date}",${s.fee_paid},"${s.counselor_name || ''}","${s.city}","${s.country}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gems_group_services_students.csv"');
    return res.send(csvHeader + csvRows);
  }

  if (entity === 'applications') {
    const apps = db.prepare('SELECT application_id, student_name, university_name, course_name, application_date, application_status, application_fee, payment_status, counselor_name FROM applications').all();
    const csvHeader = 'Application ID,Student Name,University,Course,Application Date,Status,Fee,Payment Status,Counselor\n';
    const csvRows = apps.map((a: any) => 
      `"${a.application_id}","${a.student_name}","${a.university_name}","${a.course_name}","${a.application_date}","${a.application_status}",${a.application_fee},"${a.payment_status}","${a.counselor_name || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gems_group_services_applications.csv"');
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

// ==========================================
// 12. AUTOMATED LEAD DISTRIBUTION ENGINE
// ==========================================
apiRouter.get('/lead-routing/rules', (req: Request, res: Response) => {
  try {
    const rules = getRoutingRules();
    res.json(rules);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch routing rules' });
  }
});

apiRouter.post('/lead-routing/rules', (req: Request, res: Response) => {
  try {
    const { name, counselor_id, course_keywords, university_keywords, target_cities, priority, max_daily_leads, is_active, description, performedBy } = req.body;
    if (!name || !counselor_id) {
      return res.status(400).json({ error: 'Rule name and assigned counselor are required' });
    }
    const rule = createRoutingRule({
      name,
      counselor_id,
      course_keywords,
      university_keywords,
      target_cities,
      priority,
      max_daily_leads,
      is_active,
      description
    }, performedBy || 'Super Admin');
    res.status(201).json(rule);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create routing rule' });
  }
});

apiRouter.put('/lead-routing/rules/:id', (req: Request, res: Response) => {
  try {
    const success = updateRoutingRule(req.params.id, req.body, req.body.performedBy || 'Super Admin');
    if (!success) return res.status(404).json({ error: 'Routing rule not found' });
    res.json({ success: true, message: 'Routing rule updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update routing rule' });
  }
});

apiRouter.delete('/lead-routing/rules/:id', (req: Request, res: Response) => {
  try {
    const success = deleteRoutingRule(req.params.id, (req.query.performedBy as string) || 'Super Admin');
    if (!success) return res.status(404).json({ error: 'Routing rule not found' });
    if (isNeonEnabled()) {
      deleteRoutingRuleFromNeon(req.params.id).catch(e => console.warn('[Neon Delete] Rule defer:', e.message));
    }
    res.json({ success: true, message: 'Routing rule deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete routing rule' });
  }
});

apiRouter.post('/lead-routing/distribute-unassigned', async (req: Request, res: Response) => {
  try {
    const report = await distributeUnassignedLeads(req.body.performedBy || 'Super Admin');
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to distribute unassigned leads' });
  }
});

apiRouter.post('/lead-routing/simulate', (req: Request, res: Response) => {
  try {
    const simulation = simulateLeadRouting(req.body);
    res.json(simulation);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Routing simulation failed' });
  }
});

// ==========================================
// 13. HR SOLUTION (Employees, Attendance, Leaves, Payroll)
// ==========================================
apiRouter.get('/hr/employees', (req: Request, res: Response) => {
  try {
    const employees = getEmployees();
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch employees' });
  }
});

apiRouter.post('/hr/employees', (req: Request, res: Response) => {
  try {
    const { full_name, email, phone } = req.body;
    if (!full_name || !email || !phone) {
      return res.status(400).json({ error: 'Full name, email, and phone number are required' });
    }
    const employee = createEmployee(req.body, req.body.performedBy || 'Super Admin');
    res.status(201).json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create employee' });
  }
});

apiRouter.put('/hr/employees/:id', (req: Request, res: Response) => {
  try {
    const success = updateEmployee(req.params.id, req.body, req.body.performedBy || 'Super Admin');
    if (!success) return res.status(404).json({ error: 'Employee not found' });
    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update employee' });
  }
});

apiRouter.delete('/hr/employees/:id', (req: Request, res: Response) => {
  try {
    const success = deleteEmployee(req.params.id, (req.query.performedBy as string) || 'Super Admin');
    if (!success) return res.status(404).json({ error: 'Employee not found' });
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete employee' });
  }
});

apiRouter.get('/hr/attendance', (req: Request, res: Response) => {
  try {
    const records = getAttendance({
      date: req.query.date as string,
      employee_id: req.query.employee_id as string,
      month: req.query.month as string
    });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch attendance' });
  }
});

apiRouter.post('/hr/attendance', (req: Request, res: Response) => {
  try {
    const { employee_id, date, status } = req.body;
    if (!employee_id || !date) {
      return res.status(400).json({ error: 'Employee ID and date are required' });
    }
    const result = recordAttendance(req.body, req.body.performedBy || 'Super Admin');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record attendance' });
  }
});

apiRouter.get('/hr/leaves', (req: Request, res: Response) => {
  try {
    const leaves = getLeaves({
      employee_id: req.query.employee_id as string,
      status: req.query.status as string
    });
    res.json(leaves);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch leaves' });
  }
});

apiRouter.post('/hr/leaves', (req: Request, res: Response) => {
  try {
    const { employee_id, start_date, end_date, reason } = req.body;
    if (!employee_id || !start_date || !end_date || !reason) {
      return res.status(400).json({ error: 'Employee, start date, end date, and reason are required' });
    }
    const result = applyLeave(req.body, req.body.performedBy || 'Employee');
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to apply leave' });
  }
});

apiRouter.put('/hr/leaves/:id/status', (req: Request, res: Response) => {
  try {
    const { status, remarks, approvedBy } = req.body;
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (Approved or Rejected) is required' });
    }
    const result = updateLeaveStatus(req.params.id, status, remarks, approvedBy || 'Super Admin');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update leave status' });
  }
});

apiRouter.get('/hr/payroll', (req: Request, res: Response) => {
  try {
    const payroll = getPayroll({
      month_year: req.query.month_year as string,
      employee_id: req.query.employee_id as string
    });
    res.json(payroll);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch payroll' });
  }
});

apiRouter.post('/hr/payroll/generate', (req: Request, res: Response) => {
  try {
    const { monthYear, performedBy } = req.body;
    if (!monthYear) {
      return res.status(400).json({ error: 'Month & Year (YYYY-MM) is required' });
    }
    const result = generateMonthlyPayroll(monthYear, performedBy || 'Super Admin');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate payroll' });
  }
});

apiRouter.put('/hr/payroll/:id/pay', (req: Request, res: Response) => {
  try {
    const { paymentMethod, remarks, performedBy } = req.body;
    const result = markPayrollPaid(req.params.id, paymentMethod || 'Bank Transfer', remarks, performedBy || 'Super Admin');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark payroll paid' });
  }
});

// ==========================================
// 14. FINANCE & ACCOUNTING MANAGEMENT
// ==========================================
apiRouter.get('/finance/overview', (req: Request, res: Response) => {
  try {
    const overview = getFinanceOverview({
      month: req.query.month as string,
      year: req.query.year as string
    });
    res.json(overview);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch financial overview' });
  }
});

apiRouter.get('/finance/transactions', (req: Request, res: Response) => {
  try {
    const transactions = getTransactions({
      type: req.query.type as string,
      category: req.query.category as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      paymentMethod: req.query.paymentMethod as string,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    });
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch transactions' });
  }
});

apiRouter.post('/finance/transactions', (req: Request, res: Response) => {
  try {
    const { title, amount, type } = req.body;
    if (!title || amount === undefined || !type) {
      return res.status(400).json({ error: 'Title, amount, and type (INCOME/EXPENSE) are required' });
    }
    const txn = createTransaction(req.body, req.body.performedBy || 'Super Admin');
    res.status(201).json(txn);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create transaction' });
  }
});

apiRouter.put('/finance/transactions/:id', (req: Request, res: Response) => {
  try {
    const success = updateTransaction(req.params.id, req.body, req.body.performedBy || 'Super Admin');
    if (!success) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update transaction' });
  }
});

apiRouter.delete('/finance/transactions/:id', (req: Request, res: Response) => {
  try {
    const success = deleteTransaction(req.params.id, (req.query.performedBy as string) || 'Super Admin');
    if (!success) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete transaction' });
  }
});

apiRouter.get('/finance/invoices', (req: Request, res: Response) => {
  try {
    const invoices = getInvoices({
      invoice_type: req.query.invoice_type as string,
      status: req.query.status as string,
      student_id: req.query.student_id as string,
      university_id: req.query.university_id as string
    });
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch invoices' });
  }
});

apiRouter.post('/finance/invoices', (req: Request, res: Response) => {
  try {
    const { recipient_name, total_amount } = req.body;
    if (!recipient_name || total_amount === undefined) {
      return res.status(400).json({ error: 'Recipient name and total amount are required' });
    }
    const invoice = createInvoice(req.body, req.body.performedBy || 'Super Admin');
    res.status(201).json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

apiRouter.delete('/finance/invoices/:id', (req: Request, res: Response) => {
  try {
    const success = deleteInvoice(req.params.id, (req.query.performedBy as string) || 'Super Admin');
    if (!success) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted permanently' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete invoice' });
  }
});

apiRouter.post('/finance/invoices/:id/pay', (req: Request, res: Response) => {
  try {
    const { amount, paymentMethod, referenceNumber, performedBy } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }
    const result = recordInvoicePayment(req.params.id, Number(amount), paymentMethod || 'Bank Transfer', referenceNumber, performedBy || 'Super Admin');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to record invoice payment' });
  }
});

apiRouter.get('/finance/university-commissions', (req: Request, res: Response) => {
  try {
    const commissions = getUniversityCommissionsSummary();
    res.json(commissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch university commissions' });
  }
});

// ==========================================
// 19. EMAIL TEMPLATES & BULK CAMPAIGNS
// ==========================================
apiRouter.get('/email/templates', (req: Request, res: Response) => {
  try {
    const filters = {
      course: req.query.course as string,
      university: req.query.university as string,
      category: req.query.category as string,
      channel: req.query.channel as string
    };
    const templates = getEmailTemplates(filters);
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch templates' });
  }
});

apiRouter.get('/email/filter-options', (req: Request, res: Response) => {
  try {
    const channel = (req.query.channel as 'Email' | 'WhatsApp') || 'Email';
    const options = getBulkEmailFilterOptions(channel);
    res.json(options);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch filter options' });
  }
});

apiRouter.post('/email/templates', (req: Request, res: Response) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Template name and content are required' });
    }
    const template = saveEmailTemplate(req.body, req.body.performedBy || 'Super Admin');
    res.status(201).json(template);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create template' });
  }
});

apiRouter.put('/email/templates/:id', (req: Request, res: Response) => {
  try {
    const template = saveEmailTemplate({ id: req.params.id, ...req.body }, req.body.performedBy || 'Super Admin');
    res.json(template);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update template' });
  }
});

apiRouter.delete('/email/templates/:id', (req: Request, res: Response) => {
  try {
    const performedBy = (req.query.performedBy as string) || req.body?.performedBy || 'Super Admin';
    const success = deleteEmailTemplate(req.params.id, performedBy);
    if (isNeonEnabled()) {
      deleteMessageTemplateFromNeon(req.params.id).catch(e => console.warn('[Neon Delete] Template defer:', e.message));
    }
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete template' });
  }
});

apiRouter.post('/email/preview', (req: Request, res: Response) => {
  try {
    const { subject, content, sampleData } = req.body;
    const preview = previewEmailResolution(subject || '', content || '', sampleData);
    res.json(preview);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to preview template' });
  }
});

apiRouter.post('/email/target-count', (req: Request, res: Response) => {
  try {
    const channel = req.body?.channel || 'Email';
    const matchingLeads = getTargetLeadsForBulkEmail(req.body || {});
    res.json({
      count: matchingLeads.length,
      sample: matchingLeads.slice(0, 5).map(l => ({
        id: l.id,
        student_name: l.student_name,
        email: l.email,
        phone: l.phone,
        whatsapp_number: l.whatsapp_number,
        recipient: channel === 'WhatsApp' ? (l.whatsapp_number || l.phone) : l.email,
        course: l.preferred_course,
        university: l.preferred_university,
        city: l.city,
        temperature: l.lead_temperature
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute target leads count' });
  }
});

apiRouter.post('/email/send-bulk', (req: Request, res: Response) => {
  try {
    const { subject, content, channel } = req.body;
    const outreachChannel = channel === 'WhatsApp' ? 'WhatsApp' : 'Email';

    if (outreachChannel === 'Email' && (!subject || !content)) {
      return res.status(400).json({ error: 'Subject and email content body are required' });
    }
    if (outreachChannel === 'WhatsApp' && !content) {
      return res.status(400).json({ error: 'WhatsApp message content is required' });
    }

    const result = sendBulkEmailCampaign(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to dispatch bulk outreach campaign' });
  }
});

apiRouter.get('/email/campaigns', (req: Request, res: Response) => {
  try {
    const campaigns = getBulkEmailCampaigns();
    res.json(campaigns);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch bulk email campaigns' });
  }
});

// ==========================================
// 15. AI SALES COPILOT & AUTO-OUTREACH
// ==========================================
apiRouter.get('/ai/settings', (req: Request, res: Response) => {
  try {
    const settings = getAISettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load AI settings' });
  }
});

apiRouter.put('/ai/settings', (req: Request, res: Response) => {
  try {
    const updated = updateAISettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update AI settings' });
  }
});

apiRouter.post('/ai/test-connection', async (req: Request, res: Response) => {
  try {
    const result = await testGeminiConnection(req.body?.apiKey);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to test Gemini connection' });
  }
});

apiRouter.post('/ai/outreach/auto-send', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId) as any;
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = await autoDispatchWelcomeOutreach(lead, 'Manual / Counselor Trigger');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to trigger AI outreach' });
  }
});

apiRouter.post('/ai/pitch/generate', async (req: Request, res: Response) => {
  try {
    const { leadId, channel, objection, tone, customNotes } = req.body;
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId) as any;
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const counselor = resolveCounselorProfile(lead);
    const pitch = await generateSalesPitch(lead, counselor, {
      channel: channel || 'WhatsApp',
      objection: objection || 'CLOSING',
      tone,
      customNotes
    });

    res.json({
      ...pitch,
      student_name: lead.student_name,
      phone: lead.whatsapp_number || lead.phone,
      email: lead.email,
      counselorName: counselor.name,
      counselorPhone: counselor.phone
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate AI pitch' });
  }
});

apiRouter.get('/ai/lead-score/:id', (req: Request, res: Response) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id) as any;
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const insight = analyzeLeadAndScore(lead);
    res.json(insight);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute AI lead score' });
  }
});

apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, leadContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const reply = await handleSalesChat(message, leadContext);
    res.json(reply);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process AI chat' });
  }
});

apiRouter.get('/ai/dashboard', (req: Request, res: Response) => {
  try {
    const metrics = getAIDashboardMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load AI dashboard metrics' });
  }
});

