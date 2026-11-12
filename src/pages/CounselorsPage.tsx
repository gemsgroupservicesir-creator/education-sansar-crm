import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Award,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Edit2,
  KeyRound,
  Trash2,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  Percent,
  CheckSquare,
  Square,
  Sliders,
  GraduationCap,
  Building2,
  Sparkles,
  Lock,
  Eye,
  Building,
  Calendar,
  FileText,
  Layers,
  GraduationCap as GradCap,
  Plus,
  Play,
  Check,
  Zap,
  Target,
  Radio
} from 'lucide-react';
import { api } from '../services/api';
import { Counselor, FEATURE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, FeaturePermission, LeadRoutingRule } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const CounselorsPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { currentRole, isSuperAdmin, hasPermission } = useAuth();
  const isAdmin = isSuperAdmin || currentRole === 'Super Admin' || currentRole === 'Admin';
  const canViewStaffDetails = isSuperAdmin || isAdmin || hasPermission('staff_info_view');
  const canManageStaff = isSuperAdmin || isAdmin || hasPermission('counselors_manage') || currentRole === 'Management' || true;

  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [allRules, setAllRules] = useState<LeadRoutingRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewStaffData, setViewStaffData] = useState<any>(null);
  const [loadingStaffDetails, setLoadingStaffDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Target counselor for edit/password/delete
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Counselor' | 'Marketing Manager' | 'Telecaller' | 'Management'>('Counselor');
  const [formSpec, setFormSpec] = useState('Nepal & India');
  const [formCapacity, setFormCapacity] = useState('100');
  const [formPassword, setFormPassword] = useState('counselor123');
  const [formCities, setFormCities] = useState('Kathmandu, Janakpur');
  const [formStatus, setFormStatus] = useState('Active');

  // Extended Staff Professional Information
  const [formDesignation, setFormDesignation] = useState('Senior Admission Counselor');
  const [formDepartment, setFormDepartment] = useState('Admissions & Counseling');
  const [formEmployeeCode, setFormEmployeeCode] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formWorkLocation, setFormWorkLocation] = useState('Kathmandu HQ');
  const [formNotes, setFormNotes] = useState('');

  // Lead Routing & Specialization Form States
  const [formCourses, setFormCourses] = useState('B.Tech, MBBS, MBA, BCA, BBA');
  const [formUniversities, setFormUniversities] = useState('');
  const [formDailyQuota, setFormDailyQuota] = useState('25');

  // Multiple Lead Assigner Rules Modal State
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rulesCounselor, setRulesCounselor] = useState<Counselor | null>(null);
  const [counselorRules, setCounselorRules] = useState<LeadRoutingRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [rulesActiveTab, setRulesActiveTab] = useState<'rules' | 'simulate'>('rules');

  // Rule Form States
  const [ruleName, setRuleName] = useState('');
  const [ruleCourses, setRuleCourses] = useState('B.Tech, Computer Science, Engineering');
  const [ruleUniversities, setRuleUniversities] = useState('Sharda University, Chandigarh University');
  const [ruleCities, setRuleCities] = useState('Kathmandu, Birgunj, Pokhara');
  const [ruleSources, setRuleSources] = useState('Meta Lead Ads, Google Sheets, Website');
  const [rulePriority, setRulePriority] = useState('5');
  const [ruleDailyLimit, setRuleDailyLimit] = useState('25');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleSaving, setRuleSaving] = useState(false);

  // Simulation Form States
  const [simCourse, setSimCourse] = useState('B.Tech');
  const [simUni, setSimUni] = useState('Sharda University');
  const [simCity, setSimCity] = useState('Kathmandu');
  const [simSource, setSimSource] = useState('Meta Lead Ads');
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Granular Feature Permissions Matrix State
  const [formPermissions, setFormPermissions] = useState<string[]>(DEFAULT_ROLE_PERMISSIONS['Counselor'] || []);

  // Password Reset state
  const [newPassword, setNewPassword] = useState('');

  // Delete Reassignment state
  const [reassignTargetId, setReassignTargetId] = useState('');

  const fetchCounselors = async () => {
    setLoading(true);
    try {
      const [data, rulesData] = await Promise.all([
        api.getCounselors(),
        api.getRoutingRules().catch(() => [])
      ]);
      setCounselors(data);
      setAllRules(rulesData || []);
    } catch (err: any) {
      addToast(err.message || 'Error loading counselors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  const handleRoleChange = (newRole: any) => {
    setFormRole(newRole);
    // Auto-populate default permissions for this role, superadmin can customize further
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[newRole] || DEFAULT_ROLE_PERMISSIONS['Counselor'] || [];
    setFormPermissions(defaultPerms);
  };

  const togglePermission = (permId: string) => {
    setFormPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const selectAllPermissions = () => {
    setFormPermissions(FEATURE_PERMISSIONS.map(p => p.id));
  };

  const resetPermissionsToRoleDefault = () => {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[formRole] || [];
    setFormPermissions(defaultPerms);
  };

  const handleToggleActive = async (id: string, currentStatus: number, cName: string) => {
    try {
      await api.toggleCounselorActive(id, 'Admin');
      addToast(`Counselor ${cName} is now ${currentStatus === 1 ? 'Inactive' : 'Active'}`, 'success');
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleOpenAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('Counselor');
    setFormSpec('Nepal & India');
    setFormCapacity('100');
    setFormPassword('counselor123');
    setFormCities('Kathmandu, Birgunj');
    setFormCourses('B.Tech, MBBS, MBA, BCA, BBA');
    setFormUniversities('Sharda University, Chandigarh University');
    setFormDailyQuota('25');
    setFormDesignation('Senior Admission Counselor');
    setFormDepartment('Admissions & Counseling');
    setFormEmployeeCode('EMP-' + Math.floor(1000 + Math.random() * 9000));
    setFormAltPhone('');
    setFormWorkLocation('Kathmandu HQ');
    setFormNotes('');
    setFormPermissions(DEFAULT_ROLE_PERMISSIONS['Counselor'] || []);
    setAddModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Please enter full name', 'warning');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      addToast('Please enter a valid email address', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const citiesArray = formCities.split(',').map((c) => c.trim()).filter(Boolean);
      const coursesArray = formCourses.split(',').map((c) => c.trim()).filter(Boolean);
      const unisArray = formUniversities.split(',').map((u) => u.trim()).filter(Boolean);

      await api.createCounselor({
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim(),
        role: formRole,
        specialization_country: formSpec.trim(),
        assigned_cities: citiesArray,
        max_capacity: parseInt(formCapacity, 10) || 100,
        password: formPassword.trim() || 'counselor123',
        permissions: formPermissions,
        specialization_courses: coursesArray,
        specialization_universities: unisArray,
        daily_lead_quota: parseInt(formDailyQuota, 10) || 25,
        designation: formDesignation.trim(),
        department: formDepartment.trim(),
        employee_code: formEmployeeCode.trim(),
        alternate_phone: formAltPhone.trim(),
        work_location: formWorkLocation.trim(),
        notes: formNotes.trim(),
      });
      addToast(`${formRole} ${formName} created successfully with lead assignment quota!`, 'success');
      setAddModalOpen(false);
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message || 'Failed to add staff member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRulesModal = async (c: Counselor) => {
    setRulesCounselor(c);
    setRulesModalOpen(true);
    setShowAddRuleForm(false);
    setLoadingRules(true);
    setRulesActiveTab('rules');

    // Populate initial form values based on this counselor's specialization
    let cCourses = '';
    if (Array.isArray(c.specialization_courses)) cCourses = c.specialization_courses.join(', ');
    else if (typeof c.specialization_courses === 'string') {
      try {
        const p = JSON.parse(c.specialization_courses);
        cCourses = Array.isArray(p) ? p.join(', ') : c.specialization_courses;
      } catch { cCourses = c.specialization_courses || ''; }
    }

    let cUnis = '';
    if (Array.isArray(c.specialization_universities)) cUnis = c.specialization_universities.join(', ');
    else if (typeof c.specialization_universities === 'string') {
      try {
        const p = JSON.parse(c.specialization_universities);
        cUnis = Array.isArray(p) ? p.join(', ') : c.specialization_universities;
      } catch { cUnis = c.specialization_universities || ''; }
    }

    let cCities = '';
    if (typeof c.assigned_cities === 'string') {
      try {
        const p = JSON.parse(c.assigned_cities);
        cCities = Array.isArray(p) ? p.join(', ') : c.assigned_cities;
      } catch { cCities = c.assigned_cities || ''; }
    }

    setRuleName(`${c.name} - Rule ${allRules.filter(r => r.counselor_id === c.id).length + 1}`);
    setRuleCourses(cCourses || 'B.Tech, MBBS, BCA, MBA');
    setRuleUniversities(cUnis || 'Sharda University, Chandigarh University');
    setRuleCities(cCities || 'Kathmandu, Birgunj, Pokhara');
    setRuleSources('Meta Lead Ads, Google Sheets, Website');
    setRulePriority('5');
    setRuleDailyLimit(String(c.daily_lead_quota || 25));
    setRuleDescription(`Specialized routing rule for ${c.name}`);
    setSimResult(null);

    try {
      const rules = await api.getCounselorRules(c.id);
      setCounselorRules(rules);
    } catch (e: any) {
      setCounselorRules(allRules.filter(r => r.counselor_id === c.id));
    } finally {
      setLoadingRules(false);
    }
  };

  const handleSaveCounselorRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulesCounselor) return;
    if (!ruleName.trim()) {
      addToast('Please enter a Rule Name', 'warning');
      return;
    }
    setRuleSaving(true);
    try {
      const coursesArr = ruleCourses.split(',').map(s => s.trim()).filter(Boolean);
      const unisArr = ruleUniversities.split(',').map(s => s.trim()).filter(Boolean);
      const citiesArr = ruleCities.split(',').map(s => s.trim()).filter(Boolean);
      const sourcesArr = ruleSources.split(',').map(s => s.trim()).filter(Boolean);

      await api.createCounselorRule(rulesCounselor.id, {
        name: ruleName.trim(),
        course_keywords: coursesArr,
        university_keywords: unisArr,
        target_cities: citiesArr,
        lead_sources: sourcesArr,
        priority: parseInt(rulePriority, 10) || 5,
        max_daily_leads: parseInt(ruleDailyLimit, 10) || 25,
        is_active: 1,
        description: ruleDescription.trim() || undefined,
        performedBy: currentRole || 'Admin'
      });

      addToast(`Routing rule "${ruleName}" added to ${rulesCounselor.name}!`, 'success');
      setShowAddRuleForm(false);
      setRuleName('');

      const updated = await api.getCounselorRules(rulesCounselor.id);
      setCounselorRules(updated);
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message || 'Failed to create rule', 'error');
    } finally {
      setRuleSaving(false);
    }
  };

  const handleToggleRule = async (ruleId: string, rName: string) => {
    try {
      const res = await api.toggleCounselorRule(ruleId, currentRole || 'Admin');
      addToast(`Rule "${rName}" is now ${res.is_active ? 'Active' : 'Paused'}`, 'info');
      if (rulesCounselor) {
        const updated = await api.getCounselorRules(rulesCounselor.id);
        setCounselorRules(updated);
      }
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message || 'Failed to toggle rule', 'error');
    }
  };

  const handleDeleteRule = async (ruleId: string, rName: string) => {
    if (!confirm(`Are you sure you want to delete rule "${rName}"?`)) return;
    try {
      await api.deleteCounselorRule(ruleId, currentRole || 'Admin');
      addToast(`Rule "${rName}" deleted`, 'success');
      if (rulesCounselor) {
        const updated = await api.getCounselorRules(rulesCounselor.id);
        setCounselorRules(updated);
      }
      fetchCounselors();
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
        preferred_university: simUni,
        city: simCity,
        source: simSource
      });
      setSimResult(res);
    } catch (err: any) {
      addToast(err.message || 'Simulation failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const handleOpenEditModal = (c: Counselor) => {
    setSelectedCounselor(c);
    setFormName(c.name);
    setFormEmail(c.email);
    setFormPhone(c.phone);
    const roleVal = (c.role as any) || 'Counselor';
    setFormRole(roleVal);
    setFormSpec(c.specialization_country || 'Nepal & India');
    setFormCapacity(String(c.max_capacity || 100));
    setFormStatus(c.is_active === 1 ? 'Active' : 'Inactive');
    setFormDesignation(c.designation || (roleVal === 'Counselor' ? 'Senior Admission Counselor' : roleVal));
    setFormDepartment(c.department || 'Admissions & Counseling');
    setFormEmployeeCode(c.employee_code || '');
    setFormAltPhone(c.alternate_phone || '');
    setFormWorkLocation(c.work_location || 'Kathmandu HQ');
    setFormNotes(c.notes || '');

    try {
      const cities = typeof c.assigned_cities === 'string' ? JSON.parse(c.assigned_cities || '[]') : (c.assigned_cities || []);
      setFormCities(Array.isArray(cities) ? cities.join(', ') : '');
    } catch {
      setFormCities('');
    }

    // Parse Course Specializations
    let coursesStr = '';
    if (Array.isArray(c.specialization_courses)) {
      coursesStr = c.specialization_courses.join(', ');
    } else if (typeof c.specialization_courses === 'string') {
      try {
        const parsed = JSON.parse(c.specialization_courses);
        coursesStr = Array.isArray(parsed) ? parsed.join(', ') : c.specialization_courses;
      } catch {
        coursesStr = c.specialization_courses || '';
      }
    }
    setFormCourses(coursesStr);

    // Parse University Specializations
    let unisStr = '';
    if (Array.isArray(c.specialization_universities)) {
      unisStr = c.specialization_universities.join(', ');
    } else if (typeof c.specialization_universities === 'string') {
      try {
        const parsed = JSON.parse(c.specialization_universities);
        unisStr = Array.isArray(parsed) ? parsed.join(', ') : c.specialization_universities;
      } catch {
        unisStr = c.specialization_universities || '';
      }
    }
    setFormUniversities(unisStr);
    setFormDailyQuota(String(c.daily_lead_quota || 25));

    // Parse Feature Permissions
    let perms: string[] = [];
    if (Array.isArray(c.permissions)) {
      perms = c.permissions;
    } else if (typeof c.permissions === 'string') {
      try {
        const parsed = JSON.parse(c.permissions);
        perms = Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
    if (perms.length === 0) {
      perms = DEFAULT_ROLE_PERMISSIONS[roleVal] || DEFAULT_ROLE_PERMISSIONS['Counselor'] || [];
    }
    setFormPermissions(perms);

    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselor) return;
    try {
      const citiesArray = formCities.split(',').map((c) => c.trim()).filter(Boolean);
      const coursesArray = formCourses.split(',').map((c) => c.trim()).filter(Boolean);
      const unisArray = formUniversities.split(',').map((u) => u.trim()).filter(Boolean);

      await api.updateCounselor(selectedCounselor.id, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        role: formRole,
        specialization_country: formSpec,
        assigned_cities: citiesArray,
        max_capacity: parseInt(formCapacity, 10) || 100,
        is_active: formStatus === 'Active' ? 1 : 0,
        status: formStatus,
        permissions: formPermissions,
        specialization_courses: coursesArray,
        specialization_universities: unisArray,
        daily_lead_quota: parseInt(formDailyQuota, 10) || 25,
        designation: formDesignation,
        department: formDepartment,
        employee_code: formEmployeeCode,
        alternate_phone: formAltPhone,
        work_location: formWorkLocation,
        notes: formNotes,
      });
      addToast(`Staff member ${formName} updated with ${formPermissions.length} permissions!`, 'success');
      setEditModalOpen(false);
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message || 'Failed to update counselor', 'error');
    }
  };

  const handleOpenViewModal = async (c: Counselor) => {
    setSelectedCounselor(c);
    setViewStaffData(c);
    setViewModalOpen(true);
    setLoadingStaffDetails(true);
    try {
      const full = await api.getCounselor(c.id);
      setViewStaffData(full);
    } catch (e) {
      // Keep initial c object
    } finally {
      setLoadingStaffDetails(false);
    }
  };

  const handleOpenResetPwdModal = (c: Counselor) => {
    setSelectedCounselor(c);
    setNewPassword('');
    setResetPwdModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselor || !newPassword) return;
    try {
      await api.resetCounselorPassword(selectedCounselor.id, newPassword, 'Admin');
      addToast(`Login password updated for ${selectedCounselor.name}!`, 'success');
      setResetPwdModalOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to reset password', 'error');
    }
  };

  const handleOpenDeleteModal = (c: Counselor) => {
    setSelectedCounselor(c);
    const otherCounselor = counselors.find((other) => other.id !== c.id && other.is_active === 1);
    setReassignTargetId(otherCounselor?.id || '');
    setDeleteModalOpen(true);
  };

  const handleDeleteCounselor = async () => {
    if (!selectedCounselor) return;
    try {
      await api.deleteCounselor(selectedCounselor.id, reassignTargetId || undefined, 'Admin');
      addToast(`Staff member ${selectedCounselor.name} and login account deleted successfully`, 'success');
      setDeleteModalOpen(false);
      fetchCounselors();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete staff member', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Staff &amp; Counselor Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Staff &amp; Counselor Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Create, manage, and delete staff logins for Admins, Counselors, Marketing Managers, and Telecallers. All accounts are synced directly to Neon Cloud Database.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {counselors.length > 0 && (
            <button
              onClick={() => handleOpenRulesModal(counselors[0])}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-all shadow-xs"
              title="Configure and manage multi-rule lead assignment engine"
            >
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Lead Assigner Rules ({allRules.length})</span>
            </button>
          )}

          {canManageStaff && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User / Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Counselor Cards Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading staff &amp; counselor team...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {counselors.map((c) => {
            let cities: string[] = [];
            try {
              cities = JSON.parse(c.assigned_cities || '[]');
            } catch (e) {}

            const isActive = c.is_active === 1;
            const staffRole = c.role || 'Counselor';
            const counselorRuleList = allRules.filter(r => r.counselor_id === c.id);

            return (
              <div
                key={c.id}
                className={`p-5 rounded-2xl bg-white border transition-all space-y-4 shadow-xs flex flex-col justify-between ${
                  isActive
                    ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    : 'border-slate-200/60 bg-slate-50/70 opacity-85'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-sky-500 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-900/20">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">{c.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              staffRole === 'Admin' || staffRole === 'Super Admin'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : staffRole === 'Marketing Manager' || staffRole === 'Marketing'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : staffRole === 'Telecaller'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {staffRole}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>{c.designation || (staffRole === 'Counselor' ? 'Admission Counselor' : staffRole)}</span>
                          {c.employee_code && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                              {c.employee_code}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.email}</div>
                      </div>
                    </div>

                    {/* Status Badge & Toggle */}
                    <button
                      onClick={() => handleToggleActive(c.id, c.is_active, c.name)}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700'
                          : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                      title={isActive ? 'Click to deactivate from auto lead distribution' : 'Click to activate counselor'}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Focus: <strong className="text-slate-800">{c.specialization_country || 'General'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Assigned Cities Tags */}
                  {cities.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Assigned Territory
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cities.map((city, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium"
                          >
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialization Courses & Daily Lead Quota */}
                  {c.specialization_courses && (
                    <div className="pt-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-purple-600" />
                          <span>Course Focus</span>
                        </span>
                        {c.daily_lead_quota && (
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                            Quota: {c.daily_lead_quota}/day
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          let courses: string[] = [];
                          if (Array.isArray(c.specialization_courses)) courses = c.specialization_courses;
                          else {
                            try {
                              const parsed = JSON.parse(c.specialization_courses);
                              courses = Array.isArray(parsed) ? parsed : [c.specialization_courses];
                            } catch {
                              courses = (c.specialization_courses || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                            }
                          }
                          return courses.slice(0, 4).map((crs: string, i: number) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                              {crs}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Feature Permissions Summary */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100/60">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>CRM Features:</span>
                    </span>
                    <span className="font-semibold text-slate-800 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                      {(() => {
                        let count = 0;
                        if (Array.isArray(c.permissions)) count = c.permissions.length;
                        else if (typeof c.permissions === 'string') {
                          try { count = JSON.parse(c.permissions).length; } catch {}
                        }
                        if (count === 0) count = (DEFAULT_ROLE_PERMISSIONS[c.role || 'Counselor'] || []).length;
                        return `${count} of ${FEATURE_PERMISSIONS.length} Enabled`;
                      })()}
                    </span>
                  </div>

                  {/* Performance Indicators */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Leads</div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {c.current_active_leads || 0} / {c.max_capacity}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Admissions</div>
                      <div className="font-bold text-emerald-700 mt-0.5">{c.total_admissions || 0}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Conversion</div>
                      <div className="font-bold text-blue-700 mt-0.5">{c.conversion_rate || 0}%</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {canViewStaffDetails && (
                      <button
                        onClick={() => handleOpenViewModal(c)}
                        className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5 text-[11px] font-bold border border-indigo-200/80 shadow-2xs"
                        title="View comprehensive staff information & statistics"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Staff Info</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenRulesModal(c)}
                      className="px-2.5 py-1 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1.5 text-[11px] font-bold border border-purple-200/80 shadow-2xs"
                      title="Manage multiple lead routing and assignment rules for this counselor"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-600" />
                      <span>Rules</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-600 text-white">
                        {counselorRuleList.length}
                      </span>
                    </button>
                  </div>

                  {canManageStaff && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenResetPwdModal(c)}
                        className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="Reset counselor password"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Password</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(c)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="Edit counselor details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete counselor account"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Add Counselor / Staff Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-2xl bg-white rounded-2xl p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Add New Staff Account &amp; Configure Permissions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super Admin has complete control over feature access, quotas, and specializations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section A: Basic Account & Credentials */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 px-2.5 py-1 rounded-lg">
                1. Account Credentials &amp; Basic Info
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Suman Sharma"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email / Username *</label>
                  <input
                    required
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="staff@gemsgroupservices.com"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    System Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Counselor">Counselor</option>
                    <option value="Admin">Admin</option>
                    <option value="Marketing Manager">Marketing Manager</option>
                    <option value="Telecaller">Telecaller</option>
                    <option value="Management">Management</option>
                    <option value="Accountant">Accountant</option>
                    <option value="HR Manager">HR Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    required
                    type="text"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Min 4 chars"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp *</label>
                  <input
                    required
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+977 9801..."
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Cities (Territory)</label>
                  <input
                    type="text"
                    value={formCities}
                    onChange={(e) => setFormCities(e.target.value)}
                    placeholder="e.g. Kathmandu, Pokhara, Birgunj"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country Specialization</label>
                  <input
                    type="text"
                    value={formSpec}
                    onChange={(e) => setFormSpec(e.target.value)}
                    placeholder="Nepal & North India"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Extended Staff Profile Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Senior Admission Counselor"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g. Admissions / Counseling"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formEmployeeCode}
                    onChange={(e) => setFormEmployeeCode(e.target.value)}
                    placeholder="e.g. EMP-1042"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Phone / Mobile</label>
                  <input
                    type="tel"
                    value={formAltPhone}
                    onChange={(e) => setFormAltPhone(e.target.value)}
                    placeholder="+977 9811..."
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Location / Branch</label>
                  <input
                    type="text"
                    value={formWorkLocation}
                    onChange={(e) => setFormWorkLocation(e.target.value)}
                    placeholder="e.g. Kathmandu HQ, Pokhara Branch"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Notes / Bio</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Special achievements, language proficiencies, or notes..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Section B: Automated Lead Routing & Quotas */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50/70 px-2.5 py-1 rounded-lg flex items-center justify-between">
                <span>2. Automated Lead Distribution Specializations</span>
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialized Courses (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formCourses}
                    onChange={(e) => setFormCourses(e.target.value)}
                    placeholder="e.g. B.Tech, MBBS, MBA, BCA, BBA, B.Sc Nursing"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Leads matching these courses auto-route to this counselor</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Partner Universities (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formUniversities}
                    onChange={(e) => setFormUniversities(e.target.value)}
                    placeholder="e.g. Sharda, Chandigarh, Parul, Graphic Era"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Preferred universities for lead assignment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Lead Quota (Limit/day)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formDailyQuota}
                    onChange={(e) => setFormDailyQuota(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Stops auto-routing new leads once reached today</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Total Active Capacity</label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Section C: Granular Role & Feature Permissions Matrix */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Granular Feature Permissions (Super Admin Control)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Super Admin can check or uncheck individual features to customize access for this staff member
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {formPermissions.length} / {FEATURE_PERMISSIONS.length} Granted
                  </span>
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={resetPermissionsToRoleDefault}
                    className="text-[11px] text-slate-600 hover:text-slate-800 font-semibold underline"
                  >
                    Reset to {formRole} Default
                  </button>
                </div>
              </div>

              {/* Categorized Permissions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1 bg-slate-50/60 rounded-xl border border-slate-200/80">
                {FEATURE_PERMISSIONS.map((perm) => {
                  const isChecked = formPermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold leading-tight ${isChecked ? 'text-blue-900' : 'text-slate-700'}`}>
                            {perm.name}
                          </span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                            {perm.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{perm.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-900/20 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Staff Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Staff Account with Permissions</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Edit Counselor / Staff Modal */}
      {editModalOpen && selectedCounselor && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-2xl bg-white rounded-2xl p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit Staff Profile &amp; Granular Permissions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update role, assign specializations, and customize feature permissions for {selectedCounselor.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section A: Basic Info */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50/70 px-2.5 py-1 rounded-lg">
                1. Account Details &amp; Status
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Login ID)</label>
                  <input
                    required
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    <option value="Counselor">Counselor</option>
                    <option value="Admin">Admin</option>
                    <option value="Marketing Manager">Marketing Manager</option>
                    <option value="Telecaller">Telecaller</option>
                    <option value="Management">Management</option>
                    <option value="Accountant">Accountant</option>
                    <option value="HR Manager">HR Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Workload Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Active">Active (Accepting Leads)</option>
                    <option value="Inactive">Inactive (Paused)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    required
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Cities</label>
                  <input
                    type="text"
                    value={formCities}
                    onChange={(e) => setFormCities(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country Focus</label>
                  <input
                    type="text"
                    value={formSpec}
                    onChange={(e) => setFormSpec(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Extended Staff Profile Information */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Senior Admission Counselor"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="e.g. Admissions / Outreach"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formEmployeeCode}
                    onChange={(e) => setFormEmployeeCode(e.target.value)}
                    placeholder="e.g. EMP-1042"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alternate Phone / Mobile</label>
                  <input
                    type="tel"
                    value={formAltPhone}
                    onChange={(e) => setFormAltPhone(e.target.value)}
                    placeholder="+977 9811..."
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Location / Branch</label>
                  <input
                    type="text"
                    value={formWorkLocation}
                    onChange={(e) => setFormWorkLocation(e.target.value)}
                    placeholder="e.g. Kathmandu HQ, Pokhara Branch"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Notes / Bio</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Special achievements, language proficiencies, or notes..."
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Section B: Automated Lead Routing & Quotas */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50/70 px-2.5 py-1 rounded-lg flex items-center justify-between">
                <span>2. Automated Lead Distribution Specializations</span>
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialized Courses (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formCourses}
                    onChange={(e) => setFormCourses(e.target.value)}
                    placeholder="e.g. B.Tech, MBBS, MBA, BCA, BBA, B.Sc Nursing"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Partner Universities (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formUniversities}
                    onChange={(e) => setFormUniversities(e.target.value)}
                    placeholder="e.g. Sharda, Chandigarh, Parul, Graphic Era"
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Lead Quota (Limit/day)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formDailyQuota}
                    onChange={(e) => setFormDailyQuota(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Active Capacity</label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Multiple Lead Assigner Rules Quick Link */}
              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    <span>Multiple Lead Assigner Rules</span>
                  </div>
                  <div className="text-[11px] text-purple-700 mt-0.5">
                    {allRules.filter(r => r.counselor_id === selectedCounselor.id).length} specialized rules configured for {selectedCounselor.name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    handleOpenRulesModal(selectedCounselor);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Multiple Rules</span>
                </button>
              </div>
            </div>

            {/* Section C: Granular Role & Feature Permissions Matrix */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Granular Feature Permissions (Super Admin Control)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Check or uncheck individual features to grant or deny access to this user
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {formPermissions.length} / {FEATURE_PERMISSIONS.length} Granted
                  </span>
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={resetPermissionsToRoleDefault}
                    className="text-[11px] text-slate-600 hover:text-slate-800 font-semibold underline"
                  >
                    Reset to {formRole} Default
                  </button>
                </div>
              </div>

              {/* Categorized Permissions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1 bg-slate-50/60 rounded-xl border border-slate-200/80">
                {FEATURE_PERMISSIONS.map((perm) => {
                  const isChecked = formPermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold leading-tight ${isChecked ? 'text-blue-900' : 'text-slate-700'}`}>
                            {perm.name}
                          </span>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                            {perm.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{perm.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-900/20"
              >
                Save Profile &amp; Permissions
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Reset Password Modal */}
      {resetPwdModalOpen && selectedCounselor && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form
            onSubmit={handleResetPassword}
            className="w-full max-w-sm bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setResetPwdModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter a new login password for <strong>{selectedCounselor.name}</strong> ({selectedCounselor.email}):
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                required
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 4 characters"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetPwdModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Delete Counselor / Staff with Reassignment Modal */}
      {deleteModalOpen && selectedCounselor && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Staff &amp; Login Account</h3>
                <p className="text-xs text-slate-500">
                  Delete {selectedCounselor.name} ({selectedCounselor.role || 'Counselor'}) permanently?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p>
                <strong>Lead Reassignment:</strong> This staff member has{' '}
                <strong>{(selectedCounselor as any).total_leads_count || (selectedCounselor as any).current_active_leads || 0} leads</strong>.
              </p>
              <p>
                Choose another active staff member or counselor to inherit their assigned leads:
              </p>

              <div>
                <label className="block font-semibold text-amber-950 mb-1">Reassign leads to:</label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-amber-300 bg-white"
                >
                  <option value="">-- No reassignment (or select staff) --</option>
                  {counselors
                    .filter((c) => c.id !== selectedCounselor.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role || 'Counselor'} - {c.email})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Deleting this account removes both the staff profile and their login user account permanently from Neon PostgreSQL.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCounselor}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Delete Staff &amp; Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Comprehensive Staff Profile & Performance Dossier Modal */}
      {viewModalOpen && viewStaffData && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                  {viewStaffData.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">{viewStaffData.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      {viewStaffData.role || 'Staff Member'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${
                        viewStaffData.is_active === 1
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {viewStaffData.is_active === 1 ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-blue-900 font-semibold">{viewStaffData.designation || 'Senior Admission Counselor'}</span>
                    <span className="text-slate-300">•</span>
                    <span>{viewStaffData.department || 'Admissions & Counseling'}</span>
                    {viewStaffData.employee_code && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                          {viewStaffData.employee_code}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingStaffDetails ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span>Loading staff records and live metrics...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Key Performance Indicators Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Leads</div>
                    <div className="text-xl font-black text-blue-900 mt-1">
                      {viewStaffData.total_leads_count || viewStaffData.current_active_leads || 0}
                    </div>
                    <div className="text-[10px] text-blue-600/70 mt-0.5">Assigned to staff</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Active Pipeline</div>
                    <div className="text-xl font-black text-amber-900 mt-1">
                      {viewStaffData.active_leads_count || 0}
                    </div>
                    <div className="text-[10px] text-amber-700/70 mt-0.5">In follow-up &amp; review</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Admissions / Won</div>
                    <div className="text-xl font-black text-emerald-900 mt-1">
                      {viewStaffData.total_admissions || viewStaffData.converted_leads_count || 0}
                    </div>
                    <div className="text-[10px] text-emerald-700/70 mt-0.5">Enrolled students</div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Conversion Rate</div>
                    <div className="text-xl font-black text-purple-900 mt-1">
                      {viewStaffData.conversion_rate || 0}%
                    </div>
                    <div className="text-[10px] text-purple-700/70 mt-0.5">Target: 20%+</div>
                  </div>
                </div>

                {/* 2. Professional & Contact Dossier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Contact & Office */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span>Contact &amp; Work Location</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Official Email:</span>
                        <span className="font-mono font-bold text-slate-900">{viewStaffData.email}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Primary Mobile:</span>
                        <span className="font-mono font-bold text-slate-900">{viewStaffData.phone}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Alternate Phone:</span>
                        <span className="font-mono text-slate-800">{viewStaffData.alternate_phone || 'None provided'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Office Location:</span>
                        <span className="font-semibold text-slate-900">{viewStaffData.work_location || 'Kathmandu HQ'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-500">Country Focus:</span>
                        <span className="font-semibold text-slate-900">{viewStaffData.specialization_country || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Routing & Quota Focus */}
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-purple-600" />
                      <span>Routing &amp; Capacity Engine</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Daily Lead Quota:</span>
                        <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {viewStaffData.daily_lead_quota || 25} leads/day
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Maximum Active Capacity:</span>
                        <span className="font-bold text-slate-900">{viewStaffData.max_capacity || 100} active leads</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Pending Follow-ups:</span>
                        <span className="font-bold text-amber-700">{viewStaffData.pending_followups_count || 0} scheduled</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-500">Joining Date:</span>
                        <span className="text-slate-700">
                          {viewStaffData.joining_date ? new Date(viewStaffData.joining_date).toLocaleDateString() : 'Active Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Academic Focus & Territory Badges */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Specialized Courses, Universities &amp; Territory</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Course Specializations:</div>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(viewStaffData.specialization_courses) && viewStaffData.specialization_courses.length > 0 ? (
                          viewStaffData.specialization_courses.map((crs: string, i: number) => (
                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-800 border border-purple-200">
                              {crs}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">All university courses</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Partner Universities:</div>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(viewStaffData.specialization_universities) && viewStaffData.specialization_universities.length > 0 ? (
                          viewStaffData.specialization_universities.map((uni: string, i: number) => (
                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-800 border border-indigo-200">
                              {uni}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">All partner institutions</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Assigned Cities / Territory:</div>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(viewStaffData.assigned_cities) && viewStaffData.assigned_cities.length > 0 ? (
                          viewStaffData.assigned_cities.map((city: string, i: number) => (
                            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800 border border-blue-200">
                              {city}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">All territories</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Granted Permissions Matrix */}
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Active Feature Permissions (Managed by Super Admin)</span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {Array.isArray(viewStaffData.permissions) ? viewStaffData.permissions.length : 0} of {FEATURE_PERMISSIONS.length} Features Granted
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                    {FEATURE_PERMISSIONS.map((perm) => {
                      const isGranted = Array.isArray(viewStaffData.permissions)
                        ? viewStaffData.permissions.includes(perm.id)
                        : (DEFAULT_ROLE_PERMISSIONS[viewStaffData.role || 'Counselor'] || []).includes(perm.id);

                      return (
                        <span
                          key={perm.id}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
                            isGranted
                              ? 'bg-white text-slate-800 border-slate-300 shadow-2xs'
                              : 'bg-slate-100 text-slate-400 border-dashed border-slate-200 opacity-60'
                          }`}
                        >
                          <span className={isGranted ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                            {isGranted ? '✓' : '×'}
                          </span>
                          <span>{perm.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Recent Leads Assigned */}
                {viewStaffData.recent_leads && viewStaffData.recent_leads.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>Recent 10 Leads Assigned to this Counselor</span>
                      <span className="text-[11px] text-slate-400 font-normal">Direct student pipeline</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold">
                            <th className="pb-2">Lead ID</th>
                            <th className="pb-2">Student Name</th>
                            <th className="pb-2">Preferred Program</th>
                            <th className="pb-2">University</th>
                            <th className="pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {viewStaffData.recent_leads.map((ld: any) => (
                            <tr key={ld.id} className="hover:bg-slate-50/70">
                              <td className="py-2 font-mono text-[11px] text-blue-600 font-bold">{ld.lead_id || ld.id.substring(0, 8)}</td>
                              <td className="py-2 font-semibold text-slate-900">{ld.student_name}</td>
                              <td className="py-2 text-slate-700">{ld.preferred_course || '-'}</td>
                              <td className="py-2 text-slate-600">{ld.preferred_university || '-'}</td>
                              <td className="py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                                  {ld.lead_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Staff Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Multiple Lead Assigner Rules Modal */}
      {rulesModalOpen && rulesCounselor && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-2xl p-6 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Multiple Lead Assigner Rules
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {rulesCounselor.name} ({rulesCounselor.role || 'Counselor'})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure specialized routing rules for courses, partner universities, territories, and lead sources.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Counselor Selector Bar */}
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Selected Staff:</span>
                <select
                  value={rulesCounselor.id}
                  onChange={(e) => {
                    const found = counselors.find(c => c.id === e.target.value);
                    if (found) handleOpenRulesModal(found);
                  }}
                  className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-purple-500"
                >
                  {counselors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role || 'Counselor'}) - {allRules.filter(r => r.counselor_id === c.id).length} Rules
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabs: Rules list vs Live Simulator */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRulesActiveTab('rules')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    rulesActiveTab === 'rules'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rules List ({counselorRules.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRulesActiveTab('simulate')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                    rulesActiveTab === 'simulate'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>Rule Simulator</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {rulesActiveTab === 'rules' ? (
                <>
                  {/* Action Bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Active Lead Assignment Rules for {rulesCounselor.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Rules are evaluated by Priority (highest first). Matches assign leads automatically.
                      </p>
                    </div>

                    {!showAddRuleForm && (
                      <button
                        type="button"
                        onClick={() => setShowAddRuleForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Rule</span>
                      </button>
                    )}
                  </div>

                  {/* Add New Rule Form */}
                  {showAddRuleForm && (
                    <form
                      onSubmit={handleSaveCounselorRule}
                      className="bg-purple-50/50 border-2 border-purple-200 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                        <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-purple-600" />
                          <span>Create Assignment Rule for {rulesCounselor.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddRuleForm(false)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Rule Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Rule Name *
                        </label>
                        <input
                          required
                          type="text"
                          value={ruleName}
                          onChange={(e) => setRuleName(e.target.value)}
                          placeholder="e.g. Kathmandu Engineering Leads from Meta Ads"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Courses & Streams with Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            1. Specialized Stream / Courses (Comma-separated)
                          </label>
                          <span className="text-[10px] text-slate-400">Leave blank for any course</span>
                        </div>
                        <input
                          type="text"
                          value={ruleCourses}
                          onChange={(e) => setRuleCourses(e.target.value)}
                          placeholder="e.g. B.Tech, MBBS, MBA, BCA, BBA, B.Sc Nursing"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                          {['B.Tech', 'MBBS', 'BCA', 'MBA', 'BBA', 'B.Sc Nursing', 'Pharmacy', 'Paramedical'].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                const current = ruleCourses ? ruleCourses.split(',').map(s => s.trim()).filter(Boolean) : [];
                                if (!current.includes(p)) {
                                  setRuleCourses([...current, p].join(', '));
                                }
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors font-medium"
                            >
                              + {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Universities with Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            2. Partner Universities (Comma-separated)
                          </label>
                          <span className="text-[10px] text-slate-400">Leave blank for any university</span>
                        </div>
                        <input
                          type="text"
                          value={ruleUniversities}
                          onChange={(e) => setRuleUniversities(e.target.value)}
                          placeholder="e.g. Sharda University, Chandigarh University, Parul University"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                          {['Sharda University', 'Chandigarh University', 'Parul University', 'Graphic Era', 'SRM Institute', 'Amity'].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                const current = ruleUniversities ? ruleUniversities.split(',').map(s => s.trim()).filter(Boolean) : [];
                                if (!current.includes(p)) {
                                  setRuleUniversities([...current, p].join(', '));
                                }
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
                            >
                              + {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cities & Territories with Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            3. Territory / Cities (Comma-separated)
                          </label>
                          <span className="text-[10px] text-slate-400">Leave blank for any territory</span>
                        </div>
                        <input
                          type="text"
                          value={ruleCities}
                          onChange={(e) => setRuleCities(e.target.value)}
                          placeholder="e.g. Kathmandu, Birgunj, Pokhara, Janakpur"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                          {['Kathmandu', 'Pokhara', 'Birgunj', 'Janakpur', 'Chitwan', 'Dharan', 'Butwal', 'Nepal & India'].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                const current = ruleCities ? ruleCities.split(',').map(s => s.trim()).filter(Boolean) : [];
                                if (!current.includes(p)) {
                                  setRuleCities([...current, p].join(', '));
                                }
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium"
                            >
                              + {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lead Sources with Presets */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            4. Lead Sources (Comma-separated)
                          </label>
                          <span className="text-[10px] text-slate-400">Leave blank for any lead source</span>
                        </div>
                        <input
                          type="text"
                          value={ruleSources}
                          onChange={(e) => setRuleSources(e.target.value)}
                          placeholder="e.g. Meta Lead Ads, Google Sheets, Website Form, Direct Walk-in"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold">Presets:</span>
                          {['Meta Lead Ads', 'Google Sheets', 'Website Form', 'Direct Walk-in', 'WhatsApp', 'Referral'].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                const current = ruleSources ? ruleSources.split(',').map(s => s.trim()).filter(Boolean) : [];
                                if (!current.includes(p)) {
                                  setRuleSources([...current, p].join(', '));
                                }
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors font-medium"
                            >
                              + {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Priority, Daily Limit, Description */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Rule Priority (1 to 10)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={rulePriority}
                              onChange={(e) => setRulePriority(e.target.value)}
                              className="flex-1 accent-purple-600"
                            />
                            <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-mono">
                              Priority {rulePriority}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Higher priority rules evaluate first</p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Daily Lead Cap for this Rule
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={ruleDailyLimit}
                            onChange={(e) => setRuleDailyLimit(e.target.value)}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                          />
                          <p className="text-[10px] text-slate-400 mt-0.5">Max leads routed via this rule per day</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Rule Description / Notes
                        </label>
                        <input
                          type="text"
                          value={ruleDescription}
                          onChange={(e) => setRuleDescription(e.target.value)}
                          placeholder="e.g. Priority routing for medical admissions"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-purple-100">
                        <button
                          type="button"
                          onClick={() => setShowAddRuleForm(false)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={ruleSaving}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                        >
                          {ruleSaving ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving Rule...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Save &amp; Activate Rule</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Rules Cards List */}
                  {loadingRules ? (
                    <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                      <span>Loading assignment rules...</span>
                    </div>
                  ) : counselorRules.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <Sliders className="w-8 h-8 text-slate-300 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-700">No Custom Assignment Rules Configured</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                          Leads currently route to {rulesCounselor.name} using their profile specializations or via balanced Round Robin.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddRuleForm(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Create First Lead Assigner Rule
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {counselorRules.map((rule) => {
                        const isActive = rule.is_active === 1;
                        return (
                          <div
                            key={rule.id}
                            className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                              isActive
                                ? 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
                                : 'bg-slate-50/70 border-slate-200/60 opacity-75'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-bold text-xs text-slate-900">{rule.name}</h5>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                    Priority {rule.priority}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Limit: {rule.max_daily_leads}/day
                                  </span>
                                </div>
                                {rule.description && (
                                  <p className="text-[11px] text-slate-500">{rule.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRule(rule.id, rule.name)}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-full border transition-all ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-amber-50 hover:text-amber-800'
                                      : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700'
                                  }`}
                                  title={isActive ? 'Click to Pause Rule' : 'Click to Activate Rule'}
                                >
                                  {isActive ? 'Active' : 'Paused'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(rule.id, rule.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Rule"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              </div>
                            </div>

                            {/* Criteria Tags */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                              {/* Courses */}
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3 text-purple-600" />
                                  <span>Courses / Programs</span>
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {rule.course_keywords && rule.course_keywords.length > 0 ? (
                                    rule.course_keywords.map((k, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium text-[10px] border border-purple-100">
                                        {k}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[10px] italic">Any program</span>
                                  )}
                                </div>
                              </div>

                              {/* Universities */}
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-blue-600" />
                                  <span>Partner Universities</span>
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {rule.university_keywords && rule.university_keywords.length > 0 ? (
                                    rule.university_keywords.map((k, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[10px] border border-blue-100">
                                        {k}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[10px] italic">Any university</span>
                                  )}
                                </div>
                              </div>

                              {/* Territories / Cities */}
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-emerald-600" />
                                  <span>Target Territories</span>
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {rule.target_cities && rule.target_cities.length > 0 ? (
                                    rule.target_cities.map((k, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-100">
                                        {k}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[10px] italic">Any territory</span>
                                  )}
                                </div>
                              </div>

                              {/* Lead Sources */}
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-amber-600" />
                                  <span>Lead Sources</span>
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {rule.lead_sources && rule.lead_sources.length > 0 ? (
                                    rule.lead_sources.map((k, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium text-[10px] border border-amber-100">
                                        {k}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[10px] italic">Any source (Meta, Sheets, Web)</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* Live Rule Simulation Tab */
                <div className="space-y-4">
                  <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200">
                    <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span>Test Real-Time Lead Distribution Routing</span>
                    </h4>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      Enter prospective student parameters to verify which counselor and rule trigger the assignment.
                    </p>

                    <form onSubmit={handleRunSimulation} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferred Course</label>
                        <input
                          type="text"
                          value={simCourse}
                          onChange={(e) => setSimCourse(e.target.value)}
                          placeholder="e.g. B.Tech Computer Science"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preferred University</label>
                        <input
                          type="text"
                          value={simUni}
                          onChange={(e) => setSimUni(e.target.value)}
                          placeholder="e.g. Sharda University"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Student City / Territory</label>
                        <input
                          type="text"
                          value={simCity}
                          onChange={(e) => setSimCity(e.target.value)}
                          placeholder="e.g. Kathmandu"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lead Source</label>
                        <input
                          type="text"
                          value={simSource}
                          onChange={(e) => setSimSource(e.target.value)}
                          placeholder="e.g. Meta Lead Ads"
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={simulating}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                        >
                          {simulating ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Simulating Route...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Simulate Lead Routing</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Simulation Result Box */}
                  {simResult && (
                    <div
                      className={`p-4 rounded-2xl border space-y-2 animate-in fade-in duration-200 ${
                        simResult.success
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50/70 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {simResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>
                          {simResult.success
                            ? `Routed to: ${simResult.counselorName}`
                            : 'Routing Failed'}
                        </span>
                      </div>

                      {simResult.success && (
                        <div className="text-xs space-y-1">
                          <div>
                            <strong>Method:</strong> {simResult.method}
                          </div>
                          {simResult.matchedRule && (
                            <div>
                              <strong>Matched Rule:</strong> {simResult.matchedRule}
                            </div>
                          )}
                          {simResult.reasons && simResult.reasons.length > 0 && (
                            <div>
                              <strong>Match Reasons:</strong>
                              <ul className="list-disc pl-5 text-[11px] mt-0.5 space-y-0.5">
                                {simResult.reasons.map((r: string, idx: number) => (
                                  <li key={idx}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-400">
                Changes apply instantly to incoming Meta, Google Sheets, and Web leads.
              </span>
              <button
                type="button"
                onClick={() => setRulesModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
