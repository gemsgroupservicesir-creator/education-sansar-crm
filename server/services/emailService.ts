import { db } from '../db/database.ts';
import { logAudit } from '../db/database.ts';

export interface EmailTemplatePayload {
  id?: string;
  name: string;
  category: string;
  subject: string;
  content: string;
  target_courses?: string[];
  target_universities?: string[];
  description?: string;
  channel?: 'Email' | 'WhatsApp' | 'SMS';
  is_active?: number;
}

export interface BulkSendParams {
  campaign_name?: string;
  template_id?: string;
  subject: string;
  content: string;
  filter_course?: string;
  filter_university?: string;
  filter_status?: string;
  filter_temperature?: string;
  filter_city?: string;
  filter_counselor_id?: string;
  sent_by?: string;
}

/**
 * Replaces dynamic variables like {{student_name}}, {{preferred_course}}, etc.
 */
export function resolveMergeTags(text: string, vars: Record<string, any>): string {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{{${key}}}`;
  });
}

/**
 * Get all email templates with optional course / university matching
 */
export function getEmailTemplates(filters?: { course?: string; university?: string; category?: string }): any[] {
  let query = "SELECT * FROM message_templates WHERE is_active = 1 AND (channel = 'Email' OR channel IS NULL OR channel = '')";
  const params: any[] = [];

  if (filters?.category) {
    query += " AND category = ?";
    params.push(filters.category);
  }

  query += " ORDER BY created_at DESC";
  const allTemplates = db.prepare(query).all(...params) as any[];

  return allTemplates.map(t => {
    let targetCourses: string[] = [];
    let targetUnis: string[] = [];
    let variables: string[] = [];

    try { targetCourses = JSON.parse(t.target_courses || '[]'); } catch { targetCourses = []; }
    try { targetUnis = JSON.parse(t.target_universities || '[]'); } catch { targetUnis = []; }
    try { variables = JSON.parse(t.variables || '[]'); } catch { variables = []; }

    const isCourseMatch = !filters?.course || targetCourses.length === 0 || targetCourses.some(c => 
      filters.course!.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(filters.course!.toLowerCase())
    );

    const isUniMatch = !filters?.university || targetUnis.length === 0 || targetUnis.some(u => 
      filters.university!.toLowerCase().includes(u.toLowerCase()) || u.toLowerCase().includes(filters.university!.toLowerCase())
    );

    return {
      ...t,
      target_courses: targetCourses,
      target_universities: targetUnis,
      variables,
      is_recommended: Boolean(filters?.course || filters?.university) && isCourseMatch && isUniMatch && (targetCourses.length > 0 || targetUnis.length > 0)
    };
  });
}

/**
 * Create or update an email template
 */
export function saveEmailTemplate(payload: EmailTemplatePayload, performedBy = 'Super Admin'): any {
  const now = new Date().toISOString();
  const id = payload.id || 'tmpl-email-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const coursesJson = JSON.stringify(payload.target_courses || []);
  const unisJson = JSON.stringify(payload.target_universities || []);
  const channel = payload.channel || 'Email';

  // Extract variables automatically from content and subject
  const combined = (payload.subject || '') + ' ' + (payload.content || '');
  const foundVars = Array.from(new Set(Array.from(combined.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map(m => m[1])));

  const existing = payload.id ? db.prepare('SELECT id FROM message_templates WHERE id = ?').get(payload.id) : null;

  if (existing) {
    db.prepare(`
      UPDATE message_templates
      SET name = ?, category = ?, subject = ?, content = ?,
          variables = ?, target_courses = ?, target_universities = ?,
          description = ?, is_active = COALESCE(?, is_active), updated_at = ?
      WHERE id = ?
    `).run(
      payload.name,
      payload.category,
      payload.subject,
      payload.content,
      JSON.stringify(foundVars),
      coursesJson,
      unisJson,
      payload.description || '',
      payload.is_active,
      now,
      id
    );
  } else {
    db.prepare(`
      INSERT INTO message_templates (
        id, name, channel, category, subject, content, variables,
        target_courses, target_universities, description, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      payload.name,
      channel,
      payload.category,
      payload.subject,
      payload.content,
      JSON.stringify(foundVars),
      coursesJson,
      unisJson,
      payload.description || '',
      now,
      now
    );
  }

  logAudit({
    userName: performedBy,
    action: payload.id ? 'EMAIL_TEMPLATE_UPDATED' : 'EMAIL_TEMPLATE_CREATED',
    entity: 'message_template',
    entityId: id,
    newValue: { name: payload.name, category: payload.category }
  });

  return db.prepare('SELECT * FROM message_templates WHERE id = ?').get(id);
}

