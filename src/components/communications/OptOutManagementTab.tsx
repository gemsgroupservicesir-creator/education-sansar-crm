import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Mail,
  Smartphone,
  CheckCircle2,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { LeadOptOut } from '../../types';

export const OptOutManagementTab: React.FC = () => {
  const { addToast } = useNotifications();
  const [optOuts, setOptOuts] = useState<LeadOptOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [resubscribingId, setResubscribingId] = useState<string | null>(null);

  const fetchOptOuts = async () => {
    setLoading(true);
    try {
      const data = await api.getOptOuts();
      setOptOuts(data);
    } catch (err: any) {
      console.warn('Failed to fetch opt-outs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptOuts();
  }, []);

  const handleResubscribe = async (item: LeadOptOut) => {
    if (!item.lead_id) {
      addToast('Cannot resubscribe record without associated lead ID', 'error');
      return;
    }

    setResubscribingId(item.id);
    try {
      await api.resubscribeLead(item.lead_id, item.channel);
      addToast(`Lead successfully resubscribed to ${item.channel} updates!`, 'success');
      fetchOptOuts();
    } catch (err: any) {
      addToast(err.message || 'Resubscription failed', 'error');
    } finally {
      setResubscribingId(null);
    }
  };

  const filteredOptOuts = optOuts.filter(o => {
    if (channelFilter !== 'ALL' && o.channel !== channelFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = o.student_name?.toLowerCase().includes(term);
      const matchIdent = o.identifier?.toLowerCase().includes(term);
      const matchPhone = o.phone?.toLowerCase().includes(term);
      const matchEmail = o.email?.toLowerCase().includes(term);
      const matchCamp = o.campaign_name?.toLowerCase().includes(term);
      return matchName || matchIdent || matchPhone || matchEmail || matchCamp;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Compliance &amp; Channel Opt-Out Registry</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              All students listed below have requested to opt out from mass broadcasts (via email unsubscribe links or
              WhatsApp STOP replies). Our broadcast delivery engine <strong>automatically excludes</strong> these leads
              from matching campaigns to ensure 100% CAN-SPAM and WhatsApp anti-spam compliance.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-bold text-amber-900">Total Opted Out</div>
          <div className="text-2xl font-black text-amber-950 mt-0.5">{optOuts.length}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Channel Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setChannelFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                channelFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Channels ({optOuts.length})
            </button>
            <button
              onClick={() => setChannelFilter('Email')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                channelFilter === 'Email' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Email ({optOuts.filter(o => o.channel === 'Email').length})
            </button>
            <button
              onClick={() => setChannelFilter('WhatsApp')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                channelFilter === 'WhatsApp' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              WhatsApp ({optOuts.filter(o => o.channel === 'WhatsApp').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search student or phone..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={fetchOptOuts}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Opt-Outs Table */}
      <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">Student Name</th>
              <th className="px-5 py-3">Channel</th>
              <th className="px-5 py-3">Unsubscribed Contact</th>
              <th className="px-5 py-3">Opt-Out Reason &amp; Source</th>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOptOuts.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/80">
                <td className="px-5 py-3.5">
                  <div className="font-bold text-slate-900">{item.student_name || 'Unassigned / Direct'}</div>
                  <div className="text-[11px] text-slate-500">{item.preferred_course || item.preferred_university || 'Admissions Lead'}</div>
                </td>

                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      item.channel === 'WhatsApp'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.channel === 'WhatsApp' ? <Smartphone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                    {item.channel}
                  </span>
                </td>

                <td className="px-5 py-3.5 font-mono text-[11px] text-slate-700">
                  {item.identifier}
                </td>

                <td className="px-5 py-3.5 text-slate-600">
                  <div className="font-medium text-slate-800">{item.reason || 'Requested Unsubscribe'}</div>
                  {item.campaign_name && (
                    <div className="text-[10px] text-slate-400">Triggered from: {item.campaign_name}</div>
                  )}
                </td>

                <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                  {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>

                <td className="px-5 py-3.5 text-right">
                  {item.lead_id ? (
                    <button
                      disabled={resubscribingId === item.id}
                      onClick={() => handleResubscribe(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Resubscribe</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No Lead Profile</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredOptOuts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-medium">
                  {loading ? 'Loading opt-out registry...' : 'No opted-out leads found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
