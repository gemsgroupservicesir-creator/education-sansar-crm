import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Flame,
  CalendarCheck,
  AlertTriangle,
  GraduationCap,
  Award,
  TrendingUp,
  Phone,
  MessageCircle,
  FileEdit,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Lead, Counselor, LeadStatus } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const MyLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { currentRole } = useAuth();

  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState<string>('c-1');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [activeLeadForAction, setActiveLeadForAction] = useState<Lead | null>(null);
  const [actionType, setActionType] = useState<'note' | 'followup' | null>(null);
  const [noteText, setNoteText] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('11:00');
  const [followupType, setFollowupType] = useState('Call');

  const loadCounselorData = async () => {
    setLoading(true);
    try {
      const counselorsList = await api.getCounselors();
      setCounselors(counselorsList);

      const targetCId = selectedCounselorId || counselorsList[0]?.id || 'c-1';
      setSelectedCounselorId(targetCId);

      const res = await api.getLeads({
        counselorId: targetCId,
        limit: 100,
      });
      setLeads(res.data);
    } catch (err: any) {
      showToast('Error loading counselor leads: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounselorData();
  }, [selectedCounselorId]);

  const currentCounselor = counselors.find(c => c.id === selectedCounselorId) || counselors[0];

  // Metrics (Section 10)
  const myNewLeads = leads.filter(l => l.lead_status === 'New Lead').length;
  const myHotLeads = leads.filter(l => l.lead_temperature === 'HOT').length;
  const myFollowupsToday = leads.filter(l => l.next_follow_up_date === new Date().toISOString().split('T')[0]).length;
  const myOverdueFollowups = leads.filter(l => l.next_follow_up_date && l.next_follow_up_date < new Date().toISOString().split('T')[0]).length;
  const myApplications = currentCounselor?.current_active_leads || 0;
  const myAdmissions = currentCounselor?.total_admissions || 0;
  const myConversionRate = currentCounselor?.conversion_rate || 0;

  const handleQuickNote = async () => {
    if (!activeLeadForAction || !noteText.trim()) return;
    try {
      await api.addLeadActivity(activeLeadForAction.id, {
        activity_type: 'Note',
        title: 'Counselor Note',
        description: noteText,
        performed_by: currentCounselor?.name || 'Counselor'
      });
      showToast('Note added to lead timeline', 'success');
      setNoteText('');
      setActionType(null);
      setActiveLeadForAction(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleQuickFollowup = async () => {
    if (!activeLeadForAction || !followupDate) return;
    try {
      await api.createFollowup({
        lead_id: activeLeadForAction.id,
        counselor_id: selectedCounselorId,
        follow_up_date: followupDate,
        follow_up_time: followupTime,
        type: followupType,
        priority: 'HIGH',
        notes: noteText || 'Scheduled via Counselor Workbench',
        performedBy: currentCounselor?.name || 'Counselor'
      });
      showToast('Follow-up scheduled successfully!', 'success');
      setNoteText('');
      setActionType(null);
      setActiveLeadForAction(null);
      loadCounselorData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (id: string, s: LeadStatus) => {
    try {
      await api.updateLead(id, { lead_status: s });
      showToast(`Status updated to ${s}`, 'success');
      loadCounselorData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header with Counselor Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Counselor Personal Dashboard
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Active Workspace
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Focused daily outreach workbench for {currentCounselor?.name || 'Counselor'}
          </p>
        </div>

        {/* Switch Counselor dropdown if Super Admin / Admin */}
        {['Super Admin', 'Admin', 'Management'].includes(currentRole) && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Viewing As:</span>
            <select
              value={selectedCounselorId}
              onChange={e => setSelectedCounselorId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {counselors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.specialization_country})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top Counselor Metrics (Section 10) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
          <div className="text-[11px] font-bold text-blue-800 uppercase">My New Leads</div>
          <div className="text-xl font-bold text-blue-900 mt-1">{myNewLeads}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
          <div className="text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>My Hot Leads</span>
          </div>
          <div className="text-xl font-bold text-rose-900 mt-1">{myHotLeads}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200">
          <div className="text-[11px] font-bold text-sky-800 uppercase">Follow-ups Today</div>
          <div className="text-xl font-bold text-sky-900 mt-1">{myFollowupsToday}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
          <div className="text-[11px] font-bold text-amber-800 uppercase">Overdue</div>
          <div className="text-xl font-bold text-amber-900 mt-1">{myOverdueFollowups}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
          <div className="text-[11px] font-bold text-indigo-800 uppercase">Active Leads</div>
          <div className="text-xl font-bold text-indigo-900 mt-1">{currentCounselor?.current_active_leads || 0}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">Admissions</div>
          <div className="text-xl font-bold text-emerald-900 mt-1">{myAdmissions}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
          <div className="text-[11px] font-bold text-purple-800 uppercase">Conversion</div>
          <div className="text-xl font-bold text-purple-900 mt-1">{myConversionRate}%</div>
        </div>
      </div>

      {/* Counselor Lead Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Assigned Student Leads</h2>
            <p className="text-xs text-slate-500">Quick outreach buttons for telephone, WhatsApp and status advancement</p>
          </div>
          <button onClick={loadCounselorData} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading student queue...</div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No leads assigned to this counselor yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Phone / WhatsApp</th>
                  <th className="py-3 px-4 font-semibold">Course &amp; University</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Temp</th>
                  <th className="py-3 px-4 font-semibold">Last Contact</th>
                  <th className="py-3 px-4 font-semibold">Next Follow-up</th>
                  <th className="py-3 px-4 font-semibold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{lead.student_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{lead.lead_id} · {lead.city}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-900">{lead.phone}</div>
                      <div className="text-[10px] text-slate-400">WA: {lead.whatsapp_number}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-medium text-slate-900 truncate">{lead.preferred_course}</div>
                      <div className="text-[11px] text-slate-500 truncate">{lead.preferred_university}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={lead.lead_status}
                        onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white"
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
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lead.lead_temperature === 'HOT'
                          ? 'bg-rose-100 text-rose-800'
                          : lead.lead_temperature === 'WARM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {lead.lead_temperature}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {lead.last_contact_date || 'Never'}
                    </td>

                    <td className="py-3.5 px-4">
                      {lead.next_follow_up_date ? (
                        <span className="font-medium text-blue-700">{lead.next_follow_up_date}</span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    {/* Quick actions (Call, WhatsApp, Note, Follow-up, View Profile) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`tel:${lead.phone}`}
                          title="Call Student"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={`https://wa.me/${lead.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Send WhatsApp Message"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => {
                            setActiveLeadForAction(lead);
                            setActionType('note');
                          }}
                          title="Add Note"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveLeadForAction(lead);
                            setActionType('followup');
                          }}
                          title="Schedule Follow-up"
                          className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          title="View Complete Profile"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Modal (Note or Followup) */}
      {actionType && activeLeadForAction && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {actionType === 'note' ? 'Add Counselor Call Note' : 'Schedule Student Follow-up'}
              </h3>
              <button onClick={() => setActionType(null)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
              Student: <span className="font-bold text-slate-800">{activeLeadForAction.student_name}</span> ({activeLeadForAction.phone})
            </div>

            {actionType === 'followup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={followupDate}
                    onChange={e => setFollowupDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={followupTime}
                    onChange={e => setFollowupTime(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={followupType}
                    onChange={e => setFollowupType(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Meeting">In-Person Meeting / Zoom</option>
                    <option value="Document Follow-up">Document Follow-up</option>
                    <option value="Fee Follow-up">Fee Payment Follow-up</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {actionType === 'note' ? 'Note Content' : 'Follow-up Objectives / Agenda'}
              </label>
              <textarea
                rows={3}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Details of student interaction or discussion points..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActionType(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'note' ? handleQuickNote : handleQuickFollowup}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
