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
    }
    catch (error) {
        console.error('❌ Failed to initialize database schema:', error);
        throw error;
    }
}
// Audit logger helper
export function logAudit(params) {
    try {
        const stmt = db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, entity, entity_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const id = 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        stmt.run(id, params.userId || 'system', params.userName || 'System', params.action, params.entity, params.entityId || null, params.oldValue ? (typeof params.oldValue === 'string' ? params.oldValue : JSON.stringify(params.oldValue)) : null, params.newValue ? (typeof params.newValue === 'string' ? params.newValue : JSON.stringify(params.newValue)) : null, params.ipAddress || '127.0.0.1');
    }
    catch (err) {
        console.error('Audit log write failed:', err);
    }
}
// Lead activity helper
export function logLeadActivity(params) {
    try {
        const stmt = db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const id = 'ACT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        stmt.run(id, params.leadId, params.activityType, params.title, params.description, params.performedBy || 'System', params.metadata ? JSON.stringify(params.metadata) : null);
    }
    catch (err) {
        console.error('Lead activity write failed:', err);
    }
}
// Notification helper
export function createNotification(params) {
    try {
        const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, counselor_id, title, message, type, entity_type, entity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const id = 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        stmt.run(id, params.userId || null, params.counselorId || null, params.title, params.message, params.type, params.entityType || null, params.entityId || null);
    }
    catch (err) {
        console.error('Notification write failed:', err);
    }
}
// Initialize on module load
initDatabase();
