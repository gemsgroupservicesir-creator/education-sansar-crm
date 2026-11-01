import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required in .env');
  process.exit(1);
}

const sql = neon(connectionString);

export async function initPostgres() {
  console.log('⚡ Initializing Neon PostgreSQL Schema...');

  const queries = [
    // 1. Roles table
    `CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 2. Users table (Login details stored securely server-side)
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 3. Counselors table
    `CREATE TABLE IF NOT EXISTS counselors (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      specialization_country TEXT DEFAULT 'Nepal & India',
      assigned_cities TEXT DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      max_capacity INTEGER NOT NULL DEFAULT 100,
      current_active_leads INTEGER NOT NULL DEFAULT 0,
      total_assigned_leads INTEGER NOT NULL DEFAULT 0,
      total_admissions INTEGER NOT NULL DEFAULT 0,
      conversion_rate NUMERIC NOT NULL DEFAULT 0.0,
      username TEXT,
      joining_date TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 4. Universities table
    `CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      short_name TEXT,
      campus TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      university_type TEXT NOT NULL DEFAULT 'Private',
      accreditation TEXT,
      ranking TEXT,
      website TEXT,
      contact TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 5. Courses table
    `CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      university_id TEXT,
      university_name TEXT,
      course_name TEXT NOT NULL,
      short_name TEXT,
      course_level TEXT NOT NULL DEFAULT 'UG',
      degree_level TEXT NOT NULL DEFAULT 'Undergraduate',
      stream TEXT NOT NULL DEFAULT 'Engineering',
      duration TEXT NOT NULL DEFAULT '4 Years',
      eligibility TEXT,
      entrance_requirement TEXT,
      fees_range TEXT,
      scholarship_info TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      intake TEXT DEFAULT 'Fall 2026',
      application_deadline TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 6. University Courses & Fees
    `CREATE TABLE IF NOT EXISTS university_courses (
      id TEXT PRIMARY KEY,
      university_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      tuition_fee_per_year NUMERIC DEFAULT 0.0,
      hostel_fee_per_year NUMERIC DEFAULT 0.0,
      one_time_fee NUMERIC DEFAULT 0.0,
      other_charges NUMERIC DEFAULT 0.0,
      total_first_year_fee NUMERIC DEFAULT 0.0,
      total_full_course_fee NUMERIC DEFAULT 0.0,
      currency TEXT DEFAULT 'INR',
      eligibility_notes TEXT,
      scholarship_available INTEGER DEFAULT 0,
      scholarship_details TEXT,
      application_deadline TEXT,
      admission_process TEXT DEFAULT 'Direct Merit / Counseling',
      remarks TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 7. Leads table (Stored server-side on Neon)
    `CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      lead_id TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT NOT NULL,
      whatsapp_number TEXT,
      email TEXT,
      parent_name TEXT,
      school_college TEXT,
      passing_year TEXT,
      gender TEXT,
      date_of_birth TEXT,
      country TEXT NOT NULL DEFAULT 'Nepal',
      state TEXT,
      city TEXT NOT NULL DEFAULT 'Kathmandu',
      address TEXT,
      academic_qualification TEXT,
      percentage_10th NUMERIC,
      percentage_12th NUMERIC,
      graduation_percentage NUMERIC,
      entrance_exam TEXT,
      entrance_score TEXT,
      preferred_course TEXT NOT NULL DEFAULT 'B.Tech',
      preferred_university TEXT NOT NULL DEFAULT 'SRM Institute of Science and Technology',
      second_university TEXT,
      budget TEXT,
      scholarship_required INTEGER NOT NULL DEFAULT 0,
      lead_source TEXT NOT NULL DEFAULT 'Direct Walk-in',
      campaign TEXT,
      ad_set TEXT,
      ad TEXT,
      facebook_lead_id TEXT,
      lead_created_date TIMESTAMPTZ DEFAULT NOW(),
      assigned_counselor_id TEXT,
      assigned_counselor_name TEXT,
      lead_status TEXT NOT NULL DEFAULT 'New Lead',
      lead_temperature TEXT NOT NULL DEFAULT 'WARM',
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      last_contact_date TIMESTAMPTZ,
      next_follow_up_date TIMESTAMPTZ,
      remarks TEXT,
      created_by TEXT NOT NULL DEFAULT 'System',
      updated_by TEXT,
      is_converted_to_student INTEGER NOT NULL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 8. Lead Activities
    `CREATE TABLE IF NOT EXISTS lead_activities (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      performed_by TEXT DEFAULT 'System',
      metadata TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 9. Followups
    `CREATE TABLE IF NOT EXISTS followups (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      counselor_id TEXT,
      counselor_name TEXT,
      scheduled_date TIMESTAMPTZ NOT NULL,
      follow_up_date TIMESTAMPTZ NOT NULL,
      follow_up_type TEXT DEFAULT 'Phone Call',
      status TEXT DEFAULT 'Scheduled',
      priority TEXT DEFAULT 'Medium',
      remarks TEXT,
      outcome_notes TEXT,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 10. Applications
    `CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL,
      lead_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      university_id TEXT,
      university_name TEXT NOT NULL,
      course_id TEXT,
      course_name TEXT NOT NULL,
      application_status TEXT NOT NULL DEFAULT 'Draft',
      intake TEXT DEFAULT 'Fall 2026',
      submission_date TIMESTAMPTZ,
      offer_letter_url TEXT,
      application_fee NUMERIC DEFAULT 0,
      fee_paid INTEGER DEFAULT 0,
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 11. Students
    `CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL,
      lead_id TEXT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      whatsapp_number TEXT,
      citizenship_number TEXT,
      passport_number TEXT,
      date_of_birth TEXT,
      city TEXT,
      country TEXT DEFAULT 'Nepal',
      enrolled_university_id TEXT,
      enrolled_university_name TEXT,
      enrolled_course_id TEXT,
      enrolled_course_name TEXT,
      intake_session TEXT,
      admission_date TEXT,
      fee_amount NUMERIC,
      counselor_id TEXT,
      counselor_name TEXT,
      status TEXT DEFAULT 'Enrolled',
      is_demo INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 12. Documents
    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      document_name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size TEXT,
      mime_type TEXT,
      status TEXT NOT NULL DEFAULT 'Uploaded',
      verified_by TEXT,
      rejection_reason TEXT,
      uploaded_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 13. Messages
    `CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      lead_id TEXT,
      channel TEXT NOT NULL DEFAULT 'WhatsApp',
      recipient TEXT NOT NULL,
      sender TEXT NOT NULL DEFAULT 'Gems Group Services',
      template_id TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Sent',
      metadata TEXT,
      sent_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 14. Message Templates
    `CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'WhatsApp',
      category TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      variables TEXT DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 15. Google Sheets Connections
    `CREATE TABLE IF NOT EXISTS google_sheets_connections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sheet_url TEXT NOT NULL,
      spreadsheet_id TEXT NOT NULL,
      gid TEXT NOT NULL DEFAULT '0',
      sheet_name TEXT DEFAULT 'Leads 2026',
      campaign_tag TEXT,
      target_city TEXT,
      source_label TEXT DEFAULT 'Google Sheets',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      total_leads_imported INTEGER NOT NULL DEFAULT 0,
      last_rows_count INTEGER NOT NULL DEFAULT 0,
      last_synced_at TIMESTAMPTZ,
      last_sync_status TEXT,
      last_sync_error TEXT,
      is_demo INTEGER NOT NULL DEFAULT 0,
      column_mapping TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 16. Integrations
    `CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      is_enabled INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'NOT CONNECTED',
      config TEXT DEFAULT '{}',
      last_sync_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 17. Integration logs
    `CREATE TABLE IF NOT EXISTS integration_logs (
      id TEXT PRIMARY KEY,
      integration_name TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'INBOUND',
      status TEXT NOT NULL,
      endpoint TEXT,
      payload TEXT,
      response TEXT,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 18. Settings
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 19. Audit logs
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL DEFAULT 'System',
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 20. Deleted records tombstone
    `CREATE TABLE IF NOT EXISTS deleted_records (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      identifier TEXT,
      details TEXT,
      deleted_by TEXT DEFAULT 'System',
      deleted_at TIMESTAMPTZ DEFAULT NOW()
    );`
  ];

  for (const q of queries) {
    await sql.query(q);
  }

  // Create Indexes
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);`,
    `CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);`,
    `CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id);`,
    `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);`,
    `CREATE INDEX IF NOT EXISTS idx_del_rec_ident ON deleted_records(identifier);`,
    `CREATE INDEX IF NOT EXISTS idx_del_rec_entity ON deleted_records(entity_type, entity_id);`
  ];
  for (const idx of indexes) {
    await sql.query(idx);
  }

  // Seed default roles
  const roles = [
    ['role-1', 'Super Admin', 'Full system access, administration, integrations and configuration'],
    ['role-2', 'Admin', 'Lead distribution, counselor supervision, reports, pipeline oversight'],
    ['role-3', 'Counselor', 'Assigned student counselling, notes, applications, document collection'],
    ['role-4', 'Telecaller', 'Calling leads, logging WhatsApp outreach, follow-up scheduling'],
    ['role-5', 'Marketing Manager', 'Campaigns, sources, ROI analytics, Meta lead ads sync'],
    ['role-6', 'Management', 'Executive reporting, counselor KPIs, admission revenue oversight']
  ];
  for (const r of roles) {
    await sql.query(
      `INSERT INTO roles (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [r[0], r[1], r[2]]
    );
  }

  // Seed Super Admin
  await sql.query(
    `INSERT INTO users (id, name, email, password_hash, role, phone, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    ['u-super', 'System Administrator', 'admin@educationsansar.com', 'admin123', 'Super Admin', '+977 9801234567', 1]
  );

  // Seed Message Templates
  const templates = [
    [
      'tmpl-1', 'Lead Welcome & Introduction', 'WhatsApp', 'WELCOME', null,
      'Namaste {{student_name}}! Welcome to Gems Group Services. We have received your inquiry for {{preferred_course}} at {{preferred_university}}. Your dedicated counselor is {{counselor_name}} (Phone: {{counselor_phone}}). We look forward to guiding you through admissions and scholarships!',
      '["student_name", "preferred_course", "preferred_university", "counselor_name", "counselor_phone"]', 1
    ],
    [
      'tmpl-2', 'Counselor Personal Introduction', 'WhatsApp', 'COUNSELOR_INTRO', null,
      'Hello {{student_name}}, this is {{counselor_name}} from Gems Group Services. I will be your official admission advisor for {{preferred_university}}. Are you free for a 10-minute briefing today at {{follow_up_time}}?',
      '["student_name", "counselor_name", "preferred_university", "follow_up_time"]', 1
    ]
  ];
  for (const t of templates) {
    await sql.query(
      `INSERT INTO message_templates (id, name, channel, category, subject, content, variables, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7]]
    );
  }

  // Seed System Settings
  const settings = [
    ['company_name', 'Gems Group Services', 'Official company legal name'],
    ['company_address', 'Sector 94, Noida, Uttar Pradesh 201313', 'Main office address'],
    ['company_phone', '+91 98100 12345 / +977 98012 34567', 'Official hotline phone'],
    ['company_email', 'admissions@gemsgroupservices.com', 'Official admissions email'],
    ['assignment_mode', 'Round Robin', 'Lead assignment strategy'],
    ['duplicate_check_strictness', 'Strict', 'Duplicate detection rules']
  ];
  for (const s of settings) {
    await sql.query(
      `INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [s[0], s[1], s[2]]
    );
  }

  console.log('✅ Neon PostgreSQL Database Initialized Successfully with Super Admin & Schema!');
}

initPostgres().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
