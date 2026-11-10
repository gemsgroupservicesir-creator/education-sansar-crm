import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  RefreshCw,
  X,
  ShieldAlert,
  Edit2,
  Trash2,
  Filter,
  Layers,
  Sparkles,
  Globe,
  CheckSquare,
  Square,
  Check,
  Building2,
  Landmark,
  GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import { Course, University } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const CoursesPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { currentRole } = useAuth();
  const isAdmin = currentRole === 'Super Admin' || currentRole === 'Admin';

  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedUni, setSelectedUni] = useState('');
  const [selectedStream, setSelectedStream] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form
  const [courseName, setCourseName] = useState('');
  const [shortName, setShortName] = useState('');
  const [uniName, setUniName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState<'Undergraduate' | 'Postgraduate' | 'Diploma' | 'Doctorate'>('Undergraduate');
  const [stream, setStream] = useState('Engineering & Technology');
  const [duration, setDuration] = useState('4 Years');
  const [eligibility, setEligibility] = useState('');
  const [entranceReq, setEntranceReq] = useState('');
  const [feesRange, setFeesRange] = useState('');
  const [scholarship, setScholarship] = useState('');

  // Website Fetch Modal States
  const [fetchModalOpen, setFetchModalOpen] = useState(false);
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [targetUniId, setTargetUniId] = useState('');
  const [targetUniName, setTargetUniName] = useState('');
  const [detectedUni, setDetectedUni] = useState<any | null>(null);
  const [extractedCourses, setExtractedCourses] = useState<any[]>([]);
  const [selectedCourseIndices, setSelectedCourseIndices] = useState<Set<number>>(new Set());
  const [courseStreamFilter, setCourseStreamFilter] = useState('All');

  const PRESET_UNIVERSITIES = [
    { name: 'Sharda University', url: 'https://www.sharda.ac.in', location: 'Greater Noida' },
    { name: 'Chandigarh University', url: 'https://chandigarhuniversity.ac.in', location: 'Mohali, Punjab' },
    { name: 'Parul University', url: 'https://paruluniversity.ac.in', location: 'Vadodara, Gujarat' },
    { name: 'Galgotias University', url: 'https://www.galgotiasuniversity.edu.in', location: 'Greater Noida' },
    { name: 'Graphic Era University', url: 'https://geu.ac.in', location: 'Dehradun, Uttarakhand' },
    { name: 'Kathmandu University', url: 'https://ku.edu.np', location: 'Dhulikhel, Nepal' }
  ];

  const handleOpenFetchModal = () => {
    setFetchUrl('');
    setExtractedCourses([]);
    setSelectedCourseIndices(new Set());
    setDetectedUni(null);
    setCourseStreamFilter('All');
    if (selectedUni) {
      const found = universities.find((u) => u.id === selectedUni);
      setTargetUniId(selectedUni);
      setTargetUniName(found?.name || '');
    } else {
      setTargetUniId('');
      setTargetUniName('Multiple Universities');
    }
    setFetchModalOpen(true);
  };

  const handleFetchCourses = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || fetchUrl).trim();
    if (!targetUrl) {
      addToast('Please enter a university or programs website link', 'warning');
      return;
    }
    setFetching(true);
    try {
      const res = await api.fetchCoursesFromWebsite({
        url: targetUrl,
        university_id: targetUniId || undefined,
        university_name: targetUniName || undefined,
      });

      if (res.success && Array.isArray(res.courses)) {
        setExtractedCourses(res.courses);
        setDetectedUni(res.detected_university || null);

        // If target university wasn't manually selected, see if detected name matches an existing university
        if (!targetUniId && res.detected_university?.name) {
          const match = universities.find(
            (u) =>
              u.name.toLowerCase() === res.detected_university.name.toLowerCase() ||
              (res.detected_university.short_name && u.short_name?.toLowerCase() === res.detected_university.short_name.toLowerCase())
          );
          if (match) {
            setTargetUniId(match.id);
            setTargetUniName(match.name);
          } else {
            setTargetUniName(res.detected_university.name);
          }
        }

        const allIndices = new Set<number>(res.courses.map((_: any, idx: number) => idx));
        setSelectedCourseIndices(allIndices);
        addToast(`Found ${res.courses.length} courses from ${res.detected_university?.name || targetUrl}!`, 'success');
      } else {
        throw new Error(res.error || 'Failed to extract courses');
      }
    } catch (err: any) {
      addToast(err.message || 'Error fetching courses from link', 'error');
    } finally {
      setFetching(false);
    }
  };

  const toggleCourseSelection = (index: number) => {
    const next = new Set(selectedCourseIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedCourseIndices(next);
  };

  const toggleSelectAllCourses = (filteredCourses: any[]) => {
    const allFilteredSelected = filteredCourses.every((c) => selectedCourseIndices.has(c._originalIndex));
    const next = new Set(selectedCourseIndices);
    if (allFilteredSelected) {
      filteredCourses.forEach((c) => next.delete(c._originalIndex));
    } else {
      filteredCourses.forEach((c) => next.add(c._originalIndex));
    }
    setSelectedCourseIndices(next);
  };

  const handleBatchImport = async () => {
    if (extractedCourses.length === 0 || selectedCourseIndices.size === 0) {
      addToast('No courses selected to import', 'error');
      return;
    }

    const selectedList = extractedCourses.filter((_: any, idx: number) => selectedCourseIndices.has(idx));
    setImporting(true);

    try {
      const res = await api.batchImportCourses({
        university_id: targetUniId || undefined,
        university_name: targetUniName || 'Multiple Universities',
        courses: selectedList,
      });

      addToast(
        `Successfully imported ${res.courses_created ?? selectedList.length} courses${res.fees_created ? ` and ${res.fees_created} fee structures` : ''}!`,
        'success'
      );
      setFetchModalOpen(false);
      setExtractedCourses([]);
      fetchCourses();
    } catch (err: any) {
      addToast(err.message || 'Failed to import courses', 'error');
    } finally {
      setImporting(false);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses({
        universityId: selectedUni || undefined,
        stream: selectedStream || undefined,
        courseLevel: selectedLevel || undefined,
        search: search || undefined
      });
      setCourses(data);
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getUniversities().then(setUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedUni, selectedStream, selectedLevel]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCourses();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setCourseName('');
    setShortName('');
    setUniName(universities[0]?.name || 'Multiple Universities');
    setDegreeLevel('Undergraduate');
    setStream('Engineering & Technology');
    setDuration('4 Years');
    setEligibility('60%+ in 10+2 with PCM');
    setEntranceReq('SRMJEEE / JEE Main / Direct Merit');
    setFeesRange('₹3.5L - ₹4.5L/year');
    setScholarship('Merit scholarships up to 40%');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Course) => {
    setEditingCourse(c);
    setCourseName(c.course_name);
    setShortName(c.short_name || '');
    setUniName(c.university_name);
    setDegreeLevel((c.course_level || c.degree_level || 'Undergraduate') as any);
    setStream(c.stream || 'General');
    setDuration(c.duration || '4 Years');
    setEligibility(c.eligibility || '');
    setEntranceReq(c.entrance_requirement || '');
    setFeesRange(c.fees_range || '');
    setScholarship(c.scholarship_info || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName) return;

    try {
      const payload = {
        course_name: courseName,
        short_name: shortName,
        university_name: uniName || 'Multiple Universities',
        course_level: degreeLevel,
        degree_level: degreeLevel,
        stream,
        duration,
        eligibility,
        entrance_requirement: entranceReq,
        fees_range: feesRange,
        scholarship_info: scholarship,
      };

      if (editingCourse) {
        await api.updateCourse(editingCourse.id, payload);
        addToast('Course program updated successfully', 'success');
      } else {
        await api.createCourse(payload);
        addToast('Course program added successfully', 'success');
      }
      setModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete course ${name}?`)) return;
    try {
      await api.deleteCourse(id);
      addToast('Course program deleted', 'success');
      fetchCourses();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-purple-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Academic Curriculum Registry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Courses &amp; Degree Programs
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">
              {courses.length} Programs
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Undergraduate, Postgraduate &amp; Professional degrees with eligibility criteria, entrance expectations &amp; stream categorization.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleOpenFetchModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Fetch Courses from Website</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search course title or stream..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-purple-500"
          />
        </div>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
        >
          <option value="">All Degree Levels</option>
          <option value="Undergraduate">Undergraduate (UG)</option>
          <option value="Postgraduate">Postgraduate (PG)</option>
          <option value="Diploma">Diploma / Polytechnic</option>
        </select>

        <select
          value={selectedStream}
          onChange={(e) => setSelectedStream(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
        >
          <option value="">All Streams</option>
          <option value="Engineering & Technology">Engineering &amp; Technology</option>
          <option value="Management & Business">Management &amp; Business</option>
          <option value="Medical & Health Sciences">Medical &amp; Health Sciences</option>
          <option value="Computer Applications & IT">Computer Applications &amp; IT</option>
          <option value="Law & Legal Studies">Law &amp; Legal Studies</option>
          <option value="General">General</option>
        </select>

        <select
          value={selectedUni}
          onChange={(e) => setSelectedUni(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
        >
          <option value="">All Partner Universities</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
          <span>Loading course catalog...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <p className="text-xs text-slate-500">No courses match the current filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    {c.course_level || c.degree_level} · {c.duration}
                  </span>
                  {c.stream && (
                    <span className="text-[10px] font-medium text-slate-500 truncate max-w-[120px]">
                      {c.stream}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2 leading-snug">{c.course_name}</h3>
                <div className="text-xs font-semibold text-blue-600 mt-0.5">{c.university_name}</div>

                <div className="space-y-1.5 pt-3 text-xs">
                  {c.eligibility && (
                    <div className="text-slate-600 line-clamp-2">
                      <span className="text-slate-400 font-medium">Eligibility:</span> {c.eligibility}
                    </div>
                  )}

                  {c.entrance_requirement && (
                    <div className="text-slate-600 text-[11px]">
                      <span className="text-slate-400 font-medium">Entrance:</span> {c.entrance_requirement}
                    </div>
                  )}

                  {c.fees_range && (
                    <div className="text-slate-700 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100">
                      💰 Indicative Fee: <span className="text-blue-700">{c.fees_range}</span>
                    </div>
                  )}

                  {c.scholarship_info && (
                    <div className="text-emerald-700 text-[11px] font-medium line-clamp-1">
                      🎓 {c.scholarship_info}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Intake: <strong className="text-slate-700">{c.intake || 'Fall 2026'}</strong></span>
                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit Course"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.course_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Course */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingCourse ? 'Edit Course Program' : 'Add Course Program'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name</label>
              <input
                required
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. B.Tech Computer Science & Engineering"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degree Level</label>
                <select
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Doctorate">Doctorate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stream</label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Engineering & Technology">Engineering</option>
                  <option value="Management & Business">Management</option>
                  <option value="Medical & Health Sciences">Medical / Health</option>
                  <option value="Computer Applications & IT">Computer / IT</option>
                  <option value="Law & Legal Studies">Law</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 4 Years"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entrance Requirement</label>
                <input
                  type="text"
                  value={entranceReq}
                  onChange={(e) => setEntranceReq(e.target.value)}
                  placeholder="e.g. SRMJEEE / JEE"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Eligibility</label>
              <input
                type="text"
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="e.g. 60%+ in 10+2 with PCM"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Indicative Fee Range</label>
              <input
                type="text"
                value={feesRange}
                onChange={(e) => setFeesRange(e.target.value)}
                placeholder="e.g. ₹3.5L - ₹4.5L/year"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
              >
                Save Course
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Website Courses Fetch Modal */}
      {fetchModalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                    Fetch &amp; Batch Import Courses from Website Link
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Live Catalog Extractor
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Paste an official university or program catalog link to detect academic courses, degrees, eligibility, and fees.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFetchModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* University Selection & URL Input Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Link To University</span>
                  </label>
                  <select
                    value={targetUniId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setTargetUniId(id);
                      if (id) {
                        const u = universities.find((uni) => uni.id === id);
                        setTargetUniName(u?.name || '');
                      } else {
                        setTargetUniName('Multiple Universities');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 shadow-2xs"
                  >
                    <option value="">Multiple / Partner Universities (Global)</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.city ? `(${u.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    <span>University Website Link</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={fetchUrl}
                      onChange={(e) => setFetchUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFetchCourses();
                        }
                      }}
                      placeholder="e.g. https://chandigarhuniversity.ac.in or https://www.sharda.ac.in"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-purple-500 font-mono shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleFetchCourses()}
                      disabled={fetching || !fetchUrl.trim()}
                      className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      {fetching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Extracting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Fetch Courses</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-slate-400" /> Quick Presets:
                </span>
                {PRESET_UNIVERSITIES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFetchUrl(preset.url);
                      handleFetchCourses(preset.url);
                    }}
                    disabled={fetching}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 transition-colors shadow-2xs"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {fetching && (
                <div className="py-20 text-center space-y-3">
                  <div className="inline-flex p-4 rounded-2xl bg-purple-50 text-purple-600 animate-pulse">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Scanning University Curriculum &amp; Programs...</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Retrieving courses across Engineering, Medical, Management, IT, Nursing, Law &amp; Sciences with degree levels, duration, and tuition ranges.
                  </p>
                </div>
              )}

              {!fetching && extractedCourses.length === 0 && (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No Courses Extracted Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Enter any university or program link above or click a preset to parse all degree programs automatically.
                  </p>
                </div>
              )}

              {!fetching && extractedCourses.length > 0 && (
                <div className="space-y-4">
                  {/* Detected institution banner if found */}
                  {detectedUni && (
                    <div className="p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-white rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-slate-900">{detectedUni.name}</span>
                        {detectedUni.city && (
                          <span className="text-slate-500">({detectedUni.city}, {detectedUni.state})</span>
                        )}
                      </div>
                      <span className="text-purple-700 font-semibold font-mono">
                        {extractedCourses.length} Courses Detected
                      </span>
                    </div>
                  )}

                  {/* Filter and Selection Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const filtered = courseStreamFilter === 'All'
                            ? extractedCourses.map((c: any, idx: number) => ({ ...c, _originalIndex: idx }))
                            : extractedCourses
                                .map((c: any, idx: number) => ({ ...c, _originalIndex: idx }))
                                .filter((c: any) => c.stream === courseStreamFilter);
                          toggleSelectAllCourses(filtered);
                        }}
                        className="flex items-center gap-1.5 font-bold text-purple-700 hover:text-purple-800"
                      >
                        <CheckSquare className="w-4 h-4 text-purple-600" />
                        <span>Select / Deselect Visible</span>
                      </button>
                      <span className="text-slate-300">|</span>
                      <span className="font-semibold text-slate-600">
                        {selectedCourseIndices.size} of {extractedCourses.length} selected
                      </span>
                    </div>

                    {/* Stream filter */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      {['All', 'Engineering & Technology', 'Medical & Allied Health', 'Management & Commerce', 'Computer Applications & IT', 'Nursing', 'Pharmacy', 'Law & Legal Studies'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setCourseStreamFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                            courseStreamFilter === st
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {st === 'All' ? 'All Streams' : st.split('&')[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Course Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {extractedCourses
                      .map((c: any, originalIndex: number) => ({ ...c, _originalIndex: originalIndex }))
                      .filter((c: any) => courseStreamFilter === 'All' || c.stream === courseStreamFilter)
                      .map((c: any) => {
                        const isSelected = selectedCourseIndices.has(c._originalIndex);
                        return (
                          <div
                            key={c._originalIndex}
                            onClick={() => toggleCourseSelection(c._originalIndex)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                              isSelected
                                ? 'bg-purple-50/70 border-purple-300 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 opacity-70'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h5 className="font-bold text-xs text-slate-900 leading-snug">
                                  {c.course_name}
                                </h5>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 shrink-0 font-mono">
                                  {c.course_level || c.degree_level}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 font-medium">
                                  {c.stream}
                                </span>
                                <span>•</span>
                                <span>{c.duration}</span>
                              </div>

                              {c.fees_range && (
                                <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                  <span>Est. Tuition: {c.fees_range}</span>
                                </div>
                              )}

                              {c.eligibility && (
                                <div className="text-[10px] text-slate-500 line-clamp-1">
                                  <span className="font-semibold text-slate-700">Eligibility:</span> {c.eligibility}
                                </div>
                              )}

                              {c.scholarship_info && (
                                <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 line-clamp-1">
                                  🎓 {c.scholarship_info}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                {extractedCourses.length > 0 ? (
                  <span className="font-semibold text-slate-700">
                    Target: <span className="text-purple-700 font-bold">{targetUniName || 'Multiple Universities'}</span> • {selectedCourseIndices.size} selected
                  </span>
                ) : (
                  <span>Provide URL or select a preset to extract courses</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFetchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={extractedCourses.length === 0 || selectedCourseIndices.size === 0 || importing}
                  onClick={handleBatchImport}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importing Courses...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Import ({selectedCourseIndices.size}) Selected Courses</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
