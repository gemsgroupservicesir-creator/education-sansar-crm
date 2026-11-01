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
  username TEXT,
  joining_date TEXT DEFAULT (date('now')),
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Universities table
CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  short_name TEXT,
  campus TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  university_type TEXT NOT NULL DEFAULT 'Private', -- 'Private', 'Government', 'Deemed', 'Autonomous', 'Other'
  accreditation TEXT,
  ranking TEXT,
  website TEXT,
  contact TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  is_active INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Courses table (Master Courses)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  university_id TEXT REFERENCES universities(id) ON DELETE CASCADE,
  university_name TEXT,
  course_name TEXT NOT NULL,
  short_name TEXT,
  course_level TEXT NOT NULL DEFAULT 'UG', -- 'UG', 'PG', 'Diploma', 'PhD', 'Other'
  degree_level TEXT NOT NULL DEFAULT 'Undergraduate',
  stream TEXT NOT NULL DEFAULT 'Engineering', -- 'Engineering', 'Management', 'Commerce', 'Computer Science', 'Medical', 'Law', 'Arts', 'Science', 'Other'
  duration TEXT NOT NULL DEFAULT '4 Years',
  eligibility TEXT,
  entrance_requirement TEXT,
  fees_range TEXT, -- Indicative/demo range
  scholarship_info TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  intake TEXT DEFAULT 'Fall 2026',
  application_deadline TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_demo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6b. University Courses & Fees junction (Structured University -> Course -> Fee relationship)
