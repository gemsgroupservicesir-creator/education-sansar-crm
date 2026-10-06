import React, { useState, useEffect } from 'react';
import { 
  Share2, MessageSquare, AlertTriangle, CheckCircle2, Copy, 
  Send, RefreshCw, Key, ShieldCheck, Terminal, ExternalLink, 
  Play, Settings as SettingsIcon, Check, Info, Bell,
  FileSpreadsheet, ArrowUpDown, FileCode, Download, Database, CheckSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export const IntegrationsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'meta' | 'whatsapp' | 'sheets' | 'templates' | 'logs'>('meta');
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Meta Simulation Form State
  const [metaSimData, setMetaSimData] = useState({
    student_name: 'Aayush Shrestha',
    phone: '+977 9841234567',
    email: 'aayush.shrestha@gmail.com',
    city: 'Kathmandu',
    preferred_course: 'B.Tech Computer Science & Engineering',
    preferred_university: 'SRM Institute of Science and Technology',
    campaign: 'Meta Nepal Admission Wave 2026',
  });
  const [simulatingMeta, setSimulatingMeta] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // WhatsApp Test State
  const [waTestData, setWaTestData] = useState({
    recipientPhone: '+977 9841234567',
    templateName: 'lead_welcome_nepal',
    params: 'Aayush Shrestha,B.Tech CSE,Suman Sharma,Education Sansar',
  });
  const [sendingWa, setSendingWa] = useState(false);
  const [waResult, setWaResult] = useState<any>(null);

  // Google Sheets State
  const [sheetConfig, setSheetConfig] = useState({
    spreadsheetUrl: '',
    spreadsheetId: '',
    sheetName: 'Leads 2026',
    syncDirection: 'TWO_WAY',
    autoExport: false,
  });
  const [savingSheetConfig, setSavingSheetConfig] = useState(false);

  const [sheetSimData, setSheetSimData] = useState({
    student_name: 'Rohan Maharjan',
    phone: '+977 9811234567',
    email: 'rohan.maharjan.ktm@gmail.com',
    city: 'Kathmandu',
    preferred_course: 'B.Tech Computer Science & Engineering',
    preferred_university: 'SRM Institute of Science and Technology',
    academic_qualification: '+2 Science',
    campaign: 'Kathmandu Education Fair 2026 - Registration Desk',
    row_number: 45,
  });
  const [simulatingSheet, setSimulatingSheet] = useState(false);
  const [sheetInboundResult, setSheetInboundResult] = useState<any>(null);

  const [exportingSheet, setExportingSheet] = useState(false);
  const [sheetExportResult, setSheetExportResult] = useState<any>(null);

  const [appsScriptCode, setAppsScriptCode] = useState<string>('');
  const [fetchingScript, setFetchingScript] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, logsRes, templatesRes] = await Promise.all([
        api.getIntegrations(),
        api.getIntegrationLogs(),
        api.getMessageTemplates(),
      ]);
      setIntegrations(integrationsRes);
      setLogs(logsRes);
      setTemplates(templatesRes);

      // Load sheet config if present
      const sheetsInt = integrationsRes.find((i) => i.name === 'Google Sheets Sync' || i.id === 'int-sheets');
      if (sheetsInt && sheetsInt.config) {
        try {
          const parsed = typeof sheetsInt.config === 'string' ? JSON.parse(sheetsInt.config) : sheetsInt.config;
          setSheetConfig((prev) => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to load integrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSimulateMetaLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulatingMeta(true);
      setSimulationResult(null);
      const res = await api.testMetaWebhook(metaSimData);
      setSimulationResult(res);
      addToast(
        res.isDuplicate 
          ? `Duplicate lead detected: ${res.lead?.student_name} (${res.lead?.phone})` 
          : `Lead captured via Meta Webhook! Assigned to ${res.lead?.assigned_counselor_name || 'Counselor'}`,
        res.isDuplicate ? 'warning' : 'success'
      );
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Meta simulation failed', 'error');
    } finally {
      setSimulatingMeta(false);
    }
  };

  const handleSendWhatsAppTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSendingWa(true);
      setWaResult(null);
      const paramArray = waTestData.params.split(',').map((p) => p.trim());
      const res = await api.sendWhatsApp({
        recipientPhone: waTestData.recipientPhone,
        templateName: waTestData.templateName,
        parameters: paramArray,
      });
      setWaResult(res);
      addToast(
        res.status === 'NOT_CONFIGURED'
          ? 'WhatsApp simulated (Live credentials not configured)'
          : 'WhatsApp message sent successfully',
        'info'
      );
      loadData();
    } catch (err: any) {
      addToast(err.message || 'WhatsApp sending failed', 'error');
    } finally {
      setSendingWa(false);
    }
  };

  // Google Sheets Handlers
  const handleSaveSheetConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSheetConfig(true);
      await api.updateIntegration('int-sheets', {
        config: sheetConfig,
        status: sheetConfig.spreadsheetUrl ? 'CONNECTED' : 'NOT_CONNECTED',
        is_enabled: sheetConfig.spreadsheetUrl ? 1 : 0,
      });
      addToast('Google Sheets configuration saved successfully', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save configuration', 'error');
    } finally {
      setSavingSheetConfig(false);
    }
  };

  const handleSimulateSheetInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulatingSheet(true);
      setSheetInboundResult(null);
      const res = await api.testGoogleSheetsInbound({ simulatedRow: sheetSimData });
      setSheetInboundResult(res);
      addToast(
        res.isDuplicate
          ? `Duplicate detected: ${res.lead?.student_name} (${res.lead?.lead_id})`
          : `New lead from Google Sheet! Assigned to ${res.lead?.assigned_counselor_name || 'Counselor'}`,
        res.isDuplicate ? 'warning' : 'success'
      );
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Google Sheets simulation failed', 'error');
    } finally {
      setSimulatingSheet(false);
    }
  };

  const handleSimulateSheetExport = async () => {
    try {
      setExportingSheet(true);
      setSheetExportResult(null);
      const res = await api.testGoogleSheetsExport();
      setSheetExportResult(res);
      addToast(`Lead ${res.leadId} exported to Google Sheet row successfully`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to export lead to Google Sheet', 'error');
    } finally {
      setExportingSheet(false);
    }
  };

  const handleFetchAppsScript = async () => {
    try {
      setFetchingScript(true);
      const res = await api.getGoogleSheetsScript();
      setAppsScriptCode(res.script);
      addToast('Apps Script code generated', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch Apps Script template', 'error');
    } finally {
      setFetchingScript(false);
    }
  };

  const metaIntegration = integrations.find((i) => i.name === 'Meta Lead Ads' || i.id === 'int-meta') || {
    status: 'NOT_CONNECTED',
    is_enabled: 0,
    config: '{}',
  };

  const waIntegration = integrations.find((i) => i.name === 'WhatsApp Business API' || i.id === 'int-wa') || {
    status: 'NOT_CONNECTED',
    is_enabled: 0,
    config: '{}',
  };

  const sheetIntegration = integrations.find((i) => i.name === 'Google Sheets Sync' || i.id === 'int-sheets') || {
    status: 'NOT_CONNECTED',
    is_enabled: 0,
    config: '{}',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">External Integrations & Webhooks</h1>
              <p className="text-sm text-gray-500">
                Connect Meta Lead Ads, WhatsApp Cloud API, and Google Sheets Sync
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition self-start md:self-auto"
          title="Refresh Integration Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Production Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-0.5">Integrations Safety & Production State</p>
          <p className="text-amber-700 leading-relaxed">
            By default, all outbound and inbound external channels are set to <span className="font-bold underline">NOT CONNECTED</span> until official credentials or spreadsheet connections are provided. You can freely use the <strong>In-System Simulator panels</strong> below to test live lead ingestion, duplicate checks, Google Sheet row pushes, and template rendering without needing live external accounts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('meta')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'meta'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Meta Lead Ads
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            {metaIntegration.status}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'whatsapp'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          WhatsApp Cloud API
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            {waIntegration.status}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'sheets'
              ? 'border-emerald-600 text-emerald-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Google Sheets Sync
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            sheetIntegration.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {sheetIntegration.status}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          Message Templates ({templates.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'logs'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Activity Logs ({logs.length})
        </button>
      </div>

      {/* Tab 1: Meta Lead Ads */}
      {activeTab === 'meta' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Meta Webhook Endpoint</h3>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {metaIntegration.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure this URL and verification token in your Meta for Developers App Dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Callback URL (Webhook Endpoint)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/api/integrations/meta/webhook`}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 select-all"
                  />
                  <button
                    onClick={() => handleCopy(`${window.location.origin}/api/integrations/meta/webhook`, 'meta_url')}
                    className="p-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                    title="Copy URL"
                  >
                    {copiedKey === 'meta_url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Verify Token
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="education_sansar_meta_verify_2026"
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-800"
                  />
                  <button
                    onClick={() => handleCopy('education_sansar_meta_verify_2026', 'meta_token')}
                    className="p-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                    title="Copy Token"
                  >
                    {copiedKey === 'meta_token' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Production Credentials (Encrypted)</h4>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Page Access Token</label>
                  <input
                    type="password"
                    placeholder="EAA..."
                    disabled
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Meta App Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••"
                    disabled
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div className="text-[11px] text-gray-400 italic">
                  * Live credentials can be saved via environment variables `META_PAGE_ACCESS_TOKEN` and `META_APP_SECRET`.
                </div>
              </div>
            </div>
          </div>

          {/* Live Simulator Panel */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  Meta Webhook Lead Inbound Simulator
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Simulate a student submitting a Facebook/Instagram Lead Ad form
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                Interactive Test
              </span>
            </div>

            <form onSubmit={handleSimulateMetaLead} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={metaSimData.student_name}
                  onChange={(e) => setMetaSimData({ ...metaSimData, student_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={metaSimData.phone}
                    onChange={(e) => setMetaSimData({ ...metaSimData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={metaSimData.email}
                    onChange={(e) => setMetaSimData({ ...metaSimData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <select
                    value={metaSimData.city}
                    onChange={(e) => setMetaSimData({ ...metaSimData, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Kathmandu">Kathmandu (Nepal)</option>
                    <option value="Birgunj">Birgunj (Nepal)</option>
                    <option value="Janakpur">Janakpur (Nepal)</option>
                    <option value="Biratnagar">Biratnagar (Nepal)</option>
                    <option value="Delhi">Delhi (India)</option>
                    <option value="Noida">Noida (India)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Course Interest</label>
                  <input
                    type="text"
                    value={metaSimData.preferred_course}
                    onChange={(e) => setMetaSimData({ ...metaSimData, preferred_course: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Campaign Tag</label>
                <input
                  type="text"
                  value={metaSimData.campaign}
                  onChange={(e) => setMetaSimData({ ...metaSimData, campaign: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={simulatingMeta}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {simulatingMeta ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Triggering Webhook Pipeline...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Simulate Inbound Meta Lead Now
                  </>
                )}
              </button>
            </form>

            {/* Result Display */}
            {simulationResult && (
              <div className="mt-4 p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto">
                <div className="text-emerald-400 font-bold mb-2">
                  ✓ Pipeline Response ({simulationResult.success ? 'HTTP 200 OK' : 'FAILED'}):
                </div>
                <pre>{JSON.stringify(simulationResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: WhatsApp Cloud API */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WhatsApp API Configuration */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">WhatsApp Cloud API (Meta Graph)</h3>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {waIntegration.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Official Cloud API credentials for automated student notifications and counselor chats
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104829104857201"
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  WhatsApp Business Account (WABA) ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 294819284759281"
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                  Permanent System User Access Token
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••"
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <span className="font-bold">Education Sansar Dispatch Logic:</span> When credentials are not yet saved, the CRM safely logs simulated WhatsApp dispatches to the database and creates counselor notifications.
              </div>
            </div>
          </div>

          {/* WhatsApp Outbound Dispatch Simulator */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  WhatsApp Template Message Tester
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify variable interpolation and delivery payload
                </p>
              </div>
            </div>

            <form onSubmit={handleSendWhatsAppTest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Recipient WhatsApp Number</label>
                <input
                  type="text"
                  required
                  value={waTestData.recipientPhone}
                  onChange={(e) => setWaTestData({ ...waTestData, recipientPhone: e.target.value })}
                  placeholder="+977 98XXXXXXXX / +91 98XXXXXXXX"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Approved Template</label>
                <select
                  value={waTestData.templateName}
                  onChange={(e) => setWaTestData({ ...waTestData, templateName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.template_name}>
                      {tpl.template_name} ({tpl.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Parameters (Comma-separated for &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;, etc.)
                </label>
                <input
                  type="text"
                  required
                  value={waTestData.params}
                  onChange={(e) => setWaTestData({ ...waTestData, params: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-gray-400">Example: StudentName, CourseName, CounselorName, Company</span>
              </div>

              <button
                type="submit"
                disabled={sendingWa}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {sendingWa ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Testing Dispatch...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Dispatch WhatsApp Test Message
                  </>
                )}
              </button>
            </form>

            {waResult && (
              <div className="mt-4 p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto">
                <div className="text-emerald-400 font-bold mb-2">✓ WhatsApp Dispatch Status:</div>
                <pre>{JSON.stringify(waResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Google Sheets Sync */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sheet Configuration & Setup */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    Google Sheets & Forms Webhook Setup
                  </h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    sheetIntegration.status === 'CONNECTED' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {sheetIntegration.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Connect branch Google Sheets, exhibition registration desks, or Google Forms to auto-capture leads in real time.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Inbound Webhook URL (For Google Apps Script)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/integrations/google-sheets/webhook`}
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 select-all"
                    />
                    <button
                      onClick={() => handleCopy(`${window.location.origin}/api/integrations/google-sheets/webhook`, 'sheet_webhook')}
                      className="p-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                      title="Copy Webhook URL"
                    >
                      {copiedKey === 'sheet_webhook' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveSheetConfig} className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Google Spreadsheet URL or Sheet ID
                    </label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdB.../edit"
                      value={sheetConfig.spreadsheetUrl}
                      onChange={(e) => setSheetConfig({ ...sheetConfig, spreadsheetUrl: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sheet Tab Name
                      </label>
                      <input
                        type="text"
                        placeholder="Leads 2026"
                        value={sheetConfig.sheetName}
                        onChange={(e) => setSheetConfig({ ...sheetConfig, sheetName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Sync Direction
                      </label>
                      <select
                        value={sheetConfig.syncDirection}
                        onChange={(e) => setSheetConfig({ ...sheetConfig, syncDirection: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="TWO_WAY">Two-Way Real-time Sync</option>
                        <option value="INBOUND">Inbound Only (Sheet ➔ CRM)</option>
                        <option value="OUTBOUND">Outbound Only (CRM ➔ Sheet)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      disabled={savingSheetConfig}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {savingSheetConfig ? 'Saving...' : 'Save Sheet Settings'}
                    </button>

                    <button
                      type="button"
                      onClick={handleFetchAppsScript}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                    >
                      <FileCode className="w-3.5 h-3.5 text-blue-600" />
                      View Apps Script
                    </button>
                  </div>
                </form>
              </div>

              {/* Apps Script Box */}
              {appsScriptCode && (
                <div className="p-4 bg-gray-900 rounded-xl text-gray-100 font-mono text-xs space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5" /> Ready-to-use Google Apps Script (Code.gs)
                    </span>
                    <button
                      onClick={() => handleCopy(appsScriptCode, 'apps_script')}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-[11px] text-gray-300 flex items-center gap-1 transition"
                    >
                      {copiedKey === 'apps_script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy Script
                    </button>
                  </div>
                  <pre className="max-h-56 overflow-y-auto text-[11px] text-gray-300 whitespace-pre-wrap p-2 bg-black/40 rounded border border-gray-800">
                    {appsScriptCode}
                  </pre>
                  <p className="text-[11px] text-gray-400 italic">
                    Paste this in Extensions &gt; Apps Script in your Google Sheet and set an onFormSubmit or onEdit trigger.
                  </p>
                </div>
              )}
            </div>

            {/* Inbound Row Simulator (Sheet -> CRM) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Play className="w-5 h-5 text-emerald-600" />
                    Inbound Sheet Row Simulator (Sheet ➔ CRM)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Simulate a student entry submitted in Google Sheets or Google Forms
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                  Interactive Test
                </span>
              </div>

              <form onSubmit={handleSimulateSheetInbound} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={sheetSimData.student_name}
                    onChange={(e) => setSheetSimData({ ...sheetSimData, student_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={sheetSimData.phone}
                      onChange={(e) => setSheetSimData({ ...sheetSimData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={sheetSimData.email}
                      onChange={(e) => setSheetSimData({ ...sheetSimData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                    <select
                      value={sheetSimData.city}
                      onChange={(e) => setSheetSimData({ ...sheetSimData, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Kathmandu">Kathmandu (Nepal)</option>
                      <option value="Birgunj">Birgunj (Nepal)</option>
                      <option value="Janakpur">Janakpur (Nepal)</option>
                      <option value="Biratnagar">Biratnagar (Nepal)</option>
                      <option value="Butwal">Butwal (Nepal)</option>
                      <option value="Delhi">Delhi (India)</option>
                      <option value="Noida">Noida (India)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Course</label>
                    <input
                      type="text"
                      value={sheetSimData.preferred_course}
                      onChange={(e) => setSheetSimData({ ...sheetSimData, preferred_course: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sheet Source / Campaign</label>
                    <input
                      type="text"
                      value={sheetSimData.campaign}
                      onChange={(e) => setSheetSimData({ ...sheetSimData, campaign: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sheet Row #</label>
                    <input
                      type="number"
                      value={sheetSimData.row_number}
                      onChange={(e) => setSheetSimData({ ...sheetSimData, row_number: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={simulatingSheet}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {simulatingSheet ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Capturing Sheet Row...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Simulate Inbound Row from Google Sheet
                    </>
                  )}
                </button>
              </form>

              {sheetInboundResult && (
                <div className="mt-4 p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto">
                  <div className="text-emerald-400 font-bold mb-2">
                    ✓ Google Sheets Webhook Response ({sheetInboundResult.success ? 'HTTP 200 OK' : 'FAILED'}):
                  </div>
                  <pre>{JSON.stringify(sheetInboundResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Outbound Sync Simulator (CRM ➔ Sheet) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-emerald-600" />
                  Outbound Lead Row Export Simulator (CRM ➔ Google Sheet)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Test formatting and pushing the latest CRM lead to an external Google Sheet row
                </p>
              </div>

              <button
                onClick={handleSimulateSheetExport}
                disabled={exportingSheet}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 shrink-0"
              >
                {exportingSheet ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Pushing Row...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Simulate Export Latest Lead to Sheet
                  </>
                )}
              </button>
            </div>

            {sheetExportResult && (
              <div className="mt-4 p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs space-y-3 overflow-x-auto">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>✓ Outbound Export Confirmed: Lead {sheetExportResult.leadId}</span>
                  <span className="text-[11px] text-gray-400">{sheetExportResult.syncedAt}</span>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">Columns Appended to Google Sheet:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sheetExportResult.columns.map((col: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[10px]">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 mb-1">Row Values:</div>
                  <pre className="text-emerald-300 whitespace-pre-wrap">{JSON.stringify(sheetExportResult.row, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Message Templates */}
      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Education Sansar Pre-Approved Message Templates</h3>
              <p className="text-sm text-gray-500">
                Official WhatsApp & SMS templates for student outreach across Nepal and India
              </p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-full">
              Meta Approved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">{tpl.template_name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                    {tpl.category}
                  </span>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {tpl.content}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>Language: {tpl.language || 'English'}</span>
                  <span>Parameters: {tpl.variables || 'Dynamic'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Integration Activity Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Integration Webhook & API Logs</h3>
              <p className="text-sm text-gray-500">
                Audit trail of inbound Meta ad webhooks, Google Sheets sync, and outbound WhatsApp API calls
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200 font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Payload Summary</th>
                  <th className="py-2.5 px-3 text-center">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No integration logs recorded yet. Use the simulator above to generate test activity.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-500 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-800">
                        {log.integration_name || log.provider}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 font-medium">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          log.direction === 'INBOUND' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {log.direction || log.event_type || 'INBOUND'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                          log.status === 'SIMULATED' ? 'bg-blue-100 text-blue-800' :
                          log.status === 'WARN' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate font-mono text-gray-600">
                        {typeof log.payload === 'object' ? JSON.stringify(log.payload) : log.payload}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-700">
                        {log.response_code || 200}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
