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

// Initialize database schema
export function initDatabase() {
  try {
    db.exec(SCHEMA_SQL);
    console.log('✅ Database schema initialized successfully');

    // Ensure google_sheets_connections exists and has starter demo sheets
    try {
      const gsheetCount = (db.prepare('SELECT count(*) as count FROM google_sheets_connections').get() as { count: number })?.count || 0;
      if (gsheetCount === 0) {
        const insertGSheet = db.prepare(`
          INSERT INTO google_sheets_connections (
            id, name, sheet_url, spreadsheet_id, gid, sheet_name, campaign_tag, target_city, source_label, status, total_leads_imported, last_rows_count, is_demo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        insertGSheet.run(
          'gsheet-ktm-fair',
          'Kathmandu Education Fair 2026',
          'https://docs.google.com/spreadsheets/d/demo-sheet-kathmandu-fair-2026/edit?usp=sharing',
          'demo-sheet-kathmandu-fair-2026',
          '0',
          'Leads 2026',
          'Kathmandu Fair 2026',
          'Kathmandu',
          'Education Fair',
          'ACTIVE',
          4,
          4,
          1
        );
        insertGSheet.run(
          'gsheet-birgunj-walkin',
          'Birgunj & Janakpur Walk-ins',
          'https://docs.google.com/spreadsheets/d/demo-sheet-birgunj-walkins-2026/edit?usp=sharing',
          'demo-sheet-birgunj-walkins-2026',
          '0',
          'Inquiries',
          'Branch Inquiries',
          'Birgunj',
          'Branch Walk-in',
          'ACTIVE',
          0,
          4,
          1
        );
        insertGSheet.run(
          'gsheet-india-webinar',
          'Study in India 2026 Webinar',
          'https://docs.google.com/spreadsheets/d/demo-sheet-india-webinar-2026/edit?usp=sharing',
          'demo-sheet-india-webinar-2026',
          '0',
          'Registrations',
          'Study in India Webinar',
          'Delhi',
          'Webinar',
          'ACTIVE',
          0,
          4,
          1
        );
      }
    } catch (e) {
      console.warn('Google sheets table initialization warning:', e);
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
