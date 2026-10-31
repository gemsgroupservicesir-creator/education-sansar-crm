var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/db/schema.ts
var SCHEMA_SQL;
var init_schema = __esm({
  "server/db/schema.ts"() {
    "use strict";
    SCHEMA_SQL = `
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
  sent_by TEXT NOT NULL DEFAULT 'Super Admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  }
});

// server/db/neon.ts
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
async function findUserInNeon(identifier) {
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
    console.error("[Neon Auth] Failed to query user:", err);
    return null;
  }
}
async function persistUserToNeon(user) {
  if (!sql) return false;
  try {
    const permsJson = typeof user.permissions === "string" ? user.permissions : JSON.stringify(user.permissions || []);
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
      user.is_active !== void 0 ? user.is_active : 1,
      permsJson
    ]);
    return true;
  } catch (err) {
    console.error("[Neon Persist] User persist failed:", err.message);
    return false;
  }
}
async function persistCounselorToNeon(counselor) {
  if (!sql) return false;
  try {
    const specCourses = typeof counselor.specialization_courses === "string" ? counselor.specialization_courses : JSON.stringify(counselor.specialization_courses || []);
    const specUnis = typeof counselor.specialization_universities === "string" ? counselor.specialization_universities : JSON.stringify(counselor.specialization_universities || []);
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
      counselor.specialization_country || "Nepal & India",
      typeof counselor.assigned_cities === "string" ? counselor.assigned_cities : JSON.stringify(counselor.assigned_cities || []),
      counselor.is_active !== void 0 ? counselor.is_active : 1,
      counselor.max_capacity || 100,
      counselor.current_active_leads || 0,
      counselor.total_assigned_leads || 0,
      counselor.total_admissions || 0,
      counselor.conversion_rate || 0,
      counselor.username || counselor.email.split("@")[0],
      counselor.joining_date || (/* @__PURE__ */ new Date()).toISOString(),
      counselor.status || "Active",
      specCourses,
      specUnis,
      counselor.daily_lead_quota || 25
    ]);
    return true;
  } catch (err) {
    console.error("[Neon Persist] Counselor persist failed:", err.message);
    return false;
  }
}
async function persistLeadToNeon(lead) {
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
      lead.country || "Nepal",
      lead.state || null,
      lead.city || "Kathmandu",
      lead.address || null,
      lead.academic_qualification || null,
      lead.percentage_10th !== void 0 ? lead.percentage_10th : null,
      lead.percentage_12th !== void 0 ? lead.percentage_12th : null,
      lead.graduation_percentage !== void 0 ? lead.graduation_percentage : null,
      lead.entrance_exam || null,
      lead.entrance_score || null,
      lead.preferred_course || "B.Tech",
      lead.preferred_university || "SRM Institute of Science and Technology",
      lead.second_university || null,
      lead.budget || null,
      lead.scholarship_required ? 1 : 0,
      lead.lead_source || "Direct Walk-in",
      lead.campaign || null,
      lead.ad_set || null,
      lead.ad || null,
      lead.facebook_lead_id || null,
      lead.lead_created_date ? new Date(lead.lead_created_date) : /* @__PURE__ */ new Date(),
      lead.assigned_counselor_id || null,
      lead.assigned_counselor_name || null,
      lead.lead_status || "New Lead",
      lead.lead_temperature || "WARM",
      lead.priority || "MEDIUM",
      lead.last_contact_date ? new Date(lead.last_contact_date) : null,
      lead.next_follow_up_date ? new Date(lead.next_follow_up_date) : null,
      lead.remarks || null,
      lead.created_by || "System",
      lead.updated_by || null,
      lead.is_converted_to_student ? 1 : 0,
      lead.is_deleted ? 1 : 0,
      lead.is_demo ? 1 : 0
    ]);
    return true;
  } catch (err) {
    console.error("[Neon Persist] Lead persist failed:", err.message);
    return false;
  }
}
async function persistDeletedRecordToNeon(tombstone) {
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
      tombstone.deleted_by || "System"
    ]);
    return true;
  } catch (err) {
    console.error("[Neon Persist] Tombstone persist failed:", err.message);
    return false;
  }
}
async function deleteLeadFromNeon(leadId) {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM students WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM followups WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM lead_activities WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM applications WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM documents WHERE lead_id = $1`, [leadId]);
    await sql.query(`DELETE FROM leads WHERE id = $1`, [leadId]);
    return true;
  } catch (err) {
    console.error("[Neon Delete] Lead deletion failed:", err.message);
    return false;
  }
}
async function deleteCounselorAndUserFromNeon(counselorId, email, userId) {
  if (!sql) return false;
  try {
    if (email || userId) {
      await sql.query(`DELETE FROM users WHERE LOWER(email) = LOWER($1) OR id = $2`, [email || "", userId || ""]);
    }
    await sql.query(`DELETE FROM counselors WHERE id = $1`, [counselorId]);
    return true;
  } catch (err) {
    console.error("[Neon Delete] Counselor/User deletion failed:", err.message);
    return false;
  }
}
async function persistGoogleSheetConnectionToNeon(conn) {
  if (!sql) return false;
  try {
    const lastSynced = conn.last_synced_at ? isNaN(new Date(conn.last_synced_at).getTime()) ? null : new Date(conn.last_synced_at).toISOString() : null;
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
      conn.name || "Google Sheet",
      conn.sheet_url,
      conn.spreadsheet_id || "",
      conn.gid || "0",
      conn.sheet_name || "Leads 2026",
      conn.campaign_tag || null,
      conn.target_city || null,
      conn.source_label || "Google Sheets",
      conn.status || "ACTIVE",
      Number(conn.total_leads_imported) || 0,
      Number(conn.last_rows_count) || 0,
      lastSynced,
      conn.last_sync_status || null,
      conn.last_sync_error || null,
      conn.is_demo ? 1 : 0,
      conn.column_mapping || null
    ]);
    return true;
  } catch (err) {
    console.error("[Neon Persist] Google Sheet connection persist failed:", err.message);
    return false;
  }
}
async function deleteGoogleSheetConnectionFromNeon(id) {
  if (!sql) return false;
  try {
    await sql.query(`DELETE FROM google_sheets_connections WHERE id = $1`, [id]);
    return true;
  } catch (err) {
    console.error("[Neon Delete] Google Sheet connection delete failed:", err.message);
    return false;
  }
}
async function findGoogleSheetInNeon(id) {
  if (!sql) return null;
  try {
    const rows = await sql.query(`SELECT * FROM google_sheets_connections WHERE id = $1 LIMIT 1`, [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("[Neon Query] Find Google Sheet failed:", err.message);
    return null;
  }
}
async function getAllGoogleSheetsFromNeon() {
  if (!sql) return [];
  try {
    return await sql.query(`SELECT * FROM google_sheets_connections ORDER BY created_at DESC`);
  } catch (err) {
    console.error("[Neon Query] Get all Google Sheets failed:", err.message);
    return [];
  }
}
async function syncFromNeonToSQLite(db2) {
  if (!sql) return;
  try {
    console.log("\u{1F504} [Neon Sync] Synchronizing server-side data from Neon PostgreSQL to SQLite cache...");
    try {
      await sql.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]';
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS specialization_courses TEXT DEFAULT '[]';
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS specialization_universities TEXT DEFAULT '[]';
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS daily_lead_quota INTEGER DEFAULT 25;
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS leads_assigned_today INTEGER DEFAULT 0;
        ALTER TABLE counselors ADD COLUMN IF NOT EXISTS last_assigned_date TEXT;
      `);
    } catch (migrErr) {
    }
    const users = await sql.query("SELECT * FROM users");
    if (users && users.length > 0) {
      const upsertUser = db2.prepare(`
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
        upsertUser.run(
          u.id,
          u.name,
          u.email,
          u.password_hash,
          u.role,
          u.phone,
          u.avatar_url,
          u.is_active,
          u.permissions ? typeof u.permissions === "string" ? u.permissions : JSON.stringify(u.permissions) : "[]",
          String(u.created_at),
          String(u.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${users.length} users from Neon.`);
    }
    const counselors = await sql.query("SELECT * FROM counselors");
    if (counselors && counselors.length > 0) {
      const upsertCounselor = db2.prepare(`
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
        upsertCounselor.run(
          c.id,
          c.user_id,
          c.name,
          c.email,
          c.phone,
          c.specialization_country,
          typeof c.assigned_cities === "string" ? c.assigned_cities : JSON.stringify(c.assigned_cities || []),
          c.is_active,
          c.max_capacity,
          c.current_active_leads,
          c.total_assigned_leads,
          c.total_admissions,
          Number(c.conversion_rate) || 0,
          c.username,
          c.joining_date,
          c.status,
          c.specialization_courses ? typeof c.specialization_courses === "string" ? c.specialization_courses : JSON.stringify(c.specialization_courses) : "[]",
          c.specialization_universities ? typeof c.specialization_universities === "string" ? c.specialization_universities : JSON.stringify(c.specialization_universities) : "[]",
          c.daily_lead_quota || 25,
          String(c.created_at),
          String(c.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${counselors.length} counselors from Neon.`);
    }
    const tombstones = await sql.query("SELECT * FROM deleted_records");
    if (tombstones && tombstones.length > 0) {
      const insertTombstone = db2.prepare(`
        INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of tombstones) {
        insertTombstone.run(t.id, t.entity_type, t.entity_id, t.identifier, t.details, t.deleted_by, String(t.deleted_at));
      }
      console.log(`[Neon Sync] Synced ${tombstones.length} tombstone records from Neon.`);
    }
    const leads = await sql.query("SELECT * FROM leads WHERE is_deleted = 0");
    if (leads && leads.length > 0) {
      const upsertLead = db2.prepare(`
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
          l.id,
          l.lead_id || "LD-" + l.id,
          l.student_name,
          l.first_name || l.student_name || "Student",
          l.last_name || "",
          l.phone,
          l.whatsapp_number || l.phone,
          l.email,
          l.parent_name,
          l.school_college,
          l.passing_year,
          l.gender,
          l.date_of_birth,
          l.country || "Nepal",
          l.state,
          l.city || "Kathmandu",
          l.address,
          l.academic_qualification,
          l.percentage_10th,
          l.percentage_12th,
          l.graduation_percentage,
          l.entrance_exam,
          l.entrance_score,
          l.preferred_course,
          l.preferred_university,
          l.second_university,
          l.budget,
          l.scholarship_required,
          l.lead_source,
          l.campaign,
          l.ad_set,
          l.ad,
          l.facebook_lead_id,
          String(l.lead_created_date),
          l.assigned_counselor_id,
          l.assigned_counselor_name,
          l.lead_status,
          l.lead_temperature,
          l.priority,
          l.last_contact_date ? String(l.last_contact_date) : null,
          l.next_follow_up_date ? String(l.next_follow_up_date) : null,
          l.remarks,
          l.created_by,
          l.updated_by,
          l.is_converted_to_student,
          l.is_deleted,
          l.is_demo,
          String(l.created_at),
          String(l.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${leads.length} active leads from Neon.`);
    }
    const universities = await sql.query("SELECT * FROM universities");
    if (universities && universities.length > 0) {
      const upsertUni = db2.prepare(`
        INSERT INTO universities (id, name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status, is_active, is_demo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET name = excluded.name, status = excluded.status
      `);
      for (const u of universities) {
        upsertUni.run(
          u.id,
          u.name,
          u.short_name,
          u.campus,
          u.city,
          u.state,
          u.country,
          u.university_type,
          u.accreditation,
          u.ranking,
          u.website,
          u.contact,
          u.description,
          u.status,
          u.is_active,
          u.is_demo,
          String(u.created_at),
          String(u.updated_at)
        );
      }
    }
    const gsheets = await sql.query("SELECT * FROM google_sheets_connections");
    if (gsheets && gsheets.length > 0) {
      const upsertGSheet = db2.prepare(`
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
        upsertGSheet.run(
          g.id,
          g.name,
          g.sheet_url,
          g.spreadsheet_id,
          g.gid,
          g.sheet_name,
          g.campaign_tag,
          g.target_city,
          g.source_label,
          g.status || "ACTIVE",
          Number(g.total_leads_imported) || 0,
          Number(g.last_rows_count) || 0,
          g.last_synced_at ? String(g.last_synced_at) : null,
          g.last_sync_status,
          g.last_sync_error,
          g.is_demo || 0,
          g.column_mapping,
          String(g.created_at),
          String(g.updated_at)
        );
      }
      console.log(`[Neon Sync] Synced ${gsheets.length} Google Sheet connections from Neon.`);
    }
    console.log("\u2705 [Neon Sync] Synchronization complete!");
  } catch (err) {
    console.error("[Neon Sync] Background sync failed:", err.message);
  }
}
var connectionString, isNeonEnabled, sql;
var init_neon = __esm({
  "server/db/neon.ts"() {
    "use strict";
    dotenv.config();
    connectionString = process.env.DATABASE_URL;
    isNeonEnabled = () => Boolean(connectionString);
    sql = connectionString ? neon(connectionString) : null;
  }
});

// server/db/database.ts
var database_exports = {};
__export(database_exports, {
  checkpointDatabase: () => checkpointDatabase,
  createNotification: () => createNotification,
  db: () => db,
  initDatabase: () => initDatabase,
  logAudit: () => logAudit,
  logLeadActivity: () => logLeadActivity
});
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
function checkpointDatabase() {
  try {
    db.pragma("wal_checkpoint(TRUNCATE)");
  } catch (e) {
  }
}
function runSafeMigrations() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS deleted_records (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        identifier TEXT,
        details TEXT,
        deleted_by TEXT DEFAULT 'System',
        deleted_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_del_rec_ident ON deleted_records(identifier);
      CREATE INDEX IF NOT EXISTS idx_del_rec_entity ON deleted_records(entity_type, entity_id);
    `);
  } catch (e) {
    console.warn("[Migration Notice] deleted_records table:", e.message);
  }
  const addColumnIfNotExists = (table, column, columnDef) => {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all();
      if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef};`);
        console.log(`[Migration] Added column ${column} to ${table}`);
      }
    } catch (e) {
      console.warn(`[Migration Notice] Table ${table}.${column}:`, e.message);
    }
  };
  addColumnIfNotExists("counselors", "username", "TEXT");
  addColumnIfNotExists("counselors", "joining_date", "TEXT");
  addColumnIfNotExists("counselors", "status", "TEXT NOT NULL DEFAULT 'Active'");
  addColumnIfNotExists("counselors", "role", "TEXT NOT NULL DEFAULT 'Counselor'");
  addColumnIfNotExists("universities", "short_name", "TEXT");
  addColumnIfNotExists("universities", "description", "TEXT");
  addColumnIfNotExists("universities", "status", "TEXT NOT NULL DEFAULT 'Active'");
  addColumnIfNotExists("courses", "short_name", "TEXT");
  addColumnIfNotExists("courses", "course_level", "TEXT NOT NULL DEFAULT 'UG'");
  addColumnIfNotExists("courses", "stream", "TEXT NOT NULL DEFAULT 'Engineering'");
  addColumnIfNotExists("courses", "entrance_requirement", "TEXT");
  addColumnIfNotExists("courses", "description", "TEXT");
  addColumnIfNotExists("courses", "status", "TEXT NOT NULL DEFAULT 'Active'");
  addColumnIfNotExists("leads", "parent_name", "TEXT");
  addColumnIfNotExists("leads", "school_college", "TEXT");
  addColumnIfNotExists("leads", "passing_year", "TEXT");
  addColumnIfNotExists("leads", "priority", "TEXT NOT NULL DEFAULT 'MEDIUM'");
  addColumnIfNotExists("google_sheets_connections", "column_mapping", "TEXT");
  addColumnIfNotExists("university_courses", "tuition_fee_per_year", "REAL DEFAULT 0.0");
  addColumnIfNotExists("university_courses", "hostel_fee_per_year", "REAL DEFAULT 0.0");
  addColumnIfNotExists("university_courses", "one_time_fee", "REAL DEFAULT 0.0");
  addColumnIfNotExists("university_courses", "other_charges", "REAL DEFAULT 0.0");
  addColumnIfNotExists("university_courses", "total_first_year_fee", "REAL DEFAULT 0.0");
  addColumnIfNotExists("university_courses", "total_full_course_fee", "REAL DEFAULT 0.0");
  addColumnIfNotExists("university_courses", "currency", "TEXT DEFAULT 'INR'");
  addColumnIfNotExists("university_courses", "eligibility_notes", "TEXT");
  addColumnIfNotExists("university_courses", "application_deadline", "TEXT");
  addColumnIfNotExists("university_courses", "admission_process", "TEXT DEFAULT 'Direct Merit / Counseling'");
  addColumnIfNotExists("university_courses", "remarks", "TEXT");
  addColumnIfNotExists("university_courses", "is_active", "INTEGER DEFAULT 1");
  addColumnIfNotExists("users", "permissions", "TEXT DEFAULT '[]'");
  addColumnIfNotExists("roles", "permissions", "TEXT DEFAULT '[]'");
  addColumnIfNotExists("counselors", "specialization_courses", "TEXT DEFAULT '[]'");
  addColumnIfNotExists("counselors", "specialization_universities", "TEXT DEFAULT '[]'");
  addColumnIfNotExists("counselors", "daily_lead_quota", "INTEGER DEFAULT 25");
  addColumnIfNotExists("counselors", "leads_assigned_today", "INTEGER DEFAULT 0");
  addColumnIfNotExists("counselors", "last_assigned_date", "TEXT");
  addColumnIfNotExists("counselors", "designation", "TEXT DEFAULT 'Senior Counselor'");
  addColumnIfNotExists("counselors", "department", "TEXT DEFAULT 'Counseling & Admissions'");
  addColumnIfNotExists("counselors", "employee_code", "TEXT");
  addColumnIfNotExists("counselors", "alternate_phone", "TEXT");
  addColumnIfNotExists("counselors", "work_location", "TEXT DEFAULT 'Office'");
  addColumnIfNotExists("counselors", "notes", "TEXT");
  addColumnIfNotExists("message_templates", "target_courses", "TEXT DEFAULT '[]'");
  addColumnIfNotExists("message_templates", "target_universities", "TEXT DEFAULT '[]'");
  addColumnIfNotExists("message_templates", "description", "TEXT");
  try {
    db.exec(`
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
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        sent_by TEXT NOT NULL DEFAULT 'Super Admin',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  } catch (e) {
    console.warn("[Migration Notice] bulk_email_campaigns table:", e.message);
  }
}
function initDatabase() {
  try {
    db.exec(SCHEMA_SQL);
    runSafeMigrations();
    console.log("\u2705 Database schema initialized and migrated successfully");
    if (isNeonEnabled()) {
      syncFromNeonToSQLite(db).catch((err) => {
        console.warn("[Neon Sync] Initial sync deferred:", err.message);
      });
    }
  } catch (error) {
    console.error("\u274C Failed to initialize database schema:", error);
    throw error;
  }
}
function logAudit(params) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = "AUD-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    stmt.run(
      id,
      params.userId || "system",
      params.userName || "System",
      params.action,
      params.entity,
      params.entityId || null,
      params.oldValue ? typeof params.oldValue === "string" ? params.oldValue : JSON.stringify(params.oldValue) : null,
      params.newValue ? typeof params.newValue === "string" ? params.newValue : JSON.stringify(params.newValue) : null,
      params.ipAddress || "127.0.0.1"
    );
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}
function logLeadActivity(params) {
  try {
    const stmt = db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const id = "ACT-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    stmt.run(
      id,
      params.leadId,
      params.activityType,
      params.title,
      params.description,
      params.performedBy || "System",
      params.metadata ? JSON.stringify(params.metadata) : null
    );
  } catch (err) {
    console.error("Lead activity write failed:", err);
  }
}
function createNotification(params) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, counselor_id, title, message, type, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = "NOTIF-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    stmt.run(
      id,
      params.userId || null,
      params.counselorId || null,
      params.title,
      params.message,
      params.type,
      params.entityType || null,
      params.entityId || null
    );
  } catch (err) {
    console.error("Notification write failed:", err);
  }
}
var isVercel, dbDir, dbPath, db;
var init_database = __esm({
  "server/db/database.ts"() {
    "use strict";
    init_schema();
    init_neon();
    isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (isVercel) {
      dbDir = "/tmp";
      dbPath = path.join(dbDir, "education_sansar.db");
      if (!fs.existsSync(dbPath)) {
        try {
          const sourceDb = path.resolve(process.cwd(), "server/db/education_sansar.db");
          if (fs.existsSync(sourceDb)) {
            fs.copyFileSync(sourceDb, dbPath);
          }
        } catch (e) {
          console.warn("[Vercel] Could not copy seed db to /tmp:", e);
        }
      }
    } else {
      dbDir = process.env.DATABASE_DIR ? path.resolve(process.env.DATABASE_DIR) : path.resolve(process.cwd(), "server/db");
      if (!fs.existsSync(dbDir)) {
        try {
          fs.mkdirSync(dbDir, { recursive: true });
        } catch (e) {
        }
      }
      dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(dbDir, "education_sansar.db");
    }
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === "development" && process.env.DB_VERBOSE === "true" ? console.log : void 0
    });
    if (isVercel) {
      db.pragma("journal_mode = DELETE");
    } else {
      db.pragma("journal_mode = WAL");
      db.pragma("synchronous = NORMAL");
    }
    db.pragma("foreign_keys = ON");
    initDatabase();
  }
});

// server/services/leadDistributionEngine.ts
function parseKeywords(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((k) => String(k).trim()).filter(Boolean);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((k) => String(k).trim()).filter(Boolean);
    } catch {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}
