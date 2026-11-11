import { db, createNotification, logLeadActivity } from '../db/database.ts';
import { sendWhatsAppMessage } from './integrationService.ts';
import { sendDirectEmail } from './emailService.ts';
import type { Lead } from '../types/index.ts';

export interface AISettings {
  ai_auto_whatsapp_enabled: boolean;
  ai_auto_email_enabled: boolean;
  ai_sales_tone: string;
  ai_model: string;
  ai_custom_instructions: string;
  gemini_api_key?: string;
  is_gemini_active: boolean;
  company_name: string;
  company_phone: string;
  company_email: string;
}

export interface CounselorProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  specialization?: string;
}

export interface AIOutreachResult {
  success: boolean;
  whatsappSent: boolean;
  emailSent: boolean;
  whatsappMessage?: string;
  emailSubject?: string;
  emailBody?: string;
  counselorName: string;
  error?: string;
  mode: 'Gemini Generative' | 'Admission Sales Engine';
}

export interface LeadScoreInsight {
  score: number; // 0 - 100
  winProbability: 'HIGH' | 'MEDIUM' | 'LOW';
  temperature: 'HOT' | 'WARM' | 'COLD';
  keyDrivers: string[];
  recommendedAction: string;
  suggestedUniversities: Array<{
    name: string;
    city: string;
    course_name?: string;
    annual_tuition?: string;
    scholarship_potential?: string;
  }>;
}

/**
 * Retrieve current AI & Sales settings
 */
export function getAISettings(): AISettings {
  const getVal = (key: string, def: string) => {
    try {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
      return row ? row.value : def;
    } catch {
      return def;
    }
  };

  const storedKey = getVal('gemini_api_key', '');
  const envKey = process.env.GEMINI_API_KEY || '';
  const effectiveKey = storedKey || envKey;

  return {
    ai_auto_whatsapp_enabled: getVal('ai_auto_whatsapp_enabled', 'true') === 'true',
    ai_auto_email_enabled: getVal('ai_auto_email_enabled', 'true') === 'true',
    ai_sales_tone: getVal('ai_sales_tone', 'Empathetic & Highly Persuasive'),
    ai_model: getVal('ai_model', 'gemini-2.5-flash'),
    ai_custom_instructions: getVal('ai_custom_instructions', ''),
    gemini_api_key: effectiveKey ? `${effectiveKey.slice(0, 6)}...${effectiveKey.slice(-4)}` : undefined,
    is_gemini_active: Boolean(effectiveKey),
    company_name: getVal('company_name', 'Gems Group Services'),
    company_phone: getVal('company_phone', '+977 9801234567'),
    company_email: getVal('company_email', 'admissions@gemsgroupservices.com')
  };
}

/**
 * Update AI settings in the database
 */
export function updateAISettings(updates: Partial<AISettings> & { raw_gemini_api_key?: string }): AISettings {
  const upsert = (key: string, val: string, desc: string) => {
    db.prepare(`
      INSERT INTO settings (key, value, description, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).run(key, val, desc);
  };

  if (updates.ai_auto_whatsapp_enabled !== undefined) {
    upsert('ai_auto_whatsapp_enabled', updates.ai_auto_whatsapp_enabled ? 'true' : 'false', 'Enable automatic AI WhatsApp outreach on new lead addition');
  }
  if (updates.ai_auto_email_enabled !== undefined) {
    upsert('ai_auto_email_enabled', updates.ai_auto_email_enabled ? 'true' : 'false', 'Enable automatic AI Email outreach on new lead addition');
  }
  if (updates.ai_sales_tone) {
    upsert('ai_sales_tone', updates.ai_sales_tone, 'Tone and style used by AI Sales Agent');
  }
  if (updates.ai_model) {
    upsert('ai_model', updates.ai_model, 'AI Model for smart generative sales responses');
  }
  if (updates.ai_custom_instructions !== undefined) {
    upsert('ai_custom_instructions', updates.ai_custom_instructions, 'Custom counseling rules and guidelines for AI');
  }
  if (updates.raw_gemini_api_key !== undefined) {
    upsert('gemini_api_key', updates.raw_gemini_api_key.trim(), 'Google Gemini API Key for AI Copilot & Generative Outreach');
  }

  return getAISettings();
}

/**
 * Call Gemini REST API directly with timeout
 */
async function callGeminiApi(prompt: string, systemInstruction?: string): Promise<string | null> {
  const rawKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get() as { value: string } | undefined;
  const apiKey = (rawKeyRow?.value || process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey) return null;

  const modelRow = db.prepare("SELECT value FROM settings WHERE key = 'ai_model'").get() as { value: string } | undefined;
  const model = modelRow?.value || 'gemini-2.5-flash';

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const payload: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Gemini API Error ${res.status}]`, errText);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[Gemini Call Failed - Using Smart Fallback]', err.message);
    return null;
  }
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection(keyToTest?: string): Promise<{ success: boolean; model: string; message: string; latencyMs: number }> {
  let apiKey = keyToTest?.trim();
  if (!apiKey) {
    const rawKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").get() as { value: string } | undefined;
    apiKey = (rawKeyRow?.value || process.env.GEMINI_API_KEY || '').trim();
  }

  if (!apiKey) {
    return {
      success: false,
      model: 'None',
      message: 'No Gemini API key provided. Please paste a valid Gemini API key.',
      latencyMs: 0
    };
  }

  const model = 'gemini-2.5-flash';
  const t0 = Date.now();

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Respond with the word "CONNECTED" only.' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });

    const latencyMs = Date.now() - t0;

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return {
        success: false,
        model,
        message: errBody.error?.message || `HTTP ${res.status} error connecting to Gemini API`,
        latencyMs
      };
    }

    return {
      success: true,
      model,
      message: 'Gemini AI connection successful! Ready for generative outreach & sales copilot.',
      latencyMs
    };
  } catch (err: any) {
    return {
      success: false,
      model,
      message: err.message || 'Network error connecting to Google Gemini API',
      latencyMs: Date.now() - t0
    };
  }
}

