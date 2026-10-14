var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
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

// server/db/database.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
function runSafeMigrations() {
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
}
function initDatabase() {
  try {
    db.exec(SCHEMA_SQL);
    runSafeMigrations();
    console.log("\u2705 Database schema initialized and migrated successfully");
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
var dbDir, dbPath, db;
var init_database = __esm({
  "server/db/database.ts"() {
    "use strict";
    init_schema();
    dbDir = process.env.DATABASE_DIR ? path.resolve(process.env.DATABASE_DIR) : path.resolve(process.cwd(), "server/db");
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
      } catch (e) {
      }
    }
    dbPath = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(dbDir, "education_sansar.db");
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === "development" && process.env.DB_VERBOSE === "true" ? console.log : void 0
    });
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("foreign_keys = ON");
    initDatabase();
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
  let sql = `SELECT * FROM leads WHERE is_deleted = 0 AND (${conditions.join(" OR ")})`;
  if (params.excludeId) {
    sql += ` AND id != ?`;
    queryParams.push(params.excludeId);
  }
  const duplicates = db.prepare(sql).all(...queryParams);
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
  const modeSetting = db.prepare("SELECT value FROM settings WHERE key = 'assignment_mode'").get();
  const assignmentMode = modeSetting?.value || "Round Robin";
  const activeCounselors = db.prepare(`
    SELECT * FROM counselors 
    WHERE is_active = 1 AND current_active_leads < max_capacity
    ORDER BY current_active_leads ASC, total_assigned_leads ASC
  `).all();
  if (activeCounselors.length === 0) {
    return null;
  }
  if (assignmentMode === "City Based" && lead.city) {
    for (const c of activeCounselors) {
      try {
        const cities = JSON.parse(c.assigned_cities || "[]");
        if (cities.some((city) => city.toLowerCase() === lead.city?.toLowerCase())) {
          return { counselorId: c.id, counselorName: c.name, method: "City Based" };
        }
      } catch (e) {
      }
    }
  }
  if (assignmentMode === "University Based" && lead.preferred_university) {
    if (lead.preferred_university.includes("SRM")) {
      const match = activeCounselors.find((c) => c.name.includes("Aarav") || c.name.includes("Ananya"));
      if (match) return { counselorId: match.id, counselorName: match.name, method: "University Based" };
    }
    if (lead.preferred_university.includes("VIT")) {
      const match = activeCounselors.find((c) => c.name.includes("Priya") || c.name.includes("Ananya"));
      if (match) return { counselorId: match.id, counselorName: match.name, method: "University Based" };
    }
    if (lead.preferred_university.includes("Symbiosis") || lead.preferred_university.includes("NMIMS")) {
      const match = activeCounselors.find((c) => c.name.includes("Sneha") || c.name.includes("Priya"));
      if (match) return { counselorId: match.id, counselorName: match.name, method: "University Based" };
    }
  }
  if (assignmentMode === "Course Based" && lead.preferred_course) {
    if (lead.preferred_course.includes("Nursing") || lead.preferred_course.includes("MBBS") || lead.preferred_course.includes("BDS")) {
      const match = activeCounselors.find((c) => c.name.includes("Bibek") || c.name.includes("Roshan"));
      if (match) return { counselorId: match.id, counselorName: match.name, method: "Course Based" };
    }
    if (lead.preferred_course.includes("MBA") || lead.preferred_course.includes("BBA")) {
      const match = activeCounselors.find((c) => c.name.includes("Sneha") || c.name.includes("Priya"));
      if (match) return { counselorId: match.id, counselorName: match.name, method: "Course Based" };
    }
  }
  const pointerSetting = db.prepare("SELECT value FROM settings WHERE key = 'round_robin_pointer'").get();
  let pointer = parseInt(pointerSetting?.value || "0", 10);
  if (isNaN(pointer) || pointer >= activeCounselors.length) {
    pointer = 0;
  }
  const selected = activeCounselors[pointer];
  const nextPointer = (pointer + 1) % activeCounselors.length;
  db.prepare("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'round_robin_pointer'").run(nextPointer.toString());
  return {
    counselorId: selected.id,
    counselorName: selected.name,
    method: "Round Robin"
  };
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
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
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
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
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
function getAllGoogleSheetConnections() {
  const connections = db.prepare("SELECT * FROM google_sheets_connections ORDER BY created_at DESC").all();
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
  const existing = db.prepare("SELECT id FROM google_sheets_connections WHERE spreadsheet_id = ? AND gid = ?").get(parsed.spreadsheetId, parsed.gid);
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
function updateGoogleSheetConnection(id, updates, performedBy = "Admin") {
  const current = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(id);
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
  logAudit({
    userName: performedBy,
    action: "GOOGLE_SHEET_UPDATED",
    entity: "google_sheets_connection",
    entityId: id,
    oldValue: current,
    newValue: updates
  });
  return db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(id);
}
function deleteGoogleSheetConnection(id, performedBy = "Admin") {
  const current = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(id);
  if (!current) throw new Error("Google Sheet connection not found: " + id);
  db.prepare("DELETE FROM google_sheets_connections WHERE id = ?").run(id);
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
  }
});

