import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Smartphone,
  Sparkles,
  Users,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldAlert,
  Send,
  FileText,
  Building2,
  GraduationCap
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import {
  BroadcastCampaign,
  BroadcastChannel,
  BroadcastAudienceFilter,
  AudiencePreviewResult,
  EmailTemplate
} from '../../types';

interface BroadcastWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: BroadcastCampaign | null;
  templates: EmailTemplate[];
  userRole?: string;
  userName?: string;
}

export const BroadcastWizardModal: React.FC<BroadcastWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  templates,
  userRole = 'Super Admin',
  userName = 'Super Admin'
}) => {
  const { addToast } = useNotifications();
  const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Details
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<BroadcastChannel>('Email');
  const [senderName, setSenderName] = useState('Gems Group Services Admissions');
  const [senderEmail, setSenderEmail] = useState('admissions@gemsgroupservices.com');
  const [senderPhone, setSenderPhone] = useState('+977 9801234567');

  // Step 2: Audience Filter
  const [filterCourse, setFilterCourse] = useState('');
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTemperature, setFilterTemperature] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterCounselorId, setFilterCounselorId] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const [audiencePreview, setAudiencePreview] = useState<AudiencePreviewResult | null>(null);
  const [loadingAudience, setLoadingAudience] = useState(false);

  // Step 3: Content
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subject, setSubject] = useState('Exclusive Admission Offer & Scholarship Details: {{preferred_course}} at {{preferred_university}}');
  const [content, setContent] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'whatsapp' | 'email'>('email');

  // Step 4: Schedule & Submit
  const [scheduleMode, setScheduleMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  // Counselors list for filter
  const [counselorsList, setCounselorsList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.getCounselors().then(setCounselorsList).catch(() => {});
    }
  }, [isOpen]);

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name || '');
      setChannel(initialData.channel || 'Email');
      setSenderName(initialData.sender_name || 'Gems Group Services Admissions');
      setSenderEmail(initialData.sender_email || 'admissions@gemsgroupservices.com');
      setSenderPhone(initialData.sender_phone || '+977 9801234567');

      const f = initialData.filter_criteria || {};
      setFilterCourse(f.course || '');
      setFilterUniversity(f.university || '');
      setFilterStatus(f.status || '');
      setFilterTemperature(f.temperature || '');
      setFilterCity(f.city || '');
      setFilterSource(f.source || '');
      setFilterCounselorId(f.counselor_id || '');
      setFilterFromDate(f.from_date || '');
      setFilterToDate(f.to_date || '');

      setSubject(initialData.subject || '');
      setContent(initialData.content || '');
      setSelectedTemplateId(initialData.template_id || '');

      if (initialData.scheduled_at) {
        setScheduleMode('schedule');
        try {
          const d = new Date(initialData.scheduled_at);
          setScheduledAt(d.toISOString().slice(0, 16));
        } catch {
          setScheduledAt('');
        }
      } else {
        setScheduleMode('now');
        setScheduledAt('');
      }
    } else {
      // Default new campaign
      setName('');
      setChannel('Email');
      setSenderName('Gems Group Services Admissions');
      setSenderEmail('admissions@gemsgroupservices.com');
      setSenderPhone('+977 9801234567');
      setFilterCourse('');
      setFilterUniversity('');
      setFilterStatus('');
      setFilterTemperature('');
      setFilterCity('');
      setFilterSource('');
      setFilterCounselorId('');
      setFilterFromDate('');
      setFilterToDate('');
      setSelectedTemplateId('');
      setSubject('Exclusive Admission Offer & Scholarship Details: {{preferred_course}} at {{preferred_university}}');
      setContent(`Dear {{student_name}},

Namaste! Greetings from Gems Group Services.

We noticed your high interest in pursuing {{preferred_course}} at {{preferred_university}}. As an authorized admissions partner, we are pleased to inform you that merit-based scholarships (up to 50% tuition waiver) and direct seat allotments are now open for the upcoming intake.

Key Highlights for your program:
- Academic Program: {{preferred_course}}
- Institution: {{preferred_university}}
- Location: Recognized accredited campus
- Dedicated Support: 1-on-1 advisor allocated

Your Dedicated Admissions Counselor:
Name: {{counselor_name}}
Phone / WhatsApp: {{counselor_phone}}
Email: {{counselor_email}}
Application Reference: {{application_id}}

To confirm your provisional seat reservation before {{deadline}}, please reply directly to this communication.

Warm regards,
Admissions Directorate
Gems Group Services`);
      setScheduleMode('now');
      setScheduledAt('');
      setStep(1);
    }
  }, [isOpen, initialData]);

  // Set default preview tab when channel changes
  useEffect(() => {
    if (channel === 'WhatsApp') {
      setPreviewDevice('whatsapp');
    } else {
      setPreviewDevice('email');
    }
  }, [channel]);

  // Fetch Audience Preview when filters or channel change
  useEffect(() => {
    if (!isOpen || step !== 2) return;

    let active = true;
    const fetchAudience = async () => {
      setLoadingAudience(true);
      try {
        const filterCriteria: BroadcastAudienceFilter = {
          course: filterCourse || undefined,
          university: filterUniversity || undefined,
          status: filterStatus || undefined,
          temperature: filterTemperature || undefined,
          city: filterCity || undefined,
          source: filterSource || undefined,
          counselor_id: filterCounselorId || undefined,
          from_date: filterFromDate || undefined,
          to_date: filterToDate || undefined
        };

        const res = await api.previewBroadcastAudience({
          filter_criteria: filterCriteria,
          channel
        });
        if (active) {
          setAudiencePreview(res);
        }
      } catch (err: any) {
        console.warn('Audience preview error:', err);
      } finally {
        if (active) setLoadingAudience(false);
      }
    };

    const timer = setTimeout(fetchAudience, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    step,
    channel,
    filterCourse,
    filterUniversity,
    filterStatus,
    filterTemperature,
    filterCity,
    filterSource,
    filterCounselorId,
    filterFromDate,
    filterToDate
  ]);

  if (!isOpen) return null;

  // Insert merge tag
  const handleInsertTag = (tag: string) => {
    setContent(prev => prev + ` {{${tag}}} `);
  };

  // Select template
  const handleSelectTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    if (!tmplId) return;
    const tmpl = templates.find(t => t.id === tmplId);
    if (tmpl) {
      if (tmpl.subject) setSubject(tmpl.subject);
      setContent(tmpl.content);
      addToast(`Applied template "${tmpl.name}"`, 'info');
    }
  };

  // Submit action: 'draft' | 'approval' | 'direct_approve'
  const handleSubmitCampaign = async (actionType: 'draft' | 'approval' | 'direct_approve') => {
    if (!name.trim()) {
      addToast('Please enter a campaign name in Step 1', 'error');
      setStep(1);
      return;
    }
    if (!content.trim()) {
      addToast('Please enter message content in Step 3', 'error');
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const filterCriteria: BroadcastAudienceFilter = {
        course: filterCourse || undefined,
        university: filterUniversity || undefined,
        status: filterStatus || undefined,
        temperature: filterTemperature || undefined,
        city: filterCity || undefined,
        source: filterSource || undefined,
        counselor_id: filterCounselorId || undefined,
        from_date: filterFromDate || undefined,
        to_date: filterToDate || undefined
      };

      const payload = {
        name: name.trim(),
        channel,
        sender_name: senderName,
        sender_email: senderEmail,
        sender_phone: senderPhone,
        filter_criteria: filterCriteria,
        subject: subject.trim(),
        content: content.trim(),
        template_id: selectedTemplateId || undefined,
        scheduled_at: scheduleMode === 'schedule' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        submit_for_approval: actionType === 'approval' || actionType === 'direct_approve',
        performedBy: userName
      };

      let campaign: BroadcastCampaign;
      if (initialData?.id) {
        campaign = await api.updateBroadcastCampaign(initialData.id, payload);
        if (actionType === 'approval' && campaign.status === 'DRAFT') {
          campaign = await api.submitBroadcastForApproval(campaign.id, userName);
        }
      } else {
        campaign = await api.createBroadcastCampaign(payload);
      }

      // If admin selected Direct Approve
      if (actionType === 'direct_approve' && isAdmin) {
        await api.approveBroadcastCampaign(campaign.id, userName);
        if (scheduleMode === 'now') {
          await api.dispatchBroadcastCampaign(campaign.id, userName);
          addToast(`Campaign "${campaign.name}" approved & dispatched immediately!`, 'success');
        } else {
          addToast(`Campaign "${campaign.name}" approved & scheduled for ${new Date(scheduledAt).toLocaleString()}`, 'success');
        }
      } else if (actionType === 'approval') {
        addToast(`Campaign "${campaign.name}" submitted for approval!`, 'success');
      } else {
        addToast(`Campaign "${campaign.name}" saved as draft.`, 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to save broadcast campaign', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Interpolated Preview Text
  const previewStudent = audiencePreview?.sample_leads?.[0] || {
    student_name: 'Bikram Thapa',
    preferred_course: filterCourse || 'B.Tech Computer Science',
    preferred_university: filterUniversity || 'Sharda University',
    counselor_name: 'Suman Sharma',
    counselor_phone: '+977 9801234567',
    counselor_email: 'counselor@gemsgroupservices.com',
    application_id: 'APP-2026-0812'
  };

  const interpolate = (txt: string) => {
    return txt
      .replace(/\{\{\s*student_name\s*\}\}/g, previewStudent.student_name || 'Bikram Thapa')
      .replace(/\{\{\s*preferred_course\s*\}\}/g, previewStudent.preferred_course || 'B.Tech Computer Science')
      .replace(/\{\{\s*preferred_university\s*\}\}/g, previewStudent.preferred_university || 'Sharda University')
      .replace(/\{\{\s*counselor_name\s*\}\}/g, previewStudent.counselor_name || 'Suman Sharma')
      .replace(/\{\{\s*counselor_phone\s*\}\}/g, previewStudent.counselor_phone || '+977 9801234567')
      .replace(/\{\{\s*counselor_email\s*\}\}/g, previewStudent.counselor_email || 'counselor@gemsgroupservices.com')
      .replace(/\{\{\s*application_id\s*\}\}/g, previewStudent.application_id || 'APP-2026-0812')
      .replace(/\{\{\s*deadline\s*\}\}/g, '30th November 2026')
      .replace(/\{\{\s*unsubscribe_link\s*\}\}/g, 'https://education-sansar-crm.vercel.app/api/broadcasts/unsubscribe?token=sample')
      .replace(/\{\{\s*opt_out_instruction\s*\}\}/g, 'Reply STOP to unsubscribe from WhatsApp broadcast alerts.');
  };

  const previewSubject = interpolate(subject);
  const previewBody = interpolate(content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialData ? 'Edit Broadcast Campaign' : 'Create Multi-Channel Broadcast Campaign'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Target audiences, draft personalized messaging, route approvals, and schedule dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Navigation */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-white px-6 py-3 gap-2">
          {[
            { stepNum: 1, title: '1. Setup & Channel', icon: Smartphone },
            { stepNum: 2, title: '2. Audience Filter', icon: Users },
            { stepNum: 3, title: '3. Message & Preview', icon: FileText },
            { stepNum: 4, title: '4. Review & Schedule', icon: Calendar }
          ].map(s => {
            const isCurrent = step === s.stepNum;
            const isCompleted = step > s.stepNum;
            return (
              <button
                key={s.stepNum}
                onClick={() => setStep(s.stepNum)}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all text-left ${
                  isCurrent
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                    : isCompleted
                    ? 'text-emerald-700 hover:bg-slate-50'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? '✓' : s.stepNum}
                </div>
                <span className="truncate">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: SETUP & CHANNEL */}
          {step === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Campaign Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Fall 2026 B.Tech Admissions & Scholarship Announcement"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                />
              </div>

              {/* Channel Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Broadcast Delivery Channel <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div
                    onClick={() => setChannel('Email')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                      channel === 'Email'
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-slate-900">Email Broadcast</div>
                    <div className="text-xs text-slate-500">Delivered directly to student inbox with 1x1 open tracking pixel</div>
                  </div>

                  <div
                    onClick={() => setChannel('WhatsApp')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                      channel === 'WhatsApp'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-slate-900">WhatsApp Broadcast</div>
                    <div className="text-xs text-slate-500">High engagement WhatsApp message with STOP opt-out handling</div>
                  </div>

                  <div
                    onClick={() => setChannel('Both')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                      channel === 'Both'
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-slate-900">Multi-Channel (Both)</div>
                    <div className="text-xs text-slate-500">Maximum reach across both Email &amp; WhatsApp simultaneously</div>
                  </div>
                </div>
              </div>

              {/* Sender Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Sender &amp; Representation Information</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Sender Display Name</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Sender Email (From / Reply-To)</label>
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={e => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Sender WhatsApp Hotline</label>
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AUDIENCE FILTER & LIVE PREVIEW */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Audience Metric Counter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-700 uppercase">Target Deliverable Audience</div>
                    <div className="text-2xl font-black text-indigo-900 mt-1">
                      {loadingAudience ? 'Calculating...' : `${audiencePreview?.total_deliverable || 0} Leads`}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-700 uppercase">Opted-Out Excluded</div>
                    <div className="text-2xl font-black text-amber-900 mt-1">
                      {loadingAudience ? '...' : `${audiencePreview?.total_opted_out || 0} Leads`}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-600 uppercase">Total Matching Criteria</div>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      {loadingAudience ? '...' : `${audiencePreview?.total_matching || 0} Leads`}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-400 text-white flex items-center justify-center font-bold">
                    <Filter className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Filters Form */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Segment Criteria (Leave blank to target all leads)
                  </span>
                  <button
                    onClick={() => {
                      setFilterCourse('');
                      setFilterUniversity('');
                      setFilterStatus('');
                      setFilterTemperature('');
                      setFilterCity('');
                      setFilterSource('');
                      setFilterCounselorId('');
                      setFilterFromDate('');
                      setFilterToDate('');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Reset Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Preferred Course</label>
                    <input
                      type="text"
                      value={filterCourse}
                      onChange={e => setFilterCourse(e.target.value)}
                      placeholder="e.g. B.Tech, MBBS, MBA"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Preferred University</label>
                    <input
                      type="text"
                      value={filterUniversity}
                      onChange={e => setFilterUniversity(e.target.value)}
                      placeholder="e.g. Sharda, Parul"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Lead Status</label>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    >
                      <option value="">All Statuses</option>
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Counseling Scheduled">Counseling Scheduled</option>
                      <option value="Application Started">Application Started</option>
                      <option value="Documents Collected">Documents Collected</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Lead Temperature</label>
                    <select
                      value={filterTemperature}
                      onChange={e => setFilterTemperature(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    >
                      <option value="">All Temperatures</option>
                      <option value="HOT">HOT</option>
                      <option value="WARM">WARM</option>
                      <option value="COLD">COLD</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Target City</label>
                    <input
                      type="text"
                      value={filterCity}
                      onChange={e => setFilterCity(e.target.value)}
                      placeholder="e.g. Kathmandu, Birgunj"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Lead Source</label>
                    <input
                      type="text"
                      value={filterSource}
                      onChange={e => setFilterSource(e.target.value)}
                      placeholder="e.g. Meta Ads, Google Sheets"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Assigned Counselor</label>
                    <select
                      value={filterCounselorId}
                      onChange={e => setFilterCounselorId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    >
                      <option value="">All Counselors</option>
                      {counselorsList.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Created From Date</label>
                    <input
                      type="date"
                      value={filterFromDate}
                      onChange={e => setFilterFromDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Sample Leads Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Audience Sample Matches ({audiencePreview?.sample_leads?.length || 0} shown)
                  </span>
                  {audiencePreview?.total_opted_out && audiencePreview.total_opted_out > 0 ? (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      🛡️ {audiencePreview.total_opted_out} opted-out leads automatically excluded
                    </span>
                  ) : null}
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Student Name</th>
                        <th className="px-4 py-2.5">Email / Phone</th>
                        <th className="px-4 py-2.5">Course &amp; University</th>
                        <th className="px-4 py-2.5">City</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {audiencePreview?.sample_leads?.slice(0, 5).map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-bold text-slate-900">{l.student_name}</td>
                          <td className="px-4 py-2.5 text-slate-600">
                            <div>{l.email || 'No email'}</div>
                            <div className="text-[11px] text-slate-400">{l.whatsapp_number || l.phone}</div>
                          </td>
                          <td className="px-4 py-2.5 text-slate-700">
                            <div className="font-semibold">{l.preferred_course}</div>
                            <div className="text-[11px] text-slate-500">{l.preferred_university}</div>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{l.city || 'Nepal'}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {l.lead_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!audiencePreview?.sample_leads || audiencePreview.sample_leads.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400 font-medium">
                            No matching leads found for the selected filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONTENT COMPOSER & DEVICE PREVIEW */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Editor */}
              <div className="lg:col-span-7 space-y-4">
                {/* Template Selector */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Load from Template</label>
                    <select
                      value={selectedTemplateId}
                      onChange={e => handleSelectTemplate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold mt-1"
                    >
                      <option value="">Select an approved template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.channel}] {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Email Subject Line (for Email & Both) */}
                {(channel === 'Email' || channel === 'Both') && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Email Subject Line <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Admission Offer: {{preferred_course}} for {{student_name}}"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold mt-1"
                    />
                  </div>
                )}

                {/* Merge Tags Shortcuts */}
                <div>
                  <div className="text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                    Click to Insert Dynamic Merge Variables:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Student Name', tag: 'student_name' },
                      { label: 'Preferred Course', tag: 'preferred_course' },
                      { label: 'University', tag: 'preferred_university' },
                      { label: 'Counselor Name', tag: 'counselor_name' },
                      { label: 'Counselor Phone', tag: 'counselor_phone' },
                      { label: 'Counselor Email', tag: 'counselor_email' },
                      { label: 'Application ID', tag: 'application_id' },
                      { label: 'Deadline', tag: 'deadline' }
                    ].map(t => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => handleInsertTag(t.tag)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold border border-indigo-200 transition-all"
                      >
                        +{t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Editor */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={12}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Draft your broadcast message here..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium font-mono leading-relaxed mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{content.length} characters</span>
                    <span>Compliance footers (unsubscribe &amp; pixel) are automatically appended</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Device Mockup Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Live Device Mockup Preview</span>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('email')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        previewDevice === 'email' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Email View
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('whatsapp')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        previewDevice === 'whatsapp' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      WhatsApp View
                    </button>
                  </div>
                </div>

                {/* WhatsApp Device Preview */}
                {previewDevice === 'whatsapp' && (
                  <div className="rounded-3xl border-4 border-slate-800 bg-[#efeae2] p-4 shadow-xl flex flex-col min-h-[420px] max-h-[500px] overflow-y-auto font-sans">
                    {/* Chat Header */}
                    <div className="bg-[#075e54] text-white p-3 rounded-2xl flex items-center gap-2 mb-3 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                        GS
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs truncate">{senderName}</div>
                        <div className="text-[10px] text-emerald-100 opacity-90">Official Admissions Desk</div>
                      </div>
                    </div>

                    {/* Chat Bubble */}
                    <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-[#e5ddd5] text-xs text-slate-800 space-y-2 whitespace-pre-wrap leading-relaxed">
                      {previewBody}
                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold italic">
                        Reply STOP to unsubscribe from WhatsApp broadcast alerts.
                      </div>
                      <div className="text-[9px] text-slate-400 text-right">Just now ✓✓</div>
                    </div>
                  </div>
                )}

                {/* Email Device Preview */}
                {previewDevice === 'email' && (
                  <div className="rounded-3xl border border-slate-300 bg-white p-5 shadow-xl flex flex-col min-h-[420px] max-h-[500px] overflow-y-auto text-xs space-y-3 font-sans">
                    <div className="border-b border-slate-100 pb-3 space-y-1">
                      <div className="text-[11px] text-slate-400">
                        <span className="font-bold text-slate-600">From:</span> {senderName} &lt;{senderEmail}&gt;
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <span className="font-bold text-slate-600">To:</span> {previewStudent.student_name}
                      </div>
                      <div className="text-xs font-bold text-slate-900 pt-1">{previewSubject}</div>
                    </div>

                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed space-y-2 flex-1">
                      {previewBody}
                    </div>

                    {/* Compliance Unsubscribe Link Preview */}
                    <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center space-y-1">
                      <div>Gems Group Services | Sector 94, Noida, UP 201313</div>
                      <div>
                        To unsubscribe from broadcast updates,{' '}
                        <span className="text-indigo-600 underline font-semibold">click here</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW, SCHEDULE & APPROVAL */}
          {step === 4 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Summary Cards */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Campaign Summary</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Campaign:</span>{' '}
                    <span className="font-bold text-slate-900">{name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Channel:</span>{' '}
                    <span className="font-bold text-slate-900">{channel}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Target Audience:</span>{' '}
                    <span className="font-bold text-indigo-700">{audiencePreview?.total_deliverable || 0} Leads</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Opt-outs Excluded:</span>{' '}
                    <span className="font-bold text-amber-700">{audiencePreview?.total_opted_out || 0} Leads</span>
                  </div>
                </div>
              </div>

              {/* Schedule Mode */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dispatch Timing</div>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setScheduleMode('now')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      scheduleMode === 'now'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Send Immediately</div>
                      <div className="text-[11px] text-slate-500">Dispatch upon admin approval</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setScheduleMode('schedule')}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      scheduleMode === 'schedule'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                      ⏰
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Schedule for Later</div>
                      <div className="text-[11px] text-slate-500">Auto-dispatch at chosen date &amp; time</div>
                    </div>
                  </div>
                </div>

                {scheduleMode === 'schedule' && (
                  <div className="p-4 rounded-2xl bg-white border border-indigo-200 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Select Date &amp; Time for Dispatch</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Approval Workflow Notice */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <div className="font-bold">Approval Workflow Active</div>
                  <div>
                    Broadcast campaigns require management review before reaching student devices. Counselors submit
                    campaigns to the approval queue. Super Admins and Marketing Managers can review content and approve or
                    reject with feedback.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitCampaign('draft')}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Save as Draft
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitCampaign('approval')}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all shadow-sm"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Submit for Approval
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSubmitCampaign('direct_approve')}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {scheduleMode === 'now' ? 'Approve & Send Now' : 'Approve & Schedule'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