/**
 * Resolve counselor details assigned to this lead
 */
export function resolveCounselorProfile(lead: Partial<Lead>): CounselorProfile {
  let counselor: any = null;

  if (lead.assigned_counselor_id) {
    counselor = db.prepare('SELECT * FROM counselors WHERE id = ?').get(lead.assigned_counselor_id);
    if (!counselor) {
      counselor = db.prepare('SELECT * FROM users WHERE id = ?').get(lead.assigned_counselor_id);
    }
  }

  if (!counselor && lead.assigned_counselor_name) {
    counselor = db.prepare('SELECT * FROM counselors WHERE name = ?').get(lead.assigned_counselor_name);
    if (!counselor) {
      counselor = db.prepare('SELECT * FROM users WHERE name = ?').get(lead.assigned_counselor_name);
    }
  }

  if (!counselor) {
    // Pick first active counselor or admin
    counselor = db.prepare("SELECT * FROM counselors WHERE is_active = 1 LIMIT 1").get() as any
      || db.prepare("SELECT * FROM users WHERE role IN ('Counselor', 'Admin', 'Super Admin') AND is_active = 1 LIMIT 1").get() as any;
  }

  const defaultPhone = '+977 9801234567';
  const defaultEmail = 'admissions@gemsgroupservices.com';

  return {
    id: counselor?.id || 'counselor-default',
    name: counselor?.name || lead.assigned_counselor_name || 'Prakash Yadav',
    email: counselor?.email || defaultEmail,
    phone: counselor?.phone || defaultPhone,
    designation: counselor?.designation || counselor?.role || 'Senior Academic Counselor',
    specialization: counselor?.specialization_country || 'India & Nepal Higher Education'
  };
}

/**
 * Generate personalized welcome WhatsApp & Email messages on behalf of counselor
 */
