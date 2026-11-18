// Education Sansar CRM - WhatsApp Web Copilot Service Worker (Manifest V3)
const DEFAULT_CRM_URL = 'https://education-sansar-crm.vercel.app';
const DEFAULT_COUNSELOR_ID = 'c-prakash';
const DEFAULT_COUNSELOR_NAME = 'Prakash Yadav';

// Initialize default storage on install
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(['crmUrl', 'counselorId', 'counselorName', 'autoDetect']);
  const updates = {};
  if (!existing.crmUrl) updates.crmUrl = DEFAULT_CRM_URL;
  if (!existing.counselorId) updates.counselorId = DEFAULT_COUNSELOR_ID;
  if (!existing.counselorName) updates.counselorName = DEFAULT_COUNSELOR_NAME;
  if (existing.autoDetect === undefined) updates.autoDetect = true;

  if (Object.keys(updates).length > 0) {
    await chrome.storage.local.set(updates);
  }
  console.log('[GGS Copilot] Extension installed/updated successfully');
});

// Helper to get current config
async function getConfig() {
  const data = await chrome.storage.local.get(['crmUrl', 'counselorId', 'counselorName', 'autoDetect']);
  return {
    crmUrl: (data.crmUrl || DEFAULT_CRM_URL).replace(/\/$/, ''),
    counselorId: data.counselorId || DEFAULT_COUNSELOR_ID,
    counselorName: data.counselorName || DEFAULT_COUNSELOR_NAME,
    autoDetect: data.autoDetect !== false
  };
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      const config = await getConfig();

      switch (message.action) {
        case 'GET_CONFIG': {
          sendResponse({ success: true, config });
          break;
        }

        case 'SAVE_CONFIG': {
          await chrome.storage.local.set(message.data);
          sendResponse({ success: true });
          break;
        }

        case 'FETCH_LEAD': {
          const phone = message.phone;
          if (!phone) {
            sendResponse({ success: false, error: 'No phone number provided' });
            return;
          }
          const cleanPhone = phone.replace(/[^0-9]/g, '');

          // 1. Try WhatsApp chat thread API
          let chatData = null;
          try {
            const res = await fetch(`${config.crmUrl}/api/whatsapp-web/chats/${encodeURIComponent(cleanPhone)}/messages`);
            if (res.ok) {
              chatData = await res.json();
            }
          } catch (e) {
            console.warn('[GGS Copilot] Chat messages fetch error:', e);
          }

          // 2. Try Leads search API if not found
          let lead = chatData?.lead || null;
          let qualification = chatData?.qualification || null;

          if (!lead) {
            try {
              const res2 = await fetch(`${config.crmUrl}/api/leads?search=${encodeURIComponent(cleanPhone)}`);
              if (res2.ok) {
                const leads = await res2.json();
                if (Array.isArray(leads) && leads.length > 0) {
                  lead = leads[0];
                }
              }
            } catch (e) {
              console.warn('[GGS Copilot] Lead search error:', e);
            }
          }

          sendResponse({
            success: true,
            lead,
            qualification,
            messages: chatData?.messages || []
          });
          break;
        }

        case 'FETCH_KB': {
          const query = message.query || '';
          const res = await fetch(`${config.crmUrl}/api/knowledge-base?search=${encodeURIComponent(query)}&limit=15`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          sendResponse({ success: true, items: data.items || [] });
          break;
        }

        case 'AI_GENERATE_REPLY': {
          const { studentMessage, phone, studentName, leadId, chatHistory } = message;
          const res = await fetch(`${config.crmUrl}/api/chatbot/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: studentMessage,
              phone,
              studentName,
              leadId,
              chatHistory: chatHistory || [],
              source: 'WhatsApp Web Copilot Extension'
            })
          });
          if (!res.ok) throw new Error(`AI Service returned ${res.status}`);
          const data = await res.json();
          sendResponse({ success: true, reply: data.reply, qualification: data.qualification, lead: data.lead });
          break;
        }

        case 'PROMOTE_LEAD': {
          const { phone, details } = message;
          const cleanPhone = phone.replace(/[^0-9]/g, '');
          const res = await fetch(`${config.crmUrl}/api/whatsapp-web/chats/${encodeURIComponent(cleanPhone)}/promote-lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              course: details.course,
              university: details.university || details.country,
              marks: details.marks,
              budget: details.budget,
              counselorId: config.counselorId,
              promotedBy: config.counselorName
            })
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          sendResponse({ success: true, lead: data.lead, score: data.score });
          break;
        }

        case 'CREATE_LEAD': {
          const leadPayload = {
            ...message.leadData,
            assigned_counselor_id: config.counselorId,
            assigned_counselor_name: config.counselorName,
            lead_source: 'WhatsApp Web Copilot'
          };
          const res = await fetch(`${config.crmUrl}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadPayload)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          sendResponse({ success: true, lead: data });
          break;
        }

        case 'PING_CRM': {
          try {
            const res = await fetch(`${config.crmUrl}/api/health`, { method: 'GET' });
            sendResponse({ success: res.ok, status: res.status });
          } catch (e) {
            // Try fetching /api/knowledge-base as fallback health check
            const res2 = await fetch(`${config.crmUrl}/api/knowledge-base?limit=1`);
            sendResponse({ success: res2.ok, status: res2.status });
          }
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (err) {
      console.error('[GGS Copilot Background Error]:', err);
      sendResponse({ success: false, error: err.message || 'Operation failed' });
    }
  })();

  return true; // Keep message channel open for async response
});
