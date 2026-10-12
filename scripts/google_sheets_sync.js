/**
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

const CRM_WEBHOOK_URL = "https://flooring-program-cardiac-disable.trycloudflare.com/api/integrations/google-sheets/webhook";
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
