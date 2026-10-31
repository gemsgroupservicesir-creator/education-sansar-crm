import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  FileText,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  GraduationCap,
  Building2,
  Eye,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Copy,
  Search,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { EmailTemplate, BulkEmailCampaign } from '../types';

export const CommunicationsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const canSendBulk = isSuperAdmin || hasPermission('bulk_email');
  const canManageTemplates = isSuperAdmin || hasPermission('email_templates');

  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history'>('send');

  // Filter states for Bulk Sending
  const [filterCourse, setFilterCourse] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemperature, setFilterTemperature] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [targetCount, setTargetCount] = useState<number>(0);
  const [sampleLeads, setSampleLeads] = useState<any[]>([]);
  const [loadingCount, setLoadingCount] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Live filter suggestions & distributions
  const [filterOptions, setFilterOptions] = useState<{
    courses: { name: string; count: number }[];
    universities: { name: string; count: number }[];
    statuses: { name: string; count: number }[];
    temperatures: { name: string; count: number }[];
    totalLeadsWithEmail: number;
  }>({
    courses: [],
    universities: [],
    statuses: [],
    temperatures: [],
    totalLeadsWithEmail: 0
  });

  // Email Composer states
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('Exclusive Admission Offer & Scholarship Details: {{preferred_course}} at {{preferred_university}}');
  const [content, setContent] = useState(`Dear {{student_name}},

Greetings from Education Sansar!

We noticed your high interest in pursuing {{preferred_course}} at {{preferred_university}}. As an authorized admissions partner, we are pleased to inform you that merit-based scholarships and fast-track seat allotments are now open for the upcoming intake.

Key Highlights for your program:
- Academic Program: {{preferred_course}}
- Institution: {{preferred_university}}
- Location: Recognized accredited campus
- Personalized Guidance: Dedicated 1-on-1 counselor allocated

Your Dedicated Admissions Counselor:
Name: {{counselor_name}}
Email: {{counselor_email}}
Phone / WhatsApp: {{counselor_phone}}
Application Reference: {{application_id}}

To confirm your provisional eligibility and scholarship tier before the deadline ({{deadline}}), please reply directly to this email or contact your counselor.

Warm regards,
Admissions Directorate
Education Sansar`);

  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Live preview state
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  // Templates Management state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateFilterCategory, setTemplateFilterCategory] = useState('');
  const [templateFilterCourse, setTemplateFilterCourse] = useState('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Template Form states
  const [tmplName, setTmplName] = useState('');
  const [tmplCategory, setTmplCategory] = useState('COURSE_PROSPECTUS');
  const [tmplSubject, setTmplSubject] = useState('');
  const [tmplContent, setTmplContent] = useState('');
  const [tmplCourses, setTmplCourses] = useState('');
  const [tmplUniversities, setTmplUniversities] = useState('');
  const [tmplDescription, setTmplDescription] = useState('');

  // History state
  const [campaigns, setCampaigns] = useState<BulkEmailCampaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Fetch recipients count whenever filters change
  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      setLoadingCount(true);
      try {
        const res = await api.getTargetEmailCount({
          filter_course: filterCourse,
          filter_university: filterUniversity,
          filter_status: filterStatus,
          filter_temperature: filterTemperature,
          filter_city: filterCity
        });
        if (active) {
          setTargetCount(res.count);
          setSampleLeads(res.sample || []);
        }
      } catch (err: any) {
        console.warn('Error fetching count:', err);
      } finally {
        if (active) setLoadingCount(false);
      }
    };

    fetchCount();
    return () => { active = false; };
  }, [filterCourse, filterUniversity, filterStatus, filterTemperature, filterCity]);

  // Update live preview when subject or content changes
  useEffect(() => {
    let active = true;
    const updatePreview = async () => {
      try {
        const sampleStudent = sampleLeads[0] ? {
          student_name: sampleLeads[0].student_name,
          email: sampleLeads[0].email,
          preferred_course: sampleLeads[0].course || 'B.Tech Computer Science',
          preferred_university: sampleLeads[0].university || 'Sharda University',
          city: sampleLeads[0].city || 'Kathmandu'
        } : undefined;

        const res = await api.previewEmailTemplate({
          subject,
          content,
          sampleData: sampleStudent
        });
        if (active) {
          setPreviewSubject(res.subject);
          setPreviewContent(res.content);
        }
      } catch (e) {
        if (active) {
          setPreviewSubject(subject);
          setPreviewContent(content);
        }
      }
    };

    const timer = setTimeout(updatePreview, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [subject, content, sampleLeads]);

  // Load filter options (courses, universities, counts)
  const fetchFilterOptions = async () => {
    try {
      const opts = await api.getEmailFilterOptions();
      if (opts) setFilterOptions(opts);
    } catch (e) {
      console.warn('Failed to load filter options:', e);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Load templates
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await api.getEmailTemplates({
        category: templateFilterCategory,
        course: templateFilterCourse
      });
      setTemplates(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch templates', 'error');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load campaigns history
  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const data = await api.getEmailCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to fetch campaigns history', 'error');
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [templateFilterCategory, templateFilterCourse]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchCampaigns();
    }
  }, [activeTab]);

  const handleSelectTemplate = (tId: string) => {
    setSelectedTemplateId(tId);
    if (!tId) return;
    const found = templates.find(t => t.id === tId);
    if (found) {
      setSubject(found.subject);
      setContent(found.content);
      // Auto-focus target course if present and current course filter is empty
      if (found.target_courses && found.target_courses.length > 0 && !filterCourse) {
        setFilterCourse(found.target_courses[0]);
      }
      if (found.target_universities && found.target_universities.length > 0 && !filterUniversity) {
        setFilterUniversity(found.target_universities[0]);
      }
      addToast(`Applied template: "${found.name}"`, 'info');
    }
  };

  const insertMergeTag = (tag: string) => {
    setContent(prev => prev + ' ' + tag);
    addToast(`Inserted ${tag}`, 'success');
  };

  const handleOpenSendConfirmation = () => {
    if (!subject.trim() || !content.trim()) {
      addToast('Please enter an email subject and content body', 'error');
      return;
    }

    if (targetCount === 0) {
      addToast('No matching leads found for current filters. Clear filters to send to all leads.', 'warning');
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    setSending(true);
    setSendResult(null);

    try {
      const res = await api.sendBulkEmail({
        campaign_name: campaignName.trim() || `Bulk Outreach - ${filterCourse || 'All Courses'} (${targetCount} leads)`,
        template_id: selectedTemplateId || undefined,
        subject,
        content,
        filter_course: filterCourse,
        filter_university: filterUniversity,
        filter_status: filterStatus,
        filter_temperature: filterTemperature,
        filter_city: filterCity,
        sent_by: user?.name || 'Super Admin'
      });

      setSendResult(res);
      setConfirmModalOpen(false);
      addToast(`Successfully dispatched email to ${res.sent_count} students!`, 'success');
      fetchCampaigns();
      fetchFilterOptions();
    } catch (err: any) {
      addToast(err.message || 'Failed to send bulk email', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setTmplName('');
    setTmplCategory('COURSE_PROSPECTUS');
    setTmplSubject('Course Prospectus & Scholarship Offer for {{preferred_course}}');
    setTmplCourses(filterCourse || 'B.Tech, MBBS, MBA');
    setTmplUniversities(filterUniversity || 'Sharda University, Chandigarh University');
    setTmplDescription('Customized course prospectus and scholarship announcement');
    setTmplContent(`Dear {{student_name}},

Thank you for your interest in {{preferred_course}} at {{preferred_university}}.

We have reserved your application profile for upcoming scholarship allocations. Please review the enclosed information and get in touch with {{counselor_name}} at {{counselor_phone}} to confirm your admission.

Sincerely,
Admissions Desk
Education Sansar`);
    setTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setTmplName(t.name);
    setTmplCategory(t.category);
    setTmplSubject(t.subject);
    setTmplContent(t.content);
    setTmplDescription(t.description || '');
    setTmplCourses(Array.isArray(t.target_courses) ? t.target_courses.join(', ') : (t.target_courses || ''));
    setTmplUniversities(Array.isArray(t.target_universities) ? t.target_universities.join(', ') : (t.target_universities || ''));
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName.trim() || !tmplSubject.trim() || !tmplContent.trim()) {
      addToast('Template name, subject, and body are required', 'error');
      return;
    }

    try {
      const coursesArr = tmplCourses.split(',').map(s => s.trim()).filter(Boolean);
      const unisArr = tmplUniversities.split(',').map(s => s.trim()).filter(Boolean);

      const payload = {
        name: tmplName.trim(),
        category: tmplCategory,
        subject: tmplSubject.trim(),
        content: tmplContent.trim(),
        description: tmplDescription.trim(),
        target_courses: coursesArr,
        target_universities: unisArr,
        channel: 'Email' as const,
        performedBy: user?.name || 'Super Admin'
      };

      if (editingTemplate) {
        await api.updateEmailTemplate(editingTemplate.id, payload);
        addToast(`Email template "${tmplName}" updated successfully!`, 'success');
      } else {
        await api.createEmailTemplate(payload);
        addToast(`Email template "${tmplName}" created!`, 'success');
      }

      setTemplateModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      addToast(err.message || 'Failed to save template', 'error');
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await api.deleteEmailTemplate(id, user?.name || 'Super Admin');
      addToast(`Template "${name}" deleted`, 'success');
      fetchTemplates();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete template', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-900/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Bulk Email &amp; Course Outreach Engine</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase tracking-wider">
                  Automated Merge Tags
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Target leads by specialized Course and University with dynamic merge tags ({{student_name}}, {{preferred_course}}, {{counselor_name}})
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'send'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send Bulk Outreach</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Course &amp; University Templates</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Campaign History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BULK EMAIL DISPATCH ENGINE */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Targeting Filters & Recipients */}
          <div className="lg:col-span-5 space-y-5">
            {/* Step 1: Filter Leads by Course & University */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Target Audience Filters
                    </h2>
                    <p className="text-[11px] text-slate-500">Filter students by Course &amp; University</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Matches:</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 ${
                    targetCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {loadingCount ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" />
                        <span>{targetCount} Leads</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Target Academic Course</span>
                    </span>
                    {filterCourse && (
                      <button
                        type="button"
                        onClick={() => setFilterCourse('')}
                        className="text-[10px] text-rose-600 hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    placeholder="e.g. B.Tech, MBBS, MBA, BCA, BBA..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {/* Dynamic course chips with real-time database counts */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {filterOptions.courses.length > 0 ? (
                      filterOptions.courses.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setFilterCourse(filterCourse === c.name ? '' : c.name)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all flex items-center gap-1 ${
                            filterCourse === c.name
                              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className={`px-1 py-0.1 rounded-full text-[9px] font-black ${
                            filterCourse === c.name ? 'bg-purple-700 text-purple-100' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {c.count}
                          </span>
                        </button>
                      ))
                    ) : (
                      ['B.Tech', 'MBBS', 'MBA', 'BCA', 'BBA', 'B.Sc Nursing'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFilterCourse(filterCourse === c ? '' : c)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                            filterCourse === c
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700'
                          }`}
                        >
                          {c}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Target University</span>
                    </span>
                    {filterUniversity && (
                      <button
                        type="button"
                        onClick={() => setFilterUniversity('')}
                        className="text-[10px] text-rose-600 hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    value={filterUniversity}
                    onChange={(e) => setFilterUniversity(e.target.value)}
                    placeholder="e.g. Sharda, Chandigarh, Parul, Graphic Era..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Dynamic university chips with real-time database counts */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {filterOptions.universities.length > 0 ? (
                      filterOptions.universities.map((u) => (
                        <button
                          key={u.name}
                          type="button"
                          onClick={() => setFilterUniversity(filterUniversity === u.name ? '' : u.name)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all flex items-center gap-1 ${
                            filterUniversity === u.name
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                          }`}
                        >
                          <span>{u.name}</span>
                          <span className={`px-1 py-0.1 rounded-full text-[9px] font-black ${
                            filterUniversity === u.name ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {u.count}
                          </span>
                        </button>
                      ))
                    ) : (
                      ['Sharda University', 'Chandigarh University', 'Parul University'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setFilterUniversity(filterUniversity === u ? '' : u)}
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                            filterUniversity === u
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          {u}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="">All Statuses</option>
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Counseling Scheduled">Counseling Scheduled</option>
                      <option value="Interested">Interested</option>
                      <option value="Application Started">Application Started</option>
                      <option value="Documents Pending">Documents Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature</label>
                    <select
                      value={filterTemperature}
                      onChange={(e) => setFilterTemperature(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="">All Temperatures</option>
                      <option value="Hot">Hot (High Intent)</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    placeholder="e.g. Kathmandu, Pokhara, Janakpur..."
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Zero matches fallback notice */}
              {targetCount === 0 && !loadingCount && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No students match the current filter</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Zero leads found for {filterCourse ? `"${filterCourse}"` : ''} {filterUniversity ? `at "${filterUniversity}"` : ''}.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCourse('');
                        setFilterUniversity('');
                        setFilterStatus('');
                        setFilterTemperature('');
                        setFilterCity('');
                      }}
                      className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Clear Filters &amp; Target All ({filterOptions.totalLeadsWithEmail || 'All'} Leads)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sample Matching Students */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Sample Matched Students ({sampleLeads.length})</span>
                  <span className="text-[10px] text-slate-400">Total: {targetCount}</span>
                </div>
                {sampleLeads.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">
                    No matching leads found for these filters
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {sampleLeads.map((s, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{s.student_name}</span>
                          <span className="text-[11px] text-slate-400 ml-1.5 font-mono">({s.email})</span>
                        </div>
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                          {s.course || 'General'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Template Selector Card */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Select Course Email Template
                  </h3>
                  <p className="text-[11px] text-slate-500">Pick a pre-written, targeted outreach template</p>
                </div>
              </div>

              <div>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Template (or write custom) --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} [{t.category}] {t.target_courses?.length ? `(${t.target_courses.join(', ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplateId && (
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Template Loaded</span>
                  </div>
                  <p className="text-[11px] text-indigo-800/80">
                    Subject line and message body populated below. You can customize them freely before sending.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Composer, Merge Tags & Live Preview */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Email Campaign Composer</h2>
                    <p className="text-xs text-slate-500">Personalized content with dynamic variables</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    Recipients: <strong className="text-blue-700">{targetCount}</strong>
                  </span>
                </div>
              </div>

              {/* Campaign Title & Subject */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Campaign Internal Label
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={`e.g. October 2026 ${filterCourse || 'Engineering & Medical'} Admissions Blast`}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Email Subject Line *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Supports merge tags</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject with {{student_name}} or {{preferred_course}}..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Merge Tags Helper Toolbar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dynamic Merge Tags (Click to Insert)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Auto-replaces for each student</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{{student_name}}', desc: "Student's Full Name" },
                    { tag: '{{first_name}}', desc: "Student's First Name" },
                    { tag: '{{preferred_course}}', desc: 'Interested Course' },
                    { tag: '{{preferred_university}}', desc: 'Target University' },
                    { tag: '{{counselor_name}}', desc: 'Assigned Counselor' },
                    { tag: '{{counselor_phone}}', desc: 'Counselor Phone' },
                    { tag: '{{counselor_email}}', desc: 'Counselor Email' },
                    { tag: '{{application_id}}', desc: 'Application Ref' },
                    { tag: '{{deadline}}', desc: 'Deadline Date' },
                    { tag: '{{city}}', desc: 'Student City' }
                  ].map(({ tag, desc }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertMergeTag(tag)}
                      title={desc}
                      className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 font-bold transition-all shadow-2xs"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Message Body *</span>
                  <span className="text-[10px] text-slate-400">Plain text / formatted email</span>
                </label>
                <textarea
                  rows={10}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dear {{student_name}}, ..."
                  className="w-full p-3 text-xs rounded-2xl border border-slate-300 font-mono text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Student Merge Preview */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-amber-700" />
                    <span>Live Merge Preview (What Student Sees)</span>
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Sample Lead
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-2 text-xs">
                  <div className="border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-semibold">Subject: </span>
                    <strong className="text-slate-900">{previewSubject || subject}</strong>
                  </div>
                  <div className="text-slate-700 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {previewContent || content}
                  </div>
                </div>
              </div>

              {/* Dispatch Action Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-slate-500">
                  Ready to send to <strong className="text-slate-900">{targetCount} leads</strong> via verified mail gateway.
                </div>

                <button
                  type="button"
                  onClick={handleOpenSendConfirmation}
                  disabled={sending || targetCount === 0 || !canSendBulk}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-all ${
                    sending || targetCount === 0 || !canSendBulk
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 shadow-blue-900/20'
                  }`}
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Campaign...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send to {targetCount} Students</span>
                    </>
                  )}
                </button>
              </div>

              {/* Send Result Banner */}
              {sendResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Campaign Successfully Dispatched!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center font-semibold">
                    <div className="p-2 rounded-xl bg-white border border-emerald-100">
                      <div className="text-[10px] text-slate-400 uppercase">Targeted</div>
                      <div className="text-base text-slate-800 mt-0.5">{sendResult.total_recipients}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-emerald-100">
                      <div className="text-[10px] text-emerald-600 uppercase">Delivered</div>
                      <div className="text-base text-emerald-700 mt-0.5">{sendResult.sent_count}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-emerald-100">
                      <div className="text-[10px] text-rose-500 uppercase">Failed</div>
                      <div className="text-base text-rose-700 mt-0.5">{sendResult.failed_count}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE & UNIVERSITY EMAIL TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-5">
          {/* Templates Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs font-bold text-slate-700">Filter Templates:</div>
              <select
                value={templateFilterCategory}
                onChange={(e) => setTemplateFilterCategory(e.target.value)}
                className="p-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="">All Categories</option>
                <option value="COURSE_PROSPECTUS">Course Prospectus</option>
                <option value="APPLICATION_DEADLINE">Application Deadline</option>
                <option value="SCHOLARSHIP_OFFER">Scholarship Offer</option>
                <option value="FEE_REMINDER">Fee Reminder</option>
                <option value="COUNSELING_INVITE">Counseling Invitation</option>
                <option value="WELCOME">Welcome &amp; Introduction</option>
              </select>

              <input
                type="text"
                value={templateFilterCourse}
                onChange={(e) => setTemplateFilterCourse(e.target.value)}
                placeholder="Filter by course (e.g. MBBS, MBA)..."
                className="p-1.5 text-xs rounded-xl border border-slate-300 w-48"
              />
            </div>

            {canManageTemplates && (
              <button
                type="button"
                onClick={handleOpenAddTemplate}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Template</span>
              </button>
            )}
          </div>

          {/* Templates Grid */}
          {loadingTemplates ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Loading email templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Email Templates Found</h3>
              <p className="text-xs text-slate-400">Click "Create New Template" to add targeted outreach templates</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {tmpl.category.replace(/_/g, ' ')}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">{tmpl.name}</h3>
                      </div>

                      {canManageTemplates && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTemplate(tmpl)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Template"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {tmpl.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{tmpl.description}</p>
                    )}

                    {/* Target Courses Tags */}
                    {Array.isArray(tmpl.target_courses) && tmpl.target_courses.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Target Courses:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tmpl.target_courses.map((crs, i) => (
                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                              {crs}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Target Universities Tags */}
                    {Array.isArray(tmpl.target_universities) && tmpl.target_universities.length > 0 && (
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Target Universities:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tmpl.target_universities.map((uni, i) => (
                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {uni}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subject Line Preview */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Subject:</div>
                      <div className="text-slate-800 font-semibold line-clamp-1 mt-0.5">{tmpl.subject}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Channel: <strong className="text-slate-700">Email</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tmpl.id);
                        setSubject(tmpl.subject);
                        setContent(tmpl.content);
                        setActiveTab('send');
                        addToast(`Loaded template "${tmpl.name}" into composer`, 'success');
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span>Use in Campaign</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAMPAIGN HISTORY & DELIVERY LOGS */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bulk Email Campaign Logs</h2>
              <p className="text-xs text-slate-500">History of all dispatched bulk outreach batches</p>
            </div>
            <button
              type="button"
              onClick={fetchCampaigns}
              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingCampaigns ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span>Loading campaign logs...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No bulk email campaigns have been sent yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                    <th className="pb-2.5">Campaign Name</th>
                    <th className="pb-2.5">Subject</th>
                    <th className="pb-2.5">Target Course</th>
                    <th className="pb-2.5">University</th>
                    <th className="pb-2.5 text-center">Recipients</th>
                    <th className="pb-2.5 text-center">Sent</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5">Sent By</th>
                    <th className="pb-2.5">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-bold text-slate-900">{camp.name}</td>
                      <td className="py-3 text-slate-700 max-w-xs truncate" title={camp.subject}>
                        {camp.subject}
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                          {camp.filter_course || 'All Courses'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {camp.filter_university || 'All Partner Unis'}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">{camp.total_recipients}</td>
                      <td className="py-3 text-center font-bold text-emerald-700">{camp.sent_count}</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{camp.sent_by || 'Admin'}</td>
                      <td className="py-3 text-slate-400 text-[11px]">
                        {new Date(camp.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveTemplate}
            className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>{editingTemplate ? 'Edit Email Template' : 'Create Course / University Template'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define reusable outreach content with automated merge tag variables
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Template Name *</label>
                <input
                  required
                  type="text"
                  value={tmplName}
                  onChange={(e) => setTmplName(e.target.value)}
                  placeholder="e.g. MBBS Medical Seat Guidance 2026"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Template Category *</label>
                <select
                  value={tmplCategory}
                  onChange={(e) => setTmplCategory(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value="COURSE_PROSPECTUS">Course Prospectus</option>
                  <option value="APPLICATION_DEADLINE">Application Deadline</option>
                  <option value="SCHOLARSHIP_OFFER">Scholarship Offer</option>
                  <option value="FEE_REMINDER">Fee Reminder</option>
                  <option value="COUNSELING_INVITE">Counseling Invitation</option>
                  <option value="WELCOME">Welcome &amp; Introduction</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Courses (Comma-separated)
                </label>
                <input
                  type="text"
                  value={tmplCourses}
                  onChange={(e) => setTmplCourses(e.target.value)}
                  placeholder="e.g. B.Tech, MBBS, MBA, BCA"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Automatically recommended when this course is selected</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Universities (Comma-separated)
                </label>
                <input
                  type="text"
                  value={tmplUniversities}
                  onChange={(e) => setTmplUniversities(e.target.value)}
                  placeholder="e.g. Sharda University, Chandigarh University"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Internal Notes</label>
              <input
                type="text"
                value={tmplDescription}
                onChange={(e) => setTmplDescription(e.target.value)}
                placeholder="Short summary of this template's intent..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject Line *</label>
              <input
                required
                type="text"
                value={tmplSubject}
                onChange={(e) => setTmplSubject(e.target.value)}
                placeholder="Important: {{preferred_course}} Admissions at {{preferred_university}}"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-semibold"
              />
            </div>

            {/* Merge tags inserter helper */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Quick Merge Tags:</span>
              <div className="flex flex-wrap gap-1">
                {['{{student_name}}', '{{preferred_course}}', '{{preferred_university}}', '{{counselor_name}}', '{{counselor_phone}}', '{{deadline}}', '{{application_id}}'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTmplContent(prev => prev + ' ' + tag)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700 font-bold"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Body Content *</label>
              <textarea
                required
                rows={8}
                value={tmplContent}
                onChange={(e) => setTmplContent(e.target.value)}
                placeholder="Dear {{student_name}}, ..."
                className="w-full p-3 text-xs rounded-2xl border border-slate-300 font-mono text-slate-800 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-900/20"
              >
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IN-APP CONFIRMATION MODAL (Replaces browser window.confirm for Electron macOS reliability) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-900/20">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Confirm Bulk Outreach Dispatch</h3>
                  <p className="text-[11px] text-slate-500">Review campaign and target recipient details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={sending}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Recipients Count:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                  {targetCount} Students
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Target Course:</span>
                <span className="font-bold text-slate-800">{filterCourse || 'All Courses'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Target University:</span>
                <span className="font-bold text-slate-800">{filterUniversity || 'All Universities'}</span>
              </div>
              {filterTemperature && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Lead Temperature:</span>
                  <span className="font-bold text-slate-800">{filterTemperature}</span>
                </div>
              )}
              {filterStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Lead Status:</span>
                  <span className="font-bold text-slate-800">{filterStatus}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 font-medium block mb-1">Subject Preview:</span>
                <span className="font-semibold text-slate-800 block text-[11px] truncate bg-white p-2 rounded-xl border border-slate-200">
                  {previewSubject || subject}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100/90 text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Dynamic Merge Tags Active</span>
              </div>
              <p className="text-blue-800/80 leading-relaxed">
                Every recipient will receive an individualized email with their actual student name, chosen course, and counselor contact details.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={sending}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-900/20 active:scale-98 transition-all"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Emails...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm &amp; Send Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
