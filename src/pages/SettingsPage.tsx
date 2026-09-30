import React, { useState, useEffect } from 'react';
import { 
  Building2, Sliders, Users, ShieldAlert, Save, RefreshCw, 
  CheckCircle, MapPin, Phone, Mail, Globe, Clock, GitFork, 
  Check, Lock, Eye, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'routing' | 'users' | 'audit'>('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'Education Sansar',
    company_tagline: 'Premier Education Counseling & University Admission Consultancy',
    company_address: 'Sector 94, Noida, Uttar Pradesh 201313',
    company_phone: '+91 120 4567890',
    company_email: 'admissions@educationsansar.com',
    company_website: 'https://educationsansar.com',
    lead_assignment_mode: 'ROUND_ROBIN',
    auto_followup_hours: '24',
    enable_whatsapp_auto_welcome: '1',
    duplicate_check_phone: '1',
    duplicate_check_whatsapp: '1',
    duplicate_check_email: '1',
    duplicate_check_meta_id: '1',
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, usersRes, auditRes] = await Promise.all([
        api.getSettings(),
        api.getUsers(),
        api.getAuditLogs(),
      ]);
      if (settingsRes && Object.keys(settingsRes).length > 0) {
        setSettings((prev) => ({ ...prev, ...settingsRes }));
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      addToast('Only Super Admin can update system configuration', 'warning');
      return;
    }

    try {
      setSaving(true);
      await api.updateSettings({ ...settings, performedBy: user?.name || 'Admin' });
      addToast('System settings saved successfully', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
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
              <h1 className="text-2xl font-bold text-gray-900">System Settings & Administration</h1>
              <p className="text-sm text-gray-500">
                Education Sansar corporate profile, lead routing engine, RBAC, and audit logs
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

      {/* Tab 3: System Users & RBAC */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">User Accounts & Role Permissions</h3>
              <p className="text-sm text-gray-500">
                Role-Based Access Control (RBAC) across 6 organizational tiers
              </p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 font-bold px-3 py-1 rounded-full">
              {usersList.length} Active System Users
            </span>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersList.map((u) => {
                  const roleColors: Record<string, string> = {
                    SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
                    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
                    COUNSELOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    TELECALLER: 'bg-amber-100 text-amber-800 border-amber-200',
                    MARKETING_MANAGER: 'bg-pink-100 text-pink-800 border-pink-200',
                    MANAGEMENT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                  };

                  const rolePermissions: Record<string, string> = {
                    SUPER_ADMIN: 'Full system control, settings, audit logs, user management, exports',
                    ADMIN: 'Lead management, counselor assignment, university approvals, reports',
                    COUNSELOR: 'Assigned leads only, calls/WhatsApp, applications, student admission',
                    TELECALLER: 'First contact, qualification, scheduling follow-ups, transfer to counselor',
                    MARKETING_MANAGER: 'Campaigns tracking, Meta lead forms, CPL/CPA analysis',
                    MANAGEMENT: 'Read-only executive analytics, KPIs, admissions conversion reporting',
                  };

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
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs">
                        {rolePermissions[u.role] || 'Standard permissions'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
