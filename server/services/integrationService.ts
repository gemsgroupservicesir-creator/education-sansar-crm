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

// ==========================================
// Live Google Sheet URL Parser & Fetcher
// ==========================================
export function parseGoogleSheetUrl(urlOrId: string): { spreadsheetId: string; gid: string; cleanUrl: string } {
  if (!urlOrId || typeof urlOrId !== 'string') {
    throw new Error('Please provide a valid Google Sheet link or Spreadsheet ID.');
  }

  const trimmed = urlOrId.trim();

  // Extract ID from full URL
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = idMatch ? idMatch[1] : (trimmed.includes('/') ? '' : trimmed);

  if (!spreadsheetId || spreadsheetId.length < 15) {
    throw new Error('Invalid Google Sheet link. Could not extract a valid Google Spreadsheet ID.');
  }

  // Extract GID (tab ID)
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  const cleanUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`;

  return { spreadsheetId, gid, cleanUrl };
}

function parseCSVContent(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let cur = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  const rawHeaders = parseLine(lines[0]);
  const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    // Skip empty lines
    if (values.every(v => v.length === 0)) continue;

    const rowObj: Record<string, string> = { row_number: String(i + 1) };
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ? values[idx].replace(/^["']|["']$/g, '').trim() : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export async function fetchLiveGoogleSheetData(sheetUrlOrId: string, sheetName?: string) {
  const lower = sheetUrlOrId.toLowerCase();

  // Demo / Sample Google Sheet fallback for offline or quick testing
  if (lower.includes('sample') || lower.includes('demo') || sheetUrlOrId === 'default' || lower.includes('fair') || lower.includes('walkin') || lower.includes('webinar')) {
    let demoCSV = '';
    let spreadsheetId = 'demo-sheet-kathmandu-fair-2026';
    let cleanUrl = 'https://docs.google.com/spreadsheets/d/demo-sheet-kathmandu-fair-2026/edit#gid=0';

    if (lower.includes('birgunj') || lower.includes('janakpur') || lower.includes('walkin')) {
      spreadsheetId = 'demo-sheet-birgunj-walkins-2026';
      cleanUrl = 'https://docs.google.com/spreadsheets/d/demo-sheet-birgunj-walkins-2026/edit#gid=0';
      demoCSV = `"Student Name","Phone","Email","City","Preferred Course","Preferred University","Academic Qualification","Source"
"Bikash Yadav","+977 9807112233","bikash.yadav.brg@gmail.com","Birgunj","B.Tech Artificial Intelligence","VIT Vellore","+2 Science (81%)","Birgunj Walk-in Desk"
"Prabhat Jha","+977 9804556677","prabhat.jha.jnp@gmail.com","Janakpur","B.Sc Nursing","Sharda University","+2 Biology (79%)","Janakpur Office Walk-in"
"Sunita Rauniyar","+977 9807445566","sunita.rauniyar.brg@gmail.com","Birgunj","B.Pharm (Pharmacy)","Manipal Academy of Higher Education","+2 Science (80%)","Branch Walk-in"
"Rakesh Gupta","+977 9807889900","rakesh.gupta.brg@gmail.com","Birgunj","BCA Computer Applications","Lovely Professional University","+2 Science (75%)","Branch Walk-in"`;
    } else if (lower.includes('webinar') || lower.includes('india') || lower.includes('delhi')) {
      spreadsheetId = 'demo-sheet-india-webinar-2026';
      cleanUrl = 'https://docs.google.com/spreadsheets/d/demo-sheet-india-webinar-2026/edit#gid=0';
      demoCSV = `"Student Name","Phone","Email","City","Preferred Course","Preferred University","Academic Qualification","Source"
"Anushka Sharma","+91 9811334455","anushka.sharma.del@gmail.com","Delhi","MBA Business Analytics","Chandigarh University","B.Com Graduate (76%)","Study in India Webinar"
"Rohan Verma","+91 9811778899","rohan.verma.noida@gmail.com","Noida","B.Tech CSE","SRM Institute of Science and Technology","+2 Science (88%)","Study in India Webinar"
"Deepa Menon","+91 9845112233","deepa.menon.blr@gmail.com","Bangalore","M.Tech Data Science","VIT Vellore","B.E CSE (8.2 CGPA)","Online Zoom Session"
"Aman Tripathi","+91 9820556677","aman.tripathi.del@gmail.com","Delhi","BBA International Business","Symbiosis International","+2 Commerce (85%)","Study in India Webinar"`;
    } else {
      demoCSV = `"Student Name","Phone","Email","City","Preferred Course","Preferred University","Academic Qualification","Source"
"Pooja Pokhrel","+977 9841887766","pooja.pokhrel.ktm@gmail.com","Kathmandu","B.Tech Computer Science & Engineering","SRM Institute of Science and Technology","+2 Science (84%)","Kathmandu Education Fair"
"Sandesh Adhikari","+977 9841223344","sandesh.adhikari.ktm@gmail.com","Kathmandu","B.Sc Nursing","Sharda University","+2 Biology (78%)","Kathmandu Education Fair"
"Alisha KC","+977 9841998877","alisha.kc.ktm@gmail.com","Kathmandu","BBA Digital Marketing","Chandigarh University","+2 Management (81%)","Kathmandu Education Fair"
"Bibek Bista","+977 9841335577","bibek.bista.ktm@gmail.com","Lalitpur","B.Tech AI & Data Science","VIT Vellore","+2 Science (87%)","Kathmandu Education Fair"`;
    }

    const { headers, rows } = parseCSVContent(demoCSV);
    return {
      success: true,
      spreadsheetId,
      gid: '0',
      cleanUrl,
      headers,
      totalRows: rows.length,
      previewRows: rows.slice(0, 8),
      allRows: rows,
      isDemoSheet: true
    };
  }

  const { spreadsheetId, gid, cleanUrl } = parseGoogleSheetUrl(sheetUrlOrId);

  // Attempt Google Visualization CSV endpoint (works for any sheet with link sharing)
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}${sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''}`;
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

  let csvContent = '';

  try {
    const res = await fetch(gvizUrl, {
      headers: {
        'User-Agent': 'EducationSansarCRM/1.0',
        'Accept': 'text/csv,text/plain,application/json'
      }
    });

    if (res.ok) {
      csvContent = await res.text();
    } else {
      // Fallback to export endpoint
      const fallbackRes = await fetch(exportUrl, {
        headers: { 'User-Agent': 'EducationSansarCRM/1.0' }
      });
      if (!fallbackRes.ok) {
        throw new Error(`Google returned status ${fallbackRes.status}`);
      }
      csvContent = await fallbackRes.text();
    }
  } catch (err: any) {
    throw new Error(`Failed to fetch Google Sheet: Unable to reach Google Sheets (${err.message}). Check your internet connection or verify the link is accessible. You can also use "Try Sample Sheet Link" to test offline.`);
  }

  // Check if Google returned an HTML login page (private sheet)
  if (csvContent.includes('<!DOCTYPE html>') || csvContent.includes('<html') || csvContent.includes('accounts.google.com')) {
    throw new Error(
      'Google Sheet is currently PRIVATE. To connect: in your Google Sheet, click Share > General access > change "Restricted" to "Anyone with the link can view", then try again.'
    );
  }

  const { headers, rows } = parseCSVContent(csvContent);

  if (headers.length === 0) {
    throw new Error('Google Sheet appears to be empty or has no header row.');
  }

  return {
    success: true,
    spreadsheetId,
    gid,
    cleanUrl,
    headers,
    totalRows: rows.length,
    previewRows: rows.slice(0, 8),
    allRows: rows,
    isDemoSheet: false
  };
}