/**
 * Delete email template
 */
export function deleteEmailTemplate(id: string, performedBy = 'Super Admin'): boolean {
  db.prepare('DELETE FROM message_templates WHERE id = ?').run(id);
  logAudit({
    userName: performedBy,
    action: 'EMAIL_TEMPLATE_DELETED',
    entity: 'message_template',
    entityId: id
  });
  return true;
}

/**
 * Preview template resolution for a specific lead or test student
 */
export function previewEmailResolution(subject: string, content: string, sampleData?: Record<string, any>): { subject: string; content: string } {
  const fallbackData: Record<string, any> = {
    student_name: 'Bikram Thapa',
    first_name: 'Bikram',
    phone: '+977 9801234567',
    email: 'bikram.thapa@example.com',
    preferred_course: 'B.Tech Computer Science & Engineering',
    preferred_university: 'Sharda University',
    city: 'Kathmandu',
    counselor_name: 'Suman Sharma',
    counselor_email: 'counselor@educationsansar.com',
    counselor_phone: '+977 9801122334',
    application_id: 'APP-2026-0812',
    deadline: '15th November 2026',
    portal_url: 'https://education-sansar-crm.vercel.app',
    company_name: 'Education Sansar',
    year: '2026'
  };

  const mergeData = { ...fallbackData, ...(sampleData || {}) };
  return {
    subject: resolveMergeTags(subject, mergeData),
    content: resolveMergeTags(content, mergeData)
  };
}

/**
 * Filter matching leads for bulk email sending
 */
export function getTargetLeadsForBulkEmail(filters: {
  filter_course?: string;
  filter_university?: string;
  filter_status?: string;
  filter_temperature?: string;
  filter_city?: string;
  filter_counselor_id?: string;
}): any[] {
  let query = `
    SELECT l.*, c.name as counselor_name, c.email as counselor_email, c.phone as counselor_phone
    FROM leads l
    LEFT JOIN counselors c ON l.assigned_counselor_id = c.id
    WHERE l.is_deleted = 0 AND l.email IS NOT NULL AND trim(l.email) != ''
  `;
  const params: any[] = [];

  if (filters.filter_course && filters.filter_course.trim()) {
    query += " AND LOWER(l.preferred_course) LIKE ?";
    params.push(`%${filters.filter_course.trim().toLowerCase()}%`);
  }

  if (filters.filter_university && filters.filter_university.trim()) {
    query += " AND LOWER(l.preferred_university) LIKE ?";
    params.push(`%${filters.filter_university.trim().toLowerCase()}%`);
  }

  if (filters.filter_status && filters.filter_status.trim()) {
    query += " AND l.lead_status = ?";
    params.push(filters.filter_status.trim());
  }

  if (filters.filter_temperature && filters.filter_temperature.trim()) {
    query += " AND l.lead_temperature = ?";
    params.push(filters.filter_temperature.trim());
  }

  if (filters.filter_city && filters.filter_city.trim()) {
    query += " AND LOWER(l.city) LIKE ?";
    params.push(`%${filters.filter_city.trim().toLowerCase()}%`);
  }

  if (filters.filter_counselor_id && filters.filter_counselor_id.trim()) {
    query += " AND l.assigned_counselor_id = ?";
    params.push(filters.filter_counselor_id.trim());
  }

  query += " ORDER BY l.created_at DESC";
  return db.prepare(query).all(...params);
}

/**
 * Execute Bulk Email Sending
 */
