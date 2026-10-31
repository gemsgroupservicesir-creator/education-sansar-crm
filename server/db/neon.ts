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
  try {
    const rows = await sql.query(`
      SELECT * FROM users 
      WHERE (LOWER(email) = $1 OR id IN (SELECT user_id FROM counselors WHERE LOWER(username) = $1))
        AND is_active = 1
      LIMIT 1
    `, [clean]);
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
}): Promise<boolean> {
  if (!sql) return false;
  try {
    await sql.query(`
      INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, is_active, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `, [
      user.id,
      user.name,
      user.email.toLowerCase(),
      user.password_hash,
      user.role,
      user.phone || null,
      user.avatar_url || null,
      user.is_active !== undefined ? user.is_active : 1
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
    await sql.query(`
      INSERT INTO counselors (
        id, user_id, name, email, phone, specialization_country, assigned_cities,
        is_active, max_capacity, current_active_leads, total_assigned_leads,
        total_admissions, conversion_rate, username, joining_date, status, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
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
        updated_at = NOW()
    `, [
      counselor.id,
      counselor.user_id || null,
      counselor.name,
      counselor.email,
      counselor.phone,
      counselor.specialization_country || 'Nepal & India',
      counselor.assigned_cities || '[]',
      counselor.is_active !== undefined ? counselor.is_active : 1,
      counselor.max_capacity || 100,
      counselor.current_active_leads || 0,
      counselor.total_assigned_leads || 0,
      counselor.total_admissions || 0,
      counselor.conversion_rate || 0.0,
      counselor.username || counselor.email.split('@')[0],
      counselor.joining_date || new Date().toISOString(),
      counselor.status || 'Active'
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
    return true;
  } catch (err: any) {
    console.error('[Neon Delete] Counselor/User deletion failed:', err.message);
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
 * Synchronize all tables from Neon PostgreSQL into local SQLite
 * This ensures full persistence across serverless cold starts and restarts.
 */
export async function syncFromNeonToSQLite(db: any): Promise<void> {
  if (!sql) return;
  try {
    console.log('🔄 [Neon Sync] Synchronizing server-side data from Neon PostgreSQL to SQLite cache...');

    // 1. Sync Users
    const users = await sql.query('SELECT * FROM users');
    if (users && users.length > 0) {
      const upsertUser = db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, phone, avatar_url, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          password_hash = excluded.password_hash,
          role = excluded.role,
          phone = excluded.phone,
          avatar_url = excluded.avatar_url,
          is_active = excluded.is_active,
          updated_at = excluded.updated_at
      `);
      for (const u of users) {
        upsertUser.run(
          u.id, u.name, u.email, u.password_hash, u.role, u.phone, u.avatar_url,
          u.is_active, String(u.created_at), String(u.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${users.length} users from Neon.`);
    }

    // 2. Sync Counselors
    const counselors = await sql.query('SELECT * FROM counselors');
    if (counselors && counselors.length > 0) {
      const upsertCounselor = db.prepare(`
        INSERT INTO counselors (
          id, user_id, name, email, phone, specialization_country, assigned_cities,
          is_active, max_capacity, current_active_leads, total_assigned_leads,
          total_admissions, conversion_rate, username, joining_date, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          phone = excluded.phone,
          is_active = excluded.is_active,
          username = excluded.username,
          status = excluded.status,
          updated_at = excluded.updated_at
      `);
      for (const c of counselors) {
        upsertCounselor.run(
          c.id, c.user_id, c.name, c.email, c.phone, c.specialization_country,
          typeof c.assigned_cities === 'string' ? c.assigned_cities : JSON.stringify(c.assigned_cities || []),
          c.is_active, c.max_capacity, c.current_active_leads, c.total_assigned_leads,
          c.total_admissions, Number(c.conversion_rate) || 0, c.username, c.joining_date, c.status,
          String(c.created_at), String(c.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${counselors.length} counselors from Neon.`);
    }

    // 3. Sync Deleted Records (Tombstones) - Prevents resurrected leads
    const tombstones = await sql.query('SELECT * FROM deleted_records');
    if (tombstones && tombstones.length > 0) {
      const insertTombstone = db.prepare(`
        INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of tombstones) {
        insertTombstone.run(t.id, t.entity_type, t.entity_id, t.identifier, t.details, t.deleted_by, String(t.deleted_at));
      }
      console.log(`[Neon Sync] Synced ${tombstones.length} tombstone records from Neon.`);
    }

    // 4. Sync Leads
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
        upsertLead.run(
          l.id, l.lead_id, l.student_name, l.first_name, l.last_name, l.phone, l.whatsapp_number, l.email,
          l.parent_name, l.school_college, l.passing_year, l.gender, l.date_of_birth, l.country, l.state, l.city,
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

    // 5. Sync Universities & Courses & University Courses
    const universities = await sql.query('SELECT * FROM universities');
    if (universities && universities.length > 0) {
      const upsertUni = db.prepare(`
        INSERT INTO universities (id, name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status, is_active, is_demo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET name = excluded.name, status = excluded.status
      `);
      for (const u of universities) {
        upsertUni.run(
          u.id, u.name, u.short_name, u.campus, u.city, u.state, u.country, u.university_type,
          u.accreditation, u.ranking, u.website, u.contact, u.description, u.status, u.is_active,
          u.is_demo, String(u.created_at), String(u.updated_at)
        );
      }
    }

    console.log('✅ [Neon Sync] Synchronization complete!');
  } catch (err: any) {
    console.error('[Neon Sync] Background sync failed:', err.message);
  }
}
