import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  CalendarCheck,
  AlertTriangle,
  GraduationCap,
  Award,
  CreditCard,
  TrendingUp,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowRight
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
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardKPIData } from '../types';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#2563EB', '#0284C7', '#38BDF8', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardKPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    counselorId: '',
    city: '',
    university: '',
    source: '',
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const kpis = await api.getDashboardKPIs(filters);
      setData(kpis);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCounselors().then(setCounselors).catch(() => {});
    api.getUniversities().then(setUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [filters]);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading Education Sansar Management Dashboard...</span>
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Welcome & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Admissions Management Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline analytics, counselor velocity &amp; recruitment ROI for Nepal and India markets
          </p>
        </div>

        {/* Global Filters */}
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
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Top KPI Row (Section 5 requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Leads */}
        <div
          onClick={() => navigate('/leads')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalLeads}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-600">+{kpis.newLeadsToday} Today</span>
            <span>·</span>
            <span>+{kpis.newLeadsThisWeek} This Wk</span>
          </div>
        </div>

        {/* Followups Today */}
        <div
          onClick={() => navigate('/followups')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Follow-ups Today</span>
            <CalendarCheck className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.followupsToday}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            {kpis.overdueFollowups > 0 ? (
              <span className="font-semibold text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {kpis.overdueFollowups} Overdue Follow-ups
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold">All follow-ups on track</span>
            )}
          </div>
        </div>

        {/* Applications */}
        <div
          onClick={() => navigate('/applications')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Applications</span>
            <GraduationCap className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.applicationsCount}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            Counseled → App: <span className="font-bold text-slate-800">{kpis.counselingToAppRate}%</span>
          </div>
        </div>

        {/* Admissions Confirmed */}
        <div
          onClick={() => navigate('/students')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Admissions Confirmed</span>
            <Award className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.admissionsCount}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            App → Admission: <span className="font-bold text-emerald-700">{kpis.appToAdmissionRate}%</span>
          </div>
        </div>

        {/* Conversion Rate & Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white shadow-md">
          <div className="flex items-center justify-between text-blue-200 text-xs font-semibold">
            <span>Overall Conversion</span>
            <TrendingUp className="w-4 h-4 text-blue-300" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{kpis.conversionRate}%</div>
          <div className="mt-2 text-[11px] text-blue-200 flex items-center justify-between">
            <span>Fee Collected:</span>
            <span className="font-bold text-emerald-300">₹{(kpis.feePaidTotal / 100000).toFixed(1)}L</span>
          </div>
        </div>
      </div>

      {/* 2. Lead Funnel & Conversion Formula Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Lead Conversion Funnel</h2>
            <p className="text-xs text-slate-500">Full lifecycle progression from Meta lead capture to enrolled student</p>
          </div>
          <div className="text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Lead → Contact ({kpis.leadToContactRate}%) → Counseling ({kpis.contactToCounselingRate}%) → App ({kpis.counselingToAppRate}%) → Enrolled ({kpis.appToAdmissionRate}%)
          </div>
        </div>

        {/* Funnel Progress Steps */}
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

      {/* 3. Charts Section */}
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
              <p className="text-[11px] text-slate-500">Meta Ads, Google, Referrals &amp; Walk-ins</p>
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

      {/* 4. Counselor Performance Matrix (Section 5 & 24) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Counselor Performance &amp; Admissions Matrix</h3>
            <p className="text-xs text-slate-500">Counselor efficiency across assigned leads, meetings, and final admissions</p>
          </div>
          <button
            onClick={() => navigate('/counselors')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>Manage Team</span>
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
  );
};
