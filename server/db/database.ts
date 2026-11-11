import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL } from './schema.ts';

// Detect Vercel serverless environment
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// Resolve directory paths safely across tsx, bundled dist-server, and Vercel serverless
let dbDir: string;
let dbPath: string;

if (isVercel) {
  dbDir = '/tmp';
  dbPath = path.join(dbDir, 'education_sansar.db');
  if (!fs.existsSync(dbPath)) {
    try {
      const sourceDb = path.resolve(process.cwd(), 'server/db/education_sansar.db');
      if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, dbPath);
      }
    } catch (e) {
      console.warn('[Vercel] Could not copy seed db to /tmp:', e);
    }
  }
} else {
  dbDir = process.env.DATABASE_DIR 
    ? path.resolve(process.env.DATABASE_DIR)
    : path.resolve(process.cwd(), 'server/db');

  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (e) {}
  }

  dbPath = process.env.DATABASE_PATH 
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(dbDir, 'education_sansar.db');
}

export const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' && process.env.DB_VERBOSE === 'true' 
    ? console.log 
    : undefined
});

// Configure appropriate journal mode (DELETE for serverless /tmp, WAL for persistent server)
if (isVercel) {
  db.pragma('journal_mode = DELETE');
} else {
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
}
db.pragma('foreign_keys = ON');

export function checkpointDatabase() {
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch (e) {}
}

