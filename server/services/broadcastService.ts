import { db, logAudit } from '../db/database.ts';
import { persistBroadcastToNeon, persistLeadOptOutToNeon, isNeonEnabled, sql } from '../db/neon.ts';
import crypto from 'crypto';

export interface BroadcastAudienceFilter {
  course?: string;
  university?: string;
  status?: string;
  temperature?: string;
  city?: string;
  country?: string;
  source?: string;
  counselor_id?: string;
  from_date?: string;
  to_date?: string;
}

export interface BroadcastPayload {
  id?: string;
  name: string;
  channel: 'Email' | 'WhatsApp' | 'Both';
  template_id?: string | null;
  subject?: string;
  content: string;
  preview_text?: string;
  sender_name?: string;
  sender_email?: string;
  sender_phone?: string;
  filter_criteria?: BroadcastAudienceFilter;
  scheduled_at?: string | null;
  submit_for_approval?: boolean;
}

/**
 * Replaces dynamic variables {{student_name}}, {{preferred_course}}, etc.
 */
export function interpolateMergeTags(text: string, vars: Record<string, any>): string {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{{${key}}}`;
  });
}

/**
 * Build SQL query and parameters for audience filtering
 */
function buildAudienceQuery(filter: BroadcastAudienceFilter, channel: 'Email' | 'WhatsApp' | 'Both') {
  let where = "WHERE l.is_deleted = 0";
  const params: any[] = [];

  // Channel delivery eligibility & opt-out exclusion
  if (channel === 'Email') {
    where += " AND (l.email IS NOT NULL AND trim(l.email) != '' AND l.email LIKE '%@%')";
    where += " AND (l.email_opt_out = 0 OR l.email_opt_out IS NULL)";
  } else if (channel === 'WhatsApp') {
    where += " AND ((l.whatsapp_number IS NOT NULL AND trim(l.whatsapp_number) != '') OR (l.phone IS NOT NULL AND trim(l.phone) != ''))";
    where += " AND (l.whatsapp_opt_out = 0 OR l.whatsapp_opt_out IS NULL)";
  } else {
    // Both: eligible if deliverable on either and not opted-out on both
    where += ` AND (
      ((l.email IS NOT NULL AND trim(l.email) != '' AND l.email LIKE '%@%') AND (l.email_opt_out = 0 OR l.email_opt_out IS NULL))
      OR
      (((l.whatsapp_number IS NOT NULL AND trim(l.whatsapp_number) != '') OR (l.phone IS NOT NULL AND trim(l.phone) != '')) AND (l.whatsapp_opt_out = 0 OR l.whatsapp_opt_out IS NULL))
    )`;
  }

  // Course matching
  if (filter.course && filter.course.trim()) {
    const rawCourse = filter.course.trim().toLowerCase();
    const compactCourse = rawCourse.replace(/[^a-z0-9]/g, '');
    where += ` AND (
      LOWER(COALESCE(l.preferred_course, '')) LIKE ? OR 
      REPLACE(REPLACE(LOWER(COALESCE(l.preferred_course, '')), '.', ''), ' ', '') LIKE ?
    )`;
    params.push(`%${rawCourse}%`, `%${compactCourse || rawCourse}%`);
  }

  // University matching
  if (filter.university && filter.university.trim()) {
    const rawUni = filter.university.trim().toLowerCase();
    const cleanUni = rawUni.replace(/university|college|institute|campus/g, '').trim();
    where += ` AND (
      LOWER(COALESCE(l.preferred_university, '')) LIKE ? OR 
      LOWER(COALESCE(l.preferred_university, '')) LIKE ?
    )`;
    params.push(`%${rawUni}%`, `%${cleanUni || rawUni}%`);
  }

  // Status matching
  if (filter.status && filter.status.trim()) {
    const statusVal = filter.status.trim().toLowerCase();
    where += ` AND (
      LOWER(COALESCE(l.lead_status, '')) = ? OR 
      REPLACE(LOWER(COALESCE(l.lead_status, '')), '_', ' ') = ? OR
      LOWER(COALESCE(l.lead_status, '')) LIKE ?
    )`;
    params.push(statusVal, statusVal, `%${statusVal}%`);
  }

  // Temperature matching
  if (filter.temperature && filter.temperature.trim()) {
    const tempVal = filter.temperature.split(' ')[0].trim().toLowerCase();
    where += ` AND LOWER(COALESCE(l.lead_temperature, '')) = ?`;
    params.push(tempVal);
  }

  // City matching
  if (filter.city && filter.city.trim()) {
    where += ` AND LOWER(COALESCE(l.city, '')) LIKE ?`;
    params.push(`%${filter.city.trim().toLowerCase()}%`);
  }

  // Country matching
  if (filter.country && filter.country.trim()) {
    where += ` AND LOWER(COALESCE(l.country, '')) LIKE ?`;
    params.push(`%${filter.country.trim().toLowerCase()}%`);
  }

  // Lead Source matching
  if (filter.source && filter.source.trim()) {
    where += ` AND LOWER(COALESCE(l.lead_source, '')) LIKE ?`;
    params.push(`%${filter.source.trim().toLowerCase()}%`);
  }

  // Counselor matching
  if (filter.counselor_id && filter.counselor_id.trim()) {
    where += ` AND l.assigned_counselor_id = ?`;
    params.push(filter.counselor_id.trim());
  }

  // Date range
  if (filter.from_date && filter.from_date.trim()) {
    where += ` AND date(l.created_at) >= date(?)`;
    params.push(filter.from_date.trim());
  }
  if (filter.to_date && filter.to_date.trim()) {
    where += ` AND date(l.created_at) <= date(?)`;
    params.push(filter.to_date.trim());
  }

  return { where, params };
}

/**
 * Preview audience size, opted-out leads count, and sample leads
 */
export function previewBroadcastAudience(
  filter: BroadcastAudienceFilter = {},
  channel: 'Email' | 'WhatsApp' | 'Both' = 'Email'
): {
  total_matching: number;
  total_deliverable: number;
  total_opted_out: number;
  sample_leads: any[];
} {
  // 1. Total leads matching demographic/preference criteria
  let baseWhere = "WHERE l.is_deleted = 0";
  const baseParams: any[] = [];

  if (filter.course && filter.course.trim()) {
    baseWhere += ` AND LOWER(COALESCE(l.preferred_course, '')) LIKE ?`;
    baseParams.push(`%${filter.course.trim().toLowerCase()}%`);
  }
  if (filter.university && filter.university.trim()) {
    baseWhere += ` AND LOWER(COALESCE(l.preferred_university, '')) LIKE ?`;
    baseParams.push(`%${filter.university.trim().toLowerCase()}%`);
  }
  if (filter.status && filter.status.trim()) {
    baseWhere += ` AND LOWER(COALESCE(l.lead_status, '')) LIKE ?`;
    baseParams.push(`%${filter.status.trim().toLowerCase()}%`);
  }
  if (filter.temperature && filter.temperature.trim()) {
    baseWhere += ` AND LOWER(COALESCE(l.lead_temperature, '')) = ?`;
    baseParams.push(filter.temperature.split(' ')[0].trim().toLowerCase());
  }
  if (filter.city && filter.city.trim()) {
    baseWhere += ` AND LOWER(COALESCE(l.city, '')) LIKE ?`;
    baseParams.push(`%${filter.city.trim().toLowerCase()}%`);
  }
  if (filter.counselor_id && filter.counselor_id.trim()) {
    baseWhere += ` AND l.assigned_counselor_id = ?`;
    baseParams.push(filter.counselor_id.trim());
  }

  const totalMatching = (
    db.prepare(`SELECT count(*) as count FROM leads l ${baseWhere}`).get(...baseParams) as { count: number }
  ).count;

  // 2. Deliverable query strictly filtering out opt-outs
  const { where, params } = buildAudienceQuery(filter, channel);
  const totalDeliverable = (
    db.prepare(`SELECT count(*) as count FROM leads l ${where}`).get(...params) as { count: number }
  ).count;

  // 3. Opted-out leads count for this filter
  let optOutWhere = baseWhere;
  const optOutParams = [...baseParams];
  if (channel === 'Email') {
    optOutWhere += " AND l.email_opt_out = 1";
  } else if (channel === 'WhatsApp') {
    optOutWhere += " AND l.whatsapp_opt_out = 1";
  } else {
    optOutWhere += " AND (l.email_opt_out = 1 OR l.whatsapp_opt_out = 1)";
  }
  const totalOptedOut = (
    db.prepare(`SELECT count(*) as count FROM leads l ${optOutWhere}`).get(...optOutParams) as { count: number }
  ).count;

  // 4. Sample preview leads
  const query = `
    SELECT 
      l.id, l.student_name, l.first_name, l.last_name, l.email, l.phone, l.whatsapp_number,
      l.preferred_course, l.preferred_university, l.city, l.lead_status, l.lead_temperature,
      l.email_opt_out, l.whatsapp_opt_out,
      c.name as counselor_name, c.phone as counselor_phone
    FROM leads l
    LEFT JOIN counselors c ON l.assigned_counselor_id = c.id
    ${where}
    ORDER BY l.created_at DESC
    LIMIT 10
  `;
  const sampleLeads = db.prepare(query).all(...params);

  return {
    total_matching: totalMatching,
    total_deliverable: totalDeliverable,
    total_opted_out: totalOptedOut,
    sample_leads: sampleLeads
  };
}

/**
 * Fetch all broadcast campaigns with metrics
 */
export function getBroadcastCampaigns(statusFilter?: string): any[] {
  let query = 'SELECT * FROM broadcast_campaigns';
  const params: any[] = [];

  if (statusFilter && statusFilter !== 'ALL') {
    query += ' WHERE status = ?';
    params.push(statusFilter);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(r => {
    let filterCriteria = {};
    try {
      filterCriteria = typeof r.filter_criteria === 'string' ? JSON.parse(r.filter_criteria) : (r.filter_criteria || {});
    } catch {
      filterCriteria = {};
    }

    const sent = Number(r.sent_count) || 0;
    const delivered = Number(r.delivered_count) || 0;
    const opened = Number(r.opened_count) || 0;
    const replied = Number(r.replied_count) || 0;
    const optOut = Number(r.opt_out_count) || 0;
    const conversions = Number(r.conversions_count) || 0;

    const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
    const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
    const replyRate = delivered > 0 ? Math.round((replied / delivered) * 100) : 0;
    const optOutRate = delivered > 0 ? Math.round((optOut / delivered) * 100) : 0;

    return {
      ...r,
      filter_criteria: filterCriteria,
      delivery_rate: deliveryRate,
      open_rate: openRate,
      reply_rate: replyRate,
      opt_out_rate: optOutRate,
      conversions_count: conversions,
      conversions_revenue: Number(r.conversions_revenue) || 0.0
    };
  });
}

/**
 * Get single broadcast campaign by ID
 */
export function getBroadcastCampaignById(id: string): any | null {
  const r = db.prepare('SELECT * FROM broadcast_campaigns WHERE id = ?').get(id) as any;
  if (!r) return null;

  let filterCriteria = {};
  try {
    filterCriteria = typeof r.filter_criteria === 'string' ? JSON.parse(r.filter_criteria) : (r.filter_criteria || {});
  } catch {
    filterCriteria = {};
  }

  const sent = Number(r.sent_count) || 0;
  const delivered = Number(r.delivered_count) || 0;
  const opened = Number(r.opened_count) || 0;
  const replied = Number(r.replied_count) || 0;
  const optOut = Number(r.opt_out_count) || 0;
  const conversions = Number(r.conversions_count) || 0;

  return {
    ...r,
    filter_criteria: filterCriteria,
    delivery_rate: sent > 0 ? Math.round((delivered / sent) * 100) : 0,
    open_rate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
    reply_rate: delivered > 0 ? Math.round((replied / delivered) * 100) : 0,
    opt_out_rate: delivered > 0 ? Math.round((optOut / delivered) * 100) : 0,
    conversions_count: conversions,
    conversions_revenue: Number(r.conversions_revenue) || 0.0
  };
}

/**
 * Create a new broadcast campaign (Draft or Submitted for Approval)
 */
export function createBroadcastCampaign(
  payload: BroadcastPayload,
  user: { name?: string; role?: string } = { name: 'Super Admin', role: 'Super Admin' }
): any {
  const userName = user?.name || 'Super Admin';
  const id = payload.id || `bc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const filterJson = JSON.stringify(payload.filter_criteria || {});

  // Calculate targeted audience
  const audience = previewBroadcastAudience(payload.filter_criteria || {}, payload.channel);

  const isSubmit = Boolean(payload.submit_for_approval);
  const status = isSubmit ? 'PENDING_APPROVAL' : 'DRAFT';
  const approvalStatus = isSubmit ? 'PENDING' : 'DRAFT';

  const broadcastRecord = {
    id,
    name: payload.name,
    channel: payload.channel,
    status,
    approval_status: approvalStatus,
    rejection_reason: null,
    submitted_by: isSubmit ? userName : null,
    submitted_at: isSubmit ? now : null,
    approved_by: null,
    approved_at: null,
    scheduled_at: payload.scheduled_at || null,
    executed_at: null,
    template_id: payload.template_id || null,
    subject: payload.subject || null,
    content: payload.content,
    preview_text: payload.preview_text || null,
    sender_name: payload.sender_name || 'Gems Group Services Admissions',
    sender_email: payload.sender_email || 'admissions@gemsgroupservices.com',
    sender_phone: payload.sender_phone || '+977 9801234567',
    filter_criteria: filterJson,
    total_targeted: audience.total_deliverable,
    sent_count: 0,
    delivered_count: 0,
    opened_count: 0,
    replied_count: 0,
    bounced_count: 0,
    opt_out_count: 0,
    conversions_count: 0,
    conversions_revenue: 0.0,
    created_by: userName,
    created_at: now,
    updated_at: now
  };

  db.prepare(`
    INSERT INTO broadcast_campaigns (
      id, name, channel, status, approval_status, rejection_reason,
      submitted_by, submitted_at, approved_by, approved_at, scheduled_at, executed_at,
      template_id, subject, content, preview_text, sender_name, sender_email, sender_phone,
      filter_criteria, total_targeted, sent_count, delivered_count, opened_count, replied_count,
      bounced_count, opt_out_count, conversions_count, conversions_revenue, created_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    broadcastRecord.id, broadcastRecord.name, broadcastRecord.channel, broadcastRecord.status, broadcastRecord.approval_status,
    broadcastRecord.rejection_reason, broadcastRecord.submitted_by, broadcastRecord.submitted_at,
    broadcastRecord.approved_by, broadcastRecord.approved_at, broadcastRecord.scheduled_at, broadcastRecord.executed_at,
    broadcastRecord.template_id, broadcastRecord.subject, broadcastRecord.content, broadcastRecord.preview_text,
    broadcastRecord.sender_name, broadcastRecord.sender_email, broadcastRecord.sender_phone, broadcastRecord.filter_criteria,
    broadcastRecord.total_targeted, broadcastRecord.sent_count, broadcastRecord.delivered_count, broadcastRecord.opened_count,
    broadcastRecord.replied_count, broadcastRecord.bounced_count, broadcastRecord.opt_out_count, broadcastRecord.conversions_count,
    broadcastRecord.conversions_revenue, broadcastRecord.created_by, broadcastRecord.created_at, broadcastRecord.updated_at
  );

  // Persist to Neon
  if (isNeonEnabled()) {
    persistBroadcastToNeon(broadcastRecord).catch(e => console.warn('[Neon Sync] Broadcast persist error:', e.message));
  }

  logAudit({
    userName,
    action: isSubmit ? 'BROADCAST_SUBMITTED' : 'BROADCAST_CREATED',
    entity: 'broadcast_campaign',
    entityId: id,
    newValue: { name: payload.name, channel: payload.channel, targeted: audience.total_deliverable }
  });

  return getBroadcastCampaignById(id);
}

/**
 * Update an existing broadcast campaign (Draft or Rejected)
 */
export function updateBroadcastCampaign(
  id: string,
  payload: Partial<BroadcastPayload>,
  user: { name?: string } = { name: 'Super Admin' }
): any {
  const userName = user?.name || 'Super Admin';
  const existing = getBroadcastCampaignById(id);
  if (!existing) {
    throw new Error('Broadcast campaign not found');
  }

  if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED' && existing.status !== 'SCHEDULED') {
    throw new Error(`Cannot modify campaign in status '${existing.status}'`);
  }

  const now = new Date().toISOString();
  const filterCriteria = payload.filter_criteria !== undefined ? payload.filter_criteria : existing.filter_criteria;
  const channel = payload.channel || existing.channel;

  const audience = previewBroadcastAudience(filterCriteria, channel);

  db.prepare(`
    UPDATE broadcast_campaigns
    SET name = COALESCE(?, name),
        channel = COALESCE(?, channel),
        template_id = COALESCE(?, template_id),
        subject = COALESCE(?, subject),
        content = COALESCE(?, content),
        preview_text = COALESCE(?, preview_text),
        sender_name = COALESCE(?, sender_name),
        sender_email = COALESCE(?, sender_email),
        sender_phone = COALESCE(?, sender_phone),
        filter_criteria = ?,
        scheduled_at = ?,
        total_targeted = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    payload.name || null,
    payload.channel || null,
    payload.template_id || null,
    payload.subject || null,
    payload.content || null,
    payload.preview_text || null,
    payload.sender_name || null,
    payload.sender_email || null,
    payload.sender_phone || null,
    JSON.stringify(filterCriteria),
    payload.scheduled_at !== undefined ? payload.scheduled_at : existing.scheduled_at,
    audience.total_deliverable,
    now,
    id
  );

  const updated = getBroadcastCampaignById(id);
  if (isNeonEnabled()) {
    persistBroadcastToNeon(updated).catch(e => console.warn('[Neon Sync] Broadcast persist error:', e.message));
  }

  return updated;
}

