import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  MessageCircle,
  Mail,
  Phone,
  Flame,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Copy,
  Check,
  Building2,
  GraduationCap,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AISalesCopilotPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);

  // Pitch Generator State
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [pitchChannel, setPitchChannel] = useState<'WhatsApp' | 'Email' | 'Call Script'>('WhatsApp');
  const [pitchObjection, setPitchObjection] = useState<string>('CLOSING');
  const [pitchTone, setPitchTone] = useState<string>('Empathetic & Highly Persuasive');
  const [customPitchNotes, setCustomPitchNotes] = useState<string>('');
  const [generatingPitch, setGeneratingPitch] = useState<boolean>(false);
  const [generatedPitchData, setGeneratedPitchData] = useState<any>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [sendingOutreach, setSendingOutreach] = useState(false);

  // AI Course Matchmaker State
  const [matchPercentage, setMatchPercentage] = useState('75');
  const [matchStream, setMatchStream] = useState('Engineering & Technology');
  const [matchMaxFee, setMatchMaxFee] = useState('3000');
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // AI Chat Assistant State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your AI Sales Copilot. I analyze student profiles, craft persuasive outreach messages, and help you overcome objections on fees, rankings, and hostel safety. How can I assist you today?',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // All leads for selector
  const [allLeads, setAllLeads] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, settingsRes, leadsRes] = await Promise.allSettled([
        api.getAIDashboard(),
        api.getAISettings(),
        api.getLeads({ limit: 50 })
      ]);

      if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value);
      if (settingsRes.status === 'fulfilled') setAiSettings(settingsRes.value);
      if (leadsRes.status === 'fulfilled') {
        const leadList = leadsRes.value?.data || leadsRes.value || [];
        setAllLeads(leadList);
        if (leadList.length > 0 && !selectedLeadId) {
          setSelectedLeadId(leadList[0].id);
        }
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load AI Sales dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePitch = async () => {
    if (!selectedLeadId) {
      addToast('Please select a student lead first', 'warning');
      return;
    }
    setGeneratingPitch(true);
    try {
      const res = await api.generateAIPitch({
        leadId: selectedLeadId,
        channel: pitchChannel,
        objection: pitchObjection,
        tone: pitchTone,
        customNotes: customPitchNotes
      });
      setGeneratedPitchData(res);
      addToast(`AI sales pitch crafted successfully (${res.mode})!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to generate sales pitch', 'error');
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleCopyPitch = () => {
    if (!generatedPitchData?.pitch) return;
    navigator.clipboard.writeText(generatedPitchData.pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
    addToast('Pitch copied to clipboard!', 'success');
  };

  const handleDirectSendOutreach = async () => {
    if (!selectedLeadId) return;
    setSendingOutreach(true);
    try {
      const res = await api.triggerAIOutreach(selectedLeadId);
      if (res.success) {
        addToast(
          `AI outreach dispatched on behalf of ${res.counselorName} (WhatsApp: ${res.whatsappSent ? 'Sent' : 'Skipped'}, Email: ${res.emailSent ? 'Sent' : 'Skipped'})!`,
          'success'
        );
        loadData();
      } else {
        addToast(res.error || 'Outreach could not be dispatched', 'warning');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to dispatch AI outreach', 'error');
    } finally {
      setSendingOutreach(false);
    }
  };

  const handleFindMatches = async () => {
    setMatchingLoading(true);
    try {
      const results = await api.getUniversityCourses({
        stream: matchStream,
        max_fee: matchMaxFee
      });
      setMatchingResults(Array.isArray(results) ? results.slice(0, 6) : []);
    } catch (err: any) {
      addToast(err.message || 'Failed to search matching programs', 'error');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query) return;

    const userMsg = { sender: 'user' as const, text: query, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const selectedLead = allLeads.find((l) => l.id === selectedLeadId);
      const res = await api.chatAISalesAssistant(query, selectedLead);
      const aiMsg = {
        sender: 'ai' as const,
        text: res.reply || 'Here is the recommended sales strategy based on current university admission standards.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      addToast(err.message || 'Failed to get AI advice', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const objectionsList = [
    { id: 'CLOSING', label: '🎯 Push to Close & Apply', desc: 'Lock in scholarship & request documents' },
    { id: 'FEE_HIGH', label: '💰 Fees Too High', desc: 'Presents installment & merit scholarship waiver' },
    { id: 'COMPARING', label: '⚖️ Comparing Universities', desc: 'Highlights placement, NIRF & lab credentials' },
    { id: 'HOSTEL_SAFETY', label: '🏠 Hostel & Parent Safety', desc: 'Reassures 24/7 security, warden & food quality' },
    { id: 'ENTRANCE_EXAM', label: '📝 Fear of Entrance Cutoffs', desc: 'Guides on direct merit counseling allotment' },
    { id: 'UNRESPONSIVE', label: '👻 Unresponsive / Ghosting', desc: 'Curiosity-driven low pressure binary question' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Sales Copilot &amp; Auto-Outreach</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Sales Assistant &amp; Autonomous Outreach
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Automates personalized WhatsApp &amp; Email outreach on behalf of counselors when leads arrive, calculates conversion probability scores, solves sales objections, and equips counselors with high-converting pitches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[120px]">
              <div className="text-xs text-purple-200 font-medium">Auto WhatsApp</div>
              <div className="text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{aiSettings?.ai_auto_whatsapp_enabled ? 'Active' : 'Paused'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[120px]">
              <div className="text-xs text-purple-200 font-medium">Auto Email</div>
              <div className="text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{aiSettings?.ai_auto_email_enabled ? 'Active' : 'Paused'}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all flex items-center gap-1.5"
            >
              <span>AI Settings</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total AI Outreach</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {dashboardData?.totalOutreachSent ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Dispatched on counselor behalf</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">WhatsApp Delivered</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {dashboardData?.whatsappOutreachCount ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">1-on-1 counselor intro</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admissions Emails</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {dashboardData?.emailOutreachCount ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Prospectus &amp; scholarship guide</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hot Conversion Leads</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {dashboardData?.highProbabilityLeadsCount ?? 0}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">AI Score &ge; 75 (High intent)</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Pitch Generator + Hot Leads Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI One-Click Pitch & Objection Solver (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                <span>AI Sales Pitch &amp; Objection Solver</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate tailored, high-converting messages addressing student hesitation, fees, and college comparisons.
              </p>
            </div>
          </div>

          {/* Student Lead Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Select Student Lead</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:border-purple-500"
            >
              {allLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.student_name} &bull; {l.preferred_course || 'Course'} &bull; {l.city || 'City'} ({l.lead_temperature || 'WARM'})
                </option>
              ))}
            </select>
          </div>

          {/* Objection Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Student Objection or Sales Scenario</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {objectionsList.map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => setPitchObjection(obj.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    pitchObjection === obj.id
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-purple-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{obj.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{obj.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Channel & Tone Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Channel</label>
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
                {(['WhatsApp', 'Email', 'Call Script'] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setPitchChannel(ch)}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      pitchChannel === ch ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Counselor Tone</label>
              <select
                value={pitchTone}
                onChange={(e) => setPitchTone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800"
              >
                <option value="Empathetic & Highly Persuasive">Empathetic &amp; Highly Persuasive</option>
                <option value="Friendly Academic Advisor">Friendly Academic Advisor</option>
                <option value="Urgent & Deadline-Driven">Urgent &amp; Deadline-Driven</option>
                <option value="Executive & Direct">Executive &amp; Direct</option>
              </select>
            </div>
          </div>

          {/* Custom Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Custom Notes (Optional)</label>
            <input
              type="text"
              value={customPitchNotes}
              onChange={(e) => setCustomPitchNotes(e.target.value)}
              placeholder="e.g. Student's budget is $3,500/yr, interested in AI/ML specialization..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-500"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleGeneratePitch}
              disabled={generatingPitch}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-900/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {generatingPitch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Crafting Pitch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate AI Pitch for {pitchChannel}</span>
                </>
              )}
            </button>

            <button
              onClick={handleDirectSendOutreach}
              disabled={sendingOutreach}
              className="py-2.5 px-4 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 transition-all"
              title="Automatically send both WhatsApp & Email welcome messages"
            >
              {sendingOutreach ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Auto-Dispatch Now</span>
            </button>
          </div>

          {/* Output Pitch Card */}
          {generatedPitchData && (
            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generated {pitchChannel} Pitch ({generatedPitchData.mode})</span>
                </span>
                <button
                  onClick={handleCopyPitch}
                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-all"
                >
                  {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPitch ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {generatedPitchData.subject && (
                <div className="text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-purple-100">
                  <span className="text-slate-400 font-medium">Subject:</span> {generatedPitchData.subject}
                </div>
              )}

              <div className="text-xs text-slate-800 font-sans whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-purple-100 leading-relaxed shadow-2xs max-h-60 overflow-y-auto">
                {generatedPitchData.pitch}
              </div>

              {generatedPitchData.phone && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://wa.me/${String(generatedPitchData.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(generatedPitchData.pitch)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open in WhatsApp Web</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>

                  <button
                    onClick={() => {
                      if (generatedPitchData.email) {
                        window.location.href = `mailto:${generatedPitchData.email}?subject=${encodeURIComponent(generatedPitchData.subject || 'University Admission Update')}&body=${encodeURIComponent(generatedPitchData.pitch)}`;
                      } else {
                        addToast('Student does not have an email on file', 'warning');
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Open Email Client</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Hot Leads Priority Action Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Priority Call Queue (Hot Leads)</span>
              </h2>
              <p className="text-[11px] text-slate-500">Ranked by AI win probability &amp; conversion score</p>
            </div>
            <button
              onClick={loadData}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              title="Refresh leads"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {!dashboardData?.hotLeads || dashboardData.hotLeads.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 space-y-2">
                <Bot className="w-8 h-8 mx-auto text-slate-300" />
                <p>No high-probability leads pending review.</p>
              </div>
            ) : (
              dashboardData.hotLeads.map((l: any) => (
                <div
                  key={l.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 bg-slate-50/50 hover:bg-white transition-all space-y-2 text-xs shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 leading-snug">{l.student_name}</h4>
                      <div className="text-[11px] text-purple-700 font-medium">
                        {l.preferred_course || 'Degree Program'} &bull; {l.city || 'Nepal'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                        {l.ai_score}/100 Score
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{l.conversion_probability} Win %</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-2 bg-white p-2 rounded-lg border border-slate-100">
                    💡 <span className="font-semibold text-slate-700">Next Action:</span> {l.recommended_action}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-400">
                      Counselor: <strong className="text-slate-700">{l.assigned_counselor_name || 'Assigned'}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {l.phone && (
                        <a
                          href={`tel:${l.phone}`}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="Call Student"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {l.phone && (
                        <a
                          href={`https://wa.me/${String(l.phone).replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="WhatsApp Student"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedLeadId(l.id);
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold"
                      >
                        Pitch
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secondary Row: Course & University Matchmaker + Counselor Copilot Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Matchmaker Tool (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>AI University &amp; Fee Matchmaker</span>
              </h3>
              <p className="text-xs text-slate-500">
                Matches student academic percentage and budget against 24,965 verified courses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">12th Marks (%)</label>
              <input
                type="number"
                value={matchPercentage}
                onChange={(e) => setMatchPercentage(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                placeholder="75"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Stream</label>
              <select
                value={matchStream}
                onChange={(e) => setMatchStream(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="Engineering & Technology">Engineering</option>
                <option value="Management & Business">Management</option>
                <option value="Computer Applications & IT">Computer / IT</option>
                <option value="Medical & Health Sciences">Medical / Health</option>
                <option value="Law & Legal Studies">Law</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Max Budget (USD/yr)</label>
              <input
                type="number"
                value={matchMaxFee}
                onChange={(e) => setMatchMaxFee(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                placeholder="3000"
              />
            </div>
          </div>

          <button
            onClick={handleFindMatches}
            disabled={matchingLoading}
            className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
          >
            {matchingLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Find Best Matching Universities</span>
          </button>

          {/* Results list */}
          <div className="space-y-2 pt-1 max-h-72 overflow-y-auto">
            {matchingResults.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                Click &quot;Find Best Matching Universities&quot; to scan institutional fee structures.
              </p>
            ) : (
              matchingResults.map((m: any) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="font-bold text-slate-900 truncate">{m.course_name}</h5>
                    <div className="text-blue-700 font-semibold text-[11px] truncate">
                      {m.university_name} &bull; {m.university_city}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-slate-900 font-mono text-xs">
                      ${m.tuition_fee_per_year}/yr
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold">Scholarship Eligible</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Counselor Interactive Copilot Chat (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span>Counselor AI Advisor (Ask Sales Questions)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Get immediate closing advice, objection handling scripts, or admission strategies.
            </p>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-72 pr-1 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60'
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2.5 text-xs text-slate-400 items-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                <span>AI analyzing admission strategies...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g. How to pitch Sharda B.Tech to a student comparing with Galgotias?"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1 shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