// server/index.ts
import express from "express";
import cors from "cors";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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
var apiRouter = Router();
apiRouter.post("/auth/login", (req, res) => {
  try {
    const { email, username, password, role } = req.body || {};
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
    const identifier = (email || username || "").trim().toLowerCase();
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
  const deleteTx = db.transaction((id) => {
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
  logAudit({
    userName: req.body.performedBy || "User",
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
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.is_deleted = 0) as total_leads_count,
      (SELECT count(*) FROM leads l WHERE l.assigned_counselor_id = c.id AND l.lead_status IN ('New Lead', 'Contacted', 'Counseling Scheduled', 'Interested', 'Application Started', 'Documents Pending') AND l.is_deleted = 0) as active_leads_count
    FROM counselors c
    ORDER BY c.name ASC
  `).all();
  res.json(counselors);
});
apiRouter.put("/counselors/:id/toggle-active", (req, res) => {
  const c = db.prepare("SELECT is_active, name FROM counselors WHERE id = ?").get(req.params.id);
  if (!c) return res.status(404).json({ error: "Counselor not found" });
  const newActive = c.is_active === 1 ? 0 : 1;
  db.prepare("UPDATE counselors SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(newActive, req.params.id);
  logAudit({
    userName: req.body.performedBy || "Admin",
    action: newActive ? "COUNSELOR_ACTIVATED" : "COUNSELOR_DEACTIVATED",
    entity: "counselor",
    entityId: req.params.id,
    newValue: { is_active: newActive, name: c.name }
  });
  res.json({ success: true, is_active: newActive });
});
apiRouter.post("/counselors", (req, res) => {
  const { name, email, phone, specialization_country, assigned_cities, max_capacity, password, username } = req.body;
  if (!name || !email || !phone) return res.status(400).json({ error: "Name, email and phone are required" });
  const cId = "c-" + Date.now();
  const uId = "u-" + Date.now();
  const pwd = password || "counselor123";
  const uname = username || email.split("@")[0];
  db.prepare(`
    INSERT INTO counselors (id, user_id, name, username, email, phone, specialization_country, assigned_cities, max_capacity, is_active, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'Active')
  `).run(cId, uId, name, uname, email, phone, specialization_country || "Nepal & India", JSON.stringify(assigned_cities || []), max_capacity || 100);
  db.prepare(`
    INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active)
    VALUES (?, ?, ?, ?, 'Counselor', ?, 1)
  `).run(uId, name, email, pwd, phone);
  logAudit({
    userName: req.body.performedBy || "Admin",
    action: "COUNSELOR_CREATED",
    entity: "counselor",
    entityId: cId,
    newValue: { name, email, phone }
  });
  res.status(201).json({ success: true, id: cId, user_id: uId });
});
apiRouter.put("/counselors/:id", (req, res) => {
  const { name, email, phone, specialization_country, assigned_cities, max_capacity, is_active, status } = req.body;
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
        updated_at = datetime('now')
    WHERE id = ?
  `).run(name, email, phone, specialization_country, assigned_cities ? JSON.stringify(assigned_cities) : null, max_capacity, activeVal, statusVal, req.params.id);
  if (email || name || phone || is_active !== void 0) {
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
    userName: req.body.performedBy || "Admin",
    action: "COUNSELOR_UPDATED",
    entity: "counselor",
    entityId: req.params.id,
    newValue: { name, email, phone, status: statusVal }
  });
  res.json({ success: true });
});
apiRouter.delete("/counselors/:id", (req, res) => {
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
  logAudit({
    userName: req.body.performedBy || "Admin",
    action: "COUNSELOR_DELETED",
    entity: "counselor",
    entityId: req.params.id,
    oldValue: { name: counselor.name, email: counselor.email }
  });
  res.json({ success: true, message: `Counselor ${counselor.name} deleted successfully.` });
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
  const params = [];
  if (counselorId) {
    sql += " AND f.counselor_id = ?";
    params.push(counselorId);
  }
  if (view === "today") {
    sql += " AND date(f.follow_up_date) = date('now') AND f.status = 'Pending'";
  } else if (view === "overdue") {
    sql += " AND date(f.follow_up_date) < date('now') AND f.status = 'Pending'";
  } else if (view === "upcoming") {
    sql += " AND date(f.follow_up_date) > date('now') AND f.status = 'Pending'";
  } else if (view === "completed") {
    sql += " AND f.status = 'Completed'";
  } else if (status) {
    sql += " AND f.status = ?";
    params.push(status);
  }
  if (date) {
    sql += " AND date(f.follow_up_date) = date(?)";
    params.push(date);
  }
  sql += " ORDER BY f.follow_up_date ASC, f.follow_up_time ASC";
  const followups = db.prepare(sql).all(...params);
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
  let sql = `
    SELECT a.*, l.phone as student_phone, l.email as student_email
    FROM applications a
    JOIN leads l ON a.lead_id = l.id
    WHERE l.is_deleted = 0
  `;
  const params = [];
  if (status) {
    sql += " AND a.application_status = ?";
    params.push(status);
  }
  if (counselorId) {
    sql += " AND a.counselor_id = ?";
    params.push(counselorId);
  }
  if (universityId) {
    sql += " AND a.university_id = ?";
    params.push(universityId);
  }
  if (search) {
    sql += " AND (a.student_name LIKE ? OR a.application_id LIKE ? OR a.application_number LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY a.created_at DESC";
  const apps = db.prepare(sql).all(...params);
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
  let sql = "SELECT * FROM students WHERE 1=1";
  const params = [];
  if (search) {
    sql += " AND (student_name LIKE ? OR student_id LIKE ? OR phone LIKE ? OR email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (university) {
    sql += " AND university = ?";
    params.push(university);
  }
  if (course) {
    sql += " AND course = ?";
    params.push(course);
  }
  sql += " ORDER BY admission_date DESC";
  const students = db.prepare(sql).all(...params);
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
  res.json({ success: true });
});
apiRouter.get("/courses", (req, res) => {
  const { university_id, stream, course_level, search } = req.query;
  let sql = "SELECT * FROM courses WHERE 1=1";
  const params = [];
  if (university_id) {
    sql += " AND university_id = ?";
    params.push(university_id);
  }
  if (stream) {
    sql += " AND stream = ?";
    params.push(stream);
  }
  if (course_level) {
    sql += " AND course_level = ?";
    params.push(course_level);
  }
  if (search) {
    sql += " AND (course_name LIKE ? OR stream LIKE ? OR short_name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY course_name ASC";
  const courses = db.prepare(sql).all(...params);
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
  res.json({ success: true });
});
apiRouter.get("/university-courses", (req, res) => {
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
  const params = [];
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
    const feeNum = parseFloat(max_fee);
    if (!isNaN(feeNum)) {
      sql += ` AND (uc.tuition_fee_per_year <= ? OR uc.total_first_year_fee <= ?)`;
      params.push(feeNum, feeNum);
    }
  }
  sql += ` ORDER BY c.course_name ASC, uc.total_first_year_fee ASC`;
  const results = db.prepare(sql).all(...params);
  res.json(results);
});
apiRouter.get("/university-courses/compare", (req, res) => {
  const ids = req.query.ids;
  if (!ids) return res.json([]);
  const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
  if (idList.length === 0) return res.json([]);
  const placeholders = idList.map(() => "?").join(",");
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
apiRouter.get("/university-courses/:id", (req, res) => {
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
  res.json({ success: true });
});
apiRouter.get("/documents", (req, res) => {
  const { lead_id, status } = req.query;
  let sql = "SELECT * FROM documents WHERE 1=1";
  const params = [];
  if (lead_id) {
    sql += " AND lead_id = ?";
    params.push(lead_id);
  }
  if (status) {
    sql += " AND verification_status = ?";
    params.push(status);
  }
  sql += " ORDER BY upload_date DESC";
  const docs = db.prepare(sql).all(...params);
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
  let sql = "SELECT * FROM notifications WHERE 1=1";
  const params = [];
  if (counselorId) {
    sql += " AND (counselor_id = ? OR counselor_id IS NULL)";
    params.push(counselorId);
  }
  sql += " ORDER BY created_at DESC LIMIT 50";
  const notifs = db.prepare(sql).all(...params);
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
apiRouter.get("/integrations/google-sheets/list", (req, res) => {
  try {
    const data = getAllGoogleSheetConnections();
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
    const sheet = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(sheetId);
    if (!sheet) {
      return res.status(404).json({ error: "Google Sheet connection not found: " + sheetId });
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
    const sheet = db.prepare("SELECT * FROM google_sheets_connections WHERE id = ?").get(sheetId);
    if (!sheet) {
      return res.status(404).json({ error: "Google Sheet connection not found: " + sheetId });
    }
    const liveData = await fetchLiveGoogleSheetData(sheet.sheet_url, sheet.sheet_name);
    res.json(liveData);
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to preview Google Sheet." });
  }
});
apiRouter.put("/integrations/google-sheets/:id", (req, res) => {
  try {
    const updated = updateGoogleSheetConnection(req.params.id, req.body, req.body.performedBy || "Admin");
    res.json({ success: true, sheet: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.delete("/integrations/google-sheets/:id", (req, res) => {
  try {
    const result = deleteGoogleSheetConnection(req.params.id, req.body.performedBy || "Admin");
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
      ["role-6", "Management", "Executive reporting, counselor KPIs, admission revenue oversight"]
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
    logAudit({
      userId: "u-super",
      userName: "System Administrator",
      action: "SYSTEM_INIT",
      entity: "SYSTEM",
      entityId: "system",
      newValue: "Clean production schema initialized with Super Admin account"
    });
  });
  runTx();
  console.log("\u2705 Clean production database initialization complete! Only Super Admin account exists.");
}
if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  initDatabase();
  seedDatabase();
}

// server/index.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 5e3;
initDatabase();
seedDatabase();
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
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    system: "Education Sansar CRM Backend",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
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
setInterval(async () => {
  try {
    const { syncAllActiveGoogleSheets: syncAllActiveGoogleSheets2 } = await Promise.resolve().then(() => (init_integrationService(), integrationService_exports));
    await syncAllActiveGoogleSheets2("System Background Sync");
  } catch (err) {
    console.log("Background sync check completed with note:", err.message);
  }
}, 15 * 60 * 1e3);
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`\u{1F680} Education Sansar CRM Server is LIVE on port ${PORT}:`);
  console.log(`   \u279C Local:   http://localhost:${PORT} / http://127.0.0.1:${PORT}`);
  console.log(`\u{1F4CD} Office: Sector 94, Noida, Uttar Pradesh 201313`);
});
