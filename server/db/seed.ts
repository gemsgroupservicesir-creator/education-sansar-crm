import { db, initDatabase, logAudit } from './database.ts';

export function seedDatabase() {
  console.log('🌱 Initializing clean Education Sansar CRM database schema & Super Admin...');

  const runTx = db.transaction(() => {
    // 1. Roles
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)');
    const roles = [
      ['role-1', 'Super Admin', 'Full system access, administration, integrations and configuration'],
      ['role-2', 'Admin', 'Lead distribution, counselor supervision, reports, pipeline oversight'],
      ['role-3', 'Counselor', 'Assigned student counselling, notes, applications, document collection'],
      ['role-4', 'Telecaller', 'Calling leads, logging WhatsApp outreach, follow-up scheduling'],
      ['role-5', 'Marketing Manager', 'Campaigns, sources, ROI analytics, Meta lead ads sync'],
      ['role-6', 'Management', 'Executive reporting, counselor KPIs, admission revenue oversight']
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
      'admin@educationsansar.com',
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
        'Namaste {{student_name}}! Welcome to Education Sansar. We have received your inquiry for {{preferred_course}} at {{preferred_university}}. Your dedicated counselor is {{counselor_name}} (Phone: {{counselor_phone}}). We look forward to guiding you through admissions and scholarships!',
        '["student_name", "preferred_course", "preferred_university", "counselor_name", "counselor_phone"]', 1
      ],
      [
        'tmpl-2', 'Counselor Personal Introduction', 'WhatsApp', 'COUNSELOR_INTRO', null,
        'Hello {{student_name}}, this is {{counselor_name}} from Education Sansar. I will be your official admission advisor for {{preferred_university}}. Are you free for a 10-minute briefing today at {{follow_up_time}}?',
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
        'Hearty Congratulations {{student_name}}! Your admission to {{preferred_course}} at {{preferred_university}} is formally confirmed. Welcome to the Education Sansar family. Your Student ID is {{student_id}}.',
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
      JSON.stringify({ webhookUrl: '/api/integrations/meta/webhook', verifyToken: 'education_sansar_meta_verify_token_2026', pageId: '', appId: '' }),
      null
    );
    insertIntegration.run(
      'int-wa', 'WhatsApp Business API', 0, 'NOT CONNECTED',
      JSON.stringify({ phoneNumberId: '', wabaId: '', defaultSender: 'Education Sansar' }),
      null
    );
    insertIntegration.run(
      'int-email', 'Transactional Email (Resend/SendGrid)', 0, 'NOT CONNECTED',
      JSON.stringify({ fromEmail: 'admissions@educationsansar.com' }),
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
    insertSetting.run('company_name', 'Education Sansar', 'Official company legal name');
    insertSetting.run('company_address', 'Sector 94, Noida, Uttar Pradesh 201313', 'Main office address');
    insertSetting.run('company_phone', '+91 98100 12345 / +977 98012 34567', 'Official hotline phone');
    insertSetting.run('company_email', 'admissions@educationsansar.com', 'Official admissions email');
    insertSetting.run('assignment_mode', 'Round Robin', 'Current lead assignment strategy: Round Robin, City Based, University Based, Course Based, Manual');
    insertSetting.run('round_robin_pointer', '0', 'Index pointer for round-robin counselor distribution');
    insertSetting.run('duplicate_check_strictness', 'Strict', 'Duplicate detection rules (Phone, WhatsApp, Email, FB Lead ID)');
    insertSetting.run('auto_create_first_followup', 'true', 'Automatically schedule 24-hr follow-up on new lead creation');
    insertSetting.run('auto_convert_student_on_confirm', 'true', 'Automatically generate student record when lead status hits Admission Confirmed');

    // 6. Audit log for clean init
    logAudit({
      userId: 'u-super',
      userName: 'System Administrator',
      action: 'SYSTEM_INIT',
      entity: 'SYSTEM',
      entityId: 'system',
      newValue: 'Clean production schema initialized with Super Admin account'
    });
  });

  runTx();
  console.log('✅ Clean production database initialization complete! Only Super Admin account exists.');
}

export function ensureUniversityCoursesSeed() {
  // Production mode: no hardcoded demo university courses
}

// If run directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  initDatabase();
  seedDatabase();
}
