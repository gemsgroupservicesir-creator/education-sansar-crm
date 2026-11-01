import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required in .env');
  process.exit(1);
}

const sql = neon(connectionString);

async function migrate() {
  console.log('⚡ Ensuring HR and Finance tables exist in Neon PostgreSQL...');

  const ddl = [
    // 1. HR Employees
    `CREATE TABLE IF NOT EXISTS hr_employees (
      id TEXT PRIMARY KEY,
      employee_code TEXT UNIQUE NOT NULL,
      user_id TEXT,
      counselor_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'Counseling',
      designation TEXT NOT NULL DEFAULT 'Education Counselor',
      employment_type TEXT NOT NULL DEFAULT 'Full-Time',
      joining_date TEXT NOT NULL,
      monthly_salary NUMERIC NOT NULL DEFAULT 0.0,
      currency TEXT NOT NULL DEFAULT 'NPR',
      bank_name TEXT,
      account_number TEXT,
      pan_number TEXT,
      emergency_contact TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 2. HR Daily Attendance
    `CREATE TABLE IF NOT EXISTS hr_attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Present',
      check_in_time TEXT,
      check_out_time TEXT,
      work_mode TEXT NOT NULL DEFAULT 'Office',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_neon_emp_att_date ON hr_attendance(employee_id, date);`,

    // 3. HR Leaves
    `CREATE TABLE IF NOT EXISTS hr_leaves (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      leave_type TEXT NOT NULL DEFAULT 'Casual Leave',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days_count NUMERIC NOT NULL DEFAULT 1.0,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      approved_by TEXT,
      approval_remarks TEXT,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 4. HR Monthly Payroll
    `CREATE TABLE IF NOT EXISTS hr_payroll (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      month_year TEXT NOT NULL,
      base_salary NUMERIC NOT NULL DEFAULT 0.0,
      incentives_bonus NUMERIC NOT NULL DEFAULT 0.0,
      deductions NUMERIC NOT NULL DEFAULT 0.0,
      net_salary NUMERIC NOT NULL DEFAULT 0.0,
      currency TEXT NOT NULL DEFAULT 'NPR',
      payment_status TEXT NOT NULL DEFAULT 'Pending',
      payment_date TEXT,
      payment_method TEXT DEFAULT 'Bank Transfer',
      remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_neon_emp_pay_month ON hr_payroll(employee_id, month_year);`,

    // 5. Finance Transactions & General Ledger
    `CREATE TABLE IF NOT EXISTS finance_transactions (
      id TEXT PRIMARY KEY,
      transaction_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0.0,
      currency TEXT NOT NULL DEFAULT 'NPR',
      transaction_date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
      reference_number TEXT,
      student_id TEXT,
      student_name TEXT,
      university_id TEXT,
      university_name TEXT,
      status TEXT NOT NULL DEFAULT 'Completed',
      notes TEXT,
      recorded_by TEXT DEFAULT 'Super Admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 6. Finance Invoices
    `CREATE TABLE IF NOT EXISTS finance_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      invoice_type TEXT NOT NULL DEFAULT 'STUDENT_FEE',
      recipient_name TEXT NOT NULL,
      recipient_email TEXT,
      recipient_phone TEXT,
      total_amount NUMERIC NOT NULL DEFAULT 0.0,
      paid_amount NUMERIC NOT NULL DEFAULT 0.0,
      due_amount NUMERIC NOT NULL DEFAULT 0.0,
      currency TEXT NOT NULL DEFAULT 'NPR',
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      items TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      student_id TEXT,
      university_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`,

    // 7. Lead Routing Rules
    `CREATE TABLE IF NOT EXISTS lead_routing_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      course_keywords TEXT DEFAULT '[]',
      university_keywords TEXT DEFAULT '[]',
      target_cities TEXT DEFAULT '[]',
      counselor_id TEXT,
      counselor_name TEXT,
      priority INTEGER NOT NULL DEFAULT 0,
      max_daily_leads INTEGER NOT NULL DEFAULT 25,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`
  ];

  for (const q of ddl) {
    await sql.query(q);
  }

  console.log('✅ HR and Finance tables successfully established on Neon PostgreSQL!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
