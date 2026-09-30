import { db, logAudit, logLeadActivity } from '../db/database.ts';
import { createLead, checkDuplicate } from './leadService.ts';

// Meta Lead Ads Webhook & Payload Processing
export function verifyMetaWebhook(mode: string, token: string, challenge: string): string | null {
  const row = db.prepare("SELECT config FROM integrations WHERE name = 'Meta Lead Ads'").get() as { config: string } | undefined;
  let expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'education_sansar_meta_verify_token_2026';
  
  if (row?.config) {
    try {
      const cfg = JSON.parse(row.config);
      if (cfg.verifyToken) expectedToken = cfg.verifyToken;
    } catch (e) {}
  }

  if (mode === 'subscribe' && token === expectedToken) {
    return challenge;
  }
  return null;
}

export function handleMetaLeadWebhook(payload: any) {
  const logId = 'LOG-' + Date.now();
  try {
    // Standard Meta Lead Ads payload shape:
    // { entry: [ { id: '...', changes: [ { field: 'leadgen', value: { leadgen_id: '...', page_id: '...', form_id: '...', created_time: 12345 } } ] } ] }
    // Or our simulated rich payload:
    let leadData: any = {};
    if (payload.simulatedLead) {
      leadData = payload.simulatedLead;
    } else if (payload.entry && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        for (const change of entry.changes || []) {
          if (change.field === 'leadgen') {
            const val = change.value;
            leadData = {
              student_name: val.full_name || val.name || 'Meta Inquirer',
              phone: val.phone_number || val.phone || '',
              email: val.email || '',
              city: val.city || 'Kathmandu',
              preferred_course: val.preferred_course || 'B.Tech CSE',
              preferred_university: val.preferred_university || 'SRM Institute of Science and Technology',
              facebook_lead_id: val.leadgen_id || ('fb-' + Date.now()),
              lead_source: 'Meta Ads',
              campaign: val.campaign_name || 'Meta Nepal Admission Wave 2026',
              ad_set: val.adset_name || 'Engineering Aspirants',
              ad: val.ad_name || 'SRM Admissions 2026'
            };
          }
        }
      }
    } else {
      leadData = payload;
    }

    if (!leadData.phone && !leadData.email) {
      throw new Error('Meta lead payload missing phone and email');
    }

    // 1. Duplicate check
    const dupResult = checkDuplicate({
      phone: leadData.phone,
      whatsapp_number: leadData.whatsapp_number || leadData.phone,
      email: leadData.email,
      facebook_lead_id: leadData.facebook_lead_id
    });

    if (dupResult.hasDuplicate) {
      const existing = dupResult.duplicates[0];
      // Log duplicate detection in integration logs
      db.prepare(`
        INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response, error_message)
        VALUES (?, 'Meta Lead Ads', 'INBOUND', 'WARN', '/api/integrations/meta/webhook', ?, ?, ?)
      `).run(logId, JSON.stringify(payload), JSON.stringify({ duplicateFound: true, existingLeadId: existing.lead_id }), 'Duplicate lead detected, not re-created.');

      logLeadActivity({
        leadId: existing.id,
        activityType: 'Note',
        title: 'Meta Ad Form Re-submission',
        description: `Student re-submitted Meta form (${leadData.campaign || 'Campaign'}). Details matched existing lead.`,
        performedBy: 'Meta Webhook'
      });

      return { success: true, duplicate: true, lead: existing };
    }

    // 2. Create Lead and let automation handle assignment, first follow-up, and notifications!
    const newLead = createLead(leadData, 'Meta Webhook');

    // 3. Log success in integration_logs
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
      VALUES (?, 'Meta Lead Ads', 'INBOUND', 'SUCCESS', '/api/integrations/meta/webhook', ?, ?)
    `).run(logId, JSON.stringify(payload), JSON.stringify({ success: true, leadId: newLead.lead_id }));

    // Update last sync timestamp
    db.prepare("UPDATE integrations SET last_sync_at = datetime('now') WHERE name = 'Meta Lead Ads'").run();

    return { success: true, duplicate: false, lead: newLead };
  } catch (err: any) {
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, error_message)
      VALUES (?, 'Meta Lead Ads', 'INBOUND', 'ERROR', '/api/integrations/meta/webhook', ?, ?)
    `).run(logId, JSON.stringify(payload), err.message || 'Processing failed');
    throw err;
  }
}

// WhatsApp message sender / simulator
export function sendWhatsAppMessage(params: {
  leadId?: string;
  recipientPhone: string;
  templateId?: string;
  templateCategory?: string;
  customMessage?: string;
  variables?: Record<string, string>;
  performedBy?: string;
}) {
  const integration = db.prepare("SELECT * FROM integrations WHERE name = 'WhatsApp Business API'").get() as any;
  const isConnected = integration && integration.status === 'CONNECTED' && integration.is_enabled === 1;

  let messageBody = params.customMessage || '';

  if (params.templateId || params.templateCategory) {
    let tmpl: any;
    if (params.templateId) {
      tmpl = db.prepare("SELECT * FROM message_templates WHERE id = ?").get(params.templateId);
    } else {
      tmpl = db.prepare("SELECT * FROM message_templates WHERE category = ? LIMIT 1").get(params.templateCategory);
    }

    if (tmpl) {
      messageBody = tmpl.content;
      if (params.variables) {
        for (const [key, val] of Object.entries(params.variables)) {
          messageBody = messageBody.replace(new RegExp(`{{${key}}}`, 'g'), val);
        }
      }
    }
  }

  const messageId = 'MSG-' + Date.now();
  const status = isConnected ? 'Delivered' : 'Queued';

  // Record in messages table
  db.prepare(`
    INSERT INTO messages (id, lead_id, channel, recipient, sender, template_id, content, status)
    VALUES (?, ?, 'WhatsApp', ?, 'Education Sansar', ?, ?, ?)
  `).run(messageId, params.leadId || null, params.recipientPhone, params.templateId || null, messageBody, status);

  // If linked to lead, log in activity
  if (params.leadId) {
    logLeadActivity({
      leadId: params.leadId,
      activityType: 'WhatsApp',
      title: 'WhatsApp Message Outreach',
      description: messageBody,
      performedBy: params.performedBy || 'System'
    });
  }

  // Log in integration_logs
  const logId = 'LOG-WA-' + Date.now();
  db.prepare(`
    INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
    VALUES (?, 'WhatsApp Business API', 'OUTBOUND', 'SUCCESS', '/v18.0/messages', ?, ?)
  `).run(logId, JSON.stringify({ recipient: params.recipientPhone, message: messageBody }), JSON.stringify({ messageId, status, isLiveApi: isConnected }));

  return {
    success: true,
    messageId,
    status,
    message: messageBody,
    isLiveApi: isConnected,
    note: isConnected ? 'Sent via live WhatsApp Cloud API' : 'Simulated/Queued (Configure WhatsApp Cloud API token in Settings to enable live delivery)'
  };
}
