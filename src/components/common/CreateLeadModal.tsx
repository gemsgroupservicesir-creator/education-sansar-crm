import React, { useState, useEffect } from 'react';
import { X, UserPlus, Sparkles, Building2, BookOpen, User, Phone, Mail, MapPin, Award } from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { Lead, LeadSource, LeadTemperature } from '../../types';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (lead: Lead) => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Duplicate warning state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<Lead[]>([]);
  const [duplicateReasons, setDuplicateReasons] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    student_name: '',
    first_name: '',
    last_name: '',
    phone: '',
    whatsapp_number: '',
    email: '',
    gender: 'Male',
    date_of_birth: '',
    country: 'Nepal',
    state: '',
    city: 'Kathmandu',
    address: '',
    academic_qualification: '+2 Science (NEB)',
    percentage_10th: '',
    percentage_12th: '',
    graduation_percentage: '',
    entrance_exam: '',
    entrance_score: '',
    preferred_course: 'B.Tech Computer Science & Engineering',
    preferred_university: 'SRM Institute of Science and Technology',
    second_university: 'VIT Vellore',
    budget: '₹12L - ₹16L',
    scholarship_required: true,
    lead_source: 'Meta Ads' as LeadSource,
    campaign: 'Meta Nepal Admission Wave 2026',
    ad_set: 'Engineering Aspirants',
    ad: 'SRM Admissions 2026 Nepal',
    assigned_counselor_id: '',
    lead_temperature: 'WARM' as LeadTemperature,
    remarks: '',
  });

  const targetCitiesNepal = [
    'Kathmandu', 'Birgunj', 'Janakpur', 'Biratnagar', 'Butwal', 'Bhairahawa', 'Lahan', 'Rajbiraj'
  ];
  const targetCitiesIndia = [
    'Delhi', 'Noida', 'Bangalore', 'Chennai', 'Mumbai', 'Pune'
  ];

  useEffect(() => {
    if (isOpen) {
      api.getCounselors().then(setCounselors).catch(() => {});
      api.getUniversities().then(setUniversities).catch(() => {});
      api.getCourses().then(setCourses).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    const parts = name.trim().split(' ');
    const first = parts[0] || '';
    const last = parts.slice(1).join(' ') || '';
    setFormData(prev => ({
      ...prev,
      student_name: name,
      first_name: first,
      last_name: last,
    }));
  };

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({
      ...prev,
      phone,
      whatsapp_number: prev.whatsapp_number ? prev.whatsapp_number : phone
    }));
  };

  const submitLead = async (bypassDuplicate = false) => {
    if (!formData.student_name.trim()) {
      showToast('Student name is required', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        percentage_10th: formData.percentage_10th ? parseFloat(formData.percentage_10th) : null,
        percentage_12th: formData.percentage_12th ? parseFloat(formData.percentage_12th) : null,
        graduation_percentage: formData.graduation_percentage ? parseFloat(formData.graduation_percentage) : null,
        scholarship_required: formData.scholarship_required ? 1 : 0,
        bypassDuplicateCheck: bypassDuplicate,
        performedBy: 'Counselor / Staff'
      };

      const res = await api.createLead(payload);
      showToast(`Lead ${res.lead_id} created successfully! Assigned to ${res.assigned_counselor_name || 'Counselor'}.`, 'success');
      onLeadCreated(res);
      onClose();
    } catch (err: any) {
      // Check if duplicate error returned
      try {
        const errorJson = JSON.parse(err.message);
        if (errorJson.duplicates) {
          setDuplicateMatches(errorJson.duplicates);
          setDuplicateReasons(errorJson.reasons || ['Matched existing phone/email']);
          setDuplicateModalOpen(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Fallback check duplicate manually if 409
        const dup = await api.checkDuplicate({
          phone: formData.phone,
          whatsapp_number: formData.whatsapp_number,
          email: formData.email
        });
        if (dup.hasDuplicate) {
          setDuplicateMatches(dup.duplicates);
          setDuplicateReasons(dup.matchReasons || ['Phone or email matches an existing record']);
          setDuplicateModalOpen(true);
          setLoading(false);
          return;
        }
      }

      showToast(err.message || 'Unable to save lead. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
        <div
          className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Create New Student Lead
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Nepal &amp; India
                  </span>
                </h2>
                <p className="text-xs text-blue-200">
                  Fill details below. Automatic counselor assignment and duplicate checks apply.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form
            onSubmit={e => {
              e.preventDefault();
              submitLead(false);
            }}
            className="p-6 space-y-6 max-h-[75vh] overflow-y-auto"
          >
            {/* Section 1: Basic Information */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-200 pb-1 mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                1. Student Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Ramesh Karki"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder="+977 9801234567 or +91 9811223344"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp_number}
                    onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="Same as phone or different"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Location */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-200 pb-1 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                2. Target Market Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <select
                    value={formData.country}
                    onChange={e => {
                      const c = e.target.value;
                      setFormData({
                        ...formData,
                        country: c,
                        city: c === 'Nepal' ? 'Kathmandu' : 'Delhi'
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Nepal">🇳🇵 Nepal</option>
                    <option value="India">🇮🇳 India</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {(formData.country === 'Nepal' ? targetCitiesNepal : targetCitiesIndia).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Local Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Baneshwor, Kathmandu"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Academic Qualifications */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-200 pb-1 mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                3. Academic Qualification &amp; Entrance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.academic_qualification}
                    onChange={e => setFormData({ ...formData, academic_qualification: e.target.value })}
                    placeholder="e.g. +2 Science, 10+2 CBSE, BCA Graduate"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">10th / SEE %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.percentage_10th}
                    onChange={e => setFormData({ ...formData, percentage_10th: e.target.value })}
                    placeholder="e.g. 85.5"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">12th / +2 %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.percentage_12th}
                    onChange={e => setFormData({ ...formData, percentage_12th: e.target.value })}
                    placeholder="e.g. 82.0"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entrance Exam</label>
                  <input
                    type="text"
                    value={formData.entrance_exam}
                    onChange={e => setFormData({ ...formData, entrance_exam: e.target.value })}
                    placeholder="JEE Main, NEET, SNAP, CMAT, SRMJEEE"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Score / Rank</label>
                  <input
                    type="text"
                    value={formData.entrance_score}
                    onChange={e => setFormData({ ...formData, entrance_score: e.target.value })}
                    placeholder="e.g. 88 Percentile, 480 Marks"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Preferences */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-200 pb-1 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                4. Course &amp; University Preferences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred University <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.preferred_university}
                    onChange={e => setFormData({ ...formData, preferred_university: e.target.value })}
                    list="uni-list"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="uni-list">
                    {universities.map(u => (
                      <option key={u.id} value={u.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Course <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.preferred_course}
                    onChange={e => setFormData({ ...formData, preferred_course: e.target.value })}
                    list="course-list"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="course-list">
                    {courses.map(c => (
                      <option key={c.id} value={c.course_name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Second University Choice</label>
                  <input
                    type="text"
                    value={formData.second_university}
                    onChange={e => setFormData({ ...formData, second_university: e.target.value })}
                    placeholder="Alternative backup university"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Budget</label>
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g. ₹10L - ₹14L"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="scholarship"
                    checked={formData.scholarship_required}
                    onChange={e => setFormData({ ...formData, scholarship_required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="scholarship" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Scholarship Guidance Required
                  </label>
                </div>
              </div>
            </div>

            {/* Section 5: CRM Operations & Assignment */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 border-b border-slate-200 pb-1 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                5. Source, Counselor &amp; Temperature
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={formData.lead_source}
                    onChange={e => setFormData({ ...formData, lead_source: e.target.value as LeadSource })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Meta Ads">Meta Ads</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Website">Website</option>
                    <option value="Google">Google</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Phone">Phone</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Event">Event</option>
                    <option value="Organic">Organic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature</label>
                  <select
                    value={formData.lead_temperature}
                    onChange={e => setFormData({ ...formData, lead_temperature: e.target.value as LeadTemperature })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="HOT">🔥 HOT (Immediate Intent)</option>
                    <option value="WARM">☀️ WARM (Considering Options)</option>
                    <option value="COLD">❄️ COLD (Early Stage/Inquiry)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Counselor
                  </label>
                  <select
                    value={formData.assigned_counselor_id}
                    onChange={e => setFormData({ ...formData, assigned_counselor_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">⚡ Auto-assign (Round Robin / City Match)</option>
                    {counselors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.current_active_leads} leads active)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Counselor Remarks</label>
                  <textarea
                    rows={2}
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Student inquiries, budget constraints, timing preferences..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/20 disabled:opacity-60 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Lead...' : 'Save & Assign Lead'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Warning Modal (Per Section 8) */}
      <DuplicateWarningModal
        isOpen={duplicateModalOpen}
        duplicates={duplicateMatches}
        reasons={duplicateReasons}
        onClose={() => setDuplicateModalOpen(false)}
        onCreateAnyway={() => {
          setDuplicateModalOpen(false);
          submitLead(true);
        }}
      />
    </>
  );
};
