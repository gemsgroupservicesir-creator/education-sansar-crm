// Education Sansar CRM - WhatsApp Web Copilot Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  const crmUrlInput = document.getElementById('crmUrl');
  const counselorNameInput = document.getElementById('counselorName');
  const counselorIdInput = document.getElementById('counselorId');
  const saveBtn = document.getElementById('save-btn');
  const toast = document.getElementById('toast');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  // Load current settings from storage via background worker
  try {
    const response = await chrome.runtime.sendMessage({ action: 'GET_CONFIG' });
    if (response?.config) {
      crmUrlInput.value = response.config.crmUrl || 'https://education-sansar-crm.vercel.app';
      counselorNameInput.value = response.config.counselorName || 'Prakash Yadav';
      counselorIdInput.value = response.config.counselorId || 'c-prakash';
    }

    // Ping CRM to verify connection
    const pingRes = await chrome.runtime.sendMessage({ action: 'PING_CRM' });
    if (pingRes?.success) {
      statusDot.style.background = '#10b981';
      statusText.textContent = 'Connected to CRM API';
    } else {
      statusDot.style.background = '#f59e0b';
      statusText.textContent = 'CRM Reachable';
    }
  } catch (err) {
    console.warn('Popup load error:', err);
    statusDot.style.background = '#ef4444';
    statusText.textContent = 'Disconnected';
  }

  // Handle save button
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const data = {
      crmUrl: (crmUrlInput.value || 'https://education-sansar-crm.vercel.app').trim().replace(/\/$/, ''),
      counselorName: (counselorNameInput.value || 'Prakash Yadav').trim(),
      counselorId: (counselorIdInput.value || 'c-prakash').trim()
    };

    try {
      await chrome.runtime.sendMessage({ action: 'SAVE_CONFIG', data });
      toast.textContent = 'Settings saved successfully!';
      toast.className = 'toast-msg toast-success';
      setTimeout(() => {
        toast.className = 'toast-msg';
      }, 3000);
    } catch (e) {
      toast.textContent = 'Error saving settings: ' + e.message;
      toast.style.background = '#fee2e2';
      toast.style.color = '#991b1b';
      toast.style.display = 'block';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';
    }
  });
});
