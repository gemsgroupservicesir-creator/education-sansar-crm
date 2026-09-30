import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  MessageCircle,
  Eye,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { FollowUp } from '../types';
import { useNotifications } from '../context/NotificationContext';

export const FollowupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Complete outcome modal
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const data = await api.getFollowups({ view: activeTab });
      setFollowups(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [activeTab]);

  const handleMarkComplete = async () => {
    if (!completingId) return;
    try {
      await api.completeFollowup(completingId, outcomeNotes, 'Counselor / Staff');
      showToast('Follow-up marked as completed!', 'success');
      setCompletingId(null);
      setOutcomeNotes('');
      fetchFollowups();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            Follow-up Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Timely counselor touchpoints, call scheduling &amp; overdue escalation tracking
          </p>
        </div>

        <button
          onClick={fetchFollowups}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 self-start"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'today'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Today's Follow-ups</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-600 bg-white rounded-t-lg font-bold'
              : 'border-transparent text-slate-500 hover:text-rose-600'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Overdue Follow-ups</span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'upcoming'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarClock className="w-4 h-4 text-slate-500" />
          <span>Upcoming Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'completed'
              ? 'border-emerald-600 text-emerald-600 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Completed History</span>
        </button>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading follow-ups...</span>
          </div>
        ) : followups.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            {activeTab === 'today' && 'No follow-ups due today. Great job!'}
            {activeTab === 'overdue' && 'Zero overdue follow-ups! All leads up to date.'}
            {activeTab === 'upcoming' && 'No upcoming follow-ups scheduled.'}
            {activeTab === 'completed' && 'No completed follow-ups logged yet.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {followups.map(f => (
              <div
                key={f.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{f.lead_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {f.type}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {f.priority}
                    </span>
                    {f.status === 'Completed' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ✓ Completed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {f.status}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Course / Uni:</span> {f.preferred_course} at {f.preferred_university}
                  </div>

                  {f.notes && (
                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 max-w-2xl">
                      {f.notes}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                    <span>🗓️ Date: <span className="font-semibold text-slate-700">{f.follow_up_date} at {f.follow_up_time}</span></span>
                    <span>·</span>
                    <span>👤 Counselor: <span className="font-semibold text-slate-700">{f.counselor_name || 'Unassigned'}</span></span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {f.lead_phone && (
                    <>
                      <a
                        href={`tel:${f.lead_phone}`}
                        className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5"
                        title="Call Student"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${f.lead_phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">WhatsApp</span>
                      </a>
                    </>
                  )}

                  <button
                    onClick={() => navigate(`/leads/${f.lead_id}`)}
                    className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1"
                    title="View Student Profile"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {f.status !== 'Completed' && (
                    <button
                      onClick={() => setCompletingId(f.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Done</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Outcome Modal */}
      {completingId && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Record Follow-up Outcome</h3>
            <p className="text-xs text-slate-500">
              Provide a brief summary of student feedback or next scheduled milestone.
            </p>
            <textarea
              rows={3}
              value={outcomeNotes}
              onChange={e => setOutcomeNotes(e.target.value)}
              placeholder="e.g. Spoke with parents, student confirmed interest in B.Tech CSE SRM campus..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCompletingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkComplete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Save &amp; Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
