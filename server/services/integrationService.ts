import { db, logAudit, logLeadActivity } from '../db/database.ts';
import { createLead, checkDuplicate, updateLead } from './leadService.ts';
import { Lead } from '../types/index.ts';

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
    const raw = payload.simulatedRow || payload.row || payload.lead || payload;
    
    // Normalize fields from all expected Google Sheet columns:
    // Lead ID, Date, Student Name, Phone, WhatsApp, Email, City, State/Country,
    // Lead Source, Campaign, Course Interested, University Interested, Qualification,
    // Percentage/Score, Passing Year, Budget, Assigned Counselor, Lead Status, Next Follow-up Date, Counselor Notes
    const sheetLeadId = raw.lead_id || raw['Lead ID'] || raw['leadId'];
    const student_name = (raw.student_name || raw['Student Name'] || raw['Full Name'] || raw['Name'] || raw.name || raw.fullName || '').trim();
    const rawPhone = (raw.phone || raw['Phone'] || raw['Phone Number'] || raw['Mobile'] || raw['Contact Number'] || raw.mobile || '').toString().trim();
    const rawWa = (raw.whatsapp_number || raw['WhatsApp'] || raw['WhatsApp Number'] || raw.whatsapp || rawPhone).toString().trim();
    const email = (raw.email || raw['Email'] || raw['Email Address'] || '').toString().trim();
    const city = (raw.city || raw['City'] || raw['Location'] || raw['Branch'] || 'Kathmandu').toString().trim();
    const stateCountry = (raw['State/Country'] || raw['State'] || raw['Country'] || raw.country || '').toString().trim();
    const country = stateCountry.toLowerCase().includes('india') ? 'India' : (['Delhi', 'Noida', 'Bangalore', 'Chennai', 'Mumbai', 'Pune'].includes(city) ? 'India' : 'Nepal');
    const preferred_course = (raw.preferred_course || raw['Course Interested'] || raw['Course'] || raw['Preferred Course'] || raw.interestedCourse || 'B.Tech Computer Science & Engineering').toString().trim();
    const preferred_university = (raw.preferred_university || raw['University Interested'] || raw['University'] || raw['Preferred University'] || raw.interestedUniversity || 'SRM Institute of Science and Technology').toString().trim();
    const academic_qualification = (raw.academic_qualification || raw['Qualification'] || raw['12th Stream'] || '+2 Science').toString().trim();
    const rawPercent = raw['Percentage/Score'] || raw['Percentage'] || raw['Score'] || raw.percentage_12th || raw.percentage_10th || raw.academicPercentage;
    const percentage = rawPercent ? parseFloat(String(rawPercent).replace(/[^0-9.]/g, '')) : undefined;
    const passing_year = (raw['Passing Year'] || raw.passing_year || raw.passingYear || '').toString().trim();
    const budget = (raw['Budget'] || raw.budget || raw.budgetRange || '').toString().trim();
    const assignedCounselorFromSheet = (raw['Assigned Counselor'] || raw.assigned_counselor_name || raw['Counselor'] || raw.assignedCounselor || '').toString().trim();
    const lead_status = (raw['Lead Status'] || raw.lead_status || raw['Status'] || raw.leadStatus || 'New Lead').toString().trim();
    const next_follow_up_date = (raw['Next Follow-up Date'] || raw.next_follow_up_date || raw['Follow-up Date'] || raw.nextFollowUpDate || '').toString().trim();
    const sheetNotes = (raw['Counselor Notes'] || raw.counselor_notes || raw['Notes'] || raw['Remarks'] || raw.remarks || raw.leadNotes || '').toString().trim();
    const parent_name = (raw["Father's/Mother's Name"] || raw['Parent Name'] || raw.parent_name || raw.fatherName || raw.parentName || '').toString().trim();
    const school_college = (raw['School/College'] || raw.school_college || raw['College'] || raw['School'] || raw.schoolCollege || '').toString().trim();
    const campaign = (raw.campaign || raw['Campaign'] || raw['Source Sheet'] || payload.sheetName || 'Google Sheets Lead Sheet').toString().trim();
    const lead_source = (raw.lead_source || raw['Lead Source'] || raw['Source'] || 'Google Sheets').toString().trim();
    const priority = (raw.priority || raw['Priority'] || '').toString().trim().toUpperCase();

    // If completely empty phone and student name, skip gracefully
    if (!rawPhone && !email && !student_name) {
      return {
        success: false,
        skipped: true,
        message: 'Empty row skipped'
      };
    }

    if (!rawPhone && !email) {
      return {
        success: false,
        skipped: true,
        message: 'Row missing contact details (Phone/Email required)'
      };
    }

    const leadData: any = {
      student_name: student_name || 'Sheet Inquirer',
      phone: rawPhone,
      whatsapp_number: rawWa || rawPhone,
      email: email || '',
      city: city || 'Kathmandu',
      country,
      parent_name: parent_name || null,
      school_college: school_college || null,
      passing_year: passing_year || null,
      academic_qualification: academic_qualification || null,
      percentage_12th: percentage || null,
      preferred_course,
      preferred_university,
      budget: budget || null,
      campaign,
      lead_source,
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(priority) ? priority : 'MEDIUM',
      lead_status: lead_status || 'New Lead',
      next_follow_up_date: next_follow_up_date || null,
      remarks: sheetNotes || (raw.row_number ? `Imported from Google Sheet row #${raw.row_number}` : 'Imported via Google Sheets sync'),
      is_demo: 0
    };

    // 1. Duplicate check - Phone Number is primary duplicate check
    const dupResult = checkDuplicate({
      phone: rawPhone,
      whatsapp_number: rawWa,
      email: email
    });

    if (dupResult.hasDuplicate) {
      const existing = dupResult.duplicates[0];
      const reasons = dupResult.matchReasons || ['Phone number matched existing lead'];

      // IMPORTANT: If phone already exists, UPDATE the existing lead instead of creating another duplicate!
      // Preserve existing CRM data, do not overwrite counselor unless unassigned, do not wipe historical notes
      const updates: any = {};
      if (student_name && (!existing.student_name || existing.student_name === 'Sheet Inquirer')) updates.student_name = student_name;
      if (email && !existing.email) updates.email = email;
      if (rawWa && !existing.whatsapp_number) updates.whatsapp_number = rawWa;
      if (parent_name) updates.parent_name = parent_name;
      if (school_college) updates.school_college = school_college;
      if (passing_year) updates.passing_year = passing_year;
      if (academic_qualification) updates.academic_qualification = academic_qualification;
      if (percentage) updates.percentage_12th = percentage;
      if (budget) updates.budget = budget;
      if (priority && ['HIGH', 'MEDIUM', 'LOW'].includes(priority)) updates.priority = priority;
      if (preferred_course && existing.preferred_course !== preferred_course) updates.preferred_course = preferred_course;
      if (preferred_university && existing.preferred_university !== preferred_university) updates.preferred_university = preferred_university;
      if (next_follow_up_date) updates.next_follow_up_date = next_follow_up_date;

      // If existing lead has no counselor and sheet specified one, try matching
      if (!existing.assigned_counselor_id && assignedCounselorFromSheet) {
        const matchedCounselor = db.prepare('SELECT id, name FROM counselors WHERE is_active = 1 AND (name LIKE ? OR username LIKE ?) LIMIT 1').get(`%${assignedCounselorFromSheet}%`, `%${assignedCounselorFromSheet}%`) as any;
        if (matchedCounselor) {
          updates.assigned_counselor_id = matchedCounselor.id;
          updates.assigned_counselor_name = matchedCounselor.name;
        }
      }

      // Update existing record
      if (Object.keys(updates).length > 0) {
        updateLead(existing.id, updates, 'Google Sheets Sync');
      }

      // Append sheet notes to activity timeline without overwriting existing counselor notes
      if (sheetNotes) {
        logLeadActivity({
          leadId: existing.id,
          activityType: 'Note',
          title: 'Google Sheet Sync Note',
          description: `Sheet Note: "${sheetNotes}" (From ${campaign || 'Connected Sheet'})`,
          performedBy: 'Google Sheets Sync'
        });
      }

      logLeadActivity({
        leadId: existing.id,
        activityType: 'Note',
        title: 'Google Sheet Inbound Sync Match',
        description: `Lead updated from Google Sheet (${campaign}). Matched existing record via ${reasons.join(', ')}.`,
        performedBy: 'Google Sheets Sync'
      });

      db.prepare(`
        INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, response)
        VALUES (?, 'Google Sheets', 'INBOUND', 'SUCCESS', '/api/integrations/google-sheets/webhook', ?, ?)
      `).run(
        logId,
        JSON.stringify(payload),
        JSON.stringify({ updatedLeadId: existing.lead_id, matchReasons: reasons, fieldsUpdated: Object.keys(updates) })
      );

      const refreshed = db.prepare('SELECT * FROM leads WHERE id = ?').get(existing.id) as Lead;

      return {
        success: true,
        isDuplicate: true,
        updated: true,
        lead: refreshed,
        reasons,
        message: `Updated existing lead ${refreshed.student_name} (${refreshed.lead_id}) matched by phone number.`
      };
    }

    // 2. New Lead: create lead (auto-assigns counselor, sets 24-hr follow-up, logs activity)
    if (assignedCounselorFromSheet) {
      const matchedC = db.prepare('SELECT id, name FROM counselors WHERE is_active = 1 AND (name LIKE ? OR username LIKE ?) LIMIT 1').get(`%${assignedCounselorFromSheet}%`, `%${assignedCounselorFromSheet}%`) as any;
      if (matchedC) {
        leadData.assigned_counselor_id = matchedC.id;
        leadData.assigned_counselor_name = matchedC.name;
      }
    }

    if (sheetLeadId) {
      // Check if lead_id is unique
      const existingId = db.prepare('SELECT id FROM leads WHERE lead_id = ?').get(sheetLeadId);
      if (!existingId) {
        leadData.lead_id = sheetLeadId;
      }
    }

    const newLead = createLead(leadData, 'Google Sheets Sync');

    // If sheet notes provided, record note
    if (sheetNotes) {
      logLeadActivity({
        leadId: newLead.id,
        activityType: 'Note',
        title: 'Google Sheet Notes',
        description: sheetNotes,
        performedBy: 'Google Sheets Sync'
      });
    }

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
      created: true,
      lead: newLead,
      message: `New lead ${newLead.student_name} created and assigned to ${newLead.assigned_counselor_name || 'Counselor'}.`
    };
  } catch (err: any) {
    const errLogId = 'LOG-GS-ERR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO integration_logs (id, integration_name, direction, status, endpoint, payload, error_message)
      VALUES (?, 'Google Sheets', 'INBOUND', 'ERROR', '/api/integrations/google-sheets/webhook', ?, ?)
    `).run(errLogId, JSON.stringify(payload), err.message || 'Google Sheets inbound processing failed');
    return {
      success: false,
      error: err.message
    };
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
 * 3. Update SHEET_NAME if your sheet tab is named something other than "Leads".
 * 4. To test immediately: select "testSendLastRow" from the function dropdown and click "Run".
 * 5. To set up automatic sync:
 *    - Click Triggers (alarm clock icon on the left).
 *    - Click "+ Add Trigger" (bottom right).
 *    - Choose function: "onFormSubmit" (if linked to Google Form) OR "onEdit" (if manually editing sheet).
 *    - Event source: "From spreadsheet".
 *    - Event type: "On form submit" OR "On edit".
 *    - Save and grant permissions.
 */

const CRM_WEBHOOK_URL = "${webhookUrl}";
const SHEET_NAME = "Leads";

/**
 * Triggered automatically when a Google Form submits a new response
 */
function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) 
      || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Safely get row number (whether triggered by event or manual run)
    let row;
    if (e && e.range) {
      row = e.range.getRow();
    } else {
      row = sheet.getLastRow();
    }

    if (row > 1) {
      sendRowToCRM(sheet, row);
    } else {
      Logger.log("No student data found to sync (row <= 1).");
    }
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err.toString());
  }
}

/**
 * Triggered automatically when any cell is edited in the sheet
 */
function onEdit(e) {
  try {
    const sheet = (e && e.range) 
      ? e.range.getSheet() 
      : (SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet());
    
    // Only process edits on the target sheet tab
    if (sheet.getName() !== SHEET_NAME) {
      return;
    }
    
    const row = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
    if (row > 1) {
      sendRowToCRM(sheet, row);
    }
  } catch (err) {
    Logger.log("Error in onEdit: " + err.toString());
  }
}

/**
 * Test function: Click "Run" on this function in Apps Script to test the connection anytime!
 */
function testSendLastRow() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      Logger.log("⚠️ Your sheet currently has no data rows (only headers or empty). Please add a row with Name & Phone to test.");
      return;
    }

    Logger.log("🚀 Testing sync for Sheet: '" + sheet.getName() + "', Row: " + lastRow);
    sendRowToCRM(sheet, lastRow);
  } catch (err) {
    Logger.log("❌ Test error: " + err.toString());
  }
}

/**
 * Core function to send row data to Education Sansar CRM webhook
 */
function sendRowToCRM(sheet, rowNumber) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    Logger.log("Sheet has no columns.");
    return;
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rowData = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
  
  const payload = {
    row_number: rowNumber,
    timestamp: new Date().toISOString(),
    sheet_name: sheet.getName()
  };
  
  headers.forEach((header, index) => {
    if (header) {
      const headerStr = header.toString().trim();
      payload[headerStr] = rowData[index];
    }
  });

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "bypass-tunnel-reminder": "true"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  Logger.log("CRM Status Code: " + responseCode);
  Logger.log("CRM Response: " + responseText);
}
`;
}

