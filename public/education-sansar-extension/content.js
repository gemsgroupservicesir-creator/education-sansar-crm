// ==============================================================================
// Education Sansar CRM - WhatsApp Web Copilot (Karya AI Style Integration)
// Manifest V3 Content Script for https://web.whatsapp.com
// ==============================================================================

(function () {
  'use strict';

  if (window.__GGS_WHATSAPP_COPILOT_LOADED__) return;
  window.__GGS_WHATSAPP_COPILOT_LOADED__ = true;

  console.log('[GGS Copilot] Initializing Education Sansar WhatsApp Web Copilot...');

  // State
  let config = {
    crmUrl: 'https://education-sansar-crm.vercel.app',
    counselorName: 'Prakash Yadav',
    counselorId: 'c-prakash'
  };

  let activeChat = {
    name: '',
    phone: '',
    lastMessage: '',
    lead: null,
    qualification: null,
    messages: []
  };

  let activeTab = 'dossier'; // 'dossier' | 'kb' | 'ai' | 'capture'
  let kbItems = [];
  let kbLoading = false;
  let isDrawerOpen = true;
  let aiGenerating = false;
  let aiReplyText = '';

  // 1. Create Isolated Shadow DOM Container
  const host = document.createElement('div');
  host.id = 'ggs-crm-copilot-host';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  // 2. Fetch Initial Config from background
  chrome.runtime.sendMessage({ action: 'GET_CONFIG' }, (response) => {
    if (response?.config) {
      config = response.config;
      renderApp();
      loadKnowledgeBase('');
    }
  });

  // 3. Styles for Shadow DOM
  const styles = `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    /* Floating Launcher Pill */
    .ggs-launcher {
      position: fixed;
      right: 0;
      top: 140px;
      z-index: 2147483640;
      background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
      color: white;
      padding: 10px 14px;
      border-radius: 24px 0 0 24px;
      box-shadow: -4px 4px 15px rgba(5, 150, 105, 0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 700;
      transition: all 0.25s ease;
      user-select: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-right: none;
    }
    .ggs-launcher:hover {
      padding-left: 18px;
      box-shadow: -6px 6px 20px rgba(5, 150, 105, 0.45);
    }
    .ggs-launcher-icon {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }
    .ggs-launcher-badge {
      font-size: 10px;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      font-weight: 600;
      max-width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Copilot Side Drawer */
    .ggs-drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 410px;
      height: 100vh;
      background: #ffffff;
      box-shadow: -6px 0 30px rgba(0, 0, 0, 0.18);
      z-index: 2147483645;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      border-left: 1px solid #e2e8f0;
    }
    .ggs-drawer.open {
      transform: translateX(0);
    }

    /* Drawer Header */
    .ggs-header {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      color: white;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .ggs-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ggs-brand-logo {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      color: white;
      backdrop-filter: blur(4px);
    }
    .ggs-brand-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: -0.2px;
      color: #ffffff;
    }
    .ggs-brand-sub {
      font-size: 10px;
      color: #a7f3d0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ggs-brand-sub .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      display: inline-block;
      animation: pulse-dot 1.5s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .ggs-close-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      font-weight: 700;
      transition: background 0.15s;
    }
    .ggs-close-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    /* Active Chat Header Bar */
    .ggs-active-bar {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .ggs-active-info {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .ggs-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #d1fae5;
      color: #065f46;
      font-weight: 800;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      shrink: 0;
      border: 1px solid #a7f3d0;
    }
    .ggs-active-name {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ggs-active-phone {
      font-size: 10px;
      color: #64748b;
      font-family: monospace;
    }
    .ggs-active-badge {
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #475569;
      white-space: nowrap;
    }
    .ggs-active-badge.qualified {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #d8b4fe;
    }

    /* Tab Navigation */
    .ggs-tabs {
      display: flex;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 4px 8px;
      gap: 4px;
    }
    .ggs-tab-btn {
      flex: 1;
      padding: 8px 4px;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .ggs-tab-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .ggs-tab-btn.active {
      background: #ecfdf5;
      color: #047857;
      box-shadow: inset 0 -2px 0 #059669;
    }

    /* Body Container */
    .ggs-body {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Cards */
    .ggs-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ggs-card-title {
      font-size: 11px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    /* Metrics Grid */
    .ggs-metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .ggs-metric-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
    }
    .ggs-metric-label {
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }
    .ggs-metric-val {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Score Meter */
    .ggs-score-meter {
      background: linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%);
      border: 1px solid #ddd6fe;
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ggs-score-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      color: #6b21a8;
    }
    .ggs-progress-bg {
      width: 100%;
      height: 8px;
      background: #e9d5ff;
      border-radius: 9999px;
      overflow: hidden;
    }
    .ggs-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #9333ea, #a855f7);
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    /* Action Buttons */
    .ggs-btn-primary {
      width: 100%;
      padding: 9px 12px;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);
    }
    .ggs-btn-primary:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .ggs-btn-purple {
      background: linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%);
      box-shadow: 0 2px 6px rgba(126, 34, 206, 0.25);
    }
    .ggs-btn-secondary {
      padding: 6px 10px;
      background: #ffffff;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background 0.15s;
    }
    .ggs-btn-secondary:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* Knowledge Base Item */
    .ggs-kb-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color 0.15s;
    }
    .ggs-kb-card:hover {
      border-color: #10b981;
    }
    .ggs-kb-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ggs-kb-badge {
      font-size: 9px;
      padding: 2px 6px;
      background: #ecfdf5;
      color: #047857;
      border-radius: 6px;
      font-weight: 700;
    }
    .ggs-kb-answer {
      font-size: 11px;
      color: #475569;
      line-height: 1.45;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .ggs-kb-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      padding-top: 4px;
      border-top: 1px solid #f1f5f9;
    }

    /* Search Input */
    .ggs-input {
      width: 100%;
      padding: 8px 10px;
      font-size: 11px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      color: #0f172a;
      outline: none;
    }
    .ggs-input:focus {
      border-color: #059669;
      box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
    }
    .ggs-textarea {
      width: 100%;
      padding: 8px 10px;
      font-size: 11px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      color: #0f172a;
      outline: none;
      resize: vertical;
      min-height: 80px;
    }

    /* Toast */
    .ggs-toast {
      position: fixed;
      bottom: 20px;
      right: 430px;
      background: #0f172a;
      color: white;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: ggs-fade 0.25s ease;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    @keyframes ggs-fade {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  // 4. Render Whole Copilot UI inside Shadow Root
  function renderApp() {
    shadow.innerHTML = `
      <style>${styles}</style>

      <!-- Floating Launcher Button -->
      <div class="ggs-launcher" id="ggs-launcher-btn" title="Open Education Sansar CRM WhatsApp Copilot">
        <div class="ggs-launcher-icon">⚡</div>
        <span>CRM Copilot</span>
        <div class="ggs-launcher-badge" id="ggs-launcher-badge">
          ${activeChat.name ? activeChat.name : 'Waiting for Chat'}
        </div>
      </div>

      <!-- Main Copilot Drawer -->
      <div class="ggs-drawer ${isDrawerOpen ? 'open' : ''}" id="ggs-drawer">
        <!-- Header -->
        <div class="ggs-header">
          <div class="ggs-brand">
            <div class="ggs-brand-logo">ES</div>
            <div>
              <div class="ggs-brand-title">Education Sansar CRM</div>
              <div class="ggs-brand-sub">
                <span class="live-dot"></span>
                <span>WhatsApp Web Copilot</span>
              </div>
            </div>
          </div>
          <button class="ggs-close-btn" id="ggs-close-btn" title="Close Copilot Panel">✕</button>
        </div>

        <!-- Active Chat Header Bar -->
        <div class="ggs-active-bar">
          <div class="ggs-active-info">
            <div class="ggs-avatar">${(activeChat.name || 'S').charAt(0).toUpperCase()}</div>
            <div style="min-width: 0;">
              <div class="ggs-active-name">${activeChat.name || 'No Active WhatsApp Chat'}</div>
              <div class="ggs-active-phone">${activeChat.phone || 'Select a chat in WhatsApp'}</div>
            </div>
          </div>
          <span class="ggs-active-badge ${activeChat.qualification?.isQualified ? 'qualified' : ''}">
            ${activeChat.qualification?.isQualified ? `🎯 Qualified ${activeChat.qualification.score}%` : (activeChat.lead ? 'CRM Lead' : 'Unregistered')}
          </span>
        </div>

        <!-- Tab Selector -->
        <div class="ggs-tabs">
          <button class="ggs-tab-btn ${activeTab === 'dossier' ? 'active' : ''}" data-tab="dossier">
            <span>🎯 Lead Profile</span>
          </button>
          <button class="ggs-tab-btn ${activeTab === 'kb' ? 'active' : ''}" data-tab="kb">
            <span>📚 Knowledge</span>
          </button>
          <button class="ggs-tab-btn ${activeTab === 'ai' ? 'active' : ''}" data-tab="ai">
            <span>🤖 AI Assist</span>
          </button>
          <button class="ggs-tab-btn ${activeTab === 'capture' ? 'active' : ''}" data-tab="capture">
            <span>➕ Save Lead</span>
          </button>
        </div>

        <!-- Tab Body -->
        <div class="ggs-body">
          ${renderTabContent()}
        </div>
      </div>
    `;

    bindEvents();
  }

  // 5. Render Individual Tab Content
  function renderTabContent() {
    if (activeTab === 'dossier') {
      const q = activeChat.qualification;
      const lead = activeChat.lead;

      return `
        <!-- Lead Status / Score Meter -->
        <div class="ggs-score-meter">
          <div class="ggs-score-header">
            <span>AI Qualification Score</span>
            <span style="font-size: 13px; font-weight: 800;">${q?.score || (lead?.qualification_score || 0)}/100</span>
          </div>
          <div class="ggs-progress-bg">
            <div class="ggs-progress-bar" style="width: ${Math.max(10, q?.score || (lead?.qualification_score || 10))}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6b21a8; font-weight: 600;">
            <span>Status: ${q?.status || lead?.lead_status || 'New Inquiry'}</span>
            <span>Temp: ${lead?.lead_temperature || (q?.score >= 70 ? 'HOT' : 'WARM')}</span>
          </div>
        </div>

        <!-- Captured Details Card -->
        <div class="ggs-card">
          <div class="ggs-card-title">
            <span>Extracted Student Attributes</span>
            <span style="font-size: 9px; color: #059669; font-weight: 700;">Live CRM Sync</span>
          </div>

          <div class="ggs-metrics-grid">
            <div class="ggs-metric-item">
              <div class="ggs-metric-label">Target Course</div>
              <div class="ggs-metric-val" title="${q?.details?.course || lead?.preferred_course || 'Undecided'}">
                ${q?.details?.course || lead?.preferred_course || 'Undecided'}
              </div>
            </div>
            <div class="ggs-metric-item">
              <div class="ggs-metric-label">Target Country/Uni</div>
              <div class="ggs-metric-val" title="${q?.details?.university || q?.details?.country || lead?.preferred_university || 'Not Specified'}">
                ${q?.details?.university || q?.details?.country || lead?.preferred_university || 'Not Specified'}
              </div>
            </div>
            <div class="ggs-metric-item">
              <div class="ggs-metric-label">Academic Marks</div>
              <div class="ggs-metric-val">${q?.details?.marks || (lead?.percentage_12th ? `${lead.percentage_12th}%` : 'Not Captured')}</div>
            </div>
            <div class="ggs-metric-item">
              <div class="ggs-metric-label">Budget</div>
              <div class="ggs-metric-val">${q?.details?.budget || lead?.budget || 'Not Captured'}</div>
            </div>
          </div>

          ${lead?.assigned_counselor_name ? `
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              Assigned Counselor: <strong style="color: #0f172a;">${lead.assigned_counselor_name}</strong>
            </div>
          ` : ''}
        </div>

        <!-- Quick 1-Click Promote / Sync Button -->
        <button class="ggs-btn-primary ggs-btn-purple" id="ggs-promote-lead-btn">
          <span>🎯 Promote to CRM Leads Tab (Qualified)</span>
        </button>

        ${lead?.id ? `
          <a href="${config.crmUrl}/leads/${lead.id}" target="_blank" class="ggs-btn-secondary" style="text-decoration: none;">
            <span>↗ Open Lead in Education Sansar CRM</span>
          </a>
        ` : ''}

        <!-- Recent Inbound Student Message -->
        ${activeChat.lastMessage ? `
          <div class="ggs-card" style="background: #f1f5f9;">
            <div class="ggs-card-title">Latest Message in WhatsApp</div>
            <div style="font-size: 11px; color: #334155; font-style: italic; line-height: 1.4;">
              "${activeChat.lastMessage}"
            </div>
            <button class="ggs-btn-secondary" id="ggs-draft-ai-from-msg-btn" style="margin-top: 4px;">
              <span>🤖 Draft AI Reply for this message</span>
            </button>
          </div>
        ` : ''}
      `;
    }

    if (activeTab === 'kb') {
      return `
        <!-- Search KB -->
        <div style="display: flex; gap: 6px;">
          <input type="text" id="ggs-kb-search-input" class="ggs-input" placeholder="Search MBBS fees, SRM, scholarships...">
        </div>

        <div style="font-size: 10px; color: #64748b; font-weight: 600;">
          Click "Insert into WhatsApp" to paste verified answer directly into WhatsApp's input box!
        </div>

        <!-- KB Results List -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${kbLoading ? `
            <div style="text-align: center; font-size: 11px; color: #94a3b8; padding: 20px;">
              Searching Knowledge Base...
            </div>
          ` : kbItems.length === 0 ? `
            <div style="text-align: center; font-size: 11px; color: #94a3b8; padding: 20px;">
              No knowledge items match your search.
            </div>
          ` : kbItems.map((item, idx) => `
            <div class="ggs-kb-card">
              <div class="ggs-kb-title">
                <span style="truncate">${item.title}</span>
                <span class="ggs-kb-badge">${item.category || 'Package'}</span>
              </div>
              <div class="ggs-kb-answer">${item.answer}</div>
              <div class="ggs-kb-actions">
                <button class="ggs-btn-secondary ggs-copy-kb-btn" data-kb-idx="${idx}">
                  <span>📋 Copy</span>
                </button>
                <button class="ggs-btn-primary ggs-insert-kb-btn" data-kb-idx="${idx}" style="width: auto; padding: 5px 10px;">
                  <span>💬 Insert into WhatsApp</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (activeTab === 'ai') {
      return `
        <div class="ggs-card">
          <div class="ggs-card-title">
            <span>AI Admission Copilot</span>
            <span style="font-size: 9px; color: #7e22ce; font-weight: 700;">Trained on Knowledge Base</span>
          </div>

          <div style="font-size: 11px; color: #475569; line-height: 1.4;">
            Generate an admission counseling reply tailored to this student's questions, budget, and marks:
          </div>

          <textarea id="ggs-ai-prompt-input" class="ggs-textarea" placeholder="Student inquiry or topic (e.g. Bangladesh MBBS 35 Lakh budget)...">${activeChat.lastMessage || 'Student inquiring about medical admissions in Bangladesh and scholarship requirements'}</textarea>

          <button class="ggs-btn-primary ggs-btn-purple" id="ggs-generate-ai-btn" ${aiGenerating ? 'disabled' : ''}>
            <span>${aiGenerating ? '🤖 Analyzing KB & Drafting...' : '✨ Generate AI Counselor Reply'}</span>
          </button>
        </div>

        ${aiReplyText ? `
          <div class="ggs-card" style="border: 2px solid #a855f7; background: #faf5ff;">
            <div class="ggs-card-title" style="color: #6b21a8;">
              <span>AI Generated Suggestion</span>
              <span style="font-size: 9px; background: #9333ea; color: white; padding: 2px 6px; border-radius: 4px;">Verified</span>
            </div>

            <textarea id="ggs-ai-reply-edit" class="ggs-textarea" style="min-height: 110px; background: white;">${aiReplyText}</textarea>

            <div style="display: flex; gap: 6px;">
              <button class="ggs-btn-secondary" id="ggs-copy-ai-btn" style="flex: 1;">
                <span>📋 Copy</span>
              </button>
              <button class="ggs-btn-primary" id="ggs-insert-ai-btn" style="flex: 2;">
                <span>💬 Insert into WhatsApp</span>
              </button>
            </div>
          </div>
        ` : ''}
      `;
    }

    if (activeTab === 'capture') {
      return `
        <div class="ggs-card">
          <div class="ggs-card-title">
            <span>Quick Lead Capture</span>
            <span style="font-size: 9px; color: #059669; font-weight: 700;">Direct to CRM Leads Tab</span>
          </div>

          <div style="font-size: 11px; color: #64748b;">
            Capture this student into the CRM Leads tab immediately with counselor assignment:
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div>
              <label style="font-size: 10px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Student Full Name</label>
              <input type="text" id="ggs-lead-name" class="ggs-input" value="${activeChat.name || ''}" placeholder="Aryan Thapa">
            </div>

            <div>
              <label style="font-size: 10px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">WhatsApp Number</label>
              <input type="text" id="ggs-lead-phone" class="ggs-input" value="${activeChat.phone || ''}" placeholder="+977 9801234567" style="font-family: monospace;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <div>
                <label style="font-size: 10px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Target Course</label>
                <input type="text" id="ggs-lead-course" class="ggs-input" value="MBBS / Medical" placeholder="Course">
              </div>
              <div>
                <label style="font-size: 10px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Budget</label>
                <input type="text" id="ggs-lead-budget" class="ggs-input" value="35-45 Lakh" placeholder="Budget">
              </div>
            </div>

            <div>
              <label style="font-size: 10px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Country / University</label>
              <input type="text" id="ggs-lead-uni" class="ggs-input" value="Kumudini Women's Medical College, Bangladesh" placeholder="University">
            </div>

            <div>
              <label style="font-size: 10px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">+2 Marks / Grade</label>
              <input type="text" id="ggs-lead-marks" class="ggs-input" value="82% PCB" placeholder="e.g. 80%">
            </div>

            <button class="ggs-btn-primary" id="ggs-save-lead-btn" style="margin-top: 4px;">
              <span>💾 Save Lead to CRM Leads Tab</span>
            </button>
          </div>
        </div>
      `;
    }

    return '';
  }

  // 6. Bind Interactive Events
  function bindEvents() {
    // Launcher click
    const launcher = shadow.getElementById('ggs-launcher-btn');
    const drawer = shadow.getElementById('ggs-drawer');
    const closeBtn = shadow.getElementById('ggs-close-btn');

    if (launcher) {
      launcher.onclick = () => {
        isDrawerOpen = !isDrawerOpen;
        if (drawer) drawer.className = `ggs-drawer ${isDrawerOpen ? 'open' : ''}`;
      };
    }

    if (closeBtn) {
      closeBtn.onclick = () => {
        isDrawerOpen = false;
        if (drawer) drawer.className = 'ggs-drawer';
      };
    }

    // Tabs
    const tabBtns = shadow.querySelectorAll('.ggs-tab-btn');
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        activeTab = btn.getAttribute('data-tab');
        renderApp();
      };
    });

    // KB Search
    const kbSearchInput = shadow.getElementById('ggs-kb-search-input');
    if (kbSearchInput) {
      let debounce = null;
      kbSearchInput.oninput = (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          loadKnowledgeBase(e.target.value);
        }, 300);
      };
    }

    // KB Copy & Insert buttons
    const copyKbBtns = shadow.querySelectorAll('.ggs-copy-kb-btn');
    copyKbBtns.forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-kb-idx'), 10);
        const item = kbItems[idx];
        if (item) {
          navigator.clipboard.writeText(`${item.title}\n\n${item.answer}`);
          showToast('📋 Copied answer to clipboard!');
        }
      };
    });

    const insertKbBtns = shadow.querySelectorAll('.ggs-insert-kb-btn');
    insertKbBtns.forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-kb-idx'), 10);
        const item = kbItems[idx];
        if (item) {
          const textToInsert = `${item.title}\n\n${item.answer}`;
          const ok = insertTextToWhatsApp(textToInsert);
          if (ok) {
            showToast('💬 Answer inserted into WhatsApp message input!');
          } else {
            showToast('📋 Copied to clipboard! (Click message box to paste)');
          }
        }
      };
    });

    // AI Generate button
    const generateAiBtn = shadow.getElementById('ggs-generate-ai-btn');
    if (generateAiBtn) {
      generateAiBtn.onclick = async () => {
        const promptInput = shadow.getElementById('ggs-ai-prompt-input');
        const query = promptInput ? promptInput.value.trim() : '';
        if (!query) return;

        aiGenerating = true;
        renderApp();

        try {
          const res = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
              action: 'AI_GENERATE_REPLY',
              studentMessage: query,
              phone: activeChat.phone,
              studentName: activeChat.name,
              leadId: activeChat.lead?.id
            }, resolve);
          });

          if (res?.success) {
            aiReplyText = res.reply;
            if (res.qualification) {
              activeChat.qualification = res.qualification;
            }
            showToast('✨ AI Reply generated based on Knowledge Base!');
          } else {
            showToast('AI generation error: ' + (res?.error || 'Failed'));
          }
        } catch (e) {
          showToast('AI error: ' + e.message);
        } finally {
          aiGenerating = false;
          renderApp();
        }
      };
    }

    // AI Copy & Insert
    const copyAiBtn = shadow.getElementById('ggs-copy-ai-btn');
    if (copyAiBtn) {
      copyAiBtn.onclick = () => {
        const textarea = shadow.getElementById('ggs-ai-reply-edit');
        if (textarea) {
          navigator.clipboard.writeText(textarea.value);
          showToast('📋 Copied AI reply to clipboard!');
        }
      };
    }

    const insertAiBtn = shadow.getElementById('ggs-insert-ai-btn');
    if (insertAiBtn) {
      insertAiBtn.onclick = () => {
        const textarea = shadow.getElementById('ggs-ai-reply-edit');
        if (textarea) {
          const ok = insertTextToWhatsApp(textarea.value);
          if (ok) {
            showToast('💬 AI reply inserted into WhatsApp message box!');
          } else {
            showToast('📋 Copied to clipboard! (Click message box to paste)');
          }
        }
      };
    }

    // Promote Lead Button
    const promoteBtn = shadow.getElementById('ggs-promote-lead-btn');
    if (promoteBtn) {
      promoteBtn.onclick = async () => {
        if (!activeChat.phone) {
          showToast('No student phone number detected in active chat');
          return;
        }
        promoteBtn.disabled = true;
        promoteBtn.innerHTML = '<span>⏳ Promoting lead...</span>';

        const q = activeChat.qualification;
        const details = {
          course: q?.details?.course || activeChat.lead?.preferred_course || 'MBBS',
          university: q?.details?.university || q?.details?.country || activeChat.lead?.preferred_university || 'Bangladesh',
          marks: q?.details?.marks || activeChat.lead?.percentage_12th || '80%',
          budget: q?.details?.budget || activeChat.lead?.budget || '35-45 Lakh'
        };

        chrome.runtime.sendMessage({
          action: 'PROMOTE_LEAD',
          phone: activeChat.phone,
          details
        }, (res) => {
          promoteBtn.disabled = false;
          if (res?.success) {
            activeChat.lead = res.lead;
            showToast(`🎯 Lead ${res.lead?.student_name || activeChat.name} promoted to CRM Leads Tab!`);
            renderApp();
          } else {
            showToast('Promotion failed: ' + (res?.error || 'Unknown error'));
            renderApp();
          }
        });
      };
    }

    // Quick Save Lead Button
    const saveLeadBtn = shadow.getElementById('ggs-save-lead-btn');
    if (saveLeadBtn) {
      saveLeadBtn.onclick = () => {
        const name = shadow.getElementById('ggs-lead-name')?.value.trim();
        const phone = shadow.getElementById('ggs-lead-phone')?.value.trim();
        const course = shadow.getElementById('ggs-lead-course')?.value.trim();
        const budget = shadow.getElementById('ggs-lead-budget')?.value.trim();
        const uni = shadow.getElementById('ggs-lead-uni')?.value.trim();
        const marks = shadow.getElementById('ggs-lead-marks')?.value.trim();

        if (!phone) {
          showToast('Please enter student phone number');
          return;
        }

        saveLeadBtn.disabled = true;
        saveLeadBtn.innerHTML = '<span>Saving to CRM...</span>';

        chrome.runtime.sendMessage({
          action: 'CREATE_LEAD',
          leadData: {
            student_name: name || 'WhatsApp Student',
            first_name: (name || 'WhatsApp').split(' ')[0],
            last_name: (name || 'Student').split(' ').slice(1).join(' ') || 'Inquiry',
            phone,
            whatsapp_number: phone,
            preferred_course: course,
            preferred_university: uni,
            budget,
            percentage_12th: parseFloat(marks) || 80,
            lead_status: 'Qualified',
            lead_temperature: 'HOT',
            remarks: 'Captured from WhatsApp Web via Chrome Extension Copilot'
          }
        }, (res) => {
          saveLeadBtn.disabled = false;
          if (res?.success) {
            activeChat.lead = res.lead;
            showToast(`🎉 Lead ${name || phone} saved directly to CRM Leads tab!`);
            activeTab = 'dossier';
            renderApp();
          } else {
            showToast('Failed to save lead: ' + (res?.error || 'Server error'));
            renderApp();
          }
        });
      };
    }

    // Draft AI from message shortcut
    const draftFromMsgBtn = shadow.getElementById('ggs-draft-ai-from-msg-btn');
    if (draftFromMsgBtn) {
      draftFromMsgBtn.onclick = () => {
        activeTab = 'ai';
        renderApp();
        const genBtn = shadow.getElementById('ggs-generate-ai-btn');
        if (genBtn) genBtn.click();
      };
    }
  }

  // 7. Insert Text into WhatsApp Web's Input Field (The Karya AI secret!)
  function insertTextToWhatsApp(text) {
    const selectors = [
      'footer div[contenteditable="true"]',
      'div[contenteditable="true"][data-tab="10"]',
      'div[role="textbox"][contenteditable="true"]',
      '[data-testid="conversation-compose-box-input"]'
    ];

    let input = null;
    for (const sel of selectors) {
      input = document.querySelector(sel);
      if (input) break;
    }

    if (!input) {
      navigator.clipboard.writeText(text);
      return false;
    }

    input.focus();

    // Use document.execCommand('insertText') so WhatsApp React registers it
    const success = document.execCommand('insertText', false, text);
    if (!success) {
      input.textContent = text;
      input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
  }

  // 8. Load Knowledge Base items
  function loadKnowledgeBase(query = '') {
    kbLoading = true;
    renderApp();

    chrome.runtime.sendMessage({ action: 'FETCH_KB', query }, (res) => {
      kbLoading = false;
      if (res?.success && res.items) {
        kbItems = res.items;
      }
      renderApp();
    });
  }

  // 9. Toast Helper
  function showToast(message) {
    const existing = shadow.querySelector('.ggs-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ggs-toast';
    toast.textContent = message;
    shadow.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  // 10. WhatsApp Web Active Chat Observer
  let lastCheckedHeader = '';

  function inspectWhatsAppDOM() {
    // 1. Locate Conversation Header in WhatsApp Web
    const headerSelectors = [
      'header',
      'div[data-testid="conversation-header"]',
      'div[role="region"] header',
      '#main header'
    ];

    let header = null;
    for (const sel of headerSelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.trim().length > 0) {
        header = el;
        break;
      }
    }

    if (!header) return;

    // 2. Extract Name and Phone
    let detectedName = '';
    let detectedPhone = '';

    // Search title or main contact element
    const titleEls = header.querySelectorAll('span[title], div[role="button"] span, h2, [data-testid="conversation-info-header"]');
    for (const el of titleEls) {
      const text = el.getAttribute('title') || el.innerText || '';
      if (!text || text.includes('online') || text.includes('typing') || text.includes('click here')) continue;

      if (!detectedName) {
        detectedName = text.trim();
      }

      // Check if it's a phone number
      const phoneMatch = text.match(/\+?[0-9][0-9\s-]{7,15}/);
      if (phoneMatch && !detectedPhone) {
        detectedPhone = phoneMatch[0].replace(/[\s-]/g, '');
      }
    }

    // If detected name looks like a phone number
    if (!detectedPhone && detectedName) {
      const phoneMatch = detectedName.match(/\+?[0-9][0-9\s-]{7,15}/);
      if (phoneMatch) {
        detectedPhone = phoneMatch[0].replace(/[\s-]/g, '');
      }
    }

    // 3. Extract Latest Message
    const msgEls = document.querySelectorAll('div.message-in [data-testid="selectable-text"], [data-testid="msg-container"] span.selectable-text');
    let latestMsg = '';
    if (msgEls.length > 0) {
      latestMsg = msgEls[msgEls.length - 1].innerText.trim();
    }

    const headerKey = `${detectedName}_${detectedPhone}`;
    if (headerKey !== lastCheckedHeader && (detectedName || detectedPhone)) {
      lastCheckedHeader = headerKey;
      console.log('[GGS Copilot] WhatsApp chat detected:', { detectedName, detectedPhone });

      activeChat.name = detectedName || 'Student';
      activeChat.phone = detectedPhone || activeChat.phone;
      activeChat.lastMessage = latestMsg;

      // Update badge
      const badge = shadow.getElementById('ggs-launcher-badge');
      if (badge) badge.textContent = detectedName;

      // Query CRM for lead profile
      if (detectedPhone || detectedName) {
        chrome.runtime.sendMessage({
          action: 'FETCH_LEAD',
          phone: detectedPhone || detectedName
        }, (res) => {
          if (res?.success) {
            activeChat.lead = res.lead;
            activeChat.qualification = res.qualification;
            activeChat.messages = res.messages || [];
          }
          renderApp();
        });
      } else {
        renderApp();
      }
    }
  }

  // Periodic and Mutation-based checking of WhatsApp DOM
  setInterval(inspectWhatsAppDOM, 1500);

  const observer = new MutationObserver(() => {
    inspectWhatsAppDOM();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.log('[GGS Copilot] Copilot successfully mounted on WhatsApp Web!');
})();
