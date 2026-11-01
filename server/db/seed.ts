import { db, initDatabase, logAudit } from './database.ts';

export function seedDatabase() {
  console.log('🌱 Initializing clean Gems Group Services CRM database schema & Super Admin...');

  const runTx = db.transaction(() => {
    // 1. Roles
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)');
    const roles = [
      ['role-1', 'Super Admin', 'Full system access, administration, integrations and configuration'],
      ['role-2', 'Admin', 'Lead distribution, counselor supervision, reports, pipeline oversight'],
      ['role-3', 'Counselor', 'Assigned student counselling, notes, applications, document collection'],
      ['role-4', 'Telecaller', 'Calling leads, logging WhatsApp outreach, follow-up scheduling'],
      ['role-5', 'Marketing Manager', 'Campaigns, sources, ROI analytics, Meta lead ads sync'],
      ['role-6', 'Management', 'Executive reporting, counselor KPIs, admission revenue oversight'],
      ['role-7', 'Accountant', 'Student fee invoicing, university commissions, payment reconciliations, general ledger'],
      ['role-8', 'HR Manager', 'Employee directory, daily attendance register, leaves approval, payroll management']
    ];
    for (const r of roles) insertRole.run(r[0], r[1], r[2]);

    // 2. Initial Super Admin Account
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      'u-super',
      'System Administrator',
      'admin@gemsgroupservices.com',
      'admin123',
      'Super Admin',
      '+977 9801234567',
      1
    );

    // 3. Message Templates (WhatsApp & Email standard outreach templates)
    const insertTemplate = db.prepare(`
      INSERT OR REPLACE INTO message_templates (id, name, channel, category, subject, content, variables, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const templates = [
      [
        'tmpl-1', 'Lead Welcome & Introduction', 'WhatsApp', 'WELCOME', null,
        'Namaste {{student_name}}! Welcome to Gems Group Services. We have received your inquiry for {{preferred_course}} at {{preferred_university}}. Your dedicated counselor is {{counselor_name}} (Phone: {{counselor_phone}}). We look forward to guiding you through admissions and scholarships!',
        '["student_name", "preferred_course", "preferred_university", "counselor_name", "counselor_phone"]', 1
      ],
      [
        'tmpl-2', 'Counselor Personal Introduction', 'WhatsApp', 'COUNSELOR_INTRO', null,
        'Hello {{student_name}}, this is {{counselor_name}} from Gems Group Services. I will be your official admission advisor for {{preferred_university}}. Are you free for a 10-minute briefing today at {{follow_up_time}}?',
        '["student_name", "counselor_name", "preferred_university", "follow_up_time"]', 1
      ],
      [
        'tmpl-3', 'Follow-up Call Reminder', 'WhatsApp', 'FOLLOWUP_REMINDER', null,
        'Dear {{student_name}}, reminding you about our scheduled counselling session today regarding your application to {{preferred_university}}. Looking forward to speaking with you!',
        '["student_name", "preferred_university"]', 1
      ],
      [
        'tmpl-4', 'Document Submission Pending', 'WhatsApp', 'DOCUMENT_REMINDER', null,
        'Dear {{student_name}}, your admission application for {{preferred_course}} is waiting for pending documents (10th/12th marksheets & Citizenship/Aadhaar). Please upload or send them to your counselor {{counselor_name}} before the deadline.',
        '["student_name", "preferred_course", "counselor_name"]', 1
      ],
      [
        'tmpl-5', 'Admission Fee Payment Reminder', 'WhatsApp', 'FEE_REMINDER', null,
        'Congratulations {{student_name}}! Your provisional admission offer from {{preferred_university}} is confirmed. Please complete the seat confirmation fee before {{deadline}} to secure your seat.',
        '["student_name", "preferred_university", "deadline"]', 1
      ],
      [
        'tmpl-6', 'Admission Confirmed Welcome', 'WhatsApp', 'ADMISSION_CONFIRMATION', null,
        'Hearty Congratulations {{student_name}}! Your admission to {{preferred_course}} at {{preferred_university}} is formally confirmed. Welcome to the Gems Group Services family. Your Student ID is {{student_id}}.',
        '["student_name", "preferred_course", "preferred_university", "student_id"]', 1
      ]
    ];
    for (const t of templates) {
      insertTemplate.run(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7]);
    }

    // 4. Integrations
    const insertIntegration = db.prepare(`
      INSERT OR REPLACE INTO integrations (id, name, is_enabled, status, config, last_sync_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertIntegration.run(
      'int-meta', 'Meta Lead Ads', 0, 'NOT CONNECTED',
      JSON.stringify({ webhookUrl: '/api/integrations/meta/webhook', verifyToken: 'gems_group_services_meta_verify_token_2026', pageId: '', appId: '' }),
      null
    );
    insertIntegration.run(
      'int-wa', 'WhatsApp Business API', 0, 'NOT CONNECTED',
      JSON.stringify({ phoneNumberId: '', wabaId: '', defaultSender: 'Gems Group Services' }),
      null
    );
    insertIntegration.run(
      'int-email', 'Transactional Email (Resend/SendGrid)', 0, 'NOT CONNECTED',
      JSON.stringify({ fromEmail: 'admissions@gemsgroupservices.com' }),
      null
    );
    insertIntegration.run(
      'int-sheets', 'Google Sheets Sync', 0, 'NOT CONNECTED',
      JSON.stringify({
        spreadsheetUrl: '',
        spreadsheetId: '',
        sheetName: 'Leads 2026',
        syncDirection: 'TWO_WAY',
        autoExportNewLeads: false,
        autoImportOnWebhook: true
      }),
      null
    );

    // 5. System Settings
    const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value, description) VALUES (?, ?, ?)');
    insertSetting.run('company_name', 'Gems Group Services', 'Official company legal name');
    insertSetting.run('company_address', 'Sector 94, Noida, Uttar Pradesh 201313', 'Main office address');
    insertSetting.run('company_phone', '+91 98100 12345 / +977 98012 34567', 'Official hotline phone');
    insertSetting.run('company_email', 'admissions@gemsgroupservices.com', 'Official admissions email');
    insertSetting.run('assignment_mode', 'Round Robin', 'Current lead assignment strategy: Round Robin, City Based, University Based, Course Based, Manual');
    insertSetting.run('round_robin_pointer', '0', 'Index pointer for round-robin counselor distribution');
    insertSetting.run('duplicate_check_strictness', 'Strict', 'Duplicate detection rules (Phone, WhatsApp, Email, FB Lead ID)');
    insertSetting.run('auto_create_first_followup', 'true', 'Automatically schedule 24-hr follow-up on new lead creation');
    insertSetting.run('auto_convert_student_on_confirm', 'true', 'Automatically generate student record when lead status hits Admission Confirmed');

    // 6. Initial Counselors & Staff (if table is empty)
    const counselorCount = (db.prepare('SELECT count(*) as count FROM counselors').get() as { count: number }).count;
    if (counselorCount === 0) {
      const insertUser = db.prepare(`
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

      // Staff 1: Suman Sharma (Engineering & Tech Specialist)
      insertUser.run(
        'u-counselor-1', 'Suman Sharma', 'counselor@gemsgroupservices.com', 'counselor123', 'Counselor', '+977 9801122334',
        JSON.stringify(['dashboard', 'leads_view', 'leads_create', 'leads_edit', 'pipeline', 'applications', 'students', 'universities', 'documents'])
      );
      insertCounselor.run(
        'c-counselor-1', 'u-counselor-1', 'Suman Sharma', 'suman', 'counselor@gemsgroupservices.com', '+977 9801122334',
        'Counselor', 'Nepal & North India', JSON.stringify(['Kathmandu', 'Pokhara', 'Janakpur']),
        100, '2025-01-15', JSON.stringify(['B.Tech', 'BE', 'BCA', 'Computer Science', 'Data Science', 'IT']),
        JSON.stringify(['Sharda University', 'Chandigarh University', 'Parul University']), 25
      );

      // Staff 2: Dr. Anjali Thapa (Medical & Health Sciences Advisor)
      insertUser.run(
        'u-counselor-2', 'Dr. Anjali Thapa', 'medical@gemsgroupservices.com', 'counselor123', 'Counselor', '+977 9812233445',
        JSON.stringify(['dashboard', 'leads_view', 'leads_create', 'leads_edit', 'pipeline', 'applications', 'students', 'universities', 'documents'])
      );
      insertCounselor.run(
        'c-counselor-2', 'u-counselor-2', 'Dr. Anjali Thapa', 'anjali', 'medical@gemsgroupservices.com', '+977 9812233445',
        'Counselor', 'Nepal & Bangladesh', JSON.stringify(['Kathmandu', 'Biratnagar', 'Dharan']),
        80, '2025-02-01', JSON.stringify(['MBBS', 'BDS', 'B.Sc Nursing', 'Pharmacy', 'BAMS', 'MD']),
        JSON.stringify(['Parul University', 'Graphic Era University', 'Sharda University']), 20
      );

      // Staff 3: Rajesh Verma (Marketing Lead)
      insertUser.run(
        'u-marketing-1', 'Rajesh Verma', 'marketing@gemsgroupservices.com', 'marketing123', 'Marketing Manager', '+977 9823344556',
        JSON.stringify(['dashboard', 'leads_view', 'leads_create', 'campaigns', 'reports', 'integrations'])
      );
      insertCounselor.run(
        'c-marketing-1', 'u-marketing-1', 'Rajesh Verma', 'rajesh', 'marketing@gemsgroupservices.com', '+977 9823344556',
        'Marketing Manager', 'Digital & Field Campaigns', JSON.stringify(['Kathmandu', 'Chitwan']),
        50, '2025-01-10', '[]', '[]', 10
      );

      // Staff 4: Pooja Karki (Accounts & Finance Specialist)
      insertUser.run(
        'u-finance-1', 'Pooja Karki', 'finance@gemsgroupservices.com', 'finance123', 'Accountant', '+977 9834455667',
        JSON.stringify(['dashboard', 'students', 'finance_management', 'hr_management', 'reports'])
      );
      insertCounselor.run(
        'c-finance-1', 'u-finance-1', 'Pooja Karki', 'pooja', 'finance@gemsgroupservices.com', '+977 9834455667',
        'Accountant', 'General Accounts', '[]',
        30, '2025-01-20', '[]', '[]', 10
      );

      // 7. Seed Lead Routing Rules
      const insertRule = db.prepare(`
        INSERT OR REPLACE INTO lead_routing_rules (
          id, name, course_keywords, university_keywords, target_cities,
          counselor_id, counselor_name, priority, max_daily_leads, is_active, description
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertRule.run(
        'rule-eng', 'Engineering & Technology Lead Routing',
        JSON.stringify(['B.Tech', 'BE', 'BCA', 'Computer Science', 'Software', 'AI', 'Robotics']),
        JSON.stringify(['Sharda', 'Chandigarh', 'Parul']),
        JSON.stringify(['Kathmandu', 'Pokhara', 'Janakpur']),
        'c-counselor-1', 'Suman Sharma', 10, 25, 1,
        'Directs all high-value engineering, BCA, and computer science aspirants to Suman Sharma'
      );
      insertRule.run(
        'rule-med', 'Medical & Healthcare Admissions Routing',
        JSON.stringify(['MBBS', 'BDS', 'Nursing', 'B.Sc Nursing', 'Pharmacy', 'BAMS']),
        JSON.stringify(['Parul', 'Graphic Era', 'Sharda']),
        JSON.stringify(['Kathmandu', 'Biratnagar', 'Dharan']),
        'c-counselor-2', 'Dr. Anjali Thapa', 10, 20, 1,
        'Routes all medical, nursing, and dental applicants to Dr. Anjali Thapa'
      );

      // 8. Seed HR Employee Directory
      const insertEmp = db.prepare(`
        INSERT OR REPLACE INTO hr_employees (
          id, employee_code, user_id, counselor_id, full_name, email, phone,
          department, designation, employment_type, joining_date, monthly_salary, currency,
          bank_name, account_number, pan_number, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertEmp.run(
        'emp-1', 'EMP-1001', 'u-counselor-1', 'c-counselor-1', 'Suman Sharma', 'counselor@gemsgroupservices.com', '+977 9801122334',
        'Counseling', 'Senior Admission Counselor', 'Full-time', '2025-01-15', 55000, 'NPR',
        'Nabil Bank Ltd', '01200175001234', 'PAN-987654321', 'Active'
      );
      insertEmp.run(
        'emp-2', 'EMP-1002', 'u-counselor-2', 'c-counselor-2', 'Dr. Anjali Thapa', 'medical@gemsgroupservices.com', '+977 9812233445',
        'Counseling', 'Medical Admissions Advisor', 'Full-time', '2025-02-01', 65000, 'NPR',
        'Global IME Bank', '2901010004567', 'PAN-876543210', 'Active'
      );
      insertEmp.run(
        'emp-3', 'EMP-1003', 'u-marketing-1', 'c-marketing-1', 'Rajesh Verma', 'marketing@gemsgroupservices.com', '+977 9823344556',
        'Marketing', 'Marketing Manager', 'Full-time', '2025-01-10', 60000, 'NPR',
        'NIC Asia Bank', '1092003847291', 'PAN-765432109', 'Active'
      );
      insertEmp.run(
        'emp-4', 'EMP-1004', 'u-finance-1', 'c-finance-1', 'Pooja Karki', 'finance@gemsgroupservices.com', '+977 9834455667',
        'Finance & Accounts', 'Accounts Officer', 'Full-time', '2025-01-20', 48000, 'NPR',
        'Siddhartha Bank', '003150098234', 'PAN-654321098', 'Active'
      );

      // Seed Attendance for Today
      const todayStr = new Date().toISOString().split('T')[0];
      const insertAtt = db.prepare(`
        INSERT OR IGNORE INTO hr_attendance (id, employee_id, date, status, check_in_time, check_out_time, work_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertAtt.run('att-1', 'emp-1', todayStr, 'Present', '09:45 AM', '06:15 PM', 'Office');
      insertAtt.run('att-2', 'emp-2', todayStr, 'Present', '09:30 AM', '06:00 PM', 'Office');
      insertAtt.run('att-3', 'emp-3', todayStr, 'Present', '10:00 AM', '06:30 PM', 'Field Work');
      insertAtt.run('att-4', 'emp-4', todayStr, 'Present', '09:15 AM', '05:45 PM', 'Office');

      // 9. Seed Finance Transactions & Sample Invoice
      const insertTx = db.prepare(`
        INSERT OR REPLACE INTO finance_transactions (
          id, transaction_id, type, category, title, amount, currency, transaction_date,
          payment_method, reference_number, status, recorded_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertTx.run(
        'tx-1', 'TXN-2026-0001', 'INCOME', 'University Commission',
        'Quarterly admission commission payout from Sharda University for B.Tech batch',
        185000, 'INR', '2026-10-15', 'Bank Transfer', 'UTR-SHARDA-99812', 'Completed', 'System'
      );
      insertTx.run(
        'tx-2', 'TXN-2026-0002', 'INCOME', 'Student Fee',
        'Counseling registration and university document processing fee',
        25000, 'NPR', '2026-10-20', 'eSewa', 'ESEWA-883192', 'Completed', 'Pooja Karki'
      );
      insertTx.run(
        'tx-3', 'TXN-2026-0003', 'EXPENSE', 'Digital Ads (Meta/Google)',
        'Meta Lead Ads and Google Search ad campaign for Kathmandu & Pokhara students',
        35000, 'INR', '2026-10-18', 'Bank Transfer', 'META-ADS-INV-7721', 'Completed', 'Rajesh Verma'
      );
      insertTx.run(
        'tx-4', 'TXN-2026-0004', 'EXPENSE', 'Office Rent',
        'Gems Group Services head office monthly rental and high-speed internet',
        40000, 'NPR', '2026-10-01', 'Bank Transfer', 'RENT-OCT-2026', 'Completed', 'Pooja Karki'
      );
    }

    // Audit log for clean init
    logAudit({
      userId: 'u-super',
      userName: 'System Administrator',
      action: 'SYSTEM_INIT',
      entity: 'SYSTEM',
      entityId: 'system',
      newValue: 'Clean production schema initialized with Super Admin account and core staff structure'
    });
  });

  runTx();
  console.log('✅ Clean production database initialization complete! Super Admin, Counselors, and Rules initialized.');
}

export function ensureUniversityCoursesSeed() {
  // Production mode: no hardcoded demo university courses
}

// If run directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  initDatabase();
  seedDatabase();
}
