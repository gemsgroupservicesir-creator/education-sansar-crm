import React, { useState, useEffect } from 'react';
import { 
  Share2, MessageSquare, AlertTriangle, CheckCircle2, Copy, 
  Send, RefreshCw, Key, ShieldCheck, Terminal, ExternalLink, 
  Play, Settings as SettingsIcon, Check, Info, Bell,
  FileSpreadsheet, ArrowUpDown, FileCode, Download, Database, CheckSquare,
  Link, Sparkles, Unlink, Eye, EyeOff, Table, Plus, Trash2, Edit3, Pause,
  Layers, MapPin, Tag, X, CheckCircle, HelpCircle, Zap, Globe
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

export const IntegrationsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'studyinindia' | 'sheets' | 'meta' | 'whatsapp' | 'templates' | 'logs'>('studyinindia');
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Study in India Real-Time Sync States
  const [siiStatus, setSiiStatus] = useState<any>(null);
  const [siiSyncing, setSiiSyncing] = useState(false);
  const [siiAutoSync, setSiiAutoSync] = useState(true);
  const [lastSyncReport, setLastSyncReport] = useState<any>(null);

  // Meta Configuration & Instant Form States
  const [metaFormConfig, setMetaFormConfig] = useState({
    pageAccessToken: '',
    pageId: '',
    verifyToken: 'gems_group_services_meta_verify_2026',
    appSecret: '',
    autoAssign: true,
  });
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [testingMetaToken, setTestingMetaToken] = useState(false);
  const [metaTokenTestResult, setMetaTokenTestResult] = useState<any>(null);
  const [activeMetaGuideTab, setActiveMetaGuideTab] = useState<'direct' | 'webhook' | 'mapping'>('direct');

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
    params: 'Aayush Shrestha,B.Tech CSE,Suman Sharma,Gems Group Services',
  });
  const [sendingWa, setSendingWa] = useState(false);
  const [waResult, setWaResult] = useState<any>(null);

  // Multi-Google Sheets State
  const [connectedSheets, setConnectedSheets] = useState<any[]>([]);
  const [sheetSummary, setSheetSummary] = useState<any>({
    totalSheets: 0,
    activeSheets: 0,
    totalLeadsImported: 0,
    lastSync: null,
  });
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingSheetId, setSyncingSheetId] = useState<string | null>(null);
  const [previewingSheetId, setPreviewingSheetId] = useState<string | null>(null);
  const [multiSyncReport, setMultiSyncReport] = useState<any>(null);
  const [activePreviewSheet, setActivePreviewSheet] = useState<{ sheet: any; data: any } | null>(null);
  const [showAddSheetModal, setShowAddSheetModal] = useState(false);

  // Add / Connect Sheet Form State
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [newSheetTab, setNewSheetTab] = useState('Leads 2026');
  const [newSheetCity, setNewSheetCity] = useState('Kathmandu');
  const [newSheetCampaign, setNewSheetCampaign] = useState('');
  const [newSheetSource, setNewSheetSource] = useState('Google Sheets');
  const [isConnectingLive, setIsConnectingLive] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [livePreviewData, setLivePreviewData] = useState<any>(null);
  const [liveSyncReport, setLiveSyncReport] = useState<any>(null);

  // Google Sheets Simulator State - Standardized 5 Fields
  const [sheetSimData, setSheetSimData] = useState({
    full_name: 'Aarav Sharma',
    phone_number: '+977 9811234567',
    email: 'aarav.sharma@gmail.com',
    'which_course_are_you_interested_in?': 'B.Tech Computer Science & Engineering',
    'which_univsities_are_you_looking_for?': 'SRM Institute of Science and Technology',
  });
  const [simulatingSheet, setSimulatingSheet] = useState(false);
  const [sheetInboundResult, setSheetInboundResult] = useState<any>(null);

  const [exportingSheet, setExportingSheet] = useState(false);
  const [sheetExportResult, setSheetExportResult] = useState<any>(null);

  const [appsScriptCode, setAppsScriptCode] = useState<string>('');

  const PRESET_SHEETS = [
    {
      name: 'Kathmandu Education Fair 2026',
      url: 'https://docs.google.com/spreadsheets/d/demo-sheet-kathmandu-fair-2026/edit?usp=sharing',
      city: 'Kathmandu',
      campaign: 'Kathmandu Fair 2026',
      source: 'Education Fair',
      tab: 'Leads 2026',
    },
    {
      name: 'Birgunj & Janakpur Walk-in Desk',
      url: 'https://docs.google.com/spreadsheets/d/demo-sheet-birgunj-walkins-2026/edit?usp=sharing',
      city: 'Birgunj',
      campaign: 'Branch Walk-in Desk',
      source: 'Branch Walk-in',
      tab: 'Inquiries',
    },
    {
      name: 'Study in India 2026 Webinar',
      url: 'https://docs.google.com/spreadsheets/d/demo-sheet-india-webinar-2026/edit?usp=sharing',
      city: 'Delhi',
      campaign: 'Study in India Webinar',
      source: 'Webinar',
      tab: 'Registrations',
    },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsRes, logsRes, templatesRes, sheetsListRes] = await Promise.all([
        api.getIntegrations(),
        api.getIntegrationLogs(),
        api.getMessageTemplates(),
        api.getGoogleSheetsList(),
      ]);
      setIntegrations(integrationsRes);
      setLogs(logsRes);
      setTemplates(templatesRes);
      if (sheetsListRes) {
        setConnectedSheets(sheetsListRes.sheets || []);
        setSheetSummary(sheetsListRes.summary || {});
      }

      // Pre-fill live sheet state if configured
      const sheetsInt = integrationsRes.find((i) => i.name === 'Google Sheets Sync' || i.id === 'int-sheets');
      if (sheetsInt && sheetsInt.config) {
        try {
          const parsed = typeof sheetsInt.config === 'string' ? JSON.parse(sheetsInt.config) : sheetsInt.config;
          if (parsed.spreadsheetUrl) {
            setLiveSheetUrl(parsed.spreadsheetUrl);
          }
          if (parsed.sheetName) {
            setLiveSheetName(parsed.sheetName);
          }
        } catch (e) {}
      }

      // Pre-fill Meta Lead Ads & Instant Form state if configured
      const metaInt = integrationsRes.find((i: any) => i.name === 'Meta Lead Ads' || i.id === 'int-meta');
      if (metaInt && metaInt.config) {
        try {
          const parsed = typeof metaInt.config === 'string' ? JSON.parse(metaInt.config) : metaInt.config;
          setMetaFormConfig((prev) => ({
            ...prev,
            pageAccessToken: parsed.pageAccessToken || '',
            pageId: parsed.pageId || '',
            verifyToken: parsed.verifyToken || 'gems_group_services_meta_verify_2026',
            appSecret: parsed.appSecret || '',
            autoAssign: parsed.autoAssign ?? true,
          }));
        } catch (e) {}
      }
      // Load Study in India sync status
      api.getStudyInIndiaSyncStatus().then((res) => {
        setSiiStatus(res);
        setSiiAutoSync(res.auto_sync_enabled);
        if (res.last_stats) setLastSyncReport(res.last_stats);
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to load integrations', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSiiStatus = async () => {
    try {
      const res = await api.getStudyInIndiaSyncStatus();
      setSiiStatus(res);
      setSiiAutoSync(res.auto_sync_enabled);
      if (res.last_stats) setLastSyncReport(res.last_stats);
    } catch (e) {}
  };

  const handleSyncStudyInIndia = async (mode: 'quick' | 'full' = 'quick') => {
    try {
      setSiiSyncing(true);
      addToast(
        `Initiating ${mode === 'quick' ? 'Quick' : 'Full'} Realtime Sync with Study in India portal...`,
        'info'
      );
      const res = await api.syncStudyInIndia(mode);
      if (res.success) {
        setLastSyncReport(res.stats);
        addToast(
          `Sync Complete: ${res.stats?.coursesAdded || 0} new courses & ${res.stats?.universitiesAdded || 0} universities imported!`,
          'success'
        );
      } else {
        addToast(res.message || 'Sync already in progress', 'warning');
      }
      await loadSiiStatus();
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Error syncing Study in India portal', 'error');
    } finally {
      setSiiSyncing(false);
    }
  };

  const handleToggleSiiAutoSync = async () => {
    try {
      const nextVal = !siiAutoSync;
      setSiiAutoSync(nextVal);
      await api.toggleStudyInIndiaAutoSync(nextVal);
      addToast(`Study in India automatic background sync ${nextVal ? 'enabled (Every 60m)' : 'paused'}`, 'info');
      await loadSiiStatus();
    } catch (err: any) {
      addToast(err.message || 'Failed to toggle auto-sync', 'error');
    }
  };

  useEffect(() => {
    loadData();
    loadSiiStatus();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleApplyPreset = (preset: typeof PRESET_SHEETS[0]) => {
    setNewSheetName(preset.name);
    setNewSheetUrl(preset.url);
    setNewSheetCity(preset.city);
    setNewSheetCampaign(preset.campaign);
    setNewSheetSource(preset.source);
    setNewSheetTab(preset.tab);
    addToast(`Loaded template for "${preset.name}"`, 'info');
  };

  const handleAddSheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetUrl.trim()) {
      addToast('Please enter a Google Sheet URL or ID', 'warning');
      return;
    }
    try {
      setIsConnectingLive(true);
      const res = await api.connectGoogleSheetLink(
        newSheetUrl.trim(),
        newSheetTab.trim() || undefined,
        'Admin',
        {
          name: newSheetName.trim() || undefined,
          campaignTag: newSheetCampaign.trim() || undefined,
          targetCity: newSheetCity.trim() || undefined,
          sourceLabel: newSheetSource.trim() || undefined,
        }
      );
      addToast(`Connected "${res.name || newSheetName || 'Google Sheet'}" (${res.totalRows} student rows found)`, 'success');
      setShowAddSheetModal(false);
      setNewSheetName('');
      setNewSheetUrl('');
      setNewSheetCampaign('');
      setActivePreviewSheet({ sheet: { id: res.connectionId, name: newSheetName || 'New Google Sheet' }, data: res });
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to connect Google Sheet', 'error');
    } finally {
      setIsConnectingLive(false);
    }
  };

  const handleSyncAllSheets = async () => {
    try {
      setIsSyncingAll(true);
      setMultiSyncReport(null);
      const report = await api.syncAllGoogleSheets();
      setMultiSyncReport(report);
      addToast(
        `Multi-Sheet Sync Complete: ${report.totalImported} new leads captured across ${report.totalSheets} sheets!`,
        report.totalImported > 0 ? 'success' : 'info'
      );
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to sync all Google Sheets', 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingleSheet = async (id: string, name: string) => {
    try {
      setSyncingSheetId(id);
      const res = await api.syncSingleGoogleSheet(id);
      addToast(
        `Synced "${name}": ${res.importedCount} new leads captured, ${res.duplicateCount} duplicates avoided`,
        res.importedCount > 0 ? 'success' : 'info'
      );
      loadData();
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('not found') || errMsg.includes('connectionNotFound') || errMsg.includes('reconnect')) {
        addToast(`Sheet "${name}" was expired or not found. Refreshing connections...`, 'warning');
        loadData();
      } else {
        addToast(errMsg || `Failed to sync sheet "${name}"`, 'error');
      }
    } finally {
      setSyncingSheetId(null);
    }
  };

  const handlePreviewSheet = async (sheet: any) => {
    try {
      setPreviewingSheetId(sheet.id);
      const data = await api.previewGoogleSheetById(sheet.id);
      setActivePreviewSheet({ sheet, data });
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('not found') || errMsg.includes('connectionNotFound') || errMsg.includes('reconnect')) {
        addToast(`Sheet "${sheet.name}" was expired or removed. Refreshing list...`, 'warning');
        loadData();
      } else {
        addToast(errMsg || 'Failed to preview sheet', 'error');
      }
    } finally {
      setPreviewingSheetId(null);
    }
  };

  const handleToggleSheetStatus = async (sheet: any) => {
    try {
      const newStatus = sheet.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await api.updateGoogleSheetConnection(sheet.id, { status: newStatus });
      addToast(`Sheet "${sheet.name}" is now ${newStatus}`, 'info');
      loadData();
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('not found') || errMsg.includes('connectionNotFound')) {
        addToast(`Sheet "${sheet.name}" was not found. Refreshing...`, 'warning');
        loadData();
      } else {
        addToast(errMsg || 'Failed to update sheet status', 'error');
      }
    }
  };

  const handleDeleteSheet = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to disconnect Google Sheet "${name}"?`)) return;
    try {
      await api.deleteGoogleSheetConnection(id);
      if (activePreviewSheet?.sheet.id === id) {
        setActivePreviewSheet(null);
      }
      addToast(`Disconnected Google Sheet "${name}"`, 'info');
      loadData();
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('not found') || errMsg.includes('connectionNotFound')) {
        addToast(`Sheet was already removed or expired. Refreshing...`, 'warning');
        loadData();
      } else {
        addToast(errMsg || 'Failed to disconnect sheet', 'error');
      }
    }
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

  const handleSaveMetaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingMeta(true);
      const isConnected = Boolean(metaFormConfig.pageAccessToken.trim());
      await api.updateIntegration('int-meta', {
        status: isConnected ? 'CONNECTED' : 'NOT_CONNECTED',
        is_enabled: isConnected ? 1 : 0,
        config: metaFormConfig,
        performedBy: 'Super Admin',
      });
      addToast(
        isConnected
          ? 'Meta Instant Form credentials saved & connection set to CONNECTED!'
          : 'Meta Lead Ads settings updated successfully',
        'success'
      );
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save Meta settings', 'error');
    } finally {
      setSavingMeta(false);
    }
  };

  const handleTestMetaCredentials = async () => {
    if (!metaFormConfig.pageAccessToken.trim()) {
      addToast('Please enter a Page Access Token first', 'error');
      return;
    }
    try {
      setTestingMetaToken(true);
      setMetaTokenTestResult(null);
      const res = await api.verifyMetaCredentials({
        pageAccessToken: metaFormConfig.pageAccessToken,
        pageId: metaFormConfig.pageId || undefined,
      });
      setMetaTokenTestResult(res);
      if (res.valid) {
        addToast(
          `Verified! Connected to Facebook Page: "${res.pageName || res.pageId}" (${res.leadgenFormsCount || 0} Instant Forms found)`,
          'success'
        );
      } else {
        addToast(res.error || 'Token verification failed with Meta Graph API', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Verification failed', 'error');
    } finally {
      setTestingMetaToken(false);
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

  // Google Sheets Live Link Handlers
  const handleConnectLiveSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!liveSheetUrl.trim()) {
      addToast('Please enter a Google Sheet link or spreadsheet ID', 'warning');
      return;
    }
    try {
      setIsConnectingLive(true);
      setLivePreviewData(null);
      setLiveSyncReport(null);
      const res = await api.connectGoogleSheetLink(liveSheetUrl.trim(), liveSheetName);
      setLivePreviewData(res);
      addToast(`Connected! Found ${res.totalRows} student rows in Google Sheet`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to connect Google Sheet', 'error');
    } finally {
      setIsConnectingLive(false);
    }
  };

  const handleSyncLiveSheet = async () => {
    try {
      setIsSyncingLive(true);
      setLiveSyncReport(null);
      const res = await api.syncLiveGoogleSheet(liveSheetUrl.trim() || undefined);
      setLiveSyncReport(res);
      addToast(
        `Sync Complete: ${res.importedCount} new leads captured, ${res.duplicateCount} duplicates avoided`,
        'success'
      );
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to sync leads from Google Sheet', 'error');
    } finally {
      setIsSyncingLive(false);
    }
  };

  const handleDisconnectLiveSheet = async () => {
    try {
      await api.disconnectGoogleSheet();
      setLivePreviewData(null);
      setLiveSyncReport(null);
      setLiveSheetUrl('');
      addToast('Google Sheet disconnected', 'info');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to disconnect Google Sheet', 'error');
    }
  };

  const handleUseSampleSheet = () => {
    setLiveSheetUrl('https://docs.google.com/spreadsheets/d/demo-google-sheet-gems-2026/edit?usp=sharing');
    setLiveSheetName('Leads 2026');
    addToast('Sample Google Sheet link loaded. Click "Connect & Preview Live Sheet"', 'info');
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
      const res = await api.getGoogleSheetsScript();
      setAppsScriptCode(res.script);
      addToast('Apps Script code generated', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch Apps Script template', 'error');
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

  const sheetConfigObj = (() => {
    try {
      return typeof sheetIntegration.config === 'string' ? JSON.parse(sheetIntegration.config) : (sheetIntegration.config || {});
    } catch (e) {
      return {};
    }
  })();

  const isSheetConnected = sheetIntegration.status === 'CONNECTED';

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
                Connect Meta Lead Ads, WhatsApp Cloud API, and Live Google Sheets Sync
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
          <p className="font-semibold mb-0.5">Integrations Safety & Live Sync Architecture</p>
          <p className="text-amber-700 leading-relaxed">
            Connect live Google Sheets by pasting your shared sheet link below. The CRM reads shared spreadsheets via Google's live endpoints and pulls student inquiries directly into your admission pipeline with 4-point duplicate detection and automatic counselor assignment.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('studyinindia')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'studyinindia'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="text-base">🇮🇳</span>
          Study in India Realtime Sync
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {siiStatus?.db_counts?.courses ? `${siiStatus.db_counts.courses.toLocaleString()} COURSES` : 'LIVE PORTAL'}
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
          Google Sheets ({connectedSheets.length})
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            {connectedSheets.filter((s) => s.status === 'ACTIVE').length} ACTIVE
          </span>
        </button>

        <button
          onClick={() => setActiveTab('meta')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
            activeTab === 'meta'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Share2 className="w-4 h-4 text-blue-600" />
          Meta Instant Forms &amp; Lead Ads
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              metaIntegration.status === 'CONNECTED'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {metaIntegration.status === 'CONNECTED' ? 'CONNECTED' : 'SETUP'}
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

      {/* Tab: Study in India Realtime Sync */}
      {activeTab === 'studyinindia' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🇮🇳</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Government of India Official Portal Connector</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-200">
                    Status: <strong className="text-emerald-300 font-bold">{siiSyncing ? 'Syncing Now...' : 'Live Connected'}</strong>
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  Study in India Real-Time Data Sync Hub
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/90 mt-1.5 max-w-3xl leading-relaxed">
                  Real-time two-way synchronization engine pulling live data from{' '}
                  <strong className="text-white">studyinindia.gov.in</strong> (EdCIL / Ministry of Education, Govt. of India).
                  Automatically imports newly empaneled universities, degree programs, curriculum updates, international student tuition fees (USD/INR), and G1/G2/G3 scholarship tiers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={siiSyncing}
                  onClick={() => handleSyncStudyInIndia('quick')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-purple-950/40 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${siiSyncing ? 'animate-spin' : ''}`} />
                  <span>{siiSyncing ? 'Synchronizing with Portal...' : '⚡ Quick Sync (Fetch New & Updated Data)'}</span>
                </button>

                <button
                  type="button"
                  disabled={siiSyncing}
                  onClick={() => handleSyncStudyInIndia('full')}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Database className="w-4 h-4 text-purple-300" />
                  <span>Full Deep Catalog Re-sync</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleSiiAutoSync}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    siiAutoSync
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${siiAutoSync ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>Auto-Sync: {siiAutoSync ? 'Active (Hourly)' : 'Paused'}</span>
                </button>

                <a
                  href="https://www.studyinindia.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Sync Stats KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Empaneled Universities</span>
              <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
                <span>{siiStatus?.db_counts?.universities?.toLocaleString() || '1,273'}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  100% Synced
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Official portal reports <strong>{siiStatus?.portal_counts?.institutes?.toLocaleString() || '1,273'}</strong> institutions
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Courses &amp; Degree Programs</span>
              <div className="text-2xl font-black text-purple-700 flex items-baseline gap-2">
                <span>{siiStatus?.db_counts?.courses?.toLocaleString() || '24,953'}</span>
                {siiStatus?.portal_counts?.courses > (siiStatus?.db_counts?.courses || 0) && (
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 animate-pulse">
                    +{siiStatus.portal_counts.courses - siiStatus.db_counts.courses} New on Portal
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Portal Total: <strong>{siiStatus?.portal_counts?.courses?.toLocaleString() || '25,080'}</strong> courses
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fee Structure Registry</span>
              <div className="text-2xl font-black text-blue-700 flex items-baseline gap-2">
                <span>{siiStatus?.db_counts?.university_courses?.toLocaleString() || '24,965'}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  USD &amp; INR
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Standard international tuition fee &amp; ₹86/USD conversion
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Sync Execution</span>
              <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">{siiStatus?.last_sync_at ? new Date(siiStatus.last_sync_at).toLocaleString() : 'Recently'}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Auto-sync interval: <strong>Every {siiStatus?.auto_sync_interval_minutes || 60} minutes</strong>
              </p>
            </div>
          </div>

          {/* Last Sync Report Box (if executed) */}
          {lastSyncReport && (
            <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Latest Real-Time Sync Execution Report</span>
                </h4>
                <span className="text-[11px] font-semibold text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                  Mode: {lastSyncReport.mode?.toUpperCase() || 'QUICK'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <span className="text-slate-400 block text-[10px]">Universities Added</span>
                  <span className="text-base font-black text-slate-900">{lastSyncReport.universitiesAdded || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <span className="text-slate-400 block text-[10px]">Universities Updated</span>
                  <span className="text-base font-black text-slate-900">{lastSyncReport.universitiesUpdated || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <span className="text-slate-400 block text-[10px]">Courses Added</span>
                  <span className="text-base font-black text-emerald-600">{lastSyncReport.coursesAdded || 0}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-purple-100">
                  <span className="text-slate-400 block text-[10px]">Execution Time</span>
                  <span className="text-base font-black text-purple-700">
                    {lastSyncReport.durationMs ? `${Math.round(lastSyncReport.durationMs / 1000)}s` : 'Instant'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Webhook & Automation Configuration Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>Real-Time Webhook &amp; External Automation URLs</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Use these endpoints to trigger automatic syncs from Vercel Crons, GitHub Actions, or webhook triggers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Scheduled Cron Endpoint</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">GET</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between gap-2 overflow-x-auto">
                  <span className="truncate">https://education-sansar-crm.vercel.app/api/integrations/studyinindia/cron</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('https://education-sansar-crm.vercel.app/api/integrations/studyinindia/cron', 'sii-cron')}
                    className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors shrink-0"
                    title="Copy URL"
                  >
                    {copiedKey === 'sii-cron' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Configured in <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">vercel.json</code> to run every hour automatically.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Inbound Webhook Endpoint</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">POST</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between gap-2 overflow-x-auto">
                  <span className="truncate">https://education-sansar-crm.vercel.app/api/integrations/studyinindia/webhook</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('https://education-sansar-crm.vercel.app/api/integrations/studyinindia/webhook', 'sii-webhook')}
                    className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition-colors shrink-0"
                    title="Copy URL"
                  >
                    {copiedKey === 'sii-webhook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepts JSON payloads to trigger immediate synchronization upon portal notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Google Sheets Live Sync */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          {/* Top Multi-Sheet Management Header & Action Bar */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      Multiple Google Sheets Lead Hub
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {connectedSheets.length} Connected
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Connect and fetch student leads across fairs, digital campaigns, and branch walk-ins with automatic deduplication &amp; counselor assignment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={handleSyncAllSheets}
                  disabled={isSyncingAll || connectedSheets.length === 0}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  title="Pull leads from all active Google Sheets"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  {isSyncingAll ? 'Fetching All Sheets...' : 'Sync All Active Sheets Now'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddSheetModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  Connect New Google Sheet
                </button>
              </div>
            </div>

            {/* Quick Metrics KPI Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Connected Sheets
                </span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {connectedSheets.length}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {connectedSheets.filter((s) => s.status === 'ACTIVE').length} Active for Sync
                </span>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Total Leads Ingested
                </span>
                <span className="text-2xl font-bold text-emerald-800 mt-1 block">
                  {connectedSheets.reduce((acc, s) => acc + (s.total_leads_imported || 0), 0)}
                </span>
                <span className="text-[11px] text-emerald-600 mt-0.5 block">
                  Across all sheet sources
                </span>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                  Total Rows Tracked
                </span>
                <span className="text-2xl font-bold text-blue-800 mt-1 block">
                  {connectedSheets.reduce((acc, s) => acc + (s.last_rows_count || 0), 0)}
                </span>
                <span className="text-[11px] text-blue-600 mt-0.5 block">
                  Live spreadsheet rows
                </span>
              </div>

              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                  Last Bulk Sync
                </span>
                <span className="text-sm font-bold text-amber-900 mt-1.5 block font-mono">
                  {sheetSummary.lastSync ? new Date(sheetSummary.lastSync).toLocaleTimeString() : 'Ready to Sync'}
                </span>
                <span className="text-[11px] text-amber-600 mt-0.5 block">
                  Automated duplicate protection
                </span>
              </div>
            </div>

            {/* Multi-Sheet Bulk Sync Report Alert (when triggered) */}
            {multiSyncReport && (
              <div className="p-5 bg-gray-900 text-gray-100 rounded-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle className="w-5 h-5" />
                    Multi-Sheet Bulk Sync Completed Successfully
                  </div>
                  <button
                    onClick={() => setMultiSyncReport(null)}
                    className="p-1 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-gray-800/80 rounded-lg">
                    <span className="text-[11px] text-gray-400 block">Sheets Processed</span>
                    <span className="text-lg font-bold text-white">{multiSyncReport.totalSheets}</span>
                  </div>
                  <div className="p-3 bg-gray-800/80 rounded-lg">
                    <span className="text-[11px] text-emerald-400 block">New Leads Captured</span>
                    <span className="text-lg font-bold text-emerald-400">+{multiSyncReport.totalImported}</span>
                  </div>
                  <div className="p-3 bg-gray-800/80 rounded-lg">
                    <span className="text-[11px] text-amber-400 block">Duplicates Prevented</span>
                    <span className="text-lg font-bold text-amber-400">{multiSyncReport.totalDuplicates}</span>
                  </div>
                  <div className="p-3 bg-gray-800/80 rounded-lg">
                    <span className="text-[11px] text-gray-400 block">Errors</span>
                    <span className="text-lg font-bold text-gray-300">{multiSyncReport.totalErrors}</span>
                  </div>
                </div>

                {/* Per-Sheet Breakdown Table */}
                {multiSyncReport.sheetReports && multiSyncReport.sheetReports.length > 0 && (
                  <div className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-800 text-gray-400 border-b border-gray-700 font-medium">
                          <th className="py-2 px-3">Google Sheet</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Rows</th>
                          <th className="py-2 px-3">Leads Captured</th>
                          <th className="py-2 px-3">Duplicates Blocked</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {multiSyncReport.sheetReports.map((sr: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-700/30">
                            <td className="py-2 px-3 font-semibold text-white">{sr.name}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sr.status === 'SUCCESS'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : sr.status === 'WARN'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {sr.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-gray-300">{sr.totalRows}</td>
                            <td className="py-2 px-3 font-bold text-emerald-400">+{sr.importedCount}</td>
                            <td className="py-2 px-3 text-amber-400">{sr.duplicateCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* List of Connected Google Sheets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Connected Google Spreadsheets ({connectedSheets.length})
                </h4>
                <span className="text-xs text-gray-500">
                  Each sheet can target a specific fair, campaign, or branch
                </span>
              </div>

              {connectedSheets.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl space-y-3">
                  <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto" />
                  <h5 className="text-sm font-semibold text-gray-700">No Google Sheets connected yet</h5>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Connect your Google Sheets from education fairs, walk-ins, or webinar signups to fetch and sync leads automatically.
                  </p>
                  <button
                    onClick={() => setShowAddSheetModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" /> Connect Your First Sheet
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectedSheets.map((sheet: any) => {
                    const isSyncingThis = syncingSheetId === sheet.id;
                    const isPreviewingThis = previewingSheetId === sheet.id;
                    const isActive = sheet.status === 'ACTIVE';

                    return (
                      <div
                        key={sheet.id}
                        className={`rounded-xl border transition shadow-xs flex flex-col justify-between ${
                          isActive
                            ? 'bg-white border-gray-200 hover:border-emerald-300'
                            : 'bg-gray-50/70 border-gray-200 opacity-80'
                        }`}
                      >
                        <div className="p-4 space-y-3">
                          {/* Top: Name & Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 line-clamp-1">
                                {sheet.name}
                              </h5>
                              <p className="text-[11px] font-mono text-gray-400 truncate max-w-[220px]" title={sheet.sheet_url}>
                                ID: {sheet.spreadsheet_id}
                              </p>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {sheet.status}
                            </span>
                          </div>

                          {/* Metadata Tags */}
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {sheet.target_city && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded flex items-center gap-1 font-medium">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {sheet.target_city}
                              </span>
                            )}
                            {sheet.campaign_tag && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded flex items-center gap-1 font-medium">
                                <Tag className="w-3 h-3 text-indigo-500" />
                                {sheet.campaign_tag}
                              </span>
                            )}
                            {sheet.is_demo === 1 && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                                Template
                              </span>
                            )}
                          </div>

                          {/* Stats Row */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <span className="text-[10px] text-gray-500 block">Leads Ingested</span>
                              <span className="text-sm font-bold text-emerald-700">
                                {sheet.total_leads_imported || 0}
                              </span>
                            </div>
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <span className="text-[10px] text-gray-500 block">Rows Detected</span>
                              <span className="text-sm font-bold text-gray-800">
                                {sheet.last_rows_count || 0}
                              </span>
                            </div>
                          </div>

                          {/* Last Sync Info */}
                          <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1">
                            <span>Last Synced:</span>
                            <span className="font-medium text-gray-700">
                              {sheet.last_synced_at ? new Date(sheet.last_synced_at).toLocaleTimeString() : 'Never'}
                            </span>
                          </div>
                        </div>

                        {/* Card Action Buttons */}
                        <div className="p-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-1.5 rounded-b-xl">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePreviewSheet(sheet)}
                              disabled={isPreviewingThis}
                              className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-xs font-medium flex items-center gap-1 transition"
                              title="Preview live rows"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                              {isPreviewingThis ? '...' : 'Preview'}
                            </button>

                            {sheet.sheet_url && (
                              <a
                                href={sheet.sheet_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-md text-xs transition"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleSheetStatus(sheet)}
                              className="p-1.5 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-md text-xs transition"
                              title={isActive ? 'Pause Sync' : 'Activate Sync'}
                            >
                              {isActive ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSyncSingleSheet(sheet.id, sheet.name)}
                              disabled={isSyncingThis || !isActive}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
                              title="Sync this sheet now"
                            >
                              <Download className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-bounce' : ''}`} />
                              {isSyncingThis ? 'Syncing' : 'Sync'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSheet(sheet.id, sheet.name)}
                              className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-md text-xs transition"
                              title="Disconnect Sheet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Sheet Preview Drawer / Table (if selected) */}
            {activePreviewSheet && (
              <div className="mt-4 border border-emerald-200 bg-emerald-50/30 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h4 className="text-sm font-bold text-gray-900">
                        Live Preview: {activePreviewSheet.sheet.name} ({activePreviewSheet.data.totalRows} Student Rows Found)
                      </h4>
                      {activePreviewSheet.data.isDemoSheet && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          Demo Template
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Spreadsheet ID: <code className="font-mono text-emerald-800">{activePreviewSheet.data.spreadsheetId}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSyncSingleSheet(activePreviewSheet.sheet.id, activePreviewSheet.sheet.name)}
                      disabled={syncingSheetId === activePreviewSheet.sheet.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      Sync This Sheet Now
                    </button>
                    <button
                      onClick={() => setActivePreviewSheet(null)}
                      className="p-2 bg-white hover:bg-gray-100 text-gray-500 rounded-lg border border-gray-200 transition"
                      title="Close Preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detected Column Headers */}
                {activePreviewSheet.data.headers && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Verified Sheet Column Headers:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activePreviewSheet.data.headers.map((h: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-800 rounded text-xs font-medium">
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Preview Table */}
                {activePreviewSheet.data.previewRows && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase">
                          <th className="py-2 px-3">#</th>
                          {activePreviewSheet.data.headers.slice(0, 6).map((h: string, idx: number) => (
                            <th key={idx} className="py-2 px-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {activePreviewSheet.data.previewRows.map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-mono text-gray-400">{rIdx + 1}</td>
                            {activePreviewSheet.data.headers.slice(0, 6).map((h: string, cIdx: number) => (
                              <td key={cIdx} className="py-2 px-3 text-gray-700 font-medium">
                                {row[h] || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Connect New Google Sheet Modal */}
          {showAddSheetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Link className="w-5 h-5 text-emerald-600" />
                      Connect New Google Sheet
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add any shared Google Sheet to automatically ingest and assign student leads
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddSheetModal(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    Quick Sample Presets (Click to test):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PRESET_SHEETS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition text-xs space-y-0.5"
                      >
                        <span className="font-bold text-slate-800 block truncate">{preset.name}</span>
                        <span className="text-[10px] text-slate-500 block">City: {preset.city}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddSheetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Sheet Display Name / Campaign Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kathmandu Education Fair 2026 or Birgunj Walk-in Desk"
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Google Sheet Sharing Link (URL or ID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing"
                      value={newSheetUrl}
                      onChange={(e) => setNewSheetUrl(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Target City / Branch
                      </label>
                      <select
                        value={newSheetCity}
                        onChange={(e) => setNewSheetCity(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Kathmandu">Kathmandu (Nepal)</option>
                        <option value="Birgunj">Birgunj (Nepal)</option>
                        <option value="Janakpur">Janakpur (Nepal)</option>
                        <option value="Pokhara">Pokhara (Nepal)</option>
                        <option value="Butwal">Butwal (Nepal)</option>
                        <option value="Delhi">Delhi (India)</option>
                        <option value="Noida">Noida (India)</option>
                        <option value="Bangalore">Bangalore (India)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Campaign Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fair 2026"
                        value={newSheetCampaign}
                        onChange={(e) => setNewSheetCampaign(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Lead Source
                      </label>
                      <input
                        type="text"
                        placeholder="Google Sheets"
                        value={newSheetSource}
                        onChange={(e) => setNewSheetSource(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Permissions Callout */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800 flex items-center gap-1 mb-1">
                      <Info className="w-3.5 h-3.5 text-blue-600" /> Sharing Permissions Requirement:
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      In your Google Sheet, click <strong>Share</strong> &gt; General access &gt; change from <em>Restricted</em> to <strong>"Anyone with the link can view"</strong> so the CRM can read the live rows.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowAddSheetModal(false)}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isConnectingLive}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                    >
                      {isConnectingLive ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Validating Sheet...
                        </>
                      ) : (
                        <>
                          <Link className="w-3.5 h-3.5" />
                          Connect &amp; Validate Sheet
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Section 2: Two-Way Webhook & Simulators Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Apps Script Real-time Webhook Setup */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-600" />
                  Real-Time Apps Script Webhook (Instant Sync on Edit)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Want leads to flow into CRM immediately whenever someone edits the sheet or submits a Google Form?
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Your Webhook Endpoint
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleFetchAppsScript}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <FileCode className="w-4 h-4 text-blue-600" />
                    Generate Ready-to-Paste Apps Script Code
                  </button>
                </div>

                {appsScriptCode && (
                  <div className="p-3 bg-gray-900 rounded-xl text-gray-100 font-mono text-xs space-y-2 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold text-[11px]">Code.gs</span>
                      <button
                        onClick={() => handleCopy(appsScriptCode, 'apps_script')}
                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-[11px] text-gray-300 flex items-center gap-1 transition"
                      >
                        {copiedKey === 'apps_script' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy Script
                      </button>
                    </div>
                    <pre className="max-h-48 overflow-y-auto text-[11px] text-gray-300 whitespace-pre-wrap p-2 bg-black/40 rounded border border-gray-800">
                      {appsScriptCode}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Inbound Simulator */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Play className="w-5 h-5 text-emerald-600" />
                    Inbound Row Simulator (Sheet ➔ CRM)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Test submitting a single row payload as if sent by Google Sheets
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                  Simulator
                </span>
              </div>

              <form onSubmit={handleSimulateSheetInbound} className="space-y-3">
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-[11px] text-emerald-900">
                  <span className="font-semibold">Standard 5-Field Payload Mapping:</span>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    1. <code>full_name</code> &bull; 2. <code>phone_number</code> &bull; 3. <code>email</code> &bull; 4. <code>which_course_are_you_interested_in?</code> &bull; 5. <code>which_univsities_are_you_looking_for?</code>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                      1. full_name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={sheetSimData.full_name}
                      onChange={(e) => setSheetSimData({ ...sheetSimData, full_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                      2. phone_number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +977 9811234567"
                      value={sheetSimData.phone_number}
                      onChange={(e) => setSheetSimData({ ...sheetSimData, phone_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                    3. email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. aarav.sharma@gmail.com"
                    value={sheetSimData.email}
                    onChange={(e) => setSheetSimData({ ...sheetSimData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                    4. which_course_are_you_interested_in?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    value={sheetSimData['which_course_are_you_interested_in?']}
                    onChange={(e) => setSheetSimData({ ...sheetSimData, 'which_course_are_you_interested_in?': e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                    5. which_univsities_are_you_looking_for?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SRM Institute of Science and Technology"
                    value={sheetSimData['which_univsities_are_you_looking_for?']}
                    onChange={(e) => setSheetSimData({ ...sheetSimData, 'which_univsities_are_you_looking_for?': e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={simulatingSheet}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  {simulatingSheet ? 'Submitting Row to CRM...' : 'Simulate Single Row Webhook Inbound (5 Fields)'}
                </button>
              </form>

              {sheetInboundResult && (
                <div className="p-3 rounded-lg bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto">
                  <div className="text-emerald-400 font-bold mb-1">
                    ✓ Result: {sheetInboundResult.message || 'Processed'}
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

      {/* Tab: Meta Lead Ads & Instant Forms Hub */}
      {activeTab === 'meta' && (
        <div className="space-y-6">
          {/* Top Overview Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight">
                    Meta Instant Forms &amp; Lead Ads Direct Engine
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      metaIntegration.status === 'CONNECTED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    }`}
                  >
                    {metaIntegration.status === 'CONNECTED' ? '● LIVE SYNC ACTIVE' : '○ SETUP REQUIRED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Connect Facebook &amp; Instagram Lead Ad Instant Forms directly to Gems Group Services CRM—just like HubSpot. 
                  Student inquiries captured in real time, checked for duplicates, and instantly routed to the best counselor by Course &amp; University.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://developers.facebook.com/tools/lead-ads-testing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Meta Lead Ads Testing Tool</span>
                </a>
              </div>
            </div>

            {/* Quick Metrics & Capabilities Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Live Webhook</div>
                <div className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Subscribed (leadgen)</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Graph API Retrieval</div>
                <div className="font-bold text-blue-300 mt-0.5">v21.0 LeadGen Token</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Lead Routing</div>
                <div className="font-bold text-purple-300 mt-0.5">Automated by Course &amp; Uni</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Duplicate Shield</div>
                <div className="font-bold text-amber-300 mt-0.5">4-Point Phone/Email Match</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Webhook URLs & Credentials Form (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Webhook URLs Card */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Live Inbound Webhook Endpoints</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Copy these URLs to configure real-time Meta Lead Ads Webhook or direct form posts
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Meta Official Callback URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Meta Webhook Callback URL (Page &gt; leadgen)</span>
                      </label>
                      <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        HubSpot / Meta Native
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/api/integrations/meta/webhook`}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-gray-800 text-[11px] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(`${window.location.origin}/api/integrations/meta/webhook`, 'meta_url')}
                        className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition shrink-0"
                        title="Copy URL"
                      >
                        {copiedKey === 'meta_url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Verify Token */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Verification Token (hub.verify_token)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={metaFormConfig.verifyToken || 'gems_group_services_meta_verify_2026'}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-gray-800 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(metaFormConfig.verifyToken || 'gems_group_services_meta_verify_2026', 'meta_token')}
                        className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition shrink-0"
                        title="Copy Token"
                      >
                        {copiedKey === 'meta_token' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Universal Instant Form Ingest Webhook */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-700 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Universal Form Ingest Webhook (Zapier / Make / Landing Pages)</span>
                      </label>
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                        Direct JSON Post
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/api/integrations/forms/instant-capture`}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-mono text-gray-800 text-[11px] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(`${window.location.origin}/api/integrations/forms/instant-capture`, 'universal_url')}
                        className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition shrink-0"
                        title="Copy URL"
                      >
                        {copiedKey === 'universal_url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Accepts standard JSON: <code>{'{ "student_name", "phone", "email", "course", "university", "city" }'}</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta Credentials Form */}
              <form onSubmit={handleSaveMetaConfig} className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600" />
                      <span>Meta Graph API Credentials &amp; Page Setup</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Required for live automatic retrieval of student names, phones, and emails from Meta's secure servers
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Encrypted Storage
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Meta Page Access Token (Permanent / System User Token) *</span>
                      <a
                        href="https://developers.facebook.com/tools/explorer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-normal"
                      >
                        <span>Graph API Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </label>
                    <div className="relative">
                      <input
                        type={showMetaToken ? 'text' : 'password'}
                        value={metaFormConfig.pageAccessToken}
                        onChange={(e) => setMetaFormConfig({ ...metaFormConfig, pageAccessToken: e.target.value })}
                        placeholder="EAA..."
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 font-mono text-xs pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMetaToken(!showMetaToken)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showMetaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Must have permissions: <code>leads_retrieval</code> and <code>pages_show_list</code>. Never expires if created via System User.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Facebook Page ID (Optional)</label>
                      <input
                        type="text"
                        value={metaFormConfig.pageId}
                        onChange={(e) => setMetaFormConfig({ ...metaFormConfig, pageId: e.target.value })}
                        placeholder="e.g. 104928472918234"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Custom Verify Token</label>
                      <input
                        type="text"
                        value={metaFormConfig.verifyToken}
                        onChange={(e) => setMetaFormConfig({ ...metaFormConfig, verifyToken: e.target.value })}
                        placeholder="gems_group_services_meta_verify_2026"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Auto Lead Routing Toggle */}
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-purple-950 text-xs">Automated Lead Distribution Engine</div>
                      <p className="text-[11px] text-purple-800/80">
                        Automatically assign incoming Instant Form leads to counselors specialized in student's course &amp; university
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={metaFormConfig.autoAssign}
                      onChange={(e) => setMetaFormConfig({ ...metaFormConfig, autoAssign: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                    />
                  </div>

                  {/* Token Verification Result Banner */}
                  {metaTokenTestResult && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        metaTokenTestResult.valid
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        {metaTokenTestResult.valid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Token Valid &amp; Connected!</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>Verification Check Failed</span>
                          </>
                        )}
                      </div>
                      {metaTokenTestResult.valid ? (
                        <div className="text-[11px] space-y-1 text-emerald-800">
                          <div>
                            Facebook Page: <strong>{metaTokenTestResult.pageName}</strong> (ID: {metaTokenTestResult.pageId})
                          </div>
                          <div>
                            Active Instant Forms: <strong>{metaTokenTestResult.leadgenFormsCount} forms detected</strong>
                          </div>
                          {Array.isArray(metaTokenTestResult.forms) && metaTokenTestResult.forms.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {metaTokenTestResult.forms.map((f: any) => (
                                <span key={f.id} className="text-[9px] px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-900 font-semibold">
                                  {f.name} ({f.status})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-rose-700 font-mono">
                          {metaTokenTestResult.error}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTestMetaCredentials}
                      disabled={testingMetaToken || !metaFormConfig.pageAccessToken.trim()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {testingMetaToken ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>Connecting to Meta Graph API...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Test Token &amp; Inspect Forms</span>
                        </>
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={savingMeta}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/20 transition disabled:opacity-50"
                    >
                      {savingMeta ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Settings...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Meta Configuration</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column: Connection Guide & Live Inbound Simulator (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Step-by-Step Interactive Guide */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                      <span>How to Connect Instant Form (HubSpot Style)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Zero third-party subscriptions required
                    </p>
                  </div>
                </div>

                {/* Sub-tab navigation for guide */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveMetaGuideTab('direct')}
                    className={`flex-1 py-1.5 text-center font-bold rounded-lg transition ${
                      activeMetaGuideTab === 'direct' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Direct Meta Webhook
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetaGuideTab('mapping')}
                    className={`flex-1 py-1.5 text-center font-bold rounded-lg transition ${
                      activeMetaGuideTab === 'mapping' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Field Auto-Mapping
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMetaGuideTab('webhook')}
                    className={`flex-1 py-1.5 text-center font-bold rounded-lg transition ${
                      activeMetaGuideTab === 'webhook' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Zapier / No-Code
                  </button>
                </div>

                {/* Guide Tab 1: Direct Meta Webhook */}
                {activeMetaGuideTab === 'direct' && (
                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <p>
                        Open <strong>Meta for Developers</strong> (&gt; My Apps) or <strong>Meta Business Suite</strong> and add the <strong>Webhooks</strong> product.
                      </p>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <p>
                        Select <strong>Page</strong> object, enter your Callback URL and Verify Token, then click <strong>Verify and Save</strong>.
                      </p>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <p>
                        Under Page Subscriptions, subscribe to the <strong>leadgen</strong> event for your Gems Group Services Facebook Page.
                      </p>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        4
                      </span>
                      <p>
                        Generate a <strong>Page Access Token</strong> (with <code>leads_retrieval</code> permission) and paste it into the left box.
                      </p>
                    </div>

                    <div className="pt-2">
                      <a
                        href="https://developers.facebook.com/tools/lead-ads-testing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-blue-200 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Official Meta Lead Ads Testing Tool</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Guide Tab 2: Field Auto-Mapping */}
                {activeMetaGuideTab === 'mapping' && (
                  <div className="space-y-2 text-xs">
                    <p className="text-[11px] text-gray-500">
                      Our smart parser automatically maps any Meta Instant Form field names to the CRM:
                    </p>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold text-[10px] uppercase">
                          <tr>
                            <th className="p-2 text-left">Meta Form Field</th>
                            <th className="p-2 text-left">CRM Lead Field</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr>
                            <td className="p-2 font-mono text-gray-700">full_name, name, first_name</td>
                            <td className="p-2 font-bold text-slate-900">Student Full Name</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono text-gray-700">phone_number, mobile, whatsapp</td>
                            <td className="p-2 font-bold text-slate-900">Phone / WhatsApp</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono text-gray-700">email, email_address</td>
                            <td className="p-2 font-bold text-slate-900">Student Email</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono text-gray-700">course, preferred_course, program</td>
                            <td className="p-2 font-bold text-purple-700">Preferred Course</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono text-gray-700">university, college, campus</td>
                            <td className="p-2 font-bold text-indigo-700">Target University</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-mono text-gray-700">city, location, district</td>
                            <td className="p-2 font-bold text-slate-900">City / Region</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Guide Tab 3: Zapier / No-Code Webhook */}
                {activeMetaGuideTab === 'webhook' && (
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <p>
                      If you use <strong>Zapier, Make, LeadSync, or WordPress / Elementor Landing Pages</strong>:
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] space-y-1">
                      <div className="text-slate-400">// POST JSON to:</div>
                      <div className="text-emerald-400 break-all">{`${window.location.origin}/api/integrations/forms/instant-capture`}</div>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      When triggered, the CRM immediately creates the lead, assigns the counselor, and triggers automated welcome workflows.
                    </p>
                  </div>
                )}
              </div>

              {/* Live Inbound Lead Simulator Card */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-600" />
                      <span>Live Inbound Lead Simulator</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Test live lead capture and counselor assignment right now
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                    Interactive
                  </span>
                </div>

                <form onSubmit={handleSimulateMetaLead} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={metaSimData.student_name}
                      onChange={(e) => setMetaSimData({ ...metaSimData, student_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={metaSimData.phone}
                        onChange={(e) => setMetaSimData({ ...metaSimData, phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={metaSimData.email}
                        onChange={(e) => setMetaSimData({ ...metaSimData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Target Course</label>
                      <input
                        type="text"
                        value={metaSimData.preferred_course}
                        onChange={(e) => setMetaSimData({ ...metaSimData, preferred_course: e.target.value })}
                        placeholder="e.g. B.Tech, MBBS, MBA"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Target University</label>
                      <input
                        type="text"
                        value={metaSimData.preferred_university}
                        onChange={(e) => setMetaSimData({ ...metaSimData, preferred_university: e.target.value })}
                        placeholder="e.g. Sharda, Chandigarh"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">City / Region</label>
                      <input
                        type="text"
                        value={metaSimData.city}
                        onChange={(e) => setMetaSimData({ ...metaSimData, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Campaign Tag</label>
                      <input
                        type="text"
                        value={metaSimData.campaign}
                        onChange={(e) => setMetaSimData({ ...metaSimData, campaign: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={simulatingMeta}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-900/20 transition-all disabled:opacity-50"
                  >
                    {simulatingMeta ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Capturing Live Lead...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Simulate Live Instant Form Submission</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Simulation Result Card */}
                {simulationResult && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border text-xs space-y-2 ${
                      simulationResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Lead Pipeline Success</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {simulationResult.lead?.lead_id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-gray-500">Student: </span>
                        <strong>{simulationResult.lead?.student_name}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500">Assigned Counselor: </span>
                        <strong className="text-purple-700">
                          {simulationResult.lead?.assigned_counselor_name || 'Automated Pool'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-gray-500">Course / Uni: </span>
                        <span>{simulationResult.lead?.preferred_course}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duplicate Status: </span>
                        <span>{simulationResult.duplicate ? 'Duplicate (Updated)' : 'New Lead'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: WhatsApp Cloud API */}
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
                <span className="font-bold">Gems Group Services Dispatch Logic:</span> When credentials are not yet saved, the CRM safely logs simulated WhatsApp dispatches to the database and creates counselor notifications.
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

      {/* Tab: Message Templates */}
      {activeTab === 'templates' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Gems Group Services Pre-Approved Message Templates</h3>
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

      {/* Tab: Integration Activity Logs */}
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
