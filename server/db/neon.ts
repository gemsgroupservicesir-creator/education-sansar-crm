import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const isNeonEnabled = (): boolean => Boolean(connectionString);

export const sql = connectionString ? neon(connectionString) : null;

/**
 * Run safe parameterized query against Neon PostgreSQL
 */
export async function neonQuery(text: string, params: any[] = []): Promise<any[]> {
  if (!sql) return [];
  try {
    return await sql.query(text, params);
  } catch (err: any) {
    console.error(`[Neon Error] Query failed: ${text.substring(0, 100)}... ->`, err.message);
    return [];
  }
}

/**
 * Direct User lookup in Neon PostgreSQL for 100% server-side authentication
 */
export async function findUserInNeon(identifier: string): Promise<any | null> {
  if (!sql) return null;
  const clean = identifier.trim().toLowerCase();
  const prefix = clean.includes('@') ? clean.split('@')[0] : clean;
  try {
    const rows = await sql.query(`
      SELECT * FROM users 
      WHERE (
        LOWER(email) = $1 
        OR LOWER(email) = $2
        OR LOWER(email) LIKE $2 || '@%'
        OR LOWER(SPLIT_PART(email, '@', 1)) = $2
        OR LOWER(name) = $1
        OR LOWER(name) = $2
        OR phone = $1
        OR id IN (SELECT user_id FROM counselors WHERE LOWER(username) = $1 OR LOWER(username) = $2)
        OR ($2 IN ('prakash', 'prakash.yadav', 'prakash_yadav') AND (LOWER(email) LIKE 'prakash%' OR LOWER(name) LIKE '%prakash%'))
        OR ($2 IN ('admin', 'superadmin') AND (role IN ('superadmin', 'admin') OR LOWER(email) LIKE 'admin%'))
        OR ($2 IN ('reet', 'reetdas', 'reetdas22636') AND (LOWER(email) LIKE 'reetdas%' OR LOWER(name) LIKE '%reet%'))
      )
      AND is_active = 1
      ORDER BY 
        CASE 
          WHEN LOWER(email) = $1 THEN 1
          WHEN LOWER(SPLIT_PART(email, '@', 1)) = $2 THEN 2
          WHEN role = 'superadmin' THEN 3
          ELSE 4
        END
      LIMIT 1
    `, [clean, prefix]);
    return rows[0] || null;
  } catch (err) {
    console.error('[Neon Auth] Failed to query user:', err);
    return null;
  }
}


/**
 * Persist or update a user record in Neon PostgreSQL
 */