export async function generateWelcomeOutreach(
  lead: Partial<Lead>,
  counselorParam?: CounselorProfile
): Promise<{
  whatsappMessage: string;
  emailSubject: string;
  emailHtml: string;
  emailText: string;
  mode: 'Gemini Generative' | 'Admission Sales Engine';
}> {
  const counselor = counselorParam || resolveCounselorProfile(lead);
  const studentName = lead.student_name || lead.first_name || 'Student';
  const firstName = lead.first_name || studentName.split(' ')[0];
  const course = lead.preferred_course && lead.preferred_course !== 'Not Specified' ? lead.preferred_course : 'Higher Education & Degree Program';
  const university = lead.preferred_university && lead.preferred_university !== 'Not Specified' ? lead.preferred_university : 'top accredited partner universities in India';
  const city = lead.city || 'Nepal';

  // 1. Try Gemini Generative outreach if configured
  const sysPrompt = `You are ${counselor.name}, ${counselor.designation} at Gems Group Services (Education Sansar). 
You are writing a warm, highly persuasive personal welcome message to a new student lead (${studentName} from ${city}) who inquired about ${course} at ${university}.
Your goal is to build immediate trust, explain exclusive Nepal merit scholarships (up to 40-50%), and get the student to reply or schedule a 5-minute call today.
Always sign off with your name (${counselor.name}), designation, and phone (${counselor.phone}).`;

  const geminiPrompt = `Write two outreach messages:
1. WHATSAPP_MESSAGE: A friendly, concise, emoji-formatted WhatsApp message (under 160 words).
2. EMAIL_SUBJECT: A high-open-rate subject line.
3. EMAIL_BODY: A professional, clear email body explaining the scholarship process, university fee breakdown, and call to action.

Return in JSON format:
{
  "whatsapp": "...",
  "emailSubject": "...",
  "emailBody": "..."
}`;

  const geminiResponse = await callGeminiApi(geminiPrompt, sysPrompt);

  if (geminiResponse) {
    try {
      const cleanJson = geminiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.whatsapp && parsed.emailSubject && parsed.emailBody) {
        return {
          whatsappMessage: parsed.whatsapp,
          emailSubject: parsed.emailSubject,
          emailHtml: formatEmailHtml(parsed.emailSubject, parsed.emailBody, counselor),
          emailText: parsed.emailBody,
          mode: 'Gemini Generative'
        };
      }
    } catch {}
  }

  // 2. Deterministic High-Conversion Admission Sales Engine Fallback
  const whatsappMessage = `Namaste ${firstName}! 🙏

I am *${counselor.name}*, your dedicated Academic Counselor at *Gems Group Services*. 🎓

I saw your recent inquiry for *${course}* at *${university}*. 

🌟 *Exclusive Opportunities for 2026 Batch:*
• *Direct Authorized Seat Allotment* (No donation)
• *Merit Scholarships*: Up to 35% - 50% tuition concession
• *Hostel & Visa/Travel Assistance* for Nepal students
• Complete institutional fee structure & installment plan

I would love to share the detailed syllabus, tuition breakdown, and scholarship criteria with you.

👉 *Are you free for a quick 5-minute call today, or should I share the prospectus PDF right here on WhatsApp?*

Warm regards,
*${counselor.name}*
${counselor.designation} | Gems Group Services
📞 Call / WhatsApp: ${counselor.phone}
📧 Email: ${counselor.email}
🌐 https://education-sansar-crm.vercel.app`;

  const emailSubject = `Welcome to Gems Group Services | Your ${course} Admission & Scholarship Advisory`;

  const emailText = `Dear ${studentName},

Welcome to Gems Group Services!

My name is ${counselor.name}, and I have been assigned as your personal Academic Counselor for your university admission journey in ${course}.

We have received your counseling request for ${university}. As an official admissions partner with top NIRF-ranked and NAAC A++ institutions across India, our counseling services are 100% free of charge for students.

Here is what I will assist you with:
1. Official 2026 fee structure and cost-of-living estimates.
2. Direct merit scholarship application (concessions up to 50% on tuition fees).
3. Admission document verification and provisional seat locking.
4. Dedicated Nepal student support, campus accommodation, and arrival guidance.

I would like to schedule a brief 10-minute discovery call with you (and your parents, if available) to review your academic background and ensure you secure maximum scholarship benefits.

Please feel free to reply directly to this email, or connect with me instantly on WhatsApp at ${counselor.phone}.

Looking forward to helping you achieve your academic goals!

Warm regards,

${counselor.name}
${counselor.designation}
Gems Group Services / Education Sansar
Direct Phone: ${counselor.phone}
Email: ${counselor.email}
Website: https://education-sansar-crm.vercel.app
Corporate Office: Sector 94, Noida, NCR / Kathmandu Liaison Desk`;

  const emailHtml = formatEmailHtml(emailSubject, emailText, counselor);

  return {
    whatsappMessage,
    emailSubject,
    emailHtml,
    emailText,
    mode: 'Admission Sales Engine'
  };
}

