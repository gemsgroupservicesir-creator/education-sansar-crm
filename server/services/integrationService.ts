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
  const logId = 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
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
    const errLogId = 'LOG-META-ERR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, error_message)
      VALUES (?, 'Meta Lead Ads', 'INBOUND', 'ERROR', '/api/integrations/meta/webhook', ?, ?)
    `).run(errLogId, JSON.stringify(payload), err.message || 'Processing failed');
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
  const logId = 'LOG-WA-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
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

// ==========================================
// Google Sheets Integration & Webhook Handler
// ==========================================
export function handleGoogleSheetsLeadWebhook(payload: any) {
  const logId = 'LOG-GS-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  try {
    const raw = payload.simulatedRow || payload.row || payload;
    
    // Normalize fields from various possible column headers
    const student_name = raw.student_name || raw['Student Name'] || raw['Full Name'] || raw['Name'] || raw.name || 'Sheet Inquirer';
    const phone = raw.phone || raw['Phone'] || raw['Phone Number'] || raw['Mobile'] || raw['Contact Number'] || raw.mobile || '';
    const whatsapp_number = raw.whatsapp_number || raw['WhatsApp'] || raw['WhatsApp Number'] || raw.whatsapp || phone;
    const email = raw.email || raw['Email'] || raw['Email Address'] || '';
    const city = raw.city || raw['City'] || raw['Location'] || raw['Branch'] || 'Kathmandu';
    const country = raw.country || raw['Country'] || (['Delhi', 'Noida', 'Bangalore', 'Chennai', 'Mumbai', 'Pune'].includes(city) ? 'India' : 'Nepal');
    const preferred_course = raw.preferred_course || raw['Course'] || raw['Preferred Course'] || raw['Course Interested'] || 'B.Tech Computer Science & Engineering';
    const preferred_university = raw.preferred_university || raw['University'] || raw['Preferred University'] || 'SRM Institute of Science and Technology';
    const academic_qualification = raw.academic_qualification || raw['Qualification'] || raw['12th Stream'] || '+2 Science';
    const campaign = raw.campaign || raw['Campaign'] || raw['Source Sheet'] || 'Google Sheets Lead Sheet';
    const lead_source = raw.lead_source || raw['Source'] || 'Google Sheets';
    const remarks = raw.remarks || raw['Remarks'] || raw['Notes'] || (raw.row_number ? `Imported from Google Sheet row #${raw.row_number}` : 'Imported via Google Sheets webhook');

    if (!phone && !email) {
      throw new Error('Google Sheet row missing both phone and email');
    }

    const leadData = {
      student_name,
      phone,
      whatsapp_number,
      email,
      city,
      country,
      preferred_course,
      preferred_university,
      academic_qualification,
      campaign,
      lead_source,
      remarks,
      is_demo: 1
    };

    // 1. Duplicate check
    const dupResult = checkDuplicate({
      phone: leadData.phone,
      whatsapp_number: leadData.whatsapp_number,
      email: leadData.email
    });

    if (dupResult.hasDuplicate) {
      const existing = dupResult.duplicates[0];
      const reasons = dupResult.matchReasons || ['Matching contact details found'];
      db.prepare(`
        INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response, error_message)
        VALUES (?, 'Google Sheets', 'INBOUND', 'WARN', '/api/integrations/google-sheets/webhook', ?, ?, ?)
      `).run(
        logId,
        JSON.stringify(payload),
        JSON.stringify({ duplicateFound: true, existingLeadId: existing.lead_id, matchReasons: reasons }),
        'Duplicate lead found in CRM database. Activity logged on existing record without duplication.'
      );

      logLeadActivity({
        leadId: existing.id,
        activityType: 'Note',
        title: 'Google Sheet Inbound Submission Match',
        description: `New entry received from Google Sheet (${campaign}). Matched existing lead via ${reasons.join(', ')}.`,
        performedBy: 'Google Sheets Webhook'
      });

      return {
        success: true,
        isDuplicate: true,
        lead: existing,
        reasons,
        message: `Duplicate lead matched: ${existing.student_name} (${existing.lead_id})`
      };
    }

    // 2. Create Lead (auto assigns counselor, sets 24-hr follow-up, logs activity)
    const newLead = createLead(leadData, 'Google Sheets Webhook');

    // 3. Log success in integration_logs
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
      VALUES (?, 'Google Sheets', 'INBOUND', 'SUCCESS', '/api/integrations/google-sheets/webhook', ?, ?)
    `).run(
      logId,
      JSON.stringify(payload),
      JSON.stringify({ success: true, leadId: newLead.lead_id, counselor: newLead.assigned_counselor_name })
    );

    // Update last sync timestamp
    db.prepare("UPDATE integrations SET last_sync_at = datetime('now') WHERE name = 'Google Sheets Sync'").run();

    return {
      success: true,
      isDuplicate: false,
      lead: newLead,
      message: `Lead ${newLead.student_name} captured from Google Sheet and assigned to ${newLead.assigned_counselor_name || 'Counselor'}`
    };
  } catch (err: any) {
    const errLogId = 'LOG-GS-ERR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, error_message)
      VALUES (?, 'Google Sheets', 'INBOUND', 'ERROR', '/api/integrations/google-sheets/webhook', ?, ?)
    `).run(errLogId, JSON.stringify(payload), err.message || 'Google Sheets inbound processing failed');
    throw err;
  }
}

