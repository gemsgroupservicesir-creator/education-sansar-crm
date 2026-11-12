import React, { useState, useEffect } from 'react';
import { 
  Building2, Sliders, Users, ShieldAlert, Save, RefreshCw, 
  CheckCircle, MapPin, Phone, Mail, Globe, Clock, GitFork, 
  Check, Lock, Eye, AlertCircle, Sparkles, Bot,
  UserPlus, Edit, Trash2, X, Key, Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'routing' | 'ai' | 'users' | 'audit'>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'Gems Group Services',
    company_tagline: 'Premier Education Counseling & University Admission Consultancy',
    company_address: 'Sector 94, Noida, Uttar Pradesh 201313',
    company_phone: '+91 120 4567890',
    company_email: 'admissions@gemsgroupservices.com',
    company_website: 'https://gemsgroupservices.com',
    lead_assignment_mode: 'ROUND_ROBIN',
    auto_followup_hours: '24',
    enable_whatsapp_auto_welcome: '1',
    duplicate_check_phone: '1',
    duplicate_check_whatsapp: '1',
    duplicate_check_email: '1',
    duplicate_check_meta_id: '1',
  });

  // AI Sales & Outreach State
  const [aiSettings, setAiSettings] = useState<any>({
    ai_auto_whatsapp_enabled: true,
    ai_auto_email_enabled: true,
    ai_sales_tone: 'Empathetic & Highly Persuasive',
    ai_model: 'gemini-2.5-flash',
    ai_custom_instructions: '',
    gemini_api_key_masked: '',
    is_gemini_active: false,
    raw_gemini_api_key: ''
  });
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<any>(null);

  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // User Management Modal & Form State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRole, setUserFormRole] = useState('Counselor');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormDepartment, setUserFormDepartment] = useState('Admissions');
  const [userFormDesignation, setUserFormDesignation] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const handleOpenAddUserModal = () => {
    setUserFormName('');
    setUserFormEmail('');
    setUserFormPassword('user123');
    setUserFormRole('Counselor');
    setUserFormPhone('');
    setUserFormDepartment('Admissions');
    setUserFormDesignation('Admission Counselor');
    setAddUserModalOpen(true);
  };

  const handleOpenEditUserModal = (u: any) => {
    setEditingUser(u);
    setUserFormName(u.name || '');
    setUserFormEmail(u.email || '');
    setUserFormPassword('');
    setUserFormRole(u.role || 'Counselor');
    setUserFormPhone(u.phone || '');
    setEditUserModalOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim()) {
      addToast('Please enter full name', 'warning');
      return;
    }
    if (!userFormEmail.trim() || !userFormEmail.includes('@')) {
      addToast('Please enter a valid email address', 'warning');
      return;
    }

    setIsSubmittingUser(true);
    try {
      await api.createUser({
        name: userFormName.trim(),
        email: userFormEmail.trim().toLowerCase(),
        password: userFormPassword.trim() || 'user123',
        role: userFormRole,
        phone: userFormPhone.trim(),
        department: userFormDepartment.trim(),
        designation: userFormDesignation.trim()
      });
      addToast(`User ${userFormName} created successfully with role ${userFormRole}!`, 'success');
      setAddUserModalOpen(false);
      const updatedUsers = await api.getUsers();
      setUsersList(updatedUsers);
    } catch (err: any) {
      addToast(err.message || 'Failed to create user account', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!userFormName.trim()) {
      addToast('Please enter full name', 'warning');
      return;
    }

    setIsSubmittingUser(true);
    try {
      await api.updateUser(editingUser.id, {
        name: userFormName.trim(),
        email: userFormEmail.trim().toLowerCase(),
        role: userFormRole,
        phone: userFormPhone.trim(),
        ...(userFormPassword.trim() ? { password: userFormPassword.trim() } : {})
      });
      addToast(`User ${userFormName} updated successfully!`, 'success');
      setEditUserModalOpen(false);
      const updatedUsers = await api.getUsers();
      setUsersList(updatedUsers);
    } catch (err: any) {
      addToast(err.message || 'Failed to update user', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleToggleUserStatus = async (u: any) => {
    try {
      const newActive = u.is_active ? 0 : 1;
      await api.updateUser(u.id, { is_active: newActive });
      addToast(`User account ${u.name} is now ${newActive ? 'Active' : 'Inactive'}`, 'success');
      const updatedUsers = await api.getUsers();
      setUsersList(updatedUsers);
    } catch (err: any) {
      addToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account "${u.name}" (${u.email})?`)) {
      return;
    }
    try {
      await api.deleteUser(u.id);
      addToast(`User account ${u.name} deleted successfully`, 'success');
      const updatedUsers = await api.getUsers();
      setUsersList(updatedUsers);
    } catch (err: any) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, usersRes, auditRes, aiRes] = await Promise.all([
        api.getSettings(),
        api.getUsers(),
        api.getAuditLogs(),
        api.getAISettings().catch(() => null),
      ]);
      if (settingsRes && Object.keys(settingsRes).length > 0) {
        setSettings((prev) => ({ ...prev, ...settingsRes }));
      }
      if (aiRes) {
        setAiSettings({
          ai_auto_whatsapp_enabled: aiRes.ai_auto_whatsapp_enabled,
          ai_auto_email_enabled: aiRes.ai_auto_email_enabled,
          ai_sales_tone: aiRes.ai_sales_tone || 'Empathetic & Highly Persuasive',
          ai_model: aiRes.ai_model || 'gemini-2.5-flash',
          ai_custom_instructions: aiRes.ai_custom_instructions || '',
          gemini_api_key_masked: aiRes.gemini_api_key || '',
          is_gemini_active: aiRes.is_gemini_active,
          raw_gemini_api_key: ''
        });
      }
      setUsersList(usersRes);
      setAuditLogs(auditRes);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hasSuperAdminRights = Boolean(
    isSuperAdmin || 
    user?.role === 'Super Admin' || 
    user?.email === 'admin@gemsgroupservices.com' ||
    user?.email === 'admin@educationsansar.com'
  );

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSuperAdminRights) {
      addToast('Only Super Admin can update system configuration', 'warning');
      return;
    }

    try {
      setSaving(true);
      await api.updateSettings({ ...settings, performedBy: user?.name || 'Super Admin' });
      addToast('System settings saved successfully', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSuperAdminRights) {
      addToast('Only Super Admin can update AI configuration', 'warning');
      return;
    }

    try {
      setSaving(true);
      await api.updateAISettings({
        ai_auto_whatsapp_enabled: aiSettings.ai_auto_whatsapp_enabled ? '1' : '0',
        ai_auto_email_enabled: aiSettings.ai_auto_email_enabled ? '1' : '0',
        ai_sales_tone: aiSettings.ai_sales_tone,
        ai_model: aiSettings.ai_model,
        ai_custom_instructions: aiSettings.ai_custom_instructions,
        gemini_api_key: aiSettings.raw_gemini_api_key || undefined,
        performedBy: user?.name || 'Super Admin'
      });
      addToast('AI Sales & Auto-Outreach settings saved successfully', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save AI configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestGeminiKey = async () => {
    try {
      setTestingGemini(true);
      setGeminiTestResult(null);
      const res = await api.testGeminiConnection(aiSettings.raw_gemini_api_key || undefined);
      setGeminiTestResult(res);
      if (res.success) {
        addToast(`Gemini Connected! Sample: ${res.sampleResponse}`, 'success');
      } else {
        addToast(`Gemini Test Error: ${res.error}`, 'error');
      }
    } catch (err: any) {
      setGeminiTestResult({ success: false, error: err.message });
      addToast(err.message || 'Gemini connection failed', 'error');
    } finally {
      setTestingGemini(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading system configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">System Settings & Administration</h1>
                {hasSuperAdminRights ? (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    Super Admin Access
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                    View Only Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Gems Group Services corporate profile, lead routing engine, RBAC, and audit logs
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition self-start md:self-auto"
          title="Refresh Settings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'company'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company Profile
        </button>

        <button
          onClick={() => setActiveTab('routing')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'routing'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <GitFork className="w-4 h-4" />
          Lead Distribution & Routing
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'ai'
              ? 'border-purple-600 text-purple-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          AI Outreach & Sales Engine
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          System Users & RBAC ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">Organization & Headquarters Information</h3>
            <p className="text-xs text-gray-500">Official legal and operational consultancy credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Company Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tagline</label>
              <input
                type="text"
                value={settings.company_tagline}
                onChange={(e) => setSettings({ ...settings, company_tagline: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Headquarters Address (Sector 94, Noida)
              </label>
              <input
                type="text"
                required
                value={settings.company_address}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                Official Contact Phone
              </label>
              <input
                type="text"
                value={settings.company_phone}
                onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Admissions Email
              </label>
              <input
                type="email"
                value={settings.company_email}
                onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                Official Website
              </label>
              <input
                type="text"
                value={settings.company_website}
                onChange={(e) => setSettings({ ...settings, company_website: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Target Markets</label>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold">
                  🇳🇵 Nepal (Kathmandu, Birgunj, Janakpur, Biratnagar, Butwal, Bhairahawa)
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
                  🇮🇳 India (Delhi, Noida, Bangalore, Chennai, Pune)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Lead Routing & Assignment Engine */}
      {activeTab === 'routing' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">Automated Lead Distribution Engine</h3>
            <p className="text-xs text-gray-500">
              Configure how inbound leads from Meta, Website, and Portals are assigned to counselors
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Assignment Strategy</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  settings.lead_assignment_mode === 'ROUND_ROBIN' 
                    ? 'border-blue-600 bg-blue-50/50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="lead_assignment_mode"
                    value="ROUND_ROBIN"
                    checked={settings.lead_assignment_mode === 'ROUND_ROBIN'}
                    onChange={(e) => setSettings({ ...settings, lead_assignment_mode: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <CheckCircle className={`w-4 h-4 ${settings.lead_assignment_mode === 'ROUND_ROBIN' ? 'text-blue-600' : 'text-gray-300'}`} />
                    Round Robin (Fair Share)
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Evenly distributes incoming leads in continuous rotation across all active counselors.
                  </p>
                </label>

                <label className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  settings.lead_assignment_mode === 'CITY' 
                    ? 'border-blue-600 bg-blue-50/50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="lead_assignment_mode"
                    value="CITY"
                    checked={settings.lead_assignment_mode === 'CITY'}
                    onChange={(e) => setSettings({ ...settings, lead_assignment_mode: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <CheckCircle className={`w-4 h-4 ${settings.lead_assignment_mode === 'CITY' ? 'text-blue-600' : 'text-gray-300'}`} />
                    City Specialization
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Routes Nepal leads (Kathmandu, Birgunj, etc.) to Nepal desks and India leads to India desks.
                  </p>
                </label>

                <label className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  settings.lead_assignment_mode === 'MANUAL' 
                    ? 'border-blue-600 bg-blue-50/50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="lead_assignment_mode"
                    value="MANUAL"
                    checked={settings.lead_assignment_mode === 'MANUAL'}
                    onChange={(e) => setSettings({ ...settings, lead_assignment_mode: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <CheckCircle className={`w-4 h-4 ${settings.lead_assignment_mode === 'MANUAL' ? 'text-blue-600' : 'text-gray-300'}`} />
                    Manual Assignment Only
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    New leads enter unassigned queue; Telecaller or Admin manually dispatches to counselors.
                  </p>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h4 className="text-sm font-bold text-gray-800">Duplicate Check Enforcement (Section 8)</h4>
              <p className="text-xs text-gray-500">
                The CRM will alert users and prevent redundant entries if any of these matching criteria match:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.duplicate_check_phone === '1'}
                    onChange={(e) => setSettings({ ...settings, duplicate_check_phone: e.target.checked ? '1' : '0' })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">Primary Phone Number</span>
                    <p className="text-[11px] text-gray-500">Strip whitespace and international country codes (+977 / +91)</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.duplicate_check_whatsapp === '1'}
                    onChange={(e) => setSettings({ ...settings, duplicate_check_whatsapp: e.target.checked ? '1' : '0' })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">WhatsApp Mobile Number</span>
                    <p className="text-[11px] text-gray-500">Check for cross-registered WhatsApp contact</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.duplicate_check_email === '1'}
                    onChange={(e) => setSettings({ ...settings, duplicate_check_email: e.target.checked ? '1' : '0' })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">Email Address</span>
                    <p className="text-[11px] text-gray-500">Case-insensitive RFC email match</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.duplicate_check_meta_id === '1'}
                    onChange={(e) => setSettings({ ...settings, duplicate_check_meta_id: e.target.checked ? '1' : '0' })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">Meta Lead ID (Facebook/Instagram)</span>
                    <p className="text-[11px] text-gray-500">Enforces idempotent webhook replay protection</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Default First Follow-Up SLA (Hours)
                </label>
                <input
                  type="number"
                  value={settings.auto_followup_hours}
                  onChange={(e) => setSettings({ ...settings, auto_followup_hours: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  When a new lead arrives, an initial contact follow-up task is scheduled automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Auto WhatsApp Welcome Greeting
                </label>
                <select
                  value={settings.enable_whatsapp_auto_welcome}
                  onChange={(e) => setSettings({ ...settings, enable_whatsapp_auto_welcome: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="1">Enabled (Queue auto greeting on new lead)</option>
                  <option value="0">Disabled (Manual counselor outreach only)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4" /> Save Distribution Rules
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab: AI Autonomous Outreach & Sales Engine */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveAISettings} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">AI Autonomous Outreach &amp; Sales Engine</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure autonomous lead outreach, counselor identity signing, negotiation tone, and Google Gemini API
              </p>
            </div>
            <div>
              {aiSettings.is_gemini_active ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Gemini API Active ({aiSettings.ai_model})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Deterministic Admissions Engine Active
                </span>
              )}
            </div>
          </div>

          {/* Autonomous Outreach Toggles */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600" />
                Autonomous Welcome Outreach on Lead Creation
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Automatically draft and dispatch customized initial outreach as soon as a lead is captured (via Meta Webhook, CSV Import, or Manual Entry) signed in the assigned counselor's name.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                aiSettings.ai_auto_whatsapp_enabled ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <input
                  type="checkbox"
                  checked={aiSettings.ai_auto_whatsapp_enabled}
                  onChange={(e) => setAiSettings({ ...aiSettings, ai_auto_whatsapp_enabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded mt-1"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Auto-Dispatch WhatsApp Welcome</span>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    AI crafts a personalized WhatsApp message addressing the student by name, citing their target course &amp; university, and signing with the counselor's direct contact.
                  </p>
                  <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    High Conversion (94% open rate)
                  </span>
                </div>
              </label>

              <label className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                aiSettings.ai_auto_email_enabled ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <input
                  type="checkbox"
                  checked={aiSettings.ai_auto_email_enabled}
                  onChange={(e) => setAiSettings({ ...aiSettings, ai_auto_email_enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded mt-1"
                />
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Auto-Dispatch Email Welcome</span>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Dispatches a structured admission prospectus email with fee overview, eligibility guidelines, scholarship advisory, and counselor credentials.
                  </p>
                  <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Official Documentation Record
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* AI Sales Personality & Persona */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <h4 className="text-sm font-bold text-gray-900">Counseling Tone &amp; Sales Pitch Style</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Sales Negotiation Persona
                </label>
                <select
                  value={aiSettings.ai_sales_tone}
                  onChange={(e) => setAiSettings({ ...aiSettings, ai_sales_tone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium text-gray-800"
                >
                  <option value="Empathetic & Highly Persuasive">Empathetic &amp; Highly Persuasive (Default - Best for Nepal &amp; India students)</option>
                  <option value="Professional & Academic Authority">Professional &amp; Academic Authority (Best for Medical &amp; PG)</option>
                  <option value="Urgent & High-Energy Closer">Urgent &amp; High-Energy Closer (Best for Seat Quota &amp; Deadline Push)</option>
                  <option value="Supportive & Parent-Oriented">Supportive &amp; Parent-Oriented (Focused on safety, hostel, and career ROI)</option>
                  <option value="Friendly Peer & Senior Student Mentor">Friendly Peer &amp; Senior Student Mentor (Approachable for high school grads)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Controls the phrasing used by the AI Sales Copilot during objection handling and WhatsApp pitch generation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Primary AI Model
                </label>
                <select
                  value={aiSettings.ai_model}
                  onChange={(e) => setAiSettings({ ...aiSettings, ai_model: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium text-gray-800"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended: Ultra-fast sub-second latency)</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Advanced multi-turn reasoning)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  When a Gemini key is active, calls use this high-performance Google AI model.
                </p>
              </div>
            </div>
          </div>

          {/* Gemini API Key Configuration */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Google Gemini API Key</h4>
                <p className="text-xs text-gray-500">
                  Optional. Provide a Gemini API key to upgrade from deterministic templates to live dynamic generative copy.
                </p>
              </div>
              {aiSettings.gemini_api_key_masked && (
                <span className="text-xs text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Configured: {aiSettings.gemini_api_key_masked}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="password"
                  placeholder={aiSettings.gemini_api_key_masked ? 'Enter new key to replace existing...' : 'Paste AIzaSy... API key'}
                  value={aiSettings.raw_gemini_api_key}
                  onChange={(e) => setAiSettings({ ...aiSettings, raw_gemini_api_key: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleTestGeminiKey}
                disabled={testingGemini}
                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {testingGemini ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Test Gemini Connection
                  </>
                )}
              </button>
            </div>

            {geminiTestResult && (
              <div className={`p-3 rounded-lg text-xs ${
                geminiTestResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {geminiTestResult.success ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Gemini API test successful!</p>
                      <p className="mt-0.5 text-emerald-700 font-mono">Sample: "{geminiTestResult.sampleResponse}"</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Gemini API test failed:</p>
                      <p className="mt-0.5">{geminiTestResult.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom Counseling Rules & Knowledge */}
          <div className="border-t border-gray-100 pt-5 space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase">
              Custom Admissions Counseling Knowledge &amp; Instructions
            </label>
            <p className="text-xs text-gray-500">
              Provide institutional knowledge for the AI (e.g., special fee discounts for Nepal students, visa assistance perks, hostel safety guidelines, priority universities like Sharda, Galgotias, Amity, Chandigarh University, etc.)
            </p>
            <textarea
              rows={4}
              value={aiSettings.ai_custom_instructions}
              onChange={(e) => setAiSettings({ ...aiSettings, ai_custom_instructions: e.target.value })}
              placeholder="e.g. Always emphasize our 100% visa assistance for Nepal students. Mention that hostel accommodation has 24/7 security and dedicated mess facilities. For B.Tech / MBBS leads, highlight our exclusive scholarship seat tie-ups."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500 italic">
              AI outreach will always identify the assigned counselor's name and contact number.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4" /> Save AI Configuration
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: System Users & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">User Accounts & Role Permissions</h3>
              <p className="text-sm text-gray-500">
                Role-Based Access Control (RBAC) across 6 organizational tiers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 font-bold px-3 py-1 rounded-full">
                {usersList.length} Active System Users
              </span>
              <button
                onClick={handleOpenAddUserModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add New User</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Permissions Overview</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.map((u) => {
                  const roleColors: Record<string, string> = {
                    SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
                    'Super Admin': 'bg-purple-100 text-purple-800 border-purple-200',
                    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
                    Admin: 'bg-blue-100 text-blue-800 border-blue-200',
                    COUNSELOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    Counselor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    TELECALLER: 'bg-amber-100 text-amber-800 border-amber-200',
                    Telecaller: 'bg-amber-100 text-amber-800 border-amber-200',
                    MARKETING_MANAGER: 'bg-pink-100 text-pink-800 border-pink-200',
                    'Marketing Manager': 'bg-pink-100 text-pink-800 border-pink-200',
                    MANAGEMENT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    Management: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                  };

                  const rolePermissions: Record<string, string> = {
                    SUPER_ADMIN: 'Full system control, settings, audit logs, user management, exports',
                    'Super Admin': 'Full system control, settings, audit logs, user management, exports',
                    ADMIN: 'Lead management, counselor assignment, university approvals, reports',
                    Admin: 'Lead management, counselor assignment, university approvals, reports',
                    COUNSELOR: 'Assigned leads only, calls/WhatsApp, applications, student admission',
                    Counselor: 'Assigned leads only, calls/WhatsApp, applications, student admission',
                    TELECALLER: 'First contact, qualification, scheduling follow-ups, transfer to counselor',
                    Telecaller: 'First contact, qualification, scheduling follow-ups, transfer to counselor',
                    MARKETING_MANAGER: 'Campaigns tracking, Meta lead forms, CPL/CPA analysis',
                    'Marketing Manager': 'Campaigns tracking, Meta lead forms, CPL/CPA analysis',
                    MANAGEMENT: 'Read-only executive analytics, KPIs, admissions conversion reporting',
                    Management: 'Read-only executive analytics, KPIs, admissions conversion reporting',
                  };

                  const isActive = u.is_active === 1 || u.is_active === true;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{u.name}</td>
                      <td className="py-3.5 px-4 text-gray-600">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${roleColors[u.role] || 'bg-gray-100 text-gray-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{u.phone || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs">
                        {rolePermissions[u.role] || 'Standard permissions'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditUserModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit user details & password"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                              isActive
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            }`}
                            title={isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          {u.email !== 'admin@gemsgroupservices.com' && u.email !== 'admin@educationsansar.com' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ADD USER MODAL */}
          {addUserModalOpen && (
            <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
              <form
                onSubmit={handleCreateUserSubmit}
                className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Add New System User</h3>
                      <p className="text-xs text-slate-500">Create login credentials and assign role permissions</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddUserModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={userFormName}
                      onChange={(e) => setUserFormName(e.target.value)}
                      placeholder="e.g. Rajesh Shrestha"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address (Login ID) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={userFormEmail}
                      onChange={(e) => setUserFormEmail(e.target.value)}
                      placeholder="e.g. rajesh@gemsgroupservices.com"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        System Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={userFormRole}
                        onChange={(e) => setUserFormRole(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Counselor">Counselor</option>
                        <option value="Telecaller">Telecaller</option>
                        <option value="Marketing Manager">Marketing Manager</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password (Min 4 chars)
                      </label>
                      <input
                        type="text"
                        value={userFormPassword}
                        onChange={(e) => setUserFormPassword(e.target.value)}
                        placeholder="Default: user123"
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        value={userFormPhone}
                        onChange={(e) => setUserFormPhone(e.target.value)}
                        placeholder="+977 98..."
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={userFormDepartment}
                        onChange={(e) => setUserFormDepartment(e.target.value)}
                        placeholder="e.g. Admissions, Telecalling"
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmittingUser}
                    onClick={() => setAddUserModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-900/20 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {isSubmittingUser ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating User...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create User Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT USER MODAL */}
          {editUserModalOpen && editingUser && (
            <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
              <form
                onSubmit={handleEditUserSubmit}
                className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Edit className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Edit User Account</h3>
                      <p className="text-xs text-slate-500">Update role, details, or reset password for {editingUser.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditUserModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={userFormName}
                      onChange={(e) => setUserFormName(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={userFormEmail}
                      onChange={(e) => setUserFormEmail(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                      <select
                        value={userFormRole}
                        onChange={(e) => setUserFormRole(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Counselor">Counselor</option>
                        <option value="Telecaller">Telecaller</option>
                        <option value="Marketing Manager">Marketing Manager</option>
                        <option value="Management">Management</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={userFormPhone}
                        onChange={(e) => setUserFormPhone(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reset Password (leave blank to keep current)
                    </label>
                    <input
                      type="text"
                      value={userFormPassword}
                      onChange={(e) => setUserFormPassword(e.target.value)}
                      placeholder="New password (optional)"
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmittingUser}
                    onClick={() => setEditUserModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-900/20 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {isSubmittingUser ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Immutable Audit Trail</h3>
              <p className="text-sm text-gray-500">
                Log of critical actions, lead status shifts, counselor reassignments, and configuration changes
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200 font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Entity ID</th>
                  <th className="py-2.5 px-3">Change Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-500 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">
                      {log.user_name || 'System Engine'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-gray-100 text-gray-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 capitalize">{log.entity}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-600">{log.entity_id || '—'}</td>
                    <td className="py-2.5 px-3 max-w-sm truncate text-gray-600 font-mono">
                      {log.new_value ? (typeof log.new_value === 'object' ? JSON.stringify(log.new_value) : log.new_value) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
