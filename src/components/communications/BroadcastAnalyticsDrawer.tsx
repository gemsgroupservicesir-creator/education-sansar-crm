import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Eye,
  MessageSquare,
  ShieldAlert,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Smartphone,
  Mail,
  Send,
  Clock,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { BroadcastCampaign, BroadcastRecipient } from '../../types';

interface BroadcastAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: BroadcastCampaign | null;
  onRefreshCampaign?: () => void;
}

export const BroadcastAnalyticsDrawer: React.FC<BroadcastAnalyticsDrawerProps> = ({
  isOpen,
  onClose,
  campaign,
  onRefreshCampaign
}) => {
  const { addToast } = useNotifications();
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [simulating, setSimulating] = useState(false);

  const fetchRecipients = async () => {
    if (!campaign?.id) return;
    setLoading(true);
    try {
      const res = await api.getBroadcastRecipients(campaign.id, {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchTerm || undefined,
        limit: 100
      });
      setRecipients(res.recipients);
      setTotalRecipients(res.total);
    } catch (err: any) {
      console.warn('Failed to fetch recipients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && campaign?.id) {
      fetchRecipients();
    }
  }, [isOpen, campaign?.id, statusFilter, searchTerm]);

  if (!isOpen || !campaign) return null;

  const handleSimulate = async (recipientId: string, action: 'open' | 'reply' | 'opt_out') => {
    setSimulating(true);
    try {
      await api.simulateBroadcastRecipientAction(campaign.id, recipientId, action);
      addToast(`Simulated ${action} action successfully!`, 'success');
      fetchRecipients();
      if (onRefreshCampaign) onRefreshCampaign();
    } catch (err: any) {
      addToast(err.message || 'Simulation failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const deliveryRate = campaign.sent_count > 0 ? Math.round((campaign.delivered_count / campaign.sent_count) * 100) : 0;
  const openRate = campaign.delivered_count > 0 ? Math.round((campaign.opened_count / campaign.delivered_count) * 100) : 0;
  const replyRate = campaign.delivered_count > 0 ? Math.round((campaign.replied_count / campaign.delivered_count) * 100) : 0;
  const optOutRate = campaign.delivered_count > 0 ? Math.round((campaign.opt_out_count / campaign.delivered_count) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  campaign.channel === 'WhatsApp'
                    ? 'bg-emerald-100 text-emerald-800'
                    : campaign.channel === 'Email'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {campaign.channel} Broadcast
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  campaign.status === 'COMPLETED'
                    ? 'bg-teal-100 text-teal-800'
                    : campaign.status === 'SENDING'
                    ? 'bg-blue-100 text-blue-800'
                    : campaign.status === 'SCHEDULED'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {campaign.status}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900">{campaign.name}</h2>
            <div className="text-xs text-slate-500">
              Dispatched by <span className="font-semibold text-slate-700">{campaign.created_by}</span> on{' '}
              {campaign.executed_at ? new Date(campaign.executed_at).toLocaleString() : 'Pending Execution'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Performance KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-blue-700 uppercase">
                <span>Delivered</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-950">
                {campaign.delivered_count} <span className="text-xs text-blue-700 font-bold">({deliveryRate}%)</span>
              </div>
              <div className="text-[11px] text-blue-600">of {campaign.total_targeted} targeted</div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-700 uppercase">
                <span>Opened</span>
                <Eye className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-950">
                {campaign.opened_count} <span className="text-xs text-indigo-700 font-bold">({openRate}%)</span>
              </div>
              <div className="text-[11px] text-indigo-600">via 1x1 pixel tracking</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase">
                <span>Replied / Click</span>
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-950">
                {campaign.replied_count} <span className="text-xs text-emerald-700 font-bold">({replyRate}%)</span>
              </div>
              <div className="text-[11px] text-emerald-600">active engagement</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase">
                <span>Opt-Outs</span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-950">
                {campaign.opt_out_count} <span className="text-xs text-amber-700 font-bold">({optOutRate}%)</span>
              </div>
              <div className="text-[11px] text-amber-600">unsubscribed</div>
            </div>
          </div>

          {/* Lead Attribution & Conversion ROI Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>Campaign Lead Attribution &amp; Conversion Value</span>
              </div>
              <div className="text-3xl font-black">
                NPR {campaign.conversions_revenue?.toLocaleString() || '0'}
              </div>
              <div className="text-xs text-emerald-100">
                Directly attributed from {campaign.conversions_count || 0} student admission enrollments
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                Auto-Attributed to this Campaign
              </div>
            </div>
          </div>

          {/* Recipient Drilldown Table */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Per-Recipient Delivery Log</h3>
                <span className="text-xs text-slate-500 font-medium">({totalRecipients} total logs)</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search student or phone..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="OPENED">Opened</option>
                  <option value="REPLIED">Replied</option>
                  <option value="OPTED_OUT">Opted Out</option>
                  <option value="FAILED">Failed</option>
                </select>

                <button
                  onClick={fetchRecipients}
                  className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recipient Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Channel &amp; Address</th>
                    <th className="px-4 py-3">Delivery Status</th>
                    <th className="px-4 py-3">Engagement Timestamps</th>
                    <th className="px-4 py-3 text-right">Testing Simulation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recipients.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{r.recipient_name}</div>
                        {r.is_converted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5">
                            ★ Enrolled Student (NPR {r.conversion_revenue?.toLocaleString()})
                          </span>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          {r.channel === 'WhatsApp' ? (
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{r.address}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            r.status === 'OPENED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : r.status === 'REPLIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'OPTED_OUT'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[11px] space-y-0.5">
                        {r.sent_at && <div>Sent: {new Date(r.sent_at).toLocaleTimeString()}</div>}
                        {r.opened_at && (
                          <div className="text-indigo-600 font-medium">
                            Opened: {new Date(r.opened_at).toLocaleTimeString()}
                          </div>
                        )}
                        {r.replied_at && (
                          <div className="text-emerald-600 font-medium">
                            Replied: {new Date(r.replied_at).toLocaleTimeString()}
                          </div>
                        )}
                        {r.opted_out_at && (
                          <div className="text-amber-700 font-medium">
                            Unsubscribed: {new Date(r.opted_out_at).toLocaleTimeString()}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={simulating || Boolean(r.opened_at)}
                            onClick={() => handleSimulate(r.id, 'open')}
                            className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold transition-all disabled:opacity-40"
                            title="Simulate student opening email pixel"
                          >
                            Simulate Open
                          </button>
                          <button
                            disabled={simulating || Boolean(r.replied_at)}
                            onClick={() => handleSimulate(r.id, 'reply')}
                            className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition-all disabled:opacity-40"
                            title="Simulate student replying or clicking"
                          >
                            Simulate Reply
                          </button>
                          <button
                            disabled={simulating || r.status === 'OPTED_OUT'}
                            onClick={() => handleSimulate(r.id, 'opt_out')}
                            className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-bold transition-all disabled:opacity-40"
                            title="Simulate student clicking unsubscribe"
                          >
                            Simulate Opt-out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recipients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                        {loading ? 'Loading recipients...' : 'No recipient records found for this filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
