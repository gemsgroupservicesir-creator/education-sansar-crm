import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Calendar, RefreshCw, X, ShieldAlert, Edit2, Trash2, Filter, Layers } from 'lucide-react';
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
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-900/20 self-start sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
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
    </div>
  );
};