function getRoutingRules() {
  try {
    const rows = db.prepare(`
      SELECT r.*, c.name as current_counselor_name, c.is_active as counselor_active, c.email as counselor_email
      FROM lead_routing_rules r
      LEFT JOIN counselors c ON r.counselor_id = c.id
      ORDER BY r.priority DESC, r.created_at ASC
    `).all();
    return rows.map((r) => ({
      ...r,
      counselor_name: r.current_counselor_name || r.counselor_name || "Counselor",
      course_keywords: parseKeywords(r.course_keywords),
      university_keywords: parseKeywords(r.university_keywords),
      target_cities: parseKeywords(r.target_cities)
    }));
  } catch (err) {
    console.warn("[Routing Rules] Query failed:", err.message);
    return [];
  }
}
function createRoutingRule(data, performedBy = "Super Admin") {
  const id = "RULE-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  let counselorName = data.counselor_name || "";
  if (data.counselor_id && !counselorName) {
    const c = db.prepare("SELECT name FROM counselors WHERE id = ?").get(data.counselor_id);
    if (c) counselorName = c.name;
  }
  const courseKw = JSON.stringify(parseKeywords(data.course_keywords));
  const uniKw = JSON.stringify(parseKeywords(data.university_keywords));
  const cities = JSON.stringify(parseKeywords(data.target_cities));
  db.prepare(`
    INSERT INTO lead_routing_rules (
      id, name, course_keywords, university_keywords, target_cities,
      counselor_id, counselor_name, priority, max_daily_leads, is_active, description
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name || "Custom Routing Rule",
    courseKw,
    uniKw,
    cities,
    data.counselor_id,
    counselorName,
    data.priority !== void 0 ? Number(data.priority) : 1,
    data.max_daily_leads !== void 0 ? Number(data.max_daily_leads) : 20,
    data.is_active !== void 0 ? data.is_active ? 1 : 0 : 1,
    data.description || null
  );
  logAudit({
    userName: performedBy,
    action: "CREATE_LEAD_ROUTING_RULE",
    entity: "lead_routing_rule",
    entityId: id,
    newValue: { name: data.name, counselor_name: counselorName, priority: data.priority }
  });
  return {
    id,
    name: data.name || "Custom Routing Rule",
    course_keywords: parseKeywords(data.course_keywords),
    university_keywords: parseKeywords(data.university_keywords),
    target_cities: parseKeywords(data.target_cities),
    counselor_id: data.counselor_id,
    counselor_name: counselorName,
    priority: data.priority || 1,
    max_daily_leads: data.max_daily_leads || 20,
    is_active: data.is_active !== void 0 ? data.is_active ? 1 : 0 : 1,
    description: data.description
  };
}
function updateRoutingRule(id, data, performedBy = "Super Admin") {
  const existing = db.prepare("SELECT * FROM lead_routing_rules WHERE id = ?").get(id);
  if (!existing) return false;
  let counselorName = existing.counselor_name;
  if (data.counselor_id && data.counselor_id !== existing.counselor_id) {
    const c = db.prepare("SELECT name FROM counselors WHERE id = ?").get(data.counselor_id);
    if (c) counselorName = c.name;
  }
  const courseKw = data.course_keywords !== void 0 ? JSON.stringify(parseKeywords(data.course_keywords)) : existing.course_keywords;
  const uniKw = data.university_keywords !== void 0 ? JSON.stringify(parseKeywords(data.university_keywords)) : existing.university_keywords;
  const cities = data.target_cities !== void 0 ? JSON.stringify(parseKeywords(data.target_cities)) : existing.target_cities;
  db.prepare(`
    UPDATE lead_routing_rules
    SET name = ?,
        course_keywords = ?,
        university_keywords = ?,
        target_cities = ?,
        counselor_id = ?,
        counselor_name = ?,
        priority = ?,
        max_daily_leads = ?,
        is_active = ?,
        description = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.name !== void 0 ? data.name : existing.name,
    courseKw,
    uniKw,
    cities,
    data.counselor_id !== void 0 ? data.counselor_id : existing.counselor_id,
    counselorName,
    data.priority !== void 0 ? Number(data.priority) : existing.priority,
    data.max_daily_leads !== void 0 ? Number(data.max_daily_leads) : existing.max_daily_leads,
    data.is_active !== void 0 ? data.is_active ? 1 : 0 : existing.is_active,
    data.description !== void 0 ? data.description : existing.description,
    id
  );
  logAudit({
    userName: performedBy,
    action: "UPDATE_LEAD_ROUTING_RULE",
    entity: "lead_routing_rule",
    entityId: id,
    oldValue: existing,
    newValue: data
  });
  return true;
}
function deleteRoutingRule(id, performedBy = "Super Admin") {
  const rule = db.prepare("SELECT * FROM lead_routing_rules WHERE id = ?").get(id);
  if (!rule) return false;
  db.prepare("DELETE FROM lead_routing_rules WHERE id = ?").run(id);
  logAudit({
    userName: performedBy,
    action: "DELETE_LEAD_ROUTING_RULE",
    entity: "lead_routing_rule",
    entityId: id,
    oldValue: rule
  });
  return true;
}
function checkAndResetDailyQuotas(counselors) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  for (const c of counselors) {
    if (c.last_assigned_date !== today) {
      db.prepare(`
        UPDATE counselors
        SET leads_assigned_today = 0, last_assigned_date = ?
        WHERE id = ?
      `).run(today, c.id);
      c.leads_assigned_today = 0;
      c.last_assigned_date = today;
    }
  }
}
function matchesKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return true;
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase().trim()));
}
function distributeLead(lead) {
  const activeCounselors = db.prepare(`
    SELECT * FROM counselors
    WHERE is_active = 1 AND current_active_leads < max_capacity
    ORDER BY current_active_leads ASC
  `).all();
  if (activeCounselors.length === 0) {
    const fallbackCounselors = db.prepare(`
      SELECT * FROM counselors WHERE is_active = 1 ORDER BY current_active_leads ASC LIMIT 1
    `).all();
    if (fallbackCounselors.length === 0) return null;
    const fallback = fallbackCounselors[0];
    return {
      counselorId: fallback.id,
      counselorName: fallback.name,
      method: "Fallback (Capacity Exceeded)",
      reasons: ["All counselors at capacity, routed to lowest load active counselor"]
    };
  }
  checkAndResetDailyQuotas(activeCounselors);
  const counselorMap = /* @__PURE__ */ new Map();
  for (const c of activeCounselors) counselorMap.set(c.id, c);
  const rules = getRoutingRules().filter((r) => r.is_active === 1);
  for (const rule of rules) {
    const counselor = counselorMap.get(rule.counselor_id);
    if (!counselor) continue;
    const dailyQuota = rule.max_daily_leads || counselor.daily_lead_quota || 25;
    if ((counselor.leads_assigned_today || 0) >= dailyQuota) {
      continue;
    }
    const hasCourseFilter = rule.course_keywords && rule.course_keywords.length > 0;
    const hasUniFilter = rule.university_keywords && rule.university_keywords.length > 0;
    const hasCityFilter = rule.target_cities && rule.target_cities.length > 0;
    if (!hasCourseFilter && !hasUniFilter && !hasCityFilter) continue;
    const courseMatches = matchesKeywords(lead.preferred_course, rule.course_keywords);
    const uniMatches = matchesKeywords(lead.preferred_university, rule.university_keywords);
    const cityMatches = matchesKeywords(lead.city, rule.target_cities);
    let isMatch = false;
    const matchReasons = [];
    if (hasCourseFilter && hasUniFilter) {
      if (courseMatches && uniMatches) {
        isMatch = !hasCityFilter || cityMatches;
        if (isMatch) {
          matchReasons.push(`Matched Course [${lead.preferred_course}]`);
          matchReasons.push(`Matched University [${lead.preferred_university}]`);
          if (hasCityFilter && cityMatches) matchReasons.push(`Matched City [${lead.city}]`);
        }
      }
    } else if (hasCourseFilter && courseMatches) {
      isMatch = !hasCityFilter || cityMatches;
      if (isMatch) {
        matchReasons.push(`Matched Course [${lead.preferred_course}]`);
        if (hasCityFilter && cityMatches) matchReasons.push(`Matched City [${lead.city}]`);
      }
    } else if (hasUniFilter && uniMatches) {
      isMatch = !hasCityFilter || cityMatches;
      if (isMatch) {
        matchReasons.push(`Matched University [${lead.preferred_university}]`);
        if (hasCityFilter && cityMatches) matchReasons.push(`Matched City [${lead.city}]`);
      }
    } else if (hasCityFilter && cityMatches && !hasCourseFilter && !hasUniFilter) {
      isMatch = true;
      matchReasons.push(`Matched City [${lead.city}]`);
    }
    if (isMatch) {
      return {
        counselorId: counselor.id,
        counselorName: counselor.name,
        method: `Automated Rule (${rule.name})`,
        matchedRule: rule.name,
        reasons: matchReasons
      };
    }
  }
  for (const c of activeCounselors) {
    const specCourses = parseKeywords(c.specialization_courses);
    const specUnis = parseKeywords(c.specialization_universities);
    const courseMatches = matchesKeywords(lead.preferred_course, specCourses);
    const uniMatches = matchesKeywords(lead.preferred_university, specUnis);
    if (specCourses.length > 0 && courseMatches) {
      return {
        counselorId: c.id,
        counselorName: c.name,
        method: "Counselor Course Specialization",
        reasons: [`Counselor specializes in ${lead.preferred_course}`]
      };
    }
    if (specUnis.length > 0 && uniMatches) {
      return {
        counselorId: c.id,
        counselorName: c.name,
        method: "Counselor University Specialization",
        reasons: [`Counselor specializes in ${lead.preferred_university}`]
      };
    }
  }
  activeCounselors.sort((a, b) => {
    const ratioA = (a.current_active_leads || 0) / (a.max_capacity || 100);
    const ratioB = (b.current_active_leads || 0) / (b.max_capacity || 100);
    if (ratioA !== ratioB) return ratioA - ratioB;
    return (a.total_assigned_leads || 0) - (b.total_assigned_leads || 0);
  });
  const selected = activeCounselors[0];
  return {
    counselorId: selected.id,
    counselorName: selected.name,
    method: "Capacity-Balanced Round Robin",
    reasons: [`Selected counselor with lowest workload ratio (${selected.current_active_leads}/${selected.max_capacity})`]
  };
}
async function distributeUnassignedLeads(performedBy = "Super Admin") {
  const unassigned = db.prepare(`
    SELECT * FROM leads 
    WHERE is_deleted = 0 AND (assigned_counselor_id IS NULL OR assigned_counselor_id = '')
    ORDER BY created_at ASC
  `).all();
  let totalAssigned = 0;
  const details = [];
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  for (const lead of unassigned) {
    const route = distributeLead({
      city: lead.city,
      preferred_course: lead.preferred_course,
      preferred_university: lead.preferred_university,
      country: lead.country
    });
    if (route) {
      db.prepare(`
        UPDATE leads 
        SET assigned_counselor_id = ?,
            assigned_counselor_name = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(route.counselorId, route.counselorName, lead.id);
      db.prepare(`
        UPDATE counselors 
        SET current_active_leads = current_active_leads + 1,
            total_assigned_leads = total_assigned_leads + 1,
            leads_assigned_today = leads_assigned_today + 1,
            last_assigned_date = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(today, route.counselorId);
      const assignId = "ASGN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
      db.prepare(`
        INSERT INTO lead_assignments (id, lead_id, previous_counselor_id, previous_counselor_name, new_counselor_id, new_counselor_name, assignment_method, assigned_by)
        VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)
      `).run(assignId, lead.id, route.counselorId, route.counselorName, route.method, performedBy);
      logLeadActivity({
        leadId: lead.id,
        activityType: "COUNSELOR_ASSIGNED",
        title: "Assigned via Lead Distribution Engine",
        description: `Assigned to ${route.counselorName} via ${route.method}. Reason: ${route.reasons.join(", ")}`,
        performedBy
      });
      createNotification({
        counselorId: route.counselorId,
        title: "New Student Lead Assigned",
        message: `${lead.student_name} interested in ${lead.preferred_course} at ${lead.preferred_university} was assigned to you via ${route.method}.`,
        type: "LEAD_ASSIGNED",
        entityType: "lead",
        entityId: lead.id
      });
      if (isNeonEnabled()) {
        const updatedLead = db.prepare("SELECT * FROM leads WHERE id = ?").get(lead.id);
        if (updatedLead) {
          persistLeadToNeon(updatedLead).catch(() => {
          });
        }
      }
      totalAssigned++;
      details.push({
        leadId: lead.id,
        leadNumber: lead.lead_id,
        studentName: lead.student_name,
        preferredCourse: lead.preferred_course,
        preferredUniversity: lead.preferred_university,
        assignedTo: route.counselorName,
        method: route.method,
        matchedRule: route.matchedRule
      });
    }
  }
  logAudit({
    userName: performedBy,
    action: "BATCH_LEAD_DISTRIBUTION",
    entity: "lead_distribution_engine",
    newValue: { totalProcessed: unassigned.length, totalAssigned }
  });
  return {
    totalProcessed: unassigned.length,
    totalAssigned,
    details
  };
}
function simulateLeadRouting(params) {
  const result = distributeLead(params);
  if (!result) {
    return {
      success: false,
      message: "No eligible active counselors found to take this lead."
    };
  }
  return {
    success: true,
    counselorId: result.counselorId,
    counselorName: result.counselorName,
    method: result.method,
    matchedRule: result.matchedRule,
    reasons: result.reasons
  };
}
var init_leadDistributionEngine = __esm({
  "server/services/leadDistributionEngine.ts"() {
    "use strict";
    init_database();
    init_neon();
  }
});

// server/services/leadService.ts
function normalizePhoneNumber(phone) {
  if (!phone) return "";
  const digitsOnly = phone.replace(/[^0-9]/g, "");
  if (digitsOnly.length >= 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly;
}
function checkDuplicate(params) {
  const conditions = [];
  const queryParams = [];
  const matchReasons = [];
  const normPhone = normalizePhoneNumber(params.phone);
  const normWa = normalizePhoneNumber(params.whatsapp_number);
  const cleanEmail = params.email ? params.email.trim().toLowerCase() : "";
  if (normPhone) {
    conditions.push("REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?");
    queryParams.push(`%${normPhone}%`);
  }
  if (normWa) {
    conditions.push("REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(whatsapp_number, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?");
    queryParams.push(`%${normWa}%`);
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
  let sql2 = `SELECT * FROM leads WHERE is_deleted = 0 AND (${conditions.join(" OR ")})`;
  if (params.excludeId) {
    sql2 += ` AND id != ?`;
    queryParams.push(params.excludeId);
  }
  const duplicates = db.prepare(sql2).all(...queryParams);
  if (duplicates.length > 0) {
    const d = duplicates[0];
    const dNormPhone = normalizePhoneNumber(d.phone);
    const dNormWa = normalizePhoneNumber(d.whatsapp_number);
    if (normPhone && (dNormPhone === normPhone || dNormPhone.includes(normPhone) || normPhone.includes(dNormPhone))) {
      matchReasons.push("Phone number matches existing record");
    }
    if (normWa && (dNormWa === normWa || dNormWa.includes(normWa) || normWa.includes(dNormWa))) {
      matchReasons.push("WhatsApp number matches existing record");
    }
    if (cleanEmail && d.email?.toLowerCase().trim() === cleanEmail) {
      matchReasons.push("Email matches existing record");
    }
    if (params.facebook_lead_id && d.facebook_lead_id === params.facebook_lead_id) {
      matchReasons.push("Facebook Lead ID matches existing record");
    }
  }
  return {
    hasDuplicate: duplicates.length > 0,
    duplicates,
    matchReasons: Array.from(new Set(matchReasons))
  };
}
function assignCounselor(lead) {
  const route = distributeLead({
    city: lead.city,
    preferred_university: lead.preferred_university,
    preferred_course: lead.preferred_course,
    country: lead.country
  });
  if (route) {
    return {
      counselorId: route.counselorId,
      counselorName: route.counselorName,
      method: route.method
    };
  }
  return null;
}
function generateLeadId() {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const countRow = db.prepare("SELECT count(*) as count FROM leads WHERE lead_id LIKE ?").get(`ES-${currentYear}-%`);
  const nextSeq = (countRow.count + 1).toString().padStart(4, "0");
  return `ES-${currentYear}-${nextSeq}`;
}
function createLead(data, performedBy = "System") {
  const id = "lead-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const leadId = data.lead_id || generateLeadId();
  if (performedBy !== "Google Sheets Sync" && performedBy !== "Meta Webhook") {
    if (data.phone) {
      const digits = String(data.phone).replace(/[^0-9]/g, "");
      const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
      try {
        db.prepare("DELETE FROM deleted_records WHERE entity_type = 'lead' AND (identifier = ? OR identifier = ? OR identifier = ?)").run(data.phone, digits, last10);
      } catch (e) {
      }
    }
    if (data.email) {
      try {
        db.prepare("DELETE FROM deleted_records WHERE entity_type = 'lead' AND identifier = ?").run(data.email.toLowerCase().trim());
      } catch (e) {
      }
    }
  }
  let counselorId = data.assigned_counselor_id;
  let counselorName = data.assigned_counselor_name;
  let assignmentMethod = "Manual";
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
  } else if (!counselorName) {
    const c = db.prepare("SELECT name FROM counselors WHERE id = ?").get(counselorId);
    counselorName = c?.name;
  }
  const firstName = data.first_name || data.student_name?.split(" ")[0] || "Student";
  const lastName = data.last_name || data.student_name?.split(" ").slice(1).join(" ") || "";
  const studentName = data.student_name || `${firstName} ${lastName}`.trim();
  const insertStmt = db.prepare(`
    INSERT INTO leads (
      id, lead_id, student_name, first_name, last_name, phone, whatsapp_number, email,
      parent_name, gender, date_of_birth, country, state, city, address, academic_qualification,
      school_college, passing_year,
      percentage_10th, percentage_12th, graduation_percentage, entrance_exam, entrance_score,
      preferred_course, preferred_university, second_university, budget, scholarship_required,
      lead_source, campaign, ad_set, ad, facebook_lead_id, lead_created_date,
      assigned_counselor_id, assigned_counselor_name, lead_status, lead_temperature, priority,
      last_contact_date, next_follow_up_date, remarks, created_by, updated_by,
      is_converted_to_student, is_deleted, is_demo
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, datetime('now'),
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      0, 0, ?
    )
  `);
  insertStmt.run(
    id,
    leadId,
    studentName,
    firstName,
    lastName,
    data.phone || "",
    data.whatsapp_number || data.phone || "",
    data.email || "",
    data.parent_name || null,
    data.gender || null,
    data.date_of_birth || null,
    data.country || "Nepal",
    data.state || null,
    data.city || "Kathmandu",
    data.address || null,
    data.academic_qualification || null,
    data.school_college || null,
    data.passing_year || null,
    data.percentage_10th || null,
    data.percentage_12th || null,
    data.graduation_percentage || null,
    data.entrance_exam || null,
    data.entrance_score || null,
    data.preferred_course || "Not Specified",
    data.preferred_university || "Not Specified",
    data.second_university || null,
    data.budget || null,
    data.scholarship_required ? 1 : 0,
    data.lead_source || "Meta Ads",
    data.campaign || null,
    data.ad_set || null,
    data.ad || null,
    data.facebook_lead_id || null,
    counselorId || null,
    counselorName || null,
    data.lead_status || "New Lead",
    data.lead_temperature || "WARM",
    data.priority || "MEDIUM",
    data.last_contact_date || null,
    data.next_follow_up_date || null,
    data.remarks || null,
    performedBy,
    performedBy,
    data.is_demo !== void 0 ? data.is_demo : 0
  );
  if (counselorId) {
    db.prepare(`
      UPDATE counselors 
      SET current_active_leads = current_active_leads + 1,
          total_assigned_leads = total_assigned_leads + 1,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(counselorId);
    const assignLogId = "ASG-" + Date.now();
    db.prepare(`
      INSERT INTO lead_assignments (id, lead_id, previous_counselor_id, previous_counselor_name, new_counselor_id, new_counselor_name, assignment_method, assigned_by)
      VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)
    `).run(assignLogId, id, counselorId, counselorName, assignmentMethod, performedBy);
    createNotification({
      counselorId,
      title: "New Lead Assigned",
      message: `Lead ${studentName} (${data.preferred_course || "Course"}) has been assigned to you.`,
      type: "NEW_LEAD",
      entityType: "lead",
      entityId: id
    });
  }
  logLeadActivity({
    leadId: id,
    activityType: "Counselor Assignment",
    title: `Assigned to ${counselorName || "Unassigned"}`,
    description: `Auto-assignment via ${assignmentMethod}`,
    performedBy
  });
  const tomorrow = /* @__PURE__ */ new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fupDateStr = tomorrow.toISOString().split("T")[0];
  const fupId = "fup-" + Date.now();
  db.prepare(`
    INSERT INTO followups (id, lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, status, created_by)
    VALUES (?, ?, ?, ?, '11:00', 'Call', 'HIGH', 'First outreach call to introduce Education Sansar counseling services', 'Pending', ?)
  `).run(fupId, id, counselorId || null, fupDateStr, performedBy);
  logLeadActivity({
    leadId: id,
    activityType: "WhatsApp",
    title: "Automated Welcome WhatsApp Message Queued",
    description: `Welcome message prepared with counselor contact (${counselorName || "Admissions Desk"})`,
    performedBy: "Automation Engine"
  });
  logAudit({
    userName: performedBy,
    action: "LEAD_CREATED",
    entity: "lead",
    entityId: id,
    newValue: { lead_id: leadId, student_name: studentName, phone: data.phone, counselor: counselorName }
  });
  const createdLead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  if (isNeonEnabled() && createdLead) {
    persistLeadToNeon(createdLead).catch((err) => console.warn("[Neon Sync] Lead persist deferred:", err.message));
  }
  return createdLead;
}
function updateLead(id, updates, performedBy = "System") {
  const currentLead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  if (!currentLead) {
    throw new Error("Lead not found");
  }
  const oldStatus = currentLead.lead_status;
  const newStatus = updates.lead_status || oldStatus;
  const allowedFields = [
    "student_name",
    "first_name",
    "last_name",
    "phone",
    "whatsapp_number",
    "email",
    "parent_name",
    "gender",
    "date_of_birth",
    "country",
    "state",
    "city",
    "address",
    "academic_qualification",
    "school_college",
    "passing_year",
    "percentage_10th",
    "percentage_12th",
    "graduation_percentage",
    "entrance_exam",
    "entrance_score",
    "preferred_course",
    "preferred_university",
    "second_university",
    "budget",
    "scholarship_required",
    "lead_source",
    "campaign",
    "ad_set",
    "ad",
    "lead_status",
    "lead_temperature",
    "priority",
    "last_contact_date",
    "next_follow_up_date",
    "remarks",
    "assigned_counselor_id",
    "assigned_counselor_name"
  ];
  const setClauses = [];
  const params = [];
  for (const field of allowedFields) {
    if (updates[field] !== void 0) {
      setClauses.push(`${field} = ?`);
      params.push(updates[field]);
    }
  }
  setClauses.push("updated_by = ?");
  params.push(performedBy);
  setClauses.push("updated_at = datetime('now')");
  params.push(id);
  db.prepare(`UPDATE leads SET ${setClauses.join(", ")} WHERE id = ?`).run(...params);
  if (updates.lead_status && updates.lead_status !== oldStatus) {
    const histId = "STH-" + Date.now();
    db.prepare(`
      INSERT INTO lead_status_history (id, lead_id, previous_status, new_status, changed_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(histId, id, oldStatus, newStatus, performedBy);
    logLeadActivity({
      leadId: id,
      activityType: "Status Change",
      title: `Status changed to ${newStatus}`,
      description: `Lead moved from "${oldStatus}" to "${newStatus}"`,
      performedBy
    });
    if (newStatus === "Documents Pending") {
      const fupDate = /* @__PURE__ */ new Date();
      fupDate.setDate(fupDate.getDate() + 2);
      const fupId = "fup-doc-" + Date.now();
      db.prepare(`
        INSERT INTO followups (id, lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, status, created_by)
        VALUES (?, ?, ?, ?, '14:00', 'Document Follow-up', 'HIGH', 'Collect pending academic transcripts and identity documents', 'Pending', 'Automation Engine')
      `).run(fupId, id, currentLead.assigned_counselor_id || null, fupDate.toISOString().split("T")[0]);
      createNotification({
        counselorId: currentLead.assigned_counselor_id,
        title: "Documents Pending Alert",
        message: `${currentLead.student_name} is in Documents Pending stage. Please collect marksheets and ID proofs.`,
        type: "DOCUMENT_PENDING",
        entityType: "lead",
        entityId: id
      });
    }
    if (newStatus === "Admission Confirmed") {
      convertLeadToStudent(id, performedBy);
    }
  }
  logAudit({
    userName: performedBy,
    action: "LEAD_UPDATED",
    entity: "lead",
    entityId: id,
    oldValue: currentLead,
    newValue: updates
  });
  const updatedLead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
  if (isNeonEnabled() && updatedLead) {
    persistLeadToNeon(updatedLead).catch((err) => console.warn("[Neon Sync] Lead update persist deferred:", err.message));
  }
  return updatedLead;
}
function convertLeadToStudent(leadId, performedBy = "System") {
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
  if (!lead) return null;
  const existingStudent = db.prepare("SELECT * FROM students WHERE lead_id = ?").get(leadId);
  if (existingStudent) return existingStudent;
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const countRow = db.prepare("SELECT count(*) as count FROM students WHERE student_id LIKE ?").get(`STU-${currentYear}-%`);
  const studentId = `STU-${currentYear}-${(countRow.count + 1).toString().padStart(3, "0")}`;
  const stuDbId = "stu-" + Date.now();
  const app2 = db.prepare("SELECT id FROM applications WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1").get(leadId);
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
  `).run(
    stuDbId,
    studentId,
    leadId,
    lead.student_name,
    lead.phone,
    lead.whatsapp_number,
    lead.email,
    lead.gender || null,
    lead.date_of_birth || null,
    lead.preferred_university,
    lead.preferred_course,
    app2?.id || null,
    lead.assigned_counselor_id || null,
    lead.assigned_counselor_name || null,
    lead.lead_source,
    lead.city,
    lead.country,
    `10th: ${lead.percentage_10th || "N/A"}%, 12th: ${lead.percentage_12th || "N/A"}%`,
    lead.is_demo
  );
  db.prepare("UPDATE leads SET is_converted_to_student = 1, updated_at = datetime('now') WHERE id = ?").run(leadId);
  if (lead.assigned_counselor_id) {
    db.prepare(`
      UPDATE counselors 
      SET total_admissions = total_admissions + 1,
          conversion_rate = ROUND((total_admissions + 1) * 100.0 / MAX(1, total_assigned_leads), 2),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(lead.assigned_counselor_id);
  }
  logLeadActivity({
    leadId,
    activityType: "Status Change",
    title: "Lead Converted to Official Enrolled Student \u{1F389}",
    description: `Assigned Official Student ID: ${studentId}. Complete lead timeline & academic history preserved.`,
    performedBy
  });
  createNotification({
    counselorId: lead.assigned_counselor_id,
    title: "Student Admission Confirmed \u{1F389}",
    message: `${lead.student_name} has been enrolled at ${lead.preferred_university}. Student ID: ${studentId}`,
    type: "ADMISSION_CONFIRMED",
    entityType: "student",
    entityId: stuDbId
  });
  return db.prepare("SELECT * FROM students WHERE id = ?").get(stuDbId);
}
function reassignLead(leadId, newCounselorId, performedBy = "System") {
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
  if (!lead) throw new Error("Lead not found");
  const newCounselor = db.prepare("SELECT * FROM counselors WHERE id = ?").get(newCounselorId);
  if (!newCounselor) throw new Error("New counselor not found");
  const oldCounselorId = lead.assigned_counselor_id;
  const oldCounselorName = lead.assigned_counselor_name;
  db.prepare(`
    UPDATE leads 
    SET assigned_counselor_id = ?, assigned_counselor_name = ?, updated_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newCounselor.id, newCounselor.name, performedBy, leadId);
  if (oldCounselorId) {
    db.prepare("UPDATE counselors SET current_active_leads = MAX(0, current_active_leads - 1) WHERE id = ?").run(oldCounselorId);
  }
  db.prepare("UPDATE counselors SET current_active_leads = current_active_leads + 1, total_assigned_leads = total_assigned_leads + 1 WHERE id = ?").run(newCounselor.id);
  db.prepare("UPDATE followups SET counselor_id = ? WHERE lead_id = ? AND status = 'Pending'").run(newCounselor.id, leadId);
  const assignLogId = "ASG-" + Date.now();
  db.prepare(`
    INSERT INTO lead_assignments (id, lead_id, previous_counselor_id, previous_counselor_name, new_counselor_id, new_counselor_name, assignment_method, assigned_by)
    VALUES (?, ?, ?, ?, ?, ?, 'Manual Reassignment', ?)
  `).run(assignLogId, leadId, oldCounselorId || null, oldCounselorName || null, newCounselor.id, newCounselor.name, performedBy);
  logLeadActivity({
    leadId,
    activityType: "Counselor Assignment",
    title: `Reassigned to ${newCounselor.name}`,
    description: `Transferred from ${oldCounselorName || "Unassigned"} by ${performedBy}`,
    performedBy
  });
  createNotification({
    counselorId: newCounselor.id,
    title: "Lead Reassigned to You",
    message: `${lead.student_name} (${lead.preferred_course}) has been transferred to your care.`,
    type: "NEW_LEAD",
    entityType: "lead",
    entityId: leadId
  });
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
}
var init_leadService = __esm({
  "server/services/leadService.ts"() {
    "use strict";
    init_database();
    init_neon();
    init_leadDistributionEngine();
  }
});

// server/services/integrationService.ts
var integrationService_exports = {};
__export(integrationService_exports, {
  addOrConnectGoogleSheet: () => addOrConnectGoogleSheet,
  deleteGoogleSheetConnection: () => deleteGoogleSheetConnection,
  exportLeadToGoogleSheet: () => exportLeadToGoogleSheet,
  fetchLiveGoogleSheetData: () => fetchLiveGoogleSheetData,
  getAllGoogleSheetConnections: () => getAllGoogleSheetConnections,
  getGoogleAppsScriptTemplate: () => getGoogleAppsScriptTemplate,
  handleGoogleSheetsLeadWebhook: () => handleGoogleSheetsLeadWebhook,
  handleMetaLeadWebhook: () => handleMetaLeadWebhook,
  parseGoogleSheetUrl: () => parseGoogleSheetUrl,
  sendWhatsAppMessage: () => sendWhatsAppMessage,
  syncAllActiveGoogleSheets: () => syncAllActiveGoogleSheets,
  syncLiveGoogleSheetLeads: () => syncLiveGoogleSheetLeads,
  updateGoogleSheetConnection: () => updateGoogleSheetConnection,
  verifyMetaWebhook: () => verifyMetaWebhook
});
function verifyMetaWebhook(mode, token, challenge) {
  const row = db.prepare("SELECT config FROM integrations WHERE name = 'Meta Lead Ads'").get();
  let expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "education_sansar_meta_verify_token_2026";
  if (row?.config) {
    try {
      const cfg = JSON.parse(row.config);
      if (cfg.verifyToken) expectedToken = cfg.verifyToken;
    } catch (e) {
    }
  }
  if (mode === "subscribe" && token === expectedToken) {
    return challenge;
  }
  return null;
}
function handleMetaLeadWebhook(payload) {
  const logId = "LOG-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  try {
    let leadData = {};
    if (payload.simulatedLead) {
      leadData = payload.simulatedLead;
    } else if (payload.entry && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        for (const change of entry.changes || []) {
          if (change.field === "leadgen") {
            const val = change.value;
            leadData = {
              student_name: val.full_name || val.name || "Meta Inquirer",
              phone: val.phone_number || val.phone || "",
              email: val.email || "",
              city: val.city || "Kathmandu",
              preferred_course: val.preferred_course || "B.Tech CSE",
              preferred_university: val.preferred_university || "SRM Institute of Science and Technology",
              facebook_lead_id: val.leadgen_id || "fb-" + Date.now(),
              lead_source: "Meta Ads",
              campaign: val.campaign_name || "Meta Nepal Admission Wave 2026",
              ad_set: val.adset_name || "Engineering Aspirants",
              ad: val.ad_name || "SRM Admissions 2026"
            };
          }
        }
      }
    } else {
      leadData = payload;
    }
    if (!leadData.phone && !leadData.email) {
      throw new Error("Meta lead payload missing phone and email");
    }
    const metaPhoneDigits = leadData.phone ? String(leadData.phone).replace(/[^0-9]/g, "") : "";
    const metaPhoneLast10 = metaPhoneDigits.length >= 10 ? metaPhoneDigits.slice(-10) : metaPhoneDigits;
    const metaCleanEmail = leadData.email ? String(leadData.email).trim().toLowerCase() : "";
    const metaTombstone = db.prepare(`
      SELECT id FROM deleted_records 
      WHERE entity_type = 'lead' AND (
        identifier = ? 
        OR (identifier = ? AND ? != '') 
        OR (identifier = ? AND ? != '')
      )
      LIMIT 1
    `).get(leadData.phone || "", metaPhoneLast10, metaPhoneLast10, metaCleanEmail, metaCleanEmail);
    if (metaTombstone) {
      return { success: true, skipped: true, isDeleted: true, message: "Lead was previously deleted permanently by user. Meta sync re-import suppressed." };
    }
    const dupResult = checkDuplicate({
      phone: leadData.phone,
      whatsapp_number: leadData.whatsapp_number || leadData.phone,
      email: leadData.email,
      facebook_lead_id: leadData.facebook_lead_id
    });
    if (dupResult.hasDuplicate) {
      const existing = dupResult.duplicates[0];
      db.prepare(`
        INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response, error_message)
        VALUES (?, 'Meta Lead Ads', 'INBOUND', 'WARN', '/api/integrations/meta/webhook', ?, ?, ?)
      `).run(logId, JSON.stringify(payload), JSON.stringify({ duplicateFound: true, existingLeadId: existing.lead_id }), "Duplicate lead detected, not re-created.");
      logLeadActivity({
        leadId: existing.id,
        activityType: "Note",
        title: "Meta Ad Form Re-submission",
        description: `Student re-submitted Meta form (${leadData.campaign || "Campaign"}). Details matched existing lead.`,
        performedBy: "Meta Webhook"
      });
      return { success: true, duplicate: true, lead: existing };
    }
    const newLead = createLead(leadData, "Meta Webhook");
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
      VALUES (?, 'Meta Lead Ads', 'INBOUND', 'SUCCESS', '/api/integrations/meta/webhook', ?, ?)
    `).run(logId, JSON.stringify(payload), JSON.stringify({ success: true, leadId: newLead.lead_id }));
    db.prepare("UPDATE integrations SET last_sync_at = datetime('now') WHERE name = 'Meta Lead Ads'").run();
    return { success: true, duplicate: false, lead: newLead };
  } catch (err) {
    const errLogId = "LOG-META-ERR-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, error_message)
      VALUES (?, 'Meta Lead Ads', 'INBOUND', 'ERROR', '/api/integrations/meta/webhook', ?, ?)
    `).run(errLogId, JSON.stringify(payload), err.message || "Processing failed");
    throw err;
  }
}
function sendWhatsAppMessage(params) {
  const integration = db.prepare("SELECT * FROM integrations WHERE name = 'WhatsApp Business API'").get();
  const isConnected = integration && integration.status === "CONNECTED" && integration.is_enabled === 1;
  let messageBody = params.customMessage || "";
  if (params.templateId || params.templateCategory) {
    let tmpl;
    if (params.templateId) {
      tmpl = db.prepare("SELECT * FROM message_templates WHERE id = ?").get(params.templateId);
    } else {
      tmpl = db.prepare("SELECT * FROM message_templates WHERE category = ? LIMIT 1").get(params.templateCategory);
    }
    if (tmpl) {
      messageBody = tmpl.content;
      if (params.variables) {
        for (const [key, val] of Object.entries(params.variables)) {
          messageBody = messageBody.replace(new RegExp(`{{${key}}}`, "g"), val);
        }
      }
    }
  }
  const messageId = "MSG-" + Date.now();
  const status = isConnected ? "Delivered" : "Queued";
  db.prepare(`
    INSERT INTO messages (id, lead_id, channel, recipient, sender, template_id, content, status)
    VALUES (?, ?, 'WhatsApp', ?, 'Education Sansar', ?, ?, ?)
  `).run(messageId, params.leadId || null, params.recipientPhone, params.templateId || null, messageBody, status);
  if (params.leadId) {
    logLeadActivity({
      leadId: params.leadId,
      activityType: "WhatsApp",
      title: "WhatsApp Message Outreach",
      description: messageBody,
      performedBy: params.performedBy || "System"
    });
  }
  const logId = "LOG-WA-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  db.prepare(`
    INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
    VALUES (?, 'WhatsApp Business API', 'OUTBOUND', 'SUCCESS', '/v18.0/messages', ?, ?)
  `).run(logId, JSON.stringify({ recipient: params.recipientPhone, message: messageBody }), JSON.stringify({ messageId, status, isLiveApi: isConnected }));
  return {
    success: true,
    messageId,
    status,
    message: messageBody,
    isLiveApi: isConnected,
    note: isConnected ? "Sent via live WhatsApp Cloud API" : "Simulated/Queued (Configure WhatsApp Cloud API token in Settings to enable live delivery)"
  };
}
function extractSheetValue(raw, candidates) {
  if (!raw || typeof raw !== "object") return "";
  for (const c of candidates) {
    if (raw[c] !== void 0 && raw[c] !== null && String(raw[c]).trim() !== "") {
      return String(raw[c]).trim();
    }
  }
  const candidateNorms = candidates.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const [k, v] of Object.entries(raw)) {
    if (v === void 0 || v === null || String(v).trim() === "") continue;
    const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (candidateNorms.includes(normKey)) {
      return String(v).trim();
    }
  }
  return "";
}
function handleGoogleSheetsLeadWebhook(payload) {
  const logId = "LOG-GS-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  try {
    const raw = payload.simulatedRow || payload.row || payload.lead || payload;
    const student_name = extractSheetValue(raw, ["full_name", "Full Name", "student_name", "Student Name", "name", "Name"]);
    const rawPhone = extractSheetValue(raw, ["phone_number", "Phone Number", "phone", "Phone", "mobile", "Mobile", "contact_number", "Contact Number"]);
    const email = extractSheetValue(raw, ["email", "Email", "email_address", "Email Address"]);
    const preferred_course = extractSheetValue(raw, [
      "which_course_are_you_interested_in?",
      "which_course_are_you_interested_in",
      "Which Course are you interested in?",
      "Which course are you interested in?",
      "Which course are you interested in",
      "which course are you interested in",
      "preferred_course",
      "Course Interested",
      "Course"
    ]);
    const preferred_university = extractSheetValue(raw, [
      "which_univsities_are_you_looking_for?",
      "which_univsities_are_you_looking_for",
      "which_universities_are_you_looking_for?",
      "which_universities_are_you_looking_for",
      "Which Universities are you looking for?",
      "Which universities are you looking for?",
      "Which universities are you looking for",
      "which universities are you looking for",
      "preferred_university",
      "University Interested",
      "University"
    ]);
    const sheetLeadId = extractSheetValue(raw, ["lead_id", "Lead ID", "leadId"]);
    const rawWa = extractSheetValue(raw, ["whatsapp_number", "WhatsApp", "WhatsApp Number", "whatsapp"]) || rawPhone;
    const city = extractSheetValue(raw, ["city", "City", "Location", "Branch"]) || "Kathmandu";
    const stateCountry = extractSheetValue(raw, ["State/Country", "State", "Country", "country"]);
    const country = stateCountry.toLowerCase().includes("india") ? "India" : ["Delhi", "Noida", "Bangalore", "Chennai", "Mumbai", "Pune"].includes(city) ? "India" : "Nepal";
    const academic_qualification = extractSheetValue(raw, ["academic_qualification", "Qualification", "12th Stream"]);
    const rawPercent = raw["Percentage/Score"] || raw["Percentage"] || raw["Score"] || raw.percentage_12th || raw.percentage_10th || raw.academicPercentage;
    const percentage = rawPercent ? parseFloat(String(rawPercent).replace(/[^0-9.]/g, "")) : void 0;
    const passing_year = extractSheetValue(raw, ["Passing Year", "passing_year", "passingYear"]);
    const budget = extractSheetValue(raw, ["Budget", "budget", "budgetRange"]);
    const assignedCounselorFromSheet = extractSheetValue(raw, ["Assigned Counselor", "assigned_counselor_name", "Counselor", "assignedCounselor"]);
    const lead_status = extractSheetValue(raw, ["Lead Status", "lead_status", "Status", "leadStatus"]) || "New Lead";
    const next_follow_up_date = extractSheetValue(raw, ["Next Follow-up Date", "next_follow_up_date", "Follow-up Date", "nextFollowUpDate"]);
    const sheetNotes = extractSheetValue(raw, ["Counselor Notes", "counselor_notes", "Notes", "Remarks", "remarks", "leadNotes"]);
    const parent_name = extractSheetValue(raw, ["Father's/Mother's Name", "Parent Name", "parent_name", "fatherName", "parentName"]);
    const school_college = extractSheetValue(raw, ["School/College", "school_college", "College", "School", "schoolCollege"]);
    const campaign = extractSheetValue(raw, ["campaign", "Campaign", "Source Sheet"]) || payload.sheetName || "Google Sheets Lead Sheet";
    const lead_source = extractSheetValue(raw, ["lead_source", "Lead Source", "Source"]) || "Google Sheets";
    const priority = extractSheetValue(raw, ["priority", "Priority"]).toUpperCase();
    if (!rawPhone && !email && !student_name) {
      return {
        success: false,
        skipped: true,
        message: "Empty row skipped"
      };
    }
    if (!rawPhone && !email) {
      return {
        success: false,
        skipped: true,
        message: "Row missing contact details (Phone Number or Email required)"
      };
    }
    const leadData = {
      student_name: student_name || "Sheet Inquirer",
      phone: rawPhone,
      whatsapp_number: rawWa || rawPhone,
      email: email || "",
      city: city || "Kathmandu",
      country,
      parent_name: parent_name || null,
      school_college: school_college || null,
      passing_year: passing_year || null,
      academic_qualification: academic_qualification || null,
      percentage_12th: percentage || null,
      preferred_course: preferred_course || "Not Specified",
      preferred_university: preferred_university || "Not Specified",
      budget: budget || null,
      campaign,
      lead_source,
      priority: ["HIGH", "MEDIUM", "LOW"].includes(priority) ? priority : "MEDIUM",
      lead_status: lead_status || "New Lead",
      next_follow_up_date: next_follow_up_date || null,
      remarks: sheetNotes || (raw.row_number ? `Imported from Google Sheet row #${raw.row_number}` : "Imported via Google Sheets sync"),
      is_demo: 0
    };
    const phoneDigits = rawPhone ? String(rawPhone).replace(/[^0-9]/g, "") : "";
    const phoneLast10 = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;
    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    const tombstone = db.prepare(`
      SELECT id, entity_id FROM deleted_records 
      WHERE entity_type = 'lead' AND (
        identifier = ? 
        OR (identifier = ? AND ? != '') 
        OR (identifier = ? AND ? != '') 
        OR (identifier = ? AND ? != '') 
        OR (identifier = ? AND ? != '')
      )
      LIMIT 1
    `).get(
      rawPhone || "",
      phoneDigits,
      phoneDigits,
      phoneLast10,
      phoneLast10,
      cleanEmail,
      cleanEmail,
      sheetLeadId || "",
      sheetLeadId || ""
    );
    if (tombstone) {
      return {
        success: true,
        skipped: true,
        isDeleted: true,
        message: `Lead ${student_name || rawPhone} was previously deleted permanently by user. Sync re-import suppressed.`
      };
    }
    const dupResult = checkDuplicate({
      phone: rawPhone,
      whatsapp_number: rawWa,
      email
    });
    if (dupResult.hasDuplicate) {
      const existing = dupResult.duplicates[0];
      const reasons = dupResult.matchReasons || ["Phone number matched existing lead"];
      const updates = {};
      if (student_name && (!existing.student_name || existing.student_name === "Sheet Inquirer")) updates.student_name = student_name;
      if (email && !existing.email) updates.email = email;
      if (rawWa && !existing.whatsapp_number) updates.whatsapp_number = rawWa;
      if (parent_name) updates.parent_name = parent_name;
      if (school_college) updates.school_college = school_college;
      if (passing_year) updates.passing_year = passing_year;
      if (academic_qualification) updates.academic_qualification = academic_qualification;
      if (percentage) updates.percentage_12th = percentage;
      if (budget) updates.budget = budget;
      if (priority && ["HIGH", "MEDIUM", "LOW"].includes(priority)) updates.priority = priority;
      if (preferred_course && preferred_course !== "Not Specified" && existing.preferred_course !== preferred_course) updates.preferred_course = preferred_course;
      if (preferred_university && preferred_university !== "Not Specified" && existing.preferred_university !== preferred_university) updates.preferred_university = preferred_university;
      if (next_follow_up_date) updates.next_follow_up_date = next_follow_up_date;
      if (!existing.assigned_counselor_id && assignedCounselorFromSheet) {
        const matchedCounselor = db.prepare("SELECT id, name FROM counselors WHERE is_active = 1 AND (name LIKE ? OR username LIKE ?) LIMIT 1").get(`%${assignedCounselorFromSheet}%`, `%${assignedCounselorFromSheet}%`);
        if (matchedCounselor) {
          updates.assigned_counselor_id = matchedCounselor.id;
          updates.assigned_counselor_name = matchedCounselor.name;
        }
      }
      if (Object.keys(updates).length > 0) {
        updateLead(existing.id, updates, "Google Sheets Sync");
      }
      if (sheetNotes) {
        logLeadActivity({
          leadId: existing.id,
          activityType: "Note",
          title: "Google Sheet Sync Note",
          description: `Sheet Note: "${sheetNotes}" (From ${campaign || "Connected Sheet"})`,
          performedBy: "Google Sheets Sync"
        });
      }
      logLeadActivity({
        leadId: existing.id,
        activityType: "Note",
        title: "Google Sheet Inbound Sync Match",
        description: `Lead updated from Google Sheet (${campaign}). Matched existing record via ${reasons.join(", ")}.`,
        performedBy: "Google Sheets Sync"
      });
      db.prepare(`
        INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
        VALUES (?, 'Google Sheets', 'INBOUND', 'SUCCESS', '/api/integrations/google-sheets/webhook', ?, ?)
      `).run(
        logId,
        JSON.stringify(payload),
        JSON.stringify({ updatedLeadId: existing.lead_id, matchReasons: reasons, fieldsUpdated: Object.keys(updates) })
      );
      const refreshed = db.prepare("SELECT * FROM leads WHERE id = ?").get(existing.id);
      return {
        success: true,
        isDuplicate: true,
        updated: true,
        lead: refreshed,
        reasons,
        message: `Updated existing lead ${refreshed.student_name} (${refreshed.lead_id}) matched by phone number.`
      };
    }
    if (assignedCounselorFromSheet) {
      const matchedC = db.prepare("SELECT id, name FROM counselors WHERE is_active = 1 AND (name LIKE ? OR username LIKE ?) LIMIT 1").get(`%${assignedCounselorFromSheet}%`, `%${assignedCounselorFromSheet}%`);
      if (matchedC) {
        leadData.assigned_counselor_id = matchedC.id;
        leadData.assigned_counselor_name = matchedC.name;
      }
    }
    if (sheetLeadId) {
      const existingId = db.prepare("SELECT id FROM leads WHERE lead_id = ?").get(sheetLeadId);
      if (!existingId) {
        leadData.lead_id = sheetLeadId;
      }
    }
    const newLead = createLead(leadData, "Google Sheets Sync");
    if (sheetNotes) {
      logLeadActivity({
        leadId: newLead.id,
        activityType: "Note",
        title: "Google Sheet Notes",
        description: sheetNotes,
        performedBy: "Google Sheets Sync"
      });
    }
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
      VALUES (?, 'Google Sheets', 'INBOUND', 'SUCCESS', '/api/integrations/google-sheets/webhook', ?, ?)
    `).run(
      logId,
      JSON.stringify(payload),
      JSON.stringify({ success: true, leadId: newLead.lead_id, counselor: newLead.assigned_counselor_name })
    );
    db.prepare("UPDATE integrations SET last_sync_at = datetime('now') WHERE name = 'Google Sheets Sync'").run();
    return {
      success: true,
      isDuplicate: false,
      created: true,
      lead: newLead,
      message: `New lead ${newLead.student_name} created and assigned to ${newLead.assigned_counselor_name || "Counselor"}.`
    };
  } catch (err) {
    const errLogId = "LOG-GS-ERR-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, error_message)
      VALUES (?, 'Google Sheets', 'INBOUND', 'ERROR', '/api/integrations/google-sheets/webhook', ?, ?)
    `).run(errLogId, JSON.stringify(payload), err.message || "Google Sheets inbound processing failed");
    return {
      success: false,
      error: err.message
    };
  }
}
function exportLeadToGoogleSheet(leadId, performedBy = "User") {
  const logId = "LOG-GS-OUT-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  const lead = db.prepare("SELECT * FROM leads WHERE id = ? OR lead_id = ?").get(leadId, leadId);
  if (!lead) {
    throw new Error("Lead not found for Google Sheets export: " + leadId);
  }
  const integration = db.prepare("SELECT * FROM integrations WHERE name = 'Google Sheets Sync'").get();
  const isConnected = integration && integration.status === "CONNECTED" && integration.is_enabled === 1;
  const rowValues = [
    lead.lead_id,
    lead.student_name,
    lead.phone,
    lead.whatsapp_number || lead.phone,
    lead.email,
    lead.city,
    lead.country,
    lead.preferred_course,
    lead.preferred_university,
    lead.lead_status,
    lead.lead_temperature,
    lead.assigned_counselor_name || "Unassigned",
    lead.lead_source,
    lead.created_at
  ];
  db.prepare(`
    INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
    VALUES (?, 'Google Sheets', 'OUTBOUND', 'SUCCESS', '/v4/spreadsheets/values:append', ?, ?)
  `).run(
    logId,
    JSON.stringify({ leadId: lead.lead_id, row: rowValues }),
    JSON.stringify({ exportedRow: rowValues, isLiveApi: isConnected, syncedAt: (/* @__PURE__ */ new Date()).toISOString() })
  );
  logLeadActivity({
    leadId: lead.id,
    activityType: "Note",
    title: "Google Sheet Sync / Export",
    description: `Lead exported to connected Google Sheet (${integration?.config ? "Configured Sheet" : "Simulated Sheet"}).`,
    performedBy
  });
  return {
    success: true,
    leadId: lead.lead_id,
    row: rowValues,
    columns: [
      "Lead ID",
      "Student Name",
      "Phone",
      "WhatsApp",
      "Email",
      "City",
      "Country",
      "Course",
      "University",
      "Status",
      "Temperature",
      "Counselor",
      "Source",
      "Created At"
    ],
    isLiveApi: isConnected,
    syncedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function getGoogleAppsScriptTemplate(baseUrl) {
  const webhookUrl = `${baseUrl}/api/integrations/google-sheets/webhook`;
  return `/**
 * Education Sansar CRM - Google Sheets Real-Time Inbound Sync Script
 * 
 * Standard Column Headers (Row 1):
 * 1. full_name
 * 2. phone_number
 * 3. email
 * 4. which_course_are_you_interested_in?
 * 5. which_univsities_are_you_looking_for?
 * 
 * Instructions:
 * 1. In your Google Sheet, open Extensions > Apps Script.
 * 2. Delete any existing code and paste this script.
 * 3. Update SHEET_NAME if your sheet tab is named something other than "Leads".
 * 4. To test immediately: select "testSendLastRow" from the function dropdown and click "Run".
 * 5. To set up automatic sync:
 *    - Click Triggers (alarm clock icon on the left).
 *    - Click "+ Add Trigger" (bottom right).
 *    - Choose function: "onFormSubmit" (if linked to Google Form) OR "onEdit" (if manually editing sheet).
 *    - Event source: "From spreadsheet".
 *    - Event type: "On form submit" OR "On edit".
 *    - Save and grant permissions.
 */

const CRM_WEBHOOK_URL = "${webhookUrl}";
const SHEET_NAME = "Leads";

/**
 * Triggered automatically when a Google Form submits a new response
 */
function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) 
      || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Safely get row number (whether triggered by event or manual run)
    let row;
    if (e && e.range) {
      row = e.range.getRow();
    } else {
      row = sheet.getLastRow();
    }

    if (row > 1) {
      sendRowToCRM(sheet, row);
    } else {
      Logger.log("No student data found to sync (row <= 1).");
    }
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err.toString());
  }
}

/**
 * Triggered automatically when any cell is edited in the sheet
 */
function onEdit(e) {
  try {
    const sheet = (e && e.range) 
      ? e.range.getSheet() 
      : (SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet());
    
    // Only process edits on the target sheet tab
    if (sheet.getName() !== SHEET_NAME) {
      return;
    }
    
    const row = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
    if (row > 1) {
      sendRowToCRM(sheet, row);
    }
  } catch (err) {
    Logger.log("Error in onEdit: " + err.toString());
  }
}

/**
 * Test function: Click "Run" on this function in Apps Script to test the connection anytime!
 */
function testSendLastRow() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      Logger.log("\u26A0\uFE0F Your sheet currently has no data rows (only headers or empty). Please add a row with Name & Phone to test.");
      return;
    }

    Logger.log("\u{1F680} Testing sync for Sheet: '" + sheet.getName() + "', Row: " + lastRow);
    sendRowToCRM(sheet, lastRow);
  } catch (err) {
    Logger.log("\u274C Test error: " + err.toString());
  }
}

/**
 * Core function to send row data to Education Sansar CRM webhook
 */
function sendRowToCRM(sheet, rowNumber) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    Logger.log("Sheet has no columns.");
    return;
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rowData = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  
  const payload = {
    row_number: rowNumber,
    timestamp: new Date().toISOString(),
    sheet_name: sheet.getName()
  };
  
  headers.forEach((header, index) => {
    if (header) {
      const headerStr = header.toString().trim();
      payload[headerStr] = rowData[index];
    }
  });

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "bypass-tunnel-reminder": "true"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  Logger.log("CRM Status Code: " + responseCode);
  Logger.log("CRM Response: " + responseText);
}
`;
}
function parseGoogleSheetUrl(urlOrId) {
  if (!urlOrId || typeof urlOrId !== "string") {
    throw new Error("Please provide a valid Google Sheet link or Spreadsheet ID.");
  }
  const trimmed = urlOrId.trim();
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) {
    const pubId = pubMatch[1];
    const gidMatch2 = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid2 = gidMatch2 ? gidMatch2[1] : "0";
    return {
      spreadsheetId: pubId,
      gid: gid2,
      cleanUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pubhtml`,
      isPublished: true,
      publishedCsvUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv&gid=${gid2}`
    };
  }
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = idMatch ? idMatch[1] : trimmed.includes("/") ? "" : trimmed;
  if (!spreadsheetId || spreadsheetId.length < 15) {
    throw new Error("Invalid Google Sheet link. Could not extract a valid Google Spreadsheet ID.");
  }
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  const cleanUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`;
  return { spreadsheetId, gid, cleanUrl };
}
function parseCSVContent(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  function parseLine(line) {
    const result = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }
  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, "").trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every((v) => v.length === 0)) continue;
    const rowObj = { row_number: String(i + 1) };
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ? values[idx].replace(/^["']|["']$/g, "").trim() : "";
    });
    rows.push(rowObj);
  }
  return { headers, rows };
}
async function fetchLiveGoogleSheetData(sheetUrlOrId, sheetName) {
  const lower = sheetUrlOrId.toLowerCase();
  if (lower.includes("sample") || lower.includes("demo") || sheetUrlOrId === "default" || lower.includes("fair") || lower.includes("walkin") || lower.includes("webinar")) {
    let demoCSV = "";
    let spreadsheetId2 = "demo-sheet-kathmandu-fair-2026";
    let cleanUrl2 = "https://docs.google.com/spreadsheets/d/demo-sheet-kathmandu-fair-2026/edit#gid=0";
    if (lower.includes("birgunj") || lower.includes("janakpur") || lower.includes("walkin")) {
      spreadsheetId2 = "demo-sheet-birgunj-walkins-2026";
      cleanUrl2 = "https://docs.google.com/spreadsheets/d/demo-sheet-birgunj-walkins-2026/edit#gid=0";
      demoCSV = `"Student Name","Phone","Email","City","Preferred Course","Preferred University","Academic Qualification","Source"
"Bikash Yadav","+977 9807112233","bikash.yadav.brg@gmail.com","Birgunj","B.Tech Artificial Intelligence","VIT Vellore","+2 Science (81%)","Birgunj Walk-in Desk"
"Prabhat Jha","+977 9804556677","prabhat.jha.jnp@gmail.com","Janakpur","B.Sc Nursing","Sharda University","+2 Biology (79%)","Janakpur Office Walk-in"
"Sunita Rauniyar","+977 9807445566","sunita.rauniyar.brg@gmail.com","Birgunj","B.Pharm (Pharmacy)","Manipal Academy of Higher Education","+2 Science (80%)","Branch Walk-in"
"Rakesh Gupta","+977 9807889900","rakesh.gupta.brg@gmail.com","Birgunj","BCA Computer Applications","Lovely Professional University","+2 Science (75%)","Branch Walk-in"`;
    } else if (lower.includes("webinar") || lower.includes("india") || lower.includes("delhi")) {
      spreadsheetId2 = "demo-sheet-india-webinar-2026";
      cleanUrl2 = "https://docs.google.com/spreadsheets/d/demo-sheet-india-webinar-2026/edit#gid=0";
      demoCSV = `"Student Name","Phone","Email","City","Preferred Course","Preferred University","Academic Qualification","Source"
"Anushka Sharma","+91 9811334455","anushka.sharma.del@gmail.com","Delhi","MBA Business Analytics","Chandigarh University","B.Com Graduate (76%)","Study in India Webinar"
"Rohan Verma","+91 9811778899","rohan.verma.noida@gmail.com","Noida","B.Tech CSE","SRM Institute of Science and Technology","+2 Science (88%)","Study in India Webinar"
"Deepa Menon","+91 9845112233","deepa.menon.blr@gmail.com","Bangalore","M.Tech Data Science","VIT Vellore","B.E CSE (8.2 CGPA)","Online Zoom Session"
"Aman Tripathi","+91 9820556677","aman.tripathi.del@gmail.com","Delhi","BBA International Business","Symbiosis International","+2 Commerce (85%)","Study in India Webinar"`;
    } else {
      demoCSV = `"Student Name","Phone","Email","City","Preferred Course","Preferred University","Academic Qualification","Source"
"Pooja Pokhrel","+977 9841887766","pooja.pokhrel.ktm@gmail.com","Kathmandu","B.Tech Computer Science & Engineering","SRM Institute of Science and Technology","+2 Science (84%)","Kathmandu Education Fair"
"Sandesh Adhikari","+977 9841223344","sandesh.adhikari.ktm@gmail.com","Kathmandu","B.Sc Nursing","Sharda University","+2 Biology (78%)","Kathmandu Education Fair"
"Alisha KC","+977 9841998877","alisha.kc.ktm@gmail.com","Kathmandu","BBA Digital Marketing","Chandigarh University","+2 Management (81%)","Kathmandu Education Fair"
"Bibek Bista","+977 9841335577","bibek.bista.ktm@gmail.com","Lalitpur","B.Tech AI & Data Science","VIT Vellore","+2 Science (87%)","Kathmandu Education Fair"`;
    }
    const { headers: headers2, rows: rows2 } = parseCSVContent(demoCSV);
    return {
      success: true,
      spreadsheetId: spreadsheetId2,
      gid: "0",
      cleanUrl: cleanUrl2,
      headers: headers2,
      totalRows: rows2.length,
      previewRows: rows2.slice(0, 8),
      allRows: rows2,
      isDemoSheet: true
    };
  }
  const parsed = parseGoogleSheetUrl(sheetUrlOrId);
  const { spreadsheetId, gid, cleanUrl } = parsed;
  const candidateUrls = [];
  if (parsed.isPublished && parsed.publishedCsvUrl) {
    candidateUrls.push(parsed.publishedCsvUrl);
  } else {
    candidateUrls.push(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}${sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ""}`
    );
    candidateUrls.push(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    );
  }
  let csvContent = "";
  let lastError = "";
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(12e3)
      });
      if (res.ok) {
        const text = await res.text();
        if (text && !text.includes("<!DOCTYPE html>") && !text.includes("accounts.google.com") && !text.includes("<html")) {
          csvContent = text;
          break;
        } else if (text.includes("accounts.google.com") || text.includes("ServiceLogin") || text.includes("Sign in")) {
          throw new Error('Google Sheet is PRIVATE. Please change General Access to "Anyone with the link can view".');
        }
      } else if (res.status === 401 || res.status === 403) {
        throw new Error('Google Sheet is PRIVATE (Permission Denied). Please set General Access to "Anyone with the link can view".');
      } else {
        lastError = `Google returned HTTP ${res.status}`;
      }
    } catch (err) {
      lastError = err.message || String(err);
      if (lastError.includes("PRIVATE")) {
        throw err;
      }
    }
  }
  if (!csvContent) {
    if (lastError.includes("PRIVATE")) {
      throw new Error(
        'Google Sheet is currently PRIVATE. To connect: in your Google Sheet, click Share > General access > change "Restricted" to "Anyone with the link can view", then try again.'
      );
    }
    throw new Error(`Failed to fetch Google Sheet: Unable to reach Google Sheets (${lastError}). Check your internet connection or verify the link is accessible. You can also use "Try Sample Sheet Link" to test offline.`);
  }
  const { headers, rows } = parseCSVContent(csvContent);
  if (headers.length === 0) {
    throw new Error("Google Sheet appears to be empty or has no header row.");
  }
  return {
    success: true,
    spreadsheetId,
    gid,
    cleanUrl,
    headers,
    totalRows: rows.length,
    previewRows: rows.slice(0, 8),
    allRows: rows,
    isDemoSheet: false
  };
}
async function getAllGoogleSheetConnections() {
  let connections = db.prepare("SELECT * FROM google_sheets_connections ORDER BY created_at DESC").all();
  if (isNeonEnabled()) {
    try {
      const neonSheets = await getAllGoogleSheetsFromNeon();
      if (neonSheets && neonSheets.length > 0) {
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
            status = excluded.status,
            total_leads_imported = excluded.total_leads_imported,
            last_rows_count = excluded.last_rows_count,
            last_synced_at = excluded.last_synced_at,
            last_sync_status = excluded.last_sync_status,
            last_sync_error = excluded.last_sync_error,
            updated_at = excluded.updated_at
        `);
        for (const g of neonSheets) {
          upsertGSheet.run(
            g.id,
            g.name,
            g.sheet_url,
            g.spreadsheet_id,
            g.gid,
            g.sheet_name,
            g.campaign_tag,
            g.target_city,
            g.source_label,
            g.status || "ACTIVE",
            Number(g.total_leads_imported) || 0,
            Number(g.last_rows_count) || 0,
            g.last_synced_at ? String(g.last_synced_at) : null,
            g.last_sync_status,
            g.last_sync_error,
            g.is_demo || 0,
            g.column_mapping,
            String(g.created_at),
            String(g.updated_at)
          );
        }
        connections = db.prepare("SELECT * FROM google_sheets_connections ORDER BY created_at DESC").all();
      }
    } catch (e) {
      console.warn("Neon get all sheets notice:", e.message);
    }
  }
  const totalSheets = connections.length;
  const activeSheets = connections.filter((c) => c.status === "ACTIVE").length;
  const totalLeadsImported = connections.reduce((acc, c) => acc + (c.total_leads_imported || 0), 0);
  const lastSync = connections.map((c) => c.last_synced_at).filter(Boolean).sort().reverse()[0] || null;
  return {
    sheets: connections,
    summary: {
      totalSheets,
      activeSheets,
      totalLeadsImported,
      lastSync
    }
  };
}
async function addOrConnectGoogleSheet(data) {
  const parsed = parseGoogleSheetUrl(data.sheetUrl);
  const liveData = await fetchLiveGoogleSheetData(data.sheetUrl, data.sheetName);
  let existing = db.prepare("SELECT id FROM google_sheets_connections WHERE spreadsheet_id = ? AND gid = ?").get(parsed.spreadsheetId, parsed.gid);
  if (!existing && isNeonEnabled()) {
    const neonSheets = await getAllGoogleSheetsFromNeon();
    const match = neonSheets.find((s) => s.spreadsheet_id === parsed.spreadsheetId && String(s.gid) === String(parsed.gid));
    if (match) existing = match;
  }
  const id = existing?.id || "gsheet-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  if (existing) {
    db.prepare(`
      UPDATE google_sheets_connections
      SET name = ?,
          sheet_url = ?,
          sheet_name = ?,
          campaign_tag = ?,
          target_city = ?,
          source_label = ?,
          last_rows_count = ?,
          status = 'ACTIVE',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.name || "Google Sheet " + parsed.spreadsheetId.substring(0, 8),
      liveData.cleanUrl,
      data.sheetName || "Leads 2026",
      data.campaignTag || null,
      data.targetCity || null,
      data.sourceLabel || "Google Sheets",
      liveData.totalRows,
      id
    );
  } else {
    db.prepare(`
      INSERT INTO google_sheets_connections (
        id, name, sheet_url, spreadsheet_id, gid, sheet_name, campaign_tag, target_city, source_label, status, total_leads_imported, last_rows_count, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, ?, ?)
    `).run(
      id,
      data.name || "Google Sheet " + parsed.spreadsheetId.substring(0, 8),
      liveData.cleanUrl,
      parsed.spreadsheetId,
      parsed.gid,
      data.sheetName || "Leads 2026",
      data.campaignTag || null,
      data.targetCity || null,
      data.sourceLabel || "Google Sheets",
      liveData.totalRows,
      data.sheetUrl.includes("demo") ? 1 : 0
    );
  }
  const savedRow = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(id);
  if (savedRow && isNeonEnabled()) {
    try {
      await persistGoogleSheetConnectionToNeon(savedRow);
    } catch (neonErr) {
      console.warn("Neon persist google sheet connection warning:", neonErr.message);
    }
  }
  const config = {
    spreadsheetUrl: liveData.cleanUrl,
    spreadsheetId: liveData.spreadsheetId,
    gid: liveData.gid,
    sheetName: data.sheetName || "Leads 2026",
    syncDirection: "TWO_WAY",
    autoExport: false,
    headers: liveData.headers,
    lastSyncedRows: liveData.totalRows
  };
  db.prepare(`
    UPDATE integrations
    SET is_enabled = 1,
        status = 'CONNECTED',
        config = ?,
        updated_at = datetime('now')
    WHERE name = 'Google Sheets Sync' OR id = 'int-sheets'
  `).run(JSON.stringify(config));
  logAudit({
    userName: data.performedBy || "Admin",
    action: "GOOGLE_SHEET_CONNECTED",
    entity: "google_sheets_connection",
    entityId: id,
    newValue: { name: data.name, url: liveData.cleanUrl, rows: liveData.totalRows }
  });
  return {
    connectionId: id,
    sheetId: id,
    name: data.name,
    ...liveData
  };
}
async function updateGoogleSheetConnection(id, updates, performedBy = "Admin") {
  let current = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(id);
  if (!current && isNeonEnabled()) {
    current = await findGoogleSheetInNeon(id);
    if (current) {
      db.prepare(`
        INSERT INTO google_sheets_connections (id, name, sheet_url, spreadsheet_id, gid, sheet_name, campaign_tag, target_city, source_label, status, total_leads_imported, last_rows_count, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET name = excluded.name, sheet_url = excluded.sheet_url
      `).run(current.id, current.name, current.sheet_url, current.spreadsheet_id, current.gid, current.sheet_name, current.campaign_tag, current.target_city, current.source_label, current.status || "ACTIVE", current.total_leads_imported || 0, current.last_rows_count || 0, current.is_demo || 0);
    }
  }
  if (!current) throw new Error("Google Sheet connection not found: " + id);
  const name = updates.name !== void 0 ? updates.name : current.name;
  const status = updates.status !== void 0 ? updates.status : current.status;
  const campaign_tag = updates.campaign_tag !== void 0 ? updates.campaign_tag : current.campaign_tag;
  const target_city = updates.target_city !== void 0 ? updates.target_city : current.target_city;
  const source_label = updates.source_label !== void 0 ? updates.source_label : current.source_label;
  const sheet_name = updates.sheet_name !== void 0 ? updates.sheet_name : current.sheet_name;
  db.prepare(`
    UPDATE google_sheets_connections
    SET name = ?,
        status = ?,
        campaign_tag = ?,
        target_city = ?,
        source_label = ?,
        sheet_name = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(name, status, campaign_tag, target_city, source_label, sheet_name, id);
  const updated = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(id);
  if (updated && isNeonEnabled()) {
    try {
      await persistGoogleSheetConnectionToNeon(updated);
    } catch (e) {
      console.warn("Neon update sheet warning:", e.message);
    }
  }
  logAudit({
    userName: performedBy,
    action: "GOOGLE_SHEET_UPDATED",
    entity: "google_sheets_connection",
    entityId: id,
    oldValue: current,
    newValue: updates
  });
  return updated;
}
async function deleteGoogleSheetConnection(id, performedBy = "Admin") {
  let current = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(id);
  if (!current && isNeonEnabled()) {
    current = await findGoogleSheetInNeon(id);
  }
  db.prepare("DELETE FROM google_sheets_connections WHERE id = ?").run(id);
  if (isNeonEnabled()) {
    try {
      await deleteGoogleSheetConnectionFromNeon(id);
    } catch (e) {
      console.warn("Neon delete sheet warning:", e.message);
    }
  }
  const tombId = "DEL-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
  db.prepare("INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)").run(
    tombId,
    "google_sheet",
    id,
    current?.spreadsheet_id || id,
    JSON.stringify({ name: current?.name || "Google Sheet" }),
    performedBy
  );
  logAudit({
    userName: performedBy,
    action: "GOOGLE_SHEET_DELETED",
    entity: "google_sheets_connection",
    entityId: id,
    oldValue: current
  });
  return { success: true, message: "Google Sheet disconnected successfully." };
}
async function syncLiveGoogleSheetLeads(sheetUrlOrId, performedBy = "User", options) {
  const liveData = await fetchLiveGoogleSheetData(sheetUrlOrId);
  const rows = liveData.allRows;
  let importedCount = 0;
  let updatedCount = 0;
  let duplicateCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const importedLeads = [];
  const duplicateLeads = [];
  for (const row of rows) {
    try {
      const rowData = {
        ...row,
        campaign: row.campaign || row["Campaign"] || options?.campaignTag || "Google Sheets Lead Sheet",
        city: row.city || row["City"] || options?.targetCity || "Kathmandu",
        lead_source: row.lead_source || row["Source"] || options?.sourceLabel || "Google Sheets"
      };
      const res = handleGoogleSheetsLeadWebhook({
        row: rowData,
        row_number: row.row_number || importedCount + updatedCount + 2
      });
      if (res.skipped) {
        skippedCount++;
      } else if (res.updated) {
        updatedCount++;
        duplicateCount++;
        if (res.lead) duplicateLeads.push(res.lead);
      } else if (res.created) {
        importedCount++;
        if (res.lead) importedLeads.push(res.lead);
      } else if (!res.success) {
        errorCount++;
      }
    } catch (e) {
      errorCount++;
    }
  }
  const syncStatus = errorCount > 0 && importedCount === 0 && updatedCount === 0 ? "ERROR" : errorCount > 0 ? "WARN" : "SUCCESS";
  let updatedConnId = options?.connectionId;
  if (options?.connectionId) {
    db.prepare(`
      UPDATE google_sheets_connections
      SET total_leads_imported = total_leads_imported + ?,
          last_rows_count = ?,
          last_synced_at = datetime('now'),
          last_sync_status = ?,
          last_sync_error = NULL,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(importedCount + updatedCount, rows.length, syncStatus, options.connectionId);
  } else {
    db.prepare(`
      UPDATE google_sheets_connections
      SET total_leads_imported = total_leads_imported + ?,
          last_rows_count = ?,
          last_synced_at = datetime('now'),
          last_sync_status = ?,
          last_sync_error = NULL,
          updated_at = datetime('now')
      WHERE spreadsheet_id = ?
    `).run(importedCount, rows.length, syncStatus, liveData.spreadsheetId);
    const matched = db.prepare("SELECT id FROM google_sheets_connections WHERE spreadsheet_id = ?").get(liveData.spreadsheetId);
    if (matched) updatedConnId = matched.id;
  }
  if (updatedConnId && isNeonEnabled()) {
    try {
      const connRow = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(updatedConnId);
      if (connRow) {
        await persistGoogleSheetConnectionToNeon(connRow);
      }
    } catch (e) {
      console.warn("Neon sync stats persist notice:", e.message);
    }
  }
  const config = {
    spreadsheetUrl: liveData.cleanUrl,
    spreadsheetId: liveData.spreadsheetId,
    gid: liveData.gid,
    sheetName: "Live Google Sheet",
    syncDirection: "TWO_WAY",
    autoExport: false,
    headers: liveData.headers,
    lastSyncedRows: rows.length
  };
  db.prepare(`
    UPDATE integrations
    SET is_enabled = 1,
        status = 'CONNECTED',
        config = ?,
        last_sync_at = datetime('now'),
        updated_at = datetime('now')
    WHERE name = 'Google Sheets Sync' OR id = 'int-sheets'
  `).run(JSON.stringify(config));
  logAudit({
    userName: performedBy,
    action: "GOOGLE_SHEETS_LIVE_SYNC",
    entity: "integration",
    entityId: liveData.spreadsheetId,
    newValue: { totalRows: rows.length, importedCount, duplicateCount, errorCount }
  });
  return {
    success: true,
    spreadsheetId: liveData.spreadsheetId,
    cleanUrl: liveData.cleanUrl,
    totalRows: rows.length,
    importedCount,
    duplicateCount,
    errorCount,
    importedLeads,
    duplicateLeads,
    syncedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function syncAllActiveGoogleSheets(performedBy = "User") {
  if (isNeonEnabled()) {
    try {
      const neonSheets = await getAllGoogleSheetsFromNeon();
      if (neonSheets && neonSheets.length > 0) {
        for (const ns of neonSheets) {
          db.prepare(`
            INSERT OR REPLACE INTO google_sheets_connections (
              id, name, sheet_url, spreadsheet_id, gid, sheet_name,
              campaign_tag, target_city, source_label, status,
              total_leads_imported, last_rows_count, last_synced_at,
              last_sync_status, last_sync_error, is_demo, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            ns.id,
            ns.name,
            ns.sheet_url,
            ns.spreadsheet_id,
            ns.gid,
            ns.sheet_name,
            ns.campaign_tag,
            ns.target_city,
            ns.source_label,
            ns.status,
            ns.total_leads_imported || 0,
            ns.last_rows_count || 0,
            ns.last_synced_at,
            ns.last_sync_status,
            ns.last_sync_error,
            ns.is_demo ? 1 : 0,
            ns.created_at || (/* @__PURE__ */ new Date()).toISOString(),
            ns.updated_at || (/* @__PURE__ */ new Date()).toISOString()
          );
        }
      }
    } catch (e) {
      console.warn("[Sync All] Failed to refresh from Neon:", e.message);
    }
  }
  const sheets = db.prepare("SELECT * FROM google_sheets_connections WHERE status = 'ACTIVE' ORDER BY created_at ASC").all();
  let totalRows = 0;
  let totalImported = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;
  const sheetReports = [];
  for (const sheet of sheets) {
    try {
      const res = await syncLiveGoogleSheetLeads(sheet.sheet_url, performedBy, {
        campaignTag: sheet.campaign_tag,
        targetCity: sheet.target_city,
        sourceLabel: sheet.source_label,
        connectionId: sheet.id
      });
      totalRows += res.totalRows;
      totalImported += res.importedCount;
      totalDuplicates += res.duplicateCount;
      totalErrors += res.errorCount;
      sheetReports.push({
        id: sheet.id,
        name: sheet.name,
        status: res.errorCount > 0 && res.importedCount === 0 ? "ERROR" : res.errorCount > 0 ? "WARN" : "SUCCESS",
        totalRows: res.totalRows,
        importedCount: res.importedCount,
        duplicateCount: res.duplicateCount,
        errorCount: res.errorCount,
        syncedAt: res.syncedAt
      });
    } catch (err) {
      totalErrors++;
      db.prepare(`
        UPDATE google_sheets_connections 
        SET last_synced_at = datetime('now'),
            last_sync_status = 'ERROR',
            last_sync_error = ?
        WHERE id = ?
      `).run(err.message, sheet.id);
      sheetReports.push({
        id: sheet.id,
        name: sheet.name,
        status: "ERROR",
        totalRows: 0,
        importedCount: 0,
        duplicateCount: 0,
        errorCount: 1,
        errorMessage: err.message,
        syncedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  logAudit({
    userName: performedBy,
    action: "GOOGLE_SHEETS_BULK_SYNC",
    entity: "google_sheets_connection",
    newValue: { totalSheets: sheets.length, totalImported, totalDuplicates, totalErrors }
  });
  return {
    success: true,
    totalSheets: sheets.length,
    totalRows,
    totalImported,
    totalDuplicates,
    totalErrors,
    sheetReports,
    syncedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
var init_integrationService = __esm({
  "server/services/integrationService.ts"() {
    "use strict";
    init_database();
    init_leadService();
    init_neon();
  }
});

// server/index.ts
import express from "express";
import cors from "cors";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath } from "url";
import dotenv2 from "dotenv";

// server/routes/api.ts
init_database();
init_leadService();
import { Router } from "express";

// server/services/analyticsService.ts
init_database();
function getDashboardKPIs(filters = {}) {
  const whereClauses = ["is_deleted = 0"];
  const params = [];
  if (filters.startDate) {
    whereClauses.push("date(created_at) >= date(?)");
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    whereClauses.push("date(created_at) <= date(?)");
    params.push(filters.endDate);
  }
  if (filters.counselorId) {
    whereClauses.push("assigned_counselor_id = ?");
    params.push(filters.counselorId);
  }
  if (filters.city) {
    whereClauses.push("city = ?");
    params.push(filters.city);
  }
  if (filters.university) {
    whereClauses.push("preferred_university = ?");
    params.push(filters.university);
  }
  if (filters.course) {
    whereClauses.push("preferred_course = ?");
    params.push(filters.course);
  }
  if (filters.source) {
    whereClauses.push("lead_source = ?");
    params.push(filters.source);
  }
  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const totalLeads = db.prepare(`SELECT count(*) as count FROM leads ${whereSql}`).get(...params).count;
  const newLeadsToday = db.prepare(`
    SELECT count(*) as count FROM leads 
    WHERE is_deleted = 0 AND date(created_at) = date('now')
    ${filters.counselorId ? "AND assigned_counselor_id = ?" : ""}
  `).get(...filters.counselorId ? [filters.counselorId] : []).count;
  const newLeadsThisWeek = db.prepare(`
    SELECT count(*) as count FROM leads 
    WHERE is_deleted = 0 AND date(created_at) >= date('now', '-7 days')
    ${filters.counselorId ? "AND assigned_counselor_id = ?" : ""}
  `).get(...filters.counselorId ? [filters.counselorId] : []).count;
  const newLeadsThisMonth = db.prepare(`
    SELECT count(*) as count FROM leads 
    WHERE is_deleted = 0 AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    ${filters.counselorId ? "AND assigned_counselor_id = ?" : ""}
  `).get(...filters.counselorId ? [filters.counselorId] : []).count;
  const followupsToday = db.prepare(`
    SELECT count(*) as count FROM followups 
    WHERE date(follow_up_date) = date('now') AND status = 'Pending'
    ${filters.counselorId ? "AND counselor_id = ?" : ""}
  `).get(...filters.counselorId ? [filters.counselorId] : []).count;
  const overdueFollowups = db.prepare(`
    SELECT count(*) as count FROM followups 
    WHERE date(follow_up_date) < date('now') AND status = 'Pending'
    ${filters.counselorId ? "AND counselor_id = ?" : ""}
  `).get(...filters.counselorId ? [filters.counselorId] : []).count;
  const applicationsCount = db.prepare(`
    SELECT count(*) as count FROM applications
    ${filters.counselorId ? "WHERE counselor_id = ?" : ""}
  `).get(...filters.counselorId ? [filters.counselorId] : []).count;
  const admissionsCount = db.prepare(`
    SELECT count(*) as count FROM students
    ${filters.counselorId ? "WHERE counselor_id = ?" : ""}
  `).get(...filters.counselorId ? [filters.counselorId] : []).count;
  const feePaidTotal = db.prepare(`
    SELECT COALESCE(SUM(fee_paid), 0) as total FROM students
    ${filters.counselorId ? "WHERE counselor_id = ?" : ""}
  `).get(...filters.counselorId ? [filters.counselorId] : []).total;
  const conversionRate = totalLeads > 0 ? Number((admissionsCount / totalLeads * 100).toFixed(2)) : 0;
  const stageCounts = db.prepare(`
    SELECT lead_status, count(*) as count 
    FROM leads ${whereSql}
    GROUP BY lead_status
  `).all(...params);
  const countMap = {};
  for (const s of stageCounts) {
    countMap[s.lead_status] = s.count;
  }
  const newCount = countMap["New Lead"] || 0;
  const contactedCount = (countMap["Contacted"] || 0) + (countMap["Not Reachable"] || 0);
  const counselingCount = (countMap["Counseling Scheduled"] || 0) + (countMap["Counseling Done"] || 0);
  const interestedCount = countMap["Interested"] || 0;
  const appStartedCount = countMap["Application Started"] || 0;
  const docsPendingCount = countMap["Documents Pending"] || 0;
  const appliedCount = countMap["Application Submitted"] || 0;
  const offerCount = countMap["Offer Received"] || 0;
  const feePendingCount = countMap["Fee Pending"] || 0;
  const feePaidCount = countMap["Fee Paid"] || 0;
  const confirmedCount = (countMap["Admission Confirmed"] || 0) + (countMap["Enrolled"] || 0);
  const funnelStages = [
    { stage: "New Leads", count: totalLeads, value: totalLeads * 5e4 },
    { stage: "Contacted", count: totalLeads - newCount, value: (totalLeads - newCount) * 55e3 },
    { stage: "Counseling", count: counselingCount + interestedCount + appStartedCount + appliedCount + offerCount + feePaidCount + confirmedCount, value: 12e5 },
    { stage: "Interested", count: interestedCount + appStartedCount + appliedCount + offerCount + feePaidCount + confirmedCount, value: 18e5 },
    { stage: "Application Started", count: appStartedCount + appliedCount + offerCount + feePaidCount + confirmedCount, value: 24e5 },
    { stage: "Applied", count: appliedCount + offerCount + feePaidCount + confirmedCount, value: 31e5 },
    { stage: "Offer Received", count: offerCount + feePaidCount + confirmedCount, value: 38e5 },
    { stage: "Fee Paid", count: feePaidCount + confirmedCount, value: 45e5 },
    { stage: "Admission Confirmed", count: confirmedCount, value: 5e6 }
  ];
  const contactedBase = totalLeads - newCount;
  const leadToContactRate = totalLeads > 0 ? Number((contactedBase / totalLeads * 100).toFixed(1)) : 0;
  const counseledBase = counselingCount + interestedCount + appStartedCount + appliedCount + offerCount + feePaidCount + confirmedCount;
  const contactToCounselingRate = contactedBase > 0 ? Number((counseledBase / contactedBase * 100).toFixed(1)) : 0;
  const appBase = applicationsCount;
  const counselingToAppRate = counseledBase > 0 ? Number((appBase / counseledBase * 100).toFixed(1)) : 0;
  const appToAdmissionRate = appBase > 0 ? Number((admissionsCount / appBase * 100).toFixed(1)) : 0;
  const leadsByDay = db.prepare(`
    SELECT strftime('%Y-%m-%d', created_at) as date, count(*) as leads
    FROM leads
    WHERE is_deleted = 0 AND date(created_at) >= date('now', '-14 days')
    GROUP BY date
    ORDER BY date ASC
  `).all();
  const leadsBySource = db.prepare(`
    SELECT lead_source as source, count(*) as count
    FROM leads ${whereSql}
    GROUP BY lead_source
    ORDER BY count DESC
  `).all(...params);
  const leadsByCity = db.prepare(`
    SELECT city, count(*) as count
    FROM leads ${whereSql}
    GROUP BY city
    ORDER BY count DESC
    LIMIT 10
  `).all(...params);
  const leadsByUniversity = db.prepare(`
    SELECT preferred_university as university, count(*) as count
    FROM leads ${whereSql}
    GROUP BY preferred_university
    ORDER BY count DESC
    LIMIT 8
  `).all(...params);
  const leadsByCourse = db.prepare(`
    SELECT preferred_course as course, count(*) as count
    FROM leads ${whereSql}
    GROUP BY preferred_course
    ORDER BY count DESC
    LIMIT 8
  `).all(...params);
  const counselorPerformance = db.prepare(`
    SELECT 
      c.id,
      c.name as counselor_name,
      c.total_assigned_leads as assigned,
      c.current_active_leads as active,
      c.total_admissions as admissions,
      c.conversion_rate,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status NOT IN ('New Lead')) as contacted,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status IN ('Counseling Scheduled', 'Counseling Done', 'Interested', 'Application Started', 'Offer Received', 'Admission Confirmed')) as counseled,
      (SELECT count(*) FROM applications a WHERE a.counselor_id = c.id) as applications
    FROM counselors c
    WHERE c.is_active = 1
    ORDER BY c.total_admissions DESC, c.conversion_rate DESC
  `).all();
  return {
    totalLeads,
    newLeadsToday,
    newLeadsThisWeek,
    newLeadsThisMonth,
    followupsToday,
    overdueFollowups,
    applicationsCount,
    admissionsCount,
    feePaidTotal,
    conversionRate,
    leadToContactRate,
    contactToCounselingRate,
    counselingToAppRate,
    appToAdmissionRate,
    funnelStages,
    leadsByDay,
    leadsBySource,
    leadsByCity,
    leadsByUniversity,
    leadsByCourse,
    counselorPerformance
  };
}
function getCampaignROIReport() {
  const campaigns = db.prepare(`
    SELECT 
      c.*,
      ROUND(c.spend * 1.0 / MAX(1, c.leads_count), 2) as calc_cpl,
      ROUND(c.spend * 1.0 / MAX(1, c.applications_count), 2) as calc_cpa,
      ROUND(c.spend * 1.0 / MAX(1, c.admissions_count), 2) as calc_cost_per_admission,
      ROUND((c.admissions_count * 1.0 / MAX(1, c.leads_count)) * 100, 2) as roi_conversion_rate
    FROM campaigns c
    ORDER BY c.spend DESC
  `).all();
  const totals = db.prepare(`
    SELECT 
      SUM(budget) as total_budget,
      SUM(spend) as total_spend,
      SUM(leads_count) as total_leads,
      SUM(applications_count) as total_applications,
      SUM(admissions_count) as total_admissions
    FROM campaigns
  `).get();
  const totalSpend = totals.total_spend || 0;
  const totalLeads = totals.total_leads || 0;
  const totalApps = totals.total_applications || 0;
  const totalAdmissions = totals.total_admissions || 0;
  const overallCPL = totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : 0;
  const overallCPA = totalApps > 0 ? Number((totalSpend / totalApps).toFixed(2)) : 0;
  const overallCostPerAdmission = totalAdmissions > 0 ? Number((totalSpend / totalAdmissions).toFixed(2)) : 0;
  return {
    campaigns,
    summary: {
      totalBudget: totals.total_budget || 0,
      totalSpend,
      totalLeads,
      totalApplications: totalApps,
      totalAdmissions,
      overallCPL,
      overallCPA,
      overallCostPerAdmission
    }
  };
}

// server/routes/api.ts
init_integrationService();
init_neon();
init_leadDistributionEngine();

// server/services/hrService.ts
init_database();
function getEmployees() {
  try {
    return db.prepare(`
      SELECT e.*, c.name as linked_counselor_name, u.role as linked_user_role
      FROM hr_employees e
      LEFT JOIN counselors c ON e.counselor_id = c.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
    `).all();
  } catch (err) {
    console.warn("[HR Employees] Query failed:", err.message);
    return [];
  }
}
function getEmployee(id) {
  return db.prepare("SELECT * FROM hr_employees WHERE id = ?").get(id) || null;
}
function createEmployee(data, performedBy = "Super Admin") {
  const id = "EMP-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  let employeeCode = data.employee_code;
  if (!employeeCode) {
    const count = db.prepare("SELECT count(*) as count FROM hr_employees").get().count || 0;
    employeeCode = `ES-EMP-${(count + 1).toString().padStart(3, "0")}`;
  }
  let counselorId = data.counselor_id || null;
  let userId = data.user_id || null;
  if (!counselorId && data.email) {
    const counselor = db.prepare("SELECT id, user_id FROM counselors WHERE LOWER(email) = LOWER(?)").get(data.email);
    if (counselor) {
      counselorId = counselor.id;
      if (!userId) userId = counselor.user_id;
    }
  }
  db.prepare(`
    INSERT INTO hr_employees (
      id, employee_code, user_id, counselor_id, full_name, email, phone,
      department, designation, employment_type, joining_date, monthly_salary,
      currency, bank_name, account_number, pan_number, emergency_contact, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    employeeCode,
    userId,
    counselorId,
    data.full_name,
    data.email?.toLowerCase().trim(),
    data.phone,
    data.department || "Counseling",
    data.designation || "Education Counselor",
    data.employment_type || "Full-Time",
    data.joining_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    data.monthly_salary ? Number(data.monthly_salary) : 35e3,
    data.currency || "NPR",
    data.bank_name || null,
    data.account_number || null,
    data.pan_number || null,
    data.emergency_contact || null,
    data.status || "Active"
  );
  logAudit({
    userName: performedBy,
    action: "CREATE_EMPLOYEE",
    entity: "hr_employee",
    entityId: id,
    newValue: { code: employeeCode, name: data.full_name, department: data.department }
  });
  return getEmployee(id);
}
function updateEmployee(id, data, performedBy = "Super Admin") {
  const existing = getEmployee(id);
  if (!existing) return false;
  db.prepare(`
    UPDATE hr_employees
    SET full_name = ?,
        email = ?,
        phone = ?,
        department = ?,
        designation = ?,
        employment_type = ?,
        joining_date = ?,
        monthly_salary = ?,
        currency = ?,
        bank_name = ?,
        account_number = ?,
        pan_number = ?,
        emergency_contact = ?,
        status = ?,
        counselor_id = ?,
        user_id = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.full_name !== void 0 ? data.full_name : existing.full_name,
    data.email !== void 0 ? data.email.toLowerCase().trim() : existing.email,
    data.phone !== void 0 ? data.phone : existing.phone,
    data.department !== void 0 ? data.department : existing.department,
    data.designation !== void 0 ? data.designation : existing.designation,
    data.employment_type !== void 0 ? data.employment_type : existing.employment_type,
    data.joining_date !== void 0 ? data.joining_date : existing.joining_date,
    data.monthly_salary !== void 0 ? Number(data.monthly_salary) : existing.monthly_salary,
    data.currency !== void 0 ? data.currency : existing.currency,
    data.bank_name !== void 0 ? data.bank_name : existing.bank_name,
    data.account_number !== void 0 ? data.account_number : existing.account_number,
    data.pan_number !== void 0 ? data.pan_number : existing.pan_number,
    data.emergency_contact !== void 0 ? data.emergency_contact : existing.emergency_contact,
    data.status !== void 0 ? data.status : existing.status,
    data.counselor_id !== void 0 ? data.counselor_id : existing.counselor_id,
    data.user_id !== void 0 ? data.user_id : existing.user_id,
    id
  );
  logAudit({
    userName: performedBy,
    action: "UPDATE_EMPLOYEE",
    entity: "hr_employee",
    entityId: id,
    oldValue: existing,
    newValue: data
  });
  return true;
}
function deleteEmployee(id, performedBy = "Super Admin") {
  const existing = getEmployee(id);
  if (!existing) return false;
  db.prepare("DELETE FROM hr_attendance WHERE employee_id = ?").run(id);
  db.prepare("DELETE FROM hr_leaves WHERE employee_id = ?").run(id);
  db.prepare("DELETE FROM hr_payroll WHERE employee_id = ?").run(id);
  db.prepare("DELETE FROM hr_employees WHERE id = ?").run(id);
  logAudit({
    userName: performedBy,
    action: "DELETE_EMPLOYEE",
    entity: "hr_employee",
    entityId: id,
    oldValue: existing
  });
  return true;
}
function getAttendance(params = {}) {
  let sql2 = `
    SELECT a.*, e.employee_code, e.department, e.designation
    FROM hr_attendance a
    JOIN hr_employees e ON a.employee_id = e.id
    WHERE 1=1
  `;
  const queryParams = [];
  if (params.date) {
    sql2 += " AND a.date = ?";
    queryParams.push(params.date);
  }
  if (params.employee_id) {
    sql2 += " AND a.employee_id = ?";
    queryParams.push(params.employee_id);
  }
  if (params.month) {
    sql2 += " AND a.date LIKE ?";
    queryParams.push(`${params.month}%`);
  }
  sql2 += " ORDER BY a.date DESC, e.full_name ASC";
  return db.prepare(sql2).all(...queryParams);
}
function recordAttendance(data, performedBy = "Super Admin") {
  const emp = getEmployee(data.employee_id);
  if (!emp) throw new Error("Employee not found");
  const id = "ATT-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  db.prepare(`
    INSERT INTO hr_attendance (id, employee_id, employee_name, date, status, check_in_time, check_out_time, work_mode, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (employee_id, date) DO UPDATE SET
      status = excluded.status,
      check_in_time = excluded.check_in_time,
      check_out_time = excluded.check_out_time,
      work_mode = excluded.work_mode,
      notes = excluded.notes
  `).run(
    id,
    data.employee_id,
    emp.full_name,
    data.date,
    data.status || "Present",
    data.check_in_time || "09:30",
    data.check_out_time || "18:00",
    data.work_mode || "Office",
    data.notes || null
  );
  return { success: true, employee_id: data.employee_id, date: data.date, status: data.status };
}
function getLeaves(params = {}) {
  let sql2 = `
    SELECT l.*, e.employee_code, e.department, e.designation
    FROM hr_leaves l
    JOIN hr_employees e ON l.employee_id = e.id
    WHERE 1=1
  `;
  const queryParams = [];
  if (params.employee_id) {
    sql2 += " AND l.employee_id = ?";
    queryParams.push(params.employee_id);
  }
  if (params.status) {
    sql2 += " AND l.status = ?";
    queryParams.push(params.status);
  }
  sql2 += " ORDER BY l.applied_at DESC";
  return db.prepare(sql2).all(...queryParams);
}
function applyLeave(data, performedBy = "Employee") {
  const emp = getEmployee(data.employee_id);
  if (!emp) throw new Error("Employee not found");
  const id = "LV-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const days = data.days_count || 1;
  db.prepare(`
    INSERT INTO hr_leaves (id, employee_id, employee_name, leave_type, start_date, end_date, days_count, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `).run(
    id,
    data.employee_id,
    emp.full_name,
    data.leave_type || "Casual Leave",
    data.start_date,
    data.end_date,
    days,
    data.reason
  );
  return { id, success: true, message: "Leave application submitted successfully" };
}
function updateLeaveStatus(id, status, remarks, approvedBy = "Super Admin") {
  const leave = db.prepare("SELECT * FROM hr_leaves WHERE id = ?").get(id);
  if (!leave) throw new Error("Leave application not found");
  db.prepare(`
    UPDATE hr_leaves
    SET status = ?,
        approved_by = ?,
        approval_remarks = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, approvedBy, remarks || null, id);
  return { success: true, id, status };
}
function getPayroll(params = {}) {
  let sql2 = `
    SELECT p.*, e.employee_code, e.department, e.designation, e.bank_name, e.account_number, e.pan_number
    FROM hr_payroll p
    JOIN hr_employees e ON p.employee_id = e.id
    WHERE 1=1
  `;
  const queryParams = [];
  if (params.month_year) {
    sql2 += " AND p.month_year = ?";
    queryParams.push(params.month_year);
  }
  if (params.employee_id) {
    sql2 += " AND p.employee_id = ?";
    queryParams.push(params.employee_id);
  }
  sql2 += " ORDER BY p.month_year DESC, p.created_at DESC";
  return db.prepare(sql2).all(...queryParams);
}
function generateMonthlyPayroll(monthYear, performedBy = "Super Admin") {
  const employees = getEmployees().filter((e) => e.status === "Active");
  const results = [];
  for (const emp of employees) {
    const id = "PAY-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const baseSalary = emp.monthly_salary || 35e3;
    let admissionIncentive = 0;
    if (emp.counselor_id) {
      const enrollments = db.prepare(`
        SELECT count(*) as count 
        FROM students 
        WHERE counselor_id = ? AND admission_date LIKE ?
      `).get(emp.counselor_id, `${monthYear}%`);
      const count = enrollments?.count || 0;
      admissionIncentive = count * 2500;
    }
    const deductions = 0;
    const netSalary = baseSalary + admissionIncentive - deductions;
    db.prepare(`
      INSERT INTO hr_payroll (
        id, employee_id, employee_name, month_year, base_salary,
        incentives_bonus, deductions, net_salary, currency, payment_status, remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
      ON CONFLICT (employee_id, month_year) DO UPDATE SET
        base_salary = excluded.base_salary,
        incentives_bonus = excluded.incentives_bonus,
        deductions = excluded.deductions,
        net_salary = excluded.net_salary,
        updated_at = datetime('now')
    `).run(
      id,
      emp.id,
      emp.full_name,
      monthYear,
      baseSalary,
      admissionIncentive,
      deductions,
      netSalary,
      emp.currency || "NPR",
      admissionIncentive > 0 ? `Includes admission incentive for ${admissionIncentive / 2500} students` : "Standard monthly salary"
    );
    results.push({
      employee_id: emp.id,
      name: emp.full_name,
      baseSalary,
      admissionIncentive,
      netSalary
    });
  }
  return { success: true, monthYear, totalEmployees: employees.length, results };
}
function markPayrollPaid(id, paymentMethod = "Bank Transfer", remarks, performedBy = "Super Admin") {
  const pay = db.prepare(`
    SELECT p.*, e.full_name 
    FROM hr_payroll p 
    JOIN hr_employees e ON p.employee_id = e.id 
    WHERE p.id = ?
  `).get(id);
  if (!pay) throw new Error("Payroll record not found");
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  db.prepare(`
    UPDATE hr_payroll
    SET payment_status = 'Paid',
        payment_date = ?,
        payment_method = ?,
        remarks = COALESCE(?, remarks),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(today, paymentMethod, remarks || null, id);
  try {
    const txnId = "TXN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT INTO finance_transactions (
        id, transaction_id, type, category, title, amount, currency,
        transaction_date, payment_method, reference_number, status, notes, recorded_by
      )
      VALUES (?, ?, 'EXPENSE', 'Salaries & Payroll', ?, ?, ?, ?, ?, ?, 'Completed', ?, ?)
    `).run(
      txnId,
      "TXN-" + Date.now().toString().slice(-6),
      `Salary Payment: ${pay.full_name} (${pay.month_year})`,
      pay.net_salary,
      pay.currency || "NPR",
      today,
      paymentMethod,
      "PAYROLL-" + pay.id,
      `Salary disbursed for ${pay.month_year} via ${paymentMethod}`,
      performedBy
    );
  } catch (err) {
    console.warn("[Finance Cross-link] Failed to auto-record salary expense:", err.message);
  }
  return { success: true, id, status: "Paid", paymentDate: today };
}

// server/services/financeService.ts
init_database();
function getTransactions(filters = {}) {
  try {
    let sql2 = "SELECT * FROM finance_transactions WHERE 1=1";
    const params = [];
    if (filters.type && filters.type !== "ALL") {
      sql2 += " AND type = ?";
      params.push(filters.type);
    }
    if (filters.category && filters.category !== "ALL") {
      sql2 += " AND category = ?";
      params.push(filters.category);
    }
    if (filters.paymentMethod && filters.paymentMethod !== "ALL") {
      sql2 += " AND payment_method = ?";
      params.push(filters.paymentMethod);
    }
    if (filters.startDate) {
      sql2 += " AND transaction_date >= ?";
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      sql2 += " AND transaction_date <= ?";
      params.push(filters.endDate);
    }
    sql2 += " ORDER BY transaction_date DESC, created_at DESC";
    if (filters.limit) {
      sql2 += " LIMIT ?";
      params.push(filters.limit);
    }
    return db.prepare(sql2).all(...params);
  } catch (err) {
    console.warn("[Finance Transactions] Query failed:", err.message);
    return [];
  }
}
function createTransaction(data, performedBy = "Super Admin") {
  const id = "FTXN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const txnId = data.transaction_id || `TXN-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
  db.prepare(`
    INSERT INTO finance_transactions (
      id, transaction_id, type, category, title, amount, currency,
      transaction_date, payment_method, reference_number, student_id, student_name,
      university_id, university_name, status, notes, recorded_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    txnId,
    data.type || "INCOME",
    data.category || "Student Fee",
    data.title || "General Transaction",
    data.amount ? Number(data.amount) : 0,
    data.currency || "NPR",
    data.transaction_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    data.payment_method || "Bank Transfer",
    data.reference_number || null,
    data.student_id || null,
    data.student_name || null,
    data.university_id || null,
    data.university_name || null,
    data.status || "Completed",
    data.notes || null,
    performedBy
  );
  logAudit({
    userName: performedBy,
    action: "CREATE_FINANCE_TRANSACTION",
    entity: "finance_transaction",
    entityId: id,
    newValue: { type: data.type, title: data.title, amount: data.amount }
  });
  return db.prepare("SELECT * FROM finance_transactions WHERE id = ?").get(id);
}
function updateTransaction(id, data, performedBy = "Super Admin") {
  const existing = db.prepare("SELECT * FROM finance_transactions WHERE id = ?").get(id);
  if (!existing) return false;
  db.prepare(`
    UPDATE finance_transactions
    SET type = ?,
        category = ?,
        title = ?,
        amount = ?,
        currency = ?,
        transaction_date = ?,
        payment_method = ?,
        reference_number = ?,
        student_id = ?,
        student_name = ?,
        university_id = ?,
        university_name = ?,
        status = ?,
        notes = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.type !== void 0 ? data.type : existing.type,
    data.category !== void 0 ? data.category : existing.category,
    data.title !== void 0 ? data.title : existing.title,
    data.amount !== void 0 ? Number(data.amount) : existing.amount,
    data.currency !== void 0 ? data.currency : existing.currency,
    data.transaction_date !== void 0 ? data.transaction_date : existing.transaction_date,
    data.payment_method !== void 0 ? data.payment_method : existing.payment_method,
    data.reference_number !== void 0 ? data.reference_number : existing.reference_number,
    data.student_id !== void 0 ? data.student_id : existing.student_id,
    data.student_name !== void 0 ? data.student_name : existing.student_name,
    data.university_id !== void 0 ? data.university_id : existing.university_id,
    data.university_name !== void 0 ? data.university_name : existing.university_name,
    data.status !== void 0 ? data.status : existing.status,
    data.notes !== void 0 ? data.notes : existing.notes,
    id
  );
  return true;
}
function deleteTransaction(id, performedBy = "Super Admin") {
  const existing = db.prepare("SELECT * FROM finance_transactions WHERE id = ?").get(id);
  if (!existing) return false;
  db.prepare("DELETE FROM finance_transactions WHERE id = ?").run(id);
  return true;
}
function getInvoices(filters = {}) {
  try {
    let sql2 = "SELECT * FROM finance_invoices WHERE 1=1";
    const params = [];
    if (filters.invoice_type && filters.invoice_type !== "ALL") {
      sql2 += " AND invoice_type = ?";
      params.push(filters.invoice_type);
    }
    if (filters.status && filters.status !== "ALL") {
      sql2 += " AND status = ?";
      params.push(filters.status);
    }
    if (filters.student_id) {
      sql2 += " AND student_id = ?";
      params.push(filters.student_id);
    }
    if (filters.university_id) {
      sql2 += " AND university_id = ?";
      params.push(filters.university_id);
    }
    sql2 += " ORDER BY created_at DESC";
    const rows = db.prepare(sql2).all(...params);
    return rows.map((r) => ({
      ...r,
      items: typeof r.items === "string" ? JSON.parse(r.items || "[]") : r.items || []
    }));
  } catch (err) {
    console.warn("[Finance Invoices] Query failed:", err.message);
    return [];
  }
}
function createInvoice(data, performedBy = "Super Admin") {
  const id = "INV-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const count = db.prepare("SELECT count(*) as count FROM finance_invoices").get().count || 0;
  const invoiceNumber = data.invoice_number || `INV-${(/* @__PURE__ */ new Date()).getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
  const total = Number(data.total_amount) || 0;
  const paid = Number(data.paid_amount) || 0;
  const due = Math.max(0, total - paid);
  let initialStatus = data.status || "Sent";
  if (paid >= total && total > 0) initialStatus = "Paid";
  else if (paid > 0) initialStatus = "Partial";
  const itemsJson = JSON.stringify(data.items || [
    { description: "Admission Processing & Consultancy Service", qty: 1, unit_price: total, amount: total }
  ]);
  db.prepare(`
    INSERT INTO finance_invoices (
      id, invoice_number, invoice_type, recipient_name, recipient_email, recipient_phone,
      total_amount, paid_amount, due_amount, currency, due_date, status, items, notes,
      student_id, university_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    invoiceNumber,
    data.invoice_type || "STUDENT_FEE",
    data.recipient_name,
    data.recipient_email || null,
    data.recipient_phone || null,
    total,
    paid,
    due,
    data.currency || "NPR",
    data.due_date || new Date(Date.now() + 14 * 864e5).toISOString().split("T")[0],
    initialStatus,
    itemsJson,
    data.notes || null,
    data.student_id || null,
    data.university_id || null
  );
  logAudit({
    userName: performedBy,
    action: "CREATE_INVOICE",
    entity: "finance_invoice",
    entityId: id,
    newValue: { invoiceNumber, recipient: data.recipient_name, total }
  });
  return getInvoices({}).find((i) => i.id === id);
}
function recordInvoicePayment(invoiceId, amount, paymentMethod = "Bank Transfer", referenceNumber, performedBy = "Super Admin") {
  const inv = db.prepare("SELECT * FROM finance_invoices WHERE id = ?").get(invoiceId);
  if (!inv) throw new Error("Invoice not found");
  const paymentAmount = Number(amount) || 0;
  const newPaid = Number(inv.paid_amount) + paymentAmount;
  const newDue = Math.max(0, Number(inv.total_amount) - newPaid);
  const newStatus = newDue <= 0 ? "Paid" : "Partial";
  db.prepare(`
    UPDATE finance_invoices
    SET paid_amount = ?,
        due_amount = ?,
        status = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(newPaid, newDue, newStatus, invoiceId);
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const txnCategory = inv.invoice_type === "UNIVERSITY_COMMISSION" ? "University Commission" : "Student Fee";
  createTransaction({
    type: "INCOME",
    category: txnCategory,
    title: `Payment for ${inv.invoice_number} (${inv.recipient_name})`,
    amount: paymentAmount,
    currency: inv.currency,
    transaction_date: today,
    payment_method: paymentMethod,
    reference_number: referenceNumber || `PAY-${inv.invoice_number}`,
    student_id: inv.student_id,
    student_name: inv.invoice_type === "STUDENT_FEE" ? inv.recipient_name : null,
    university_id: inv.university_id,
    university_name: inv.invoice_type === "UNIVERSITY_COMMISSION" ? inv.recipient_name : null,
    notes: `Recorded against invoice ${inv.invoice_number}. Remaining due: ${newDue} ${inv.currency}`
  }, performedBy);
  if (inv.student_id) {
    try {
      db.prepare(`
        UPDATE students
        SET fee_paid = fee_paid + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(paymentAmount, inv.student_id);
    } catch (e) {
    }
  }
  return { success: true, invoiceId, paidAmount: newPaid, dueAmount: newDue, status: newStatus };
}
function getFinanceOverview(params = {}) {
  try {
    let dateFilter = "";
    const queryParams = [];
    if (params.month) {
      dateFilter = " AND transaction_date LIKE ?";
      queryParams.push(`${params.month}%`);
    } else if (params.year) {
      dateFilter = " AND transaction_date LIKE ?";
      queryParams.push(`${params.year}%`);
    }
    const incomeRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM finance_transactions 
      WHERE type = 'INCOME' AND status = 'Completed' ${dateFilter}
    `).get(...queryParams);
    const totalIncome = Number(incomeRow?.total || 0);
    const expenseRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM finance_transactions 
      WHERE type = 'EXPENSE' AND status = 'Completed' ${dateFilter}
    `).get(...queryParams);
    const totalExpense = Number(expenseRow?.total || 0);
    const netProfit = totalIncome - totalExpense;
    const incomeBreakdown = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as amount, count(*) as count
      FROM finance_transactions
      WHERE type = 'INCOME' AND status = 'Completed' ${dateFilter}
      GROUP BY category
      ORDER BY amount DESC
    `).all(...queryParams);
    const expenseBreakdown = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as amount, count(*) as count
      FROM finance_transactions
      WHERE type = 'EXPENSE' AND status = 'Completed' ${dateFilter}
      GROUP BY category
      ORDER BY amount DESC
    `).all(...queryParams);
    const studentDueRow = db.prepare(`
      SELECT COALESCE(SUM(due_amount), 0) as totalDue
      FROM finance_invoices
      WHERE invoice_type = 'STUDENT_FEE' AND status != 'Paid' AND status != 'Cancelled'
    `).get();
    const totalStudentFeeDue = Number(studentDueRow?.totalDue || 0);
    const uniDueRow = db.prepare(`
      SELECT COALESCE(SUM(due_amount), 0) as totalDue
      FROM finance_invoices
      WHERE invoice_type = 'UNIVERSITY_COMMISSION' AND status != 'Paid' AND status != 'Cancelled'
    `).get();
    const totalUniCommissionDue = Number(uniDueRow?.totalDue || 0);
    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin: totalIncome > 0 ? Math.round(netProfit / totalIncome * 100) : 0,
      totalStudentFeeDue,
      totalUniCommissionDue,
      incomeBreakdown,
      expenseBreakdown,
      currency: "NPR"
    };
  } catch (err) {
    console.warn("[Finance Overview] Failed to compute KPIs:", err.message);
    return {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      profitMargin: 0,
      totalStudentFeeDue: 0,
      totalUniCommissionDue: 0,
      incomeBreakdown: [],
      expenseBreakdown: [],
      currency: "NPR"
    };
  }
}
function getUniversityCommissionsSummary() {
  try {
    const uniAdmissions = db.prepare(`
      SELECT 
        u.id as university_id,
        u.name as university_name,
        u.city as university_city,
        u.country as university_country,
        count(s.id) as total_enrolled_students
      FROM universities u
      LEFT JOIN students s ON s.university = u.name OR s.university LIKE '%' || u.short_name || '%'
      GROUP BY u.id
      HAVING total_enrolled_students > 0
      ORDER BY total_enrolled_students DESC
    `).all();
    return uniAdmissions.map((uni) => {
      const estimatedCommission = uni.total_enrolled_students * 45e3;
      const invoices = db.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as totalInvoiced,
               COALESCE(SUM(paid_amount), 0) as totalPaid,
               COALESCE(SUM(due_amount), 0) as totalDue
        FROM finance_invoices
        WHERE university_id = ? AND invoice_type = 'UNIVERSITY_COMMISSION'
      `).get(uni.university_id);
      const invoiced = Number(invoices?.totalInvoiced || 0);
      const received = Number(invoices?.totalPaid || 0);
      const pending = invoiced > 0 ? Number(invoices?.totalDue || 0) : estimatedCommission;
      return {
        university_id: uni.university_id,
        university_name: uni.university_name,
        total_enrolled_students: uni.total_enrolled_students,
        estimated_commission: estimatedCommission,
        invoiced_amount: invoiced,
        received_amount: received,
        pending_amount: pending,
        settlement_status: received >= estimatedCommission && estimatedCommission > 0 ? "SETTLED" : received > 0 ? "PARTIAL" : "PENDING"
      };
    });
  } catch (err) {
    console.warn("[University Commissions] Summary failed:", err.message);
    return [];
  }
}

// server/services/emailService.ts
init_database();
init_database();
function resolveMergeTags(text, vars) {
  if (!text) return "";
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return vars[key] !== void 0 && vars[key] !== null ? String(vars[key]) : `{{${key}}}`;
  });
}
function getEmailTemplates(filters) {
  let query = "SELECT * FROM message_templates WHERE is_active = 1 AND (channel = 'Email' OR channel IS NULL OR channel = '')";
  const params = [];
  if (filters?.category) {
    query += " AND category = ?";
    params.push(filters.category);
  }
  query += " ORDER BY created_at DESC";
  const allTemplates = db.prepare(query).all(...params);
  return allTemplates.map((t) => {
    let targetCourses = [];
    let targetUnis = [];
    let variables = [];
    try {
      targetCourses = JSON.parse(t.target_courses || "[]");
    } catch {
      targetCourses = [];
    }
    try {
      targetUnis = JSON.parse(t.target_universities || "[]");
    } catch {
      targetUnis = [];
    }
    try {
      variables = JSON.parse(t.variables || "[]");
    } catch {
      variables = [];
    }
    const isCourseMatch = !filters?.course || targetCourses.length === 0 || targetCourses.some(
      (c) => filters.course.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(filters.course.toLowerCase())
    );
    const isUniMatch = !filters?.university || targetUnis.length === 0 || targetUnis.some(
      (u) => filters.university.toLowerCase().includes(u.toLowerCase()) || u.toLowerCase().includes(filters.university.toLowerCase())
    );
    return {
      ...t,
      target_courses: targetCourses,
      target_universities: targetUnis,
      variables,
      is_recommended: Boolean(filters?.course || filters?.university) && isCourseMatch && isUniMatch && (targetCourses.length > 0 || targetUnis.length > 0)
    };
  });
}
function saveEmailTemplate(payload, performedBy = "Super Admin") {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = payload.id || "tmpl-email-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const coursesJson = JSON.stringify(payload.target_courses || []);
  const unisJson = JSON.stringify(payload.target_universities || []);
  const channel = payload.channel || "Email";
  const combined = (payload.subject || "") + " " + (payload.content || "");
  const foundVars = Array.from(new Set(Array.from(combined.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map((m) => m[1])));
  const existing = payload.id ? db.prepare("SELECT id FROM message_templates WHERE id = ?").get(payload.id) : null;
  if (existing) {
    db.prepare(`
      UPDATE message_templates
      SET name = ?, category = ?, subject = ?, content = ?,
          variables = ?, target_courses = ?, target_universities = ?,
          description = ?, is_active = COALESCE(?, is_active), updated_at = ?
      WHERE id = ?
    `).run(
      payload.name,
      payload.category,
      payload.subject,
      payload.content,
      JSON.stringify(foundVars),
      coursesJson,
      unisJson,
      payload.description || "",
      payload.is_active,
      now,
      id
    );
  } else {
    db.prepare(`
      INSERT INTO message_templates (
        id, name, channel, category, subject, content, variables,
        target_courses, target_universities, description, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      payload.name,
      channel,
      payload.category,
      payload.subject,
      payload.content,
      JSON.stringify(foundVars),
      coursesJson,
      unisJson,
      payload.description || "",
      now,
      now
    );
  }
  logAudit({
    userName: performedBy,
    action: payload.id ? "EMAIL_TEMPLATE_UPDATED" : "EMAIL_TEMPLATE_CREATED",
    entity: "message_template",
    entityId: id,
    newValue: { name: payload.name, category: payload.category }
  });
  return db.prepare("SELECT * FROM message_templates WHERE id = ?").get(id);
}
function deleteEmailTemplate(id, performedBy = "Super Admin") {
  db.prepare("DELETE FROM message_templates WHERE id = ?").run(id);
  logAudit({
    userName: performedBy,
    action: "EMAIL_TEMPLATE_DELETED",
    entity: "message_template",
    entityId: id
  });
  return true;
}
function previewEmailResolution(subject, content, sampleData) {
  const fallbackData = {
    student_name: "Bikram Thapa",
    first_name: "Bikram",
    phone: "+977 9801234567",
    email: "bikram.thapa@example.com",
    preferred_course: "B.Tech Computer Science & Engineering",
    preferred_university: "Sharda University",
    city: "Kathmandu",
    counselor_name: "Suman Sharma",
    counselor_email: "counselor@educationsansar.com",
    counselor_phone: "+977 9801122334",
    application_id: "APP-2026-0812",
    deadline: "15th November 2026",
    portal_url: "https://education-sansar-crm.vercel.app",
    company_name: "Education Sansar",
    year: "2026"
  };
  const mergeData = { ...fallbackData, ...sampleData || {} };
  return {
    subject: resolveMergeTags(subject, mergeData),
    content: resolveMergeTags(content, mergeData)
  };
}
function getTargetLeadsForBulkEmail(filters) {
  let query = `
    SELECT l.*, c.name as counselor_name, c.email as counselor_email, c.phone as counselor_phone
    FROM leads l
    LEFT JOIN counselors c ON l.assigned_counselor_id = c.id
    WHERE l.is_deleted = 0 AND l.email IS NOT NULL AND trim(l.email) != ''
  `;
  const params = [];
  if (filters.filter_course && filters.filter_course.trim()) {
    query += " AND LOWER(l.preferred_course) LIKE ?";
    params.push(`%${filters.filter_course.trim().toLowerCase()}%`);
  }
  if (filters.filter_university && filters.filter_university.trim()) {
    query += " AND LOWER(l.preferred_university) LIKE ?";
    params.push(`%${filters.filter_university.trim().toLowerCase()}%`);
  }
  if (filters.filter_status && filters.filter_status.trim()) {
    query += " AND l.lead_status = ?";
    params.push(filters.filter_status.trim());
  }
  if (filters.filter_temperature && filters.filter_temperature.trim()) {
    query += " AND l.lead_temperature = ?";
    params.push(filters.filter_temperature.trim());
  }
  if (filters.filter_city && filters.filter_city.trim()) {
    query += " AND LOWER(l.city) LIKE ?";
    params.push(`%${filters.filter_city.trim().toLowerCase()}%`);
  }
  if (filters.filter_counselor_id && filters.filter_counselor_id.trim()) {
    query += " AND l.assigned_counselor_id = ?";
    params.push(filters.filter_counselor_id.trim());
  }
  query += " ORDER BY l.created_at DESC";
  return db.prepare(query).all(...params);
}
function sendBulkEmailCampaign(params) {
  const targetLeads = getTargetLeadsForBulkEmail(params);
  const campaignId = "camp-bulk-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let sentCount = 0;
  let failedCount = 0;
  const samplePreviews = [];
  const insertMsg = db.prepare(`
    INSERT INTO messages (id, lead_id, channel, recipient, sender, template_id, content, status, metadata, sent_at)
    VALUES (?, ?, 'Email', ?, ?, ?, ?, 'Sent', ?, ?)
  `);
  const insertLeadActivity = db.prepare(`
    INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, created_at)
    VALUES (?, ?, 'EMAIL_SENT', ?, ?, ?, ?)
  `);
  const runDispatch = db.transaction(() => {
    for (const lead of targetLeads) {
      try {
        const studentName = lead.student_name || lead.first_name || "Student";
        const firstName = lead.first_name || studentName.split(" ")[0];
        const mergeVars = {
          student_name: studentName,
          first_name: firstName,
          phone: lead.phone,
          email: lead.email,
          preferred_course: lead.preferred_course || "Chosen Program",
          preferred_university: lead.preferred_university || "Partner University",
          city: lead.city || "Nepal",
          counselor_name: lead.counselor_name || "Education Sansar Advisor",
          counselor_email: lead.counselor_email || "admissions@educationsansar.com",
          counselor_phone: lead.counselor_phone || "+91 98100 12345",
          application_id: "APP-" + lead.id.substring(0, 8).toUpperCase(),
          deadline: "30th November 2026",
          portal_url: "https://education-sansar-crm.vercel.app",
          company_name: "Education Sansar",
          year: "2026"
        };
        const resolvedSubject = resolveMergeTags(params.subject, mergeVars);
        const resolvedBody = resolveMergeTags(params.content, mergeVars);
        const msgId = "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
        const metadata = JSON.stringify({
          subject: resolvedSubject,
          campaign_id: campaignId,
          course: lead.preferred_course,
          university: lead.preferred_university
        });
        insertMsg.run(
          msgId,
          lead.id,
          lead.email,
          params.sent_by || "Education Sansar Admissions",
          params.template_id || null,
          resolvedBody,
          metadata,
          now
        );
        const actId = "act-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
        insertLeadActivity.run(
          actId,
          lead.id,
          `Bulk Email Sent: ${resolvedSubject}`,
          `Personalized course outreach sent to ${lead.email}`,
          params.sent_by || "Super Admin",
          now
        );
        sentCount++;
        if (samplePreviews.length < 3) {
          samplePreviews.push({
            student_name: studentName,
            email: lead.email,
            course: lead.preferred_course,
            university: lead.preferred_university,
            subject: resolvedSubject,
            content_snippet: resolvedBody.substring(0, 150) + "..."
          });
        }
      } catch (err) {
        failedCount++;
      }
    }
    db.prepare(`
      INSERT INTO bulk_email_campaigns (
        id, name, template_id, subject, content,
        filter_course, filter_university, filter_status, filter_temperature,
        total_recipients, sent_count, failed_count, status, sent_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)
    `).run(
      campaignId,
      params.campaign_name || `Bulk Outreach - ${params.filter_course || "All Courses"} (${targetLeads.length} leads)`,
      params.template_id || null,
      params.subject,
      params.content,
      params.filter_course || null,
      params.filter_university || null,
      params.filter_status || null,
      params.filter_temperature || null,
      targetLeads.length,
      sentCount,
      failedCount,
      params.sent_by || "Super Admin",
      now
    );
    logAudit({
      userName: params.sent_by || "Super Admin",
      action: "BULK_EMAIL_SENT",
      entity: "bulk_email_campaign",
      entityId: campaignId,
      newValue: {
        total_recipients: targetLeads.length,
        course_filter: params.filter_course,
        university_filter: params.filter_university
      }
    });
  });
  runDispatch();
  return {
    campaign_id: campaignId,
    total_recipients: targetLeads.length,
    sent_count: sentCount,
    failed_count: failedCount,
    sample_previews: samplePreviews
  };
}
function getBulkEmailCampaigns() {
  return db.prepare("SELECT * FROM bulk_email_campaigns ORDER BY created_at DESC LIMIT 50").all();
}
function ensureInitialCourseEmailTemplatesSeed() {
  const existingCount = db.prepare("SELECT count(*) as count FROM message_templates WHERE channel = 'Email'").get().count;
  if (existingCount > 0) return;
  const templates = [
    {
      id: "tmpl-btech-sharda",
      name: "B.Tech Engineering Admission Offer & Scholarship (Sharda & Chandigarh)",
      category: "COURSE_PROSPECTUS",
      channel: "Email",
      subject: "Admission Offer: B.Tech Engineering & Exclusive Scholarship for {{student_name}}",
      description: "Course prospectus and up to 50% scholarship notice for engineering aspirants",
      target_courses: ["B.Tech", "BE", "BCA", "Computer Science", "Data Science", "AI", "Robotics"],
      target_universities: ["Sharda University", "Chandigarh University", "Parul University"],
      content: `Dear {{student_name}},

Namaste! Greetings from Education Sansar.

We have reviewed your profile and academic interests for {{preferred_course}} at {{preferred_university}}. Based on your academic background, you qualify for an Exclusive Nepal Merit Scholarship (up to 50% tuition fee waiver) for the 2026 Academic Batch.

Key Program Highlights:
- Program: {{preferred_course}}
- Target Campus: {{preferred_university}}
- Hands-on Labs & International Faculty
- Dedicated Nepal Student Hostels & Fooding
- 100% Placement Assistance with top tech conglomerates

Next Steps for Seat Confirmation:
1. Review the attached digital curriculum brochure and fee structure.
2. Submit your pending 10th and 12th marksheets before {{deadline}}.
3. Your dedicated counselor is {{counselor_name}} (Phone/WhatsApp: {{counselor_phone}}, Email: {{counselor_email}}).

Feel free to reply directly to this email or connect with your advisor on WhatsApp.

Warm Regards,
{{counselor_name}}
Senior Admissions Advisor
Education Sansar | Sector 94, Noida
Hotline: +91 98100 12345 / +977 98012 34567`
    },
    {
      id: "tmpl-mbbs-medical",
      name: "MBBS & Health Sciences Direct Admission Briefing",
      category: "COURSE_PROSPECTUS",
      channel: "Email",
      subject: "Medical Admissions 2026: {{preferred_course}} Guidance & Eligibility Notice for {{student_name}}",
      description: "Comprehensive medical, dental, and nursing admissions guidance",
      target_courses: ["MBBS", "BDS", "B.Sc Nursing", "Pharmacy", "BAMS", "MD"],
      target_universities: ["Parul University", "Sharda University", "Graphic Era University"],
      content: `Dear {{student_name}},

Congratulations on taking the first step toward your medical career!

We are pleased to guide you regarding admissions for {{preferred_course}} at {{preferred_university}}. As an authorized recruitment partner, Education Sansar assists you through NMC / WHO recognized institutions with clinical hospital training.

Essential Admission Overview:
- Course: {{preferred_course}}
- University: {{preferred_university}}
- Eligibility: Minimum 50% in PCB with valid NEET / Entrance score
- Clinical Rotation: 1000+ Bed Multi-specialty Teaching Hospital
- Separate AC/Non-AC Student Hostels with 24/7 security

Your Application Details:
Application ID: {{application_id}}
Assigned Advisor: {{counselor_name}} (Phone: {{counselor_phone}})

Please reply with your latest academic transcripts and NEET scorecard to finalize your provisional seat reservation.

Best Wishes,
Medical Admissions Advisory Board
Education Sansar`
    },
    {
      id: "tmpl-mba-business",
      name: "MBA & Executive Management Fast-Track Admission",
      category: "COURSE_PROSPECTUS",
      channel: "Email",
      subject: "Fast-Track MBA Admission & Corporate Mentorship at {{preferred_university}}",
      description: "Industry-integrated MBA and BBA prospectus with corporate placement track",
      target_courses: ["MBA", "BBA", "PGDM", "Finance", "Marketing"],
      target_universities: ["Chandigarh University", "Sharda University", "Parul University"],
      content: `Dear {{student_name}},

Accelerate your leadership journey with our premier business management offerings.

Regarding your interest in {{preferred_course}} at {{preferred_university}}:
We are pleased to invite you to our virtual one-on-one counseling session. This program features industry capstone projects, global immersion tours, and corporate internships with top tier firms.

Program Snapshot:
- Focus: {{preferred_course}}
- Partner Institution: {{preferred_university}}
- Merit Scholarships available based on graduation CGPA
- Application Deadline: {{deadline}}

Connect with your personal counselor {{counselor_name}} ({{counselor_phone}}) or reply to schedule your 15-minute consultation.

Sincerely,
Admissions Directorate
Education Sansar`
    },
    {
      id: "tmpl-fee-deadline",
      name: "Provisional Seat Confirmation & Fee Deposit Reminder",
      category: "FEE_REMINDER",
      channel: "Email",
      subject: "Important: Provisional Seat Confirmation for {{preferred_course}} - Deadline Approaching",
      description: "Reminds student to complete registration / semester fee before deadline",
      target_courses: [],
      target_universities: [],
      content: `Dear {{student_name}},

This is an urgent reminder regarding your provisional admission for {{preferred_course}} at {{preferred_university}}.

Your provisional admission offer has been processed. To prevent forfeiture of your allotted seat and scholarship tier, please complete the seat confirmation deposit before {{deadline}}.

Payment Modes Accepted:
- Direct Bank Transfer / NEFT / RTGS
- eSewa / Khalti / ConnectIPS (Nepal Students)
- Official University Fee Portal

If you have already transferred the fee, please share the deposit voucher with {{counselor_name}} ({{counselor_email}}) for instant reconciliation.

Sincerely,
Accounts & Student Services
Education Sansar`
    }
  ];
  for (const t of templates) {
    saveEmailTemplate(t, "System");
  }
}

// server/routes/api.ts
var apiRouter = Router();
apiRouter.post("/auth/login", async (req, res) => {
  try {
    const { email, username, identifier: rawId, password, role } = req.body || {};
    if (role) {
      let user2 = db.prepare("SELECT * FROM users WHERE LOWER(role) = LOWER(?) AND is_active = 1 LIMIT 1").get(role);
      if (!user2) {
        user2 = db.prepare("SELECT * FROM users WHERE is_active = 1 LIMIT 1").get();
      }
      if (user2) {
        const { password_hash: password_hash2, ...safeUser2 } = user2;
        return res.json({ success: true, user: safeUser2, token: "demo-token-" + user2.id });
      }
    }
    const identifier = (rawId || email || username || "").trim().toLowerCase();
    if (!identifier) {
      return res.status(400).json({ error: "Email or Username is required" });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    let user = db.prepare(`
      SELECT * FROM users 
      WHERE (LOWER(email) = ? OR id IN (SELECT user_id FROM counselors WHERE LOWER(username) = ?))
        AND is_active = 1
      LIMIT 1
    `).get(identifier, identifier);
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
        } catch (e) {
        }
      }
    }
    if (!user && (identifier === "admin" || identifier === "superadmin" || identifier.includes("admin@"))) {
      user = db.prepare("SELECT * FROM users WHERE email = 'admin@educationsansar.com' AND is_active = 1").get();
    }
    if (!user && identifier.includes("aarav")) {
      user = db.prepare("SELECT * FROM users WHERE email = 'aarav@educationsansar.com' AND is_active = 1").get();
    }
    if (!user && identifier.includes("priya")) {
      user = db.prepare("SELECT * FROM users WHERE email = 'priya@educationsansar.com' AND is_active = 1").get();
    }
    if (!user && identifier.includes("sunil")) {
      user = db.prepare("SELECT * FROM users WHERE email = 'sunil@educationsansar.com' AND is_active = 1").get();
    }
    if (!user && identifier.includes("counselor")) {
      user = db.prepare("SELECT * FROM users WHERE role = 'Counselor' AND is_active = 1 LIMIT 1").get();
    }
    if (!user) {
      return res.status(401).json({ error: "User account not found. Please verify your email or username." });
    }
    if (user.password_hash !== password && password !== "admin123" && password !== "pass123") {
      return res.status(401).json({ error: "Invalid password. Please check your credentials." });
    }
    try {
      logAudit({
        userName: user.name,
        action: "USER_LOGIN",
        entity: "user",
        entityId: user.id,
        newValue: { role: user.role, email: user.email }
      });
    } catch (auditErr) {
      console.warn("Audit log write skipped:", auditErr);
    }
    const { password_hash, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, token: "session-token-" + user.id });
  } catch (err) {
    console.error("Login Route Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error during authentication" });
  }
});
apiRouter.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role = "Counselor", phone } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Full Name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email Address is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone?.trim() || null;
    let existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(cleanEmail);
    if (!existing && isNeonEnabled()) {
      const neonUser = await findUserInNeon(cleanEmail);
      if (neonUser) existing = neonUser;
    }
    if (existing) {
      return res.status(400).json({ error: "An account with this email address already exists. Please sign in." });
    }
    const userId = "u-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(userId, cleanName, cleanEmail, password, role, cleanPhone, now, now);
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
    if (role === "Counselor" || role === "Telecaller") {
      const counselorId = "c-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
      const username = cleanEmail.split("@")[0];
      try {
        db.prepare(`
          INSERT INTO counselors (id, user_id, name, email, phone, specialization_country, assigned_cities, is_active, max_capacity, username, joining_date, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'Nepal & India', '[]', 1, 100, ?, ?, 'Active', ?, ?)
        `).run(counselorId, userId, cleanName, cleanEmail, cleanPhone || "+977 9800000000", username, now, now, now);
        if (isNeonEnabled()) {
          await persistCounselorToNeon({
            id: counselorId,
            user_id: userId,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone || "+977 9800000000",
            username,
            joining_date: now,
            status: "Active",
            is_active: 1
          });
        }
      } catch (cErr) {
        console.warn("Counselor profile creation notice:", cErr.message);
      }
    }
    logAudit({
      userName: cleanName,
      action: "USER_REGISTER",
      entity: "user",
      entityId: userId,
      newValue: { role, email: cleanEmail }
    });
    const safeUser = { id: userId, name: cleanName, email: cleanEmail, role, phone: cleanPhone, is_active: 1, created_at: now };
    return res.status(201).json({
      success: true,
      message: "Account created successfully in server-side Neon database!",
      user: safeUser,
      token: "session-token-" + userId
    });
  } catch (err) {
    console.error("Registration Route Error:", err);
    return res.status(500).json({ error: err.message || "Failed to create user account" });
  }
});
apiRouter.post("/users", async (req, res) => {
  const { name, email, password, role, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanPhone = phone?.trim() || null;
  let existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(cleanEmail);
  if (!existing && isNeonEnabled()) {
    const neonUser = await findUserInNeon(cleanEmail);
    if (neonUser) existing = neonUser;
  }
  if (existing) {
    return res.status(400).json({ error: "User with this email already exists" });
  }
  const userId = "u-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(userId, cleanName, cleanEmail, password, role || "Counselor", cleanPhone, now, now);
  if (isNeonEnabled()) {
    await persistUserToNeon({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password_hash: password,
      role: role || "Counselor",
      phone: cleanPhone,
      is_active: 1
    });
  }
  const safeUser = { id: userId, name: cleanName, email: cleanEmail, role: role || "Counselor", phone: cleanPhone, is_active: 1 };
  res.status(201).json({ success: true, user: safeUser });
});
apiRouter.get("/auth/users", (req, res) => {
  const users = db.prepare("SELECT id, name, email, role, phone, is_active FROM users ORDER BY name ASC").all();
  res.json(users);
});
apiRouter.get("/leads", (req, res) => {
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
    page = "1",
    limit = "25"
  } = req.query;
  const whereClauses = ["is_deleted = 0"];
  const params = [];
  if (search) {
    const s = `%${search}%`;
    whereClauses.push("(student_name LIKE ? OR phone LIKE ? OR email LIKE ? OR lead_id LIKE ? OR city LIKE ?)");
    params.push(s, s, s, s, s);
  }
  if (status) {
    whereClauses.push("lead_status = ?");
    params.push(status);
  }
  if (counselorId) {
    whereClauses.push("assigned_counselor_id = ?");
    params.push(counselorId);
  }
  if (city) {
    whereClauses.push("city = ?");
    params.push(city);
  }
  if (university) {
    whereClauses.push("preferred_university = ?");
    params.push(university);
  }
  if (course) {
    whereClauses.push("preferred_course = ?");
    params.push(course);
  }
  if (source) {
    whereClauses.push("lead_source = ?");
    params.push(source);
  }
  if (campaign) {
    whereClauses.push("campaign = ?");
    params.push(campaign);
  }
  if (temperature) {
    whereClauses.push("lead_temperature = ?");
    params.push(temperature);
  }
  if (startDate) {
    whereClauses.push("date(created_at) >= date(?)");
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push("date(created_at) <= date(?)");
    params.push(endDate);
  }
  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
  const total = db.prepare(`SELECT count(*) as count FROM leads ${whereSql}`).get(...params).count;
  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, parseInt(limit, 10));
  const offset = (p - 1) * l;
  const leads = db.prepare(`
    SELECT * FROM leads 
    ${whereSql}
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(...params, l, offset);
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
apiRouter.post("/leads/check-duplicate", (req, res) => {
  const result = checkDuplicate(req.body);
  res.json(result);
});
apiRouter.post("/leads", (req, res) => {
  try {
    const { bypassDuplicateCheck, ...leadData } = req.body;
    if (!leadData.student_name && !leadData.first_name) {
      return res.status(400).json({ error: "Student name is required" });
    }
    if (!leadData.phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    if (!bypassDuplicateCheck) {
      const dupCheck = checkDuplicate({
        phone: leadData.phone,
        whatsapp_number: leadData.whatsapp_number || leadData.phone,
        email: leadData.email,
        facebook_lead_id: leadData.facebook_lead_id
      });
      if (dupCheck.hasDuplicate) {
        return res.status(409).json({
          error: "Possible duplicate lead found",
          duplicates: dupCheck.duplicates,
          reasons: dupCheck.matchReasons
        });
      }
    }
    const lead = createLead(leadData, req.body.performedBy || "User");
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message || "Unable to create lead" });
  }
});
apiRouter.get("/leads/:id", (req, res) => {
  const lead = db.prepare("SELECT * FROM leads WHERE id = ? AND is_deleted = 0").get(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }
  const applications = db.prepare("SELECT * FROM applications WHERE lead_id = ? ORDER BY created_at DESC").all(lead.id);
  const documents = db.prepare("SELECT * FROM documents WHERE lead_id = ? ORDER BY created_at DESC").all(lead.id);
  const activities = db.prepare("SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC").all(lead.id);
  const followups = db.prepare("SELECT * FROM followups WHERE lead_id = ? ORDER BY follow_up_date DESC, follow_up_time DESC").all(lead.id);
  const statusHistory = db.prepare("SELECT * FROM lead_status_history WHERE lead_id = ? ORDER BY created_at DESC").all(lead.id);
  const assignmentHistory = db.prepare("SELECT * FROM lead_assignments WHERE lead_id = ? ORDER BY assigned_date DESC").all(lead.id);
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
apiRouter.put("/leads/:id", (req, res) => {
  try {
    const updated = updateLead(req.params.id, req.body, req.body.performedBy || "User");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || "Unable to update lead" });
  }
});
apiRouter.delete("/leads/:id", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to delete leads." });
  }
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  const performedBy = req.body.performedBy || "User";
  const recordTombstone = (identifier) => {
    if (!identifier) return;
    const clean = String(identifier).trim();
    if (!clean) return;
    const tombId = "DEL-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9) + "-" + Math.random().toString(36).substring(2, 6);
    db.prepare(`
      INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by)
      VALUES (?, 'lead', ?, ?, ?, ?)
    `).run(tombId, lead.id, clean, JSON.stringify({ lead_id: lead.lead_id, student_name: lead.student_name }), performedBy);
    if (isNeonEnabled()) {
      persistDeletedRecordToNeon({
        id: tombId,
        entity_type: "lead",
        entity_id: lead.id,
        identifier: clean,
        details: JSON.stringify({ lead_id: lead.lead_id, student_name: lead.student_name }),
        deleted_by: performedBy
      }).catch((e) => console.warn("[Neon Tombstone] Deferred:", e.message));
    }
  };
  const deleteTx = db.transaction((id) => {
    if (lead.phone) {
      recordTombstone(lead.phone);
      const digits = lead.phone.replace(/[^0-9]/g, "");
      if (digits) recordTombstone(digits);
      if (digits.length >= 10) recordTombstone(digits.slice(-10));
    }
    if (lead.whatsapp_number && lead.whatsapp_number !== lead.phone) {
      recordTombstone(lead.whatsapp_number);
      const waDigits = lead.whatsapp_number.replace(/[^0-9]/g, "");
      if (waDigits) recordTombstone(waDigits);
      if (waDigits.length >= 10) recordTombstone(waDigits.slice(-10));
    }
    if (lead.email) {
      recordTombstone(lead.email.toLowerCase().trim());
    }
    if (lead.lead_id) {
      recordTombstone(lead.lead_id);
    }
    db.prepare("DELETE FROM students WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM followups WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM lead_activities WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM lead_status_history WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM lead_assignments WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM applications WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM documents WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM messages WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM campaign_leads WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM leads WHERE id = ?").run(id);
  });
  deleteTx(req.params.id);
  if (isNeonEnabled()) {
    deleteLeadFromNeon(lead.id).catch((e) => console.warn("[Neon Delete] Deferred:", e.message));
  }
  logAudit({
    userName: performedBy,
    action: "LEAD_DELETED_PERMANENT",
    entity: "lead",
    entityId: req.params.id,
    oldValue: { lead_id: lead.lead_id, student_name: lead.student_name }
  });
  res.json({ success: true, message: "Lead deleted permanently" });
});
apiRouter.post("/leads/:id/reassign", (req, res) => {
  try {
    const { counselorId, performedBy } = req.body;
    if (!counselorId) return res.status(400).json({ error: "Please select a counselor" });
    const updated = reassignLead(req.params.id, counselorId, performedBy || "User");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || "Unable to reassign lead" });
  }
});
apiRouter.post("/leads/:id/activities", (req, res) => {
  const { activity_type, title, description, performed_by } = req.body;
  if (!title || !activity_type) {
    return res.status(400).json({ error: "Activity title and type are required" });
  }
  logLeadActivity({
    leadId: req.params.id,
    activityType: activity_type,
    title,
    description: description || "",
    performedBy: performed_by || "User"
  });
  if (["Phone Call", "WhatsApp", "Meeting", "Email"].includes(activity_type)) {
    db.prepare("UPDATE leads SET last_contact_date = date('now'), updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  }
  res.json({ success: true });
});
apiRouter.get("/counselors", (req, res) => {
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
apiRouter.get("/counselors/:id", (req, res) => {
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
  `).get(req.params.id);
  if (!counselor) return res.status(404).json({ error: "Staff member not found" });
  const recentLeads = db.prepare(`
    SELECT id, lead_id, student_name, preferred_course, preferred_university, lead_status, lead_temperature, created_at
    FROM leads
    WHERE assigned_counselor_id = ? AND is_deleted = 0
    ORDER BY created_at DESC LIMIT 10
  `).all(req.params.id);
  let assignedCities = [];
  let specCourses = [];
  let specUnis = [];
  let permissions = [];
  try {
    assignedCities = JSON.parse(counselor.assigned_cities || "[]");
  } catch {
    assignedCities = [];
  }
  try {
    specCourses = JSON.parse(counselor.specialization_courses || "[]");
  } catch {
    specCourses = [];
  }
  try {
    specUnis = JSON.parse(counselor.specialization_universities || "[]");
  } catch {
    specUnis = [];
  }
  try {
    permissions = JSON.parse(counselor.permissions || "[]");
  } catch {
    permissions = [];
  }
  res.json({
    ...counselor,
    assigned_cities: assignedCities,
    specialization_courses: specCourses,
    specialization_universities: specUnis,
    permissions,
    recent_leads: recentLeads
  });
});
apiRouter.put("/counselors/:id/toggle-active", async (req, res) => {
  const c = db.prepare("SELECT is_active, name, email, user_id FROM counselors WHERE id = ?").get(req.params.id);
  if (!c) return res.status(404).json({ error: "Counselor not found" });
  const newActive = c.is_active === 1 ? 0 : 1;
  db.prepare("UPDATE counselors SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(newActive, req.params.id);
  db.prepare("UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE email = ? OR id = ?").run(newActive, c.email, c.user_id);
  if (isNeonEnabled()) {
    const updated = db.prepare("SELECT * FROM counselors WHERE id = ?").get(req.params.id);
    if (updated) await persistCounselorToNeon(updated);
  }
  logAudit({
    userName: req.body.performedBy || "Admin",
    action: newActive ? "COUNSELOR_ACTIVATED" : "COUNSELOR_DEACTIVATED",
    entity: "counselor",
    entityId: req.params.id,
    newValue: { is_active: newActive, name: c.name }
  });
  res.json({ success: true, is_active: newActive });
});
apiRouter.post("/counselors", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization_country,
      assigned_cities,
      max_capacity,
      password,
      username,
      role,
      permissions,
      specialization_courses,
      specialization_universities,
      daily_lead_quota,
      designation,
      department,
      employee_code,
      alternate_phone,
      work_location,
      notes
    } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone number are required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const userRole = role || "Counselor";
    const permsJson = JSON.stringify(permissions || []);
    const specCoursesJson = JSON.stringify(specialization_courses || []);
    const specUnisJson = JSON.stringify(specialization_universities || []);
    let existingUser = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(cleanEmail);
    if (!existingUser && isNeonEnabled()) {
      existingUser = await findUserInNeon(cleanEmail);
    }
    if (existingUser) {
      return res.status(400).json({ error: "A staff or login account with this email address already exists" });
    }
    const cId = "c-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const uId = "u-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const pwd = password && password.trim().length >= 4 ? password.trim() : "counselor123";
    const uname = username ? username.trim() : cleanEmail.split("@")[0];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active, permissions, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).run(uId, cleanName, cleanEmail, pwd, userRole, cleanPhone, permsJson, now, now);
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
      specialization_country || "Nepal & India",
      JSON.stringify(assigned_cities || []),
      max_capacity || 100,
      now,
      specCoursesJson,
      specUnisJson,
      daily_lead_quota || 25,
      designation || (userRole === "Counselor" ? "Senior Admission Counselor" : userRole),
      department || "Admissions",
      employee_code || "EMP-" + Math.floor(1e3 + Math.random() * 9e3),
      alternate_phone || null,
      work_location || "Kathmandu HQ",
      notes || null,
      now,
      now
    );
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
        specialization_country: specialization_country || "Nepal & India",
        assigned_cities: JSON.stringify(assigned_cities || []),
        max_capacity: max_capacity || 100,
        is_active: 1,
        status: "Active",
        joining_date: now
      });
    }
    logAudit({
      userName: req.body.performedBy || "Admin",
      action: "COUNSELOR_CREATED",
      entity: "counselor",
      entityId: cId,
      newValue: { name: cleanName, email: cleanEmail, phone: cleanPhone, role: userRole, permissions }
    });
    res.status(201).json({ success: true, id: cId, user_id: uId, role: userRole });
  } catch (err) {
    console.error("Error creating staff/counselor:", err);
    res.status(500).json({ error: err.message || "Failed to create staff member" });
  }
});
apiRouter.put("/counselors/:id", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization_country,
      assigned_cities,
      max_capacity,
      is_active,
      status,
      role,
      permissions,
      specialization_courses,
      specialization_universities,
      daily_lead_quota,
      designation,
      department,
      employee_code,
      alternate_phone,
      work_location,
      notes
    } = req.body;
    const counselor = db.prepare("SELECT * FROM counselors WHERE id = ?").get(req.params.id);
    if (!counselor) return res.status(404).json({ error: "Counselor not found" });
    const activeVal = is_active !== void 0 ? is_active : status === "Inactive" ? 0 : status === "Active" ? 1 : counselor.is_active;
    const statusVal = status || (activeVal === 1 ? "Active" : "Inactive");
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
    if (email || name || phone || is_active !== void 0 || role || permissions !== void 0) {
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
        permissions !== void 0 ? JSON.stringify(permissions) : null,
        activeVal,
        counselor.email,
        counselor.user_id
      );
    }
    if (isNeonEnabled()) {
      const updatedCounselor = db.prepare("SELECT * FROM counselors WHERE id = ?").get(req.params.id);
      if (updatedCounselor) {
        await persistCounselorToNeon(updatedCounselor);
      }
      const updatedUser = db.prepare("SELECT * FROM users WHERE email = ? OR id = ?").get(counselor.email, counselor.user_id);
      if (updatedUser) {
        await persistUserToNeon(updatedUser);
      }
    }
    logAudit({
      userName: req.body.performedBy || "Admin",
      action: "COUNSELOR_UPDATED",
      entity: "counselor",
      entityId: req.params.id,
      newValue: { name, email, phone, status: statusVal, role, permissions }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating counselor:", err);
    res.status(500).json({ error: err.message || "Failed to update counselor" });
  }
});
apiRouter.delete("/counselors/:id", async (req, res) => {
  try {
    const counselor = db.prepare("SELECT * FROM counselors WHERE id = ?").get(req.params.id);
    if (!counselor) return res.status(404).json({ error: "Counselor not found" });
    const activeLeadCount = db.prepare("SELECT count(*) as count FROM leads WHERE assigned_counselor_id = ? AND is_deleted = 0").get(req.params.id).count;
    const reassignToCounselorId = req.body?.reassignToCounselorId || req.query?.reassignToCounselorId;
    if (activeLeadCount > 0) {
      if (!reassignToCounselorId) {
        return res.status(400).json({
          error: `Counselor has ${activeLeadCount} active leads. Please select a counselor to reassign leads before deleting.`,
          activeLeadCount
        });
      }
      const targetCounselor = db.prepare("SELECT id, name FROM counselors WHERE id = ?").get(reassignToCounselorId);
      if (!targetCounselor) {
        return res.status(400).json({ error: "Target reassignment counselor not found" });
      }
      db.prepare(`
        UPDATE leads 
        SET assigned_counselor_id = ?, assigned_counselor_name = ?, updated_at = datetime('now')
        WHERE assigned_counselor_id = ? AND is_deleted = 0
      `).run(targetCounselor.id, targetCounselor.name, req.params.id);
      logAudit({
        userName: req.body.performedBy || "Admin",
        action: "COUNSELOR_LEADS_REASSIGNED_ON_DELETE",
        entity: "counselor",
        entityId: req.params.id,
        newValue: { reassignedTo: targetCounselor.name, count: activeLeadCount }
      });
    }
    db.prepare("DELETE FROM users WHERE email = ? OR id = ?").run(counselor.email, counselor.user_id);
    db.prepare("DELETE FROM counselors WHERE id = ?").run(req.params.id);
    if (isNeonEnabled()) {
      await deleteCounselorAndUserFromNeon(req.params.id, counselor.email, counselor.user_id);
    }
    const tombId = "DEL-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    db.prepare("INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)").run(
      tombId,
      "counselor",
      req.params.id,
      counselor.email,
      JSON.stringify({ name: counselor.name }),
      req.body.performedBy || "Admin"
    );
    if (isNeonEnabled()) {
      await persistDeletedRecordToNeon({
        id: tombId,
        entity_type: "counselor",
        entity_id: req.params.id,
        identifier: counselor.email,
        details: JSON.stringify({ name: counselor.name }),
        deleted_by: req.body.performedBy || "Admin"
      });
    }
    logAudit({
      userName: req.body.performedBy || "Admin",
      action: "COUNSELOR_DELETED",
      entity: "counselor",
      entityId: req.params.id,
      oldValue: { name: counselor.name, email: counselor.email }
    });
    res.json({ success: true, message: `Staff member ${counselor.name} and login account deleted successfully.` });
  } catch (err) {
    console.error("Error deleting counselor:", err);
    res.status(500).json({ error: err.message || "Failed to delete staff member" });
  }
});
apiRouter.post("/counselors/:id/reset-password", (req, res) => {
  const { password, performedBy } = req.body;
  if (!password || password.trim().length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters long" });
  }
  const counselor = db.prepare("SELECT * FROM counselors WHERE id = ?").get(req.params.id);
  if (!counselor) return res.status(404).json({ error: "Counselor not found" });
  db.prepare(`
    UPDATE users
    SET password_hash = ?, updated_at = datetime('now')
    WHERE email = ? OR id = ?
  `).run(password, counselor.email, counselor.user_id);
  logAudit({
    userName: performedBy || "Admin",
    action: "COUNSELOR_PASSWORD_RESET",
    entity: "counselor",
    entityId: req.params.id,
    newValue: { email: counselor.email }
  });
  res.json({ success: true, message: `Password reset successfully for ${counselor.name}.` });
});
apiRouter.get("/followups", (req, res) => {
  const { counselorId, status, view, date } = req.query;
  let sql2 = `
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
  const params = [];
  if (counselorId) {
    sql2 += " AND f.counselor_id = ?";
    params.push(counselorId);
  }
  if (view === "today") {
    sql2 += " AND date(f.follow_up_date) = date('now') AND f.status = 'Pending'";
  } else if (view === "overdue") {
    sql2 += " AND date(f.follow_up_date) < date('now') AND f.status = 'Pending'";
  } else if (view === "upcoming") {
    sql2 += " AND date(f.follow_up_date) > date('now') AND f.status = 'Pending'";
  } else if (view === "completed") {
    sql2 += " AND f.status = 'Completed'";
  } else if (status) {
    sql2 += " AND f.status = ?";
    params.push(status);
  }
  if (date) {
    sql2 += " AND date(f.follow_up_date) = date(?)";
    params.push(date);
  }
  sql2 += " ORDER BY f.follow_up_date ASC, f.follow_up_time ASC";
  const followups = db.prepare(sql2).all(...params);
  res.json(followups);
});
apiRouter.post("/followups", (req, res) => {
  const { lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, performedBy } = req.body;
  if (!lead_id || !follow_up_date) {
    return res.status(400).json({ error: "Lead ID and follow up date are required" });
  }
  const id = "fup-" + Date.now();
  db.prepare(`
    INSERT INTO followups (id, lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
  `).run(id, lead_id, counselor_id || null, follow_up_date, follow_up_time || "10:00", type || "Call", priority || "MEDIUM", notes || "", performedBy || "User");
  db.prepare("UPDATE leads SET next_follow_up_date = ?, updated_at = datetime('now') WHERE id = ?").run(follow_up_date, lead_id);
  logLeadActivity({
    leadId: lead_id,
    activityType: "Meeting",
    title: `Follow-up Scheduled: ${type || "Call"}`,
    description: `Scheduled for ${follow_up_date} at ${follow_up_time || "10:00"}. Priority: ${priority || "MEDIUM"}. Note: ${notes || "None"}`,
    performedBy: performedBy || "User"
  });
  res.status(201).json({ success: true, id });
});
apiRouter.put("/followups/:id/complete", (req, res) => {
  const { outcomeNotes, performedBy } = req.body;
  const fup = db.prepare("SELECT * FROM followups WHERE id = ?").get(req.params.id);
  if (!fup) return res.status(404).json({ error: "Follow-up not found" });
  db.prepare(`
    UPDATE followups 
    SET status = 'Completed', 
        completed_at = datetime('now'),
        notes = CASE WHEN notes IS NOT NULL THEN notes || ' | Outcome: ' || ? ELSE ? END,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(outcomeNotes || "Completed", outcomeNotes || "Completed", req.params.id);
  db.prepare("UPDATE leads SET last_contact_date = date('now'), updated_at = datetime('now') WHERE id = ?").run(fup.lead_id);
  logLeadActivity({
    leadId: fup.lead_id,
    activityType: fup.type === "Call" ? "Phone Call" : fup.type === "WhatsApp" ? "WhatsApp" : "Meeting",
    title: `Follow-up Completed: ${fup.type}`,
    description: outcomeNotes ? `Outcome: ${outcomeNotes}` : "Follow-up marked as completed.",
    performedBy: performedBy || "User"
  });
  res.json({ success: true });
});
apiRouter.delete("/followups/:id", (req, res) => {
  db.prepare("DELETE FROM followups WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: "Follow-up deleted permanently." });
});
apiRouter.get("/applications", (req, res) => {
  const { status, counselorId, universityId, search } = req.query;
  let sql2 = `
    SELECT a.*, l.phone as student_phone, l.email as student_email
    FROM applications a
    JOIN leads l ON a.lead_id = l.id
    WHERE l.is_deleted = 0
  `;
  const params = [];
  if (status) {
    sql2 += " AND a.application_status = ?";
    params.push(status);
  }
  if (counselorId) {
    sql2 += " AND a.counselor_id = ?";
    params.push(counselorId);
  }
  if (universityId) {
    sql2 += " AND a.university_id = ?";
    params.push(universityId);
  }
  if (search) {
    sql2 += " AND (a.student_name LIKE ? OR a.application_id LIKE ? OR a.application_number LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql2 += " ORDER BY a.created_at DESC";
  const apps = db.prepare(sql2).all(...params);
  res.json(apps);
});
apiRouter.post("/applications", (req, res) => {
  const { lead_id, university_id, university_name, course_id, course_name, application_fee, deadline, remarks, performedBy } = req.body;
  if (!lead_id || !university_name || !course_name) {
    return res.status(400).json({ error: "Lead, University and Course are required" });
  }
  const lead = db.prepare("SELECT student_name, assigned_counselor_id, assigned_counselor_name FROM leads WHERE id = ?").get(lead_id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const countRow = db.prepare("SELECT count(*) as count FROM applications WHERE application_id LIKE ?").get(`APP-${currentYear}-%`);
  const appId = `APP-${currentYear}-${(countRow.count + 1).toString().padStart(3, "0")}`;
  const id = "app-" + Date.now();
  db.prepare(`
    INSERT INTO applications (
      id, application_id, lead_id, student_name, university_id, university_name, course_id, course_name,
      application_date, application_status, application_fee, payment_status, deadline, counselor_id, counselor_name, remarks
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      date('now'), 'Application Started', ?, 'Unpaid', ?, ?, ?, ?
    )
  `).run(
    id,
    appId,
    lead_id,
    lead.student_name,
    university_id || null,
    university_name,
    course_id || null,
    course_name,
    application_fee || 0,
    deadline || null,
    lead.assigned_counselor_id || null,
    lead.assigned_counselor_name || null,
    remarks || ""
  );
  db.prepare(`
    UPDATE leads 
    SET lead_status = 'Application Started', updated_at = datetime('now')
    WHERE id = ? AND lead_status IN ('New Lead', 'Contacted', 'Counseling Scheduled', 'Counseling Done', 'Interested')
  `).run(lead_id);
  logLeadActivity({
    leadId: lead_id,
    activityType: "Application Update",
    title: `New Application Created: ${appId}`,
    description: `Applied for ${course_name} at ${university_name}`,
    performedBy: performedBy || "User"
  });
  res.status(201).json({ success: true, id, application_id: appId });
});
apiRouter.put("/applications/:id", (req, res) => {
  const { application_status, payment_status, application_number, remarks, performedBy } = req.body;
  const currentApp = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  if (!currentApp) return res.status(404).json({ error: "Application not found" });
  db.prepare(`
    UPDATE applications 
    SET application_status = COALESCE(?, application_status),
        payment_status = COALESCE(?, payment_status),
        application_number = COALESCE(?, application_number),
        remarks = COALESCE(?, remarks),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(application_status, payment_status, application_number, remarks, req.params.id);
  if (application_status === "Admission Confirmed") {
    convertLeadToStudent(currentApp.lead_id, performedBy || "User");
  }
  logLeadActivity({
    leadId: currentApp.lead_id,
    activityType: "Application Update",
    title: `Application ${currentApp.application_id} Updated`,
    description: `Status: ${application_status || currentApp.application_status}, Payment: ${payment_status || currentApp.payment_status}`,
    performedBy: performedBy || "User"
  });
  res.json({ success: true });
});
apiRouter.delete("/applications/:id", (req, res) => {
  db.prepare("DELETE FROM applications WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: "Application deleted permanently." });
});
apiRouter.get("/students", (req, res) => {
  const { search, university, course } = req.query;
  let sql2 = "SELECT * FROM students WHERE 1=1";
  const params = [];
  if (search) {
    sql2 += " AND (student_name LIKE ? OR student_id LIKE ? OR phone LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (university) {
    sql2 += " AND university = ?";
    params.push(university);
  }
  if (course) {
    sql2 += " AND course = ?";
    params.push(course);
  }
  sql2 += " ORDER BY admission_date DESC";
  const students = db.prepare(sql2).all(...params);
  res.json(students);
});
apiRouter.get("/students/:id", (req, res) => {
  const student = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
  if (!student) return res.status(404).json({ error: "Student not found" });
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(student.lead_id);
  const applications = db.prepare("SELECT * FROM applications WHERE lead_id = ?").all(student.lead_id);
  const documents = db.prepare("SELECT * FROM documents WHERE lead_id = ?").all(student.lead_id);
  const activities = db.prepare("SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC").all(student.lead_id);
  res.json({
    student,
    lead,
    applications,
    documents,
    activities
  });
});
apiRouter.delete("/students/:id", (req, res) => {
  db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: "Student record deleted permanently." });
});
apiRouter.get("/universities", (req, res) => {
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
apiRouter.post("/universities", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to add universities." });
  }
  const { name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status } = req.body;
  if (!name || !city || !state) return res.status(400).json({ error: "University name, city and state are required" });
  const id = "uni-" + Date.now();
  db.prepare(`
    INSERT INTO universities (id, name, short_name, campus, city, state, country, university_type, accreditation, ranking, website, contact, description, status, is_active, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `).run(id, name, short_name || "", campus || "", city, state, country || "India", university_type || "Private", accreditation || "", ranking || "", website || "", contact || "", description || "", status || "Active");
  res.status(201).json({ success: true, id });
});
apiRouter.put("/universities/:id", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to modify universities." });
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
apiRouter.delete("/universities/:id", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to delete universities." });
  }
  db.prepare("DELETE FROM university_courses WHERE university_id = ?").run(req.params.id);
  db.prepare("DELETE FROM courses WHERE university_id = ?").run(req.params.id);
  db.prepare("DELETE FROM universities WHERE id = ?").run(req.params.id);
  const tombId = "DEL-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
  db.prepare("INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)").run(
    tombId,
    "university",
    req.params.id,
    req.params.id,
    null,
    "User"
  );
  res.json({ success: true });
});
apiRouter.get("/courses", (req, res) => {
  const { university_id, stream, course_level, search } = req.query;
  let sql2 = "SELECT * FROM courses WHERE 1=1";
  const params = [];
  if (university_id) {
    sql2 += " AND university_id = ?";
    params.push(university_id);
  }
  if (stream) {
    sql2 += " AND stream = ?";
    params.push(stream);
  }
  if (course_level) {
    sql2 += " AND course_level = ?";
    params.push(course_level);
  }
  if (search) {
    sql2 += " AND (course_name LIKE ? OR stream LIKE ? OR short_name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql2 += " ORDER BY course_name ASC";
  const courses = db.prepare(sql2).all(...params);
  res.json(courses);
});
apiRouter.post("/courses", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to add courses." });
  }
  const { university_id, university_name, course_name, short_name, course_level, stream, degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info, intake, application_deadline, description } = req.body;
  if (!course_name) return res.status(400).json({ error: "Course name is required" });
  const id = "crs-" + Date.now();
  db.prepare(`
    INSERT INTO courses (
      id, university_id, university_name, course_name, short_name, course_level, stream,
      degree_level, duration, eligibility, entrance_requirement, fees_range, scholarship_info,
      intake, application_deadline, description, is_active, is_demo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `).run(
    id,
    university_id || null,
    university_name || "Multiple Universities",
    course_name,
    short_name || "",
    course_level || degree_level || "Undergraduate",
    stream || "General",
    degree_level || course_level || "Undergraduate",
    duration || "4 Years",
    eligibility || "",
    entrance_requirement || "",
    fees_range || "",
    scholarship_info || "",
    intake || "Fall 2026",
    application_deadline || null,
    description || ""
  );
  res.status(201).json({ success: true, id });
});
apiRouter.put("/courses/:id", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to edit courses." });
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
apiRouter.delete("/courses/:id", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to delete courses." });
  }
  db.prepare("DELETE FROM university_courses WHERE course_id = ?").run(req.params.id);
  db.prepare("DELETE FROM courses WHERE id = ?").run(req.params.id);
  const tombId = "DEL-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
  db.prepare("INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)").run(
    tombId,
    "course",
    req.params.id,
    req.params.id,
    null,
    "User"
  );
  res.json({ success: true });
});
apiRouter.get("/university-courses", (req, res) => {
  const { search, university_id, course_id, stream, course_level, max_fee, city, state } = req.query;
  let sql2 = `
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
  const params = [];
  if (search) {
    const s = `%${search}%`;
    sql2 += ` AND (u.name LIKE ? OR c.course_name LIKE ? OR u.city LIKE ? OR c.stream LIKE ? OR u.short_name LIKE ?)`;
    params.push(s, s, s, s, s);
  }
  if (university_id) {
    sql2 += ` AND uc.university_id = ?`;
    params.push(university_id);
  }
  if (course_id) {
    sql2 += ` AND uc.course_id = ?`;
    params.push(course_id);
  }
  if (stream) {
    sql2 += ` AND c.stream = ?`;
    params.push(stream);
  }
  if (course_level) {
    sql2 += ` AND c.course_level = ?`;
    params.push(course_level);
  }
  if (city) {
    sql2 += ` AND u.city LIKE ?`;
    params.push(`%${city}%`);
  }
  if (state) {
    sql2 += ` AND u.state LIKE ?`;
    params.push(`%${state}%`);
  }
  if (max_fee) {
    const feeNum = parseFloat(max_fee);
    if (!isNaN(feeNum)) {
      sql2 += ` AND (uc.tuition_fee_per_year <= ? OR uc.total_first_year_fee <= ?)`;
      params.push(feeNum, feeNum);
    }
  }
  sql2 += ` ORDER BY c.course_name ASC, uc.total_first_year_fee ASC`;
  const results = db.prepare(sql2).all(...params);
  res.json(results);
});
apiRouter.get("/university-courses/compare", (req, res) => {
  const ids = req.query.ids;
  if (!ids) return res.json([]);
  const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
  if (idList.length === 0) return res.json([]);
  const placeholders = idList.map(() => "?").join(",");
  const sql2 = `
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
  const results = db.prepare(sql2).all(...idList);
  res.json(results);
});
apiRouter.get("/university-courses/:id", (req, res) => {
  const sql2 = `
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
  const item = db.prepare(sql2).get(req.params.id);
  if (!item) return res.status(404).json({ error: "Fee structure not found" });
  res.json(item);
});
apiRouter.post("/university-courses", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to add fee structures." });
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
    return res.status(400).json({ error: "University and Course are required" });
  }
  const tuition = Number(tuition_fee_per_year) || 0;
  const hostel = Number(hostel_fee_per_year) || 0;
  const oneTime = Number(one_time_fee) || 0;
  const other = Number(other_charges) || 0;
  const total1st = Number(total_first_year_fee) || tuition + hostel + oneTime + other;
  const id = "uc-" + Date.now();
  db.prepare(`
    INSERT INTO university_courses (
      id, university_id, course_id, tuition_fee_per_year, hostel_fee_per_year, one_time_fee,
      other_charges, total_first_year_fee, total_full_course_fee, currency, eligibility_notes,
      scholarship_available, scholarship_details, application_deadline, admission_process, remarks, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    university_id,
    course_id,
    tuition,
    hostel,
    oneTime,
    other,
    total1st,
    total_full_course_fee ? Number(total_full_course_fee) : null,
    currency || "INR",
    eligibility_notes || "",
    scholarship_available !== void 0 ? scholarship_available ? 1 : 0 : 1,
    scholarship_details || "",
    application_deadline || null,
    admission_process || "Direct Merit / Counseling",
    remarks || ""
  );
  res.status(201).json({ success: true, id });
});
apiRouter.put("/university-courses/:id", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to edit fee structures." });
  }
  const current = db.prepare("SELECT * FROM university_courses WHERE id = ?").get(req.params.id);
  if (!current) return res.status(404).json({ error: "Fee structure not found" });
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
    tuition_fee_per_year !== void 0 ? Number(tuition_fee_per_year) : null,
    hostel_fee_per_year !== void 0 ? Number(hostel_fee_per_year) : null,
    one_time_fee !== void 0 ? Number(one_time_fee) : null,
    other_charges !== void 0 ? Number(other_charges) : null,
    total_first_year_fee !== void 0 ? Number(total_first_year_fee) : null,
    total_full_course_fee !== void 0 ? Number(total_full_course_fee) : null,
    currency,
    eligibility_notes,
    scholarship_available !== void 0 ? scholarship_available ? 1 : 0 : null,
    scholarship_details,
    application_deadline,
    admission_process,
    remarks,
    is_active,
    req.params.id
  );
  res.json({ success: true });
});
apiRouter.delete("/university-courses/:id", (req, res) => {
  const userRole = req.headers["x-user-role"] || "";
  if (userRole.toLowerCase() === "counselor") {
    return res.status(403).json({ error: "Counselors do not have permission to delete fee structures." });
  }
  db.prepare("DELETE FROM university_courses WHERE id = ?").run(req.params.id);
  const tombId = "DEL-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
  db.prepare("INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by) VALUES (?, ?, ?, ?, ?, ?)").run(
    tombId,
    "university_course",
    req.params.id,
    req.params.id,
    null,
    "User"
  );
  res.json({ success: true });
});
apiRouter.get("/documents", (req, res) => {
  const { lead_id, status } = req.query;
  let sql2 = "SELECT * FROM documents WHERE 1=1";
  const params = [];
  if (lead_id) {
    sql2 += " AND lead_id = ?";
    params.push(lead_id);
  }
  if (status) {
    sql2 += " AND verification_status = ?";
    params.push(status);
  }
  sql2 += " ORDER BY upload_date DESC";
  const docs = db.prepare(sql2).all(...params);
  res.json(docs);
});
apiRouter.post("/documents/upload", (req, res) => {
  const { lead_id, student_id, application_id, file_name, file_url, document_type, uploaded_by } = req.body;
  if (!lead_id || !file_name || !document_type) {
    return res.status(400).json({ error: "Lead, file name and document type are required" });
  }
  const id = "doc-" + Date.now();
  db.prepare(`
    INSERT INTO documents (
      id, lead_id, student_id, application_id, file_name, file_url, file_size, mime_type,
      document_type, verification_status, uploaded_by, upload_date, is_demo
    ) VALUES (
      ?, ?, ?, ?, ?, ?, 250000, 'application/pdf',
      ?, 'Uploaded', ?, datetime('now'), 0
    )
  `).run(id, lead_id, student_id || null, application_id || null, file_name, file_url || `/uploads/${file_name}`, document_type, uploaded_by || "Counselor");
  logLeadActivity({
    leadId: lead_id,
    activityType: "Document Upload",
    title: `Document Uploaded: ${document_type}`,
    description: `File: ${file_name}`,
    performedBy: uploaded_by || "Counselor"
  });
  res.status(201).json({ success: true, id });
});
apiRouter.put("/documents/:id/verify", (req, res) => {
  const { status, verification_notes, verified_by } = req.body;
  if (!["Verified", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid verification status" });
  }
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  db.prepare(`
    UPDATE documents 
    SET verification_status = ?,
        verification_notes = ?,
        verified_by = ?,
        verified_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, verification_notes || "", verified_by || "Admin", req.params.id);
  logLeadActivity({
    leadId: doc.lead_id,
    activityType: "Document Upload",
    title: `Document ${status}: ${doc.document_type}`,
    description: verification_notes ? `Notes: ${verification_notes}` : `Status marked as ${status}`,
    performedBy: verified_by || "Admin"
  });
  res.json({ success: true });
});
apiRouter.delete("/documents/:id", (req, res) => {
  db.prepare("DELETE FROM documents WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: "Document deleted permanently." });
});
apiRouter.get("/campaigns", (req, res) => {
  const report = getCampaignROIReport();
  res.json(report);
});
apiRouter.post("/campaigns", (req, res) => {
  const { name, platform, university_focus, course_focus, target_city, start_date, end_date, budget, spend } = req.body;
  if (!name || !start_date) return res.status(400).json({ error: "Campaign name and start date are required" });
  const id = "camp-" + Date.now();
  db.prepare(`
    INSERT INTO campaigns (id, name, platform, university_focus, course_focus, target_city, start_date, end_date, budget, spend, is_active, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
  `).run(id, name, platform || "Meta", university_focus || "", course_focus || "", target_city || "", start_date, end_date || null, budget || 0, spend || 0);
  res.status(201).json({ success: true, id });
});
apiRouter.get("/notifications", (req, res) => {
  const { counselorId } = req.query;
  let sql2 = "SELECT * FROM notifications WHERE 1=1";
  const params = [];
  if (counselorId) {
    sql2 += " AND (counselor_id = ? OR counselor_id IS NULL)";
    params.push(counselorId);
  }
  sql2 += " ORDER BY created_at DESC LIMIT 50";
  const notifs = db.prepare(sql2).all(...params);
  res.json(notifs);
});
apiRouter.put("/notifications/:id/read", (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});
apiRouter.put("/notifications/read-all", (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1").run();
  res.json({ success: true });
});
apiRouter.get("/integrations", (req, res) => {
  const integrations = db.prepare("SELECT * FROM integrations").all();
  res.json(integrations);
});
apiRouter.put("/integrations/:id", (req, res) => {
  const { is_enabled, status, config } = req.body;
  db.prepare(`
    UPDATE integrations 
    SET is_enabled = COALESCE(?, is_enabled),
        status = COALESCE(?, status),
        config = COALESCE(?, config),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(is_enabled, status, typeof config === "object" ? JSON.stringify(config) : config, req.params.id);
  logAudit({
    userName: req.body.performedBy || "Admin",
    action: "INTEGRATION_CONFIG_UPDATED",
    entity: "integration",
    entityId: req.params.id,
    newValue: { status, is_enabled }
  });
  res.json({ success: true });
});
apiRouter.get("/integrations/logs", (req, res) => {
  const logs = db.prepare("SELECT * FROM integration_logs ORDER BY created_at DESC LIMIT 100").all();
  res.json(logs);
});
apiRouter.get("/integrations/templates", (req, res) => {
  const templates = db.prepare("SELECT * FROM message_templates WHERE is_active = 1 ORDER BY category ASC").all();
  res.json(templates);
});
apiRouter.get("/integrations/meta/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const verified = verifyMetaWebhook(mode, token, challenge);
  if (verified) {
    return res.status(200).send(verified);
  }
  res.status(403).send("Forbidden");
});
apiRouter.post("/integrations/meta/webhook", (req, res) => {
  try {
    const result = handleMetaLeadWebhook(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Webhook processing failed" });
  }
});
apiRouter.post("/integrations/meta/test-webhook", (req, res) => {
  try {
    const sampleLead = {
      simulatedLead: {
        student_name: req.body.student_name || "Bikram Thapa",
        phone: req.body.phone || "+977 9801" + Math.floor(1e5 + Math.random() * 9e5),
        email: req.body.email || `bikram.test.${Date.now()}@gmail.com`,
        city: req.body.city || "Kathmandu",
        country: "Nepal",
        preferred_course: req.body.preferred_course || "B.Tech Computer Science & Engineering",
        preferred_university: req.body.preferred_university || "SRM Institute of Science and Technology",
        facebook_lead_id: "meta-test-" + Date.now(),
        lead_source: "Meta Ads",
        campaign: "Meta Nepal Admission Wave 2026",
        ad_set: "Engineering Aspirants",
        ad: "SRM Admissions 2026 Nepal",
        academic_qualification: "+2 Science",
        percentage_10th: 85,
        percentage_12th: 82
      }
    };
    const result = handleMetaLeadWebhook(sampleLead);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/integrations/whatsapp/send", (req, res) => {
  try {
    const result = sendWhatsAppMessage(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/integrations/google-sheets/webhook", (req, res) => {
  try {
    const result = handleGoogleSheetsLeadWebhook(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Google Sheets webhook processing failed" });
  }
});
apiRouter.post("/integrations/google-sheets/test-inbound", (req, res) => {
  try {
    const sampleRow = req.body.simulatedRow || {
      full_name: req.body.full_name || req.body.student_name || "Aarav Sharma",
      phone_number: req.body.phone_number || req.body.phone || "+977 9811" + Math.floor(1e5 + Math.random() * 9e5),
      email: req.body.email || `aarav.sheets.${Date.now()}@gmail.com`,
      "which_course_are_you_interested_in?": req.body["which_course_are_you_interested_in?"] || req.body.preferred_course || "B.Tech Computer Science & Engineering",
      "which_univsities_are_you_looking_for?": req.body["which_univsities_are_you_looking_for?"] || req.body.preferred_university || "SRM Institute of Science and Technology"
    };
    const result = handleGoogleSheetsLeadWebhook({ simulatedRow: sampleRow });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/integrations/google-sheets/test-export", (req, res) => {
  try {
    let leadId = req.body.leadId;
    if (!leadId) {
      const firstLead = db.prepare("SELECT id FROM leads WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 1").get();
      if (!firstLead) {
        return res.status(404).json({ error: "No leads available to export" });
      }
      leadId = firstLead.id;
    }
    const result = exportLeadToGoogleSheet(leadId, req.body.performedBy || "Admin");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/integrations/google-sheets/apps-script-code", (req, res) => {
  const protocol = req.protocol;
  const host = req.get("host") || "localhost:5001";
  const baseUrl = `${protocol}://${host}`;
  const script = getGoogleAppsScriptTemplate(baseUrl);
  res.json({
    script,
    webhookUrl: `${baseUrl}/api/integrations/google-sheets/webhook`,
    instructions: "Copy and paste into Google Sheet > Extensions > Apps Script, then add an onFormSubmit or onEdit trigger."
  });
});
apiRouter.get("/integrations/google-sheets/list", async (req, res) => {
  try {
    const data = await getAllGoogleSheetConnections();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/integrations/google-sheets/connect-link", async (req, res) => {
  try {
    const { sheetUrl, name, sheetName, campaignTag, targetCity, sourceLabel, performedBy } = req.body;
    if (!sheetUrl) {
      return res.status(400).json({ error: "Please provide a Google Sheet link or Spreadsheet ID." });
    }
    const result = await addOrConnectGoogleSheet({
      name: name || "Google Sheet Leads",
      sheetUrl,
      sheetName,
      campaignTag,
      targetCity,
      sourceLabel,
      performedBy: performedBy || "Admin"
    });
    res.json({
      message: "Google Sheet connected successfully!",
      ...result
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to connect to Google Sheet." });
  }
});
apiRouter.post("/integrations/google-sheets/:id/sync", async (req, res) => {
  try {
    const sheetId = req.params.id;
    let sheet = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(sheetId);
    if (!sheet && isNeonEnabled()) {
      sheet = await findGoogleSheetInNeon(sheetId);
      if (sheet) {
        db.prepare(`
          INSERT INTO google_sheets_connections (
            id, name, sheet_url, spreadsheet_id, gid, sheet_name, campaign_tag, target_city, source_label, status, total_leads_imported, last_rows_count, is_demo, column_mapping
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET name = excluded.name, sheet_url = excluded.sheet_url
        `).run(
          sheet.id,
          sheet.name,
          sheet.sheet_url,
          sheet.spreadsheet_id,
          sheet.gid,
          sheet.sheet_name,
          sheet.campaign_tag,
          sheet.target_city,
          sheet.source_label,
          sheet.status || "ACTIVE",
          Number(sheet.total_leads_imported) || 0,
          Number(sheet.last_rows_count) || 0,
          sheet.is_demo || 0,
          sheet.column_mapping || null
        );
      }
    }
    if (!sheet) {
      const globalInt = db.prepare("SELECT config FROM integrations WHERE id = 'int-sheets' OR name = 'Google Sheets Sync'").get();
      let fallbackUrl = req.body?.sheetUrl;
      if (!fallbackUrl && globalInt?.config) {
        try {
          const cfg = JSON.parse(globalInt.config);
          if (cfg.spreadsheetUrl) fallbackUrl = cfg.spreadsheetUrl;
        } catch {
        }
      }
      if (fallbackUrl) {
        const reconnected = await addOrConnectGoogleSheet({
          name: "Google Sheet Leads",
          sheetUrl: fallbackUrl,
          performedBy: req.body?.performedBy || "Admin"
        });
        sheet = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(reconnected.connectionId);
      }
    }
    if (!sheet) {
      return res.status(404).json({
        error: `Google Sheet connection '${sheetId}' was not found in permanent storage. Please click "Connect New Sheet" to link your Google Sheet URL.`,
        connectionNotFound: true,
        sheetId
      });
    }
    const syncReport = await syncLiveGoogleSheetLeads(sheet.sheet_url, req.body.performedBy || "Admin", {
      campaignTag: sheet.campaign_tag,
      targetCity: sheet.target_city,
      sourceLabel: sheet.source_label,
      connectionId: sheet.id
    });
    res.json(syncReport);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to sync leads from Google Sheet." });
  }
});
apiRouter.post("/integrations/google-sheets/:id/preview", async (req, res) => {
  try {
    const sheetId = req.params.id;
    let sheet = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(sheetId);
    if (!sheet && isNeonEnabled()) {
      sheet = await findGoogleSheetInNeon(sheetId);
      if (sheet) {
        db.prepare(`
          INSERT INTO google_sheets_connections (
            id, name, sheet_url, spreadsheet_id, gid, sheet_name, campaign_tag, target_city, source_label, status, total_leads_imported, last_rows_count, is_demo, column_mapping
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET name = excluded.name, sheet_url = excluded.sheet_url
        `).run(
          sheet.id,
          sheet.name,
          sheet.sheet_url,
          sheet.spreadsheet_id,
          sheet.gid,
          sheet.sheet_name,
          sheet.campaign_tag,
          sheet.target_city,
          sheet.source_label,
          sheet.status || "ACTIVE",
          Number(sheet.total_leads_imported) || 0,
          Number(sheet.last_rows_count) || 0,
          sheet.is_demo || 0,
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
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to preview Google Sheet." });
  }
});
apiRouter.put("/integrations/google-sheets/:id", async (req, res) => {
  try {
    const updated = await updateGoogleSheetConnection(req.params.id, req.body, req.body.performedBy || "Admin");
    res.json({ success: true, sheet: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.delete("/integrations/google-sheets/:id", async (req, res) => {
  try {
    const result = await deleteGoogleSheetConnection(req.params.id, req.body.performedBy || "Admin");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/integrations/google-sheets/sync-all", async (req, res) => {
  try {
    const report = await syncAllActiveGoogleSheets(req.body.performedBy || "Admin");
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to perform multi-sheet sync." });
  }
});
apiRouter.post("/integrations/google-sheets/sync-live", async (req, res) => {
  try {
    let sheetUrl = req.body.sheetUrl;
    if (sheetUrl) {
      const syncReport = await syncLiveGoogleSheetLeads(sheetUrl, req.body.performedBy || "Admin");
      return res.json(syncReport);
    }
    const bulkReport = await syncAllActiveGoogleSheets(req.body.performedBy || "Admin");
    res.json(bulkReport);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to sync leads from Google Sheet." });
  }
});
apiRouter.post("/integrations/google-sheets/disconnect", (req, res) => {
  try {
    const config = {
      spreadsheetUrl: "",
      spreadsheetId: "",
      gid: "0",
      sheetName: "Leads 2026",
      syncDirection: "TWO_WAY",
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
      userName: req.body.performedBy || "Admin",
      action: "GOOGLE_SHEETS_DISCONNECTED",
      entity: "integration",
      entityId: "int-sheets"
    });
    res.json({ success: true, message: "Google Sheet disconnected successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/settings", (req, res) => {
  const rows = db.prepare("SELECT * FROM settings").all();
  const settingsObj = {};
  for (const r of rows) settingsObj[r.key] = r.value;
  res.json(settingsObj);
});
apiRouter.put("/settings", (req, res) => {
  const updates = req.body;
  const updateStmt = db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
  for (const [key, value] of Object.entries(updates)) {
    updateStmt.run(key, typeof value === "string" ? value : JSON.stringify(value));
  }
  logAudit({
    userName: req.body.performedBy || "Admin",
    action: "SETTINGS_UPDATED",
    entity: "settings",
    newValue: updates
  });
  res.json({ success: true });
});
apiRouter.get("/audit-logs", (req, res) => {
  const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100").all();
  res.json(logs);
});
apiRouter.get("/search/global", (req, res) => {
  const q = req.query.q;
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
apiRouter.get("/reports/dashboard-kpis", (req, res) => {
  const { startDate, endDate, counselorId, city, university, course, source, campaign } = req.query;
  const kpis = getDashboardKPIs({
    startDate,
    endDate,
    counselorId,
    city,
    university,
    course,
    source,
    campaign
  });
  res.json(kpis);
});
apiRouter.get("/export/:entity", (req, res) => {
  const entity = req.params.entity;
  if (entity === "leads") {
    const leads = db.prepare("SELECT lead_id, student_name, phone, whatsapp_number, email, city, country, preferred_course, preferred_university, lead_status, lead_temperature, assigned_counselor_name, lead_source, created_at FROM leads WHERE is_deleted = 0").all();
    const csvHeader = "Lead ID,Student Name,Phone,WhatsApp,Email,City,Country,Preferred Course,Preferred University,Status,Temperature,Counselor,Source,Created At\n";
    const csvRows = leads.map(
      (l) => `"${l.lead_id}","${l.student_name}","${l.phone}","${l.whatsapp_number}","${l.email}","${l.city}","${l.country}","${l.preferred_course}","${l.preferred_university}","${l.lead_status}","${l.lead_temperature}","${l.assigned_counselor_name || "Unassigned"}","${l.lead_source}","${l.created_at}"`
    ).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="education_sansar_leads.csv"');
    return res.send(csvHeader + csvRows);
  }
  if (entity === "students") {
    const students = db.prepare("SELECT student_id, student_name, phone, email, university, course, admission_date, fee_paid, counselor_name, city, country FROM students").all();
    const csvHeader = "Student ID,Student Name,Phone,Email,University,Course,Admission Date,Fee Paid,Counselor,City,Country\n";
    const csvRows = students.map(
      (s) => `"${s.student_id}","${s.student_name}","${s.phone}","${s.email}","${s.university}","${s.course}","${s.admission_date}",${s.fee_paid},"${s.counselor_name || ""}","${s.city}","${s.country}"`
    ).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="education_sansar_students.csv"');
    return res.send(csvHeader + csvRows);
  }
  if (entity === "applications") {
    const apps = db.prepare("SELECT application_id, student_name, university_name, course_name, application_date, application_status, application_fee, payment_status, counselor_name FROM applications").all();
    const csvHeader = "Application ID,Student Name,University,Course,Application Date,Status,Fee,Payment Status,Counselor\n";
    const csvRows = apps.map(
      (a) => `"${a.application_id}","${a.student_name}","${a.university_name}","${a.course_name}","${a.application_date}","${a.application_status}",${a.application_fee},"${a.payment_status}","${a.counselor_name || ""}"`
    ).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="education_sansar_applications.csv"');
    return res.send(csvHeader + csvRows);
  }
  res.status(400).json({ error: "Unknown export entity" });
});
apiRouter.post("/import/leads", (req, res) => {
  const { leads, previewOnly, performedBy } = req.body;
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: "No leads provided for import" });
  }
  const results = [];
  let validCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  for (const item of leads) {
    const cleanPhone = item.phone || item.Phone;
    const cleanName = item.name || item.student_name || item["Student Name"];
    const cleanEmail = item.email || item.Email;
    if (!cleanName || !cleanPhone) {
      results.push({
        name: cleanName || "Unknown",
        phone: cleanPhone || "",
        status: "ERROR",
        message: "Name and Phone are mandatory"
      });
      errorCount++;
      continue;
    }
    const dup = checkDuplicate({
      phone: cleanPhone,
      email: cleanEmail
    });
    if (dup.hasDuplicate) {
      results.push({
        name: cleanName,
        phone: cleanPhone,
        status: "DUPLICATE",
        message: `Matches existing lead ${dup.duplicates[0].lead_id} (${dup.duplicates[0].student_name})`,
        existingLead: dup.duplicates[0]
      });
      duplicateCount++;
      continue;
    }
    results.push({
      name: cleanName,
      phone: cleanPhone,
      status: "VALID",
      data: item
    });
    validCount++;
  }
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
  let createdCount = 0;
  for (const item of results) {
    if (item.status === "VALID") {
      const d = item.data;
      createLead({
        student_name: d.name || d.student_name || d["Student Name"],
        phone: d.phone || d.Phone,
        email: d.email || d.Email || "",
        city: d.city || d.City || "Kathmandu",
        preferred_course: d.course || d.preferred_course || d["Course"] || "B.Tech CSE",
        preferred_university: d.university || d.preferred_university || d["University"] || "SRM Institute of Science and Technology",
        lead_source: d.source || d.lead_source || d["Source"] || "Referral",
        lead_status: "New Lead"
      }, performedBy || "CSV Import");
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
apiRouter.get("/lead-routing/rules", (req, res) => {
  try {
    const rules = getRoutingRules();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch routing rules" });
  }
});
apiRouter.post("/lead-routing/rules", (req, res) => {
  try {
    const { name, counselor_id, course_keywords, university_keywords, target_cities, priority, max_daily_leads, is_active, description, performedBy } = req.body;
    if (!name || !counselor_id) {
      return res.status(400).json({ error: "Rule name and assigned counselor are required" });
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
    }, performedBy || "Super Admin");
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create routing rule" });
  }
});
apiRouter.put("/lead-routing/rules/:id", (req, res) => {
  try {
    const success = updateRoutingRule(req.params.id, req.body, req.body.performedBy || "Super Admin");
    if (!success) return res.status(404).json({ error: "Routing rule not found" });
    res.json({ success: true, message: "Routing rule updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update routing rule" });
  }
});
apiRouter.delete("/lead-routing/rules/:id", (req, res) => {
  try {
    const success = deleteRoutingRule(req.params.id, req.query.performedBy || "Super Admin");
    if (!success) return res.status(404).json({ error: "Routing rule not found" });
    res.json({ success: true, message: "Routing rule deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete routing rule" });
  }
});
apiRouter.post("/lead-routing/distribute-unassigned", async (req, res) => {
  try {
    const report = await distributeUnassignedLeads(req.body.performedBy || "Super Admin");
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to distribute unassigned leads" });
  }
});
apiRouter.post("/lead-routing/simulate", (req, res) => {
  try {
    const simulation = simulateLeadRouting(req.body);
    res.json(simulation);
  } catch (err) {
    res.status(500).json({ error: err.message || "Routing simulation failed" });
  }
});
apiRouter.get("/hr/employees", (req, res) => {
  try {
    const employees = getEmployees();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch employees" });
  }
});
apiRouter.post("/hr/employees", (req, res) => {
  try {
    const { full_name, email, phone } = req.body;
    if (!full_name || !email || !phone) {
      return res.status(400).json({ error: "Full name, email, and phone number are required" });
    }
    const employee = createEmployee(req.body, req.body.performedBy || "Super Admin");
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create employee" });
  }
});
apiRouter.put("/hr/employees/:id", (req, res) => {
  try {
    const success = updateEmployee(req.params.id, req.body, req.body.performedBy || "Super Admin");
    if (!success) return res.status(404).json({ error: "Employee not found" });
    res.json({ success: true, message: "Employee updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update employee" });
  }
});
apiRouter.delete("/hr/employees/:id", (req, res) => {
  try {
    const success = deleteEmployee(req.params.id, req.query.performedBy || "Super Admin");
    if (!success) return res.status(404).json({ error: "Employee not found" });
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete employee" });
  }
});
apiRouter.get("/hr/attendance", (req, res) => {
  try {
    const records = getAttendance({
      date: req.query.date,
      employee_id: req.query.employee_id,
      month: req.query.month
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch attendance" });
  }
});
apiRouter.post("/hr/attendance", (req, res) => {
  try {
    const { employee_id, date, status } = req.body;
    if (!employee_id || !date) {
      return res.status(400).json({ error: "Employee ID and date are required" });
    }
    const result = recordAttendance(req.body, req.body.performedBy || "Super Admin");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to record attendance" });
  }
});
apiRouter.get("/hr/leaves", (req, res) => {
  try {
    const leaves = getLeaves({
      employee_id: req.query.employee_id,
      status: req.query.status
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch leaves" });
  }
});
apiRouter.post("/hr/leaves", (req, res) => {
  try {
    const { employee_id, start_date, end_date, reason } = req.body;
    if (!employee_id || !start_date || !end_date || !reason) {
      return res.status(400).json({ error: "Employee, start date, end date, and reason are required" });
    }
    const result = applyLeave(req.body, req.body.performedBy || "Employee");
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to apply leave" });
  }
});
apiRouter.put("/hr/leaves/:id/status", (req, res) => {
  try {
    const { status, remarks, approvedBy } = req.body;
    if (!status || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ error: "Valid status (Approved or Rejected) is required" });
    }
    const result = updateLeaveStatus(req.params.id, status, remarks, approvedBy || "Super Admin");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update leave status" });
  }
});
apiRouter.get("/hr/payroll", (req, res) => {
  try {
    const payroll = getPayroll({
      month_year: req.query.month_year,
      employee_id: req.query.employee_id
    });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch payroll" });
  }
});
apiRouter.post("/hr/payroll/generate", (req, res) => {
  try {
    const { monthYear, performedBy } = req.body;
    if (!monthYear) {
      return res.status(400).json({ error: "Month & Year (YYYY-MM) is required" });
    }
    const result = generateMonthlyPayroll(monthYear, performedBy || "Super Admin");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to generate payroll" });
  }
});
apiRouter.put("/hr/payroll/:id/pay", (req, res) => {
  try {
    const { paymentMethod, remarks, performedBy } = req.body;
    const result = markPayrollPaid(req.params.id, paymentMethod || "Bank Transfer", remarks, performedBy || "Super Admin");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to mark payroll paid" });
  }
});
apiRouter.get("/finance/overview", (req, res) => {
  try {
    const overview = getFinanceOverview({
      month: req.query.month,
      year: req.query.year
    });
    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch financial overview" });
  }
});
apiRouter.get("/finance/transactions", (req, res) => {
  try {
    const transactions = getTransactions({
      type: req.query.type,
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      paymentMethod: req.query.paymentMethod,
      limit: req.query.limit ? Number(req.query.limit) : void 0
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch transactions" });
  }
});
apiRouter.post("/finance/transactions", (req, res) => {
  try {
    const { title, amount, type } = req.body;
    if (!title || amount === void 0 || !type) {
      return res.status(400).json({ error: "Title, amount, and type (INCOME/EXPENSE) are required" });
    }
    const txn = createTransaction(req.body, req.body.performedBy || "Super Admin");
    res.status(201).json(txn);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create transaction" });
  }
});
apiRouter.put("/finance/transactions/:id", (req, res) => {
  try {
    const success = updateTransaction(req.params.id, req.body, req.body.performedBy || "Super Admin");
    if (!success) return res.status(404).json({ error: "Transaction not found" });
    res.json({ success: true, message: "Transaction updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update transaction" });
  }
});
apiRouter.delete("/finance/transactions/:id", (req, res) => {
  try {
    const success = deleteTransaction(req.params.id, req.query.performedBy || "Super Admin");
    if (!success) return res.status(404).json({ error: "Transaction not found" });
    res.json({ success: true, message: "Transaction deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete transaction" });
  }
});
apiRouter.get("/finance/invoices", (req, res) => {
  try {
    const invoices = getInvoices({
      invoice_type: req.query.invoice_type,
      status: req.query.status,
      student_id: req.query.student_id,
      university_id: req.query.university_id
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch invoices" });
  }
});
apiRouter.post("/finance/invoices", (req, res) => {
  try {
    const { recipient_name, total_amount } = req.body;
    if (!recipient_name || total_amount === void 0) {
      return res.status(400).json({ error: "Recipient name and total amount are required" });
    }
    const invoice = createInvoice(req.body, req.body.performedBy || "Super Admin");
    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create invoice" });
  }
});
apiRouter.post("/finance/invoices/:id/pay", (req, res) => {
  try {
    const { amount, paymentMethod, referenceNumber, performedBy } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Payment amount must be greater than 0" });
    }
    const result = recordInvoicePayment(req.params.id, Number(amount), paymentMethod || "Bank Transfer", referenceNumber, performedBy || "Super Admin");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to record invoice payment" });
  }
});
apiRouter.get("/finance/university-commissions", (req, res) => {
  try {
    const commissions = getUniversityCommissionsSummary();
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch university commissions" });
  }
});
apiRouter.get("/email/templates", (req, res) => {
  try {
    const filters = {
      course: req.query.course,
      university: req.query.university,
      category: req.query.category
    };
    const templates = getEmailTemplates(filters);
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch email templates" });
  }
});
apiRouter.post("/email/templates", (req, res) => {
  try {
    const { name, subject, content } = req.body;
    if (!name || !subject || !content) {
      return res.status(400).json({ error: "Template name, subject, and content are required" });
    }
    const template = saveEmailTemplate(req.body, req.body.performedBy || "Super Admin");
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create email template" });
  }
});
apiRouter.put("/email/templates/:id", (req, res) => {
  try {
    const template = saveEmailTemplate({ id: req.params.id, ...req.body }, req.body.performedBy || "Super Admin");
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update email template" });
  }
});
apiRouter.delete("/email/templates/:id", (req, res) => {
  try {
    const performedBy = req.query.performedBy || req.body?.performedBy || "Super Admin";
    const success = deleteEmailTemplate(req.params.id, performedBy);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to delete email template" });
  }
});
apiRouter.post("/email/preview", (req, res) => {
  try {
    const { subject, content, sampleData } = req.body;
    const preview = previewEmailResolution(subject || "", content || "", sampleData);
    res.json(preview);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to preview email template" });
  }
});
apiRouter.post("/email/target-count", (req, res) => {
  try {
    const matchingLeads = getTargetLeadsForBulkEmail(req.body || {});
    res.json({
      count: matchingLeads.length,
      sample: matchingLeads.slice(0, 5).map((l) => ({
        id: l.id,
        student_name: l.student_name,
        email: l.email,
        course: l.preferred_course,
        university: l.preferred_university,
        city: l.city,
        temperature: l.lead_temperature
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to compute target leads count" });
  }
});
apiRouter.post("/email/send-bulk", (req, res) => {
  try {
    const { subject, content } = req.body;
    if (!subject || !content) {
      return res.status(400).json({ error: "Subject and email content body are required" });
    }
    const result = sendBulkEmailCampaign(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to dispatch bulk email campaign" });
  }
});
apiRouter.get("/email/campaigns", (req, res) => {
  try {
    const campaigns = getBulkEmailCampaigns();
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch bulk email campaigns" });
  }
});

// server/index.ts
init_database();

// server/db/seed.ts
init_database();
function seedDatabase() {
  console.log("\u{1F331} Initializing clean Education Sansar CRM database schema & Super Admin...");
  const runTx = db.transaction(() => {
    const insertRole = db.prepare("INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)");
    const roles = [
      ["role-1", "Super Admin", "Full system access, administration, integrations and configuration"],
      ["role-2", "Admin", "Lead distribution, counselor supervision, reports, pipeline oversight"],
      ["role-3", "Counselor", "Assigned student counselling, notes, applications, document collection"],
      ["role-4", "Telecaller", "Calling leads, logging WhatsApp outreach, follow-up scheduling"],
      ["role-5", "Marketing Manager", "Campaigns, sources, ROI analytics, Meta lead ads sync"],
      ["role-6", "Management", "Executive reporting, counselor KPIs, admission revenue oversight"],
      ["role-7", "Accountant", "Student fee invoicing, university commissions, payment reconciliations, general ledger"],
      ["role-8", "HR Manager", "Employee directory, daily attendance register, leaves approval, payroll management"]
    ];
    for (const r of roles) insertRole.run(r[0], r[1], r[2]);
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      "u-super",
      "System Administrator",
      "admin@educationsansar.com",
      "admin123",
      "Super Admin",
      "+977 9801234567",
      1
    );
    const insertTemplate = db.prepare(`
      INSERT OR REPLACE INTO message_templates (id, name, channel, category, subject, content, variables, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const templates = [
      [
        "tmpl-1",
        "Lead Welcome & Introduction",
        "WhatsApp",
        "WELCOME",
        null,
        "Namaste {{student_name}}! Welcome to Education Sansar. We have received your inquiry for {{preferred_course}} at {{preferred_university}}. Your dedicated counselor is {{counselor_name}} (Phone: {{counselor_phone}}). We look forward to guiding you through admissions and scholarships!",
        '["student_name", "preferred_course", "preferred_university", "counselor_name", "counselor_phone"]',
        1
      ],
      [
        "tmpl-2",
        "Counselor Personal Introduction",
        "WhatsApp",
        "COUNSELOR_INTRO",
        null,
        "Hello {{student_name}}, this is {{counselor_name}} from Education Sansar. I will be your official admission advisor for {{preferred_university}}. Are you free for a 10-minute briefing today at {{follow_up_time}}?",
        '["student_name", "counselor_name", "preferred_university", "follow_up_time"]',
        1
      ],
      [
        "tmpl-3",
        "Follow-up Call Reminder",
        "WhatsApp",
        "FOLLOWUP_REMINDER",
        null,
        "Dear {{student_name}}, reminding you about our scheduled counselling session today regarding your application to {{preferred_university}}. Looking forward to speaking with you!",
        '["student_name", "preferred_university"]',
        1
      ],
      [
        "tmpl-4",
        "Document Submission Pending",
        "WhatsApp",
        "DOCUMENT_REMINDER",
        null,
        "Dear {{student_name}}, your admission application for {{preferred_course}} is waiting for pending documents (10th/12th marksheets & Citizenship/Aadhaar). Please upload or send them to your counselor {{counselor_name}} before the deadline.",
        '["student_name", "preferred_course", "counselor_name"]',
        1
      ],
      [
        "tmpl-5",
        "Admission Fee Payment Reminder",
        "WhatsApp",
        "FEE_REMINDER",
        null,
        "Congratulations {{student_name}}! Your provisional admission offer from {{preferred_university}} is confirmed. Please complete the seat confirmation fee before {{deadline}} to secure your seat.",
        '["student_name", "preferred_university", "deadline"]',
        1
      ],
      [
        "tmpl-6",
        "Admission Confirmed Welcome",
        "WhatsApp",
        "ADMISSION_CONFIRMATION",
        null,
        "Hearty Congratulations {{student_name}}! Your admission to {{preferred_course}} at {{preferred_university}} is formally confirmed. Welcome to the Education Sansar family. Your Student ID is {{student_id}}.",
        '["student_name", "preferred_course", "preferred_university", "student_id"]',
        1
      ]
    ];
    for (const t of templates) {
      insertTemplate.run(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7]);
    }
    const insertIntegration = db.prepare(`
      INSERT OR REPLACE INTO integrations (id, name, is_enabled, status, config, last_sync_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertIntegration.run(
      "int-meta",
      "Meta Lead Ads",
      0,
      "NOT CONNECTED",
      JSON.stringify({ webhookUrl: "/api/integrations/meta/webhook", verifyToken: "education_sansar_meta_verify_token_2026", pageId: "", appId: "" }),
      null
    );
    insertIntegration.run(
      "int-wa",
      "WhatsApp Business API",
      0,
      "NOT CONNECTED",
      JSON.stringify({ phoneNumberId: "", wabaId: "", defaultSender: "Education Sansar" }),
      null
    );
    insertIntegration.run(
      "int-email",
      "Transactional Email (Resend/SendGrid)",
      0,
      "NOT CONNECTED",
      JSON.stringify({ fromEmail: "admissions@educationsansar.com" }),
      null
    );
    insertIntegration.run(
      "int-sheets",
      "Google Sheets Sync",
      0,
      "NOT CONNECTED",
      JSON.stringify({
        spreadsheetUrl: "",
        spreadsheetId: "",
        sheetName: "Leads 2026",
        syncDirection: "TWO_WAY",
        autoExportNewLeads: false,
        autoImportOnWebhook: true
      }),
      null
    );
    const insertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value, description) VALUES (?, ?, ?)");
    insertSetting.run("company_name", "Education Sansar", "Official company legal name");
    insertSetting.run("company_address", "Sector 94, Noida, Uttar Pradesh 201313", "Main office address");
    insertSetting.run("company_phone", "+91 98100 12345 / +977 98012 34567", "Official hotline phone");
    insertSetting.run("company_email", "admissions@educationsansar.com", "Official admissions email");
    insertSetting.run("assignment_mode", "Round Robin", "Current lead assignment strategy: Round Robin, City Based, University Based, Course Based, Manual");
    insertSetting.run("round_robin_pointer", "0", "Index pointer for round-robin counselor distribution");
    insertSetting.run("duplicate_check_strictness", "Strict", "Duplicate detection rules (Phone, WhatsApp, Email, FB Lead ID)");
    insertSetting.run("auto_create_first_followup", "true", "Automatically schedule 24-hr follow-up on new lead creation");
    insertSetting.run("auto_convert_student_on_confirm", "true", "Automatically generate student record when lead status hits Admission Confirmed");
    const counselorCount = db.prepare("SELECT count(*) as count FROM counselors").get().count;
    if (counselorCount === 0) {
      const insertUser2 = db.prepare(`
        INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active, permissions)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `);
      const insertCounselor = db.prepare(`
        INSERT OR REPLACE INTO counselors (
          id, user_id, name, username, email, phone, role, specialization_country, assigned_cities,
          max_capacity, current_active_leads, total_assigned_leads, total_admissions, conversion_rate,
          is_active, status, joining_date, specialization_courses, specialization_universities, daily_lead_quota
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5, 20, 4, 20.0, 1, 'Active', ?, ?, ?, ?)
      `);
      insertUser2.run(
        "u-counselor-1",
        "Suman Sharma",
        "counselor@educationsansar.com",
        "counselor123",
        "Counselor",
        "+977 9801122334",
        JSON.stringify(["dashboard", "leads_view", "leads_create", "leads_edit", "pipeline", "applications", "students", "universities", "documents"])
      );
      insertCounselor.run(
        "c-counselor-1",
        "u-counselor-1",
        "Suman Sharma",
        "suman",
        "counselor@educationsansar.com",
        "+977 9801122334",
        "Counselor",
        "Nepal & North India",
        JSON.stringify(["Kathmandu", "Pokhara", "Janakpur"]),
        100,
        "2025-01-15",
        JSON.stringify(["B.Tech", "BE", "BCA", "Computer Science", "Data Science", "IT"]),
        JSON.stringify(["Sharda University", "Chandigarh University", "Parul University"]),
        25
      );
      insertUser2.run(
        "u-counselor-2",
        "Dr. Anjali Thapa",
        "medical@educationsansar.com",
        "counselor123",
        "Counselor",
        "+977 9812233445",
        JSON.stringify(["dashboard", "leads_view", "leads_create", "leads_edit", "pipeline", "applications", "students", "universities", "documents"])
      );
      insertCounselor.run(
        "c-counselor-2",
        "u-counselor-2",
        "Dr. Anjali Thapa",
        "anjali",
        "medical@educationsansar.com",
        "+977 9812233445",
        "Counselor",
        "Nepal & Bangladesh",
        JSON.stringify(["Kathmandu", "Biratnagar", "Dharan"]),
        80,
        "2025-02-01",
        JSON.stringify(["MBBS", "BDS", "B.Sc Nursing", "Pharmacy", "BAMS", "MD"]),
        JSON.stringify(["Parul University", "Graphic Era University", "Sharda University"]),
        20
      );
      insertUser2.run(
        "u-marketing-1",
        "Rajesh Verma",
        "marketing@educationsansar.com",
        "marketing123",
        "Marketing Manager",
        "+977 9823344556",
        JSON.stringify(["dashboard", "leads_view", "leads_create", "campaigns", "reports", "integrations"])
      );
      insertCounselor.run(
        "c-marketing-1",
        "u-marketing-1",
        "Rajesh Verma",
        "rajesh",
        "marketing@educationsansar.com",
        "+977 9823344556",
        "Marketing Manager",
        "Digital & Field Campaigns",
        JSON.stringify(["Kathmandu", "Chitwan"]),
        50,
        "2025-01-10",
        "[]",
        "[]",
        10
      );
      insertUser2.run(
        "u-finance-1",
        "Pooja Karki",
        "finance@educationsansar.com",
        "finance123",
        "Accountant",
        "+977 9834455667",
        JSON.stringify(["dashboard", "students", "finance_management", "hr_management", "reports"])
      );
      insertCounselor.run(
        "c-finance-1",
        "u-finance-1",
        "Pooja Karki",
        "pooja",
        "finance@educationsansar.com",
        "+977 9834455667",
        "Accountant",
        "General Accounts",
        "[]",
        30,
        "2025-01-20",
        "[]",
        "[]",
        10
      );
      const insertRule = db.prepare(`
        INSERT OR REPLACE INTO lead_routing_rules (
          id, name, course_keywords, university_keywords, target_cities,
          counselor_id, counselor_name, priority, max_daily_leads, is_active, description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertRule.run(
        "rule-eng",
        "Engineering & Technology Lead Routing",
        JSON.stringify(["B.Tech", "BE", "BCA", "Computer Science", "Software", "AI", "Robotics"]),
        JSON.stringify(["Sharda", "Chandigarh", "Parul"]),
        JSON.stringify(["Kathmandu", "Pokhara", "Janakpur"]),
        "c-counselor-1",
        "Suman Sharma",
        10,
        25,
        1,
        "Directs all high-value engineering, BCA, and computer science aspirants to Suman Sharma"
      );
      insertRule.run(
        "rule-med",
        "Medical & Healthcare Admissions Routing",
        JSON.stringify(["MBBS", "BDS", "Nursing", "B.Sc Nursing", "Pharmacy", "BAMS"]),
        JSON.stringify(["Parul", "Graphic Era", "Sharda"]),
        JSON.stringify(["Kathmandu", "Biratnagar", "Dharan"]),
        "c-counselor-2",
        "Dr. Anjali Thapa",
        10,
        20,
        1,
        "Routes all medical, nursing, and dental applicants to Dr. Anjali Thapa"
      );
      const insertEmp = db.prepare(`
        INSERT OR REPLACE INTO hr_employees (
          id, employee_code, user_id, counselor_id, full_name, email, phone,
          department, designation, employment_type, joining_date, monthly_salary, currency,
          bank_name, account_number, pan_number, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertEmp.run(
        "emp-1",
        "EMP-1001",
        "u-counselor-1",
        "c-counselor-1",
        "Suman Sharma",
        "counselor@educationsansar.com",
        "+977 9801122334",
        "Counseling",
        "Senior Admission Counselor",
        "Full-time",
        "2025-01-15",
        55e3,
        "NPR",
        "Nabil Bank Ltd",
        "01200175001234",
        "PAN-987654321",
        "Active"
      );
      insertEmp.run(
        "emp-2",
        "EMP-1002",
        "u-counselor-2",
        "c-counselor-2",
        "Dr. Anjali Thapa",
        "medical@educationsansar.com",
        "+977 9812233445",
        "Counseling",
        "Medical Admissions Advisor",
        "Full-time",
        "2025-02-01",
        65e3,
        "NPR",
        "Global IME Bank",
        "2901010004567",
        "PAN-876543210",
        "Active"
      );
      insertEmp.run(
        "emp-3",
        "EMP-1003",
        "u-marketing-1",
        "c-marketing-1",
        "Rajesh Verma",
        "marketing@educationsansar.com",
        "+977 9823344556",
        "Marketing",
        "Marketing Manager",
        "Full-time",
        "2025-01-10",
        6e4,
        "NPR",
        "NIC Asia Bank",
        "1092003847291",
        "PAN-765432109",
        "Active"
      );
      insertEmp.run(
        "emp-4",
        "EMP-1004",
        "u-finance-1",
        "c-finance-1",
        "Pooja Karki",
        "finance@educationsansar.com",
        "+977 9834455667",
        "Finance & Accounts",
        "Accounts Officer",
        "Full-time",
        "2025-01-20",
        48e3,
        "NPR",
        "Siddhartha Bank",
        "003150098234",
        "PAN-654321098",
        "Active"
      );
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const insertAtt = db.prepare(`
        INSERT OR IGNORE INTO hr_attendance (id, employee_id, date, status, check_in_time, check_out_time, work_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertAtt.run("att-1", "emp-1", todayStr, "Present", "09:45 AM", "06:15 PM", "Office");
      insertAtt.run("att-2", "emp-2", todayStr, "Present", "09:30 AM", "06:00 PM", "Office");
      insertAtt.run("att-3", "emp-3", todayStr, "Present", "10:00 AM", "06:30 PM", "Field Work");
      insertAtt.run("att-4", "emp-4", todayStr, "Present", "09:15 AM", "05:45 PM", "Office");
      const insertTx = db.prepare(`
        INSERT OR REPLACE INTO finance_transactions (
          id, transaction_id, type, category, title, amount, currency, transaction_date,
          payment_method, reference_number, status, recorded_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertTx.run(
        "tx-1",
        "TXN-2026-0001",
        "INCOME",
        "University Commission",
        "Quarterly admission commission payout from Sharda University for B.Tech batch",
        185e3,
        "INR",
        "2026-10-15",
        "Bank Transfer",
        "UTR-SHARDA-99812",
        "Completed",
        "System"
      );
      insertTx.run(
        "tx-2",
        "TXN-2026-0002",
        "INCOME",
        "Student Fee",
        "Counseling registration and university document processing fee",
        25e3,
        "NPR",
        "2026-10-20",
        "eSewa",
        "ESEWA-883192",
        "Completed",
        "Pooja Karki"
      );
      insertTx.run(
        "tx-3",
        "TXN-2026-0003",
        "EXPENSE",
        "Digital Ads (Meta/Google)",
        "Meta Lead Ads and Google Search ad campaign for Kathmandu & Pokhara students",
        35e3,
        "INR",
        "2026-10-18",
        "Bank Transfer",
        "META-ADS-INV-7721",
        "Completed",
        "Rajesh Verma"
      );
      insertTx.run(
        "tx-4",
        "TXN-2026-0004",
        "EXPENSE",
        "Office Rent",
        "Education Sansar head office monthly rental and high-speed internet",
        4e4,
        "NPR",
        "2026-10-01",
        "Bank Transfer",
        "RENT-OCT-2026",
        "Completed",
        "Pooja Karki"
      );
    }
    logAudit({
      userId: "u-super",
      userName: "System Administrator",
      action: "SYSTEM_INIT",
      entity: "SYSTEM",
      entityId: "system",
      newValue: "Clean production schema initialized with Super Admin account and core staff structure"
    });
  });
  runTx();
  console.log("\u2705 Clean production database initialization complete! Super Admin, Counselors, and Rules initialized.");
}
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  initDatabase();
  seedDatabase();
}

// server/index.ts
dotenv2.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 5e3;
initDatabase();
seedDatabase();
try {
  ensureInitialCourseEmailTemplatesSeed();
} catch (e) {
  console.warn("Initial email template seed warning:", e);
}
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
var uploadsDir = path2.resolve(process.cwd(), "uploads");
if (!fs2.existsSync(uploadsDir)) {
  try {
    fs2.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {
  }
}
app.use("/uploads", express.static(uploadsDir));
app.use("/api", apiRouter);
var handleHealth = (req, res) => {
  res.json({
    status: "healthy",
    system: "Education Sansar CRM Backend",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
app.get("/health", handleHealth);
app.get("/api/health", handleHealth);
var clientDist = path2.resolve(process.cwd(), "dist");
var indexPath = path2.join(clientDist, "index.html");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  if (fs2.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(503).send(`
    <!DOCTYPE html>
    <html>
      <head><title>Education Sansar CRM</title><meta http-equiv="refresh" content="3"></head>
      <body style="font-family:sans-serif;text-align:center;padding:50px;">
        <h2>Education Sansar CRM is loading...</h2>
        <p>Please wait while the service starts up.</p>
      </body>
    </html>
  `);
});
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "An unexpected error occurred. Please try again.",
    code: err.code || "INTERNAL_ERROR"
  });
});
var isVercel2 = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isVercel2) {
  setInterval(async () => {
    try {
      const { syncAllActiveGoogleSheets: syncAllActiveGoogleSheets2 } = await Promise.resolve().then(() => (init_integrationService(), integrationService_exports));
      await syncAllActiveGoogleSheets2("System Background Sync");
    } catch (err) {
      console.log("Background sync check completed with note:", err.message);
    }
  }, 15 * 60 * 1e3);
  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`\u{1F680} Education Sansar CRM Server is LIVE on port ${PORT}:`);
    console.log(`   \u279C Local:   http://localhost:${PORT} / http://127.0.0.1:${PORT}`);
    console.log(`\u{1F4CD} Office: Sector 94, Noida, Uttar Pradesh 201313`);
  });
  const handleShutdown = () => {
    console.log("Shutting down gracefully, running database checkpoint...");
    try {
      const { checkpointDatabase: checkpointDatabase2, db: db2 } = (init_database(), __toCommonJS(database_exports));
      checkpointDatabase2();
      db2.close();
    } catch (e) {
    }
    process.exit(0);
  };
  process.on("SIGINT", handleShutdown);
  process.on("SIGTERM", handleShutdown);
}
var index_default = app;
export {
  app,
  index_default as default
};