/**
 * Delete a broadcast campaign
 */
export function deleteBroadcastCampaign(id: string, user: { name: string }): boolean {
  db.prepare('DELETE FROM broadcast_recipients WHERE broadcast_id = ?').run(id);
  db.prepare('DELETE FROM broadcast_campaigns WHERE id = ?').run(id);

  if (isNeonEnabled() && sql) {
    sql.query('DELETE FROM broadcast_recipients WHERE broadcast_id = $1', [id]).catch(() => {});
    sql.query('DELETE FROM broadcast_campaigns WHERE id = $1', [id]).catch(() => {});
  }

  logAudit({
    userName: user.name,
    action: 'BROADCAST_DELETED',
    entity: 'broadcast_campaign',
    entityId: id
  });
  return true;
}

/**
 * Submit draft broadcast for approval
 */
export function submitBroadcastForApproval(id: string, user: { name: string }): any {
  const existing = getBroadcastCampaignById(id);
  if (!existing) throw new Error('Broadcast campaign not found');

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE broadcast_campaigns
    SET status = 'PENDING_APPROVAL',
        approval_status = 'PENDING',
        rejection_reason = NULL,
        submitted_by = ?,
        submitted_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(user.name, now, now, id);

  // Notify Admins
  try {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO notifications (id, title, message, type, entity_type, entity_id, created_at)
      VALUES (?, ?, ?, 'BROADCAST_APPROVAL', 'broadcast_campaign', ?, ?)
    `).run(
      notifId,
      'Broadcast Campaign Pending Approval',
      `${user.name} submitted campaign "${existing.name}" (${existing.total_targeted} leads) for review and approval.`,
      id,
      now
    );
  } catch {}

  const updated = getBroadcastCampaignById(id);
  if (isNeonEnabled()) {
    persistBroadcastToNeon(updated).catch(() => {});
  }
  return updated;
}

/**
 * Approve a broadcast campaign
 */
export function approveBroadcastCampaign(id: string, user: { name: string; role: string }): any {
  const existing = getBroadcastCampaignById(id);
  if (!existing) throw new Error('Broadcast campaign not found');

  const now = new Date().toISOString();
  const isScheduledForFuture = existing.scheduled_at && new Date(existing.scheduled_at) > new Date();
  const nextStatus = isScheduledForFuture ? 'SCHEDULED' : 'APPROVED';

  db.prepare(`
    UPDATE broadcast_campaigns
    SET status = ?,
        approval_status = 'APPROVED',
        rejection_reason = NULL,
        approved_by = ?,
        approved_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(nextStatus, user.name, now, now, id);

  logAudit({
    userName: user.name,
    action: 'BROADCAST_APPROVED',
    entity: 'broadcast_campaign',
    entityId: id,
    newValue: { status: nextStatus, scheduled_at: existing.scheduled_at }
  });

  const updated = getBroadcastCampaignById(id);
  if (isNeonEnabled()) {
    persistBroadcastToNeon(updated).catch(() => {});
  }
  return updated;
}

/**
 * Reject a broadcast campaign with reason
 */
export function rejectBroadcastCampaign(id: string, user: { name: string; role: string }, reason: string): any {
  if (!reason || !reason.trim()) {
    throw new Error('A rejection reason is required');
  }

  const existing = getBroadcastCampaignById(id);
  if (!existing) throw new Error('Broadcast campaign not found');

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE broadcast_campaigns
    SET status = 'REJECTED',
        approval_status = 'REJECTED',
        rejection_reason = ?,
        approved_by = ?,
        approved_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(reason.trim(), user.name, now, now, id);

  logAudit({
    userName: user.name,
    action: 'BROADCAST_REJECTED',
    entity: 'broadcast_campaign',
    entityId: id,
    newValue: { reason: reason.trim() }
  });

  const updated = getBroadcastCampaignById(id);
  if (isNeonEnabled()) {
    persistBroadcastToNeon(updated).catch(() => {});
  }
  return updated;
}

/**
 * Execute dispatch of an approved or scheduled campaign
 */
export function dispatchBroadcastCampaign(id: string, performedBy = 'Super Admin'): {
  broadcast_id: string;
  total_targeted: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  sample_previews: any[];
} {
  const broadcast = getBroadcastCampaignById(id);
  if (!broadcast) throw new Error('Broadcast campaign not found');

  if (broadcast.status === 'COMPLETED') {
    throw new Error('This broadcast campaign has already been completed');
  }

  // Update status to SENDING
  db.prepare("UPDATE broadcast_campaigns SET status = 'SENDING', updated_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    id
  );

  const filter = broadcast.filter_criteria || {};
  const channel: 'Email' | 'WhatsApp' | 'Both' = broadcast.channel;
  const { where, params } = buildAudienceQuery(filter, channel);

  const targetLeadsQuery = `
    SELECT 
      l.*,
      c.name as counselor_name, c.email as counselor_email, c.phone as counselor_phone
    FROM leads l
    LEFT JOIN counselors c ON l.assigned_counselor_id = c.id
    ${where}
    ORDER BY l.created_at DESC
  `;

  const targetLeads = db.prepare(targetLeadsQuery).all(...params) as any[];
  const now = new Date().toISOString();

  let sentCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;
  const samplePreviews: any[] = [];

  const insertRecipient = db.prepare(`
    INSERT INTO broadcast_recipients (
      id, broadcast_id, lead_id, recipient_name, channel, address, status,
      open_token, sent_at, delivered_at, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'DELIVERED', ?, ?, ?, ?)
  `);

  const insertMessage = db.prepare(`
    INSERT INTO messages (
      id, lead_id, channel, recipient, sender, template_id, content, status, metadata, sent_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Sent', ?, ?)
  `);

  const insertLeadActivity = db.prepare(`
    INSERT INTO lead_activities (
      id, lead_id, activity_type, title, description, performed_by, metadata, created_at
    )
    VALUES (?, ?, 'BROADCAST_SENT', ?, ?, ?, ?, ?)
  `);

  const updateLeadAttribution = db.prepare(`
    UPDATE leads
    SET last_campaign_id = ?,
        last_campaign_name = ?,
        updated_at = ?
    WHERE id = ?
  `);

  const baseUrl = process.env.PUBLIC_APP_URL || 'https://education-sansar-crm.vercel.app';

  const runDispatchTransaction = db.transaction(() => {
    for (const lead of targetLeads) {
      try {
        const studentName = lead.student_name || lead.first_name || 'Student';
        const firstName = lead.first_name || studentName.split(' ')[0];

        // Determine destination channels for this lead
        const deliverEmail = (channel === 'Email' || channel === 'Both') && lead.email && lead.email.includes('@') && !lead.email_opt_out;
        const deliverWA = (channel === 'WhatsApp' || channel === 'Both') && (lead.whatsapp_number || lead.phone) && !lead.whatsapp_opt_out;

        const channelsToSend: ('Email' | 'WhatsApp')[] = [];
        if (deliverEmail) channelsToSend.push('Email');
        if (deliverWA) channelsToSend.push('WhatsApp');

        // Fallback: if 'Both' chosen but only one is deliverable
        if (channelsToSend.length === 0) {
          if (lead.email && !lead.email_opt_out) channelsToSend.push('Email');
          else if ((lead.whatsapp_number || lead.phone) && !lead.whatsapp_opt_out) channelsToSend.push('WhatsApp');
        }

        for (const destChannel of channelsToSend) {
          const recipientAddress = destChannel === 'WhatsApp' ? (lead.whatsapp_number || lead.phone) : lead.email;
          const openToken = 'tok_' + crypto.randomUUID().replace(/-/g, '');

          const unsubscribeLink = `${baseUrl}/api/broadcasts/unsubscribe?token=${openToken}`;
          const openTrackingPixel = `<img src="${baseUrl}/api/broadcasts/track/open/${openToken}" width="1" height="1" style="display:none" alt="" />`;

          const mergeVars: Record<string, any> = {
            student_name: studentName,
            first_name: firstName,
            preferred_course: lead.preferred_course || 'Chosen Course',
            preferred_university: lead.preferred_university || 'Partner University',
            city: lead.city || 'Nepal',
            phone: lead.phone,
            email: lead.email,
            counselor_name: lead.counselor_name || 'Gems Group Services Admissions',
            counselor_phone: lead.counselor_phone || '+977 9801234567',
            counselor_email: lead.counselor_email || 'admissions@gemsgroupservices.com',
            application_id: 'APP-' + lead.id.substring(0, 8).toUpperCase(),
            deadline: '30th November 2026',
            portal_url: baseUrl,
            unsubscribe_link: unsubscribeLink,
            opt_out_instruction: 'Reply STOP to unsubscribe from WhatsApp broadcast alerts.'
          };

          const rawSubject = broadcast.subject || (destChannel === 'WhatsApp' ? broadcast.name : 'Admissions Notice');
          const resolvedSubject = interpolateMergeTags(rawSubject, mergeVars);
          let resolvedBody = interpolateMergeTags(broadcast.content, mergeVars);

          // Append channel-specific compliance footers
          if (destChannel === 'Email') {
            resolvedBody += `\n\n---\nTo unsubscribe from future broadcast emails, click here: ${unsubscribeLink}\n${openTrackingPixel}`;
          } else {
            resolvedBody += `\n\nReply STOP to unsubscribe from WhatsApp broadcast alerts.`;
          }

          const recipientId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          insertRecipient.run(
            recipientId,
            id,
            lead.id,
            studentName,
            destChannel,
            recipientAddress,
            openToken,
            now,
            now,
            now
          );

          const msgId = `msg-bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          insertMessage.run(
            msgId,
            lead.id,
            destChannel,
            recipientAddress,
            broadcast.sender_name || 'Gems Group Services Admissions',
            broadcast.template_id || null,
            resolvedBody,
            JSON.stringify({
              broadcast_id: id,
              broadcast_name: broadcast.name,
              subject: resolvedSubject,
              open_token: openToken
            }),
            now
          );

          sentCount++;
          deliveredCount++;

          if (samplePreviews.length < 5) {
            samplePreviews.push({
              recipient_name: studentName,
              address: recipientAddress,
              channel: destChannel,
              subject: resolvedSubject,
              snippet: resolvedBody.substring(0, 160) + '...'
            });
          }
        }

        // Record touchpoint on lead activity timeline
        const actId = `act-bc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        insertLeadActivity.run(
          actId,
          lead.id,
          `Broadcast: ${broadcast.name} (${channelsToSend.join(' & ')})`,
          `Received broadcast message regarding ${lead.preferred_course} at ${lead.preferred_university}`,
          performedBy,
          JSON.stringify({ broadcast_id: id, broadcast_name: broadcast.name, channels: channelsToSend }),
          now
        );

        // Update lead attribution
        updateLeadAttribution.run(id, broadcast.name, now, lead.id);

      } catch (err: any) {
        failedCount++;
      }
    }

    // Update broadcast campaign record
    db.prepare(`
      UPDATE broadcast_campaigns
      SET status = 'COMPLETED',
          executed_at = ?,
          total_targeted = ?,
          sent_count = ?,
          delivered_count = ?,
          bounced_count = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      now,
      targetLeads.length,
      sentCount,
      deliveredCount,
      failedCount,
      now,
      id
    );
  });

  runDispatchTransaction();

  logAudit({
    userName: performedBy,
    action: 'BROADCAST_DISPATCHED',
    entity: 'broadcast_campaign',
    entityId: id,
    newValue: {
      targeted: targetLeads.length,
      sent: sentCount,
      delivered: deliveredCount,
      failed: failedCount
    }
  });

  const updatedCampaign = getBroadcastCampaignById(id);
  if (isNeonEnabled()) {
    persistBroadcastToNeon(updatedCampaign).catch(() => {});
  }

  return {
    ...(updatedCampaign || {}),
    broadcast_id: id,
    id,
    total_targeted: targetLeads.length,
    sent_count: sentCount,
    delivered_count: deliveredCount,
    failed_count: failedCount,
    sample_previews: samplePreviews
  };
}

/**
 * Background Scheduler: Dispatches any scheduled campaigns whose scheduled_at time has arrived
 */
export function checkAndRunScheduledBroadcasts(): void {
  try {
    const scheduled = db.prepare(`
      SELECT id, name, scheduled_at 
      FROM broadcast_campaigns 
      WHERE status = 'SCHEDULED' 
        AND scheduled_at IS NOT NULL 
        AND scheduled_at <= datetime('now')
    `).all() as any[];

    if (scheduled && scheduled.length > 0) {
      console.log(`[Broadcast Scheduler] Found ${scheduled.length} scheduled broadcast(s) ready to execute.`);
      for (const bc of scheduled) {
        try {
          console.log(`[Broadcast Scheduler] Dispatching broadcast "${bc.name}" (${bc.id})...`);
          dispatchBroadcastCampaign(bc.id, 'Automated Scheduler');
        } catch (dispatchErr: any) {
          console.error(`[Broadcast Scheduler] Failed to dispatch ${bc.id}:`, dispatchErr.message);
        }
      }
    }
  } catch (err: any) {
    console.error('[Broadcast Scheduler] Error during scheduled check:', err.message);
  }
}

/**
 * Track email open event via tracking pixel
 */
export function trackOpenEvent(token: string): boolean {
  if (!token) return false;
  try {
    const recipient = db.prepare('SELECT * FROM broadcast_recipients WHERE open_token = ?').get(token) as any;
    if (!recipient) return false;

    // Only count first open
    if (!recipient.opened_at) {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE broadcast_recipients
        SET opened_at = ?,
            status = 'OPENED'
        WHERE open_token = ?
      `).run(now, token);

      db.prepare(`
        UPDATE broadcast_campaigns
        SET opened_count = opened_count + 1,
            updated_at = ?
        WHERE id = ?
      `).run(now, recipient.broadcast_id);

      if (isNeonEnabled() && sql) {
        sql.query(`UPDATE broadcast_campaigns SET opened_count = opened_count + 1 WHERE id = $1`, [recipient.broadcast_id]).catch(() => {});
      }
    }
    return true;
  } catch (e: any) {
    console.warn('[Track Open Error]', e.message);
    return false;
  }
}

/**
 * Track email/link click or reply
 */
export function trackClickOrReplyEvent(token: string): { success: boolean; broadcast_id?: string } {
  if (!token) return { success: false };
  try {
    const recipient = db.prepare('SELECT * FROM broadcast_recipients WHERE open_token = ?').get(token) as any;
    if (!recipient) return { success: false };

    const now = new Date().toISOString();
    if (!recipient.replied_at) {
      db.prepare(`
        UPDATE broadcast_recipients
        SET replied_at = ?,
            status = 'REPLIED'
        WHERE open_token = ?
      `).run(now, token);

      db.prepare(`
        UPDATE broadcast_campaigns
        SET replied_count = replied_count + 1,
            updated_at = ?
        WHERE id = ?
      `).run(now, recipient.broadcast_id);

      if (isNeonEnabled() && sql) {
        sql.query(`UPDATE broadcast_campaigns SET replied_count = replied_count + 1 WHERE id = $1`, [recipient.broadcast_id]).catch(() => {});
      }
    }
    return { success: true, broadcast_id: recipient.broadcast_id };
  } catch (e: any) {
    return { success: false };
  }
}

/**
 * Handle student opt-out from Email or WhatsApp
 */
export function handleLeadOptOut(params: {
  leadId?: string;
  identifier?: string;
  channel: 'Email' | 'WhatsApp';
  reason?: string;
  campaignId?: string;
  token?: string;
}): { success: boolean; message: string } {
  try {
    let leadId = params.leadId;
    let identifier = params.identifier;
    let campaignId = params.campaignId;

    // Resolve via open_token if provided
    if (params.token) {
      const rec = db.prepare('SELECT * FROM broadcast_recipients WHERE open_token = ?').get(params.token) as any;
      if (rec) {
        leadId = rec.lead_id;
        identifier = rec.address;
        campaignId = rec.broadcast_id;
      }
    }

    // Resolve lead by email or phone if leadId not passed
    if (!leadId && identifier) {
      const found = db.prepare(`
        SELECT id, email, phone, whatsapp_number 
        FROM leads 
        WHERE LOWER(email) = LOWER(?) OR phone = ? OR whatsapp_number = ?
        LIMIT 1
      `).get(identifier, identifier, identifier) as any;
      if (found) {
        leadId = found.id;
      }
    }

    const now = new Date().toISOString();
    const optId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Update lead record
    if (leadId) {
      if (params.channel === 'Email') {
        db.prepare('UPDATE leads SET email_opt_out = 1, email_opt_out_date = ?, updated_at = ? WHERE id = ?').run(now, now, leadId);
      } else {
        db.prepare('UPDATE leads SET whatsapp_opt_out = 1, whatsapp_opt_out_date = ?, updated_at = ? WHERE id = ?').run(now, now, leadId);
      }

      // Record in lead activity
      const actId = `act-opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, created_at)
        VALUES (?, ?, 'OPT_OUT', ?, ?, 'Student Self-Service', ?)
      `).run(
        actId,
        leadId,
        `Opted out of ${params.channel} Broadcasts`,
        params.reason || `Student requested to unsubscribe from ${params.channel} updates`,
        now
      );
    }

    // Insert into lead_opt_outs table
    db.prepare(`
      INSERT INTO lead_opt_outs (id, lead_id, channel, identifier, reason, campaign_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      optId,
      leadId || null,
      params.channel,
      identifier || (leadId ? `lead:${leadId}` : 'unknown'),
      params.reason || 'User clicked unsubscribe',
      campaignId || null,
      now
    );

    // If linked to campaign, mark recipient status and increment campaign opt_out_count
    if (campaignId) {
      if (leadId) {
        db.prepare(`
          UPDATE broadcast_recipients
          SET status = 'OPTED_OUT',
              opted_out_at = ?
          WHERE broadcast_id = ? AND lead_id = ?
        `).run(now, campaignId, leadId);
      }
      db.prepare(`
        UPDATE broadcast_campaigns
        SET opt_out_count = opt_out_count + 1,
            updated_at = ?
        WHERE id = ?
      `).run(now, campaignId);
    }

    if (isNeonEnabled()) {
      persistLeadOptOutToNeon({
        id: optId,
        lead_id: leadId,
        channel: params.channel,
        identifier: identifier || '',
        reason: params.reason,
        campaign_id: campaignId
      }).catch(() => {});
    }

    return { success: true, message: `Successfully opted out from ${params.channel} communications.` };
  } catch (err: any) {
    console.error('[Opt Out Error]', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Re-subscribe a lead (admin or user manual re-opt-in)
 */
export function resubscribeLead(leadId: string, channel: 'Email' | 'WhatsApp'): boolean {
  const now = new Date().toISOString();
  if (channel === 'Email') {
    db.prepare('UPDATE leads SET email_opt_out = 0, email_opt_out_date = NULL, updated_at = ? WHERE id = ?').run(now, leadId);
  } else {
    db.prepare('UPDATE leads SET whatsapp_opt_out = 0, whatsapp_opt_out_date = NULL, updated_at = ? WHERE id = ?').run(now, leadId);
  }

  // Remove from lead_opt_outs
  db.prepare('DELETE FROM lead_opt_outs WHERE lead_id = ? AND channel = ?').run(leadId, channel);

  // Add lead activity
  const actId = `act-resub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  db.prepare(`
    INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, created_at)
    VALUES (?, ?, 'RESUBSCRIBED', ?, ?, 'Admin', ?)
  `).run(
    actId,
    leadId,
    `Resubscribed to ${channel}`,
    `Lead preferences updated: Resubscribed to ${channel} communications`,
    now
  );

  return true;
}

/**
 * Get all opted-out leads
 */
export function getOptOutList(): any[] {
  return db.prepare(`
    SELECT 
      o.*,
      l.student_name, l.phone, l.email, l.city, l.preferred_course, l.preferred_university,
      b.name as campaign_name
    FROM lead_opt_outs o
    LEFT JOIN leads l ON o.lead_id = l.id
    LEFT JOIN broadcast_campaigns b ON o.campaign_id = b.id
    ORDER BY o.created_at DESC
  `).all();
}

/**
 * Get drilldown recipients for a specific broadcast campaign
 */
export function getBroadcastRecipients(
  broadcastId: string,
  options?: { status?: string; search?: string; limit?: number; offset?: number }
): { recipients: any[]; total: number } {
  let query = 'SELECT * FROM broadcast_recipients WHERE broadcast_id = ?';
  const params: any[] = [broadcastId];

  if (options?.status && options.status !== 'ALL') {
    query += ' AND status = ?';
    params.push(options.status);
  }

  if (options?.search && options.search.trim()) {
    query += ' AND (recipient_name LIKE ? OR address LIKE ?)';
    const term = `%${options.search.trim()}%`;
    params.push(term, term);
  }

  const countQuery = `SELECT count(*) as count FROM (${query})`;
  const total = (db.prepare(countQuery).get(...params) as { count: number }).count;

  query += ' ORDER BY created_at DESC';
  if (options?.limit) {
    query += ' LIMIT ? OFFSET ?';
    params.push(options.limit, options.offset || 0);
  }

  const recipients = db.prepare(query).all(...params);
  return { recipients, total };
}

/**
 * Attribute conversion to broadcast campaign when lead enrolls or pays fees
 */
export function attributeLeadConversion(leadId: string, feeAmount: number): boolean {
  try {
    const lead = db.prepare('SELECT id, last_campaign_id FROM leads WHERE id = ?').get(leadId) as any;
    if (!lead || !lead.last_campaign_id) return false;

    const campaignId = lead.last_campaign_id;
    const now = new Date().toISOString();

    // Mark recipient record as converted
    db.prepare(`
      UPDATE broadcast_recipients
      SET is_converted = 1,
          converted_at = ?,
          conversion_revenue = ?
      WHERE broadcast_id = ? AND lead_id = ?
    `).run(now, feeAmount, campaignId, leadId);

    // Update campaign counters
    db.prepare(`
      UPDATE broadcast_campaigns
      SET conversions_count = conversions_count + 1,
          conversions_revenue = conversions_revenue + ?,
          updated_at = ?
      WHERE id = ?
    `).run(feeAmount, now, campaignId);

    if (isNeonEnabled() && sql) {
      sql.query(`
        UPDATE broadcast_campaigns 
        SET conversions_count = conversions_count + 1, 
            conversions_revenue = conversions_revenue + $1 
        WHERE id = $2
      `, [feeAmount, campaignId]).catch(() => {});
    }
    return true;
  } catch (err: any) {
    console.warn('[Attribution Error]', err.message);
    return false;
  }
}

/**
 * Get broadcast touchpoints for a specific lead
 */
export function getLeadBroadcastHistory(leadId: string): any[] {
  return db.prepare(`
    SELECT 
      r.*,
      b.name as campaign_name,
      b.subject as campaign_subject,
      b.created_by as campaign_creator
    FROM broadcast_recipients r
    JOIN broadcast_campaigns b ON r.broadcast_id = b.id
    WHERE r.lead_id = ?
    ORDER BY r.created_at DESC
  `).all(leadId);
}

/**
 * Test / Simulation helper for QA & demo (simulate delivered, opened, or replied event)
 */
export function simulateRecipientAction(
  broadcastId: string,
  recipientId: string,
  action: 'deliver' | 'open' | 'reply' | 'opt_out'
): any {
  const rec = db.prepare('SELECT * FROM broadcast_recipients WHERE id = ? AND broadcast_id = ?').get(recipientId, broadcastId) as any;
  if (!rec) throw new Error('Recipient not found');

  const now = new Date().toISOString();

  if (action === 'open') {
    db.prepare("UPDATE broadcast_recipients SET status = 'OPENED', opened_at = ? WHERE id = ?").run(now, recipientId);
    db.prepare("UPDATE broadcast_campaigns SET opened_count = opened_count + 1, updated_at = ? WHERE id = ?").run(now, broadcastId);
  } else if (action === 'reply') {
    db.prepare("UPDATE broadcast_recipients SET status = 'REPLIED', replied_at = ? WHERE id = ?").run(now, recipientId);
    db.prepare("UPDATE broadcast_campaigns SET replied_count = replied_count + 1, updated_at = ? WHERE id = ?").run(now, broadcastId);
  } else if (action === 'opt_out') {
    handleLeadOptOut({
      leadId: rec.lead_id,
      identifier: rec.address,
      channel: rec.channel,
      campaignId: broadcastId,
      reason: 'User simulated opt-out'
    });
  }

  return getBroadcastCampaignById(broadcastId);
}