function formatEmailHtml(subject: string, textContent: string, counselor: CounselorProfile): string {
  const formattedParagraphs = textContent
    .split('\n\n')
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px; text-align: left; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Gems Group Services</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #bfdbfe;">Academic Counseling &amp; University Admissions Directorate</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 32px 28px; font-size: 14px;">
      ${formattedParagraphs}
      
      <!-- CTA Box -->
      <div style="margin: 28px 0; padding: 20px; background-color: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; text-align: center;">
        <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #1e40af; font-weight: 600;">Ready to discuss your admission?</h3>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569;">Connect with your counselor directly on WhatsApp for instant guidance.</p>
        <a href="https://wa.me/${counselor.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(counselor.name)},%20I%20am%20interested%20in%20admission%20guidance" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">Chat with Counselor on WhatsApp</a>
      </div>
    </div>
    
    <!-- Footer / Counselor Signature -->
    <div style="background-color: #f1f5f9; padding: 20px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #1e293b;">${counselor.name} &bull; ${counselor.designation}</p>
      <p style="margin: 0 0 4px 0;">Phone/WhatsApp: <a href="tel:${counselor.phone}" style="color: #2563eb; text-decoration: none;">${counselor.phone}</a> &bull; Email: <a href="mailto:${counselor.email}" style="color: #2563eb; text-decoration: none;">${counselor.email}</a></p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">Gems Group Services &bull; Education Sansar CRM &bull; All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Automatically trigger AI outreach on lead creation
 */
export async function autoDispatchWelcomeOutreach(
  lead: Partial<Lead>,
  performedBy: string = 'AI Auto-Responder'
): Promise<AIOutreachResult> {
  const settings = getAISettings();
  const counselor = resolveCounselorProfile(lead);

  // Check if outreach was already sent to avoid duplicate spamming
  if (lead.id) {
    const existingActivity = db.prepare(`
      SELECT id FROM lead_activities 
      WHERE lead_id = ? AND activity_type IN ('WhatsApp', 'Email') AND (title LIKE '%AI%' OR title LIKE '%Welcome%')
      LIMIT 1
    `).get(lead.id);

    if (existingActivity) {
      return {
        success: true,
        whatsappSent: false,
        emailSent: false,
        counselorName: counselor.name,
        mode: 'Admission Sales Engine',
        error: 'Outreach already previously dispatched for this lead'
      };
    }
  }

  const outreach = await generateWelcomeOutreach(lead, counselor);
  let whatsappSent = false;
  let emailSent = false;

  // 1. Send WhatsApp if enabled and recipient phone exists
  if (settings.ai_auto_whatsapp_enabled) {
    const targetPhone = lead.whatsapp_number || lead.phone;
    if (targetPhone && targetPhone.trim()) {
      try {
        const waRes = sendWhatsAppMessage({
          leadId: lead.id,
          recipientPhone: targetPhone,
          customMessage: outreach.whatsappMessage,
          performedBy: `${counselor.name} (AI Counselor Agent)`
        });
        whatsappSent = waRes.success;
      } catch (err: any) {
        console.warn('[AI WhatsApp Dispatch Failed]', err.message);
      }
    }
  }

  // 2. Send Email if enabled and recipient email exists
  if (settings.ai_auto_email_enabled && lead.email && lead.email.includes('@')) {
    try {
      const emailRes = sendDirectEmail({
        leadId: lead.id,
        recipientEmail: lead.email,
        recipientName: lead.student_name,
        subject: outreach.emailSubject,
        htmlContent: outreach.emailHtml,
        textContent: outreach.emailText,
        senderName: `${counselor.name} | Gems Group Services`,
        senderEmail: counselor.email,
        performedBy: `${counselor.name} (AI Counselor Agent)`
      });
      emailSent = emailRes.success;
    } catch (err: any) {
      console.warn('[AI Email Dispatch Failed]', err.message);
    }
  }

  // 3. Compute and store initial AI insight
  if (lead.id) {
    try {
      const scoreInsight = analyzeLeadAndScore(lead);
      const insightId = 'ai-ins-' + lead.id;
      db.prepare(`
        INSERT INTO lead_ai_insights (
          id, lead_id, score, conversion_probability, key_drivers, 
          recommended_action, last_outreach_at, last_outreach_channel, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))
        ON CONFLICT(lead_id) DO UPDATE SET
          score = excluded.score,
          conversion_probability = excluded.conversion_probability,
          key_drivers = excluded.key_drivers,
          recommended_action = excluded.recommended_action,
          last_outreach_at = datetime('now'),
          last_outreach_channel = excluded.last_outreach_channel,
          updated_at = datetime('now')
      `).run(
        insightId,
        lead.id,
        scoreInsight.score,
        scoreInsight.winProbability,
        JSON.stringify(scoreInsight.keyDrivers),
        scoreInsight.recommendedAction,
        whatsappSent && emailSent ? 'WhatsApp + Email' : whatsappSent ? 'WhatsApp' : emailSent ? 'Email' : 'Queued'
      );
    } catch (e: any) {
      console.warn('[AI Insights Record Failed]', e.message);
    }

    // 4. Notify assigned counselor
    if (counselor.id && (whatsappSent || emailSent)) {
      createNotification({
        counselorId: counselor.id,
        title: 'AI Auto-Outreach Dispatched',
        message: `AI dispatched welcome outreach to ${lead.student_name || 'student'} (${lead.preferred_course || 'Course'}) on your behalf.`,
        type: 'AI_OUTREACH',
        entityType: 'lead',
        entityId: lead.id
      });
    }
  }

  return {
    success: whatsappSent || emailSent,
    whatsappSent,
    emailSent,
    whatsappMessage: outreach.whatsappMessage,
    emailSubject: outreach.emailSubject,
    emailBody: outreach.emailText,
    counselorName: counselor.name,
    mode: outreach.mode
  };
}

/**
 * Compute AI Lead Scoring, Win Probability, and Sales Recommendations
 */
export function analyzeLeadAndScore(lead: Partial<Lead>): LeadScoreInsight {
  let score = 50;
  const keyDrivers: string[] = [];

  // 1. Academic Performance
  const p12 = parseFloat(String(lead.percentage_12th || '0'));
  if (p12 >= 80) {
    score += 20;
    keyDrivers.push(`High academic merit: ${p12}% in 12th standard (High scholarship eligibility)`);
  } else if (p12 >= 65) {
    score += 12;
    keyDrivers.push(`Eligible for standard direct admission: ${p12}% in 12th standard`);
  } else if (p12 > 0) {
    score += 5;
    keyDrivers.push(`Requires counseling guidance on foundation / direct quota seats`);
  }

  // 2. Clear Program Interest
  if (lead.preferred_course && lead.preferred_course !== 'Not Specified') {
    score += 15;
    keyDrivers.push(`Clear academic interest identified: ${lead.preferred_course}`);
  } else {
    score -= 5;
  }

  // 3. Clear University Selection
  if (lead.preferred_university && lead.preferred_university !== 'Not Specified') {
    score += 10;
    keyDrivers.push(`Target university shortlisted: ${lead.preferred_university}`);
  }

  // 4. Contact Data Completeness
  if (lead.phone && lead.email) {
    score += 10;
    keyDrivers.push('Full verified contact details available (Phone + Email)');
  } else if (lead.phone) {
    score += 5;
  }

  // 5. Temperature factor
  const temp = (lead.lead_temperature || 'WARM').toUpperCase();
  if (temp === 'HOT') {
    score += 15;
    keyDrivers.push('Lead actively interacting / labeled as HOT priority');
  } else if (temp === 'COLD') {
    score -= 10;
  }

  // 6. Lead status progression
  const status = lead.lead_status || 'New Lead';
  if (['Application Submitted', 'Documents Received', 'Counseling Completed'].includes(status)) {
    score += 15;
    keyDrivers.push(`Advanced pipeline status: ${status}`);
  }

  // Clamp 10 - 98
  score = Math.max(15, Math.min(98, score));

  let winProbability: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  let recommendedAction = 'Schedule first discovery call to confirm preferred stream and intake year.';

  if (score >= 75) {
    winProbability = 'HIGH';
    recommendedAction = `🔥 Immediate Action: Student has high conversion intent. Offer ${lead.preferred_university || 'partner university'} prospectus and lock in up to 30% scholarship today.`;
  } else if (score < 45) {
    winProbability = 'LOW';
    recommendedAction = 'Send low-pressure WhatsApp check-in to confirm if they are still planning for 2026 intake.';
  } else {
    winProbability = 'MEDIUM';
    recommendedAction = 'Conduct detailed course comparison and share hostel & fee structure breakdown.';
  }

  // Suggest 2-3 top universities matching the course from DB
  let suggestedUniversities: any[] = [];
  try {
    const courseTerm = lead.preferred_course || 'Engineering';
    const cleanTerm = courseTerm.split(' ')[0];
    const rows = db.prepare(`
      SELECT DISTINCT 
        u.name, 
        u.city, 
        c.course_name, 
        uc.tuition_fee_per_year,
        uc.currency
      FROM university_courses uc
      JOIN universities u ON uc.university_id = u.id
      JOIN courses c ON uc.course_id = c.id
      WHERE (c.course_name LIKE ? OR c.stream LIKE ?)
      LIMIT 3
    `).all(`%${cleanTerm}%`, `%${cleanTerm}%`) as any[];

    suggestedUniversities = rows.map(r => ({
      name: r.name,
      city: r.city,
      course_name: r.course_name,
      annual_tuition: r.tuition_fee_per_year ? `${r.currency || 'USD'} ${Number(r.tuition_fee_per_year).toLocaleString()}/year` : 'Standard Fees',
      scholarship_potential: 'Up to 30-40% merit concession'
    }));
  } catch {}

  return {
    score,
    winProbability,
    tier: winProbability,
    temperature: temp as any,
    keyDrivers,
    recommendedAction,
    suggestedUniversities
  };
}

/**
 * Generate AI Sales Pitch / Objection Handler / Call Script
 */
export async function generateSalesPitch(
  lead: Partial<Lead>,
  counselorOrOptions?: any,
  optionsParam?: any
): Promise<{
  pitch: string;
  subject?: string;
  recommendedNextMove: string;
  mode: 'Gemini Generative' | 'Admission Sales Engine';
}> {
  let counselor: CounselorProfile;
  let options: any;

  if (counselorOrOptions && (counselorOrOptions.channel || counselorOrOptions.objection || counselorOrOptions.scenario || !counselorOrOptions.name)) {
    counselor = resolveCounselorProfile(lead);
    options = counselorOrOptions || {};
  } else {
    counselor = counselorOrOptions ? counselorOrOptions : resolveCounselorProfile(lead);
    options = optionsParam || {};
  }

  const studentName = lead.student_name || lead.first_name || 'Student';
  const course = lead.preferred_course || 'Chosen Program';
  const university = lead.preferred_university || 'Partner University';
  const rawObjection = options.objection || options.scenario || 'CLOSING';
  let objection = rawObjection;
  if (typeof rawObjection === 'string') {
    const lower = rawObjection.toLowerCase();
    if (lower.includes('fee')) objection = 'FEE_HIGH';
    else if (lower.includes('compar')) objection = 'COMPARING';
    else if (lower.includes('hostel') || lower.includes('safe')) objection = 'HOSTEL_SAFETY';
    else if (lower.includes('exam') || lower.includes('entrance')) objection = 'ENTRANCE_EXAM';
    else if (lower.includes('ghost') || lower.includes('unresponsive')) objection = 'UNRESPONSIVE';
    else if (lower.includes('scholar')) objection = 'SCHOLARSHIP';
    else if (lower.includes('clos') || lower.includes('push')) objection = 'CLOSING';
  }

  let channel: 'WhatsApp' | 'Email' | 'Call Script' = 'WhatsApp';
  if (options.channel) {
    const cLower = options.channel.toLowerCase();
    if (cLower.includes('email')) channel = 'Email';
    else if (cLower.includes('call') || cLower.includes('script')) channel = 'Call Script';
    else channel = 'WhatsApp';
  }

  // 1. Try Gemini
  const prompt = `You are ${counselor.name}, an expert education admission sales counselor at Gems Group Services.
Draft a ${channel} message for student ${studentName} who is interested in ${course} at ${university}.
The student's objection or situation is: "${objection}".
Custom notes: "${options.customNotes || 'Focus on fast closing and scholarship reservation'}".
Tone: ${options.tone || 'Empathetic, credible, persuasive and deadline-driven'}.
Make it ready-to-send, concise, and include a clear, non-pushy call to action. Sign as ${counselor.name}, ${counselor.phone}.`;

  const geminiPitch = await callGeminiApi(prompt);
  if (geminiPitch) {
    return {
      pitch: geminiPitch,
      subject: channel === 'Email' ? `Important Update on your ${course} Application - ${counselor.name}` : undefined,
      recommendedNextMove: 'Review message, adjust if needed, and click Send WhatsApp / Email directly.',
      mode: 'Gemini Generative'
    };
  }

  // 2. Deterministic Objection Pitches
  let pitch = '';
  let subject = `Regarding your ${course} admission inquiry`;
  let recommendedNextMove = '';

  switch (objection) {
    case 'FEE_HIGH':
      subject = `Affordable Fee Structure & Scholarship Concessions for ${course}`;
      pitch = `Hi ${studentName}! I completely understand that university fees are a key family investment. 💡

The good news is that for *${course}* at *${university}*, we have multiple financial assistance options:
1. *Merit Scholarships*: We can apply for up to 30% - 40% fee waiver based on your marks.
2. *Easy Installments*: Fees can be split per semester instead of annual lumpsum.
3. *Low Living Costs*: Affordable student mess & hostel packages.

Let's do a quick 3-minute calculation over the phone so I can show you the exact net fee after scholarship. What time works best for you today?

Best,
${counselor.name} (${counselor.phone})`;
      recommendedNextMove = 'Send fee breakdown with installment options and ask for academic marksheet to calculate exact scholarship.';
      break;

    case 'COMPARING':
      subject = `Why ${university} is the top choice for ${course} 2026`;
      pitch = `Hello ${studentName}! It's very smart of you to compare universities before deciding. 👍

When looking at *${university}* for *${course}*, here are 3 key factors our current students love:
• *NIRF & NAAC Accreditation*: Recognized globally for international degree validation.
• *Practical Industry Training*: Over 250+ top recruitment partners with active campus drives.
• *Active Student Community*: Dedicated support, safe hostels, and vibrant alumni network.

I have a side-by-side comparison sheet ready. Can I send it over WhatsApp or discuss it quickly on a call?

Warmly,
${counselor.name} (${counselor.phone})`;
      recommendedNextMove = 'Share comparative USP points focusing on placements and faculty credentials.';
      break;

    case 'HOSTEL_SAFETY':
      subject = `Campus Life, Hostel Amenities & Security at ${university}`;
      pitch = `Namaste ${studentName}! Many parents ask us about campus accommodation, and we take student safety very seriously. 🛡️

Here is what *${university}* provides:
• 24/7 security with biometric access & CCTV across hostels
• Separate Boys and Girls hostel buildings with dedicated resident wardens
• Clean, hygienic mess serving nutritious vegetarian & non-vegetarian food
• On-campus medical clinic and ambulance services

Parents are also welcome to visit the campus during counseling. Would you like me to send photos and video tour of the hostels?

Regards,
${counselor.name} (${counselor.phone})`;
      recommendedNextMove = 'Share hostel photos/videos and offer to speak directly with the parent to build confidence.';
      break;

    case 'ENTRANCE_EXAM':
      subject = `Direct Counseling & Entrance Guidance for ${course}`;
      pitch = `Hi ${studentName}! Don't worry if you are concerned about entrance exam cutoffs. 😊

For *${course}*, we have direct institutional merit counseling seats available where admission is evaluated on your 12th percentage and an easy internal assessment rather than high-pressure national cutoffs.

If you share your marksheet with me today, I can verify your eligibility within 1 hour and hold a provisional seat for you before general registration closes.

Best regards,
${counselor.name} (${counselor.phone})`;
      recommendedNextMove = 'Request marksheet copy on WhatsApp to give immediate provisional eligibility confirmation.';
      break;

    case 'UNRESPONSIVE':
      pitch = `Hi ${studentName}! Just a quick follow-up — I know you are busy with your studies. 📚

Are you still exploring colleges for *${course}* for the 2026 intake, or have you already finalized your admission elsewhere?

Just reply with a quick *1 (Still exploring)* or *2 (Already finalized)* so I know whether to keep your scholarship seat reserved.

Thanks!
${counselor.name} | Gems Group Services`;
      recommendedNextMove = 'Low-pressure binary choice question to revive inactive leads.';
      break;

    default: // CLOSING
      subject = `Finalizing your ${course} admission application`;
      pitch = `Hello ${studentName}! Great news — the early application window for *${course}* at *${university}* is currently open. 🎯

By submitting your basic documents (10th/12th marksheet & ID) this week:
• You lock in the early-bird scholarship rate.
• You get priority hostel room allotment.
• Your provisional admission letter will be issued in 48 hours.

Can you send your marksheet photo here on WhatsApp so I can process your application file?

Cheers,
${counselor.name} (${counselor.phone})`;
      recommendedNextMove = 'Push for document collection to convert lead into an active applicant.';
      break;
  }

  return {
    pitch,
    subject: channel === 'Email' ? subject : undefined,
    recommendedNextMove,
    mode: 'Admission Sales Engine'
  };
}

/**
 * Interactive Counselor Sales Assistant Chat
 */
export async function handleSalesChat(
  messageOrObj: string | { message: string; leadContext?: any; lead?: any },
  leadContextParam?: any
): Promise<{ reply: string; mode: 'Gemini Generative' | 'Admission Sales Engine' }> {
  let message = '';
  let leadContext = leadContextParam;

  if (typeof messageOrObj === 'object' && messageOrObj !== null) {
    message = messageOrObj.message || '';
    leadContext = messageOrObj.leadContext || messageOrObj.lead || leadContextParam;
  } else {
    message = String(messageOrObj || '');
  }

  const contextStr = leadContext 
    ? `Student Context: Name: ${leadContext.student_name || 'Student'}, Course: ${leadContext.preferred_course || leadContext.target_course || 'Higher Education'}, University: ${leadContext.preferred_university || 'Partner University'}, Budget: ${leadContext.budget || leadContext.budget_range || 'Standard'}, Status: ${leadContext.lead_status || leadContext.status || 'Active'}`
    : 'General education admissions counseling advisory';

  const prompt = `You are the AI Sales Advisor for education counselors at Gems Group Services (Education Sansar).
Answer the counselor's question with actionable, realistic, high-converting admission sales advice:
Counselor Question: "${message}"
${contextStr}

Give crisp, specific talking points, objection handlers, or psychological advice that will help the counselor close the admission.`;

  const geminiReply = await callGeminiApi(prompt);
  if (geminiReply) {
    return { reply: geminiReply, mode: 'Gemini Generative' };
  }

  // Fallback advice based on keywords
  const lower = message.toLowerCase();
  let reply = '';

  if (lower.includes('fee') || lower.includes('budget') || lower.includes('expensive')) {
    reply = `💡 **Sales Strategy for Fee Objections:**
1. **Never defend the fee outright — anchor the value first:** Mention the average placement package and industry exposure before breaking down numbers.
2. **Present the net cost:** Emphasize that with a 30% merit scholarship, the annual tuition reduces significantly.
3. **Offer installment payment:** Inform parents that payments are divided semester-wise, making it manageable.
4. **Closing Hook:** "Sir/Ma'am, let me apply for the special regional scholarship concession today so you don't miss the deadline."`;
  } else if (lower.includes('compare') || lower.includes('which university') || lower.includes('better')) {
    reply = `🏆 **University Comparison Strategy:**
1. Ask the student: *"What is the most important factor for you — campus placement, practical lab training, or total budget?"*
2. Highlight accreditation (NAAC A++ / NIRF top rank).
3. Mention alumni placement in top MNCs like Microsoft, Amazon, TCS, Cognizant.
4. Offer to connect the student with a senior from their state/city currently studying at that university.`;
  } else if (lower.includes('unresponsive') || lower.includes('not answering') || lower.includes('ghost')) {
    reply = `📲 **Unresponsive Lead Recovery Strategy:**
1. Avoid sending "Please call me back" (students ignore it).
2. Use curiosity and binary choices on WhatsApp:
   *"Hi Rahul, quick question — should I hold your scholarship seat for B.Tech, or did you decide on another college? Reply 1 for Yes, 2 for No."*
3. Send at peak times: 1:30 PM - 2:30 PM (lunch break) or 7:30 PM - 9:00 PM (after study hours).`;
  } else {
    reply = `🎯 **Proactive Counselor Advice:**
• **Listen 70%, Talk 30%:** Understand the student's primary career fear (placements, entrance exam stress, or fee).
• **Create Authentic Urgency:** Scholarship quotas and hostel allotments have fixed caps per state. Remind them gently that early applicants get the premier hostel rooms and highest tuition waivers.
• **Next Step:** Always agree on a specific day & time for the next touchpoint before ending the conversation!`;
  }

  return { reply, mode: 'Admission Sales Engine' };
}

/**
 * Get AI Sales Dashboard Metrics
 */
export function getAIDashboardMetrics(): {
  totalOutreachSent: number;
  whatsappOutreachCount: number;
  emailOutreachCount: number;
  highProbabilityLeadsCount: number;
  hotLeads: any[];
  recentOutreachActivities: any[];
  isGeminiActive: boolean;
} {
  const settings = getAISettings();

  const totalOutreach = (db.prepare(`
    SELECT COUNT(*) as count FROM lead_activities 
    WHERE activity_type IN ('WhatsApp', 'Email') AND (title LIKE '%AI%' OR title LIKE '%Welcome%' OR performed_by LIKE '%AI%')
  `).get() as { count: number }).count;

  const waOutreach = (db.prepare(`
    SELECT COUNT(*) as count FROM messages 
    WHERE channel = 'WhatsApp' AND status IN ('Sent', 'Delivered')
  `).get() as { count: number }).count;

  const emailOutreach = (db.prepare(`
    SELECT COUNT(*) as count FROM messages 
    WHERE channel = 'Email' AND status IN ('Sent', 'Delivered')
  `).get() as { count: number }).count;

  const hotLeads = db.prepare(`
    SELECT 
      l.id, l.student_name, l.phone, l.email, l.preferred_course, l.preferred_university,
      l.lead_status, l.lead_temperature, l.city, l.assigned_counselor_name, l.created_at,
      COALESCE(i.score, 80) as ai_score,
      COALESCE(i.conversion_probability, 'HIGH') as conversion_probability,
      COALESCE(i.recommended_action, 'Immediate phone follow-up recommended') as recommended_action
    FROM leads l
    LEFT JOIN lead_ai_insights i ON l.id = i.lead_id
    WHERE l.is_deleted = 0 AND (l.lead_temperature = 'HOT' OR COALESCE(i.score, 0) >= 75)
    ORDER BY COALESCE(i.score, 80) DESC, l.created_at DESC
    LIMIT 10
  `).all() as any[];

  const recentOutreach = db.prepare(`
    SELECT 
      m.id, m.lead_id, m.channel, m.recipient, m.sender, m.content, m.sent_at, m.status,
      l.student_name, l.preferred_course
    FROM messages m
    LEFT JOIN leads l ON m.lead_id = l.id
    ORDER BY m.sent_at DESC
    LIMIT 8
  `).all() as any[];

  return {
    totalOutreachSent: totalOutreach,
    whatsappOutreachCount: waOutreach,
    emailOutreachCount: emailOutreach,
    highProbabilityLeadsCount: hotLeads.length,
    hotLeads,
    recentOutreachActivities: recentOutreach,
    isGeminiActive: settings.is_gemini_active
  };
}
