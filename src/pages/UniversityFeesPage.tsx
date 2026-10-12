import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Search,
  Filter,
  Layers,
  MapPin,
  Award,
  DollarSign,
  GraduationCap,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { UniversityCourse, University, Course } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const UniversityFeesPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { currentRole } = useAuth();
  const isAdmin = currentRole === 'Super Admin' || currentRole === 'Admin';

  const [feeStructures, setFeeStructures] = useState<UniversityCourse[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [maxBudget, setMaxBudget] = useState<number | ''>('');
  const [selectedCity, setSelectedCity] = useState('');

  // Comparison selection
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparedData, setComparedData] = useState<UniversityCourse[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Modal for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UniversityCourse | null>(null);

  // Form fields
  const [formUniId, setFormUniId] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formTuition, setFormTuition] = useState<number>(350000);
  const [formHostel, setFormHostel] = useState<number>(110000);
  const [formOneTime, setFormOneTime] = useState<number>(25000);
  const [formOther, setFormOther] = useState<number>(15000);
  const [formTotalFull, setFormTotalFull] = useState<number>(1850000);
  const [formEligibility, setFormEligibility] = useState('');
  const [formScholarshipAvail, setFormScholarshipAvail] = useState(true);
  const [formScholarshipDetails, setFormScholarshipDetails] = useState('');
  const [formDeadline, setFormDeadline] = useState('2026-06-30');
  const [formAdmissionProcess, setFormAdmissionProcess] = useState('Direct Counseling / Merit');
  const [formRemarks, setFormRemarks] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uniList, courseList, feesList] = await Promise.all([
        api.getUniversities(),
        api.getCourses(),
        api.getUniversityCourses({
          search,
          university_id: selectedUniversity,
          stream: selectedStream,
          course_level: selectedLevel,
          city: selectedCity,
          max_fee: maxBudget ? String(maxBudget) : ''
        })
      ]);
      setUniversities(uniList);
      setCourses(courseList);
      setFeeStructures(feesList);
    } catch (err: any) {
      addToast(err.message || 'Failed to load fee database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedUniversity, selectedStream, selectedLevel, selectedCity, maxBudget]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormUniId(universities[0]?.id || '');
    setFormCourseId(courses[0]?.id || '');
    setFormTuition(350000);
    setFormHostel(110000);
    setFormOneTime(25000);
    setFormOther(15000);
    setFormTotalFull(1850000);
    setFormEligibility('60%+ in 10+2 with relevant subjects');
    setFormScholarshipAvail(true);
    setFormScholarshipDetails('Merit-based fee concession up to 35% on tuition');
    setFormDeadline('2026-06-30');
    setFormAdmissionProcess('Direct Counseling / Merit Screening');
    setFormRemarks('Seats filling fast for 2026 batch');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: UniversityCourse) => {
    setEditingItem(item);
    setFormUniId(item.university_id);
    setFormCourseId(item.course_id);
    setFormTuition(item.tuition_fee_per_year);
    setFormHostel(item.hostel_fee_per_year);
    setFormOneTime(item.one_time_fee);
    setFormOther(item.other_charges);
    setFormTotalFull(item.total_full_course_fee || 0);
    setFormEligibility(item.eligibility_notes || '');
    setFormScholarshipAvail(item.scholarship_available === 1);
    setFormScholarshipDetails(item.scholarship_details || '');
    setFormDeadline(item.application_deadline ? item.application_deadline.slice(0, 10) : '');
    setFormAdmissionProcess(item.admission_process || '');
    setFormRemarks(item.remarks || '');
    setModalOpen(true);
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUniId || !formCourseId) {
      addToast('Please select both University and Course', 'error');
      return;
    }

    const payload = {
      university_id: formUniId,
      course_id: formCourseId,
      tuition_fee_per_year: formTuition,
      hostel_fee_per_year: formHostel,
      one_time_fee: formOneTime,
      other_charges: formOther,
      total_first_year_fee: formTuition + formHostel + formOneTime + formOther,
      total_full_course_fee: formTotalFull,
      eligibility_notes: formEligibility,
      scholarship_available: formScholarshipAvail ? 1 : 0,
      scholarship_details: formScholarshipDetails,
      application_deadline: formDeadline || null,
      admission_process: formAdmissionProcess,
      remarks: formRemarks,
    };

    try {
      if (editingItem) {
        await api.updateUniversityCourse(editingItem.id, payload);
        addToast('Fee structure updated successfully', 'success');
      } else {
        await api.createUniversityCourse(payload);
        addToast('New fee structure added successfully', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save fee structure', 'error');
    }
  };

  const handleDeleteFee = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the fee structure for ${name}?`)) return;
    try {
      await api.deleteUniversityCourse(id);
      addToast('Fee structure removed', 'success');
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete fee structure', 'error');
    }
  };

  const toggleComparison = (id: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 5) {
          addToast('You can compare a maximum of 5 universities side-by-side', 'warning');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleOpenComparison = async () => {
    if (selectedForComparison.length < 2) {
      addToast('Please select at least 2 universities to compare', 'warning');
      return;
    }
    setLoadingCompare(true);
    setShowComparisonModal(true);
    try {
      const data = await api.compareUniversityCourses(selectedForComparison);
      setComparedData(data);
    } catch (err: any) {
      addToast('Error comparing universities: ' + err.message, 'error');
    } finally {
      setLoadingCompare(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'N/A';
    return '₹' + val.toLocaleString('en-IN');
  };

  const streamOptions = [
    'Engineering & Technology',
    'Management & Business',
    'Medical & Health Sciences',
    'Computer Applications & IT',
    'Law & Legal Studies',
    'Pharmacy',
    'General'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Landmark className="w-4 h-4" />
            <span>Admission Advisory Database</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            University &amp; Course Fee Structure
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Complete institutional fee directory with annual tuition, hostel options, scholarship criteria, and total program estimates for rapid student counseling.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedForComparison.length >= 2 && (
            <button
              onClick={handleOpenComparison}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all animate-pulse"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compare Selected ({selectedForComparison.length})</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fee Structure</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search query */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search university, course, stream..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {/* University Filter */}
          <div>
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 text-slate-700 font-medium"
            >
              <option value="">All Universities ({universities.length})</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.city})
                </option>
              ))}
            </select>
          </div>

          {/* Stream Filter */}
          <div>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 text-slate-700 font-medium"
            >
              <option value="">All Streams</option>
              {streamOptions.map((str) => (
                <option key={str} value={str}>
                  {str}
                </option>
              ))}
            </select>
          </div>

          {/* Degree Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 text-slate-700 font-medium"
            >
              <option value="">All Degree Levels</option>
              <option value="Undergraduate">Undergraduate (UG)</option>
              <option value="Postgraduate">Postgraduate (PG)</option>
              <option value="Diploma">Diploma / Polytechnic</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Budget Range & City */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-slate-500 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Max 1st Year Budget:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { label: 'Any', value: '' },
                { label: '≤ ₹3L', value: 300000 },
                { label: '≤ ₹5L', value: 500000 },
                { label: '≤ ₹8L', value: 800000 },
                { label: '≤ ₹12L', value: 1200000 },
              ].map((b) => (
                <button
                  key={b.label}
                  onClick={() => setMaxBudget(b.value as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    maxBudget === b.value
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Showing <strong className="text-slate-800">{feeStructures.length}</strong> programs</span>
            {(selectedUniversity || selectedStream || selectedLevel || maxBudget || search) && (
              <button
                onClick={() => {
                  setSelectedUniversity('');
                  setSelectedStream('');
                  setSelectedLevel('');
                  setMaxBudget('');
                  setSelectedCity('');
                  setSearch('');
                }}
                className="text-blue-600 hover:underline font-semibold ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Fee Cards */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading verified university fees &amp; scholarship data...</span>
        </div>
      ) : feeStructures.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Landmark className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No matching programs found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your budget slider or clearing specific filters. Admins can add new university fee structures anytime.
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
            >
              Add Fee Record
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {feeStructures.map((item) => {
            const isSelected = selectedForComparison.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/20'
                    : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                {/* Card Top Banner */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {item.course_level || 'Undergraduate'}
                        </span>
                        {item.stream && (
                          <span className="text-[10px] font-medium text-slate-500 truncate">
                            {item.stream}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 mt-1">
                        {item.course_name}
                      </h3>
                      <div className="text-xs font-semibold text-blue-900 flex items-center gap-1 truncate">
                        <Landmark className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{item.university_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {item.university_city}, {item.university_state}
                        </span>
                        {item.university_ranking && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold truncate">
                            {item.university_ranking}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compare Checkbox */}
                    <button
                      onClick={() => toggleComparison(item.id)}
                      className={`shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                          : 'border-slate-300 hover:border-purple-400 bg-white text-transparent'
                      }`}
                      title={isSelected ? 'Remove from comparison' : 'Select to compare side-by-side'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-3" />
                    </button>
                  </div>

                  {/* Fee Breakdown Pill Grid */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Annual Tuition:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatCurrency(item.tuition_fee_per_year)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Hostel &amp; Mess:</span>
                        <span className="font-medium text-slate-700 font-mono">
                          {formatCurrency(item.hostel_fee_per_year)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">One-Time / Other:</span>
                        <span className="font-medium text-slate-700 font-mono">
                          {formatCurrency((item.one_time_fee || 0) + (item.other_charges || 0))}
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">1st Year Estimate:</span>
                        <span className="font-extrabold text-blue-700 text-sm font-mono">
                          {formatCurrency(item.total_first_year_fee)}
                        </span>
                      </div>
                    </div>

                    {item.total_full_course_fee && item.total_full_course_fee > 0 && (
                      <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                        <span>Total Course Est ({item.course_duration || '4 Yrs'}):</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {formatCurrency(item.total_full_course_fee)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Scholarship & Eligibility tags */}
                  <div className="space-y-1 text-xs">
                    {item.scholarship_details && (
                      <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 text-[11px] flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          <strong>Scholarship:</strong> {item.scholarship_details}
                        </span>
                      </div>
                    )}

                    {item.eligibility_notes && (
                      <div className="text-[11px] text-slate-600 line-clamp-2">
                        <span className="font-semibold text-slate-700">Eligibility:</span> {item.eligibility_notes}
                      </div>
                    )}

                    {item.application_deadline && (
                      <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline: {item.application_deadline.slice(0, 10)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => toggleComparison(item.id)}
                    className={`font-semibold flex items-center gap-1 ${
                      isSelected ? 'text-purple-700' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{isSelected ? '✓ In Comparison' : '+ Compare'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Edit fee structure"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFee(item.id, `${item.university_name} - ${item.course_name}`)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete fee structure"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Comparison Drawer (when items selected) */}
      {selectedForComparison.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 max-w-2xl mx-auto px-4">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold text-sm flex items-center justify-center">
                {selectedForComparison.length}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Programs selected for side-by-side comparison</h4>
                <p className="text-[11px] text-slate-400">
                  {selectedForComparison.length < 2 ? 'Select at least 1 more program to compare' : 'Ready to compare fees & scholarships'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedForComparison([])}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                Clear
              </button>
              <button
                disabled={selectedForComparison.length < 2}
                onClick={handleOpenComparison}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md ${
                  selectedForComparison.length >= 2
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compare Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Side-by-Side University Comparison
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing {comparedData.length} institutions on tuition, hostel, scholarships and admission criteria
                </p>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Table */}
            <div className="p-6 overflow-x-auto flex-1">
              {loadingCompare ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                  <span>Loading comparative specs...</span>
                </div>
              ) : (
                <div className="min-w-[650px]">
                  <div className="grid grid-cols-[160px_repeat(auto-fit,minmax(200px,1fr))] border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                    {/* Row 1: University Header */}
                    <div className="bg-slate-100 p-3 font-bold text-xs text-slate-700 flex items-center">
                      University
                    </div>
                    {comparedData.map((c) => (
                      <div key={c.id} className="p-3 bg-blue-50/50 space-y-1">
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

                    {/* Row 2: Course & Stream */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Program &amp; Level
                    </div>
                    {comparedData.map((c) => (
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
                    {comparedData.map((c) => (
                      <div key={c.id} className="p-3 font-bold text-sm text-slate-900 font-mono">
                        {formatCurrency(c.tuition_fee_per_year)}
                      </div>
                    ))}

                    {/* Row 4: Hostel & Mess */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Hostel &amp; Mess / Yr
                    </div>
                    {comparedData.map((c) => (
                      <div key={c.id} className="p-3 text-xs font-mono text-slate-700">
                        {formatCurrency(c.hostel_fee_per_year)}
                      </div>
                    ))}

                    {/* Row 5: 1st Year Estimated Cost */}
                    <div className="bg-blue-50/70 p-3 font-bold text-xs text-blue-950 flex items-center">
                      Total 1st Year Est.
                    </div>
                    {comparedData.map((c) => (
                      <div key={c.id} className="p-3 bg-blue-50/70 font-extrabold text-sm text-blue-700 font-mono">
                        {formatCurrency(c.total_first_year_fee)}
                      </div>
                    ))}

                    {/* Row 6: Total Course Cost */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Full Course Est.
                    </div>
                    {comparedData.map((c) => (
                      <div key={c.id} className="p-3 font-bold text-xs text-slate-800 font-mono">
                        {formatCurrency(c.total_full_course_fee)}
                      </div>
                    ))}

                    {/* Row 7: Scholarship */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Scholarship Offer
                    </div>
                    {comparedData.map((c) => (
                      <div key={c.id} className="p-3 text-xs text-emerald-800 bg-emerald-50/40">
                        {c.scholarship_details || 'Standard merit quota applies'}
                      </div>
                    ))}

                    {/* Row 8: Eligibility */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Eligibility
                    </div>
                    {comparedData.map((c) => (
                      <div key={c.id} className="p-3 text-xs text-slate-600">
                        {c.eligibility_notes || c.course_eligibility || '50%+ in 10+2'}
                      </div>
                    ))}

                    {/* Row 9: Application Deadline */}
                    <div className="bg-slate-50 p-3 font-bold text-xs text-slate-700 flex items-center">
                      Application Deadline
                    </div>
                    {comparedData.map((c) => (
                      <div key={c.id} className="p-3 text-xs text-rose-600 font-medium">
                        {c.application_deadline ? c.application_deadline.slice(0, 10) : 'Open for 2026 Intake'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-2xl">
              <span className="text-xs text-slate-500">
                Data calibrated for official 2026 admissions counseling.
              </span>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Fee Structure Modal (Admin Only) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveFee}
            className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit University Fee Structure' : 'Add University Fee Structure'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">University</label>
                <select
                  required
                  value={formUniId}
                  onChange={(e) => setFormUniId(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Program</label>
                <select
                  required
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fee Breakdown Inputs */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="text-xs font-bold text-slate-800">Annual Fee Breakdown (INR)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Annual Tuition</label>
                  <input
                    type="number"
                    value={formTuition}
                    onChange={(e) => setFormTuition(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Hostel &amp; Food</label>
                  <input
                    type="number"
                    value={formHostel}
                    onChange={(e) => setFormHostel(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">One-Time Fee</label>
                  <input
                    type="number"
                    value={formOneTime}
                    onChange={(e) => setFormOneTime(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Other Charges</label>
                  <input
                    type="number"
                    value={formOther}
                    onChange={(e) => setFormOther(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Calculated 1st Year Total:</span>
                <span className="font-bold text-blue-700 text-sm font-mono">
                  {formatCurrency(formTuition + formHostel + formOneTime + formOther)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Full Course Cost (Estimated)</label>
              <input
                type="number"
                value={formTotalFull}
                onChange={(e) => setFormTotalFull(Number(e.target.value))}
                placeholder="e.g. 1850000"
                className="w-full p-2 text-xs rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scholarship Details</label>
              <input
                type="text"
                value={formScholarshipDetails}
                onChange={(e) => setFormScholarshipDetails(e.target.value)}
                placeholder="e.g. 25% merit scholarship on tuition based on 12th marks"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Eligibility Notes</label>
                <input
                  type="text"
                  value={formEligibility}
                  onChange={(e) => setFormEligibility(e.target.value)}
                  placeholder="e.g. 60%+ in 10+2 with PCM"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Application Deadline</label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Save Fee Structure
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
