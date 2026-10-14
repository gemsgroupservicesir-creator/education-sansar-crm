import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Phone,
  MessageCircle,
  Eye,
  Trash2,
  Filter,
  RefreshCw,
  Flame,
  Sun,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Lead, LeadStatus, LeadTemperature, LeadSource } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { CreateLeadModal } from '../components/common/CreateLeadModal';
import { CSVImportModal } from '../components/common/CSVImportModal';

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { canDeleteLeads, currentRole } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [counselors, setCounselors] = useState<any[]>([]);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [city, setCity] = useState('');
  const [source, setSource] = useState('');
  const [temperature, setTemperature] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.getLeads({
        page,
        limit,
        search,
        status,
        counselorId,
        city,
        source,
        temperature,
      });
      setLeads(res.data);
      setTotalLeads(res.pagination.total);
    } catch (err: any) {
      showToast('Failed to load leads: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCounselors().then(setCounselors).catch(() => {});
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, limit, status, counselorId, city, source, temperature]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete lead for ${name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteLead(id, 'Admin User');
      showToast(`Lead ${name} deleted permanently`, 'success');
      fetchLeads();
    } catch (err: any) {
      showToast(err.message || 'Unable to delete lead', 'error');
    }
  };

  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    try {
      await api.updateLead(id, { lead_status: newStatus });
      showToast(`Lead status updated to ${newStatus}`, 'success');
      fetchLeads();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setCounselorId('');
    setCity('');
    setSource('');
    setTemperature('');
    setPage(1);
  };

  const statusColor = (s: LeadStatus) => {
    switch (s) {
      case 'New Lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Counseling Scheduled': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Counseling Done': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Interested': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Application Started': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Documents Pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Application Submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Offer Received': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Fee Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Fee Paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Admission Confirmed': return 'bg-emerald-600 text-white font-bold';
      case 'Enrolled': return 'bg-emerald-700 text-white font-bold';
      case 'Lost': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Not Interested': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const tempIcon = (t: LeadTemperature) => {
    if (t === 'HOT') return <Flame className="w-3.5 h-3.5 text-rose-600" title="HOT Lead" />;
    if (t === 'WARM') return <Sun className="w-3.5 h-3.5 text-amber-500" title="WARM Lead" />;
    return <Snowflake className="w-3.5 h-3.5 text-blue-400" title="COLD Lead" />;
  };

  const totalPages = Math.ceil(totalLeads / limit);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Lead Management
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono">
              {totalLeads} Leads
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage inquiries, assign counselors, track admissions and schedule follow-ups
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs hover:shadow-xs transition-all"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <a
            href="/api/export/leads"
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs hover:shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student, phone, email, lead ID..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
            />
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status */}
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="New Lead">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Counseling Scheduled">Counseling Scheduled</option>
              <option value="Counseling Done">Counseling Done</option>
              <option value="Interested">Interested</option>
              <option value="Application Started">Application Started</option>
              <option value="Documents Pending">Documents Pending</option>
              <option value="Application Submitted">Application Submitted</option>
              <option value="Offer Received">Offer Received</option>
              <option value="Fee Pending">Fee Pending</option>
              <option value="Fee Paid">Fee Paid</option>
              <option value="Admission Confirmed">Admission Confirmed</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Lost">Lost</option>
              <option value="Not Interested">Not Interested</option>
            </select>

            {/* Counselor */}
            <select
              value={counselorId}
              onChange={e => {
                setCounselorId(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Counselors</option>
              {counselors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* City */}
            <select
              value={city}
              onChange={e => {
                setCity(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cities</option>
              <optgroup label="Nepal">
                <option value="Kathmandu">Kathmandu</option>
                <option value="Birgunj">Birgunj</option>
                <option value="Janakpur">Janakpur</option>
                <option value="Biratnagar">Biratnagar</option>
                <option value="Butwal">Butwal</option>
                <option value="Bhairahawa">Bhairahawa</option>
                <option value="Lahan">Lahan</option>
                <option value="Rajbiraj">Rajbiraj</option>
              </optgroup>
              <optgroup label="India">
                <option value="Delhi">Delhi</option>
                <option value="Noida">Noida</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Chennai">Chennai</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
              </optgroup>
            </select>

            {/* Temperature */}
            <select
              value={temperature}
              onChange={e => {
                setTemperature(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Temperatures</option>
              <option value="HOT">🔥 HOT</option>
              <option value="WARM">☀️ WARM</option>
              <option value="COLD">❄️ COLD</option>
            </select>

            {/* Source */}
            <select
              value={source}
              onChange={e => {
                setSource(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Google">Google</option>
              <option value="Instagram">Instagram</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Walk-in">Walk-in</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>

            {(search || status || counselorId || city || source || temperature) && (
              <button
                onClick={clearFilters}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading leads records...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">No leads found.</div>
            <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Lead</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Lead ID &amp; Student</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Preferences</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Assigned Counselor</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.map(lead => (
                  <tr
                    key={lead.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    {/* Lead ID & Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{lead.student_name}</span>
                        {tempIcon(lead.lead_temperature)}
                      </div>
                      <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                        {lead.lead_id}
                        {lead.is_demo === 1 && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-sans">
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phone & WhatsApp */}
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <div className="font-mono text-slate-800 text-[11px] flex items-center gap-1.5">
                        <span>{lead.phone}</span>
                        <a
                          href={`tel:${lead.phone}`}
                          title="Call Student"
                          className="p-1 rounded hover:bg-slate-100 text-blue-600"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="font-mono text-slate-400 text-[10px] flex items-center gap-1.5">
                        <span>WA: {lead.whatsapp_number}</span>
                        <a
                          href={`https://wa.me/${lead.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Chat on WhatsApp"
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-600"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{lead.city}</div>
                      <div className="text-[10px] text-slate-500">{lead.country}</div>
                    </td>

                    {/* Course & Uni Preferences */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-semibold text-slate-900 truncate" title={lead.preferred_course}>
                        {lead.preferred_course}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={lead.preferred_university}>
                        {lead.preferred_university}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                      <select
                        value={lead.lead_status}
                        onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${statusColor(
                          lead.lead_status
                        )}`}
                      >
                        <option value="New Lead">New Lead</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Counseling Scheduled">Counseling Scheduled</option>
                        <option value="Counseling Done">Counseling Done</option>
                        <option value="Interested">Interested</option>
                        <option value="Application Started">Application Started</option>
                        <option value="Documents Pending">Documents Pending</option>
                        <option value="Application Submitted">Application Submitted</option>
                        <option value="Offer Received">Offer Received</option>
                        <option value="Fee Pending">Fee Pending</option>
                        <option value="Fee Paid">Fee Paid</option>
                        <option value="Admission Confirmed">Admission Confirmed 🎉</option>
                        <option value="Enrolled">Enrolled</option>
                        <option value="Lost">Lost</option>
                        <option value="Not Interested">Not Interested</option>
                      </select>
                    </td>

                    {/* Assigned Counselor */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[130px]">
                          {lead.assigned_counselor_name || 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {lead.lead_source}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800"
                          title="View Complete Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canDeleteLeads && (
                          <button
                            onClick={() => handleDelete(lead.id, lead.student_name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                            title="Soft Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{leads.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalLeads}</span> leads (Page {page} of {Math.max(1, totalPages)})
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={e => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onLeadCreated={() => fetchLeads()}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => fetchLeads()}
      />
    </div>
  );
};
