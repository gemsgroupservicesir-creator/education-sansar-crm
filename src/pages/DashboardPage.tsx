import React, { useState, useEffect } from 'react';
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  GraduationCap,
  Award,
  TrendingUp,
  Filter,
  RefreshCw,
  ArrowRight,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building2,
  BookOpen,
  Check,
  Flame,
  Sun,
  Snowflake,
  ChevronRight,
  X,
  UserCheck,
  Landmark
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { api } from '../services/api';
import { DashboardKPIData, FollowUp, Lead } from '../types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const COLORS = ['#2563EB', '#0284C7', '#38BDF8', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentRole } = useAuth();
  const { showToast } = useNotifications();

  const isCounselor = currentRole === 'Counselor';

  const [data, setData] = useState<DashboardKPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);

  // Counselor specific states
  const [counselorFollowups, setCounselorFollowups] = useState<FollowUp[]>([]);
  const [counselorRecentLeads, setCounselorRecentLeads] = useState<Lead[]>([]);
  const [counselorLoading, setCounselorLoading] = useState(false);
  const [fupFilter, setFupFilter] = useState<'all' | 'overdue' | 'today'>('all');

  // Complete Followup Modal
  const [completeModalFup, setCompleteModalFup] = useState<FollowUp | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  // Admin Filters
  const [filters, setFilters] = useState({
    counselorId: '',
    city: '',
    university: '',
    source: '',
  });

  // Find active counselor ID
  const activeCounselor = counselors.find(
    c => c.email?.toLowerCase() === user?.email?.toLowerCase() ||
         c.name?.toLowerCase() === user?.name?.toLowerCase() ||
         c.user_id === user?.id
  );
  const effectiveCounselorId = isCounselor ? (activeCounselor?.id || '') : filters.counselorId;

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const activeFilters = {
        ...filters,
        counselorId: effectiveCounselorId,
      };
      const kpis = await api.getDashboardKPIs(activeFilters);
      setData(kpis);
    } catch (e: any) {
      console.error(e);
      showToast('Error loading dashboard metrics: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCounselorData = async () => {
    if (!isCounselor && !filters.counselorId) return;
    setCounselorLoading(true);
    try {
      const cId = effectiveCounselorId;
      const [todayFups, overdueFups, leads] = await Promise.all([
        api.getFollowups({ counselorId: cId, view: 'today' }),
        api.getFollowups({ counselorId: cId, view: 'overdue' }),
        api.getLeads({ counselorId: cId, limit: 15 }),
      ]);
      // Deduplicate follow-ups
      const fupMap = new Map<string, FollowUp>();
      [...overdueFups, ...todayFups].forEach((f: FollowUp) => fupMap.set(f.id, f));
      setCounselorFollowups(Array.from(fupMap.values()));
      setCounselorRecentLeads(leads || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setCounselorLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.getCounselors().then(setCounselors).catch(() => {}),
      api.getUniversities().then(setUniversities).catch(() => {})
    ]);
  }, []);

  useEffect(() => {
    loadDashboard();
    if (isCounselor || filters.counselorId) {
      loadCounselorData();
    }
  }, [filters, effectiveCounselorId, isCounselor]);

  const handleCompleteFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalFup) return;
    setCompleting(true);
    try {
      await api.completeFollowup(
        completeModalFup.id,
        completeNotes || 'Completed from Counselor Dashboard',
        user?.name || 'Counselor'
      );
      showToast('Follow-up marked as completed!', 'success');
      setCompleteModalFup(null);
      setCompleteNotes('');
      loadCounselorData();
      loadDashboard();
    } catch (err: any) {
      showToast('Failed to complete follow-up: ' + err.message, 'error');
    } finally {
      setCompleting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading Admission CRM Workspace...</span>
        </div>
      </div>
    );
  }

  const kpis = data || {
    totalLeads: 0,
    newLeadsToday: 0,
    newLeadsThisWeek: 0,
    newLeadsThisMonth: 0,
    followupsToday: 0,
    overdueFollowups: 0,
    applicationsCount: 0,
    admissionsCount: 0,
    feePaidTotal: 0,
    conversionRate: 0,
    leadToContactRate: 0,
    contactToCounselingRate: 0,
    counselingToAppRate: 0,
    appToAdmissionRate: 0,
    funnelStages: [],
    leadsByDay: [],
    leadsBySource: [],
    leadsByCity: [],
    leadsByUniversity: [],
    leadsByCourse: [],
    counselorPerformance: []
  };

  // Filtered followups for counselor quick action list
  const filteredCounselorFups = counselorFollowups.filter(f => {
    const isOverdue = new Date(f.follow_up_date) < new Date(new Date().toISOString().split('T')[0]);
    if (fupFilter === 'overdue') return isOverdue;
    if (fupFilter === 'today') return !isOverdue;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & WORKSPACE BANNER */}
      {/* ============================================================== */}
      {isCounselor ? (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Counselor Desk
              </span>
              <span className="text-xs text-blue-200">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Welcome back, {user?.name || 'Counselor'} 👋
            </h1>
            <p className="text-xs text-blue-200/80">
              Your active student pipeline, scheduled calls &amp; admissions velocity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate('/university-fees')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>University &amp; Fee Finder</span>
            </button>
            <button
              onClick={() => navigate('/leads')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>All My Leads</span>
            </button>
            <button
              onClick={() => {
                loadDashboard();
                loadCounselorData();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                Admin Center
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Admissions Management Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Global lead pipeline analytics, counselor velocity &amp; university recruitment ROI
            </p>
          </div>

          {/* Admin Global Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filters.counselorId}
                onChange={e => setFilters({ ...filters, counselorId: e.target.value })}
                className="bg-transparent font-medium focus:outline-none"
              >
                <option value="">All Counselors</option>
                {counselors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <select
                value={filters.city}
                onChange={e => setFilters({ ...filters, city: e.target.value })}
                className="bg-transparent font-medium focus:outline-none"
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
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
              <select
                value={filters.source}
                onChange={e => setFilters({ ...filters, source: e.target.value })}
                className="bg-transparent font-medium focus:outline-none"
              >
                <option value="">All Lead Sources</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Google">Google</option>
                <option value="Instagram">Instagram</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Walk-in">Walk-in</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>

            {(filters.counselorId || filters.city || filters.source) && (
              <button
                onClick={() => setFilters({ counselorId: '', city: '', university: '', source: '' })}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Reset
              </button>
            )}

            <button
              onClick={loadDashboard}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Refresh statistics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. KPI CARDS ROW */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: My Leads / Total Leads */}
        <div
          onClick={() => navigate('/leads')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isCounselor ? 'My Leads' : 'Total Leads'}</span>
            <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalLeads}</div>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-600">+{kpis.newLeadsToday} Today</span>
            <span>·</span>
            <span>+{kpis.newLeadsThisWeek} Wk</span>
          </div>
        </div>

        {/* KPI 2: Today's Assigned Leads */}
        <div
          onClick={() => navigate('/leads')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{isCounselor ? "Today's Assigned" : "Today's Leads"}</span>
            <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.newLeadsToday}</div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {kpis.newLeadsThisMonth} this month
          </div>
        </div>

        {/* KPI 3: Follow-ups Today */}
        <div
          onClick={() => navigate('/followups')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Follow-ups Today</span>
            <CalendarCheck className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.followupsToday}</div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            Scheduled for today
          </div>
        </div>

        {/* KPI 4: Overdue Follow-ups */}
        <div
          onClick={() => navigate('/followups')}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer group ${
            kpis.overdueFollowups > 0
              ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400 hover:shadow-md'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={kpis.overdueFollowups > 0 ? 'text-rose-700' : 'text-slate-500'}>
              Overdue Calls
            </span>
            <AlertTriangle className={`w-4 h-4 ${kpis.overdueFollowups > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 ${kpis.overdueFollowups > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {kpis.overdueFollowups}
          </div>
          <div className="mt-2 text-[11px]">
            {kpis.overdueFollowups > 0 ? (
              <span className="font-bold text-rose-600">Immediate action needed</span>
            ) : (
              <span className="text-emerald-600 font-semibold">Zero backlog</span>
            )}
          </div>
        </div>

        {/* KPI 5: Applications Started */}
        <div
          onClick={() => navigate('/applications')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Applications</span>
            <GraduationCap className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.applicationsCount}</div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            Conversion: <strong className="text-slate-800">{kpis.counselingToAppRate}%</strong>
          </div>
        </div>

        {/* KPI 6: Admissions Confirmed */}
        <div
          onClick={() => navigate('/students')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Admissions</span>
            <Award className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{kpis.admissionsCount}</div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            Rate: <strong className="text-emerald-700">{kpis.conversionRate}%</strong>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. COUNSELOR VIEW: PRIORITY ACTIONS & QUICK ACTION LIST */}
      {/* ============================================================== */}
      {isCounselor && (
        <div className="space-y-6">
          {/* Section: Priority Follow-ups Needing Action Today */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  Quick Action List: Leads Needing Follow-up Today &amp; Overdue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Call or WhatsApp prospective students scheduled for today's counseling shift
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setFupFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    fupFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  All ({counselorFollowups.length})
                </button>
                <button
                  onClick={() => setFupFilter('overdue')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    fupFilter === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Overdue ({counselorFollowups.filter(f => new Date(f.follow_up_date) < new Date(new Date().toISOString().split('T')[0])).length})
                </button>
                <button
                  onClick={() => setFupFilter('today')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    fupFilter === 'today' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  Today ({counselorFollowups.filter(f => new Date(f.follow_up_date) >= new Date(new Date().toISOString().split('T')[0])).length})
                </button>
              </div>
            </div>

            {counselorLoading ? (
              <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading your follow-up queue...</span>
              </div>
            ) : filteredCounselorFups.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">All follow-ups completed for now!</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Great job staying on top of your student pipeline. You have no overdue or pending follow-ups in this filter.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredCounselorFups.map((fup) => {
                  const isOverdue = new Date(fup.follow_up_date) < new Date(new Date().toISOString().split('T')[0]);

                  return (
                    <div
                      key={fup.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                            }`}
                          >
                            {isOverdue ? 'Overdue' : 'Today'} · {fup.follow_up_time || 'Anytime'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {fup.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {fup.lead_name || 'Prospective Student'}
                          </h4>
                          {fup.lead_phone && (
                            <span className="text-xs text-slate-500 font-mono">
                              ({fup.lead_phone})
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                          {fup.preferred_course && (
                            <span className="font-semibold text-blue-700 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {fup.preferred_course}
                            </span>
                          )}
                          {fup.preferred_university && (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Landmark className="w-3 h-3" />
                              {fup.preferred_university}
                            </span>
                          )}
                        </div>

                        {fup.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100 max-w-xl">
                            "{fup.notes}"
                          </p>
                        )}
                      </div>

                      {/* Fast Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {fup.lead_phone && (
                          <a
                            href={`tel:${fup.lead_phone}`}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}

                        {fup.lead_phone && (
                          <a
                            href={`https://wa.me/${fup.lead_phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <button
                          onClick={() => navigate(`/leads/${fup.lead_id}`)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold border border-purple-200 flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Counsel &amp; Match</span>
                        </button>

                        <button
                          onClick={() => {
                            setCompleteModalFup(fup);
                            setCompleteNotes('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: My Recently Assigned Leads */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  My Active Assigned Student Pipeline
                </h3>
                <p className="text-xs text-slate-500">
                  Recent student leads assigned to you with status and qualification readiness
                </p>
              </div>

              <button
                onClick={() => navigate('/leads')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View All In Table</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Temp</th>
                    <th className="py-3 px-4 font-semibold">Target Course &amp; University</th>
                    <th className="py-3 px-4 font-semibold">City</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {counselorRecentLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No assigned leads found.
                      </td>
                    </tr>
                  ) : (
                    counselorRecentLeads.slice(0, 10).map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{l.student_name}</span>
                            {l.priority === 'HIGH' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                                HIGH
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 font-normal">
                            {l.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
                            {l.lead_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {l.lead_temperature === 'HOT' ? (
                            <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                              <Flame className="w-3.5 h-3.5" /> HOT
                            </span>
                          ) : l.lead_temperature === 'WARM' ? (
                            <span className="text-amber-600 font-bold flex items-center gap-1 text-[11px]">
                              <Sun className="w-3.5 h-3.5" /> WARM
                            </span>
                          ) : (
                            <span className="text-blue-500 font-bold flex items-center gap-1 text-[11px]">
                              <Snowflake className="w-3.5 h-3.5" /> COLD
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{l.preferred_course}</div>
                          <div className="text-[11px] text-slate-500">{l.preferred_university}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {l.city || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => navigate(`/leads/${l.id}`)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                          >
                            Open Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. ADMIN VIEW: FUNNEL, CHARTS & TEAM PERFORMANCE MATRIX */}
      {/* ============================================================== */}
      {!isCounselor && (
        <div className="space-y-6">
          {/* Funnel Progress Steps */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Lead Conversion Funnel</h2>
                <p className="text-xs text-slate-500">
                  Full lifecycle progression from Meta / Sheets lead capture to enrolled student
                </p>
              </div>
              <div className="text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Lead → Contact ({kpis.leadToContactRate}%) → Counseling ({kpis.contactToCounselingRate}%) → App ({kpis.counselingToAppRate}%) → Enrolled ({kpis.appToAdmissionRate}%)
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {kpis.funnelStages.map((stage, idx) => (
                <div
                  key={stage.stage}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400 truncate">
                    {idx + 1}. {stage.stage}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-1">{stage.count}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Est. ₹{(stage.value / 100000).toFixed(1)}L
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Area Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Leads Inflow Trend</h3>
                  <p className="text-[11px] text-slate-500">Daily lead capture volume across campaigns</p>
                </div>
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Live Flow
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpis.leadsByDay}>
                    <defs>
                      <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="leads" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#leadGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead Sources Distribution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Leads by Marketing Channel</h3>
                  <p className="text-[11px] text-slate-500">Meta Ads, Google, Referrals, Sheets &amp; Walk-ins</p>
                </div>
              </div>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kpis.leadsBySource}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ source, percent }) => `${source} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {kpis.leadsBySource.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leads by Target City (Nepal & India) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Target City Volume (Nepal &amp; India)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kathmandu, Biratnagar, Birgunj, Janakpur, Butwal, Delhi, Bangalore, Noida, Pune
                </p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpis.leadsByCity} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                    <YAxis type="category" dataKey="city" tick={{ fontSize: 10 }} stroke="#64748B" width={80} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#0284C7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leads by University */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Top University Preferences</h3>
                <p className="text-[11px] text-slate-500">SRM, VIT, Jain, Symbiosis, NMIMS, Chandigarh Uni</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpis.leadsByUniversity}>
                    <XAxis dataKey="university" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} stroke="#94A3B8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Counselor Performance Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Counselor Performance &amp; Admissions Matrix</h3>
                <p className="text-xs text-slate-500">
                  Counselor velocity across assigned leads, meetings, applications and final admissions
                </p>
              </div>
              <button
                onClick={() => navigate('/counselors')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <span>Manage Counselors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Counselor</th>
                    <th className="py-3 px-4 font-semibold">Assigned</th>
                    <th className="py-3 px-4 font-semibold">Contacted</th>
                    <th className="py-3 px-4 font-semibold">Counseled</th>
                    <th className="py-3 px-4 font-semibold">Applications</th>
                    <th className="py-3 px-4 font-semibold">Admissions</th>
                    <th className="py-3 px-4 font-semibold text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {kpis.counselorPerformance.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                          {c.counselor_name.charAt(0)}
                        </div>
                        <span>{c.counselor_name}</span>
                      </td>
                      <td className="py-3 px-4 font-medium">{c.assigned}</td>
                      <td className="py-3 px-4 text-slate-600">{c.contacted}</td>
                      <td className="py-3 px-4 text-slate-600">{c.counseled}</td>
                      <td className="py-3 px-4 font-semibold text-indigo-700">{c.applications}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{c.admissions}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-100">
                          {c.conversion_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: COMPLETE FOLLOW-UP WITH OUTCOME NOTES */}
      {/* ============================================================== */}
      {completeModalFup && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form
            onSubmit={handleCompleteFollowup}
            className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Complete Follow-up: {completeModalFup.lead_name}
                </h3>
                <p className="text-xs text-slate-500">Record interaction outcome before closing this task</p>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModalFup(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Outcome Notes / Discussion Summary
              </label>
              <textarea
                required
                rows={3}
                value={completeNotes}
                onChange={e => setCompleteNotes(e.target.value)}
                placeholder="Spoke with student, explained SRM fee structure, scheduled visit next Tuesday..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompleteModalFup(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={completing}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                {completing ? 'Saving...' : 'Mark as Completed'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
