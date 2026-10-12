import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  FileEdit,
  UserCheck,
  Building2,
  GraduationCap,
  Award,
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  Flame,
  Sun,
  Snowflake,
  Upload,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Check,
  Landmark,
  SlidersHorizontal,
  Edit2,
  DollarSign,
  MapPin,
  ExternalLink,
  Search,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Lead, Application, DocumentItem, FollowUp, LeadActivityItem, LeadStatus, UniversityCourse } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { canAssignCounselor } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activities, setActivities] = useState<LeadActivityItem[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'preferences' | 'finder' | 'applications' | 'documents' | 'timeline' | 'followups'>('profile');

  // Modals
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);

  // Form states
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('Phone Call');
  const [fupDate, setFupDate] = useState('');
  const [fupTime, setFupTime] = useState('11:00');
  const [fupType, setFupType] = useState('Call');
  const [fupNotes, setFupNotes] = useState('');
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [newAppUni, setNewAppUni] = useState('');
  const [newAppCourse, setNewAppCourse] = useState('');
  const [newAppFee, setNewAppFee] = useState('1200');
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('10th Marksheet');

  // Finder states (Sections 8, 9, 20)
  const [finderSearch, setFinderSearch] = useState('');
  const [finderStream, setFinderStream] = useState('');
  const [finderLevel, setFinderLevel] = useState('');
  const [finderMaxBudget, setFinderMaxBudget] = useState<number | ''>('');
  const [finderResults, setFinderResults] = useState<UniversityCourse[]>([]);
  const [finderLoading, setFinderLoading] = useState(false);
  const [selectedToCompare, setSelectedToCompare] = useState<string[]>([]);
  const [showFinderCompareModal, setShowFinderCompareModal] = useState(false);
  const [finderCompareData, setFinderCompareData] = useState<UniversityCourse[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);

  // Edit Lead fields
  const [editParentName, setEditParentName] = useState('');
  const [editSchoolCollege, setEditSchoolCollege] = useState('');
  const [editPassingYear, setEditPassingYear] = useState('');
  const [editPriority, setEditPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [editQualification, setEditQualification] = useState('');
  const [editP10, setEditP10] = useState('');
  const [editP12, setEditP12] = useState('');
  const [editGrad, setEditGrad] = useState('');
  const [editEntranceExam, setEditEntranceExam] = useState('');
  const [editEntranceScore, setEditEntranceScore] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const loadLeadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.getLead(id);
      setLead(res.lead);
      setApplications(res.applications || []);
      setDocuments(res.documents || []);
      setActivities(res.activities || []);
      setFollowups(res.followups || []);
      setStatusHistory(res.statusHistory || []);
      setAssignmentHistory(res.assignmentHistory || []);
      if (!finderSearch && res.lead?.preferred_course) {
        setFinderSearch(res.lead.preferred_course);
      }
    } catch (err: any) {
      showToast('Error loading student profile: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const searchUniversityCourses = async (overrideSearch?: string) => {
    setFinderLoading(true);
    try {
      const q = overrideSearch !== undefined ? overrideSearch : finderSearch;
      const data = await api.getUniversityCourses({
        search: q,
        stream: finderStream,
        course_level: finderLevel,
        max_fee: finderMaxBudget ? String(finderMaxBudget) : ''
      });
      setFinderResults(data);
    } catch (err: any) {
      showToast('Error searching courses: ' + err.message, 'error');
    } finally {
      setFinderLoading(false);
    }
  };

  const handleStartAppForFinder = (item: UniversityCourse) => {
    setNewAppUni(item.university_name);
    setNewAppCourse(item.course_name);
    setNewAppFee('1200');
    setShowNewAppModal(true);
  };

  const handleSetPreferred = async (item: UniversityCourse) => {
    if (!lead) return;
    try {
      await api.updateLead(lead.id, {
        preferred_university: item.university_name,
        preferred_course: item.course_name
      });
      showToast(`Preferred choice updated to ${item.course_name} at ${item.university_name}!`, 'success');
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const toggleCompareFinder = (id: string) => {
    setSelectedToCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 5) {
          showToast('You can compare up to 5 universities side-by-side', 'warning');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleOpenFinderCompare = async () => {
    if (selectedToCompare.length < 2) {
      showToast('Please select at least 2 universities to compare', 'warning');
      return;
    }
    setCompareLoading(true);
    setShowFinderCompareModal(true);
    try {
      const data = await api.compareUniversityCourses(selectedToCompare);
      setFinderCompareData(data);
    } catch (err: any) {
      showToast('Comparison failed: ' + err.message, 'error');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleOpenEditLeadModal = () => {
    if (!lead) return;
    setEditParentName(lead.parent_name || '');
    setEditSchoolCollege(lead.school_college || '');
    setEditPassingYear(lead.passing_year ? String(lead.passing_year) : '');
    setEditPriority(lead.priority || 'MEDIUM');
    setEditQualification(lead.academic_qualification || '');
    setEditP10(lead.percentage_10th ? String(lead.percentage_10th) : '');
    setEditP12(lead.percentage_12th ? String(lead.percentage_12th) : '');
    setEditGrad(lead.graduation_percentage ? String(lead.graduation_percentage) : '');
    setEditEntranceExam(lead.entrance_exam || '');
    setEditEntranceScore(lead.entrance_score || '');
    setEditBudget(lead.budget || '');
    setEditRemarks(lead.remarks || '');
    setShowEditLeadModal(true);
  };

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    try {
      await api.updateLead(lead.id, {
        parent_name: editParentName,
        school_college: editSchoolCollege,
        passing_year: editPassingYear ? parseInt(editPassingYear, 10) : undefined,
        priority: editPriority,
        academic_qualification: editQualification,
        percentage_10th: editP10 ? parseFloat(editP10) : undefined,
        percentage_12th: editP12 ? parseFloat(editP12) : undefined,
        graduation_percentage: editGrad ? parseFloat(editGrad) : undefined,
        entrance_exam: editEntranceExam,
        entrance_score: editEntranceScore,
        budget: editBudget,
        remarks: editRemarks,
      });
      showToast('Student academic details updated successfully', 'success');
      setShowEditLeadModal(false);
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    loadLeadDetails();
    api.getCounselors().then(setCounselors).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (activeTab === 'finder') {
      searchUniversityCourses();
    }
  }, [activeTab, finderStream, finderLevel, finderMaxBudget]);

  if (loading && !lead) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading student lead profile...</span>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-base font-bold text-slate-800">Lead not found</h2>
        <button
          onClick={() => navigate('/leads')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      await api.addLeadActivity(lead.id, {
        activity_type: noteType,
        title: `${noteType} Entry`,
        description: noteContent,
        performed_by: 'Counselor / Staff'
      });
      showToast('Interaction logged in timeline', 'success');
      setNoteContent('');
      setShowNoteModal(false);
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fupDate) return;

    try {
      await api.createFollowup({
        lead_id: lead.id,
        counselor_id: lead.assigned_counselor_id,
        follow_up_date: fupDate,
        follow_up_time: fupTime,
        type: fupType,
        priority: 'HIGH',
        notes: fupNotes || 'Scheduled via Lead Profile',
        performedBy: 'Counselor'
      });
      showToast('Follow-up scheduled successfully', 'success');
      setFupNotes('');
      setShowFollowupModal(false);
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReassign = async () => {
    if (!selectedCounselorId) return;
    try {
      await api.reassignLead(lead.id, selectedCounselorId, 'Admin User');
      showToast('Lead successfully reassigned', 'success');
      setShowReassignModal(false);
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppUni || !newAppCourse) return;

    try {
      await api.createApplication({
        lead_id: lead.id,
        university_name: newAppUni,
        course_name: newAppCourse,
        application_fee: parseFloat(newAppFee) || 0,
        performedBy: 'Counselor'
      });
      showToast('University application created', 'success');
      setShowNewAppModal(false);
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    try {
      await api.uploadDocument({
        lead_id: lead.id,
        file_name: docName,
        document_type: docType,
        uploaded_by: 'Counselor'
      });
      showToast('Document uploaded successfully', 'success');
      setDocName('');
      setShowUploadDocModal(false);
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusUpdate = async (newStatus: LeadStatus) => {
    try {
      await api.updateLead(lead.id, { lead_status: newStatus });
      showToast(`Status updated to ${newStatus}`, 'success');
      loadLeadDetails();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/leads')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Leads Queue</span>
      </button>

      {/* 1. Header Card (Section 11) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-900/20">
              {lead.student_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{lead.student_name}</h1>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {lead.lead_id}
                </span>
                {lead.is_demo === 1 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    DEMO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span>📍 {lead.city}, {lead.country}</span>
                <span>·</span>
                <span>🎓 {lead.preferred_course}</span>
                <span>·</span>
                <span>🏛️ {lead.preferred_university}</span>
              </p>
            </div>
          </div>

          {/* Status & Temp */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">Temp:</span>
              <span className="font-bold flex items-center gap-1">
                {lead.lead_temperature === 'HOT' ? (
                  <span className="text-rose-600 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> HOT</span>
                ) : lead.lead_temperature === 'WARM' ? (
                  <span className="text-amber-600 flex items-center gap-1"><Sun className="w-3.5 h-3.5" /> WARM</span>
                ) : (
                  <span className="text-blue-500 flex items-center gap-1"><Snowflake className="w-3.5 h-3.5" /> COLD</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">Counselor:</span>
              <span className="font-semibold text-slate-800">
                {lead.assigned_counselor_name || 'Unassigned'}
              </span>
            </div>

            {/* Status Select */}
            <select
              value={lead.lead_status}
              onChange={e => handleStatusUpdate(e.target.value as LeadStatus)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-blue-300 bg-blue-50 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="New Lead">New Lead</option>
              <option value="Contacted">Contacted</option>
              <option value="Counseling Scheduled">Counseling Scheduled</option>
              <option value="Counseling Done">Counseling Done</option>
              <option value="Interested">Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Eligible">Eligible</option>
              <option value="Not Eligible">Not Eligible</option>
              <option value="Application Started">Application Started</option>
              <option value="Documents Pending">Documents Pending</option>
              <option value="Documents Submitted">Documents Submitted</option>
              <option value="Offer Letter Issued">Offer Letter Issued</option>
              <option value="Admission Confirmed">Admission Confirmed 🎉</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>
        </div>

        {/* Quick Action Button Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call ({lead.phone})</span>
          </a>

          <a
            href={`https://wa.me/${lead.whatsapp_number.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={() => {
              setActiveTab('finder');
              searchUniversityCourses();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold border border-purple-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Find University &amp; Fees</span>
          </button>

          <button
            onClick={handleOpenEditLeadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile &amp; Academics</span>
          </button>

          <button
            onClick={() => setShowFollowupModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Follow-up</span>
          </button>

          <button
            onClick={() => setShowNoteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Add Note / Call Log</span>
          </button>

          {canAssignCounselor && (
            <button
              onClick={() => {
                setSelectedCounselorId(lead.assigned_counselor_id || '');
                setShowReassignModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Reassign</span>
            </button>
          )}

          <button
            onClick={() => setShowNewAppModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold ml-auto shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Application</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-medium text-slate-600 gap-1">
        {[
          { key: 'profile', label: 'Personal Information' },
          { key: 'academic', label: 'Academic & Entrance' },
          { key: 'preferences', label: 'Course Preferences' },
          { key: 'finder', label: '⚡ University & Course Finder' },
          { key: 'applications', label: `Applications (${applications.length})` },
          { key: 'documents', label: `Documents (${documents.length})` },
          { key: 'timeline', label: `Communication Timeline (${activities.length})` },
          { key: 'followups', label: `Follow-ups (${followups.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2.5 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Personal Info */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="text-slate-400 font-medium">Full Name</div>
            <div className="text-slate-900 font-bold mt-1 text-sm">{lead.student_name}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Phone Number</div>
            <div className="text-slate-900 font-mono font-semibold mt-1">{lead.phone}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">WhatsApp Number</div>
            <div className="text-slate-900 font-mono font-semibold mt-1">{lead.whatsapp_number}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Parent / Guardian Name</div>
            <div className="text-slate-900 font-semibold mt-1">{lead.parent_name || 'Not provided'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Email Address</div>
            <div className="text-slate-900 font-medium mt-1">{lead.email || 'N/A'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Lead Priority</div>
            <div className="mt-1">
              <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                lead.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                lead.priority === 'LOW' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {lead.priority || 'MEDIUM'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Target Region &amp; City</div>
            <div className="text-slate-900 font-semibold mt-1">{lead.city}, {lead.country}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">School / College Attended</div>
            <div className="text-slate-900 font-medium mt-1">{lead.school_college || 'Not recorded'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Passing Year</div>
            <div className="text-slate-900 font-medium mt-1">{lead.passing_year || 'N/A'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Lead Source &amp; Campaign</div>
            <div className="text-slate-900 font-medium mt-1">
              {lead.lead_source} {lead.campaign ? `(${lead.campaign})` : ''}
            </div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Created On</div>
            <div className="text-slate-900 font-medium mt-1">{lead.lead_created_date}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Last Contact Date</div>
            <div className="text-slate-900 font-medium mt-1">{lead.last_contact_date || 'Never'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Next Scheduled Follow-up</div>
            <div className="text-slate-900 font-medium mt-1">{lead.next_follow_up_date || 'None'}</div>
          </div>
          <div className="sm:col-span-3">
            <div className="text-slate-400 font-medium">Counselor Remarks</div>
            <div className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
              {lead.remarks || 'No remarks recorded yet.'}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Academic Info */}
      {activeTab === 'academic' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">Qualification</div>
              <div className="text-slate-900 font-bold text-sm mt-1">{lead.academic_qualification || 'N/A'}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">10th / SEE Score</div>
              <div className="text-slate-900 font-bold text-base mt-1">
                {lead.percentage_10th ? `${lead.percentage_10th}%` : 'N/A'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">12th / +2 Score</div>
              <div className="text-slate-900 font-bold text-base mt-1">
                {lead.percentage_12th ? `${lead.percentage_12th}%` : 'N/A'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">Graduation %</div>
              <div className="text-slate-900 font-bold text-base mt-1">
                {lead.graduation_percentage ? `${lead.graduation_percentage}%` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">School / College Attended</div>
              <div className="text-slate-900 font-semibold text-sm mt-1">{lead.school_college || 'Not recorded'}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-slate-400 font-medium">Passing Year</div>
              <div className="text-slate-900 font-semibold text-sm mt-1">{lead.passing_year || 'N/A'}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
            <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider mb-2">
              Entrance Exam Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500">Exam Name:</span>{' '}
                <span className="font-semibold text-slate-800">{lead.entrance_exam || 'None Reported'}</span>
              </div>
              <div>
                <span className="text-slate-500">Score / Percentile / Rank:</span>{' '}
                <span className="font-semibold text-slate-800">{lead.entrance_score || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-slate-400 font-semibold uppercase text-[10px]">Primary Preference</div>
            <div className="text-base font-bold text-slate-900">{lead.preferred_course}</div>
            <div className="text-sm font-semibold text-blue-600">{lead.preferred_university}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-slate-400 font-semibold uppercase text-[10px]">Second Choice / Backup</div>
            <div className="text-sm font-bold text-slate-800">{lead.second_university || 'None Specified'}</div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Family Budget Expectation</div>
            <div className="text-slate-900 font-bold text-sm mt-1">{lead.budget || 'Not discussed'}</div>
          </div>

          <div>
            <div className="text-slate-400 font-medium">Scholarship Assistance</div>
            <div className="mt-1">
              {lead.scholarship_required === 1 ? (
                <span className="px-2.5 py-1 rounded-full text-emerald-800 bg-emerald-100 font-bold">
                  ✓ Scholarship Assistance Requested
                </span>
              ) : (
                <span className="text-slate-500">Self-Financed / Standard</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: University & Course Finder (Sections 8, 9, 20) */}
      {activeTab === 'finder' && (
        <div className="space-y-5">
          {/* Finder Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Fast University &amp; Course Matcher
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Filter university programs by student's target degree, city, and annual budget.
                </p>
              </div>

              {selectedToCompare.length >= 2 && (
                <button
                  onClick={handleOpenFinderCompare}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-900/20 flex items-center gap-1.5 animate-pulse"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Compare Selected ({selectedToCompare.length})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <input
                  type="text"
                  value={finderSearch}
                  onChange={e => setFinderSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchUniversityCourses()}
                  placeholder="Course (e.g. B.Tech, MBA, BCA)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <select
                value={finderStream}
                onChange={e => setFinderStream(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="">All Academic Streams</option>
                <option value="Engineering & Technology">Engineering</option>
                <option value="Management & Business">Management</option>
                <option value="Medical & Health Sciences">Medical &amp; Paramedical</option>
                <option value="Computer Applications & IT">Computer Applications &amp; IT</option>
                <option value="Law & Legal Studies">Law</option>
                <option value="General">General</option>
              </select>

              <select
                value={finderLevel}
                onChange={e => setFinderLevel(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="">All Degree Levels</option>
                <option value="Undergraduate">Undergraduate (UG)</option>
                <option value="Postgraduate">Postgraduate (PG)</option>
                <option value="Diploma">Diploma / Polytechnic</option>
              </select>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => searchUniversityCourses()}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Matches</span>
                </button>
              </div>
            </div>

            {/* Budget Quick Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" /> Max 1st Yr Budget:
                </span>
                {[
                  { label: 'Any', value: '' },
                  { label: '≤ ₹3L', value: 300000 },
                  { label: '≤ ₹5L', value: 500000 },
                  { label: '≤ ₹8L', value: 800000 },
                  { label: '≤ ₹12L', value: 1200000 },
                ].map(b => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setFinderMaxBudget(b.value as any)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      finderMaxBudget === b.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              <span className="text-slate-500 font-medium">
                Found <strong className="text-slate-900">{finderResults.length}</strong> matching options
              </span>
            </div>
          </div>

          {/* Results Grid */}
          {finderLoading ? (
            <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
              <span>Matching universities &amp; fee structures...</span>
            </div>
          ) : finderResults.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Landmark className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">No programs match this search</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Try loosening the course keyword or selecting a higher budget tier.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finderResults.map(item => {
                const isSelected = selectedToCompare.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all space-y-3 ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-blue-300 shadow-xs'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                              {item.course_level || 'Undergraduate'}
                            </span>
                            {item.stream && (
                              <span className="text-[10px] text-slate-500 font-medium truncate">
                                {item.stream}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">
                            {item.course_name}
                          </h4>
                          <div className="text-xs font-semibold text-blue-800 flex items-center gap-1 mt-0.5">
                            <Landmark className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{item.university_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.university_city}, {item.university_state}</span>
                            {item.university_ranking && (
                              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                                {item.university_ranking}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Compare check */}
                        <button
                          onClick={() => toggleCompareFinder(item.id)}
                          className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                              : 'border-slate-300 hover:border-purple-400 text-transparent'
                          }`}
                          title="Select to compare side-by-side"
                        >
                          <Check className="w-3.5 h-3.5 stroke-3" />
                        </button>
                      </div>

                      {/* Fee Box */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Tuition Fee / Yr:</span>
                          <span className="font-bold text-slate-900 font-mono">
                            ₹{item.tuition_fee_per_year.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Hostel &amp; Mess:</span>
                          <span className="font-medium text-slate-700 font-mono">
                            ₹{item.hostel_fee_per_year.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                          <span className="text-blue-900">1st Year Est Total:</span>
                          <span className="text-blue-700 text-sm font-mono font-extrabold">
                            ₹{item.total_first_year_fee.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Scholarship info */}
                      {item.scholarship_details && (
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 text-[11px] font-medium border border-emerald-100 flex items-start gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span><strong>Scholarship:</strong> {item.scholarship_details}</span>
                        </div>
                      )}

                      {/* Eligibility */}
                      {item.eligibility_notes && (
                        <div className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">Eligibility:</span> {item.eligibility_notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSetPreferred(item)}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                        title="Set as preferred choice on student profile"
                      >
                        Set as Preferred
                      </button>

                      <button
                        onClick={() => handleStartAppForFinder(item)}
                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Start Application</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Applications (Section 15) */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              One student can hold multiple university applications concurrently.
            </p>
            <button
              onClick={() => setShowNewAppModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>New University Application</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {applications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No university applications filed for this lead yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">App ID</th>
                    <th className="py-3 px-4 font-semibold">University</th>
                    <th className="py-3 px-4 font-semibold">Course</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">App Fee</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {applications.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{a.application_id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{a.university_name}</td>
                      <td className="py-3.5 px-4">{a.course_name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{a.application_date}</td>
                      <td className="py-3.5 px-4">
                        ₹{a.application_fee} ({a.payment_status})
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {a.application_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Documents (Section 19) */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Official student marksheets, ID proof and admission letters.
            </p>
            <button
              onClick={() => setShowUploadDocModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {documents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No documents uploaded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Document Type</th>
                    <th className="py-3 px-4 font-semibold">File Name</th>
                    <th className="py-3 px-4 font-semibold">Uploaded By</th>
                    <th className="py-3 px-4 font-semibold">Upload Date</th>
                    <th className="py-3 px-4 font-semibold">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {documents.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{d.document_type}</td>
                      <td className="py-3.5 px-4 text-blue-600 hover:underline cursor-pointer">{d.file_name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{d.uploaded_by}</td>
                      <td className="py-3.5 px-4 text-slate-500">{d.upload_date}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.verification_status === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.verification_status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.verification_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Communication Timeline (Section 12) */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Communication &amp; Activity Timeline</h3>
              <p className="text-xs text-slate-500">Every phone call, WhatsApp, note, counselor assignment, and status change</p>
            </div>
            <button
              onClick={() => setShowNoteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Activity</span>
            </button>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No activity recorded yet.</div>
            ) : (
              activities.map(act => (
                <div key={act.id} className="relative group">
                  <div className="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 ring-2 ring-blue-100" />
                  <div className="bg-slate-50 hover:bg-blue-50/40 p-4 rounded-xl border border-slate-200/80 transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">{act.title}</span>
                      <span className="text-[11px] text-slate-400">{act.created_at}</span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{act.description}</p>
                    <div className="text-[10px] text-slate-400 mt-2 font-medium">
                      By {act.performed_by} · Type: <span className="text-blue-600">{act.activity_type}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Follow-ups (Section 13) */}
      {activeTab === 'followups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Scheduled counselor touchpoints and reminders.
            </p>
            <button
              onClick={() => setShowFollowupModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Follow-up</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {followups.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No follow-ups scheduled for this lead.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {followups.map(f => (
                  <div key={f.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{f.type}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                          {f.priority}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          f.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {f.status}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">{f.notes || 'No description'}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Scheduled for: <span className="font-semibold text-slate-700">{f.follow_up_date} at {f.follow_up_time}</span>
                      </div>
                    </div>

                    {f.status === 'Pending' && (
                      <button
                        onClick={async () => {
                          await api.completeFollowup(f.id, 'Completed from lead detail');
                          showToast('Follow-up marked completed', 'success');
                          loadLeadDetails();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Log Interaction / Note */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form onSubmit={handleAddNote} className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Log Student Interaction</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interaction Type</label>
              <select
                value={noteType}
                onChange={e => setNoteType(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              >
                <option value="Phone Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Meeting">Meeting / Zoom</option>
                <option value="Email">Email</option>
                <option value="Note">General Note</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Summary</label>
              <textarea
                required
                rows={4}
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Discussion summary, student preferences, parental input..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNoteModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Save to Timeline
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Schedule Follow-up */}
      {showFollowupModal && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form onSubmit={handleScheduleFollowup} className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Schedule Follow-up</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={fupDate}
                  onChange={e => setFupDate(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                <input
                  type="time"
                  value={fupTime}
                  onChange={e => setFupTime(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={fupType}
                onChange={e => setFupType(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              >
                <option value="Call">Call</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Meeting">Meeting</option>
                <option value="Document Follow-up">Document Follow-up</option>
                <option value="Fee Follow-up">Fee Follow-up</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Agenda / Objectives</label>
              <textarea
                rows={3}
                value={fupNotes}
                onChange={e => setFupNotes(e.target.value)}
                placeholder="Objectives for next contact..."
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowFollowupModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Reassign Counselor */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reassign Lead Counselor</h3>
            <p className="text-xs text-slate-500">
              Current Counselor: <span className="font-bold text-slate-800">{lead.assigned_counselor_name || 'Unassigned'}</span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select New Counselor</label>
              <select
                value={selectedCounselorId}
                onChange={e => setSelectedCounselorId(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              >
                <option value="">Select Counselor</option>
                {counselors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.current_active_leads} leads active)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowReassignModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleReassign} className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Application */}
      {showNewAppModal && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form onSubmit={handleCreateApp} className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">New University Application</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">University Name</label>
              <input
                required
                type="text"
                value={newAppUni}
                onChange={e => setNewAppUni(e.target.value)}
                placeholder="e.g. SRM Institute of Science and Technology"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name</label>
              <input
                required
                type="text"
                value={newAppCourse}
                onChange={e => setNewAppCourse(e.target.value)}
                placeholder="e.g. B.Tech Computer Science & Engineering"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Application Fee (₹)</label>
              <input
                type="number"
                value={newAppFee}
                onChange={e => setNewAppFee(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewAppModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Upload Document */}
      {showUploadDocModal && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form onSubmit={handleUploadDoc} className="w-full max-w-md bg-white rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Upload Student Document</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              >
                <option value="10th Marksheet">10th Marksheet / SEE</option>
                <option value="12th Marksheet">12th Marksheet / +2</option>
                <option value="Citizenship">Citizenship / National ID</option>
                <option value="Passport">Passport</option>
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Entrance Exam Score">Entrance Exam Scorecard</option>
                <option value="Offer Letter">Offer Letter</option>
                <option value="Fee Receipt">Fee Receipt</option>
                <option value="Other">Other Certificate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">File Name</label>
              <input
                required
                type="text"
                value={docName}
                onChange={e => setDocName(e.target.value)}
                placeholder="e.g. Ramesh_Karki_12th_Transcript.pdf"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowUploadDocModal(false)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                Save Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Fast University Comparison (Finder Tab) */}
      {showFinderCompareModal && (
        <div className="fixed inset-0 z-50 p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Fast University &amp; Fee Comparison
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing {finderCompareData.length} selected programs for {lead.name}
                </p>
              </div>
              <button
                onClick={() => setShowFinderCompareModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-x-auto flex-1">
              {compareLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                  <span>Loading comparative fee metrics...</span>
                </div>
              ) : finderCompareData.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No comparison data returned.
                </div>
              ) : (
                <div className="min-w-[650px]">
                  <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                    {/* Row 1: University */}
                    <div className="bg-slate-100 p-3 font-bold text-xs text-slate-700 flex items-center">
                      University
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 bg-purple-50/30 space-y-1">
                        <div className="font-bold text-xs text-blue-900">{c.university_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {c.university_city}, {c.university_state}
                        </div>
                        {c.university_ranking && (
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {c.university_ranking}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Row 2: Program & Level */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Program &amp; Level
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 space-y-1">
                        <div className="font-bold text-xs text-slate-800">{c.course_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {c.course_level} ({c.course_duration || '4 Years'})
                        </div>
                      </div>
                    ))}

                    {/* Row 3: Annual Tuition */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Annual Tuition
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 font-bold text-sm text-slate-900 font-mono">
                        ₹{c.tuition_fee_per_year.toLocaleString('en-IN')}
                      </div>
                    ))}

                    {/* Row 4: Hostel & Mess */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Hostel &amp; Mess / Yr
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 text-xs font-mono text-slate-700">
                        ₹{c.hostel_fee_per_year.toLocaleString('en-IN')}
                      </div>
                    ))}

                    {/* Row 5: 1st Year Estimated Cost */}
                    <div className="bg-blue-50/70 p-3 font-bold text-xs text-blue-950 flex items-center">
                      Total 1st Year Est.
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 bg-blue-50/70 font-extrabold text-sm text-blue-700 font-mono">
                        ₹{c.total_first_year_fee.toLocaleString('en-IN')}
                      </div>
                    ))}

                    {/* Row 6: Total Course Cost */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Full Course Est.
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 font-bold text-xs text-slate-800 font-mono">
                        ₹{c.total_full_course_fee.toLocaleString('en-IN')}
                      </div>
                    ))}

                    {/* Row 7: Scholarship */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Scholarship Offer
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 text-xs text-emerald-800 bg-emerald-50/40">
                        {c.scholarship_details || 'Standard merit quota applies'}
                      </div>
                    ))}

                    {/* Row 8: Eligibility */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Eligibility
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 text-xs text-slate-600">
                        {c.eligibility_notes || c.course_eligibility || '50%+ in 10+2'}
                      </div>
                    ))}

                    {/* Row 9: Application Deadline */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Deadline
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 text-xs font-semibold text-rose-700">
                        {c.application_deadline || 'Open / Rolling'}
                      </div>
                    ))}

                    {/* Row 10: Counseling Fast Actions */}
                    <div className="bg-slate-100 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Action
                    </div>
                    {finderCompareData.map((c) => (
                      <div key={c.id} className="p-3 flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            handleSetPreferred(c);
                            setShowFinderCompareModal(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200"
                        >
                          Set Preferred
                        </button>
                        <button
                          onClick={() => {
                            handleStartAppForFinder(c);
                            setShowFinderCompareModal(false);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                        >
                          Start App
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setShowFinderCompareModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Student Profile & Academic Details */}
      {showEditLeadModal && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveEditLead}
            className="w-full max-w-2xl bg-white rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  Edit Student Profile &amp; Academic Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update guardian contacts, priority, scores, and admission eligibility
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditLeadModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  value={editParentName}
                  onChange={e => setEditParentName(e.target.value)}
                  placeholder="Father / Mother / Guardian"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lead Urgency / Priority
                </label>
                <select
                  value={editPriority}
                  onChange={e => setEditPriority(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                >
                  <option value="HIGH">HIGH (Urgent / Immediate)</option>
                  <option value="MEDIUM">MEDIUM (Standard Follow-up)</option>
                  <option value="LOW">LOW (Casual / Future Intake)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  School / College Attended
                </label>
                <input
                  type="text"
                  value={editSchoolCollege}
                  onChange={e => setEditSchoolCollege(e.target.value)}
                  placeholder="e.g. St. Xavier's, DAV Plus Two"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Year of Passing
                </label>
                <input
                  type="number"
                  value={editPassingYear}
                  onChange={e => setEditPassingYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Academic Qualification Level
                </label>
                <select
                  value={editQualification}
                  onChange={e => setEditQualification(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                >
                  <option value="">Select Qualification</option>
                  <option value="+2 Science">+2 Science</option>
                  <option value="+2 Management">+2 Management</option>
                  <option value="+2 Humanities">+2 Humanities</option>
                  <option value="12th CBSE / ISC">12th CBSE / ISC</option>
                  <option value="A-Levels">A-Levels / Cambridge</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Diploma">Diploma / Polytechnic</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  10th / SEE Score (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editP10}
                  onChange={e => setEditP10(e.target.value)}
                  placeholder="e.g. 78.5"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  12th / +2 Score (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editP12}
                  onChange={e => setEditP12(e.target.value)}
                  placeholder="e.g. 74.2"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Graduation Score (%) (if PG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editGrad}
                  onChange={e => setEditGrad(e.target.value)}
                  placeholder="e.g. 68.0"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Entrance Exam Name
                </label>
                <input
                  type="text"
                  value={editEntranceExam}
                  onChange={e => setEditEntranceExam(e.target.value)}
                  placeholder="e.g. JEE Main, NEET, CMAT, CAT, IELTS"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Entrance Score / Rank
                </label>
                <input
                  type="text"
                  value={editEntranceScore}
                  onChange={e => setEditEntranceScore(e.target.value)}
                  placeholder="e.g. 88.5 Percentile / Rank 1420"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Annual Budget Range
                </label>
                <input
                  type="text"
                  value={editBudget}
                  onChange={e => setEditBudget(e.target.value)}
                  placeholder="e.g. ₹3 - 5 Lakhs / Year (incl. hostel)"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Counselor Notes &amp; Observations
                </label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={e => setEditRemarks(e.target.value)}
                  placeholder="Observations about student aptitude, family background, specific preferences..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditLeadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20"
              >
                Save Student Info
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
