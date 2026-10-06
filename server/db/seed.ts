import { db, logAudit, logLeadActivity, createNotification } from './database.ts';

export function seedDatabase() {
  console.log('🌱 Seeding Education Sansar CRM demo database...');

  // Check if already seeded
  const userCount = (db.prepare('SELECT count(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

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

    // 2. Users (Demo credentials for testing each role easily)
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, role, phone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const users = [
      ['u-super', 'Bikash Karki', 'admin@educationsansar.com', 'admin123', 'Super Admin', '+91 9811002233', 1],
      ['u-admin', 'Sunil Shrestha', 'sunil@educationsansar.com', 'admin123', 'Admin', '+91 9811002234', 1],
      ['u-c1', 'Aarav Sharma', 'aarav@educationsansar.com', 'pass123', 'Counselor', '+977 9801122331', 1],
      ['u-c2', 'Priya Patel', 'priya@educationsansar.com', 'pass123', 'Counselor', '+91 9822334455', 1],
      ['u-c3', 'Bibek Thapa', 'bibek@educationsansar.com', 'pass123', 'Counselor', '+977 9802233442', 1],
      ['u-c4', 'Ananya Mishra', 'ananya@educationsansar.com', 'pass123', 'Counselor', '+91 9833445566', 1],
      ['u-c5', 'Roshan Shrestha', 'roshan@educationsansar.com', 'pass123', 'Counselor', '+977 9803344553', 1],
      ['u-c6', 'Sneha Sen', 'sneha@educationsansar.com', 'pass123', 'Counselor', '+91 9844556677', 1],
      ['u-tele', 'Kavita Joshi', 'telecaller@educationsansar.com', 'pass123', 'Telecaller', '+91 9855667788', 1],
      ['u-mkt', 'Manish Verma', 'marketing@educationsansar.com', 'pass123', 'Marketing Manager', '+91 9866778899', 1],
      ['u-mgmt', 'Executive Director', 'management@educationsansar.com', 'pass123', 'Management', '+91 9877889900', 1]
    ];
    for (const u of users) insertUser.run(u[0], u[1], u[2], u[3], u[4], u[5], u[6]);

    // 3. 6 Counselors
    const insertCounselor = db.prepare(`
      INSERT OR REPLACE INTO counselors (
        id, user_id, name, email, phone, specialization_country, assigned_cities, 
        is_active, max_capacity, current_active_leads, total_assigned_leads, total_admissions, conversion_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const counselors = [
      ['c-1', 'u-c1', 'Counselor 1 (Aarav Sharma)', 'aarav@educationsansar.com', '+977 9801122331', 'Nepal & North India', '["Kathmandu", "Birgunj", "Janakpur", "Lahan"]', 1, 100, 14, 48, 9, 18.75],
      ['c-2', 'u-c2', 'Counselor 2 (Priya Patel)', 'priya@educationsansar.com', '+91 9822334455', 'Delhi NCR & Bangalore', '["Delhi", "Noida", "Bangalore"]', 1, 100, 12, 42, 8, 19.05],
      ['c-3', 'u-c3', 'Counselor 3 (Bibek Thapa)', 'bibek@educationsansar.com', '+977 9802233442', 'East Nepal & Engineering', '["Biratnagar", "Janakpur", "Rajbiraj"]', 1, 80, 11, 36, 6, 16.67],
      ['c-4', 'u-c4', 'Counselor 4 (Ananya Mishra)', 'ananya@educationsansar.com', '+91 9833445566', 'South India & Medical/Management', '["Chennai", "Bangalore", "Pune"]', 1, 90, 15, 45, 7, 15.56],
      ['c-5', 'u-c5', 'Counselor 5 (Roshan Shrestha)', 'roshan@educationsansar.com', '+977 9803344553', 'West Nepal & Paramedical', '["Butwal", "Bhairahawa", "Kathmandu"]', 1, 80, 9, 32, 5, 15.63],
      ['c-6', 'u-c6', 'Counselor 6 (Sneha Sen)', 'sneha@educationsansar.com', '+91 9844556677', 'West India & IT Programs', '["Mumbai", "Pune", "Noida"]', 1, 80, 8, 28, 4, 14.29]
    ];
    for (const c of counselors) {
      insertCounselor.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11], c[12]);
    }

    // 4. 10 Universities (Demo records clearly marked)
    const insertUni = db.prepare(`
      INSERT OR REPLACE INTO universities (
        id, name, campus, city, state, country, university_type, accreditation, ranking, website, contact, is_active, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const universities = [
      ['uni-1', 'SRM Institute of Science and Technology', 'Kattankulathur Main Campus', 'Chennai', 'Tamil Nadu', 'India', 'Deemed', 'NAAC A++', 'NIRF Ranked #18 (Demo)', 'https://srmist.edu.in', '+91 44 27417000', 1],
      ['uni-2', 'VIT Vellore', 'Main Campus', 'Vellore', 'Tamil Nadu', 'India', 'Deemed', 'NAAC A++', 'NIRF Top 10 (Demo)', 'https://vit.ac.in', '+91 416 2202020', 1],
      ['uni-3', 'Jain University', 'Global Campus', 'Bangalore', 'Karnataka', 'India', 'Deemed', 'NAAC A++', 'Top Bangalore Uni (Demo)', 'https://jainuniversity.ac.in', '+91 80 46650100', 1],
      ['uni-4', 'Symbiosis International University', 'Lavale Campus', 'Pune', 'Maharashtra', 'India', 'Deemed', 'NAAC A++', 'Top Management & Law (Demo)', 'https://siu.edu.in', '+91 20 28116200', 1],
      ['uni-5', 'NMIMS Deemed-to-be-University', 'Vile Parle Campus', 'Mumbai', 'Maharashtra', 'India', 'Deemed', 'NAAC A+', 'Top Commerce & MBA (Demo)', 'https://nmims.edu', '+91 22 42355555', 1],
      ['uni-6', 'SRM University AP', 'Amaravati Campus', 'Amaravati', 'Andhra Pradesh', 'India', 'Private', 'State Recognized', 'Emerging Tech Hub (Demo)', 'https://srmap.edu.in', '+91 863 2343000', 1],
      ['uni-7', 'Chandigarh University', 'Gharuan Campus', 'Mohali', 'Punjab', 'India', 'Private', 'NAAC A+', 'QS World Ranked (Demo)', 'https://cuchd.in', '+91 160 3051003', 1],
      ['uni-8', 'CMR University', 'Main Campus HRBR Layout', 'Bangalore', 'Karnataka', 'India', 'Private', 'UGC Approved', 'Design & Architecture (Demo)', 'https://cmr.edu.in', '+91 80 25426977', 1],
      ['uni-9', 'BMS College of Engineering', 'Basavanagudi Campus', 'Bangalore', 'Karnataka', 'India', 'Autonomous', 'NAAC A++', 'Premier Engineering (Demo)', 'https://bmsce.ac.in', '+91 80 26622130', 1],
      ['uni-10', 'Veltech University', 'Avadi Campus', 'Chennai', 'Tamil Nadu', 'India', 'Deemed', 'NAAC A', 'Aeronautical & Robotics (Demo)', 'https://veltech.edu.in', '+91 44 26841601', 1]
    ];
    for (const u of universities) {
      insertUni.run(u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9], u[10], u[11]);
    }

    // 5. 20 Courses (Demo records clearly marked)
    const insertCourse = db.prepare(`
      INSERT OR REPLACE INTO courses (
        id, university_id, university_name, course_name, degree_level, duration, 
        eligibility, fees_range, scholarship_info, intake, application_deadline, is_active, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const courses = [
      ['c-cse-srm', 'uni-1', 'SRM Institute of Science and Technology', 'B.Tech Computer Science & Engineering', 'Undergraduate', '4 Years', '60%+ in 10+2 with PCM', '₹3.5L - ₹4.5L/year (Demo)', 'Up to 50% based on SRMJEEE', 'Fall 2026', '2026-06-30', 1],
      ['c-aiml-srm', 'uni-1', 'SRM Institute of Science and Technology', 'B.Tech AI & Machine Learning', 'Undergraduate', '4 Years', '60%+ in 10+2 with PCM', '₹3.75L - ₹4.75L/year (Demo)', 'Founder scholarship available', 'Fall 2026', '2026-06-30', 1],
      ['c-bba-srm', 'uni-1', 'SRM Institute of Science and Technology', 'BBA (Honours)', 'Undergraduate', '3 Years', '50%+ in 10+2 any stream', '₹1.5L - ₹2.0L/year (Demo)', 'Merit scholarship on 12th score', 'Fall 2026', '2026-07-15', 1],
      ['c-cse-vit', 'uni-2', 'VIT Vellore', 'B.Tech Computer Science & Engineering', 'Undergraduate', '4 Years', '60%+ in PCM/B in 10+2', '₹2.95L - ₹4.9L/year (Category 1-5 Demo)', 'VITEEE rank waiver available', 'Fall 2026', '2026-05-31', 1],
      ['c-it-vit', 'uni-2', 'VIT Vellore', 'B.Tech Information Technology', 'Undergraduate', '4 Years', '60%+ in PCM', '₹2.8L - ₹4.5L/year (Demo)', 'State topper waiver', 'Fall 2026', '2026-05-31', 1],
      ['c-bba-jain', 'uni-3', 'Jain University', 'BBA Corporate Aviation & Logistics', 'Undergraduate', '3 Years', '50%+ in 10+2', '₹2.2L - ₹2.8L/year (Demo)', 'JET Entrance merit scholarship', 'Fall 2026', '2026-07-31', 1],
      ['c-bcom-jain', 'uni-3', 'Jain University', 'B.Com Hons with ACCA Integration', 'Undergraduate', '3 Years', '50%+ in 10+2 Commerce', '₹1.8L - ₹2.4L/year (Demo)', 'ACCA certification guidance', 'Fall 2026', '2026-07-31', 1],
      ['c-mba-symb', 'uni-4', 'Symbiosis International University', 'MBA Marketing & International Business', 'Postgraduate', '2 Years', 'Graduate with 50%+ & SNAP score', '₹9.5L - ₹11L total (Demo)', 'Merit waivers available', 'Fall 2026', '2026-04-30', 1],
      ['c-bba-symb', 'uni-4', 'Symbiosis International University', 'BBA (Dual Degree Option)', 'Undergraduate', '3 Years', '10+2 with 50%+ & SET test', '₹3.2L - ₹3.8L/year (Demo)', 'Sports & academic waivers', 'Fall 2026', '2026-05-15', 1],
      ['c-bcom-nmims', 'uni-5', 'NMIMS Deemed-to-be-University', 'B.Com Honours', 'Undergraduate', '3 Years', '10+2 with 60%+ & NPAT score', '₹2.4L - ₹3.0L/year (Demo)', 'Merit list top 5%', 'Fall 2026', '2026-06-15', 1],
      ['c-mba-nmims', 'uni-5', 'NMIMS Deemed-to-be-University', 'MBA Core', 'Postgraduate', '2 Years', 'Graduation 50%+ & NMAT', '₹11.5L - ₹13L total (Demo)', 'Corporate scholarships', 'Fall 2026', '2026-03-31', 1],
      ['c-cse-srmap', 'uni-6', 'SRM University AP', 'B.Tech CSE with Cyber Security', 'Undergraduate', '4 Years', '60%+ in 10+2 PCM', '₹2.8L - ₹3.6L/year (Demo)', 'Up to 100% tuition for 95%+', 'Fall 2026', '2026-07-10', 1],
      ['c-mca-cu', 'uni-7', 'Chandigarh University', 'MCA Cloud Computing & DevOps', 'Postgraduate', '2 Years', 'BCA/B.Sc CS with 50%+', '₹1.2L - ₹1.6L/year (Demo)', 'CUCET score scholarship up to 100%', 'Fall 2026', '2026-08-15', 1],
      ['c-nurs-cu', 'uni-7', 'Chandigarh University', 'B.Sc Nursing', 'Undergraduate', '4 Years', '10+2 PCB with 45%+', '₹1.4L - ₹1.8L/year (Demo)', 'Hospital clinical training stipend', 'Fall 2026', '2026-08-01', 1],
      ['c-bdes-cmr', 'uni-8', 'CMR University', 'B.Des User Experience & Interaction', 'Undergraduate', '4 Years', '10+2 any stream with portfolio', '₹2.6L - ₹3.2L/year (Demo)', 'CMR design aptitude test scholarship', 'Fall 2026', '2026-07-20', 1],
      ['c-mech-bms', 'uni-9', 'BMS College of Engineering', 'B.Tech Mechanical Engineering', 'Undergraduate', '4 Years', '10+2 with 50%+ in PCM', '₹2.5L - ₹3.2L/year (Demo)', 'Karnataka state & NRI quota', 'Fall 2026', '2026-06-25', 1],
      ['c-aero-vel', 'uni-10', 'Veltech University', 'B.Tech Aeronautical Engineering', 'Undergraduate', '4 Years', '10+2 with 60%+ in PCM', '₹2.2L - ₹2.9L/year (Demo)', 'Mahatma Gandhi national scholarship', 'Fall 2026', '2026-07-05', 1],
      ['c-bca-srm', 'uni-1', 'SRM Institute of Science and Technology', 'BCA Data Science & Web Technologies', 'Undergraduate', '3 Years', '10+2 with Mathematics', '₹1.3L - ₹1.7L/year (Demo)', 'Merit scholarship on 12th', 'Fall 2026', '2026-07-15', 1],
      ['c-mbbs-demo', 'uni-2', 'VIT Vellore', 'MBBS (International/Demo Program)', 'Undergraduate', '5.5 Years', 'NEET qualified with 50%+ in PCB', 'Indicative Demo Fee Only', 'Merit quota only', 'Fall 2026', '2026-08-30', 1],
      ['c-bds-demo', 'uni-1', 'SRM Institute of Science and Technology', 'BDS Dental Surgery', 'Undergraduate', '5 Years', 'NEET qualified with 50%+ in PCB', 'Indicative Demo Fee Only', 'NEET score based', 'Fall 2026', '2026-08-30', 1]
    ];
    for (const c of courses) {
      insertCourse.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11]);
    }

    // 6. Marketing Campaigns
    const insertCamp = db.prepare(`
      INSERT OR REPLACE INTO campaigns (
        id, name, platform, university_focus, course_focus, target_city, start_date, end_date,
        budget, spend, leads_count, applications_count, admissions_count, cost_per_lead, cost_per_application, cost_per_admission, is_active, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const campaigns = [
      ['camp-1', 'Meta Nepal Admission Wave 2026', 'Meta', 'SRM, VIT, Jain', 'B.Tech, BBA, B.Sc Nursing', 'Kathmandu & Biratnagar', '2026-01-10', '2026-08-31', 250000, 168400, 480, 72, 28, 350.83, 2338.89, 6014.29, 1],
      ['camp-2', 'Google Search B.Tech Engineering India', 'Google', 'SRM AP, BMS, Veltech', 'B.Tech CSE, AI & ML', 'Delhi, Noida, Janakpur', '2026-02-01', '2026-07-31', 180000, 122000, 290, 48, 19, 420.69, 2541.67, 6421.05, 1],
      ['camp-3', 'Instagram Medical & Nursing Nepal Drive', 'Instagram', 'Chandigarh Uni, SRM', 'B.Sc Nursing, BDS', 'Butwal, Bhairahawa, Birgunj', '2026-02-15', '2026-08-15', 120000, 84500, 215, 34, 14, 393.02, 2485.29, 6035.71, 1],
      ['camp-4', 'Delhi NCR Walk-in & Education Expo', 'Offline', 'Symbiosis, NMIMS, Jain', 'MBA, BBA, B.Com', 'Delhi, Noida, Gurgaon', '2026-03-01', '2026-06-30', 95000, 68000, 145, 31, 12, 468.97, 2193.55, 5666.67, 1]
    ];
    for (const cp of campaigns) {
      insertCamp.run(cp[0], cp[1], cp[2], cp[3], cp[4], cp[5], cp[6], cp[7], cp[8], cp[9], cp[10], cp[11], cp[12], cp[13], cp[14], cp[15], cp[16]);
    }

    // 7. Message Templates (WhatsApp & Email)
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
        'Hello {{student_name}}, this is {{counselor_name}} from Education Sansar Noida. I will be your official admission advisor for {{preferred_university}}. Are you free for a 10-minute briefing today at {{follow_up_time}}?',
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

    // 8. Integrations
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

    // 9. System Settings
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

    // 10. 35+ Rich Demo Leads across Nepal and India target markets
    const insertLead = db.prepare(`
      INSERT OR REPLACE INTO leads (
        id, lead_id, student_name, first_name, last_name, phone, whatsapp_number, email, gender, date_of_birth,
        country, state, city, address, academic_qualification, percentage_10th, percentage_12th, graduation_percentage,
        entrance_exam, entrance_score, preferred_course, preferred_university, second_university, budget,
        scholarship_required, lead_source, campaign, ad_set, ad, facebook_lead_id, lead_created_date,
        assigned_counselor_id, assigned_counselor_name, lead_status, lead_temperature, last_contact_date,
        next_follow_up_date, remarks, is_converted_to_student, is_deleted, is_demo
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, 0, 1
      )
    `);

    // Define 35 demo leads with realistic cities from requirements:
    // Kathmandu, Birgunj, Janakpur, Biratnagar, Butwal, Bhairahawa, Lahan, Rajbiraj, Delhi, Bangalore, Chennai, Noida, Mumbai, Pune
    const demoLeads = [
      // Nepal leads
      {
        id: 'lead-01', lead_id: 'ES-2026-0001', name: 'Prabin Adhikari', fn: 'Prabin', ln: 'Adhikari',
        phone: '+977 9841234567', wa: '+977 9841234567', email: 'prabin.adhikari@gmail.com', gender: 'Male', dob: '2005-04-12',
        country: 'Nepal', state: 'Bagmati', city: 'Kathmandu', address: 'Baneshwor, Kathmandu',
        qual: '+2 Science (NEB)', p10: 88.5, p12: 84.0, grad: null, exam: 'SEE / NEB +2', score: '3.6 GPA',
        course: 'B.Tech Computer Science & Engineering', uni: 'SRM Institute of Science and Technology', uni2: 'VIT Vellore',
        budget: '₹14L - ₹18L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Science Students Grade 12', ad: 'SRM Admissions 2026 Nepal', fb_id: 'fb-lead-9901',
        created_date: '2026-09-20 10:15:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'Admission Confirmed', temp: 'HOT', last_contact: '2026-09-27', next_fup: null,
        remarks: 'Excellent student, confirmed seat with 25% merit scholarship at SRM Kattankulathur.'
      },
      {
        id: 'lead-02', lead_id: 'ES-2026-0002', name: 'Shreya Sharma', fn: 'Shreya', ln: 'Sharma',
        phone: '+977 9851098765', wa: '+977 9851098765', email: 'shreya.sharma.ktm@yahoo.com', gender: 'Female', dob: '2005-09-18',
        country: 'Nepal', state: 'Bagmati', city: 'Kathmandu', address: 'Jhamsikhel, Lalitpur',
        qual: '+2 Management', p10: 84.0, p12: 82.5, grad: null, exam: 'NEB Board', score: '3.5 GPA',
        course: 'BBA Corporate Aviation & Logistics', uni: 'Jain University', uni2: 'Symbiosis International University',
        budget: '₹8L - ₹12L', scholarship: 0, source: 'Instagram', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Management Students', ad: 'Bangalore BBA Admissions', fb_id: 'fb-lead-9902',
        created_date: '2026-09-21 11:30:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'Offer Received', temp: 'HOT', last_contact: '2026-09-26', next_fup: '2026-09-29',
        remarks: 'Offer letter generated by Jain University. Discussing fee payment schedule.'
      },
      {
        id: 'lead-03', lead_id: 'ES-2026-0003', name: 'Rohan Chaudhary', fn: 'Rohan', ln: 'Chaudhary',
        phone: '+977 9804561234', wa: '+977 9804561234', email: 'rohan.biratnagar@gmail.com', gender: 'Male', dob: '2004-11-25',
        country: 'Nepal', state: 'Koshi', city: 'Biratnagar', address: 'Main Road, Biratnagar-3',
        qual: '+2 Science', p10: 79.0, p12: 76.0, grad: null, exam: 'JEE Main (Nepal Center)', score: '82 Percentile',
        course: 'B.Tech AI & Machine Learning', uni: 'SRM University AP', uni2: 'Chandigarh University',
        budget: '₹10L - ₹14L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Engineering Aspirants', ad: 'SRM AP AI & ML Specialization', fb_id: 'fb-lead-9903',
        created_date: '2026-09-22 09:00:00', c_id: 'c-3', c_name: 'Counselor 3 (Bibek Thapa)',
        status: 'Documents Pending', temp: 'WARM', last_contact: '2026-09-26', next_fup: '2026-09-28',
        remarks: 'Transcripts received. Awaiting Citizenship certificate and migration paper.'
      },
      {
        id: 'lead-04', lead_id: 'ES-2026-0004', name: 'Anjali Sah', fn: 'Anjali', ln: 'Sah',
        phone: '+977 9807123987', wa: '+977 9807123987', email: 'anjali.sah.jkr@gmail.com', gender: 'Female', dob: '2005-02-14',
        country: 'Nepal', state: 'Madhesh', city: 'Janakpur', address: 'Bhanu Chowk, Janakpurdham',
        qual: '+2 Science (PCB)', p10: 89.0, p12: 85.0, grad: null, exam: 'NEET 2026 (Appeared)', score: '495 Marks',
        course: 'B.Sc Nursing', uni: 'Chandigarh University', uni2: 'SRM Institute of Science and Technology',
        budget: '₹6L - ₹8L', scholarship: 1, source: 'Facebook', campaign: 'Instagram Medical & Nursing Nepal Drive',
        adset: 'PCB Medical Nursing', ad: 'CU Nursing Admissions', fb_id: 'fb-lead-9904',
        created_date: '2026-09-22 14:20:00', c_id: 'c-3', c_name: 'Counselor 3 (Bibek Thapa)',
        status: 'Application Submitted', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-30',
        remarks: 'Application submitted to Chandigarh University Nursing dept. Verification in progress.'
      },
      {
        id: 'lead-05', lead_id: 'ES-2026-0005', name: 'Dipesh Raut', fn: 'Dipesh', ln: 'Raut',
        phone: '+977 9812349876', wa: '+977 9812349876', email: 'dipesh.raut.brg@gmail.com', gender: 'Male', dob: '2004-06-30',
        country: 'Nepal', state: 'Madhesh', city: 'Birgunj', address: 'Adarshanagar, Birgunj',
        qual: '+2 Science', p10: 82.0, p12: 78.5, grad: null, exam: 'IOE / Local Entrance', score: 'Rank 1240',
        course: 'B.Tech Computer Science & Engineering', uni: 'VIT Vellore', uni2: 'BMS College of Engineering',
        budget: '₹15L - ₹20L', scholarship: 0, source: 'WhatsApp', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-23 16:10:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'Counseling Done', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'Wants admission into VIT Vellore or Chennai campus. Parents ready for application submission.'
      },
      {
        id: 'lead-06', lead_id: 'ES-2026-0006', name: 'Suman Thapa', fn: 'Suman', ln: 'Thapa',
        phone: '+977 9805678901', wa: '+977 9805678901', email: 'suman.thapa.btl@gmail.com', gender: 'Male', dob: '2005-01-19',
        country: 'Nepal', state: 'Lumbini', city: 'Butwal', address: 'Traffic Chowk, Butwal',
        qual: '+2 Science', p10: 75.0, p12: 71.0, grad: null, exam: 'NEB', score: '3.1 GPA',
        course: 'B.Tech Aeronautical Engineering', uni: 'Veltech University', uni2: 'Chandigarh University',
        budget: '₹9L - ₹12L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Mechanical & Aeronautical', ad: 'Veltech Aerospace Lab & Placement', fb_id: 'fb-lead-9906',
        created_date: '2026-09-24 10:00:00', c_id: 'c-5', c_name: 'Counselor 5 (Roshan Shrestha)',
        status: 'Application Started', temp: 'WARM', last_contact: '2026-09-26', next_fup: '2026-09-28',
        remarks: 'Created portal profile on Veltech. Uploading 10th and 12th certificates.'
      },
      {
        id: 'lead-07', lead_id: 'ES-2026-0007', name: 'Puja Yadav', fn: 'Puja', ln: 'Yadav',
        phone: '+977 9808901234', wa: '+977 9808901234', email: 'puja.yadav.bwa@gmail.com', gender: 'Female', dob: '2005-08-05',
        country: 'Nepal', state: 'Lumbini', city: 'Bhairahawa', address: 'Bank Road, Bhairahawa',
        qual: '+2 Management', p10: 81.0, p12: 79.0, grad: null, exam: 'NEB Board', score: '3.4 GPA',
        course: 'B.Com Hons with ACCA Integration', uni: 'Jain University', uni2: 'NMIMS Deemed-to-be-University',
        budget: '₹7L - ₹10L', scholarship: 0, source: 'Referral', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-24 12:45:00', c_id: 'c-5', c_name: 'Counselor 5 (Roshan Shrestha)',
        status: 'Contacted', temp: 'WARM', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'Called student and discussed ACCA exemption benefits in Bangalore.'
      },
      {
        id: 'lead-08', lead_id: 'ES-2026-0008', name: 'Manish Mahato', fn: 'Manish', ln: 'Mahato',
        phone: '+977 9814567890', wa: '+977 9814567890', email: 'manish.lahan@gmail.com', gender: 'Male', dob: '2004-12-01',
        country: 'Nepal', state: 'Madhesh', city: 'Lahan', address: 'Hospital Chowk, Lahan',
        qual: '+2 Science', p10: 74.0, p12: 70.0, grad: null, exam: 'NEB Science', score: '3.0 GPA',
        course: 'B.Tech Computer Science & Engineering', uni: 'SRM University AP', uni2: 'Chandigarh University',
        budget: '₹8L - ₹11L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Engineering Aspirants', ad: 'SRM AP Admissions', fb_id: 'fb-lead-9908',
        created_date: '2026-09-25 09:30:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'New Lead', temp: 'WARM', last_contact: null, next_fup: '2026-09-28',
        remarks: 'New lead from Meta form. First contact call scheduled.'
      },
      {
        id: 'lead-09', lead_id: 'ES-2026-0009', name: 'Kritika Mandal', fn: 'Kritika', ln: 'Mandal',
        phone: '+977 9803456789', wa: '+977 9803456789', email: 'kritika.mandal.rbj@yahoo.com', gender: 'Female', dob: '2005-03-22',
        country: 'Nepal', state: 'Madhesh', city: 'Rajbiraj', address: 'Station Road, Rajbiraj',
        qual: '+2 Science (PCB)', p10: 86.0, p12: 83.0, grad: null, exam: 'NEET 2026', score: '440 Marks',
        course: 'B.Sc Nursing', uni: 'Chandigarh University', uni2: 'SRM Institute of Science and Technology',
        budget: '₹7L - ₹9L', scholarship: 1, source: 'Website', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-25 15:15:00', c_id: 'c-3', c_name: 'Counselor 3 (Bibek Thapa)',
        status: 'Counseling Scheduled', temp: 'HOT', last_contact: '2026-09-26', next_fup: '2026-09-28',
        remarks: 'Online Google Meet counselling session scheduled with student and parents.'
      },

      // India leads (Delhi, Bangalore, Chennai, Noida, Mumbai, Pune)
      {
        id: 'lead-10', lead_id: 'ES-2026-0010', name: 'Karan Mehra', fn: 'Karan', ln: 'Mehra',
        phone: '+91 9811223344', wa: '+91 9811223344', email: 'karan.mehra.delhi@gmail.com', gender: 'Male', dob: '2004-10-15',
        country: 'India', state: 'Delhi', city: 'Delhi', address: 'Rohini Sector 14, New Delhi',
        qual: '10+2 CBSE', p10: 92.0, p12: 89.5, grad: null, exam: 'JEE Main', score: '94.2 Percentile',
        course: 'B.Tech Computer Science & Engineering', uni: 'VIT Vellore', uni2: 'SRM Institute of Science and Technology',
        budget: '₹18L - ₹22L', scholarship: 0, source: 'Google', campaign: 'Google Search B.Tech Engineering India',
        adset: 'High Intent JEE Engineering', ad: 'VIT & SRM Direct Counseling', fb_id: null,
        created_date: '2026-09-20 12:00:00', c_id: 'c-2', c_name: 'Counselor 2 (Priya Patel)',
        status: 'Fee Paid', temp: 'HOT', last_contact: '2026-09-27', next_fup: null,
        remarks: 'VIT Category 2 seat confirmed. Admission advance fee ₹50,000 paid through portal.'
      },
      {
        id: 'lead-11', lead_id: 'ES-2026-0011', name: 'Tanvi Saxena', fn: 'Tanvi', ln: 'Saxena',
        phone: '+91 9818877665', wa: '+91 9818877665', email: 'tanvi.saxena.noida@gmail.com', gender: 'Female', dob: '2005-07-28',
        country: 'India', state: 'Uttar Pradesh', city: 'Noida', address: 'Sector 50, Noida',
        qual: '10+2 ISC', p10: 90.0, p12: 88.0, grad: null, exam: 'SET / NPAT', score: 'Rank 450',
        course: 'BBA (Dual Degree Option)', uni: 'Symbiosis International University', uni2: 'NMIMS Deemed-to-be-University',
        budget: '₹15L - ₹18L', scholarship: 0, source: 'Walk-in', campaign: 'Delhi NCR Walk-in & Education Expo',
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-21 16:30:00', c_id: 'c-2', c_name: 'Counselor 2 (Priya Patel)',
        status: 'Admission Confirmed', temp: 'HOT', last_contact: '2026-09-27', next_fup: null,
        remarks: 'Visited Education Sansar Noida office Sector 94. Confirmed at Symbiosis Pune BBA.'
      },
      {
        id: 'lead-12', lead_id: 'ES-2026-0012', name: 'Aditya Nair', fn: 'Aditya', ln: 'Nair',
        phone: '+91 9845012345', wa: '+91 9845012345', email: 'aditya.nair.blr@gmail.com', gender: 'Male', dob: '2004-05-10',
        country: 'India', state: 'Karnataka', city: 'Bangalore', address: 'Indiranagar, Bangalore',
        qual: '10+2 Karnataka PUC', p10: 88.0, p12: 85.0, grad: null, exam: 'KCET / COMEDK', score: 'Rank 3200',
        course: 'B.Tech Mechanical Engineering', uni: 'BMS College of Engineering', uni2: 'Jain University',
        budget: '₹10L - ₹15L', scholarship: 0, source: 'Referral', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-22 10:45:00', c_id: 'c-4', c_name: 'Counselor 4 (Ananya Mishra)',
        status: 'Interested', temp: 'WARM', last_contact: '2026-09-26', next_fup: '2026-09-28',
        remarks: 'Considering BMS College of Engineering. Wants details on placement packages.'
      },
      {
        id: 'lead-13', lead_id: 'ES-2026-0013', name: 'Snehal Deshmukh', fn: 'Snehal', ln: 'Deshmukh',
        phone: '+91 9820098765', wa: '+91 9820098765', email: 'snehal.deshmukh.pune@gmail.com', gender: 'Female', dob: '2003-12-14',
        country: 'India', state: 'Maharashtra', city: 'Pune', address: 'Kothrud, Pune',
        qual: 'B.Com Graduate', p10: 85.0, p12: 84.0, grad: 78.5, exam: 'SNAP / NMAT', score: '96 Percentile',
        course: 'MBA Marketing & International Business', uni: 'Symbiosis International University', uni2: 'NMIMS Deemed-to-be-University',
        budget: '₹18L - ₹24L', scholarship: 0, source: 'Meta Ads', campaign: 'Delhi NCR Walk-in & Education Expo',
        adset: 'MBA Aspirants', ad: 'Symbiosis Pune MBA Selection', fb_id: 'fb-lead-9913',
        created_date: '2026-09-23 11:20:00', c_id: 'c-6', c_name: 'Counselor 6 (Sneha Sen)',
        status: 'Offer Received', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'Selected in first round of Symbiosis GD/PI. Offer letter received.'
      },
      {
        id: 'lead-14', lead_id: 'ES-2026-0014', name: 'Varun Kulkarni', fn: 'Varun', ln: 'Kulkarni',
        phone: '+91 9821123456', wa: '+91 9821123456', email: 'varun.kulkarni.mum@gmail.com', gender: 'Male', dob: '2004-08-20',
        country: 'India', state: 'Maharashtra', city: 'Mumbai', address: 'Bandra West, Mumbai',
        qual: '10+2 Maharashtra HSC', p10: 91.0, p12: 87.0, grad: null, exam: 'NPAT 2026', score: 'Merit Rank 310',
        course: 'B.Com Honours', uni: 'NMIMS Deemed-to-be-University', uni2: 'Jain University',
        budget: '₹12L - ₹15L', scholarship: 0, source: 'Website', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-23 14:00:00', c_id: 'c-6', c_name: 'Counselor 6 (Sneha Sen)',
        status: 'Fee Pending', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-28',
        remarks: 'Provisional admission letter released by NMIMS Mumbai. Fee deadline is Oct 2.'
      },
      {
        id: 'lead-15', lead_id: 'ES-2026-0015', name: 'Pooja Subramanian', fn: 'Pooja', ln: 'Subramanian',
        phone: '+91 9840123987', wa: '+91 9840123987', email: 'pooja.subramanian.chn@gmail.com', gender: 'Female', dob: '2005-04-03',
        country: 'India', state: 'Tamil Nadu', city: 'Chennai', address: 'Anna Nagar, Chennai',
        qual: '10+2 State Board', p10: 94.0, p12: 91.0, grad: null, exam: 'SRMJEEE', score: 'Rank 1850',
        course: 'B.Tech AI & Machine Learning', uni: 'SRM Institute of Science and Technology', uni2: 'VIT Vellore',
        budget: '₹16L - ₹20L', scholarship: 1, source: 'Google', campaign: 'Google Search B.Tech Engineering India',
        adset: 'Tamil Nadu Students', ad: 'SRM Kattankulathur Admissions', fb_id: null,
        created_date: '2026-09-24 09:15:00', c_id: 'c-4', c_name: 'Counselor 4 (Ananya Mishra)',
        status: 'Application Started', temp: 'HOT', last_contact: '2026-09-26', next_fup: '2026-09-29',
        remarks: 'Eligible for 25% SRMJEEE merit waiver. Document verification starting.'
      },

      // Additional diverse leads to reach 35+
      {
        id: 'lead-16', lead_id: 'ES-2026-0016', name: 'Aashish Pokharel', fn: 'Aashish', ln: 'Pokharel',
        phone: '+977 9841998877', wa: '+977 9841998877', email: 'aashish.pokharel@gmail.com', gender: 'Male', dob: '2004-03-15',
        country: 'Nepal', state: 'Bagmati', city: 'Kathmandu', address: 'Kapan, Kathmandu',
        qual: '+2 Science', p10: 81.0, p12: 77.0, grad: null, exam: 'NEB', score: '3.3 GPA',
        course: 'B.Tech Computer Science & Engineering', uni: 'Chandigarh University', uni2: 'SRM University AP',
        budget: '₹8L - ₹10L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Science Students Grade 12', ad: 'CU Direct Admissions Nepal', fb_id: 'fb-lead-9916',
        created_date: '2026-09-24 15:40:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'Not Reachable', temp: 'COLD', last_contact: '2026-09-26', next_fup: '2026-09-28',
        remarks: 'Called twice, mobile switched off. Sent WhatsApp outreach.'
      },
      {
        id: 'lead-17', lead_id: 'ES-2026-0017', name: 'Neha Regmi', fn: 'Neha', ln: 'Regmi',
        phone: '+977 9851239900', wa: '+977 9851239900', email: 'neha.regmi.ktm@gmail.com', gender: 'Female', dob: '2003-09-09',
        country: 'Nepal', state: 'Bagmati', city: 'Kathmandu', address: 'Kalanki, Kathmandu',
        qual: 'BCA Graduate', p10: 78.0, p12: 74.0, grad: 72.0, exam: 'Graduation', score: 'First Division',
        course: 'MCA Cloud Computing & DevOps', uni: 'Chandigarh University', uni2: 'Jain University',
        budget: '₹6L - ₹8L', scholarship: 1, source: 'Consultant', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-25 10:20:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'Interested', temp: 'WARM', last_contact: '2026-09-27', next_fup: '2026-09-30',
        remarks: 'Wants 2-year MCA with campus placement support.'
      },
      {
        id: 'lead-18', lead_id: 'ES-2026-0018', name: 'Sanjay Kushwaha', fn: 'Sanjay', ln: 'Kushwaha',
        phone: '+977 9807654321', wa: '+977 9807654321', email: 'sanjay.kushwaha.brg@gmail.com', gender: 'Male', dob: '2005-06-18',
        country: 'Nepal', state: 'Madhesh', city: 'Birgunj', address: 'Maisthan, Birgunj',
        qual: '+2 Science', p10: 83.5, p12: 80.0, grad: null, exam: 'SEE / NEB', score: '3.45 GPA',
        course: 'B.Tech AI & Machine Learning', uni: 'SRM Institute of Science and Technology', uni2: 'Veltech University',
        budget: '₹12L - ₹15L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Science Students Grade 12', ad: 'SRM Admissions 2026 Nepal', fb_id: 'fb-lead-9918',
        created_date: '2026-09-25 11:50:00', c_id: 'c-3', c_name: 'Counselor 3 (Bibek Thapa)',
        status: 'Contacted', temp: 'WARM', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'Father is an engineer in Birgunj. Looking for accredited AI & ML B.Tech.'
      },
      {
        id: 'lead-19', lead_id: 'ES-2026-0019', name: 'Binita Shrestha', fn: 'Binita', ln: 'Shrestha',
        phone: '+977 9802345671', wa: '+977 9802345671', email: 'binita.shrestha.btl@gmail.com', gender: 'Female', dob: '2005-10-30',
        country: 'Nepal', state: 'Lumbini', city: 'Butwal', address: 'Golpark, Butwal',
        qual: '+2 Science (PCB)', p10: 87.0, p12: 86.0, grad: null, exam: 'NEET 2026', score: '520 Marks',
        course: 'B.Sc Nursing', uni: 'SRM Institute of Science and Technology', uni2: 'Chandigarh University',
        budget: '₹8L - ₹10L', scholarship: 1, source: 'Instagram', campaign: 'Instagram Medical & Nursing Nepal Drive',
        adset: 'PCB Medical Nursing', ad: 'SRM Medical & Nursing Direct', fb_id: 'fb-lead-9919',
        created_date: '2026-09-25 14:10:00', c_id: 'c-5', c_name: 'Counselor 5 (Roshan Shrestha)',
        status: 'Counseling Scheduled', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-28',
        remarks: 'High NEET score. Parents joining call on Sunday 4 PM.'
      },
      {
        id: 'lead-20', lead_id: 'ES-2026-0020', name: 'Alok Gupta', fn: 'Alok', ln: 'Gupta',
        phone: '+91 9810112233', wa: '+91 9810112233', email: 'alok.gupta.delhi@gmail.com', gender: 'Male', dob: '2004-02-17',
        country: 'India', state: 'Delhi', city: 'Delhi', address: 'Janakpuri, New Delhi',
        qual: '10+2 CBSE', p10: 86.0, p12: 82.0, grad: null, exam: 'IPU CET / JEE', score: 'Rank 8400',
        course: 'B.Tech Computer Science & Engineering', uni: 'CMR University', uni2: 'Chandigarh University',
        budget: '₹10L - ₹13L', scholarship: 0, source: 'Google', campaign: 'Google Search B.Tech Engineering India',
        adset: 'Delhi NCR Engineering', ad: 'Bangalore Engineering Colleges', fb_id: null,
        created_date: '2026-09-26 09:40:00', c_id: 'c-2', c_name: 'Counselor 2 (Priya Patel)',
        status: 'New Lead', temp: 'WARM', last_contact: null, next_fup: '2026-09-28',
        remarks: 'Inquired about CMR University Bangalore campus facilities.'
      },
      {
        id: 'lead-21', lead_id: 'ES-2026-0021', name: 'Nisha Bista', fn: 'Nisha', ln: 'Bista',
        phone: '+977 9801987654', wa: '+977 9801987654', email: 'nisha.bista.ktm@yahoo.com', gender: 'Female', dob: '2005-05-14',
        country: 'Nepal', state: 'Bagmati', city: 'Kathmandu', address: 'Thamel, Kathmandu',
        qual: '+2 Humanities & Arts', p10: 80.0, p12: 79.0, grad: null, exam: 'School Portfolio', score: 'A Grade',
        course: 'B.Des User Experience & Interaction', uni: 'CMR University', uni2: 'Jain University',
        budget: '₹9L - ₹12L', scholarship: 1, source: 'Website', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-26 11:00:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'Contacted', temp: 'WARM', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'Wants design education in Bangalore with UI/UX focus.'
      },
      {
        id: 'lead-22', lead_id: 'ES-2026-0022', name: 'Rahul Singhal', fn: 'Rahul', ln: 'Singhal',
        phone: '+91 9811556677', wa: '+91 9811556677', email: 'rahul.singhal.noida@gmail.com', gender: 'Male', dob: '2004-09-05',
        country: 'India', state: 'Uttar Pradesh', city: 'Noida', address: 'Sector 62, Noida',
        qual: '10+2 CBSE', p10: 93.0, p12: 90.0, grad: null, exam: 'JEE Main', score: '96.4 Percentile',
        course: 'B.Tech Computer Science & Engineering', uni: 'SRM Institute of Science and Technology', uni2: 'VIT Vellore',
        budget: '₹16L - ₹20L', scholarship: 1, source: 'Walk-in', campaign: 'Delhi NCR Walk-in & Education Expo',
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-26 14:30:00', c_id: 'c-2', c_name: 'Counselor 2 (Priya Patel)',
        status: 'Application Started', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'Walked into Sector 94 office. Registered for SRM Main Campus CSE.'
      },
      {
        id: 'lead-23', lead_id: 'ES-2026-0023', name: 'Deepa Karki', fn: 'Deepa', ln: 'Karki',
        phone: '+977 9803123456', wa: '+977 9803123456', email: 'deepa.karki.brt@gmail.com', gender: 'Female', dob: '2005-07-11',
        country: 'Nepal', state: 'Koshi', city: 'Biratnagar', address: 'Tinpaini, Biratnagar',
        qual: '+2 Science', p10: 85.0, p12: 81.0, grad: null, exam: 'NEB Board', score: '3.5 GPA',
        course: 'B.Tech AI & Machine Learning', uni: 'SRM University AP', uni2: 'Chandigarh University',
        budget: '₹10L - ₹13L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Science Students Grade 12', ad: 'SRM AP AI & ML Specialization', fb_id: 'fb-lead-9923',
        created_date: '2026-09-26 16:15:00', c_id: 'c-3', c_name: 'Counselor 3 (Bibek Thapa)',
        status: 'New Lead', temp: 'HOT', last_contact: null, next_fup: '2026-09-28',
        remarks: 'High intent student requesting immediate call from Biratnagar.'
      },
      {
        id: 'lead-24', lead_id: 'ES-2026-0024', name: 'Sameer Jha', fn: 'Sameer', ln: 'Jha',
        phone: '+977 9815678901', wa: '+977 9815678901', email: 'sameer.jha.jkr@gmail.com', gender: 'Male', dob: '2004-01-20',
        country: 'Nepal', state: 'Madhesh', city: 'Janakpur', address: 'Mills Area, Janakpur',
        qual: '+2 Management', p10: 76.0, p12: 73.0, grad: null, exam: 'NEB Board', score: '3.1 GPA',
        course: 'BBA (Honours)', uni: 'SRM Institute of Science and Technology', uni2: 'Jain University',
        budget: '₹6L - ₹8L', scholarship: 0, source: 'Phone', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-27 10:00:00', c_id: 'c-3', c_name: 'Counselor 3 (Bibek Thapa)',
        status: 'Contacted', temp: 'WARM', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'Wants BBA in Chennai with hostel accommodation.'
      },
      {
        id: 'lead-25', lead_id: 'ES-2026-0025', name: 'Praveen Reddy', fn: 'Praveen', ln: 'Reddy',
        phone: '+91 9849011223', wa: '+91 9849011223', email: 'praveen.reddy.blr@gmail.com', gender: 'Male', dob: '2004-11-09',
        country: 'India', state: 'Karnataka', city: 'Bangalore', address: 'Whitefield, Bangalore',
        qual: '10+2 PUC', p10: 89.0, p12: 86.0, grad: null, exam: 'COMEDK', score: 'Rank 2400',
        course: 'B.Tech Computer Science & Engineering', uni: 'BMS College of Engineering', uni2: 'Jain University',
        budget: '₹14L - ₹18L', scholarship: 0, source: 'Website', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-27 11:20:00', c_id: 'c-4', c_name: 'Counselor 4 (Ananya Mishra)',
        status: 'Documents Pending', temp: 'WARM', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'COMEDK scorecard uploaded. Waiting for 12th marksheet scan.'
      },
      {
        id: 'lead-26', lead_id: 'ES-2026-0026', name: 'Divya Sundaram', fn: 'Divya', ln: 'Sundaram',
        phone: '+91 9840998877', wa: '+91 9840998877', email: 'divya.sundaram.chn@gmail.com', gender: 'Female', dob: '2005-06-25',
        country: 'India', state: 'Tamil Nadu', city: 'Chennai', address: 'T. Nagar, Chennai',
        qual: '10+2 State Board', p10: 95.0, p12: 93.0, grad: null, exam: 'VITEEE', score: 'Rank 1200',
        course: 'B.Tech Computer Science & Engineering', uni: 'VIT Vellore', uni2: 'SRM Institute of Science and Technology',
        budget: '₹16L - ₹20L', scholarship: 1, source: 'Referral', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-27 13:00:00', c_id: 'c-4', c_name: 'Counselor 4 (Ananya Mishra)',
        status: 'Admission Confirmed', temp: 'HOT', last_contact: '2026-09-27', next_fup: null,
        remarks: 'Category 1 seat confirmed at VIT Vellore. Fee paid.'
      },
      {
        id: 'lead-27', lead_id: 'ES-2026-0027', name: 'Santosh Sharma', fn: 'Santosh', ln: 'Sharma',
        phone: '+977 9812233445', wa: '+977 9812233445', email: 'santosh.sharma.bwa@gmail.com', gender: 'Male', dob: '2004-07-07',
        country: 'Nepal', state: 'Lumbini', city: 'Bhairahawa', address: 'Siddharthanagar, Bhairahawa',
        qual: '+2 Science', p10: 72.0, p12: 68.0, grad: null, exam: 'NEB Science', score: '2.9 GPA',
        course: 'B.Tech Aeronautical Engineering', uni: 'Veltech University', uni2: 'Chandigarh University',
        budget: '₹8L - ₹10L', scholarship: 0, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Mechanical & Aeronautical', ad: 'Veltech Aerospace Lab & Placement', fb_id: 'fb-lead-9927',
        created_date: '2026-09-27 14:15:00', c_id: 'c-5', c_name: 'Counselor 5 (Roshan Shrestha)',
        status: 'Not Interested', temp: 'COLD', last_contact: '2026-09-27', next_fup: null,
        remarks: 'Decided to stay in Nepal and pursue Tribhuvan University BSc program.'
      },
      {
        id: 'lead-28', lead_id: 'ES-2026-0028', name: 'Megha Joshi', fn: 'Megha', ln: 'Joshi',
        phone: '+91 9823456789', wa: '+91 9823456789', email: 'megha.joshi.pune@gmail.com', gender: 'Female', dob: '2004-04-18',
        country: 'India', state: 'Maharashtra', city: 'Pune', address: 'Aundh, Pune',
        qual: '10+2 Maharashtra Board', p10: 87.0, p12: 85.0, grad: null, exam: 'SET / Symbiosis Entrance', score: 'Score 84/100',
        course: 'BBA (Dual Degree Option)', uni: 'Symbiosis International University', uni2: 'NMIMS Deemed-to-be-University',
        budget: '₹14L - ₹18L', scholarship: 0, source: 'Website', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-27 15:30:00', c_id: 'c-6', c_name: 'Counselor 6 (Sneha Sen)',
        status: 'Application Submitted', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-30',
        remarks: 'Application submitted on Symbiosis Pune portal. Interview round pending.'
      },
      {
        id: 'lead-29', lead_id: 'ES-2026-0029', name: 'Prashant Shah', fn: 'Prashant', ln: 'Shah',
        phone: '+977 9801456780', wa: '+977 9801456780', email: 'prashant.shah.ktm@gmail.com', gender: 'Male', dob: '2004-12-19',
        country: 'Nepal', state: 'Bagmati', city: 'Kathmandu', address: 'Maharajgunj, Kathmandu',
        qual: '+2 Science', p10: 91.0, p12: 88.5, grad: null, exam: 'JEE Main (Nepal)', score: '91 Percentile',
        course: 'B.Tech Computer Science & Engineering', uni: 'SRM Institute of Science and Technology', uni2: 'VIT Vellore',
        budget: '₹16L - ₹20L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Engineering Aspirants', ad: 'SRM Admissions 2026 Nepal', fb_id: 'fb-lead-9929',
        created_date: '2026-09-27 16:45:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'New Lead', temp: 'HOT', last_contact: null, next_fup: '2026-09-28',
        remarks: 'Wants admission into SRM CSE Main Campus with scholarship.'
      },
      {
        id: 'lead-30', lead_id: 'ES-2026-0030', name: 'Ayush Kothari', fn: 'Ayush', ln: 'Kothari',
        phone: '+91 9820567890', wa: '+91 9820567890', email: 'ayush.kothari.mum@gmail.com', gender: 'Male', dob: '2003-08-11',
        country: 'India', state: 'Maharashtra', city: 'Mumbai', address: 'Andheri East, Mumbai',
        qual: 'B.Com Graduate', p10: 84.0, p12: 83.0, grad: 76.0, exam: 'NMAT', score: '232 Score',
        course: 'MBA Core', uni: 'NMIMS Deemed-to-be-University', uni2: 'Symbiosis International University',
        budget: '₹20L - ₹25L', scholarship: 0, source: 'Meta Ads', campaign: 'Delhi NCR Walk-in & Education Expo',
        adset: 'MBA Aspirants', ad: 'NMIMS Mumbai MBA Final Call', fb_id: 'fb-lead-9930',
        created_date: '2026-09-27 17:30:00', c_id: 'c-6', c_name: 'Counselor 6 (Sneha Sen)',
        status: 'Admission Confirmed', temp: 'HOT', last_contact: '2026-09-27', next_fup: null,
        remarks: 'Admission confirmed for NMIMS Mumbai MBA Core. First installment paid.'
      },
      // 5 more leads to ensure 35+ total
      {
        id: 'lead-31', lead_id: 'ES-2026-0031', name: 'Saroj Baral', fn: 'Saroj', ln: 'Baral',
        phone: '+977 9801123499', wa: '+977 9801123499', email: 'saroj.baral.rbj@gmail.com', gender: 'Male', dob: '2005-02-28',
        country: 'Nepal', state: 'Madhesh', city: 'Rajbiraj', address: 'Tribhuvan Chowk, Rajbiraj',
        qual: '+2 Science', p10: 77.0, p12: 74.0, grad: null, exam: 'NEB Science', score: '3.15 GPA',
        course: 'B.Tech Computer Science & Engineering', uni: 'Chandigarh University', uni2: 'CMR University',
        budget: '₹8L - ₹10L', scholarship: 1, source: 'Facebook', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Science Students Grade 12', ad: 'CU Admissions Nepal', fb_id: 'fb-lead-9931',
        created_date: '2026-09-27 18:00:00', c_id: 'c-3', c_name: 'Counselor 3 (Bibek Thapa)',
        status: 'New Lead', temp: 'WARM', last_contact: null, next_fup: '2026-09-28',
        remarks: 'Submitted inquiry for Chandigarh University CSE.'
      },
      {
        id: 'lead-32', lead_id: 'ES-2026-0032', name: 'Ankita Ghosh', fn: 'Ankita', ln: 'Ghosh',
        phone: '+91 9811443322', wa: '+91 9811443322', email: 'ankita.ghosh.delhi@gmail.com', gender: 'Female', dob: '2005-11-15',
        country: 'India', state: 'Delhi', city: 'Delhi', address: 'Dwarka Sector 10, New Delhi',
        qual: '10+2 CBSE', p10: 89.0, p12: 88.0, grad: null, exam: 'CUET / Jain Entrance', score: 'Rank 620',
        course: 'BBA Corporate Aviation & Logistics', uni: 'Jain University', uni2: 'Symbiosis International University',
        budget: '₹10L - ₹14L', scholarship: 0, source: 'Google', campaign: 'Delhi NCR Walk-in & Education Expo',
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-27 18:45:00', c_id: 'c-2', c_name: 'Counselor 2 (Priya Patel)',
        status: 'Contacted', temp: 'WARM', last_contact: '2026-09-27', next_fup: '2026-09-29',
        remarks: 'Wants aviation management program in Bangalore.'
      },
      {
        id: 'lead-33', lead_id: 'ES-2026-0033', name: 'Sagar Kafle', fn: 'Sagar', ln: 'Kafle',
        phone: '+977 9845566778', wa: '+977 9845566778', email: 'sagar.kafle.bwa@gmail.com', gender: 'Male', dob: '2005-01-05',
        country: 'Nepal', state: 'Lumbini', city: 'Bhairahawa', address: 'Galla Mandi, Bhairahawa',
        qual: '+2 Science', p10: 80.0, p12: 76.5, grad: null, exam: 'NEB Science', score: '3.25 GPA',
        course: 'B.Tech AI & Machine Learning', uni: 'SRM Institute of Science and Technology', uni2: 'Veltech University',
        budget: '₹12L - ₹16L', scholarship: 1, source: 'WhatsApp', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-27 19:10:00', c_id: 'c-5', c_name: 'Counselor 5 (Roshan Shrestha)',
        status: 'Interested', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-28',
        remarks: 'Requested detailed syllabus and fee structure on WhatsApp.'
      },
      {
        id: 'lead-34', lead_id: 'ES-2026-0034', name: 'Ritu Bhattacharya', fn: 'Ritu', ln: 'Bhattacharya',
        phone: '+91 9845512399', wa: '+91 9845512399', email: 'ritu.bhatt.blr@gmail.com', gender: 'Female', dob: '2004-05-30',
        country: 'India', state: 'Karnataka', city: 'Bangalore', address: 'Koramangala, Bangalore',
        qual: '10+2 ISC', p10: 91.0, p12: 89.0, grad: null, exam: 'Portfolio & Aptitude', score: 'Top 10%',
        course: 'B.Des User Experience & Interaction', uni: 'CMR University', uni2: 'Jain University',
        budget: '₹12L - ₹15L', scholarship: 0, source: 'Referral', campaign: null,
        adset: null, ad: null, fb_id: null,
        created_date: '2026-09-27 19:30:00', c_id: 'c-4', c_name: 'Counselor 4 (Ananya Mishra)',
        status: 'Counseling Scheduled', temp: 'HOT', last_contact: '2026-09-27', next_fup: '2026-09-28',
        remarks: 'Meeting arranged at CMR design campus Bangalore tomorrow at 11 AM.'
      },
      {
        id: 'lead-35', lead_id: 'ES-2026-0035', name: 'Sunil Paswan', fn: 'Sunil', ln: 'Paswan',
        phone: '+977 9811990011', wa: '+977 9811990011', email: 'sunil.paswan.lhn@gmail.com', gender: 'Male', dob: '2004-10-10',
        country: 'Nepal', state: 'Madhesh', city: 'Lahan', address: 'Surunga Road, Lahan',
        qual: '+2 Management', p10: 70.0, p12: 67.0, grad: null, exam: 'NEB Board', score: '2.85 GPA',
        course: 'BBA (Honours)', uni: 'Chandigarh University', uni2: 'CMR University',
        budget: '₹5L - ₹7L', scholarship: 1, source: 'Meta Ads', campaign: 'Meta Nepal Admission Wave 2026',
        adset: 'Management Students', ad: 'CU Direct Admissions Nepal', fb_id: 'fb-lead-9935',
        created_date: '2026-09-27 20:00:00', c_id: 'c-1', c_name: 'Counselor 1 (Aarav Sharma)',
        status: 'Lost', temp: 'COLD', last_contact: '2026-09-27', next_fup: null,
        remarks: 'Budget constraints. Could not arrange accommodation deposit.'
      }
    ];

    for (const ld of demoLeads) {
      insertLead.run(
        ld.id, ld.lead_id, ld.name, ld.fn, ld.ln, ld.phone, ld.wa, ld.email, ld.gender, ld.dob,
        ld.country, ld.state, ld.city, ld.address, ld.qual, ld.p10, ld.p12, ld.grad,
        ld.exam, ld.score, ld.course, ld.uni, ld.uni2, ld.budget,
        ld.scholarship, ld.source, ld.campaign, ld.adset, ld.ad, ld.fb_id, ld.created_date,
        ld.c_id, ld.c_name, ld.status, ld.temp, ld.last_contact,
        ld.next_fup, ld.remarks,
        ld.status === 'Admission Confirmed' ? 1 : 0
      );
    }

    // 11. Followups (20+ demo follow-ups: overdue, today, upcoming, completed)
    const insertFollowup = db.prepare(`
      INSERT OR REPLACE INTO followups (
        id, lead_id, counselor_id, follow_up_date, follow_up_time, type, priority, notes, status, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const demoFollowups = [
      // Overdue
      ['fup-01', 'lead-03', 'c-3', '2026-09-25', '14:00', 'Call', 'HIGH', 'Urgent: Follow up on missing citizenship document', 'Pending', null],
      ['fup-02', 'lead-06', 'c-5', '2026-09-26', '11:00', 'Document Follow-up', 'HIGH', 'Check Veltech application form signature', 'Pending', null],
      ['fup-03', 'lead-16', 'c-1', '2026-09-26', '16:00', 'WhatsApp', 'MEDIUM', 'Second attempt outreach after phone switched off', 'Missed', null],

      // Today (2026-09-28)
      ['fup-04', 'lead-08', 'c-1', '2026-09-28', '10:30', 'Call', 'HIGH', 'First contact call with student regarding SRM CSE Nepal quota', 'Pending', null],
      ['fup-05', 'lead-09', 'c-3', '2026-09-28', '11:30', 'Meeting', 'HIGH', 'Online Google Meet counselling session with student & father', 'Pending', null],
      ['fup-06', 'lead-12', 'c-4', '2026-09-28', '12:00', 'WhatsApp', 'MEDIUM', 'Send BMS College engineering fee breakdown and hostel photos', 'Pending', null],
      ['fup-07', 'lead-14', 'c-6', '2026-09-28', '14:00', 'Fee Follow-up', 'HIGH', 'Remind NMIMS fee payment gateway closing date Oct 2', 'Pending', null],
      ['fup-08', 'lead-19', 'c-5', '2026-09-28', '16:00', 'Call', 'HIGH', 'Scheduled counselling call for SRM & CU B.Sc Nursing', 'Pending', null],
      ['fup-09', 'lead-20', 'c-2', '2026-09-28', '16:30', 'Call', 'MEDIUM', 'First contact call with Delhi student regarding CMR University', 'Pending', null],
      ['fup-10', 'lead-23', 'c-3', '2026-09-28', '17:00', 'Call', 'HIGH', 'New lead call: Biratnagar AI & ML inquiry', 'Pending', null],
      ['fup-11', 'lead-29', 'c-1', '2026-09-28', '17:30', 'WhatsApp', 'HIGH', 'Send SRM CSE brochure and 25% scholarship eligibility rules', 'Pending', null],
      ['fup-12', 'lead-31', 'c-3', '2026-09-28', '18:00', 'Call', 'MEDIUM', 'First contact call with Rajbiraj student', 'Pending', null],
      ['fup-13', 'lead-33', 'c-5', '2026-09-28', '18:30', 'WhatsApp', 'HIGH', 'Answer Bhairahawa student queries about hostel and AI curriculum', 'Pending', null],
      ['fup-14', 'lead-34', 'c-4', '2026-09-28', '19:00', 'Meeting', 'HIGH', 'Confirm Bangalore campus walk-in timing for tomorrow', 'Pending', null],

      // Upcoming
      ['fup-15', 'lead-02', 'c-1', '2026-09-29', '11:00', 'Fee Follow-up', 'HIGH', 'Follow up on Jain University registration fee slip', 'Pending', null],
      ['fup-16', 'lead-05', 'c-1', '2026-09-29', '15:00', 'Application Follow-up', 'HIGH', 'Initiate VIT online application submission with parents', 'Pending', null],
      ['fup-17', 'lead-07', 'c-5', '2026-09-29', '16:00', 'Call', 'MEDIUM', 'Discuss ACCA papers exemption list with Jain coordinator', 'Pending', null],
      ['fup-18', 'lead-13', 'c-6', '2026-09-29', '17:00', 'Application Follow-up', 'HIGH', 'Guide on Symbiosis offer letter acceptance portal', 'Pending', null],
      ['fup-19', 'lead-15', 'c-4', '2026-09-29', '17:30', 'Document Follow-up', 'HIGH', 'Verify SRMJEEE scorecard upload on SRM portal', 'Pending', null],

      // Completed
      ['fup-20', 'lead-01', 'c-1', '2026-09-27', '10:30', 'Call', 'HIGH', 'Congratulated student and briefed on SRM hostel allotment', 'Completed', '2026-09-27 10:45:00'],
      ['fup-21', 'lead-10', 'c-2', '2026-09-27', '11:15', 'Fee Follow-up', 'HIGH', 'Confirmed receipt of ₹50,000 VIT seat deposit', 'Completed', '2026-09-27 11:25:00'],
      ['fup-22', 'lead-11', 'c-2', '2026-09-27', '14:00', 'Meeting', 'HIGH', 'In-person meeting at Sector 94 office. Admission confirmed.', 'Completed', '2026-09-27 15:00:00']
    ];

    for (const f of demoFollowups) {
      insertFollowup.run(f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8], f[9]);
    }

    // 12. Converted Students (5 demo confirmed students preserving lead history)
    const insertStudent = db.prepare(`
      INSERT OR REPLACE INTO students (
        id, student_id, lead_id, student_name, phone, whatsapp_number, email, gender, date_of_birth,
        university, course, admission_date, application_id, fee_paid, counselor_id, counselor_name,
        source, city, country, academic_details, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const demoStudents = [
      ['stu-01', 'STU-2026-001', 'lead-01', 'Prabin Adhikari', '+977 9841234567', '+977 9841234567', 'prabin.adhikari@gmail.com', 'Male', '2005-04-12', 'SRM Institute of Science and Technology', 'B.Tech Computer Science & Engineering', '2026-09-27', 'app-01', 150000, 'c-1', 'Counselor 1 (Aarav Sharma)', 'Meta Ads', 'Kathmandu', 'Nepal', '10th: 88.5%, 12th: 84.0% (NEB Science)'],
      ['stu-02', 'STU-2026-002', 'lead-10', 'Karan Mehra', '+91 9811223344', '+91 9811223344', 'karan.mehra.delhi@gmail.com', 'Male', '2004-10-15', 'VIT Vellore', 'B.Tech Computer Science & Engineering', '2026-09-27', 'app-05', 180000, 'c-2', 'Counselor 2 (Priya Patel)', 'Google', 'Delhi', 'India', '10th: 92.0%, 12th: 89.5% (CBSE)'],
      ['stu-03', 'STU-2026-003', 'lead-11', 'Tanvi Saxena', '+91 9818877665', '+91 9818877665', 'tanvi.saxena.noida@gmail.com', 'Female', '2005-07-28', 'Symbiosis International University', 'BBA (Dual Degree Option)', '2026-09-27', 'app-06', 140000, 'c-2', 'Counselor 2 (Priya Patel)', 'Walk-in', 'Noida', 'India', '10th: 90.0%, 12th: 88.0% (ISC)'],
      ['stu-04', 'STU-2026-004', 'lead-26', 'Divya Sundaram', '+91 9840998877', '+91 9840998877', 'divya.sundaram.chn@gmail.com', 'Female', '2005-06-25', 'VIT Vellore', 'B.Tech Computer Science & Engineering', '2026-09-27', 'app-11', 175000, 'c-4', 'Counselor 4 (Ananya Mishra)', 'Referral', 'Chennai', 'India', '10th: 95.0%, 12th: 93.0% (State Board)'],
      ['stu-05', 'STU-2026-005', 'lead-30', 'Ayush Kothari', '+91 9820567890', '+91 9820567890', 'ayush.kothari.mum@gmail.com', 'Male', '2003-08-11', 'NMIMS Deemed-to-be-University', 'MBA Core', '2026-09-27', 'app-12', 250000, 'c-6', 'Counselor 6 (Sneha Sen)', 'Meta Ads', 'Mumbai', 'India', 'Graduation: 76.0%, NMAT 232']
    ];

    for (const s of demoStudents) {
      insertStudent.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], s[11], s[12], s[13], s[14], s[15], s[16], s[17], s[18], s[19]);
    }

    // 13. 12 Applications
    const insertApp = db.prepare(`
      INSERT OR REPLACE INTO applications (
        id, application_id, lead_id, student_id, student_name, university_id, university_name,
        course_id, course_name, application_date, application_status, application_fee,
        payment_status, application_number, deadline, counselor_id, counselor_name, remarks, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const demoApps = [
      ['app-01', 'APP-2026-001', 'lead-01', 'stu-01', 'Prabin Adhikari', 'uni-1', 'SRM Institute of Science and Technology', 'c-cse-srm', 'B.Tech Computer Science & Engineering', '2026-09-22', 'Admission Confirmed', 1200, 'Paid', 'SRM-26-8910', '2026-06-30', 'c-1', 'Counselor 1 (Aarav Sharma)', 'Confirmed seat with 25% merit scholarship'],
      ['app-02', 'APP-2026-002', 'lead-02', null, 'Shreya Sharma', 'uni-3', 'Jain University', 'c-bba-jain', 'BBA Corporate Aviation & Logistics', '2026-09-23', 'Offer Received', 1050, 'Paid', 'JAIN-26-4421', '2026-07-31', 'c-1', 'Counselor 1 (Aarav Sharma)', 'Offer letter issued. Fee confirmation pending.'],
      ['app-03', 'APP-2026-003', 'lead-04', null, 'Anjali Sah', 'uni-7', 'Chandigarh University', 'c-nurs-cu', 'B.Sc Nursing', '2026-09-24', 'Submitted', 1000, 'Paid', 'CU-26-7832', '2026-08-01', 'c-3', 'Counselor 3 (Bibek Thapa)', 'Docs submitted. Awaiting entrance evaluation.'],
      ['app-04', 'APP-2026-004', 'lead-06', null, 'Suman Thapa', 'uni-10', 'Veltech University', 'c-aero-vel', 'B.Tech Aeronautical Engineering', '2026-09-25', 'Application Started', 950, 'Unpaid', null, '2026-07-05', 'c-5', 'Counselor 5 (Roshan Shrestha)', 'Draft saved in Veltech university portal.'],
      ['app-05', 'APP-2026-005', 'lead-10', 'stu-02', 'Karan Mehra', 'uni-2', 'VIT Vellore', 'c-cse-vit', 'B.Tech Computer Science & Engineering', '2026-09-22', 'Admission Confirmed', 1350, 'Paid', 'VIT-26-1190', '2026-05-31', 'c-2', 'Counselor 2 (Priya Patel)', 'Category 2 seat confirmed. Admission slip received.'],
      ['app-06', 'APP-2026-006', 'lead-11', 'stu-03', 'Tanvi Saxena', 'uni-4', 'Symbiosis International University', 'c-bba-symb', 'BBA (Dual Degree Option)', '2026-09-23', 'Admission Confirmed', 2000, 'Paid', 'SYM-26-5512', '2026-05-15', 'c-2', 'Counselor 2 (Priya Patel)', 'SET merit seat secured.'],
      ['app-07', 'APP-2026-007', 'lead-13', null, 'Snehal Deshmukh', 'uni-4', 'Symbiosis International University', 'c-mba-symb', 'MBA Marketing & International Business', '2026-09-24', 'Offer Received', 2500, 'Paid', 'SIU-26-3390', '2026-04-30', 'c-6', 'Counselor 6 (Sneha Sen)', 'SNAP score 96% approved. Offer issued.'],
      ['app-08', 'APP-2026-008', 'lead-14', null, 'Varun Kulkarni', 'uni-5', 'NMIMS Deemed-to-be-University', 'c-bcom-nmims', 'B.Com Honours', '2026-09-25', 'Fee Pending', 2200, 'Paid', 'NM-26-9812', '2026-06-15', 'c-6', 'Counselor 6 (Sneha Sen)', 'Provisional admission offer released.'],
      ['app-09', 'APP-2026-009', 'lead-15', null, 'Pooja Subramanian', 'uni-1', 'SRM Institute of Science and Technology', 'c-aiml-srm', 'B.Tech AI & Machine Learning', '2026-09-26', 'Documents Pending', 1200, 'Paid', 'SRM-26-7741', '2026-06-30', 'c-4', 'Counselor 4 (Ananya Mishra)', 'SRMJEEE score verified. Transcripts pending.'],
      ['app-10', 'APP-2026-010', 'lead-22', null, 'Rahul Singhal', 'uni-1', 'SRM Institute of Science and Technology', 'c-cse-srm', 'B.Tech Computer Science & Engineering', '2026-09-27', 'Application Started', 1200, 'Paid', 'SRM-26-9041', '2026-06-30', 'c-2', 'Counselor 2 (Priya Patel)', 'Application fee paid. Profile verification.'],
      ['app-11', 'APP-2026-011', 'lead-26', 'stu-04', 'Divya Sundaram', 'uni-2', 'VIT Vellore', 'c-cse-vit', 'B.Tech Computer Science & Engineering', '2026-09-27', 'Admission Confirmed', 1350, 'Paid', 'VIT-26-2289', '2026-05-31', 'c-4', 'Counselor 4 (Ananya Mishra)', 'Category 1 seat confirmed.'],
      ['app-12', 'APP-2026-012', 'lead-30', 'stu-05', 'Ayush Kothari', 'uni-5', 'NMIMS Deemed-to-be-University', 'c-mba-nmims', 'MBA Core', '2026-09-27', 'Admission Confirmed', 2600, 'Paid', 'NM-26-1033', '2026-03-31', 'c-6', 'Counselor 6 (Sneha Sen)', 'NMIMS Mumbai MBA Core seat confirmed.']
    ];

    for (const a of demoApps) {
      insertApp.run(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16], a[17]);
    }

    // 14. Documents (sample uploaded docs)
    const insertDoc = db.prepare(`
      INSERT OR REPLACE INTO documents (
        id, lead_id, student_id, application_id, file_name, file_url, file_size, mime_type,
        document_type, verification_status, verification_notes, uploaded_by, upload_date, verified_by, verified_at, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const demoDocs = [
      ['doc-01', 'lead-01', 'stu-01', 'app-01', 'Prabin_10th_Marksheet.pdf', '/uploads/demo/prabin_10th.pdf', 245000, 'application/pdf', '10th Marksheet', 'Verified', 'Verified against NEB portal', 'Counselor 1 (Aarav Sharma)', '2026-09-22 10:00:00', 'Admin', '2026-09-22 14:00:00'],
      ['doc-02', 'lead-01', 'stu-01', 'app-01', 'Prabin_12th_Transcript.pdf', '/uploads/demo/prabin_12th.pdf', 312000, 'application/pdf', '12th Marksheet', 'Verified', 'Transcript valid and clear', 'Counselor 1 (Aarav Sharma)', '2026-09-22 10:05:00', 'Admin', '2026-09-22 14:05:00'],
      ['doc-03', 'lead-01', 'stu-01', 'app-01', 'Nepal_Citizenship_Front_Back.pdf', '/uploads/demo/prabin_citizenship.pdf', 540000, 'application/pdf', 'Citizenship', 'Verified', 'Original national ID verified', 'Counselor 1 (Aarav Sharma)', '2026-09-22 10:10:00', 'Admin', '2026-09-22 14:10:00'],
      ['doc-04', 'lead-01', 'stu-01', 'app-01', 'SRM_Offer_Letter_2026.pdf', '/uploads/demo/srm_offer_letter.pdf', 620000, 'application/pdf', 'Offer Letter', 'Verified', 'Official provisional admission letter', 'System', '2026-09-26 12:00:00', 'Admin', '2026-09-26 12:30:00'],
      ['doc-05', 'lead-03', null, null, 'Rohan_12th_Provisional.pdf', '/uploads/demo/rohan_12th.pdf', 210000, 'application/pdf', '12th Marksheet', 'Uploaded', 'Under verification', 'Counselor 3 (Bibek Thapa)', '2026-09-24 15:30:00', null, null],
      ['doc-06', 'lead-10', 'stu-02', 'app-05', 'Karan_CBSE_12th.pdf', '/uploads/demo/karan_12th.pdf', 180000, 'application/pdf', '12th Marksheet', 'Verified', 'DigiLocker verified copy', 'Counselor 2 (Priya Patel)', '2026-09-23 11:00:00', 'Admin', '2026-09-23 12:00:00'],
      ['doc-07', 'lead-11', 'stu-03', 'app-06', 'Tanvi_Aadhaar_Card.pdf', '/uploads/demo/tanvi_aadhaar.pdf', 320000, 'application/pdf', 'Aadhaar', 'Verified', 'Aadhaar verified', 'Counselor 2 (Priya Patel)', '2026-09-24 10:00:00', 'Admin', '2026-09-24 11:00:00'],
      ['doc-08', 'lead-14', null, 'app-08', 'Varun_Graduation_Sem6.pdf', '/uploads/demo/varun_grad.pdf', 450000, 'application/pdf', 'Graduation Marksheet', 'Verified', 'Mumbai University sem 6 marksheet', 'Counselor 6 (Sneha Sen)', '2026-09-25 12:00:00', 'Admin', '2026-09-25 14:00:00']
    ];

    for (const d of demoDocs) {
      insertDoc.run(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14]);
    }

    // 15. Notifications
    const insertNotif = db.prepare(`
      INSERT OR REPLACE INTO notifications (
        id, user_id, counselor_id, title, message, type, entity_type, entity_id, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const demoNotifications = [
      ['notif-01', null, 'c-1', 'New Lead Assigned', 'New Lead Prabin Adhikari from Kathmandu assigned via Round Robin.', 'NEW_LEAD', 'lead', 'lead-01', 1, '2026-09-20 10:15:00'],
      ['notif-02', null, 'c-3', 'Follow-up Overdue!', 'Call with Rohan Chaudhary regarding citizenship document is overdue.', 'FOLLOWUP_OVERDUE', 'followup', 'fup-01', 0, '2026-09-26 15:00:00'],
      ['notif-03', null, 'c-6', 'Payment Deadline Approaching', 'Varun Kulkarni NMIMS Mumbai offer fee deadline is Oct 2, 2026.', 'PAYMENT_PENDING', 'application', 'app-08', 0, '2026-09-27 09:00:00'],
      ['notif-04', null, 'c-1', 'Admission Confirmed 🎉', 'Prabin Adhikari admission confirmed at SRM Institute of Science and Technology.', 'ADMISSION_CONFIRMED', 'student', 'stu-01', 0, '2026-09-27 12:30:00'],
      ['notif-05', null, 'c-2', 'Today\'s Follow-ups Due', 'You have 3 follow-ups scheduled for today (Delhi NCR leads).', 'FOLLOWUP_DUE', 'counselor', 'c-2', 0, '2026-09-28 09:00:00']
    ];

    for (const n of demoNotifications) {
      insertNotif.run(n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[7], n[8], n[9]);
    }

    // 16. Audit Logs
    const insertAudit = db.prepare(`
      INSERT OR REPLACE INTO audit_logs (
        id, user_id, user_name, action, entity, entity_id, old_value, new_value, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const demoAudits = [
      ['aud-01', 'u-super', 'Bikash Karki', 'LEAD_CREATED', 'lead', 'lead-01', null, '{"student_name": "Prabin Adhikari", "lead_id": "ES-2026-0001"}', '192.168.1.10', '2026-09-20 10:15:00'],
      ['aud-02', 'u-super', 'Bikash Karki', 'COUNSELOR_ASSIGNED', 'lead', 'lead-01', null, '{"counselor": "Counselor 1 (Aarav Sharma)", "method": "Round Robin"}', '192.168.1.10', '2026-09-20 10:15:02'],
      ['aud-03', 'u-c1', 'Aarav Sharma', 'STATUS_CHANGED', 'lead', 'lead-01', '{"status": "New Lead"}', '{"status": "Contacted"}', '192.168.1.12', '2026-09-21 11:00:00'],
      ['aud-04', 'u-c1', 'Aarav Sharma', 'APPLICATION_CREATED', 'application', 'app-01', null, '{"university": "SRM", "course": "B.Tech CSE"}', '192.168.1.12', '2026-09-22 10:00:00'],
      ['aud-05', 'u-c1', 'Aarav Sharma', 'ADMISSION_CONFIRMED', 'lead', 'lead-01', '{"status": "Fee Paid"}', '{"status": "Admission Confirmed", "student_id": "STU-2026-001"}', '192.168.1.12', '2026-09-27 12:30:00'],
      ['aud-06', 'u-super', 'Bikash Karki', 'INTEGRATION_UPDATE', 'integration', 'int-meta', '{"status": "NOT CONNECTED"}', '{"status": "NOT CONNECTED", "checked": true}', '192.168.1.10', '2026-09-27 18:00:00']
    ];

    for (const a of demoAudits) {
      insertAudit.run(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9]);
    }

    // 17. Sample Lead Activities for lead-01 (Timeline demonstration)
    const insertAct = db.prepare(`
      INSERT OR REPLACE INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const lead01Acts = [
      ['act-01', 'lead-01', 'Counselor Assignment', 'Lead Assigned to Aarav Sharma', 'Assigned via Round Robin allocation engine', 'System Automation', '2026-09-20 10:15:00'],
      ['act-02', 'lead-01', 'WhatsApp', 'Welcome Message Sent', 'Automated welcome WhatsApp message queued & sent with counselor contact info', 'WhatsApp Automation', '2026-09-20 10:15:05'],
      ['act-03', 'lead-01', 'Phone Call', 'First Contact Call Completed', 'Called student. Prabin is interested in SRM B.Tech CSE Kattankulathur campus. Explained entrance & scholarship options.', 'Counselor 1 (Aarav Sharma)', '2026-09-21 11:30:00'],
      ['act-04', 'lead-01', 'Meeting', 'Counselling Session with Parents', 'Conducted 30-min Zoom session with Prabin and father. Reviewed curriculum, hostel amenities, and total estimated budget.', 'Counselor 1 (Aarav Sharma)', '2026-09-22 15:00:00'],
      ['act-05', 'lead-01', 'Document Upload', 'Academic Documents Uploaded', 'Received and uploaded 10th marksheet, 12th transcript, and Nepal citizenship.', 'Counselor 1 (Aarav Sharma)', '2026-09-23 10:20:00'],
      ['act-06', 'lead-01', 'Application Update', 'SRM University Application Filed', 'Application APP-2026-001 submitted to SRM international admissions office.', 'Counselor 1 (Aarav Sharma)', '2026-09-24 12:00:00'],
      ['act-07', 'lead-01', 'Status Change', 'Offer Letter Received', 'Provisional admission offer received from SRM with 25% merit scholarship approval.', 'Counselor 1 (Aarav Sharma)', '2026-09-26 14:00:00'],
      ['act-08', 'lead-01', 'Payment Update', 'Advance Seat Fee Paid', 'Advance fee ₹1,50,000 paid by family via bank wire transfer.', 'Counselor 1 (Aarav Sharma)', '2026-09-27 11:00:00'],
      ['act-09', 'lead-01', 'Status Change', 'Admission Confirmed -> Converted to Student', 'Lead converted to formal student record STU-2026-001. All records archived.', 'System Automation', '2026-09-27 12:30:00']
    ];

    for (const la of lead01Acts) {
      insertAct.run(la[0], la[1], la[2], la[3], la[4], la[5], la[6]);
    }
  });

  runTx();
  console.log('✅ Demo database seeded successfully with 35 leads, 6 counselors, 10 universities, 20 courses, and complete CRM data!');
}

// If run directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
