import { db, logAudit, logLeadActivity, createNotification } from '../db/database.ts';
// Duplicate check
export function checkDuplicate(params) {
    const conditions = [];
    const queryParams = [];
    const matchReasons = [];
    const cleanPhone = params.phone ? params.phone.replace(/[\s\-\(\)]/g, '') : '';
    const cleanWa = params.whatsapp_number ? params.whatsapp_number.replace(/[\s\-\(\)]/g, '') : '';
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';
    if (cleanPhone) {
        conditions.push("REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ?");
        queryParams.push(`%${cleanPhone.replace('+', '')}%`);
    }
    if (cleanWa) {
        conditions.push("REPLACE(REPLACE(REPLACE(whatsapp_number, ' ', ''), '-', ''), '+', '') LIKE ?");
        queryParams.push(`%${cleanWa.replace('+', '')}%`);
    }
    if (cleanEmail) {
        conditions.push("LOWER(TRIM(email)) = ?");
        queryParams.push(cleanEmail);
    }
    if (params.facebook_lead_id) {
        conditions.push("facebook_lead_id = ?");
        queryParams.push(params.facebook_lead_id);
    }
    if (conditions.length === 0) {
        return { hasDuplicate: false, duplicates: [], matchReasons: [] };
    }
    let sql = `SELECT * FROM leads WHERE is_deleted = 0 AND (${conditions.join(' OR ')})`;
    if (params.excludeId) {
        sql += ` AND id != ?`;
        queryParams.push(params.excludeId);
    }
    const duplicates = db.prepare(sql).all(...queryParams);
    if (duplicates.length > 0) {
        const d = duplicates[0];
        if (cleanPhone && d.phone?.replace(/[\s\-\(\)\+]/g, '').includes(cleanPhone.replace('+', ''))) {
            matchReasons.push('Phone number matches existing record');
        }
        if (cleanWa && d.whatsapp_number?.replace(/[\s\-\(\)\+]/g, '').includes(cleanWa.replace('+', ''))) {
            matchReasons.push('WhatsApp number matches existing record');
        }
        if (cleanEmail && d.email?.toLowerCase().trim() === cleanEmail) {
            matchReasons.push('Email matches existing record');
        }
        if (params.facebook_lead_id && d.facebook_lead_id === params.facebook_lead_id) {
            matchReasons.push('Facebook Lead ID matches existing record');
        }
    }
    return {
        hasDuplicate: duplicates.length > 0,
        duplicates,
        matchReasons: Array.from(new Set(matchReasons))
    };
}
// Automatic counselor assignment engine
export function assignCounselor(lead) {
    // Check assignment mode from settings
    const modeSetting = db.prepare("SELECT value FROM settings WHERE key = 'assignment_mode'").get();
    const assignmentMode = modeSetting?.value || 'Round Robin';
    // Fetch active counselors
    const activeCounselors = db.prepare(`
    SELECT * FROM counselors 
    WHERE is_active = 1 AND current_active_leads < max_capacity
    ORDER BY current_active_leads ASC, total_assigned_leads ASC
  `).all();
    if (activeCounselors.length === 0) {
        return null;
    }
    // 1. City Based Matching
    if (assignmentMode === 'City Based' && lead.city) {
        for (const c of activeCounselors) {
            try {
                const cities = JSON.parse(c.assigned_cities || '[]');
                if (cities.some(city => city.toLowerCase() === lead.city?.toLowerCase())) {
                    return { counselorId: c.id, counselorName: c.name, method: 'City Based' };
                }
            }
            catch (e) {
                // fallback
            }
        }
    }
    // 2. University Based Matching
    if (assignmentMode === 'University Based' && lead.preferred_university) {
        // Specific counselor specializations
        if (lead.preferred_university.includes('SRM')) {
            const match = activeCounselors.find(c => c.name.includes('Aarav') || c.name.includes('Ananya'));
            if (match)
                return { counselorId: match.id, counselorName: match.name, method: 'University Based' };
        }
        if (lead.preferred_university.includes('VIT')) {
            const match = activeCounselors.find(c => c.name.includes('Priya') || c.name.includes('Ananya'));
            if (match)
                return { counselorId: match.id, counselorName: match.name, method: 'University Based' };
        }
        if (lead.preferred_university.includes('Symbiosis') || lead.preferred_university.includes('NMIMS')) {
            const match = activeCounselors.find(c => c.name.includes('Sneha') || c.name.includes('Priya'));
            if (match)
                return { counselorId: match.id, counselorName: match.name, method: 'University Based' };
        }
    }
    // 3. Course Based Matching
    if (assignmentMode === 'Course Based' && lead.preferred_course) {
        if (lead.preferred_course.includes('Nursing') || lead.preferred_course.includes('MBBS') || lead.preferred_course.includes('BDS')) {
            const match = activeCounselors.find(c => c.name.includes('Bibek') || c.name.includes('Roshan'));
            if (match)
                return { counselorId: match.id, counselorName: match.name, method: 'Course Based' };
        }
        if (lead.preferred_course.includes('MBA') || lead.preferred_course.includes('BBA')) {
            const match = activeCounselors.find(c => c.name.includes('Sneha') || c.name.includes('Priya'));
            if (match)
                return { counselorId: match.id, counselorName: match.name, method: 'Course Based' };
        }
    }
    // 4. Default / Round Robin
    const pointerSetting = db.prepare("SELECT value FROM settings WHERE key = 'round_robin_pointer'").get();
    let pointer = parseInt(pointerSetting?.value || '0', 10);
    if (isNaN(pointer) || pointer >= activeCounselors.length) {
        pointer = 0;
    }
    const selected = activeCounselors[pointer];
    const nextPointer = (pointer + 1) % activeCounselors.length;
    db.prepare("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'round_robin_pointer'").run(nextPointer.toString());
    return {
        counselorId: selected.id,
        counselorName: selected.name,
        method: 'Round Robin'
    };
}
// Generate new Lead ID ES-YYYY-XXXX
export function generateLeadId() {
    const currentYear = new Date().getFullYear();
    const countRow = db.prepare("SELECT count(*) as count FROM leads WHERE lead_id LIKE ?").get(`ES-${currentYear}-%`);
    const nextSeq = (countRow.count + 1).toString().padStart(4, '0');
    return `ES-${currentYear}-${nextSeq}`;
}
// Create a new lead with all business workflow automations
export function createLead(data, performedBy = 'System') {
    const id = 'lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const leadId = data.lead_id || generateLeadId();
    // Determine counselor
    let counselorId = data.assigned_counselor_id;
    let counselorName = data.assigned_counselor_name;
    let assignmentMethod = 'Manual';
    if (!counselorId) {
        const assigned = assignCounselor({
            city: data.city,
            preferred_university: data.preferred_university,
            preferred_course: data.preferred_course,
            country: data.country
        });
        if (assigned) {
            counselorId = assigned.counselorId;
            counselorName = assigned.counselorName;
            assignmentMethod = assigned.method;
        }
    }
    else if (!counselorName) {
        const c = db.prepare('SELECT name FROM counselors WHERE id = ?').get(counselorId);
        counselorName = c?.name;
    }
    const firstName = data.first_name || data.student_name?.split(' ')[0] || 'Student';
    const lastName = data.last_name || data.student_name?.split(' ').slice(1).join(' ') || '';
    const studentName = data.student_name || `${firstName} ${lastName}`.trim();
    const insertStmt = db.prepare(`
    INSERT INTO leads (
      id, lead_id, student_name, first_name, last_name, phone, whatsapp_number, email,
      gender, date_of_birth, country, state, city, address, academic_qualification,
      percentage_10th, percentage_12th, graduation_percentage, entrance_exam, entrance_score,
      preferred_course, preferred_university, second_university, budget, scholarship_required,
      lead_source, campaign, ad_set, ad, facebook_lead_id, lead_created_date,
      assigned_counselor_id, assigned_counselor_name, lead_status, lead_temperature,
      last_contact_date, next_follow_up_date, remarks, created_by, updated_by,
      is_converted_to_student, is_deleted, is_demo
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, datetime('now'),
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      0, 0, ?
    )
  `);
    insertStmt.run(id, leadId, studentName, firstName, lastName, data.phone || '', data.whatsapp_number || data.phone || '', data.email || '', data.gender || null, data.date_of_birth || null, data.country || 'Nepal', data.state || null, data.city || 'Kathmandu', data.address || null, data.academic_qualification || null, data.percentage_10th || null, data.percentage_12th || null, data.graduation_percentage || null, data.entrance_exam || null, data.entrance_score || null, data.preferred_course || 'B.Tech CSE', data.preferred_university || 'SRM Institute of Science and Technology', data.second_university || null, data.budget || null, data.scholarship_required ? 1 : 0, data.lead_source || 'Meta Ads', data.campaign || null, data.ad_set || null, data.ad || null, data.facebook_lead_id || null, counselorId || null, counselorName || null, data.lead_status || 'New Lead', data.lead_temperature || 'WARM', data.last_contact_date || null, data.next_follow_up_date || null, data.remarks || null, performedBy, performedBy, data.is_demo !== undefined ? data.is_demo : 0);
    // Update counselor active counts
    if (counselorId) {
        db.prepare(`
      UPDATE counselors 
      SET current_active_leads = current_active_leads + 1,
          total_assigned_leads = total_assigned_leads + 1,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(counselorId);
        // Log assignment
        const assignLogId = 'ASG-' + Date.now();
        db.prepare(`
      INSERT INTO lead_assignments (id, lead_id, previous_counselor_id, previous_counselor_name, new_counselor_id, new_counselor_name, assignment_method, assigned_by)
      VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)
    `).run(assignLogId, id, counselorId, counselorName, assignmentMethod, performedBy);
        // Create notification for counselor
        createNotification({
            counselorId,
            title: 'New Lead Assigned',
            message: `Lead ${studentName} (${data.preferred_course || 'Course'}) has been assigned to you.`,
            type: 'NEW_LEAD',
            entityType: 'lead',
            entityId: id
        });
    }
    // Log activity
    logLeadActivity({
        leadId: id,
        activityType: 'Counselor Assignment',
        title: `Assigned to ${counselorName || 'Unassigned'}`,
        description: `Auto-assignment via ${assignmentMethod}`,
        performedBy
    });
    // Automated first follow-up (24 hours later)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fupDateStr = tomorrow.toISOString().split('T')[0];
    const fupId = 'fup-' + Date.now();
    db.prepare(`
    INSERT INTO followups (id, lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, status, created_by)
    VALUES (?, ?, ?, ?, '11:00', 'Call', 'HIGH', 'First outreach call to introduce Education Sansar counseling services', 'Pending', ?)
  `).run(fupId, id, counselorId || null, fupDateStr, performedBy);
    // Queue automated welcome message in activity
    logLeadActivity({
        leadId: id,
        activityType: 'WhatsApp',
        title: 'Automated Welcome WhatsApp Message Queued',
        description: `Welcome message prepared with counselor contact (${counselorName || 'Admissions Desk'})`,
        performedBy: 'Automation Engine'
    });
    // Audit log
    logAudit({
        userName: performedBy,
        action: 'LEAD_CREATED',
        entity: 'lead',
        entityId: id,
        newValue: { lead_id: leadId, student_name: studentName, phone: data.phone, counselor: counselorName }
    });
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
}
// Update lead with status tracking and student conversion automation
export function updateLead(id, updates, performedBy = 'System') {
    const currentLead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    if (!currentLead) {
        throw new Error('Lead not found');
    }
    const oldStatus = currentLead.lead_status;
    const newStatus = updates.lead_status || oldStatus;
    // Build update query dynamically
    const allowedFields = [
        'student_name', 'first_name', 'last_name', 'phone', 'whatsapp_number', 'email',
        'gender', 'date_of_birth', 'country', 'state', 'city', 'address', 'academic_qualification',
        'percentage_10th', 'percentage_12th', 'graduation_percentage', 'entrance_exam', 'entrance_score',
        'preferred_course', 'preferred_university', 'second_university', 'budget', 'scholarship_required',
        'lead_source', 'campaign', 'ad_set', 'ad', 'lead_status', 'lead_temperature',
        'last_contact_date', 'next_follow_up_date', 'remarks', 'assigned_counselor_id', 'assigned_counselor_name'
    ];
    const setClauses = [];
    const params = [];
    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            setClauses.push(`${field} = ?`);
            params.push(updates[field]);
        }
    }
    setClauses.push("updated_by = ?");
    params.push(performedBy);
    setClauses.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE leads SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
    // Status Change Workflow Automation
    if (updates.lead_status && updates.lead_status !== oldStatus) {
        // 1. Log in status history
        const histId = 'STH-' + Date.now();
        db.prepare(`
      INSERT INTO lead_status_history (id, lead_id, previous_status, new_status, changed_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(histId, id, oldStatus, newStatus, performedBy);
        // 2. Log in activity
        logLeadActivity({
            leadId: id,
            activityType: 'Status Change',
            title: `Status changed to ${newStatus}`,
            description: `Lead moved from "${oldStatus}" to "${newStatus}"`,
            performedBy
        });
        // 3. Automated trigger: Documents Pending -> create document follow-up
        if (newStatus === 'Documents Pending') {
            const fupDate = new Date();
            fupDate.setDate(fupDate.getDate() + 2);
            const fupId = 'fup-doc-' + Date.now();
            db.prepare(`
        INSERT INTO followups (id, lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, status, created_by)
        VALUES (?, ?, ?, ?, '14:00', 'Document Follow-up', 'HIGH', 'Collect pending academic transcripts and identity documents', 'Pending', 'Automation Engine')
      `).run(fupId, id, currentLead.assigned_counselor_id || null, fupDate.toISOString().split('T')[0]);
            createNotification({
                counselorId: currentLead.assigned_counselor_id,
                title: 'Documents Pending Alert',
                message: `${currentLead.student_name} is in Documents Pending stage. Please collect marksheets and ID proofs.`,
                type: 'DOCUMENT_PENDING',
                entityType: 'lead',
                entityId: id
            });
        }
        // 4. Automated trigger: Admission Confirmed -> Convert to official Student record!
        if (newStatus === 'Admission Confirmed') {
            convertLeadToStudent(id, performedBy);
        }
    }
    // Audit log
    logAudit({
        userName: performedBy,
        action: 'LEAD_UPDATED',
        entity: 'lead',
        entityId: id,
        oldValue: currentLead,
        newValue: updates
    });
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
}
// Convert lead to official Student record
export function convertLeadToStudent(leadId, performedBy = 'System') {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead)
        return null;
    // Check if student already exists for this lead
    const existingStudent = db.prepare('SELECT * FROM students WHERE lead_id = ?').get(leadId);
    if (existingStudent)
        return existingStudent;
    // Generate Student ID STU-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const countRow = db.prepare("SELECT count(*) as count FROM students WHERE student_id LIKE ?").get(`STU-${currentYear}-%`);
    const studentId = `STU-${currentYear}-${(countRow.count + 1).toString().padStart(3, '0')}`;
    const stuDbId = 'stu-' + Date.now();
    // Find linked application if any
    const app = db.prepare("SELECT id FROM applications WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1").get(leadId);
    db.prepare(`
    INSERT INTO students (
      id, student_id, lead_id, student_name, phone, whatsapp_number, email, gender, date_of_birth,
      university, course, admission_date, application_id, fee_paid, counselor_id, counselor_name,
      source, city, country, academic_details, is_demo
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, date('now'), ?, 50000.0, ?, ?,
      ?, ?, ?, ?, ?
    )
  `).run(stuDbId, studentId, leadId, lead.student_name, lead.phone, lead.whatsapp_number, lead.email, lead.gender || null, lead.date_of_birth || null, lead.preferred_university, lead.preferred_course, app?.id || null, lead.assigned_counselor_id || null, lead.assigned_counselor_name || null, lead.lead_source, lead.city, lead.country, `10th: ${lead.percentage_10th || 'N/A'}%, 12th: ${lead.percentage_12th || 'N/A'}%`, lead.is_demo);
    // Update lead converted flag
    db.prepare("UPDATE leads SET is_converted_to_student = 1, updated_at = datetime('now') WHERE id = ?").run(leadId);
    // Update counselor total admissions
    if (lead.assigned_counselor_id) {
        db.prepare(`
      UPDATE counselors 
      SET total_admissions = total_admissions + 1,
          conversion_rate = ROUND((total_admissions + 1) * 100.0 / MAX(1, total_assigned_leads), 2),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(lead.assigned_counselor_id);
    }
    // Log activity
    logLeadActivity({
        leadId,
        activityType: 'Status Change',
        title: 'Lead Converted to Official Enrolled Student 🎉',
        description: `Assigned Official Student ID: ${studentId}. Complete lead timeline & academic history preserved.`,
        performedBy
    });
    // Notify counselor and management
    createNotification({
        counselorId: lead.assigned_counselor_id,
        title: 'Student Admission Confirmed 🎉',
        message: `${lead.student_name} has been enrolled at ${lead.preferred_university}. Student ID: ${studentId}`,
        type: 'ADMISSION_CONFIRMED',
        entityType: 'student',
        entityId: stuDbId
    });
    return db.prepare('SELECT * FROM students WHERE id = ?').get(stuDbId);
}
// Reassign counselor
export function reassignLead(leadId, newCounselorId, performedBy = 'System') {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead)
        throw new Error('Lead not found');
    const newCounselor = db.prepare('SELECT * FROM counselors WHERE id = ?').get(newCounselorId);
    if (!newCounselor)
        throw new Error('New counselor not found');
    const oldCounselorId = lead.assigned_counselor_id;
    const oldCounselorName = lead.assigned_counselor_name;
    // Update lead
    db.prepare(`
    UPDATE leads 
    SET assigned_counselor_id = ?, assigned_counselor_name = ?, updated_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newCounselor.id, newCounselor.name, performedBy, leadId);
    // Update counselor counts
    if (oldCounselorId) {
        db.prepare("UPDATE counselors SET current_active_leads = MAX(0, current_active_leads - 1) WHERE id = ?").run(oldCounselorId);
    }
    db.prepare("UPDATE counselors SET current_active_leads = current_active_leads + 1, total_assigned_leads = total_assigned_leads + 1 WHERE id = ?").run(newCounselor.id);
    // Update active follow-ups to point to new counselor
    db.prepare("UPDATE followups SET counselor_id = ? WHERE lead_id = ? AND status = 'Pending'").run(newCounselor.id, leadId);
    // Log in assignments
    const assignLogId = 'ASG-' + Date.now();
    db.prepare(`
    INSERT INTO lead_assignments (id, lead_id, previous_counselor_id, previous_counselor_name, new_counselor_id, new_counselor_name, assignment_method, assigned_by)
    VALUES (?, ?, ?, ?, ?, ?, 'Manual Reassignment', ?)
  `).run(assignLogId, leadId, oldCounselorId || null, oldCounselorName || null, newCounselor.id, newCounselor.name, performedBy);
    // Log activity
    logLeadActivity({
        leadId,
        activityType: 'Counselor Assignment',
        title: `Reassigned to ${newCounselor.name}`,
        description: `Transferred from ${oldCounselorName || 'Unassigned'} by ${performedBy}`,
        performedBy
    });
    // Notify new counselor
    createNotification({
        counselorId: newCounselor.id,
        title: 'Lead Reassigned to You',
        message: `${lead.student_name} (${lead.preferred_course}) has been transferred to your care.`,
        type: 'NEW_LEAD',
        entityType: 'lead',
        entityId: leadId
    });
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
}
