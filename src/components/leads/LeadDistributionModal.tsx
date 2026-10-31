import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Cpu,
  Trash2,
  Edit2,
  TrendingUp,
  Share2,
  Users,
  Building2,
  BookOpen,
  MapPin,
  RefreshCw,
  Search
} from 'lucide-react';
import { api } from '../../services/api';
import { LeadRoutingRule, Counselor } from '../../types';
import { useNotifications } from '../../context/NotificationContext';

interface LeadDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadsDistributed?: () => void;
}

export const LeadDistributionModal: React.FC<LeadDistributionModalProps> = ({
  isOpen,
  onClose,
  onLeadsDistributed
}) => {
  const { addToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'rules' | 'simulate' | 'distribute'>('rules');
  const [rules, setRules] = useState<LeadRoutingRule[]>([]);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(false);

  // New Rule Form
  const [ruleName, setRuleName] = useState('');
  const [ruleCounselorId, setRuleCounselorId] = useState('');
  const [ruleCourses, setRuleCourses] = useState('B.Tech, Computer Science, Engineering, AI');
  const [ruleUniversities, setRuleUniversities] = useState('SRM Institute, VIT Vellore');
  const [ruleCities, setRuleCities] = useState('Kathmandu, Lalitpur, Pokhara');
  const [rulePriority, setRulePriority] = useState('5');
  const [ruleMaxDaily, setRuleMaxDaily] = useState('20');
  const [ruleDesc, setRuleDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Simulation Form
  const [simCourse, setSimCourse] = useState('B.Tech Computer Science');
  const [simUniversity, setSimUniversity] = useState('SRM Institute of Science and Technology');
  const [simCity, setSimCity] = useState('Kathmandu');
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Batch Distribution
  const [distributing, setDistributing] = useState(false);
  const [distResult, setDistResult] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesData, counselorsData] = await Promise.all([
        api.getRoutingRules(),
        api.getCounselors()
      ]);
      setRules(rulesData || []);
      setCounselors(counselorsData || []);
      if (counselorsData && counselorsData.length > 0 && !ruleCounselorId) {
        setRuleCounselorId(counselorsData[0].id);
      }
    } catch (err: any) {
      console.warn('Failed to load rules/counselors:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !ruleCounselorId) {
      addToast('Rule Name and Assigned Counselor are required', 'warning');
      return;
    }

    try {
      const courseArr = ruleCourses.split(',').map(s => s.trim()).filter(Boolean);
      const uniArr = ruleUniversities.split(',').map(s => s.trim()).filter(Boolean);
      const cityArr = ruleCities.split(',').map(s => s.trim()).filter(Boolean);

      await api.createRoutingRule({
        name: ruleName,
        counselor_id: ruleCounselorId,
        course_keywords: courseArr,
        university_keywords: uniArr,
        target_cities: cityArr,
        priority: Number(rulePriority) || 1,
        max_daily_leads: Number(ruleMaxDaily) || 20,
        description: ruleDesc,
        is_active: 1
      });

      addToast(`Routing rule "${ruleName}" created successfully!`, 'success');
      setShowAddForm(false);
      setRuleName('');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to create rule', 'error');
    }
  };

  const handleToggleRuleActive = async (rule: LeadRoutingRule) => {
    try {
      const newActive = rule.is_active === 1 ? 0 : 1;
      await api.updateRoutingRule(rule.id, { is_active: newActive });
      addToast(`Rule "${rule.name}" is now ${newActive ? 'Active' : 'Paused'}`, 'info');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update rule', 'error');
    }
  };

  const handleDeleteRule = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete rule "${name}"?`)) return;
    try {
      await api.deleteRoutingRule(id);
      addToast(`Rule "${name}" deleted`, 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete rule', 'error');
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await api.simulateLeadRouting({
        preferred_course: simCourse,
        preferred_university: simUniversity,
        city: simCity
      });
      setSimResult(res);
    } catch (err: any) {
      addToast(err.message || 'Simulation failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const handleDistributeUnassigned = async () => {
    setDistributing(true);
    setDistResult(null);
    try {
      const res = await api.distributeUnassignedLeads('Lead Distribution Engine');
      setDistResult(res);
      addToast(
        `Distribution Complete: ${res.totalAssigned} unassigned leads routed to specialized counselors!`,
        res.totalAssigned > 0 ? 'success' : 'info'
      );
      if (onLeadsDistributed) onLeadsDistributed();
    } catch (err: any) {
      addToast(err.message || 'Failed to distribute leads', 'error');
    } finally {
      setDistributing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Automated Lead Distribution Engine</h2>
              <p className="text-xs text-slate-500">Route leads dynamically based on preferred course, university, and quota</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-3 pb-1 border-b border-slate-100 shrink-0">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'rules' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Routing Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('distribute')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'distribute' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Run Distribution
          </button>
          <button
            onClick={() => setActiveTab('simulate')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'simulate' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Live Simulator
          </button>
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* TAB 1: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Active Rules (Evaluated in Priority Order):</span>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {showAddForm ? 'Cancel' : 'Add New Rule'}
                </button>
              </div>

              {/* Add Rule Form */}
              {showAddForm && (
                <form onSubmit={handleCreateRule} className="p-4 bg-slate-50 rounded-xl border border-blue-200/60 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Define New Course/University Routing Rule</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rule Name *</label>
                      <input
                        type="text"
                        required
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        placeholder="e.g. SRM & Engineering Specialist"
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assigned Counselor *</label>
                      <select
                        required
                        value={ruleCounselorId}
                        onChange={(e) => setRuleCounselorId(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="">-- Select Counselor --</option>
                        {counselors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Matching Course Keywords (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={ruleCourses}
                      onChange={(e) => setRuleCourses(e.target.value)}
                      placeholder="B.Tech, MBBS, Nursing, MBA, BBA"
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Matching University Keywords (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={ruleUniversities}
                      onChange={(e) => setRuleUniversities(e.target.value)}
                      placeholder="SRM, VIT, Sharda, Chandigarh, Amity"
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Priority (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={rulePriority}
                        onChange={(e) => setRulePriority(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Daily Lead Quota</label>
                      <input
                        type="number"
                        min="1"
                        value={ruleMaxDaily}
                        onChange={(e) => setRuleMaxDaily(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                    >
                      Save Rule
                    </button>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="space-y-2.5">
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No custom routing rules yet. Click "Add New Rule" above to create course and university matching rules!
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        rule.is_active === 1
                          ? 'bg-white border-slate-200/90 shadow-2xs hover:border-blue-300'
                          : 'bg-slate-50/80 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{rule.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              Priority {rule.priority}
                            </span>
                            <span className="text-[10px] text-slate-400">Max: {rule.max_daily_leads}/day</span>
                          </div>

                          <div className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            Assigned Counselor: <span className="font-semibold text-slate-800">{rule.counselor_name}</span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-1">
                            {rule.course_keywords?.map((ck, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                🎓 {ck}
                              </span>
                            ))}
                            {rule.university_keywords?.map((uk, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                🏛️ {uk}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleRuleActive(rule)}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              rule.is_active === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {rule.is_active === 1 ? 'Active' : 'Paused'}
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id, rule.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DISTRIBUTE */}
          {activeTab === 'distribute' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <Play className="w-4 h-4 text-blue-600" />
                  One-Click Intelligent Lead Routing
                </h4>
                <p className="text-blue-800">
                  This action inspects all unassigned student leads in the database and matches each lead against active course and university specialization rules. If no custom rule matches, leads are distributed using capacity-balanced round-robin.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleDistributeUnassigned}
                    disabled={distributing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50"
                  >
                    {distributing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Routing Leads...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Lead Distribution Engine Now
                      </>
                    )}
                  </button>
                </div>
              </div>

              {distResult && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                    <span>Distribution Results:</span>
                    <span className="text-emerald-600">
                      {distResult.totalAssigned} / {distResult.totalProcessed} Assigned
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {distResult.details?.length === 0 ? (
                      <div className="py-4 text-center text-slate-400 text-xs">
                        No unassigned leads found. All leads are currently assigned!
                      </div>
                    ) : (
                      distResult.details?.map((d: any, idx: number) => (
                        <div key={idx} className="py-2 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-800">{d.studentName}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">({d.preferredCourse} - {d.preferredUniversity})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-blue-600">{d.assignedTo}</span>
                            <div className="text-[10px] text-slate-500">{d.method}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SIMULATE */}
          {activeTab === 'simulate' && (
            <div className="space-y-4">
              <form onSubmit={handleRunSimulation} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Test Rule Evaluation (Simulator)</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferred Course</label>
                  <input
                    type="text"
                    value={simCourse}
                    onChange={(e) => setSimCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferred University</label>
                  <input
                    type="text"
                    value={simUniversity}
                    onChange={(e) => setSimUniversity(e.target.value)}
                    placeholder="e.g. SRM Institute of Science and Technology"
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={simCity}
                    onChange={(e) => setSimCity(e.target.value)}
                    placeholder="Kathmandu"
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {simulating ? 'Evaluating...' : 'Simulate Assignment'}
                </button>
              </form>

              {simResult && (
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                  <h5 className="font-bold text-xs text-slate-900">Simulation Output:</h5>
                  {simResult.success ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Selected Counselor:</span>
                        <span className="font-bold text-blue-600 text-sm">{simResult.counselorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Routing Method:</span>
                        <span className="font-medium text-slate-800">{simResult.method}</span>
                      </div>
                      {simResult.reasons && (
                        <div className="text-[11px] text-slate-500 pt-1">
                          Reasons: {simResult.reasons.join(' | ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-rose-600">{simResult.message}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default LeadDistributionModal;
