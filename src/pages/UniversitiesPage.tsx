import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, ExternalLink, MapPin, Award, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';
import { University } from '../types';
import { useNotifications } from '../context/NotificationContext';

export const UniversitiesPage: React.FC = () => {
  const { showToast } = useNotifications();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [uniType, setUniType] = useState<'Private' | 'Deemed' | 'State' | 'Central' | 'Autonomous'>('Deemed');
  const [ranking, setRanking] = useState('');
  const [website, setWebsite] = useState('');
  const [contact, setContact] = useState('');

  const fetchUnis = async () => {
    setLoading(true);
    try {
      const data = await api.getUniversities();
      setUniversities(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnis();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || !state) return;
    try {
      await api.createUniversity({
        name,
        campus,
        city,
        state,
        country,
        university_type: uniType,
        ranking,
        website,
        contact
      });
      showToast('University partner added successfully', 'success');
      setModalOpen(false);
      setName('');
      setCampus('');
      setCity('');
      setState('');
      fetchUnis();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filtered = universities.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            Partner Universities Directory
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono">
              {universities.length} Institutions
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Partner colleges across India with admission tie-ups, eligibility criteria &amp; quotas
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add University</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search universities by name or city..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Universities Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Loading universities...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(u => (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-sm">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {u.is_demo === 1 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
                        DEMO
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {u.university_type}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-3 leading-snug">{u.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{u.campus ? `${u.campus}, ` : ''}{u.city}, {u.state}</span>
                </p>

                {u.ranking && (
                  <div className="text-[11px] text-amber-700 bg-amber-50/60 p-2 rounded-lg border border-amber-200/50 mt-2 font-medium">
                    🏆 {u.ranking}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  📚 {u.courses_count || 0} Programs
                </span>
                {u.website && (
                  <a
                    href={u.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
          <form onSubmit={handleCreate} className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add Partner University</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">University Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. SRM Institute of Science and Technology"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  required
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Chennai"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  required
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="Tamil Nadu"
                  className="w-full p-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus</label>
              <input
                type="text"
                value={campus}
                onChange={e => setCampus(e.target.value)}
                placeholder="Kattankulathur Main Campus"
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://..."
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
                Save University
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