export async function persistUserToNeon(user: {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_active?: number;
  permissions?: string | string[] | null;
}): Promise<boolean> {
  if (!sql) return false;
  try {
    const permsJson = typeof user.permissions === 'string' 
      ? user.permissions 
      : JSON.stringify(user.permissions || []);
    await sql.query(`
      INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, is_active, permissions, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        is_active = EXCLUDED.is_active,
        permissions = EXCLUDED.permissions,
        updated_at = NOW()
    `, [
      user.id,
      user.name,
      user.email.toLowerCase(),
      user.password_hash,
      user.role,
      user.phone || null,
      user.avatar_url || null,
      user.is_active !== undefined ? user.is_active : 1,
      permsJson
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] User persist failed:', err.message);
    return false;
  }
}

/**
 * Persist counselor to Neon
 */
export async function persistCounselorToNeon(counselor: any): Promise<boolean> {
  if (!sql) return false;
  try {
    const specCourses = typeof counselor.specialization_courses === 'string'
      ? counselor.specialization_courses
      : JSON.stringify(counselor.specialization_courses || []);
    const specUnis = typeof counselor.specialization_universities === 'string'
      ? counselor.specialization_universities
      : JSON.stringify(counselor.specialization_universities || []);

    await sql.query(`
      INSERT INTO counselors (
        id, user_id, name, email, phone, specialization_country, assigned_cities,
        is_active, max_capacity, current_active_leads, total_assigned_leads,
        total_admissions, conversion_rate, username, joining_date, status,
        specialization_courses, specialization_universities, daily_lead_quota, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
      ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        specialization_country = EXCLUDED.specialization_country,
        assigned_cities = EXCLUDED.assigned_cities,
        is_active = EXCLUDED.is_active,
        max_capacity = EXCLUDED.max_capacity,
        current_active_leads = EXCLUDED.current_active_leads,
        total_assigned_leads = EXCLUDED.total_assigned_leads,
        total_admissions = EXCLUDED.total_admissions,
        conversion_rate = EXCLUDED.conversion_rate,
        username = EXCLUDED.username,
        status = EXCLUDED.status,
        specialization_courses = EXCLUDED.specialization_courses,
        specialization_universities = EXCLUDED.specialization_universities,
        daily_lead_quota = EXCLUDED.daily_lead_quota,
        updated_at = NOW()
    `, [
      counselor.id,
      counselor.user_id || null,
      counselor.name,
      counselor.email,
      counselor.phone,
      counselor.specialization_country || 'Nepal & India',
      typeof counselor.assigned_cities === 'string' ? counselor.assigned_cities : JSON.stringify(counselor.assigned_cities || []),
      counselor.is_active !== undefined ? counselor.is_active : 1,
      counselor.max_capacity || 100,
      counselor.current_active_leads || 0,
      counselor.total_assigned_leads || 0,
      counselor.total_admissions || 0,
      counselor.conversion_rate || 0.0,
      counselor.username || counselor.email.split('@')[0],
      counselor.joining_date || new Date().toISOString(),
      counselor.status || 'Active',
      specCourses,
      specUnis,
      counselor.daily_lead_quota || 25
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] Counselor persist failed:', err.message);
    return false;
  }
}

/**
 * Persist lead to Neon PostgreSQL
 */
export async function persistLeadToNeon(lead: any): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO leads (
        id, lead_id, student_name, first_name, last_name, phone, whatsapp_number, email,
        parent_name, school_college, passing_year, gender, date_of_birth, country, state, city,
        address, academic_qualification, percentage_10th, percentage_12th, graduation_percentage,
        entrance_exam, entrance_score, preferred_course, preferred_university, second_university,
        budget, scholarship_required, lead_source, campaign, ad_set, ad, facebook_lead_id,
        lead_created_date, assigned_counselor_id, assigned_counselor_name, lead_status,
        lead_temperature, priority, last_contact_date, next_follow_up_date, remarks,
        created_by, updated_by, is_converted_to_student, is_deleted, is_demo, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37,
        $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        student_name = EXCLUDED.student_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        whatsapp_number = EXCLUDED.whatsapp_number,
        email = EXCLUDED.email,
        parent_name = EXCLUDED.parent_name,
        school_college = EXCLUDED.school_college,
        passing_year = EXCLUDED.passing_year,
        gender = EXCLUDED.gender,
        date_of_birth = EXCLUDED.date_of_birth,
        country = EXCLUDED.country,
        state = EXCLUDED.state,
        city = EXCLUDED.city,
        address = EXCLUDED.address,
        academic_qualification = EXCLUDED.academic_qualification,
        percentage_10th = EXCLUDED.percentage_10th,
        percentage_12th = EXCLUDED.percentage_12th,
        graduation_percentage = EXCLUDED.graduation_percentage,
        entrance_exam = EXCLUDED.entrance_exam,
        entrance_score = EXCLUDED.entrance_score,
        preferred_course = EXCLUDED.preferred_course,
        preferred_university = EXCLUDED.preferred_university,
        second_university = EXCLUDED.second_university,
        budget = EXCLUDED.budget,
        scholarship_required = EXCLUDED.scholarship_required,
        lead_source = EXCLUDED.lead_source,
        campaign = EXCLUDED.campaign,
        ad_set = EXCLUDED.ad_set,
        ad = EXCLUDED.ad,
        facebook_lead_id = EXCLUDED.facebook_lead_id,
        assigned_counselor_id = EXCLUDED.assigned_counselor_id,
        assigned_counselor_name = EXCLUDED.assigned_counselor_name,
        lead_status = EXCLUDED.lead_status,
        lead_temperature = EXCLUDED.lead_temperature,
        priority = EXCLUDED.priority,
        last_contact_date = EXCLUDED.last_contact_date,
        next_follow_up_date = EXCLUDED.next_follow_up_date,
        remarks = EXCLUDED.remarks,
        updated_by = EXCLUDED.updated_by,
        is_converted_to_student = EXCLUDED.is_converted_to_student,
        is_deleted = EXCLUDED.is_deleted,
        updated_at = NOW()
    `, [
      lead.id,
      lead.lead_id,
      lead.student_name,
      lead.first_name || null,
      lead.last_name || null,
      lead.phone,
      lead.whatsapp_number || null,
      lead.email || null,
      lead.parent_name || null,
      lead.school_college || null,
      lead.passing_year || null,
      lead.gender || null,
      lead.date_of_birth || null,
      lead.country || 'Nepal',
      lead.state || null,
      lead.city || 'Kathmandu',
      lead.address || null,
      lead.academic_qualification || null,
      lead.percentage_10th !== undefined ? lead.percentage_10th : null,
      lead.percentage_12th !== undefined ? lead.percentage_12th : null,
      lead.graduation_percentage !== undefined ? lead.graduation_percentage : null,
      lead.entrance_exam || null,
      lead.entrance_score || null,
      lead.preferred_course || 'B.Tech',
      lead.preferred_university || 'SRM Institute of Science and Technology',
      lead.second_university || null,
      lead.budget || null,
      lead.scholarship_required ? 1 : 0,
      lead.lead_source || 'Direct Walk-in',
      lead.campaign || null,
      lead.ad_set || null,
      lead.ad || null,
      lead.facebook_lead_id || null,
      lead.lead_created_date ? new Date(lead.lead_created_date) : new Date(),
      lead.assigned_counselor_id || null,
      lead.assigned_counselor_name || null,
      lead.lead_status || 'New Lead',
      lead.lead_temperature || 'WARM',
      lead.priority || 'MEDIUM',
      lead.last_contact_date ? new Date(lead.last_contact_date) : null,
      lead.next_follow_up_date ? new Date(lead.next_follow_up_date) : null,
      lead.remarks || null,
      lead.created_by || 'System',
      lead.updated_by || null,
      lead.is_converted_to_student ? 1 : 0,
      lead.is_deleted ? 1 : 0,
      lead.is_demo ? 1 : 0
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] Lead persist failed:', err.message);
    return false;
  }
}

/**
 * Persist deleted record tombstone to Neon
 */
export async function persistDeletedRecordToNeon(tombstone: {
  id: string;
  entity_type: string;
  entity_id: string;
  identifier?: string | null;
  details?: string | null;
  deleted_by?: string;
}): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      tombstone.id,
      tombstone.entity_type,
      tombstone.entity_id,
      tombstone.identifier || null,
      tombstone.details || null,
      tombstone.deleted_by || 'System'
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] Tombstone persist failed:', err.message);
    return false;
  }
}

/**
 * Delete a lead and all related records permanently from Neon
 */
export async function deleteLeadFromNeon(leadId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM students WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM followups WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM lead_activities WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM applications WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM documents WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM leads WHERE id = $1`, [leadId]);
    await sql.query(`
      INSERT INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [
      `del_lead_${leadId}`,
      'lead',
      leadId,
      leadId,
      'Lead permanently deleted',
      'User Action'
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Lead deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete a counselor and corresponding user account from Neon
 */
export async function deleteCounselorAndUserFromNeon(counselorId: string, email?: string, userId?: string): Promise<boolean> {
  if (!sql) return false;
  try {
    if (email || userId) {
      await sql.query(`DELETE FROM users WHERE LOWER(email) = LOWER($1) OR id = $2`, [email || '', userId || '']);
    }
    await sql.query(`DELETE FROM counselors WHERE id = $1`, [counselorId]);
    await sql.query(`DELETE FROM hr_employees WHERE counselor_id = $1 OR user_id = $2`, [counselorId, userId || '']);
    await sql.query(`DELETE FROM lead_routing_rules WHERE counselor_id = $1`, [counselorId]);
    await sql.query(`UPDATE leads SET assigned_counselor_id = NULL, assigned_counselor_name = 'Unassigned' WHERE assigned_counselor_id = $1`, [counselorId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Counselor/User deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete HR employee and related records permanently from Neon
 */
export async function deleteEmployeeFromNeon(employeeId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM hr_attendance WHERE employee_id = $1`, [employeeId]);
    await sql.query(`DELETE FROM hr_leaves WHERE employee_id = $1`, [employeeId]);
    await sql.query(`DELETE FROM hr_payroll WHERE employee_id = $1`, [employeeId]);
    await sql.query(`DELETE FROM hr_employees WHERE id = $1`, [employeeId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Employee deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete Finance Transaction permanently from Neon
 */
export async function deleteTransactionFromNeon(transactionId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM finance_transactions WHERE id = $1`, [transactionId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Finance transaction deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete Finance Invoice permanently from Neon
 */
export async function deleteInvoiceFromNeon(invoiceId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM finance_invoices WHERE id = $1`, [invoiceId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Finance invoice deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete Student permanently from Neon
 */
export async function deleteStudentFromNeon(studentId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM students WHERE id = $1`, [studentId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Student deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete Application permanently from Neon
 */
export async function deleteApplicationFromNeon(appId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM applications WHERE id = $1`, [appId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Application deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete Followup permanently from Neon
 */
export async function deleteFollowupFromNeon(followupId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM followups WHERE id = $1`, [followupId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Followup deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete University permanently from Neon
 */
export async function deleteUniversityFromNeon(uniId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM university_courses WHERE university_id = $1`, [uniId]);
    await sql.query(`DELETE FROM courses WHERE university_id = $1`, [uniId]);
    await sql.query(`DELETE FROM universities WHERE id = $1`, [uniId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] University deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete Course permanently from Neon
 */
export async function deleteCourseFromNeon(courseId: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM university_courses WHERE course_id = $1`, [courseId]);
    await sql.query(`DELETE FROM courses WHERE id = $1`, [courseId]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Course deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete University Course Fee Structure permanently from Neon
 */
export async function deleteUniversityCourseFromNeon(id: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM university_courses WHERE id = $1`, [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] University course deletion failed:', err.message);
    return false;
  }
}

/**
 * Delete Routing Rule permanently from Neon
 */
export async function deleteRoutingRuleFromNeon(id: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM lead_routing_rules WHERE id = $1`, [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Routing rule deletion failed:', err.message);
    return false;
  }
}

/**
 * Persist or Update Routing Rule in Neon
 */
export async function persistRoutingRuleToNeon(rule: any): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(
      `INSERT INTO lead_routing_rules (
        id, name, course_keywords, university_keywords, target_cities, lead_sources,
        counselor_id, counselor_name, priority, max_daily_leads, is_active, description, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        course_keywords = EXCLUDED.course_keywords,
        university_keywords = EXCLUDED.university_keywords,
        target_cities = EXCLUDED.target_cities,
        lead_sources = EXCLUDED.lead_sources,
        counselor_id = EXCLUDED.counselor_id,
        counselor_name = EXCLUDED.counselor_name,
        priority = EXCLUDED.priority,
        max_daily_leads = EXCLUDED.max_daily_leads,
        is_active = EXCLUDED.is_active,
        description = EXCLUDED.description,
        updated_at = NOW()`,
      [
        rule.id,
        rule.name,
        JSON.stringify(rule.course_keywords || []),
        JSON.stringify(rule.university_keywords || []),
        JSON.stringify(rule.target_cities || []),
        JSON.stringify(rule.lead_sources || []),
        rule.counselor_id,
        rule.counselor_name,
        rule.priority || 1,
        rule.max_daily_leads || 20,
        rule.is_active !== undefined ? rule.is_active : 1,
        rule.description || null
      ]
    );
    return true;
  } catch (err: any) {
    // Fallback if lead_sources column doesn't exist yet on Neon schema
    try {
      await sql.query(
        `INSERT INTO lead_routing_rules (
          id, name, course_keywords, university_keywords, target_cities,
          counselor_id, counselor_name, priority, max_daily_leads, is_active, description, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          course_keywords = EXCLUDED.course_keywords,
          university_keywords = EXCLUDED.university_keywords,
          target_cities = EXCLUDED.target_cities,
          counselor_id = EXCLUDED.counselor_id,
          counselor_name = EXCLUDED.counselor_name,
          priority = EXCLUDED.priority,
          max_daily_leads = EXCLUDED.max_daily_leads,
          is_active = EXCLUDED.is_active,
          description = EXCLUDED.description,
          updated_at = NOW()`,
        [
          rule.id,
          rule.name,
          JSON.stringify(rule.course_keywords || []),
          JSON.stringify(rule.university_keywords || []),
          JSON.stringify(rule.target_cities || []),
          rule.counselor_id,
          rule.counselor_name,
          rule.priority || 1,
          rule.max_daily_leads || 20,
          rule.is_active !== undefined ? rule.is_active : 1,
          rule.description || null
        ]
      );
      return true;
    } catch (fallbackErr: any) {
      console.warn('[Neon Sync] Routing rule sync warning:', fallbackErr.message);
      return false;
    }
  }
}

/**
 * Delete Message Template permanently from Neon
 */
export async function deleteMessageTemplateFromNeon(id: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM message_templates WHERE id = $1`, [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Message template deletion failed:', err.message);
    return false;
  }
}

/**
 * Persist HR Employee to Neon
 */
export async function persistEmployeeToNeon(emp: any): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO hr_employees (
        id, employee_code, user_id, counselor_id, full_name, email, phone,
        department, designation, employment_type, joining_date, monthly_salary,
        currency, bank_name, account_number, pan_number, emergency_contact, status, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        department = EXCLUDED.department,
        designation = EXCLUDED.designation,
        employment_type = EXCLUDED.employment_type,
        joining_date = EXCLUDED.joining_date,
        monthly_salary = EXCLUDED.monthly_salary,
        currency = EXCLUDED.currency,
        bank_name = EXCLUDED.bank_name,
        account_number = EXCLUDED.account_number,
        pan_number = EXCLUDED.pan_number,
        emergency_contact = EXCLUDED.emergency_contact,
        status = EXCLUDED.status,
        user_id = EXCLUDED.user_id,
        counselor_id = EXCLUDED.counselor_id,
        updated_at = NOW()
    `, [
      emp.id, emp.employee_code, emp.user_id || null, emp.counselor_id || null,
      emp.full_name, emp.email, emp.phone, emp.department || 'Counseling',
      emp.designation || 'Education Counselor', emp.employment_type || 'Full-Time',
      emp.joining_date || new Date().toISOString().split('T')[0],
      Number(emp.monthly_salary) || 0, emp.currency || 'NPR',
      emp.bank_name || null, emp.account_number || null, emp.pan_number || null,
      emp.emergency_contact || null, emp.status || 'Active'
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] Employee persist failed:', err.message);
    return false;
  }
}

/**
 * Persist Finance Transaction to Neon
 */
export async function persistTransactionToNeon(tx: any): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO finance_transactions (
        id, transaction_id, type, category, title, amount, currency,
        transaction_date, payment_method, reference_number, student_id, student_name,
        university_id, university_name, status, notes, recorded_by, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        category = EXCLUDED.category,
        title = EXCLUDED.title,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        transaction_date = EXCLUDED.transaction_date,
        payment_method = EXCLUDED.payment_method,
        reference_number = EXCLUDED.reference_number,
        student_id = EXCLUDED.student_id,
        student_name = EXCLUDED.student_name,
        university_id = EXCLUDED.university_id,
        university_name = EXCLUDED.university_name,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `, [
      tx.id, tx.transaction_id, tx.type || 'INCOME', tx.category || 'General',
      tx.title, Number(tx.amount) || 0, tx.currency || 'NPR',
      tx.transaction_date || new Date().toISOString().split('T')[0],
      tx.payment_method || 'Bank Transfer', tx.reference_number || null,
      tx.student_id || null, tx.student_name || null,
      tx.university_id || null, tx.university_name || null,
      tx.status || 'Completed', tx.notes || null, tx.recorded_by || 'Super Admin'
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] Transaction persist failed:', err.message);
    return false;
  }
}

/**
 * Persist Finance Invoice to Neon
 */
export async function persistInvoiceToNeon(inv: any): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO finance_invoices (
        id, invoice_number, invoice_type, recipient_name, recipient_email, recipient_phone,
        total_amount, paid_amount, due_amount, currency, due_date, status, items, notes,
        student_id, university_id, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      ON CONFLICT (id) DO UPDATE SET
        invoice_number = EXCLUDED.invoice_number,
        invoice_type = EXCLUDED.invoice_type,
        recipient_name = EXCLUDED.recipient_name,
        recipient_email = EXCLUDED.recipient_email,
        recipient_phone = EXCLUDED.recipient_phone,
        total_amount = EXCLUDED.total_amount,
        paid_amount = EXCLUDED.paid_amount,
        due_amount = EXCLUDED.due_amount,
        currency = EXCLUDED.currency,
        due_date = EXCLUDED.due_date,
        status = EXCLUDED.status,
        items = EXCLUDED.items,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `, [
      inv.id, inv.invoice_number, inv.invoice_type || 'STUDENT_FEE',
      inv.recipient_name, inv.recipient_email || null, inv.recipient_phone || null,
      Number(inv.total_amount) || 0, Number(inv.paid_amount) || 0, Number(inv.due_amount) || 0,
      inv.currency || 'NPR', inv.due_date, inv.status || 'Sent',
      typeof inv.items === 'string' ? inv.items : JSON.stringify(inv.items || []),
      inv.notes || null, inv.student_id || null, inv.university_id || null
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] Invoice persist failed:', err.message);
    return false;
  }
}

/**
 * Persist University Course & Fee Structure to Neon
 */
export async function persistUniversityCourseToNeon(uc: any): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO university_courses (
        id, university_id, course_id, tuition_fee_per_year, hostel_fee_per_year,
        one_time_fee, other_charges, total_first_year_fee, total_full_course_fee,
        currency, eligibility_notes, scholarship_available, scholarship_details,
        application_deadline, admission_process, remarks, is_active, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      ON CONFLICT (id) DO UPDATE SET
        university_id = EXCLUDED.university_id,
        course_id = EXCLUDED.course_id,
        tuition_fee_per_year = EXCLUDED.tuition_fee_per_year,
        hostel_fee_per_year = EXCLUDED.hostel_fee_per_year,
        one_time_fee = EXCLUDED.one_time_fee,
        other_charges = EXCLUDED.other_charges,
        total_first_year_fee = EXCLUDED.total_first_year_fee,
        total_full_course_fee = EXCLUDED.total_full_course_fee,
        currency = EXCLUDED.currency,
        eligibility_notes = EXCLUDED.eligibility_notes,
        scholarship_available = EXCLUDED.scholarship_available,
        scholarship_details = EXCLUDED.scholarship_details,
        application_deadline = EXCLUDED.application_deadline,
        admission_process = EXCLUDED.admission_process,
        remarks = EXCLUDED.remarks,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `, [
      uc.id,
      uc.university_id,
      uc.course_id,
      uc.tuition_fee_per_year || 0,
      uc.hostel_fee_per_year || 0,
      uc.one_time_fee || 0,
      uc.other_charges || 0,
      uc.total_first_year_fee || 0,
      uc.total_full_course_fee || 0,
      uc.currency || 'INR',
      uc.eligibility_notes || null,
      uc.scholarship_available ? 1 : 0,
      uc.scholarship_details || null,
      uc.application_deadline || null,
      uc.admission_process || 'Direct Merit / Counseling',
      uc.remarks || null,
      uc.is_active !== undefined ? uc.is_active : 1
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] University course persist failed:', err.message);
    return false;
  }
}

/**
 * Persist University to Neon
 */
export async function persistUniversityToNeon(uni: any): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO universities (
        id, name, short_name, campus, city, state, country, university_type,
        accreditation, ranking, website, contact, description, status, is_active, is_demo, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        short_name = EXCLUDED.short_name,
        campus = EXCLUDED.campus,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        university_type = EXCLUDED.university_type,
        accreditation = EXCLUDED.accreditation,
        ranking = EXCLUDED.ranking,
        website = EXCLUDED.website,
        contact = EXCLUDED.contact,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `, [
      uni.id,
      uni.name,
      uni.short_name || '',
      uni.campus || '',
      uni.city,
      uni.state,
      uni.country || 'India',
      uni.university_type || 'Private',
      uni.accreditation || '',
      uni.ranking || '',
      uni.website || '',
      uni.contact || '',
      uni.description || '',
      uni.status || 'Active',
      uni.is_active !== undefined ? uni.is_active : 1,
      uni.is_demo ? 1 : 0
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] University persist failed:', err.message);
    return false;
  }
}

/**
 * Persist Course to Neon
 */
export async function persistCourseToNeon(course: any): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO courses (
        id, university_id, university_name, course_name, short_name, course_level, stream,
        degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info,
        intake, application_deadline, description, is_active, is_demo, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
      ON CONFLICT (id) DO UPDATE SET
        university_id = EXCLUDED.university_id,
        university_name = EXCLUDED.university_name,
        course_name = EXCLUDED.course_name,
        short_name = EXCLUDED.short_name,
        course_level = EXCLUDED.course_level,
        stream = EXCLUDED.stream,
        degree_level = EXCLUDED.degree_level,
        duration = EXCLUDED.duration,
        eligibility = EXCLUDED.eligibility,
        entrance_requirement = EXCLUDED.entrance_requirement,
        fees_range = EXCLUDED.fees_range,
        scholarship_info = EXCLUDED.scholarship_info,
        intake = EXCLUDED.intake,
        application_deadline = EXCLUDED.application_deadline,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `, [
      course.id,
      course.university_id || null,
      course.university_name || 'Multiple Universities',
      course.course_name,
      course.short_name || '',
      course.course_level || 'UG',
      course.stream || 'General',
      course.degree_level || 'Undergraduate',
      course.duration || '4 Years',
      course.eligibility || '',
      course.entrance_requirement || '',
      course.fees_range || '',
      course.scholarship_info || '',
      course.intake || 'Fall 2026',
      course.application_deadline || null,
      course.description || '',
      course.is_active !== undefined ? course.is_active : 1,
      course.is_demo ? 1 : 0
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] Course persist failed:', err.message);
    return false;
  }
}

/**
 * Persist Google Sheets Connection to Neon
 */
export async function persistGoogleSheetConnectionToNeon(conn: any): Promise<boolean> {
  if (!sql) return false;
  try {
    const lastSynced = conn.last_synced_at ? (isNaN(new Date(conn.last_synced_at).getTime()) ? null : new Date(conn.last_synced_at).toISOString()) : null;
    await sql.query(`
      INSERT INTO google_sheets_connections (
        id, name, sheet_url, spreadsheet_id, gid, sheet_name,
        campaign_tag, target_city, source_label, status,
        total_leads_imported, last_rows_count, last_synced_at,
        last_sync_status, last_sync_error, is_demo, column_mapping, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        sheet_url = EXCLUDED.sheet_url,
        spreadsheet_id = EXCLUDED.spreadsheet_id,
        gid = EXCLUDED.gid,
        sheet_name = EXCLUDED.sheet_name,
        campaign_tag = EXCLUDED.campaign_tag,
        target_city = EXCLUDED.target_city,
        source_label = EXCLUDED.source_label,
        status = EXCLUDED.status,
        total_leads_imported = EXCLUDED.total_leads_imported,
        last_rows_count = EXCLUDED.last_rows_count,
        last_synced_at = EXCLUDED.last_synced_at,
        last_sync_status = EXCLUDED.last_sync_status,
        last_sync_error = EXCLUDED.last_sync_error,
        is_demo = EXCLUDED.is_demo,
        column_mapping = EXCLUDED.column_mapping,
        updated_at = NOW()
    `, [
      conn.id,
      conn.name || 'Google Sheet',
      conn.sheet_url,
      conn.spreadsheet_id || '',
      conn.gid || '0',
      conn.sheet_name || 'Leads 2026',
      conn.campaign_tag || null,
      conn.target_city || null,
      conn.source_label || 'Google Sheets',
      conn.status || 'ACTIVE',
      Number(conn.total_leads_imported) || 0,
      Number(conn.last_rows_count) || 0,
      lastSynced,
      conn.last_sync_status || null,
      conn.last_sync_error || null,
      conn.is_demo ? 1 : 0,
      conn.column_mapping || null
    ]);
    return true;
  } catch (err: any) {
    console.error('[Neon Persist] Google Sheet connection persist failed:', err.message);
    return false;
  }
}

/**
 * Delete a Google Sheet connection permanently from Neon
 */
export async function deleteGoogleSheetConnectionFromNeon(id: string): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM google_sheets_connections WHERE id = $1`, [id]);
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Google Sheet connection delete failed:', err.message);
    return false;
  }
}

/**
 * Find a Google Sheet connection in Neon by ID
 */
export async function findGoogleSheetInNeon(id: string): Promise<any | null> {
  if (!sql) return null;
  try {
    const rows = await sql.query(`SELECT * FROM google_sheets_connections WHERE id = $1 LIMIT 1`, [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err: any) {
    console.error('[Neon Query] Find Google Sheet failed:', err.message);
    return null;
  }
}

/**
 * Get all Google Sheet connections from Neon
 */
export async function getAllGoogleSheetsFromNeon(): Promise<any[]> {
  if (!sql) return [];
  try {
    return await sql.query(`SELECT * FROM google_sheets_connections ORDER BY created_at DESC`);
  } catch (err: any) {
    console.error('[Neon Query] Get all Google Sheets failed:', err.message);
    return [];
  }
}

/**
 * Synchronize all tables from Neon PostgreSQL into local SQLite
 * This ensures full persistence across serverless cold starts and restarts.
 */
export async function syncFromNeonToSQLite(db: any): Promise<void> {
  if (!sql) return;
  try {
    console.log('🔄 [Neon Sync] Synchronizing server-side data from Neon PostgreSQL to SQLite cache...');

    // Ensure Neon PostgreSQL schema columns exist
    try {
      await sql.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]';
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS specialization_courses TEXT DEFAULT '[]';
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS specialization_universities TEXT DEFAULT '[]';
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS daily_lead_quota INTEGER DEFAULT 25;
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS leads_assigned_today INTEGER DEFAULT 0;
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS last_assigned_date TEXT;
      `);
    } catch (migrErr: any) {
      // Columns may already exist
    }

    // 1. Sync Deleted Records (Tombstones) First - Prevents resurrecting any deleted records
    const tombstones = await sql.query('SELECT * FROM deleted_records');
    const tombstoneEntities = new Set<string>();
    const tombstoneIdentifiers = new Set<string>();

    if (tombstones && tombstones.length > 0) {
      const insertTombstone = db.prepare(`
        INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of tombstones) {
        insertTombstone.run(t.id, t.entity_type, t.entity_id, t.identifier, t.details, t.deleted_by, String(t.deleted_at));
        tombstoneEntities.add(`${t.entity_type}:${t.entity_id}`);
        if (t.identifier) tombstoneIdentifiers.add(String(t.identifier).toLowerCase().trim());
      }
      console.log(`[Neon Sync] Loaded ${tombstones.length} tombstone records from Neon.`);
    }

    // 2. Sync Users (filtering tombstones)
    const users = await sql.query('SELECT * FROM users');
    if (users && users.length > 0) {
      const upsertUser = db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, is_active, permissions, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          password_hash = excluded.password_hash,
          role = excluded.role,
          phone = excluded.phone,
          avatar_url = excluded.avatar_url,
          is_active = excluded.is_active,
          permissions = COALESCE(excluded.permissions, users.permissions),
          updated_at = excluded.updated_at
      `);
      for (const u of users) {
        if (tombstoneEntities.has('user:' + u.id) || tombstoneIdentifiers.has(u.email?.toLowerCase())) {
          db.prepare('DELETE FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').run(u.id, u.email);
          continue;
        }
        if (u.email) {
          db.prepare('DELETE FROM users WHERE LOWER(email) = LOWER(?) AND id != ?').run(u.email, u.id);
        }
        upsertUser.run(
          u.id, u.name, u.email, u.password_hash, u.role, u.phone, u.avatar_url,
          u.is_active, u.permissions ? (typeof u.permissions === 'string' ? u.permissions : JSON.stringify(u.permissions)) : '[]',
          String(u.created_at), String(u.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${users.length} users from Neon.`);
    }

    // 3. Sync Counselors (filtering tombstones)
    const counselors = await sql.query('SELECT * FROM counselors');
    if (counselors && counselors.length > 0) {
      const upsertCounselor = db.prepare(`
        INSERT INTO counselors (
          id, user_id, name, email, phone, specialization_country, assigned_cities,
          is_active, max_capacity, current_active_leads, total_assigned_leads,
          total_admissions, conversion_rate, username, joining_date, status,
          specialization_courses, specialization_universities, daily_lead_quota, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          phone = excluded.phone,
          is_active = excluded.is_active,
          username = excluded.username,
          status = excluded.status,
          specialization_courses = COALESCE(excluded.specialization_courses, counselors.specialization_courses),
          specialization_universities = COALESCE(excluded.specialization_universities, counselors.specialization_universities),
          daily_lead_quota = COALESCE(excluded.daily_lead_quota, counselors.daily_lead_quota),
          updated_at = excluded.updated_at
      `);
      for (const c of counselors) {
        if (tombstoneEntities.has('counselor:' + c.id) || tombstoneIdentifiers.has(c.email?.toLowerCase())) {
          db.prepare('DELETE FROM counselors WHERE id = ? OR LOWER(email) = LOWER(?)').run(c.id, c.email);
          continue;
        }
        if (c.email) {
          db.prepare('DELETE FROM counselors WHERE LOWER(email) = LOWER(?) AND id != ?').run(c.email, c.id);
        }
        upsertCounselor.run(
          c.id, c.user_id, c.name, c.email, c.phone, c.specialization_country,
          typeof c.assigned_cities === 'string' ? c.assigned_cities : JSON.stringify(c.assigned_cities || []),
          c.is_active, c.max_capacity, c.current_active_leads, c.total_assigned_leads,
          c.total_admissions, Number(c.conversion_rate) || 0, c.username, c.joining_date, c.status,
          c.specialization_courses ? (typeof c.specialization_courses === 'string' ? c.specialization_courses : JSON.stringify(c.specialization_courses)) : '[]',
          c.specialization_universities ? (typeof c.specialization_universities === 'string' ? c.specialization_universities : JSON.stringify(c.specialization_universities)) : '[]',
          c.daily_lead_quota || 25,
          String(c.created_at), String(c.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${counselors.length} counselors from Neon.`);
    }

    // 4. Sync Leads (filtering tombstones)
    const leads = await sql.query('SELECT * FROM leads WHERE is_deleted = 0');
    if (leads && leads.length > 0) {
      const upsertLead = db.prepare(`
        INSERT INTO leads (
          id, lead_id, student_name, first_name, last_name, phone, whatsapp_number, email,
          parent_name, school_college, passing_year, gender, date_of_birth, country, state, city,
          address, academic_qualification, percentage_10th, percentage_12th, graduation_percentage,
          entrance_exam, entrance_score, preferred_course, preferred_university, second_university,
          budget, scholarship_required, lead_source, campaign, ad_set, ad, facebook_lead_id,
          lead_created_date, assigned_counselor_id, assigned_counselor_name, lead_status,
          lead_temperature, priority, last_contact_date, next_follow_up_date, remarks,
          created_by, updated_by, is_converted_to_student, is_deleted, is_demo, created_at, updated_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT (id) DO UPDATE SET
          student_name = excluded.student_name,
          phone = excluded.phone,
          email = excluded.email,
          lead_status = excluded.lead_status,
          lead_temperature = excluded.lead_temperature,
          priority = excluded.priority,
          assigned_counselor_id = excluded.assigned_counselor_id,
          assigned_counselor_name = excluded.assigned_counselor_name,
          updated_at = excluded.updated_at
      `);
      for (const l of leads) {
        if (tombstoneEntities.has('lead:' + l.id) || (l.phone && tombstoneIdentifiers.has(l.phone)) || (l.email && tombstoneIdentifiers.has(l.email.toLowerCase()))) {
          db.prepare('DELETE FROM leads WHERE id = ?').run(l.id);
          continue;
        }
        upsertLead.run(
          l.id, l.lead_id || ('LD-' + l.id), l.student_name, l.first_name || l.student_name || 'Student', l.last_name || '', l.phone, l.whatsapp_number || l.phone, l.email,
          l.parent_name, l.school_college, l.passing_year, l.gender, l.date_of_birth, l.country || 'Nepal', l.state, l.city || 'Kathmandu',
          l.address, l.academic_qualification, l.percentage_10th, l.percentage_12th, l.graduation_percentage,
          l.entrance_exam, l.entrance_score, l.preferred_course, l.preferred_university, l.second_university,
          l.budget, l.scholarship_required, l.lead_source, l.campaign, l.ad_set, l.ad, l.facebook_lead_id,
          String(l.lead_created_date), l.assigned_counselor_id, l.assigned_counselor_name, l.lead_status,
          l.lead_temperature, l.priority, l.last_contact_date ? String(l.last_contact_date) : null,
          l.next_follow_up_date ? String(l.next_follow_up_date) : null, l.remarks,
          l.created_by, l.updated_by, l.is_converted_to_student, l.is_deleted, l.is_demo,
          String(l.created_at), String(l.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${leads.length} active leads from Neon.`);
    }

    // 5. Sync Universities
    const universities = await sql.query('SELECT * FROM universities');
    if (universities && universities.length > 0) {
      const upsertUni = db.prepare(`
        INSERT INTO universities (id, name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status, is_active, is_demo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET 
          name = excluded.name,
          short_name = excluded.short_name,
          campus = excluded.campus,
          city = excluded.city,
          state = excluded.state,
          country = excluded.country,
          university_type = excluded.university_type,
          accreditation = excluded.accreditation,
          ranking = excluded.ranking,
          website = excluded.website,
          contact = excluded.contact,
          description = excluded.description,
          status = excluded.status,
          is_active = excluded.is_active,
          is_demo = excluded.is_demo,
          updated_at = excluded.updated_at
      `);
      for (const u of universities) {
        if (tombstoneEntities.has('university:' + u.id)) {
          db.prepare('DELETE FROM universities WHERE id = ?').run(u.id);
          continue;
        }
        if (u.name) {
          db.prepare('DELETE FROM universities WHERE LOWER(name) = LOWER(?) AND id != ?').run(u.name, u.id);
        }
        upsertUni.run(
          u.id, u.name, u.short_name, u.campus, u.city, u.state, u.country, u.university_type,
          u.accreditation, u.ranking, u.website, u.contact, u.description, u.status, u.is_active,
          u.is_demo, String(u.created_at), String(u.updated_at)
        );
      }
    }

    // 6. Sync Google Sheets Connections
    const gsheets = await sql.query('SELECT * FROM google_sheets_connections');
    if (gsheets && gsheets.length > 0) {
      const upsertGSheet = db.prepare(`
        INSERT INTO google_sheets_connections (
          id, name, sheet_url, spreadsheet_id, gid, sheet_name,
          campaign_tag, target_city, source_label, status,
          total_leads_imported, last_rows_count, last_synced_at,
          last_sync_status, last_sync_error, is_demo, column_mapping, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = excluded.name,
          sheet_url = excluded.sheet_url,
          spreadsheet_id = excluded.spreadsheet_id,
          gid = excluded.gid,
          sheet_name = excluded.sheet_name,
          campaign_tag = excluded.campaign_tag,
          target_city = excluded.target_city,
          source_label = excluded.source_label,
          status = excluded.status,
          total_leads_imported = excluded.total_leads_imported,
          last_rows_count = excluded.last_rows_count,
          last_synced_at = excluded.last_synced_at,
          last_sync_status = excluded.last_sync_status,
          last_sync_error = excluded.last_sync_error,
          is_demo = excluded.is_demo,
          column_mapping = excluded.column_mapping,
          updated_at = excluded.updated_at
      `);
      for (const g of gsheets) {
        if (tombstoneEntities.has('google_sheet:' + g.id)) {
          db.prepare('DELETE FROM google_sheets_connections WHERE id = ?').run(g.id);
          continue;
        }
        upsertGSheet.run(
          g.id, g.name, g.sheet_url, g.spreadsheet_id, g.gid, g.sheet_name,
          g.campaign_tag, g.target_city, g.source_label, g.status || 'ACTIVE',
          Number(g.total_leads_imported) || 0, Number(g.last_rows_count) || 0,
          g.last_synced_at ? String(g.last_synced_at) : null,
          g.last_sync_status, g.last_sync_error, g.is_demo || 0,
          g.column_mapping, String(g.created_at), String(g.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${gsheets.length} Google Sheet connections from Neon.`);
    }

    // 7. Sync HR Employees (filtering tombstones)
    try {
      const emps = await sql.query('SELECT * FROM hr_employees');
      if (emps && emps.length > 0) {
        const upsertEmp = db.prepare(`
          INSERT INTO hr_employees (
            id, employee_code, user_id, counselor_id, full_name, email, phone,
            department, designation, employment_type, joining_date, monthly_salary,
            currency, bank_name, account_number, pan_number, emergency_contact, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            full_name = excluded.full_name,
            email = excluded.email,
            phone = excluded.phone,
            department = excluded.department,
            designation = excluded.designation,
            monthly_salary = excluded.monthly_salary,
            status = excluded.status,
            updated_at = excluded.updated_at
        `);
        for (const e of emps) {
          if (tombstoneEntities.has('hr_employee:' + e.id) || tombstoneIdentifiers.has(e.email?.toLowerCase())) {
            db.prepare('DELETE FROM hr_employees WHERE id = ?').run(e.id);
            continue;
          }
          upsertEmp.run(
            e.id, e.employee_code, e.user_id, e.counselor_id, e.full_name, e.email, e.phone,
            e.department, e.designation, e.employment_type, e.joining_date, Number(e.monthly_salary) || 0,
            e.currency || 'NPR', e.bank_name, e.account_number, e.pan_number, e.emergency_contact,
            e.status || 'Active', String(e.created_at), String(e.updated_at)
          );
        }
        console.log(`[Neon Sync] Synced ${emps.length} HR employees from Neon.`);
      }
    } catch (empSyncErr: any) {}

    // 8. Sync Finance Transactions (filtering tombstones)
    try {
      const txns = await sql.query('SELECT * FROM finance_transactions');
      if (txns && txns.length > 0) {
        const upsertTxn = db.prepare(`
          INSERT INTO finance_transactions (
            id, transaction_id, type, category, title, amount, currency,
            transaction_date, payment_method, reference_number, student_id, student_name,
            university_id, university_name, status, notes, recorded_by, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            type = excluded.type,
            category = excluded.category,
            title = excluded.title,
            amount = excluded.amount,
            status = excluded.status,
            updated_at = excluded.updated_at
        `);
        for (const tx of txns) {
          if (tombstoneEntities.has('finance_transaction:' + tx.id)) {
            db.prepare('DELETE FROM finance_transactions WHERE id = ?').run(tx.id);
            continue;
          }
          upsertTxn.run(
            tx.id, tx.transaction_id, tx.type, tx.category, tx.title, Number(tx.amount) || 0,
            tx.currency || 'NPR', tx.transaction_date, tx.payment_method, tx.reference_number,
            tx.student_id, tx.student_name, tx.university_id, tx.university_name,
            tx.status || 'Completed', tx.notes, tx.recorded_by, String(tx.created_at), String(tx.updated_at)
          );
        }
        console.log(`[Neon Sync] Synced ${txns.length} finance transactions from Neon.`);
      }
    } catch (txnSyncErr: any) {}

    // 9. Sync Finance Invoices (filtering tombstones)
    try {
      const invs = await sql.query('SELECT * FROM finance_invoices');
      if (invs && invs.length > 0) {
        const upsertInv = db.prepare(`
          INSERT INTO finance_invoices (
            id, invoice_number, invoice_type, recipient_name, recipient_email, recipient_phone,
            total_amount, paid_amount, due_amount, currency, due_date, status, items, notes,
            student_id, university_id, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            paid_amount = excluded.paid_amount,
            due_amount = excluded.due_amount,
            status = excluded.status,
            updated_at = excluded.updated_at
        `);
        for (const inv of invs) {
          if (tombstoneEntities.has('finance_invoice:' + inv.id)) {
            db.prepare('DELETE FROM finance_invoices WHERE id = ?').run(inv.id);
            continue;
          }
          upsertInv.run(
            inv.id, inv.invoice_number, inv.invoice_type, inv.recipient_name, inv.recipient_email, inv.recipient_phone,
            Number(inv.total_amount) || 0, Number(inv.paid_amount) || 0, Number(inv.due_amount) || 0,
            inv.currency || 'NPR', inv.due_date, inv.status || 'Pending',
            typeof inv.items === 'string' ? inv.items : JSON.stringify(inv.items || []),
            inv.notes, inv.student_id, inv.university_id, String(inv.created_at), String(inv.updated_at)
          );
        }
        console.log(`[Neon Sync] Synced ${invs.length} finance invoices from Neon.`);
      }
    } catch (invSyncErr: any) {}

    console.log('✅ [Neon Sync] Synchronization complete!');
  } catch (err: any) {
    console.error('[Neon Sync] Background sync failed:', err.message);
  }
}