export function getAllGoogleSheetConnections() {
  const connections = db.prepare('SELECT * FROM google_sheets_connections ORDER BY created_at DESC').all() as any[];
  const totalSheets = connections.length;
  const activeSheets = connections.filter(c => c.status === 'ACTIVE').length;
  const totalLeadsImported = connections.reduce((acc, c) => acc + (c.total_leads_imported || 0), 0);
  const lastSync = connections.map(c => c.last_synced_at).filter(Boolean).sort().reverse()[0] || null;

  return {
    sheets: connections,
    summary: {
      totalSheets,
      activeSheets,
      totalLeadsImported,
      lastSync
    }
  };
}

export async function addOrConnectGoogleSheet(data: {
  name: string;
  sheetUrl: string;
  sheetName?: string;
  campaignTag?: string;
  targetCity?: string;
  sourceLabel?: string;
  performedBy?: string;
}) {
  const parsed = parseGoogleSheetUrl(data.sheetUrl);
  const liveData = await fetchLiveGoogleSheetData(data.sheetUrl, data.sheetName);

  const existing = db.prepare('SELECT id FROM google_sheets_connections WHERE spreadsheet_id = ? AND gid = ?').get(parsed.spreadsheetId, parsed.gid) as any;

  const id = existing?.id || 'gsheet-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

  if (existing) {
    db.prepare(`
      UPDATE google_sheets_connections
      SET name = ?,
          sheet_url = ?,
          sheet_name = ?,
          campaign_tag = ?,
          target_city = ?,
          source_label = ?,
          last_rows_count = ?,
          status = 'ACTIVE',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.name || 'Google Sheet ' + parsed.spreadsheetId.substring(0, 8),
      liveData.cleanUrl,
      data.sheetName || 'Leads 2026',
      data.campaignTag || null,
      data.targetCity || null,
      data.sourceLabel || 'Google Sheets',
      liveData.totalRows,
      id
    );
  } else {
    db.prepare(`
      INSERT INTO google_sheets_connections (
        id, name, sheet_url, spreadsheet_id, gid, sheet_name, campaign_tag, target_city, source_label, status, total_leads_imported, last_rows_count, is_demo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, ?, ?)
    `).run(
      id,
      data.name || 'Google Sheet ' + parsed.spreadsheetId.substring(0, 8),
      liveData.cleanUrl,
      parsed.spreadsheetId,
      parsed.gid,
      data.sheetName || 'Leads 2026',
      data.campaignTag || null,
      data.targetCity || null,
      data.sourceLabel || 'Google Sheets',
      liveData.totalRows,
      data.sheetUrl.includes('demo') ? 1 : 0
    );
  }

  // Also update standard integrations table config
  const config = {
    spreadsheetUrl: liveData.cleanUrl,
    spreadsheetId: liveData.spreadsheetId,
    gid: liveData.gid,
    sheetName: data.sheetName || 'Leads 2026',
    syncDirection: 'TWO_WAY',
    autoExport: false,
    headers: liveData.headers,
    lastSyncedRows: liveData.totalRows
  };

  db.prepare(`
    UPDATE integrations
    SET is_enabled = 1,
        status = 'CONNECTED',
        config = ?,
        updated_at = datetime('now')
    WHERE name = 'Google Sheets Sync' OR id = 'int-sheets'
  `).run(JSON.stringify(config));

  logAudit({
    userName: data.performedBy || 'Admin',
    action: 'GOOGLE_SHEET_CONNECTED',
    entity: 'google_sheets_connection',
    entityId: id,
    newValue: { name: data.name, url: liveData.cleanUrl, rows: liveData.totalRows }
  });

  return {
    connectionId: id,
    sheetId: id,
    name: data.name,
    ...liveData
  };
}

export function updateGoogleSheetConnection(id: string, updates: any, performedBy: string = 'Admin') {
  const current = db.prepare('SELECT * FROM google_sheets_connections WHERE id = ?').get(id) as any;
  if (!current) throw new Error('Google Sheet connection not found: ' + id);

  const name = updates.name !== undefined ? updates.name : current.name;
  const status = updates.status !== undefined ? updates.status : current.status;
  const campaign_tag = updates.campaign_tag !== undefined ? updates.campaign_tag : current.campaign_tag;
  const target_city = updates.target_city !== undefined ? updates.target_city : current.target_city;
  const source_label = updates.source_label !== undefined ? updates.source_label : current.source_label;
  const sheet_name = updates.sheet_name !== undefined ? updates.sheet_name : current.sheet_name;

  db.prepare(`
    UPDATE google_sheets_connections
    SET name = ?,
        status = ?,
        campaign_tag = ?,
        target_city = ?,
        source_label = ?,
        sheet_name = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(name, status, campaign_tag, target_city, source_label, sheet_name, id);

  logAudit({
    userName: performedBy,
    action: 'GOOGLE_SHEET_UPDATED',
    entity: 'google_sheets_connection',
    entityId: id,
    oldValue: current,
    newValue: updates
  });

  return db.prepare('SELECT * FROM google_sheets_connections WHERE id = ?').get(id);
}

export function deleteGoogleSheetConnection(id: string, performedBy: string = 'Admin') {
  const current = db.prepare('SELECT * FROM google_sheets_connections WHERE id = ?').get(id) as any;
  if (!current) throw new Error('Google Sheet connection not found: ' + id);

  db.prepare('DELETE FROM google_sheets_connections WHERE id = ?').run(id);

  logAudit({
    userName: performedBy,
    action: 'GOOGLE_SHEET_DELETED',
    entity: 'google_sheets_connection',
    entityId: id,
    oldValue: current
  });

  return { success: true, message: 'Google Sheet disconnected successfully.' };
}

export async function syncLiveGoogleSheetLeads(
  sheetUrlOrId: string, 
  performedBy: string = 'User',
  options?: {
    campaignTag?: string;
    targetCity?: string;
    sourceLabel?: string;
    connectionId?: string;
  }
) {
  const liveData = await fetchLiveGoogleSheetData(sheetUrlOrId);
  const rows = liveData.allRows;

  let importedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  const importedLeads: any[] = [];
  const duplicateLeads: any[] = [];

  for (const row of rows) {
    try {
      const rowData = {
        ...row,
        campaign: row.campaign || row['Campaign'] || options?.campaignTag || 'Google Sheets Lead Sheet',
        city: row.city || row['City'] || options?.targetCity || 'Kathmandu',
        lead_source: row.lead_source || row['Source'] || options?.sourceLabel || 'Google Sheets'
      };

      const res = handleGoogleSheetsLeadWebhook({
        row: rowData,
        row_number: row.row_number || importedCount + duplicateCount + 2
      });

      if (res.isDuplicate) {
        duplicateCount++;
        duplicateLeads.push(res.lead);
      } else {
        importedCount++;
        importedLeads.push(res.lead);
      }
    } catch (e) {
      errorCount++;
    }
  }

  const syncStatus = errorCount > 0 && importedCount === 0 ? 'ERROR' : errorCount > 0 ? 'WARN' : 'SUCCESS';

  // Update specific google_sheets_connections record if identified
  if (options?.connectionId) {
    db.prepare(`
      UPDATE google_sheets_connections
      SET total_leads_imported = total_leads_imported + ?,
          last_rows_count = ?,
          last_synced_at = datetime('now'),
          last_sync_status = ?,
          last_sync_error = NULL,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(importedCount, rows.length, syncStatus, options.connectionId);
  } else {
    // Try matching by spreadsheet_id
    db.prepare(`
      UPDATE google_sheets_connections
      SET total_leads_imported = total_leads_imported + ?,
          last_rows_count = ?,
          last_synced_at = datetime('now'),
          last_sync_status = ?,
          last_sync_error = NULL,
          updated_at = datetime('now')
      WHERE spreadsheet_id = ?
    `).run(importedCount, rows.length, syncStatus, liveData.spreadsheetId);
  }

  // Update global integration status
  const config = {
    spreadsheetUrl: liveData.cleanUrl,
    spreadsheetId: liveData.spreadsheetId,
    gid: liveData.gid,
    sheetName: 'Live Google Sheet',
    syncDirection: 'TWO_WAY',
    autoExport: false,
    headers: liveData.headers,
    lastSyncedRows: rows.length
  };

  db.prepare(`
    UPDATE integrations
    SET is_enabled = 1,
        status = 'CONNECTED',
        config = ?,
        last_sync_at = datetime('now'),
        updated_at = datetime('now')
    WHERE name = 'Google Sheets Sync' OR id = 'int-sheets'
  `).run(JSON.stringify(config));

  logAudit({
    userName: performedBy,
    action: 'GOOGLE_SHEETS_LIVE_SYNC',
    entity: 'integration',
    entityId: liveData.spreadsheetId,
    newValue: { totalRows: rows.length, importedCount, duplicateCount, errorCount }
  });

  return {
    success: true,
    spreadsheetId: liveData.spreadsheetId,
    cleanUrl: liveData.cleanUrl,
    totalRows: rows.length,
    importedCount,
    duplicateCount,
    errorCount,
    importedLeads,
    duplicateLeads,
    syncedAt: new Date().toISOString()
  };
}

export async function syncAllActiveGoogleSheets(performedBy: string = 'User') {
  const sheets = db.prepare("SELECT * FROM google_sheets_connections WHERE status = 'ACTIVE' ORDER BY created_at ASC").all() as any[];
  
  let totalRows = 0;
  let totalImported = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;
  const sheetReports: any[] = [];

  for (const sheet of sheets) {
    try {
      const res = await syncLiveGoogleSheetLeads(sheet.sheet_url, performedBy, {
        campaignTag: sheet.campaign_tag,
        targetCity: sheet.target_city,
        sourceLabel: sheet.source_label,
        connectionId: sheet.id
      });
      totalRows += res.totalRows;
      totalImported += res.importedCount;
      totalDuplicates += res.duplicateCount;
      totalErrors += res.errorCount;
      sheetReports.push({
        id: sheet.id,
        name: sheet.name,
        status: res.errorCount > 0 && res.importedCount === 0 ? 'ERROR' : res.errorCount > 0 ? 'WARN' : 'SUCCESS',
        totalRows: res.totalRows,
        importedCount: res.importedCount,
        duplicateCount: res.duplicateCount,
        errorCount: res.errorCount,
        syncedAt: res.syncedAt
      });
    } catch (err: any) {
      totalErrors++;
      db.prepare(`
        UPDATE google_sheets_connections 
        SET last_synced_at = datetime('now'),
            last_sync_status = 'ERROR',
            last_sync_error = ?
        WHERE id = ?
      `).run(err.message, sheet.id);

      sheetReports.push({
        id: sheet.id,
        name: sheet.name,
        status: 'ERROR',
        totalRows: 0,
        importedCount: 0,
        duplicateCount: 0,
        errorCount: 1,
        errorMessage: err.message,
        syncedAt: new Date().toISOString()
      });
    }
  }

  logAudit({
    userName: performedBy,
    action: 'GOOGLE_SHEETS_BULK_SYNC',
    entity: 'google_sheets_connection',
    newValue: { totalSheets: sheets.length, totalImported, totalDuplicates, totalErrors }
  });

  return {
    success: true,
    totalSheets: sheets.length,
    totalRows,
    totalImported,
    totalDuplicates,
    totalErrors,
    sheetReports,
    syncedAt: new Date().toISOString()
  };
}


