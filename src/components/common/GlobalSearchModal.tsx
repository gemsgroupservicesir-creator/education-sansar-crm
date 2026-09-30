import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Award, GraduationCap, Building2, BookOpen, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    leads: any[];
    students: any[];
    applications: any[];
    universities: any[];
    courses: any[];
  }>({
    leads: [],
    students: [],
    applications: [],
    universities: [],
    courses: []
  });

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ leads: [], students: [], applications: [], universities: [], courses: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ leads: [], students: [], applications: [], universities: [], courses: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(query.trim());
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasAnyResults =
    results.leads.length > 0 ||
    results.students.length > 0 ||
    results.applications.length > 0 ||
    results.universities.length > 0 ||
    results.courses.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by student name, phone, email, lead ID, university, course..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-xs font-semibold px-2 py-1 rounded bg-slate-200/70 hover:bg-slate-300 text-slate-600"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-500">Searching...</div>
          )}

          {!loading && query && !hasAnyResults && (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-slate-700">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by student name, phone number, or university.</p>
            </div>
          )}

          {/* Leads */}
          {results.leads.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Leads ({results.leads.length})</span>
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {results.leads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => {
                      navigate(`/leads/${lead.id}`);
                      onClose();
                    }}
                    className="p-2.5 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{lead.student_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono">
                          {lead.lead_id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {lead.lead_status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>📞 {lead.phone}</span>
                        <span>🎓 {lead.preferred_course}</span>
                        <span>🏛️ {lead.preferred_university}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enrolled Students */}
          {results.students.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enrolled Students ({results.students.length})</span>
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {results.students.map(stu => (
                  <div
                    key={stu.id}
                    onClick={() => {
                      navigate(`/students`);
                      onClose();
                    }}
                    className="p-2.5 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{stu.student_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                          {stu.student_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>🏛️ {stu.university}</span>
                        <span>📚 {stu.course}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {results.applications.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Applications ({results.applications.length})</span>
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {results.applications.map(app => (
                  <div
                    key={app.id}
                    onClick={() => {
                      navigate('/applications');
                      onClose();
                    }}
                    className="p-2.5 hover:bg-indigo-50/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{app.student_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
                          {app.application_id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {app.application_status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {app.university_name} — {app.course_name}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Universities & Courses */}
          {(results.universities.length > 0 || results.courses.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.universities.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Universities</span>
                  </div>
                  <div className="space-y-1">
                    {results.universities.map(u => (
                      <div
                        key={u.id}
                        onClick={() => {
                          navigate('/universities');
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-xs"
                      >
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.city}, {u.state}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.courses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Courses</span>
                  </div>
                  <div className="space-y-1">
                    {results.courses.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          navigate('/courses');
                          onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer text-xs"
                      >
                        <div className="font-semibold text-slate-900">{c.course_name}</div>
                        <div className="text-[11px] text-slate-500">{c.university_name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