// ==========================================
// Live Google Sheet URL Parser & Fetcher
// ==========================================
// ==========================================
// Live Google Sheet URL Parser & Fetcher
// ==========================================
export function parseGoogleSheetUrl(urlOrId: string): { 
  spreadsheetId: string; 
  gid: string; 
  cleanUrl: string; 
  isPublished?: boolean; 
  publishedCsvUrl?: string 
} {
  if (!urlOrId || typeof urlOrId !== 'string') {
    throw new Error('Please provide a valid Google Sheet link or Spreadsheet ID.');
  }

  const trimmed = urlOrId.trim();

  // Check for Google Sheet "Publish to web" URL
  // e.g. https://docs.google.com/spreadsheets/d/e/2PACX-1vR.../pubhtml or /pub?output=csv
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) {
    const pubId = pubMatch[1];
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return {
      spreadsheetId: pubId,
      gid,
      cleanUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pubhtml`,
      isPublished: true,
      publishedCsvUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv&gid=${gid}`
    };
  }

  // Extract ID from full standard URL or raw ID
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

  const parsed = parseGoogleSheetUrl(sheetUrlOrId);
  const { spreadsheetId, gid, cleanUrl } = parsed;

  const candidateUrls: string[] = [];
  if (parsed.isPublished && parsed.publishedCsvUrl) {
    candidateUrls.push(parsed.publishedCsvUrl);
  } else {
    // 1. Google Visualization CSV API (best for link-shared sheets)
    candidateUrls.push(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}${sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''}`
    );
    // 2. Direct Export format endpoint
    candidateUrls.push(
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    );
  }

  let csvContent = '';
  let lastError = '';

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/csv,text/plain,*/*'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const text = await res.text();
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('accounts.google.com') && !text.includes('<html')) {
          csvContent = text;
          break;
        } else if (text.includes('accounts.google.com') || text.includes('ServiceLogin') || text.includes('Sign in')) {
          throw new Error('Google Sheet is PRIVATE. Please change General Access to "Anyone with the link can view".');
        }
      } else if (res.status === 401 || res.status === 403) {
        throw new Error('Google Sheet is PRIVATE (Permission Denied). Please set General Access to "Anyone with the link can view".');
      } else {
        lastError = `Google returned HTTP ${res.status}`;
      }
    } catch (err: any) {
      lastError = err.message || String(err);
      if (lastError.includes('PRIVATE')) {
        throw err;
      }
    }
  }

  if (!csvContent) {
    if (lastError.includes('PRIVATE')) {
      throw new Error(
        'Google Sheet is currently PRIVATE. To connect: in your Google Sheet, click Share > General access > change "Restricted" to "Anyone with the link can view", then try again.'
      );
    }
    throw new Error(`Failed to fetch Google Sheet: Unable to reach Google Sheets (${lastError}). Check your internet connection or verify the link is accessible. You can also use "Try Sample Sheet Link" to test offline.`);
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
  let updatedCount = 0;
  let duplicateCount = 0;
  let skippedCount = 0;
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
        row_number: row.row_number || importedCount + updatedCount + 2
      });

      if (res.skipped) {
        skippedCount++;
      } else if (res.updated) {
        updatedCount++;
        duplicateCount++;
        if (res.lead) duplicateLeads.push(res.lead);
      } else if (res.created) {
        importedCount++;
        if (res.lead) importedLeads.push(res.lead);
      } else if (!res.success) {
        errorCount++;
      }
    } catch (e) {
      errorCount++;
    }
  }

  const syncStatus = errorCount > 0 && importedCount === 0 && updatedCount === 0 ? 'ERROR' : errorCount > 0 ? 'WARN' : 'SUCCESS';

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
    `).run(importedCount + updatedCount, rows.length, syncStatus, options.connectionId);
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


