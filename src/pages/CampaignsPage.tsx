import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, DollarSign, TrendingUp, Users, Award, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';
import { Campaign } from '../types';
import { useNotifications } from '../context/NotificationContext';

export const CampaignsPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [report, setReport] = useState<{ campaigns: any[]; summary: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'Meta' | 'Google' | 'Instagram' | 'Website' | 'Offline' | 'Referral' | 'Other'>('Meta');
  const [uniFocus, setUniFocus] = useState('');
  const [courseFocus, setCourseFocus] = useState('');
  const [cityFocus, setCityFocus] = useState('Kathmandu');
  const [startDate, setStartDate] = useState('');
  const [budget, setBudget] = useState('150000');
  const [spend, setSpend] = useState('50000');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await api.getCampaigns();
      setReport(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate) return;
    try {
      await api.createCampaign({
        name,
        platform,
        university_focus: uniFocus,
        course_focus: courseFocus,
        target_city: cityFocus,
        start_date: startDate,
        budget: parseFloat(budget) || 0,
        spend: parseFloat(spend) || 0
      });
      showToast(`Campaign ${name} created successfully!`, 'success');
      setModalOpen(false);
      setName('');
      fetchCampaigns();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const campaigns = report?.campaigns || [];
  const summary = report?.summary || {
    totalBudget: 0,
    totalSpend: 0,
    totalLeads: 0,
    totalApplications: 0,
    totalAdmissions: 0,
    overallCPL: 0,
    overallCPA: 0,
    overallCostPerAdmission: 0
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            Marketing Campaigns &amp; ROI Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Meta Ads, Google Search &amp; Nepal drive attribution metrics calculated via dynamic formulas
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Summary KPI Cards (Section 25 Marketing ROI) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Spend</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ₹{(summary.totalSpend / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Budget: ₹{(summary.totalBudget / 100000).toFixed(1)}L
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Leads &amp; CPL</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {summary.totalLeads}
          </div>
          <div className="text-[11px] font-bold text-slate-700 mt-1">
            Cost per Lead (CPL): ₹{summary.overallCPL}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Applications &amp; CPA</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {summary.totalApplications}
          </div>
          <div className="text-[11px] font-bold text-slate-700 mt-1">
            Cost per App (CPA): ₹{summary.overallCPA}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Confirmed Admissions</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {summary.totalAdmissions}
          </div>
          <div className="text-[11px] font-bold text-emerald-800 mt-1">
            Cost/Admission: ₹{summary.overallCostPerAdmission}
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading marketing campaigns...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Campaign &amp; Platform</th>
                  <th className="py-3 px-4 font-semibold">Focus &amp; City</th>
                  <th className="py-3 px-4 font-semibold">Spend / Budget</th>
                  <th className="py-3 px-4 font-semibold">Leads</th>
                  <th className="py-3 px-4 font-semibold">CPL (Formula)</th>
                  <th className="py-3 px-4 font-semibold">Apps</th>
                  <th className="py-3 px-4 font-semibold">CPA</th>
                  <th className="py-3 px-4 font-semibold">Admissions</th>
                  <th className="py-3 px-4 font-semibold text-right">Cost / Admission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {campaigns.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 mt-1 inline-block">
                        {c.platform}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{c.target_city || 'Nepal & India'}</div>
                      <div className="text-[10px] text-slate-400">{c.course_focus || 'All Courses'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">₹{c.spend.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">Budget: ₹{c.budget.toLocaleString()}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-blue-600">{c.leads_count}</td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      ₹{c.calc_cpl}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-indigo-600">{c.applications_count}</td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      ₹{c.calc_cpa}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600">{c.admissions_count}</td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                      ₹{c.calc_cost_per_admission}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Campaign Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form onSubmit={handleCreate} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Create Marketing Campaign</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Meta Nepal B.Tech Wave 2026"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Meta">Meta</option>
                  <option value="Google">Google</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Website">Website</option>
                  <option value="Offline">Offline / Expo</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Allocated Budget (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Spend (₹)</label>
                <input
                  type="number"
                  value={spend}
                  onChange={e => setSpend(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Save Campaign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