export function sendBulkEmailCampaign(params: BulkSendParams): {
  campaign_id: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  sample_previews: any[];
} {
  const targetLeads = getTargetLeadsForBulkEmail(params);
  const campaignId = 'camp-bulk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  let sentCount = 0;
  let failedCount = 0;
  const samplePreviews: any[] = [];

  const insertMsg = db.prepare(`
    INSERT INTO messages (id, lead_id, channel, recipient, sender, template_id, content, status, metadata, sent_at)
    VALUES (?, ?, 'Email', ?, ?, ?, ?, 'Sent', ?, ?)
  `);

  const insertLeadActivity = db.prepare(`
    INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, created_at)
    VALUES (?, ?, 'EMAIL_SENT', ?, ?, ?, ?)
  `);

  const runDispatch = db.transaction(() => {
    for (const lead of targetLeads) {
      try {
        const studentName = lead.student_name || lead.first_name || 'Student';
        const firstName = lead.first_name || studentName.split(' ')[0];

        const mergeVars: Record<string, any> = {
          student_name: studentName,
          first_name: firstName,
          phone: lead.phone,
          email: lead.email,
          preferred_course: lead.preferred_course || 'Chosen Program',
          preferred_university: lead.preferred_university || 'Partner University',
          city: lead.city || 'Nepal',
          counselor_name: lead.counselor_name || 'Education Sansar Advisor',
          counselor_email: lead.counselor_email || 'admissions@educationsansar.com',
          counselor_phone: lead.counselor_phone || '+91 98100 12345',
          application_id: 'APP-' + lead.id.substring(0, 8).toUpperCase(),
          deadline: '30th November 2026',
          portal_url: 'https://education-sansar-crm.vercel.app',
          company_name: 'Education Sansar',
          year: '2026'
        };

        const resolvedSubject = resolveMergeTags(params.subject, mergeVars);
        const resolvedBody = resolveMergeTags(params.content, mergeVars);

        const msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const metadata = JSON.stringify({
          subject: resolvedSubject,
          campaign_id: campaignId,
          course: lead.preferred_course,
          university: lead.preferred_university
        });

        insertMsg.run(
          msgId,
          lead.id,
          lead.email,
          params.sent_by || 'Education Sansar Admissions',
          params.template_id || null,
          resolvedBody,
          metadata,
          now
        );

        const actId = 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        insertLeadActivity.run(
          actId,
          lead.id,
          `Bulk Email Sent: ${resolvedSubject}`,
          `Personalized course outreach sent to ${lead.email}`,
          params.sent_by || 'Super Admin',
          now
        );

        sentCount++;
        if (samplePreviews.length < 3) {
          samplePreviews.push({
            student_name: studentName,
            email: lead.email,
            course: lead.preferred_course,
            university: lead.preferred_university,
            subject: resolvedSubject,
            content_snippet: resolvedBody.substring(0, 150) + '...'
          });
        }
      } catch (err: any) {
        failedCount++;
      }
    }

    // Save campaign record
    db.prepare(`
      INSERT INTO bulk_email_campaigns (
        id, name, template_id, subject, content,
        filter_course, filter_university, filter_status, filter_temperature,
        total_recipients, sent_count, failed_count, status, sent_by, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)
    `).run(
      campaignId,
      params.campaign_name || `Bulk Outreach - ${params.filter_course || 'All Courses'} (${targetLeads.length} leads)`,
      params.template_id || null,
      params.subject,
      params.content,
      params.filter_course || null,
      params.filter_university || null,
      params.filter_status || null,
      params.filter_temperature || null,
      targetLeads.length,
      sentCount,
      failedCount,
      params.sent_by || 'Super Admin',
      now
    );

    logAudit({
      userName: params.sent_by || 'Super Admin',
      action: 'BULK_EMAIL_SENT',
      entity: 'bulk_email_campaign',
      entityId: campaignId,
      newValue: {
        total_recipients: targetLeads.length,
        course_filter: params.filter_course,
        university_filter: params.filter_university
      }
    });
  });

  runDispatch();

  return {
    campaign_id: campaignId,
    total_recipients: targetLeads.length,
    sent_count: sentCount,
    failed_count: failedCount,
    sample_previews: samplePreviews
  };
}

/**
 * Get history of bulk email dispatches
 */
export function getBulkEmailCampaigns(): any[] {
  return db.prepare('SELECT * FROM bulk_email_campaigns ORDER BY created_at DESC LIMIT 50').all();
}

/**
 * Ensure pre-seeded course and university email templates exist
 */
