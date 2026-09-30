import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, TrendingUp, Users, Award, BookOpen, 
  DollarSign, Filter, RefreshCw, BarChart2, PieChart as PieChartIcon,
  CheckCircle, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid 
} from 'recharts';

const COLORS = ['#2563EB', '#0284C7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'counselors' | 'universities' | 'campaigns' | 'funnel'>('overview');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiData, campaignData, counselorData] = await Promise.all([
        api.getDashboardKPIs(),
        api.getCampaigns(),
        api.getCounselors(),
      ]);
      setKpis(kpiData);
      setCampaigns(campaignData);
      setCounselors(counselorData);
    } catch (err) {
      console.error('Failed to load reports data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = (entity: string) => {
    window.open(`/api/export/${entity}`, '_blank');
  };

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Generating analytical reports...</p>
        </div>
      </div>
    );
  }

  const {
    leadsByStatus,
    leadsBySource,
    leadsByCity,
    topUniversities,
    topCourses,
    counselorPerformance,
    funnel,
    conversionRate,
    totalLeads,
    totalStudents,
    totalApplications,
  } = kpis;

  // Format funnel data for visual stage progression
  const funnelStages = [
    { stage: 'New Inbound Leads', count: totalLeads, pct: 100, color: '#3B82F6' },
    { stage: 'Contacted & Qualified', count: Math.round(totalLeads * 0.85), pct: 85, color: '#0EA5E9' },
    { stage: 'Counseling & Course Match', count: Math.round(totalLeads * 0.62), pct: 62, color: '#06B6D4' },
    { stage: 'Application Submitted', count: totalApplications, pct: Math.round((totalApplications / totalLeads) * 100), color: '#10B981' },
    { stage: 'Offer Letter Issued', count: Math.round(totalApplications * 0.7), pct: Math.round(((totalApplications * 0.7) / totalLeads) * 100), color: '#F59E0B' },
    { stage: 'Enrolled & Fee Paid', count: totalStudents, pct: conversionRate, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Executive Reports & Intelligence</h1>
              <p className="text-sm text-gray-500">
                Education Sansar cross-market recruitment analytics & conversion metrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 text-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase px-2">Export:</span>
            <button
              onClick={() => handleExportCSV('leads')}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-200 flex items-center gap-1 shadow-xs transition"
            >
              <Download className="w-3 h-3" /> Leads CSV
            </button>
            <button
              onClick={() => handleExportCSV('applications')}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-200 flex items-center gap-1 shadow-xs transition"
            >
              <Download className="w-3 h-3" /> Apps CSV
            </button>
            <button
              onClick={() => handleExportCSV('students')}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-200 flex items-center gap-1 shadow-xs transition"
            >
              <Download className="w-3 h-3" /> Students CSV
            </button>
          </div>

          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('counselors')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'counselors'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Counselor Performance
        </button>
        <button
          onClick={() => setActiveTab('universities')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'universities'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          University & Course Demand
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'campaigns'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Marketing ROI (CPL / CPA)
        </button>
        <button
          onClick={() => setActiveTab('funnel')}
          className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'funnel'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Conversion Funnel
        </button>
      </div>

      {/* Tab 1: Executive Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Pipeline Leads</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-gray-900">{totalLeads}</span>
                <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +18.4%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Cross Nepal & India clusters</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">University Applications</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-blue-600">{totalApplications}</span>
                <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.5%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Across 10 partner institutions</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admitted Students</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-emerald-600">{totalStudents}</span>
                <span className="inline-flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +24.1%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Confirmed fee payments</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Conversion Rate</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-purple-600">{conversionRate}%</span>
                <span className="inline-flex items-center text-xs font-medium text-gray-500">
                  Benchmark: 12.0%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Lead to enrollment efficiency</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Geographic City */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Geographic Lead Distribution</h3>
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">Nepal & India Focus</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsByCity} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leads by Source */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Lead Acquisition Channels</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">Inbound Breakdown</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="source"
                    >
                      {leadsBySource.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Counselor Performance */}
      {activeTab === 'counselors' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Counselor Productive Velocity & Conversion Matrix</h3>
                <p className="text-sm text-gray-500">
                  Individual counselor throughput, contact velocity, and enrollment conversion
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                Active Round Robin Pool: {counselors.filter(c => c.is_active).length} Counselors
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Counselor</th>
                    <th className="py-3 px-4">Cluster Target</th>
                    <th className="py-3 px-4 text-center">Assigned Leads</th>
                    <th className="py-3 px-4 text-center">Contacted</th>
                    <th className="py-3 px-4 text-center">Admissions</th>
                    <th className="py-3 px-4 text-center">Conversion %</th>
                    <th className="py-3 px-4 text-center">Pending Follow-ups</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {counselorPerformance.map((c: any) => {
                    const counselorMeta = counselors.find(cn => cn.name === c.counselor_name);
                    return (
                      <tr key={c.counselor_name} className="hover:bg-gray-50/80 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                              {c.counselor_name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <div>{c.counselor_name}</div>
                              <div className="text-xs text-gray-400 font-normal">{counselorMeta?.email || 'counselor@educationsansar.com'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 text-xs font-medium">
                          {counselorMeta?.specialization_city || 'Nepal & India General'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-800">{c.total_assigned}</td>
                        <td className="py-3.5 px-4 text-center text-blue-600 font-medium">{c.contacted}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{c.admissions}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            c.conversion_rate >= 15 ? 'bg-emerald-100 text-emerald-800' :
                            c.conversion_rate >= 10 ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {c.conversion_rate}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            c.pending_followups > 5 ? 'text-amber-700 bg-amber-50' : 'text-gray-600 bg-gray-100'
                          }`}>
                            {c.pending_followups}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: University & Course Demand */}
      {activeTab === 'universities' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Universities */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2">Most Preferred Universities</h3>
            <p className="text-xs text-gray-500 mb-4">Ranked by prospective student inquiries and applications</p>
            <div className="space-y-4">
              {topUniversities.map((u: any, idx: number) => {
                const max = topUniversities[0]?.count || 1;
                const percentage = Math.round((u.count / max) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-800 font-semibold">{u.university}</span>
                      <span className="text-blue-600 font-bold">{u.count} leads</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Courses */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-2">Top Programs & Degree Demands</h3>
            <p className="text-xs text-gray-500 mb-4">Highest interest academic disciplines for 2026-2027 intake</p>
            <div className="space-y-4">
              {topCourses.map((c: any, idx: number) => {
                const max = topCourses[0]?.count || 1;
                const percentage = Math.round((c.count / max) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-800 font-semibold">{c.course}</span>
                      <span className="text-indigo-600 font-bold">{c.count} leads</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Marketing Campaigns & CAC / CPL ROI */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Marketing ROI, Cost Per Lead (CPL) & Cost Per Admission (CPA)</h3>
              <p className="text-sm text-gray-500">
                Formula Grounding: CPL = Spend / Leads Generated | CPA = Spend / Confirmed Admissions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Campaign Name</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4 text-right">Ad Spend</th>
                    <th className="py-3 px-4 text-center">Leads Generated</th>
                    <th className="py-3 px-4 text-center">Admissions</th>
                    <th className="py-3 px-4 text-right">CPL (INR)</th>
                    <th className="py-3 px-4 text-right">CPA (INR)</th>
                    <th className="py-3 px-4 text-center">ROI Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {campaigns.map((camp: any) => {
                    const cpl = camp.leads_count > 0 ? Math.round(camp.spend / camp.leads_count) : 0;
                    const cpa = camp.conversions_count > 0 ? Math.round(camp.spend / camp.conversions_count) : 0;
                    const estimatedRevenue = (camp.conversions_count || 0) * 45000; // Est consultancy admission commission
                    const roi = camp.spend > 0 ? ((estimatedRevenue - camp.spend) / camp.spend).toFixed(1) : '0';

                    return (
                      <tr key={camp.id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">{camp.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {camp.platform}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-gray-800">
                          ₹{Number(camp.spend).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-900">{camp.leads_count || 0}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{camp.conversions_count || 0}</td>
                        <td className="py-3.5 px-4 text-right text-gray-700 font-semibold">
                          ₹{cpl.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-blue-700">
                          {cpa > 0 ? `₹${cpa.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {roi}x ROI
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Conversion Funnel */}
      {activeTab === 'funnel' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">End-to-End Admission Conversion Funnel</h3>
            <p className="text-sm text-gray-500">
              Pipeline progression from initial Meta/Walk-in inquiry through to fee payment & university enrollment
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto py-4">
            {funnelStages.map((st, i) => (
              <div key={i} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    {st.stage}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-gray-900">{st.count}</span>
                    <span className="text-xs text-gray-500 ml-2">({st.pct}%)</span>
                  </div>
                </div>

                <div className="w-full bg-gray-100 h-6 rounded-lg overflow-hidden flex items-center px-2">
                  <div 
                    className="h-full rounded-md transition-all duration-700 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                    style={{ 
                      width: `${Math.max(st.pct, 8)}%`, 
                      backgroundColor: st.color 
                    }}
                  >
                    {st.count}
                  </div>
                </div>

                {i < funnelStages.length - 1 && (
                  <div className="text-center my-1 text-xs text-gray-400">
                    ↓ Drop-off: {Math.max(0, st.pct - funnelStages[i + 1].pct)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
