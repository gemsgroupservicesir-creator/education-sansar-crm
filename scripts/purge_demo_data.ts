import { neon } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required in .env');
  process.exit(1);
}

const sql = neon(connectionString);
const db = new Database('server/db/education_sansar.db');

const DEMO_COUNSELOR_IDS = ['c-counselor-1', 'c-counselor-2', 'c-marketing-1', 'c-finance-1'];
const DEMO_USER_IDS = ['u-counselor-1', 'u-counselor-2', 'u-marketing-1', 'u-finance-1'];
const DEMO_EMAILS = [
  'counselor@gemsgroupservices.com',
  'medical@gemsgroupservices.com',
  'marketing@gemsgroupservices.com',
  'finance@gemsgroupservices.com',
  'counselor@educationsansar.com',
  'medical@educationsansar.com',
  'marketing@educationsansar.com',
  'finance@educationsansar.com'
];
const DEMO_EMP_IDS = ['emp-1', 'emp-2', 'emp-3', 'emp-4'];
const DEMO_TX_IDS = ['tx-1', 'tx-2', 'tx-3', 'tx-4'];
const DEMO_RULE_IDS = ['rule-eng', 'rule-med'];

async function purge() {
  console.log('🧹 [Purge] Starting complete demo data removal across SQLite and Neon...');

  // ==========================================
  // 1. PURGE FROM LOCAL SQLITE
  // ==========================================
  console.log('--- Purging Local SQLite Database ---');

  const purgeTx = db.transaction(() => {
    // A. Reassign any leads pointing to demo counselors
    const reassignLeads = db.prepare(`
      UPDATE leads 
      SET assigned_counselor_id = NULL, assigned_counselor_name = 'Unassigned', updated_at = datetime('now')
      WHERE assigned_counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')})
    `);
    const reassignRes = reassignLeads.run(...DEMO_COUNSELOR_IDS);
    console.log(`[SQLite] Reassigned ${reassignRes.changes} leads to Unassigned.`);

    // B. Clean referencing tables pointing to demo counselors
    db.prepare(`UPDATE applications SET counselor_id = NULL, counselor_name = NULL WHERE counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')})`).run(...DEMO_COUNSELOR_IDS);
    db.prepare(`UPDATE followups SET counselor_id = NULL WHERE counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')})`).run(...DEMO_COUNSELOR_IDS);
    db.prepare(`UPDATE students SET counselor_id = NULL, counselor_name = NULL WHERE counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')})`).run(...DEMO_COUNSELOR_IDS);
    db.prepare(`DELETE FROM lead_assignments WHERE new_counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')}) OR previous_counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')})`).run(...DEMO_COUNSELOR_IDS, ...DEMO_COUNSELOR_IDS);
    db.prepare(`DELETE FROM notifications WHERE counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')})`).run(...DEMO_COUNSELOR_IDS);

    // C. Delete demo lead routing rules
    const delRules = db.prepare(`DELETE FROM lead_routing_rules WHERE id IN (${DEMO_RULE_IDS.map(() => '?').join(',')}) OR counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')})`).run(...DEMO_RULE_IDS, ...DEMO_COUNSELOR_IDS);
    console.log(`[SQLite] Deleted ${delRules.changes} demo routing rules.`);

    // D. Delete demo HR attendance, leaves, payroll, employees
    db.prepare(`DELETE FROM hr_attendance WHERE employee_id IN (${DEMO_EMP_IDS.map(() => '?').join(',')})`).run(...DEMO_EMP_IDS);
    db.prepare(`DELETE FROM hr_leaves WHERE employee_id IN (${DEMO_EMP_IDS.map(() => '?').join(',')})`).run(...DEMO_EMP_IDS);
    db.prepare(`DELETE FROM hr_payroll WHERE employee_id IN (${DEMO_EMP_IDS.map(() => '?').join(',')})`).run(...DEMO_EMP_IDS);
    const delEmps = db.prepare(`DELETE FROM hr_employees WHERE id IN (${DEMO_EMP_IDS.map(() => '?').join(',')}) OR counselor_id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')}) OR user_id IN (${DEMO_USER_IDS.map(() => '?').join(',')})`).run(...DEMO_EMP_IDS, ...DEMO_COUNSELOR_IDS, ...DEMO_USER_IDS);
    console.log(`[SQLite] Deleted ${delEmps.changes} demo HR employees.`);

    // E. Delete demo Finance transactions
    const delTx = db.prepare(`DELETE FROM finance_transactions WHERE id IN (${DEMO_TX_IDS.map(() => '?').join(',')})`).run(...DEMO_TX_IDS);
    console.log(`[SQLite] Deleted ${delTx.changes} demo finance transactions.`);

    // F. Delete demo Counselors
    const delCounselors = db.prepare(`DELETE FROM counselors WHERE id IN (${DEMO_COUNSELOR_IDS.map(() => '?').join(',')}) OR email IN (${DEMO_EMAILS.map(() => '?').join(',')})`).run(...DEMO_COUNSELOR_IDS, ...DEMO_EMAILS);
    console.log(`[SQLite] Deleted ${delCounselors.changes} demo counselors.`);

    // G. Delete demo Users (preserve u-super and real users)
    const delUsers = db.prepare(`DELETE FROM users WHERE id IN (${DEMO_USER_IDS.map(() => '?').join(',')}) OR email IN (${DEMO_EMAILS.map(() => '?').join(',')})`).run(...DEMO_USER_IDS, ...DEMO_EMAILS);
    console.log(`[SQLite] Deleted ${delUsers.changes} demo users.`);

    // H. Insert Tombstones for all purged IDs
    const insertTombstone = db.prepare(`
      INSERT OR IGNORE INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
      VALUES (?, ?, ?, ?, ?, 'System Purge', datetime('now'))
    `);

    for (const cid of DEMO_COUNSELOR_IDS) {
      insertTombstone.run(`DEL-COUNSELOR-${cid}`, 'counselor', cid, cid, 'Demo counselor purged');
    }
    for (const uid of DEMO_USER_IDS) {
      insertTombstone.run(`DEL-USER-${uid}`, 'user', uid, uid, 'Demo user purged');
    }
    for (const email of DEMO_EMAILS) {
      insertTombstone.run(`DEL-EMAIL-${email}`, 'user_email', email, email, 'Demo staff email purged');
    }
    for (const eid of DEMO_EMP_IDS) {
      insertTombstone.run(`DEL-EMP-${eid}`, 'hr_employee', eid, eid, 'Demo employee purged');
    }
    for (const tx of DEMO_TX_IDS) {
      insertTombstone.run(`DEL-TX-${tx}`, 'finance_transaction', tx, tx, 'Demo transaction purged');
    }
  });

  purgeTx();
  console.log('✅ Local SQLite purge finished!');

  // ==========================================
  // 2. PURGE FROM NEON POSTGRESQL
  // ==========================================
  console.log('\n--- Purging Remote Neon PostgreSQL Database ---');

  // A. Reassign any leads pointing to demo counselors
  await sql.query(`
    UPDATE leads 
    SET assigned_counselor_id = NULL, assigned_counselor_name = 'Unassigned', updated_at = NOW()
    WHERE assigned_counselor_id = ANY($1)
  `, [DEMO_COUNSELOR_IDS]);
  console.log('[Neon] Reassigned leads referencing demo counselors to Unassigned.');

  // B. Clean applications and followups in Neon (if counselor_id column exists)
  try {
    await sql.query(`UPDATE applications SET counselor_id = NULL WHERE counselor_id = ANY($1)`, [DEMO_COUNSELOR_IDS]);
  } catch (e: any) {}
  try {
    await sql.query(`UPDATE followups SET counselor_id = NULL WHERE counselor_id = ANY($1)`, [DEMO_COUNSELOR_IDS]);
  } catch (e: any) {}

  // C. Delete demo lead routing rules in Neon
  await sql.query(`DELETE FROM lead_routing_rules WHERE id = ANY($1) OR counselor_id = ANY($2)`, [DEMO_RULE_IDS, DEMO_COUNSELOR_IDS]);
  console.log('[Neon] Deleted demo lead routing rules.');

  // D. Delete demo HR employees, attendance, leaves, payroll in Neon
  await sql.query(`DELETE FROM hr_attendance WHERE employee_id = ANY($1)`, [DEMO_EMP_IDS]);
  await sql.query(`DELETE FROM hr_leaves WHERE employee_id = ANY($1)`, [DEMO_EMP_IDS]);
  await sql.query(`DELETE FROM hr_payroll WHERE employee_id = ANY($1)`, [DEMO_EMP_IDS]);
  await sql.query(`DELETE FROM hr_employees WHERE id = ANY($1) OR counselor_id = ANY($2) OR user_id = ANY($3)`, [DEMO_EMP_IDS, DEMO_COUNSELOR_IDS, DEMO_USER_IDS]);
  console.log('[Neon] Deleted demo HR employees and records.');

  // E. Delete demo Finance transactions in Neon
  await sql.query(`DELETE FROM finance_transactions WHERE id = ANY($1)`, [DEMO_TX_IDS]);
  console.log('[Neon] Deleted demo finance transactions.');

  // F. Delete demo counselors in Neon
  await sql.query(`DELETE FROM counselors WHERE id = ANY($1) OR LOWER(email) = ANY($2)`, [DEMO_COUNSELOR_IDS, DEMO_EMAILS.map(e => e.toLowerCase())]);
  console.log('[Neon] Deleted demo counselors.');

  // G. Delete demo users in Neon
  await sql.query(`DELETE FROM users WHERE id = ANY($1) OR LOWER(email) = ANY($2)`, [DEMO_USER_IDS, DEMO_EMAILS.map(e => e.toLowerCase())]);
  console.log('[Neon] Deleted demo users.');

  // H. Update real admin emails to @gemsgroupservices.com in Neon
  await sql.query(`UPDATE users SET email = 'admin@gemsgroupservices.com', updated_at = NOW() WHERE email = 'admin@educationsansar.com'`);
  await sql.query(`UPDATE users SET email = 'prakash.yadav@gemsgroupservices.com', updated_at = NOW() WHERE email = 'prakash.yadav@educationsansar.com'`);
  console.log('[Neon] Updated real admin accounts to @gemsgroupservices.com.');

  // I. Insert Tombstones into Neon deleted_records
  const allTombstones = [
    ...DEMO_COUNSELOR_IDS.map(cid => ({ id: `DEL-COUNSELOR-${cid}`, entity_type: 'counselor', entity_id: cid, identifier: cid })),
    ...DEMO_USER_IDS.map(uid => ({ id: `DEL-USER-${uid}`, entity_type: 'user', entity_id: uid, identifier: uid })),
    ...DEMO_EMAILS.map(email => ({ id: `DEL-EMAIL-${email}`, entity_type: 'user_email', entity_id: email, identifier: email })),
    ...DEMO_EMP_IDS.map(eid => ({ id: `DEL-EMP-${eid}`, entity_type: 'hr_employee', entity_id: eid, identifier: eid })),
    ...DEMO_TX_IDS.map(tx => ({ id: `DEL-TX-${tx}`, entity_type: 'finance_transaction', entity_id: tx, identifier: tx }))
  ];

  for (const t of allTombstones) {
    await sql.query(`
      INSERT INTO deleted_records (id, entity_type, entity_id, identifier, details, deleted_by, deleted_at)
      VALUES ($1, $2, $3, $4, 'Demo record purged', 'System Purge', NOW())
      ON CONFLICT (id) DO NOTHING
    `, [t.id, t.entity_type, t.entity_id, t.identifier]);
  }
  console.log(`[Neon] Saved ${allTombstones.length} tombstone records to prevent any recreation.`);

  console.log('\n🎉 ALL DEMO DATA PERMANENTLY REMOVED ACROSS SQLITE AND NEON POSTGRESQL!');

  // Verify remaining records
  console.log('\n=== Final SQLite Record Counts ===');
  console.log('Counselors:', db.prepare('SELECT count(*) as c FROM counselors').get().c);
  console.log('Users:', db.prepare('SELECT count(*) as c FROM users').get().c);
  console.log('HR Employees:', db.prepare('SELECT count(*) as c FROM hr_employees').get().c);
  console.log('Finance Transactions:', db.prepare('SELECT count(*) as c FROM finance_transactions').get().c);

  console.log('\n=== Final Neon Record Counts ===');
  console.log('Counselors:', (await sql`SELECT count(*) as c FROM counselors`)[0].c);
  console.log('Users:', (await sql`SELECT count(*) as c FROM users`)[0].c);
  console.log('HR Employees:', (await sql`SELECT count(*) as c FROM hr_employees`)[0].c);
  console.log('Finance Transactions:', (await sql`SELECT count(*) as c FROM finance_transactions`)[0].c);
}

purge().catch(err => {
  console.error('Purge failed:', err);
  process.exit(1);
});