export function ensureInitialCourseEmailTemplatesSeed() {
  const existingCount = (db.prepare("SELECT count(*) as count FROM message_templates WHERE channel = 'Email'").get() as { count: number }).count;
  if (existingCount > 0) return;

  const templates: EmailTemplatePayload[] = [
    {
      id: 'tmpl-btech-sharda',
      name: 'B.Tech Engineering Admission Offer & Scholarship (Sharda & Chandigarh)',
      category: 'COURSE_PROSPECTUS',
      channel: 'Email',
      subject: 'Admission Offer: B.Tech Engineering & Exclusive Scholarship for {{student_name}}',
      description: 'Course prospectus and up to 50% scholarship notice for engineering aspirants',
      target_courses: ['B.Tech', 'BE', 'BCA', 'Computer Science', 'Data Science', 'AI', 'Robotics'],
      target_universities: ['Sharda University', 'Chandigarh University', 'Parul University'],
      content: `Dear {{student_name}},

Namaste! Greetings from Education Sansar.

We have reviewed your profile and academic interests for {{preferred_course}} at {{preferred_university}}. Based on your academic background, you qualify for an Exclusive Nepal Merit Scholarship (up to 50% tuition fee waiver) for the 2026 Academic Batch.

Key Program Highlights:
- Program: {{preferred_course}}
- Target Campus: {{preferred_university}}
- Hands-on Labs & International Faculty
- Dedicated Nepal Student Hostels & Fooding
- 100% Placement Assistance with top tech conglomerates

Next Steps for Seat Confirmation:
1. Review the attached digital curriculum brochure and fee structure.
2. Submit your pending 10th and 12th marksheets before {{deadline}}.
3. Your dedicated counselor is {{counselor_name}} (Phone/WhatsApp: {{counselor_phone}}, Email: {{counselor_email}}).

Feel free to reply directly to this email or connect with your advisor on WhatsApp.

Warm Regards,
{{counselor_name}}
Senior Admissions Advisor
Education Sansar | Sector 94, Noida
Hotline: +91 98100 12345 / +977 98012 34567`
    },
    {
      id: 'tmpl-mbbs-medical',
      name: 'MBBS & Health Sciences Direct Admission Briefing',
      category: 'COURSE_PROSPECTUS',
      channel: 'Email',
      subject: 'Medical Admissions 2026: {{preferred_course}} Guidance & Eligibility Notice for {{student_name}}',
      description: 'Comprehensive medical, dental, and nursing admissions guidance',
      target_courses: ['MBBS', 'BDS', 'B.Sc Nursing', 'Pharmacy', 'BAMS', 'MD'],
      target_universities: ['Parul University', 'Sharda University', 'Graphic Era University'],
      content: `Dear {{student_name}},

Congratulations on taking the first step toward your medical career!

We are pleased to guide you regarding admissions for {{preferred_course}} at {{preferred_university}}. As an authorized recruitment partner, Education Sansar assists you through NMC / WHO recognized institutions with clinical hospital training.

Essential Admission Overview:
- Course: {{preferred_course}}
- University: {{preferred_university}}
- Eligibility: Minimum 50% in PCB with valid NEET / Entrance score
- Clinical Rotation: 1000+ Bed Multi-specialty Teaching Hospital
- Separate AC/Non-AC Student Hostels with 24/7 security

Your Application Details:
Application ID: {{application_id}}
Assigned Advisor: {{counselor_name}} (Phone: {{counselor_phone}})

Please reply with your latest academic transcripts and NEET scorecard to finalize your provisional seat reservation.

Best Wishes,
Medical Admissions Advisory Board
Education Sansar`
    },
    {
      id: 'tmpl-mba-business',
      name: 'MBA & Executive Management Fast-Track Admission',
      category: 'COURSE_PROSPECTUS',
      channel: 'Email',
      subject: 'Fast-Track MBA Admission & Corporate Mentorship at {{preferred_university}}',
      description: 'Industry-integrated MBA and BBA prospectus with corporate placement track',
      target_courses: ['MBA', 'BBA', 'PGDM', 'Finance', 'Marketing'],
      target_universities: ['Chandigarh University', 'Sharda University', 'Parul University'],
      content: `Dear {{student_name}},

Accelerate your leadership journey with our premier business management offerings.

Regarding your interest in {{preferred_course}} at {{preferred_university}}:
We are pleased to invite you to our virtual one-on-one counseling session. This program features industry capstone projects, global immersion tours, and corporate internships with top tier firms.

Program Snapshot:
- Focus: {{preferred_course}}
- Partner Institution: {{preferred_university}}
- Merit Scholarships available based on graduation CGPA
- Application Deadline: {{deadline}}

Connect with your personal counselor {{counselor_name}} ({{counselor_phone}}) or reply to schedule your 15-minute consultation.

Sincerely,
Admissions Directorate
Education Sansar`
    },
    {
      id: 'tmpl-fee-deadline',
      name: 'Provisional Seat Confirmation & Fee Deposit Reminder',
      category: 'FEE_REMINDER',
      channel: 'Email',
      subject: 'Important: Provisional Seat Confirmation for {{preferred_course}} - Deadline Approaching',
      description: 'Reminds student to complete registration / semester fee before deadline',
      target_courses: [],
      target_universities: [],
      content: `Dear {{student_name}},

This is an urgent reminder regarding your provisional admission for {{preferred_course}} at {{preferred_university}}.

Your provisional admission offer has been processed. To prevent forfeiture of your allotted seat and scholarship tier, please complete the seat confirmation deposit before {{deadline}}.

Payment Modes Accepted:
- Direct Bank Transfer / NEFT / RTGS
- eSewa / Khalti / ConnectIPS (Nepal Students)
- Official University Fee Portal

If you have already transferred the fee, please share the deposit voucher with {{counselor_name}} ({{counselor_email}}) for instant reconciliation.

Sincerely,
Accounts & Student Services
Education Sansar`
    }
  ];

  for (const t of templates) {
    saveEmailTemplate(t, 'System');
  }
}
