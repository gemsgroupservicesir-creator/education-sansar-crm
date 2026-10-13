export const SCHEMA_SQL = `
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL REFERENCES roles(name),
  phone TEXT,
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. User roles junction
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 4. Counselors table
CREATE TABLE IF NOT EXISTS counselors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  specialization_country TEXT DEFAULT 'Nepal & India',
  assigned_cities TEXT DEFAULT '[]', -- JSON string of cities
  is_active INTEGER NOT NULL DEFAULT 1,
  max_capacity INTEGER NOT NULL DEFAULT 100,
  current_active_leads INTEGER NOT NULL DEFAULT 0,
  total_assigned_leads INTEGER NOT NULL DEFAULT 0,
  total_admissions INTEGER NOT NULL DEFAULT 0,
  conversion_rate REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Universities table
CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  campus TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  university_type TEXT NOT NULL DEFAULT 'Private',
  accreditation TEXT,
  ranking TEXT,
  website TEXT,
  contact TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Courses table
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  university_id TEXT REFERENCES universities(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  degree_level TEXT NOT NULL DEFAULT 'Undergraduate',
  duration TEXT NOT NULL DEFAULT '4 Years',
  eligibility TEXT,
  fees_range TEXT, -- Indicative/demo only
  scholarship_info TEXT,
  intake TEXT DEFAULT 'Fall 2026',
  application_deadline TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Leads table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  lead_id TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT NOT NULL,
  gender TEXT,
  date_of_birth TEXT,
  country TEXT NOT NULL DEFAULT 'Nepal',
  state TEXT,
  city TEXT NOT NULL,
  address TEXT,
  academic_qualification TEXT,
  percentage_10th REAL,
  percentage_12th REAL,
  graduation_percentage REAL,
  entrance_exam TEXT,
  entrance_score TEXT,
  preferred_course TEXT NOT NULL,
  preferred_university TEXT NOT NULL,
  second_university TEXT,
  budget TEXT,
  scholarship_required INTEGER NOT NULL DEFAULT 0,
  lead_source TEXT NOT NULL DEFAULT 'Meta Ads',
  campaign TEXT,
  ad_set TEXT,
  ad TEXT,
  facebook_lead_id TEXT,
  lead_created_date TEXT NOT NULL DEFAULT (datetime('now')),
  assigned_counselor_id TEXT REFERENCES counselors(id) ON DELETE SET NULL,
  assigned_counselor_name TEXT,
  lead_status TEXT NOT NULL DEFAULT 'New Lead',
  lead_temperature TEXT NOT NULL DEFAULT 'WARM',
  last_contact_date TEXT,
  next_follow_up_date TEXT,
  remarks TEXT,
  created_by TEXT DEFAULT 'System',
  updated_by TEXT DEFAULT 'System',
  is_converted_to_student INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Lead Activities timeline
CREATE TABLE IF NOT EXISTS lead_activities (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by TEXT NOT NULL DEFAULT 'System',
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 9. Lead status history
CREATE TABLE IF NOT EXISTS lead_status_history (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'System',
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. Lead assignments log
CREATE TABLE IF NOT EXISTS lead_assignments (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  previous_counselor_id TEXT,
  previous_counselor_name TEXT,
  new_counselor_id TEXT NOT NULL REFERENCES counselors(id),
  new_counselor_name TEXT NOT NULL,
  assignment_method TEXT NOT NULL DEFAULT 'Manual',
  assigned_by TEXT NOT NULL DEFAULT 'System',
  assigned_date TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. Followups table
CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  counselor_id TEXT REFERENCES counselors(id) ON DELETE SET NULL,
  follow_up_date TEXT NOT NULL, -- YYYY-MM-DD
  follow_up_time TEXT NOT NULL, -- HH:MM
  type TEXT NOT NULL DEFAULT 'Call',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  completed_at TEXT,
  created_by TEXT DEFAULT 'System',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. Students table (Enrolled leads converted to official student record)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  lead_id TEXT UNIQUE NOT NULL REFERENCES leads(id),
  student_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT NOT NULL,
  gender TEXT,
  date_of_birth TEXT,
  university TEXT NOT NULL,
  course TEXT NOT NULL,
  admission_date TEXT NOT NULL DEFAULT (date('now')),
  application_id TEXT,
  fee_paid REAL NOT NULL DEFAULT 0.0,
  counselor_id TEXT REFERENCES counselors(id),
  counselor_name TEXT,
  source TEXT NOT NULL DEFAULT 'Meta Ads',
  city TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Nepal',
  academic_details TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 13. Applications table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  application_id TEXT UNIQUE NOT NULL,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  university_id TEXT REFERENCES universities(id) ON DELETE SET NULL,
  university_name TEXT NOT NULL,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL,
  application_date TEXT NOT NULL DEFAULT (date('now')),
  application_status TEXT NOT NULL DEFAULT 'Application Started',
  application_fee REAL NOT NULL DEFAULT 0.0,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  application_number TEXT,
  deadline TEXT,
  counselor_id TEXT REFERENCES counselors(id) ON DELETE SET NULL,
  counselor_name TEXT,
  remarks TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 14. Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  application_id TEXT REFERENCES applications(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 102400,
  mime_type TEXT DEFAULT 'application/pdf',
  document_type TEXT NOT NULL DEFAULT '10th Marksheet',
  verification_status TEXT NOT NULL DEFAULT 'Pending',
  verification_notes TEXT,
  uploaded_by TEXT NOT NULL DEFAULT 'Counselor',
  upload_date TEXT NOT NULL DEFAULT (datetime('now')),
  verified_by TEXT,
  verified_at TEXT,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 15. Application Documents junction
CREATE TABLE IF NOT EXISTS application_documents (
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, document_id)
);

-- 16. Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Meta',
  university_focus TEXT,
  course_focus TEXT,
  target_city TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  budget REAL NOT NULL DEFAULT 0.0,
  spend REAL NOT NULL DEFAULT 0.0,
  leads_count INTEGER NOT NULL DEFAULT 0,
  applications_count INTEGER NOT NULL DEFAULT 0,
  admissions_count INTEGER NOT NULL DEFAULT 0,
  cost_per_lead REAL NOT NULL DEFAULT 0.0,
  cost_per_application REAL NOT NULL DEFAULT 0.0,
  cost_per_admission REAL NOT NULL DEFAULT 0.0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 17. Campaign leads junction
CREATE TABLE IF NOT EXISTS campaign_leads (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (campaign_id, lead_id)
);

-- 18. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  counselor_id TEXT REFERENCES counselors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'NEW_LEAD',
  entity_type TEXT,
  entity_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 19. Message templates
CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'WhatsApp', -- 'WhatsApp', 'Email', 'SMS'
  category TEXT NOT NULL, -- 'WELCOME', 'COUNSELOR_INTRO', 'FOLLOWUP_REMINDER', 'DOCUMENT_REMINDER', 'FEE_REMINDER', 'ADMISSION_CONFIRMATION'
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT DEFAULT '[]', -- JSON array of var names e.g. ["student_name", "counselor_name"]
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 20. Messages log
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WhatsApp',
  recipient TEXT NOT NULL,
  sender TEXT NOT NULL DEFAULT 'Education Sansar',
  template_id TEXT REFERENCES message_templates(id),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Sent', -- 'Queued', 'Sent', 'Delivered', 'Failed'
  metadata TEXT,
  sent_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 21. Integrations config table
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL, -- 'Meta', 'WhatsApp', 'Email'
  is_enabled INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NOT CONNECTED',
  config TEXT DEFAULT '{}', -- JSON config with credentials (encrypted/masked)
  last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 22. Integration logs
CREATE TABLE IF NOT EXISTS integration_logs (
  id TEXT PRIMARY KEY,
  integration_name TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'INBOUND', -- 'INBOUND', 'OUTBOUND'
  status TEXT NOT NULL, -- 'SUCCESS', 'ERROR', 'WARN'
  endpoint TEXT,
  payload TEXT,
  response TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 23. Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 24. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL DEFAULT 'System',
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- REQUIRED INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_counselor ON leads(assigned_counselor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_fb_id ON leads(facebook_lead_id);

CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_lead_id ON students(lead_id);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);

CREATE INDEX IF NOT EXISTS idx_applications_app_id ON applications(application_id);
CREATE INDEX IF NOT EXISTS idx_applications_lead_id ON applications(lead_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(application_status);

CREATE INDEX IF NOT EXISTS idx_followups_lead_id ON followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_counselor ON followups(counselor_id);
CREATE INDEX IF NOT EXISTS idx_followups_date ON followups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
`;
