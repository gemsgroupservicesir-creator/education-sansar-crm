import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SCHEMA_SQL } from './schema.ts';

// Resolve directory paths in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(dbDir, 'education_sansar.db');

export const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' && process.env.DB_VERBOSE === 'true' 
    ? console.log 
    : undefined
});

// Configure WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

function runSafeMigrations() {
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
}

// Initialize database schema
export function initDatabase() {
  try {
    db.exec(SCHEMA_SQL);
    runSafeMigrations();
    console.log('✅ Database schema initialized and migrated successfully');

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
