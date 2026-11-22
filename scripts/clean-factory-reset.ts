import Database from 'better-sqlite3';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function performCleanReset() {
  console.log('🚀 Starting Clean Factory Reset (Preserving Super Admin, Counselors, Universities & Courses)...');

  // 1. Clean SQLite
  console.log('📦 Cleaning SQLite database (server/db/education_sansar.db)...');
  const db = new Database(path.join(process.cwd(), 'server/db/education_sansar.db'));

  const tablesToWipe = [
    'leads',
    'lead_activities',
    'lead_status_history',
    'lead_assignments',
    'followups',
    'students',
    'applications',
    'documents',
    'application_documents',
    'campaigns',
    'campaign_leads',
    'notifications',
    'messages',
    'hr_employees',
    'hr_attendance',
    'hr_leaves',
    'hr_payroll',
    'finance_transactions',
    'finance_invoices',
    'bulk_email_campaigns',
    'lead_ai_insights',
    'broadcast_campaigns',
    'broadcast_recipients',
    'lead_opt_outs',
    'whatsapp_sessions',
    'integration_logs',
    'deleted_records'
  ];

  db.transaction(() => {
    for (const table of tablesToWipe) {
      try {
        const result = db.prepare(`DELETE FROM ${table}`).run();
        console.log(`  ✓ Cleared SQLite table: ${table} (${result.changes} rows removed)`);
      } catch (err: any) {
        console.warn(`  ⚠️ Skip SQLite table ${table}:`, err.message);
      }
    }

    // Reset sqlite_sequence for wiped tables
    try {
      db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (${tablesToWipe.map(t => `'${t}'`).join(',')})`).run();
    } catch {}

    // Ensure Core Users & Counselors
    db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active)
      VALUES 
      ('u-super', 'System Administrator', 'admin@gemsgroupservices.com', 'admin123', 'Super Admin', '+977 9801234567', 1),
      ('u-prakash', 'Prakash Yadav', 'prakash.yadav@gemsgroupservices.com', 'mypassword123', 'Admin', '+977 9801234567', 1),
      ('u-reetdas', 'Reet Das', 'reetdas22636@gmail.com', 'Studyinindia@#2025', 'Super Admin', '+977 9801234567', 1)
    `).run();

    db.prepare(`
      INSERT OR REPLACE INTO counselors (
        id, user_id, name, username, email, phone, specialization_country, assigned_cities,
        max_capacity, is_active, status, role, designation, department, daily_lead_quota
      )
      VALUES
      ('c-prakash', 'u-prakash', 'Prakash Yadav', 'prakash.yadav', 'prakash.yadav@gemsgroupservices.com', '+977 9801234567', 'Nepal & India', '["Kathmandu", "Birgunj", "Pokhara"]', 100, 1, 'Active', 'Admin', 'Director of Admissions', 'Admissions', 25),
      ('c-reetdas', 'u-reetdas', 'Reet Das', 'reetdas22636', 'reetdas22636@gmail.com', '+977 9801234567', 'Nepal & India', '["Kathmandu", "Birgunj"]', 100, 1, 'Active', 'Super Admin', 'Senior Administrator', 'Admissions', 25)
    `).run();
  })();

  console.log('✅ SQLite database cleanly reset!');

  // 2. Clean Neon PostgreSQL
  if (process.env.DATABASE_URL) {
    console.log('☁️ Connecting to Neon PostgreSQL...');
    const sql = neon(process.env.DATABASE_URL);

    const neonTablesToWipe = [
      'leads',
      'lead_activities',
      'followups',
      'applications',
      'students',
      'documents',
      'messages',
      'integration_logs',
      'deleted_records',
      'hr_employees',
      'hr_attendance',
      'hr_leaves',
      'hr_payroll',
      'finance_transactions',
      'finance_invoices',
      'bulk_email_campaigns'
    ];

    for (const table of neonTablesToWipe) {
      try {
        await sql.query(`TRUNCATE TABLE ${table} CASCADE;`);
        console.log(`  ✓ Truncated Neon table: ${table}`);
      } catch (err: any) {
        console.warn(`  ⚠️ Skip Neon table ${table}:`, err.message);
      }
    }

    // Ensure Core Users & Counselors in Neon
    try {
      await sql`
        INSERT INTO users (id, name, email, password_hash, role, phone, is_active)
        VALUES 
        ('u-super', 'System Administrator', 'admin@gemsgroupservices.com', 'admin123', 'Super Admin', '+977 9801234567', 1),
        ('u-prakash', 'Prakash Yadav', 'prakash.yadav@gemsgroupservices.com', 'mypassword123', 'Admin', '+977 9801234567', 1),
        ('u-reetdas', 'Reet Das', 'reetdas22636@gmail.com', 'Studyinindia@#2025', 'Super Admin', '+977 9801234567', 1)
        ON CONFLICT (id) DO UPDATE SET is_active = 1;
      `;
      console.log('  ✓ Verified core users in Neon');

      await sql`
        INSERT INTO counselors (
          id, user_id, name, username, email, phone, specialization_country, assigned_cities,
          max_capacity, is_active, status, role, designation, department, daily_lead_quota
        )
        VALUES
        ('c-prakash', 'u-prakash', 'Prakash Yadav', 'prakash.yadav', 'prakash.yadav@gemsgroupservices.com', '+977 9801234567', 'Nepal & India', '["Kathmandu", "Birgunj", "Pokhara"]', 100, 1, 'Active', 'Admin', 'Director of Admissions', 'Admissions', 25),
        ('c-reetdas', 'u-reetdas', 'Reet Das', 'reetdas22636', 'reetdas22636@gmail.com', '+977 9801234567', 'Nepal & India', '["Kathmandu", "Birgunj"]', 100, 1, 'Active', 'Super Admin', 'Senior Administrator', 'Admissions', 25)
        ON CONFLICT (id) DO UPDATE SET is_active = 1, status = 'Active';
      `;
      console.log('  ✓ Verified counselors in Neon');
    } catch (e: any) {
      console.warn('  ⚠️ User/counselor sync note:', e.message);
    }

    console.log('✅ Neon PostgreSQL cleanly reset!');
  }

  // 3. VACUUM SQLite
  try {
    db.prepare('VACUUM').run();
    console.log('🧹 SQLite VACUUM completed');
  } catch {}

  console.log('🎉 Clean Factory Reset fully completed successfully!');
}

performCleanReset().catch((err) => {
  console.error('Fatal reset error:', err);
  process.exit(1);
});