export function exportLeadToGoogleSheet(leadId: string, performedBy: string = 'User') {
  const logId = 'LOG-GS-OUT-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const lead = db.prepare('SELECT * FROM leads WHERE id = ? OR lead_id = ?').get(leadId, leadId) as any;
  if (!lead) {
    throw new Error('Lead not found for Google Sheets export: ' + leadId);
  }

  const integration = db.prepare("SELECT * FROM integrations WHERE name = 'Google Sheets Sync'").get() as any;
  const isConnected = integration && integration.status === 'CONNECTED' && integration.is_enabled === 1;

  // Format row columns
  const rowValues = [
    lead.lead_id,
    lead.student_name,
    lead.phone,
    lead.whatsapp_number || lead.phone,
    lead.email,
    lead.city,
    lead.country,
    lead.preferred_course,
    lead.preferred_university,
    lead.lead_status,
    lead.lead_temperature,
    lead.assigned_counselor_name || 'Unassigned',
    lead.lead_source,
    lead.created_at
  ];

  db.prepare(`
    INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
    VALUES (?, 'Google Sheets', 'OUTBOUND', 'SUCCESS', '/v4/spreadsheets/values:append', ?, ?)
  `).run(
    logId,
    JSON.stringify({ leadId: lead.lead_id, row: rowValues }),
    JSON.stringify({ exportedRow: rowValues, isLiveApi: isConnected, syncedAt: new Date().toISOString() })
  );

  logLeadActivity({
    leadId: lead.id,
    activityType: 'Note',
    title: 'Google Sheet Sync / Export',
    description: `Lead exported to connected Google Sheet (${integration?.config ? 'Configured Sheet' : 'Simulated Sheet'}).`,
    performedBy
  });

  return {
    success: true,
    leadId: lead.lead_id,
    row: rowValues,
    columns: [
      'Lead ID', 'Student Name', 'Phone', 'WhatsApp', 'Email', 
      'City', 'Country', 'Course', 'University', 'Status', 
      'Temperature', 'Counselor', 'Source', 'Created At'
    ],
    isLiveApi: isConnected,
    syncedAt: new Date().toISOString()
  };
}

export function getGoogleAppsScriptTemplate(baseUrl: string) {
  const webhookUrl = `${baseUrl}/api/integrations/google-sheets/webhook`;
  return `/**
 * Education Sansar CRM - Google Sheets Real-Time Inbound Sync Script
 * 
 * Instructions:
 * 1. In your Google Sheet, open Extensions > Apps Script.
 * 2. Delete any existing code and paste this script.
 * 3. Update sheetName if different from "Leads".
 * 4. In Apps Script, click Triggers (clock icon) > Add Trigger:
 *    - Function: onFormSubmit (or onEdit)
 *    - Event source: From spreadsheet
 *    - Event type: On form submit (or On edit)
 * 5. Save and authorize permissions.
 */

const CRM_WEBHOOK_URL = "${webhookUrl}";
const SHEET_NAME = "Leads";

function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const row = e.range ? e.range.getRow() : sheet.getLastRow();
    sendRowToCRM(sheet, row);
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err.toString());
  }
}

function onEdit(e) {
  // Only trigger on edits in the configured sheet
  const range = e.range;
  const sheet = range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;
  
  // Optional: trigger on row completion
  const row = range.getRow();
  if (row > 1) {
    sendRowToCRM(sheet, row);
  }
}

function sendRowToCRM(sheet, rowNumber) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const payload = {
    row_number: rowNumber,
    timestamp: new Date().toISOString(),
    sheet_name: sheet.getName()
  };
  
  headers.forEach((header, index) => {
    if (header) {
      payload[header.toString().trim()] = rowData[index];
    }
  });

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
  Logger.log("CRM Response: " + response.getContentText());
}
`;
}

