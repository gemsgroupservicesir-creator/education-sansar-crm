import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('No DATABASE_URL configured');
    return;
  }

  const sql = neon(dbUrl);
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bulk_email_campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        template_id TEXT,
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
        channel TEXT NOT NULL DEFAULT 'Email',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Try adding channel column if table already existed without it
    await sql`
      ALTER TABLE bulk_email_campaigns ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'Email'
    `;
    console.log('Successfully ensured channel column on bulk_email_campaigns in Neon!');
  } catch (err: any) {
    console.error('Neon migration error:', err.message);
  }
}

main();