CREATE TABLE IF NOT EXISTS university_courses (
  id TEXT PRIMARY KEY,
  university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tuition_fee_per_year REAL NOT NULL DEFAULT 0.0,
  hostel_fee_per_year REAL NOT NULL DEFAULT 0.0,
  one_time_fee REAL NOT NULL DEFAULT 0.0,
  other_charges REAL NOT NULL DEFAULT 0.0,
  total_first_year_fee REAL NOT NULL DEFAULT 0.0,
  total_full_course_fee REAL DEFAULT 0.0,
  currency TEXT NOT NULL DEFAULT 'INR',
  eligibility_notes TEXT,
  scholarship_available INTEGER NOT NULL DEFAULT 1,
  scholarship_details TEXT,
  application_deadline TEXT,
  admission_process TEXT DEFAULT 'Direct Merit / Counseling',
  remarks TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  -- Legacy compatibility fields
  tuition_fee REAL NOT NULL DEFAULT 0.0,
  hostel_fee REAL NOT NULL DEFAULT 0.0,
  other_fees REAL NOT NULL DEFAULT 0.0,
  total_fee REAL NOT NULL DEFAULT 0.0,
  duration TEXT NOT NULL DEFAULT '4 Years',
  eligibility TEXT,
  application_fee REAL NOT NULL DEFAULT 0.0,
  admission_deadline TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_uc_uni ON university_courses(university_id);
CREATE INDEX IF NOT EXISTS idx_uc_course ON university_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_uc_total_first_year ON university_courses(total_first_year_fee);
CREATE INDEX IF NOT EXISTS idx_uc_tuition ON university_courses(tuition_fee_per_year);
CREATE INDEX IF NOT EXISTS idx_uc_active ON university_courses(is_active);

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
  parent_name TEXT, -- Father's / Mother's Name
  academic_qualification TEXT,
  school_college TEXT, -- School / College
  passing_year TEXT, -- Passing Year
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
  priority TEXT NOT NULL DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
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
  category TEXT NOT NULL, -- 'WELCOME', 'COUNSELOR_INTRO', 'FOLLOWUP_REMINDER', 'DOCUMENT_REMINDER', 'FEE_REMINDER', 'ADMISSION_CONFIRMATION', 'COURSE_PROSPECTUS', 'SCHOLARSHIP_OFFER', 'UNIVERSITY_INVITE'
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT DEFAULT '[]', -- JSON array of var names e.g. ["student_name", "preferred_course"]
  target_courses TEXT DEFAULT '[]', -- JSON array of courses e.g. ["B.Tech", "MBBS", "MBA"]
  target_universities TEXT DEFAULT '[]', -- JSON array of partner universities e.g. ["Sharda University"]
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 19b. Bulk Email Campaigns & History
CREATE TABLE IF NOT EXISTS bulk_email_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template_id TEXT REFERENCES message_templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  filter_course TEXT,
  filter_university TEXT,
  filter_status TEXT,
  filter_temperature TEXT,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'COMPLETED', -- 'QUEUED', 'SENDING', 'COMPLETED', 'FAILED'
  channel TEXT NOT NULL DEFAULT 'Email', -- 'Email', 'WhatsApp'
  sent_by TEXT NOT NULL DEFAULT 'Super Admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 20. Messages log
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'WhatsApp',
  recipient TEXT NOT NULL,
  sender TEXT NOT NULL DEFAULT 'Gems Group Services',
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

-- 21b. Multiple Google Sheets connections
CREATE TABLE IF NOT EXISTS google_sheets_connections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sheet_url TEXT NOT NULL,
  spreadsheet_id TEXT NOT NULL,
  gid TEXT NOT NULL DEFAULT '0',
  sheet_name TEXT DEFAULT 'Leads 2026',
  campaign_tag TEXT,
  target_city TEXT,
  source_label TEXT DEFAULT 'Google Sheets',
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED'
  total_leads_imported INTEGER NOT NULL DEFAULT 0,
  last_rows_count INTEGER NOT NULL DEFAULT 0,
  last_synced_at TEXT,
  last_sync_status TEXT, -- 'SUCCESS', 'WARN', 'ERROR'
  last_sync_error TEXT,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gsheet_status ON google_sheets_connections(status);

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

-- 25. Deleted records tombstone (prevents sync resurrection of permanently deleted records)
CREATE TABLE IF NOT EXISTS deleted_records (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'lead', 'counselor', 'university', 'course', 'university_course', 'google_sheet'
  entity_id TEXT NOT NULL,
  identifier TEXT, -- phone, email, or key for deduplication suppression
  details TEXT,
  deleted_by TEXT DEFAULT 'System',
  deleted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_del_rec_ident ON deleted_records(identifier);
CREATE INDEX IF NOT EXISTS idx_del_rec_entity ON deleted_records(entity_type, entity_id);

-- 26. Automated Lead Distribution Rules (Course & University)
CREATE TABLE IF NOT EXISTS lead_routing_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  course_keywords TEXT DEFAULT '[]', -- JSON array of strings e.g. ["B.Tech", "Engineering", "CSE"]
  university_keywords TEXT DEFAULT '[]', -- JSON array of strings e.g. ["SRM", "VIT", "Chandigarh"]
  target_cities TEXT DEFAULT '[]', -- JSON array of strings e.g. ["Kathmandu", "Birgunj"]
  counselor_id TEXT NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  counselor_name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  max_daily_leads INTEGER NOT NULL DEFAULT 20,
  is_active INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 27. HR Employees Directory
CREATE TABLE IF NOT EXISTS hr_employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT UNIQUE NOT NULL, -- e.g. EMP-001
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  counselor_id TEXT REFERENCES counselors(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Counseling', -- 'Counseling', 'Marketing', 'Admissions', 'Finance', 'HR', 'Administration'
  designation TEXT NOT NULL DEFAULT 'Education Counselor',
  employment_type TEXT NOT NULL DEFAULT 'Full-Time', -- 'Full-Time', 'Part-Time', 'Contract', 'Intern'
  joining_date TEXT NOT NULL DEFAULT (date('now')),
  monthly_salary REAL NOT NULL DEFAULT 0.0,
  currency TEXT NOT NULL DEFAULT 'NPR',
  bank_name TEXT,
  account_number TEXT,
  pan_number TEXT,
  emergency_contact TEXT,
  status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'On Leave', 'Resigned', 'Terminated'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 28. HR Daily Attendance Register
CREATE TABLE IF NOT EXISTS hr_attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT NOT NULL DEFAULT 'Present', -- 'Present', 'Absent', 'Half Day', 'On Leave', 'Holiday'
  check_in_time TEXT, -- HH:MM
  check_out_time TEXT, -- HH:MM
  work_mode TEXT NOT NULL DEFAULT 'Office', -- 'Office', 'Remote', 'Field Work'
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_emp_attendance_date ON hr_attendance(employee_id, date);

-- 29. HR Leave Applications & Approvals
CREATE TABLE IF NOT EXISTS hr_leaves (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'Casual Leave', -- 'Casual Leave', 'Sick Leave', 'Paid Leave', 'Unpaid Leave'
  start_date TEXT NOT NULL, -- YYYY-MM-DD
  end_date TEXT NOT NULL, -- YYYY-MM-DD
  days_count REAL NOT NULL DEFAULT 1.0,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  approved_by TEXT,
  approval_remarks TEXT,
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 30. HR Monthly Payroll & Salary Slips
CREATE TABLE IF NOT EXISTS hr_payroll (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  month_year TEXT NOT NULL, -- YYYY-MM
  base_salary REAL NOT NULL DEFAULT 0.0,
  incentives_bonus REAL NOT NULL DEFAULT 0.0, -- e.g. admission performance commission
  deductions REAL NOT NULL DEFAULT 0.0,
  net_salary REAL NOT NULL DEFAULT 0.0,
  currency TEXT NOT NULL DEFAULT 'NPR',
  payment_status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Paid'
  payment_date TEXT,
  payment_method TEXT DEFAULT 'Bank Transfer', -- 'Bank Transfer', 'Cash', 'Cheque'
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_emp_payroll_month ON hr_payroll(employee_id, month_year);

-- 31. Finance Transactions & General Ledger
CREATE TABLE IF NOT EXISTS finance_transactions (
  id TEXT PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL, -- TXN-2026-XXXX
  type TEXT NOT NULL, -- 'INCOME', 'EXPENSE'
  category TEXT NOT NULL, -- Income: 'Student Fee', 'University Commission', 'Consultancy Fee', 'Processing Fee'
                          -- Expense: 'Digital Ads (Meta/Google)', 'Office Rent', 'Salaries & Payroll', 'Event & Fair Expenses', 'Software & Tech', 'Utilities', 'Travel', 'Other'
  title TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0.0,
  currency TEXT NOT NULL DEFAULT 'NPR',
  transaction_date TEXT NOT NULL DEFAULT (date('now')),
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer', -- 'Bank Transfer', 'eSewa', 'Khalti', 'ConnectIPS', 'Cash', 'Cheque'
  reference_number TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  student_name TEXT,
  university_id TEXT REFERENCES universities(id) ON DELETE SET NULL,
  university_name TEXT,
  status TEXT NOT NULL DEFAULT 'Completed', -- 'Completed', 'Pending', 'Failed'
  notes TEXT,
  recorded_by TEXT DEFAULT 'Super Admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 32. Student & University Invoices
CREATE TABLE IF NOT EXISTS finance_invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL, -- INV-2026-XXXX
  invoice_type TEXT NOT NULL DEFAULT 'STUDENT_FEE', -- 'STUDENT_FEE', 'UNIVERSITY_COMMISSION'
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  total_amount REAL NOT NULL DEFAULT 0.0,
  paid_amount REAL NOT NULL DEFAULT 0.0,
  due_amount REAL NOT NULL DEFAULT 0.0,
  currency TEXT NOT NULL DEFAULT 'NPR',
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Cancelled'
  items TEXT NOT NULL DEFAULT '[]', -- JSON array of items: [{ description, qty, unit_price, amount }]
  notes TEXT,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  university_id TEXT REFERENCES universities(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
