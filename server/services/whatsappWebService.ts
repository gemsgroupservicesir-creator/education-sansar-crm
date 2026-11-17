import { db, logLeadActivity, createNotification } from '../db/database.ts';
import type { WhatsAppSession, WhatsAppChatSummary } from '../types/index.ts';
import { chatWithStudent } from './studentAIChatbotService.ts';

/**
 * Get active WhatsApp Web session for a counselor or global
 */
export function getWhatsAppSession(counselorId?: string): WhatsAppSession {
  try {
    let session: any = null;
    if (counselorId) {
      session = db.prepare('SELECT * FROM whatsapp_sessions WHERE counselor_id = ?').get(counselorId);
    }

    if (!session) {
      session = db.prepare('SELECT * FROM whatsapp_sessions ORDER BY updated_at DESC LIMIT 1').get();
    }

    if (!session) {
      // Auto-create initial default session
      const id = 'wa-sess-' + Date.now();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO whatsapp_sessions (
          id, counselor_id, counselor_name, session_name, status,
          device_name, battery_level, is_active, ai_auto_reply, created_at, updated_at
        )
        VALUES (?, 'c-prakash', 'Prakash Yadav', 'Counselor WhatsApp Web', 'DISCONNECTED', 'Chrome 124.0 (macOS)', 88, 1, 1, ?, ?)
      `).run(id, now, now);

      session = db.prepare('SELECT * FROM whatsapp_sessions WHERE id = ?').get(id);
    }

    // Check QR expiration
    if (session.status === 'QR_READY' && session.qr_expires_at) {
      if (new Date(session.qr_expires_at).getTime() < Date.now()) {
        session.status = 'DISCONNECTED';
        db.prepare("UPDATE whatsapp_sessions SET status = 'DISCONNECTED' WHERE id = ?").run(session.id);
      }
    }

    return session as WhatsAppSession;
  } catch (err: any) {
    console.error('[WhatsAppWeb] getWhatsAppSession error:', err);
    throw err;
  }
}

/**
 * Start or refresh QR Code pairing for WhatsApp Web
 */
export function startWhatsAppSession(counselorId?: string, counselorName?: string): WhatsAppSession {
  const current = getWhatsAppSession(counselorId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60000).toISOString(); // 60 seconds validity
  const pairingCode = 'GGS-' + Math.floor(1000 + Math.random() * 9000);
  const qrToken = `2@GGS_WA_${Date.now()}_${Math.random().toString(36).substring(2, 9)},${counselorId || 'counselor'},${pairingCode}`;

  db.prepare(`
    UPDATE whatsapp_sessions SET
      status = 'QR_READY',
      qr_code_data = ?,
      qr_expires_at = ?,
      pairing_code = ?,
      counselor_name = COALESCE(?, counselor_name),
      updated_at = ?
    WHERE id = ?
  `).run(qrToken, expiresAt, pairingCode, counselorName || null, now.toISOString(), current.id);

  return getWhatsAppSession(counselorId);
}

/**
 * Simulate or authenticate WhatsApp Web scan (Links device to counselor phone)
 */
export function simulateScanDevice(params: {
  counselorId?: string;
  phoneNumber?: string;
  counselorName?: string;
  deviceName?: string;
}): WhatsAppSession {
  const current = getWhatsAppSession(params.counselorId);
  const now = new Date().toISOString();
  const phone = params.phoneNumber?.trim() || '+977 9801234567';
  const cName = params.counselorName?.trim() || current.counselor_name || 'Prakash Yadav';
  const dName = params.deviceName || 'Chrome 124.0 (macOS Sonoma)';

  db.prepare(`
    UPDATE whatsapp_sessions SET
      status = 'CONNECTED',
      phone_number = ?,
      counselor_name = ?,
      device_name = ?,
      battery_level = 88,
      qr_code_data = NULL,
      qr_expires_at = NULL,
      pairing_code = NULL,
      connected_at = ?,
      last_active_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(phone, cName, dName, now, now, now, current.id);

  return getWhatsAppSession(params.counselorId);
}

/**
 * Disconnect active WhatsApp Web session
 */
export function disconnectWhatsAppSession(counselorId?: string): WhatsAppSession {
  const current = getWhatsAppSession(counselorId);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE whatsapp_sessions SET
      status = 'DISCONNECTED',
      qr_code_data = NULL,
      qr_expires_at = NULL,
      pairing_code = NULL,
      updated_at = ?
    WHERE id = ?
  `).run(now, current.id);

  return getWhatsAppSession(counselorId);
}

/**
 * Toggle AI Auto-Counselor for a WhatsApp Web session or chat
 */
export function toggleSessionAIAutoReply(sessionId: string, enabled: boolean): boolean {
  const result = db.prepare('UPDATE whatsapp_sessions SET ai_auto_reply = ? WHERE id = ?').run(enabled ? 1 : 0, sessionId);
  return result.changes > 0;
}

/**
 * Fetch WhatsApp student chat threads
 */
export function getWhatsAppChats(params?: {
  counselorId?: string;
  search?: string;
  filter?: 'all' | 'qualified' | 'unread' | 'high_intent';
}): WhatsAppChatSummary[] {
  try {
    const leads = db.prepare(`
      SELECT 
        id, lead_id, student_name, phone, whatsapp_number, preferred_course,
        preferred_university, lead_status, lead_temperature, qualification_score,
        qualification_status, assigned_counselor_id, assigned_counselor_name,
        last_contact_date, created_at, updated_at
      FROM leads
      WHERE is_deleted = 0
      ORDER BY updated_at DESC
      LIMIT 100
    `).all() as any[];

    // Fetch latest WhatsApp messages
    const latestMessages = db.prepare(`
      SELECT m.*
      FROM messages m
      INNER JOIN (
        SELECT recipient, MAX(sent_at) as max_sent
        FROM messages
        WHERE channel = 'WhatsApp'
        GROUP BY recipient
      ) r ON m.recipient = r.recipient AND m.sent_at = r.max_sent
      WHERE m.channel = 'WhatsApp'
    `).all() as any[];

    const messageMap = new Map<string, any>();
    for (const msg of latestMessages) {
      const cleanPhone = (msg.recipient || '').replace(/[^0-9]/g, '');
      if (cleanPhone) messageMap.set(cleanPhone, msg);
    }

    const chats: WhatsAppChatSummary[] = [];

    for (const lead of leads) {
      const cleanPhone = (lead.whatsapp_number || lead.phone || '').replace(/[^0-9]/g, '');
      const cleanSuffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;

      // Find matching message
      let msg = messageMap.get(cleanPhone);
      if (!msg) {
        for (const [p, m] of messageMap.entries()) {
          if (p.endsWith(cleanSuffix) || cleanPhone.endsWith(p.slice(-8))) {
            msg = m;
            break;
          }
        }
      }

      const qScore = lead.qualification_score || 0;
      const qStatus = lead.qualification_status || 'Unqualified';
      const isQualified = qScore >= 50 || qStatus === 'Qualified' || qStatus === 'High Intent';

      // Filters
      if (params?.filter === 'qualified' && !isQualified) continue;
      if (params?.filter === 'high_intent' && qScore < 70) continue;

      if (params?.search && params.search.trim()) {
        const s = params.search.toLowerCase().trim();
        const matches = 
          (lead.student_name || '').toLowerCase().includes(s) ||
          (lead.phone || '').includes(s) ||
          (lead.preferred_course || '').toLowerCase().includes(s) ||
          (msg?.content || '').toLowerCase().includes(s);
        if (!matches) continue;
      }

      chats.push({
        lead_id: lead.id,
        lead_name: lead.student_name || 'Student Lead',
        phone: lead.phone,
        whatsapp_number: lead.whatsapp_number || lead.phone,
        course: lead.preferred_course !== 'Undecided' ? lead.preferred_course : undefined,
        university: lead.preferred_university !== 'Not Specified' ? lead.preferred_university : undefined,
        last_message: msg?.content || `Inquiry regarding ${lead.preferred_course || 'courses'}`,
        last_message_at: msg?.sent_at || lead.updated_at || lead.created_at,
        unread_count: isQualified ? 1 : 0,
        qualification_score: qScore,
        qualification_status: qStatus,
        is_qualified: isQualified,
        lead_status: lead.lead_status,
        lead_temperature: lead.lead_temperature,
        assigned_counselor_name: lead.assigned_counselor_name,
        assigned_counselor_id: lead.assigned_counselor_id,
        ai_enabled: true
      });
    }

    // Sort by latest message
    chats.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    return chats;
  } catch (err: any) {
    console.error('[WhatsAppWeb] getWhatsAppChats error:', err);
    return [];
  }
}

/**
 * Fetch complete message thread for a student phone
 */
export function getWhatsAppChatMessages(phone: string): {
  lead: any;
  messages: any[];
  qualification: any;
} {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const searchSuffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;

  let lead = db.prepare(`
    SELECT * FROM leads 
    WHERE replace(replace(replace(phone, ' ', ''), '-', ''), '+', '') LIKE ?
       OR replace(replace(replace(whatsapp_number, ' ', ''), '-', ''), '+', '') LIKE ?
    ORDER BY created_at DESC LIMIT 1
  `).get(`%${searchSuffix}%`, `%${searchSuffix}%`) as any;

  let messages: any[] = [];
  if (lead) {
    messages = db.prepare(`
      SELECT * FROM messages
      WHERE lead_id = ? OR recipient LIKE ?
      ORDER BY sent_at ASC
    `).all(lead.id, `%${searchSuffix}%`) as any[];
  } else {
    messages = db.prepare(`
      SELECT * FROM messages
      WHERE recipient LIKE ?
      ORDER BY sent_at ASC
    `).all(`%${searchSuffix}%`) as any[];
  }

  // Parse qualification details
  let qDetails: any = {};
  if (lead?.qualification_details) {
    try {
      qDetails = JSON.parse(lead.qualification_details);
    } catch {}
  }

  return {
    lead,
    messages,
    qualification: {
      score: lead?.qualification_score || 0,
      status: lead?.qualification_status || 'Unqualified',
      summary: lead?.qualification_summary || 'No qualification summary available',
      details: qDetails,
      isQualified: (lead?.qualification_score || 0) >= 50
    }
  };
}

/**
 * Send WhatsApp Message from Counselor / AI
 */
export async function sendWhatsAppChatMessage(params: {
  phone: string;
  message: string;
  senderName?: string;
  counselorId?: string;
  triggerAiResponse?: boolean;
}): Promise<{ sentMessage: any; aiReply?: any }> {
  const { phone, message, senderName = 'Counselor', counselorId, triggerAiResponse = false } = params;

  const cleanPhone = phone.trim();
  const cleanDigits = cleanPhone.replace(/[^0-9]/g, '');
  const searchSuffix = cleanDigits.length >= 8 ? cleanDigits.slice(-8) : cleanDigits;

  let lead = db.prepare(`
    SELECT * FROM leads 
    WHERE replace(replace(replace(phone, ' ', ''), '-', ''), '+', '') LIKE ?
       OR replace(replace(replace(whatsapp_number, ' ', ''), '-', ''), '+', '') LIKE ?
    ORDER BY created_at DESC LIMIT 1
  `).get(`%${searchSuffix}%`, `%${searchSuffix}%`) as any;

  const msgId = 'WA-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO messages (id, lead_id, channel, recipient, sender, content, status, sent_at)
    VALUES (?, ?, 'WhatsApp', ?, ?, ?, 'Sent', ?)
  `).run(msgId, lead?.id || null, cleanPhone, senderName, message.trim(), now);

  const sentMessage = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);

  // If lead exists, update last contact date
  if (lead) {
    db.prepare("UPDATE leads SET last_contact_date = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(lead.id);
  }

  let aiReplyResult: any = null;

  // If student sent message and AI response is requested
  if (triggerAiResponse) {
    aiReplyResult = await chatWithStudent({
      phone: cleanPhone,
      studentName: lead?.student_name || 'Student',
      message: message.trim(),
      source: 'WhatsApp Web'
    });
  }

  return { sentMessage, aiReply: aiReplyResult };
}

/**
 * Promote / Move Lead directly to active Leads Tab with captured details
 */
export function promoteLeadToActive(params: {
  leadId?: string;
  phone?: string;
  course?: string;
  university?: string;
  marks?: string;
  budget?: string;
  counselorId?: string;
  promotedBy?: string;
}): any {
  let lead: any = null;
  if (params.leadId) {
    lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(params.leadId);
  } else if (params.phone) {
    const rawDigits = params.phone.replace(/[^0-9]/g, '');
    const searchSuffix = rawDigits.length >= 8 ? rawDigits.slice(-8) : rawDigits;
    lead = db.prepare(`
      SELECT * FROM leads 
      WHERE replace(replace(replace(phone, ' ', ''), '-', ''), '+', '') LIKE ?
         OR replace(replace(replace(whatsapp_number, ' ', ''), '-', ''), '+', '') LIKE ?
      ORDER BY created_at DESC LIMIT 1
    `).get(`%${searchSuffix}%`, `%${searchSuffix}%`);
  }

  if (!lead) {
    throw new Error('Lead not found to promote');
  }

  const now = new Date().toISOString();

  // Parse existing qualification details
  let existingDetails: any = {};
  try {
    existingDetails = JSON.parse(lead.qualification_details || '{}');
  } catch {}

  const merged = {
    ...existingDetails,
    ...(params.course ? { course: params.course } : {}),
    ...(params.university ? { university: params.university } : {}),
    ...(params.marks ? { marks: params.marks } : {}),
    ...(params.budget ? { budget: params.budget } : {})
  };

  const newScore = Math.max(lead.qualification_score || 0, 75);
  const newSummary = `Qualified: ${merged.course || lead.preferred_course} | Budget: ${merged.budget || lead.budget || 'Verified'} | Marks: ${merged.marks || 'Verified'}`;

  db.prepare(`
    UPDATE leads SET
      lead_status = 'Qualified',
      lead_temperature = 'HOT',
      qualification_score = ?,
      qualification_status = 'Qualified',
      qualification_summary = ?,
      qualification_details = ?,
      preferred_course = COALESCE(?, preferred_course),
      preferred_university = COALESCE(?, preferred_university),
      budget = COALESCE(?, budget),
      assigned_counselor_id = COALESCE(?, assigned_counselor_id),
      updated_at = ?
    WHERE id = ?
  `).run(
    newScore,
    newSummary,
    JSON.stringify(merged),
    params.course || null,
    params.university || null,
    params.budget || null,
    params.counselorId || null,
    now,
    lead.id
  );

  // Log activity
  logLeadActivity({
    leadId: lead.id,
    activityType: 'Lead Qualified',
    title: '🎯 Lead Moved to Active Leads Tab',
    description: `Lead moved to active Leads tab by ${params.promotedBy || 'Counselor via WhatsApp Web'} with full academic & budget verification.`,
    performedBy: params.promotedBy || 'Counselor'
  });

  // Create notification
  createNotification({
    counselorId: lead.assigned_counselor_id || params.counselorId,
    title: `🎯 Lead Qualified: ${lead.student_name}`,
    message: `${lead.student_name} (${lead.phone}) is now an Active Qualified Lead in your Leads Tab!`,
    type: 'LEAD_QUALIFIED',
    entityType: 'lead',
    entityId: lead.id
  });

  return db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id);
}
