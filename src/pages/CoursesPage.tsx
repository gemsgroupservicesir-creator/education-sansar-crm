import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Calendar, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { Course, University } from '../types';
import { useNotifications } from '../context/NotificationContext';

export const CoursesPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [courseName, setCourseName] = useState('');
  const [uniName, setUniName] = useState('');
  const [degreeLevel, setDegreeLevel] = useState<'Undergraduate' | 'Postgraduate' | 'Diploma' | 'Doctorate'>('Undergraduate');
  const [duration, setDuration] = useState('4 Years');
  const [eligibility, setEligibility] = useState('');
  const [feesRange, setFeesRange] = useState('');
  const [scholarship, setScholarship] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await api.getCourses(selectedUni);
      setCourses(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getUniversities().then(setUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedUni]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName || !uniName) return;

    try {
      await api.createCourse({
        course_name: courseName,
        university_name: uniName,
        degree_level: degreeLevel,
        duration,
        eligibility,
        fees_range: feesRange,
        scholarship_info: scholarship
      });
      showToast('Course program added successfully', 'success');
      setModalOpen(false);
      setCourseName('');
      setEligibility('');
      fetchCourses();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filtered = courses.filter(c =>
    c.course_name.toLowerCase().includes(search.toLowerCase()) ||
    c.university_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            Courses &amp; Degree Programs
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono">
              {courses.length} Programs
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Undergraduate, Postgraduate &amp; Professional degrees with indicative fee brackets &amp; scholarship criteria
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </button>
      </div>

      {/* Demo Fees Notice (Section 18 & 44) */}
      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Notice:</strong> All course fees and scholarship figures shown are indicative demonstration data for counseling illustration. Official fees are determined by partner university admission circulars.
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search course name or university..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={selectedUni}
          onChange={e => setSelectedUni(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 w-full sm:w-auto"
        >
          <option value="">All Partner Universities</option>
          {universities.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* Course Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
          <span>Loading course catalog...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                    {c.degree_level} · {c.duration}
                  </span>
                  {c.is_demo === 1 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                      DEMO
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2 leading-snug">{c.course_name}</h3>
                <div className="text-xs font-semibold text-blue-600 mt-0.5">{c.university_name}</div>

                <div className="space-y-1.5 pt-3 text-xs">
                  {c.eligibility && (
                    <div className="text-slate-600">
                      <span className="text-slate-400 font-medium">Eligibility:</span> {c.eligibility}
                    </div>
                  )}

                  {c.fees_range && (
                    <div className="text-slate-700 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100">
                      💰 Indicative Fee: <span className="text-blue-700">{c.fees_range}</span>
                    </div>
                  )}

                  {c.scholarship_info && (
                    <div className="text-emerald-700 text-[11px] font-medium">
                      🎓 {c.scholarship_info}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Intake: <strong className="text-slate-700">{c.intake || 'Fall 2026'}</strong></span>
                {c.application_deadline && <span>Deadline: {c.application_deadline}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Course */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form onSubmit={handleCreate} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add Course Program</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name</label>
              <input
                required
                type="text"
                value={courseName}
                onChange={e => setCourseName(e.target.value)}
                placeholder="e.g. B.Tech Computer Science & Engineering"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">University</label>
              <select
                required
                value={uniName}
                onChange={e => setUniName(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Select Partner University</option>
                {universities.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degree Level</label>
                <select
                  value={degreeLevel}
                  onChange={e => setDegreeLevel(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Doctorate">Doctorate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="4 Years"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Indicative Demo Fee</label>
              <input
                type="text"
                value={feesRange}
                onChange={e => setFeesRange(e.target.value)}
                placeholder="₹3.5L - ₹4.5L/year (Demo)"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Eligibility Criteria</label>
              <input
                type="text"
                value={eligibility}
                onChange={e => setEligibility(e.target.value)}
                placeholder="60%+ in 10+2 with PCM"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Save Program
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