function runSafeMigrations() {
  // Ensure deleted_records tombstone table exists
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
  } catch (e: any) {
    console.warn('[Migration Notice] deleted_records table:', e.message);
  }

  // Ensure lead_ai_insights table exists
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS lead_ai_insights (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL UNIQUE,
        score INTEGER DEFAULT 75,
        conversion_probability TEXT DEFAULT 'MEDIUM',
        key_drivers TEXT,
        recommended_action TEXT,
        last_outreach_at TEXT,
        last_outreach_channel TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_lead_ai_insights_lead ON lead_ai_insights(lead_id);
    `);
  } catch (e: any) {
    console.warn('[Migration Notice] lead_ai_insights table:', e.message);
  }

  // Initialize AI Auto-Outreach & Sales settings
  try {
    const insertSettingIfNotExists = (key: string, value: string, description: string) => {
      const exists = db.prepare('SELECT key FROM settings WHERE key = ?').get(key);
      if (!exists) {
        db.prepare('INSERT INTO settings (key, value, description) VALUES (?, ?, ?)').run(key, value, description);
      }
    };
    insertSettingIfNotExists('ai_auto_whatsapp_enabled', 'true', 'Enable automatic AI WhatsApp outreach on new lead addition');
    insertSettingIfNotExists('ai_auto_email_enabled', 'true', 'Enable automatic AI Email outreach on new lead addition');
    insertSettingIfNotExists('ai_sales_tone', 'Empathetic & Highly Persuasive', 'Tone and style used by AI Sales Agent');
    insertSettingIfNotExists('ai_model', 'gemini-2.5-flash', 'AI Model for smart generative sales responses');
    insertSettingIfNotExists('ai_custom_instructions', '', 'Custom counseling rules and guidelines for AI');
  } catch (e: any) {}

  const addColumnIfNotExists = (table: string, column: string, columnDef: string) => {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      if (!cols.some(c => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef};`);
        console.log(`[Migration] Added column ${column} to ${table}`);
      }
    } catch (e: any) {
      console.warn(`[Migration Notice] Table ${table}.${column}:`, e.message);
    }
  };

  // Counselors fields
  addColumnIfNotExists('counselors', 'username', 'TEXT');
  addColumnIfNotExists('counselors', 'joining_date', 'TEXT');
  addColumnIfNotExists('counselors', 'status', "TEXT NOT NULL DEFAULT 'Active'");
  addColumnIfNotExists('counselors', 'role', "TEXT NOT NULL DEFAULT 'Counselor'");

  // Universities fields
  addColumnIfNotExists('universities', 'short_name', 'TEXT');
  addColumnIfNotExists('universities', 'description', 'TEXT');
  addColumnIfNotExists('universities', 'status', "TEXT NOT NULL DEFAULT 'Active'");

  // Courses fields
  addColumnIfNotExists('courses', 'short_name', 'TEXT');
  addColumnIfNotExists('courses', 'course_level', "TEXT NOT NULL DEFAULT 'UG'");
  addColumnIfNotExists('courses', 'stream', "TEXT NOT NULL DEFAULT 'Engineering'");
  addColumnIfNotExists('courses', 'entrance_requirement', 'TEXT');
  addColumnIfNotExists('courses', 'description', 'TEXT');
  addColumnIfNotExists('courses', 'status', "TEXT NOT NULL DEFAULT 'Active'");

  // Leads fields
  addColumnIfNotExists('leads', 'parent_name', 'TEXT');
  addColumnIfNotExists('leads', 'school_college', 'TEXT');
  addColumnIfNotExists('leads', 'passing_year', 'TEXT');
  addColumnIfNotExists('leads', 'priority', "TEXT NOT NULL DEFAULT 'MEDIUM'");

  // Google Sheets connections
  addColumnIfNotExists('google_sheets_connections', 'column_mapping', 'TEXT');

  // University Courses & Fees fields
  addColumnIfNotExists('university_courses', 'tuition_fee_per_year', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('university_courses', 'hostel_fee_per_year', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('university_courses', 'one_time_fee', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('university_courses', 'other_charges', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('university_courses', 'total_first_year_fee', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('university_courses', 'total_full_course_fee', 'REAL DEFAULT 0.0');
  addColumnIfNotExists('university_courses', 'currency', "TEXT DEFAULT 'INR'");
  addColumnIfNotExists('university_courses', 'eligibility_notes', 'TEXT');
  addColumnIfNotExists('university_courses', 'application_deadline', 'TEXT');
  addColumnIfNotExists('university_courses', 'admission_process', "TEXT DEFAULT 'Direct Merit / Counseling'");
  addColumnIfNotExists('university_courses', 'remarks', 'TEXT');
  addColumnIfNotExists('university_courses', 'is_active', 'INTEGER DEFAULT 1');

  // RBAC & Feature Permissions
  addColumnIfNotExists('users', 'permissions', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('roles', 'permissions', "TEXT DEFAULT '[]'");

  // Lead Distribution Counselor fields
  addColumnIfNotExists('counselors', 'specialization_courses', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('counselors', 'specialization_universities', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('counselors', 'daily_lead_quota', 'INTEGER DEFAULT 25');
  addColumnIfNotExists('counselors', 'leads_assigned_today', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('counselors', 'last_assigned_date', 'TEXT');

  // Staff Extended Information fields
  addColumnIfNotExists('counselors', 'designation', "TEXT DEFAULT 'Senior Counselor'");
  addColumnIfNotExists('counselors', 'department', "TEXT DEFAULT 'Counseling & Admissions'");
  addColumnIfNotExists('counselors', 'employee_code', 'TEXT');
  addColumnIfNotExists('counselors', 'alternate_phone', 'TEXT');
  addColumnIfNotExists('counselors', 'work_location', "TEXT DEFAULT 'Office'");
  addColumnIfNotExists('counselors', 'notes', 'TEXT');

  // Email Templates & Outreach fields
  addColumnIfNotExists('message_templates', 'target_courses', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('message_templates', 'target_universities', "TEXT DEFAULT '[]'");
  addColumnIfNotExists('message_templates', 'description', 'TEXT');

  // Bulk Email Campaigns Table
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
  } catch (e: any) {
    console.warn('[Migration Notice] bulk_email_campaigns table:', e.message);
  }
  addColumnIfNotExists('bulk_email_campaigns', 'channel', "TEXT NOT NULL DEFAULT 'Email'");
}

import { syncFromNeonToSQLite, isNeonEnabled } from './neon.ts';

// Initialize database schema
export function initDatabase() {
  try {
    db.exec(SCHEMA_SQL);
    runSafeMigrations();
    console.log('✅ Database schema initialized and migrated successfully');

    if (isNeonEnabled()) {
      syncFromNeonToSQLite(db).catch(err => {
        console.warn('[Neon Sync] Initial sync deferred:', err.message);
      });
    }

  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error);
    throw error;
  }
}

// Audit logger helper
export function logAudit(params: {
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    stmt.run(
      id,
      params.userId || 'system',
      params.userName || 'System',
      params.action,
      params.entity,
      params.entityId || null,
      params.oldValue ? (typeof params.oldValue === 'string' ? params.oldValue : JSON.stringify(params.oldValue)) : null,
      params.newValue ? (typeof params.newValue === 'string' ? params.newValue : JSON.stringify(params.newValue)) : null,
      params.ipAddress || '127.0.0.1'
    );
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
}

// Lead activity helper
export function logLeadActivity(params: {
  leadId: string;
  activityType: string;
  title: string;
  description: string;
  performedBy?: string;
  metadata?: any;
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const id = 'ACT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    stmt.run(
      id,
      params.leadId,
      params.activityType,
      params.title,
      params.description,
      params.performedBy || 'System',
      params.metadata ? JSON.stringify(params.metadata) : null
    );
  } catch (err) {
    console.error('Lead activity write failed:', err);
  }
}

// Notification helper
export function createNotification(params: {
  userId?: string;
  counselorId?: string;
  title: string;
  message: string;
  type: string;
  entityType?: string;
  entityId?: string;
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, counselor_id, title, message, type, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
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
    console.error('Notification write failed:', err);
  }
}

// Initialize on module load
initDatabase();
