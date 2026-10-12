import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  MapPin,
  Award,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  ShieldCheck,
  Landmark
} from 'lucide-react';
import { api } from '../services/api';
import { University } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const UniversitiesPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { currentRole } = useAuth();
  const isAdmin = currentRole === 'Super Admin' || currentRole === 'Admin';

  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<University | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [campus, setCampus] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [uniType, setUniType] = useState<'Private' | 'Deemed' | 'State' | 'Central' | 'Autonomous'>('Deemed');
  const [accreditation, setAccreditation] = useState('NAAC A++');
  const [ranking, setRanking] = useState('');
  const [website, setWebsite] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');

  const fetchUnis = async () => {
    setLoading(true);
    try {
      const data = await api.getUniversities();
      setUniversities(data);
    } catch (err: any) {
      addToast(err.message || 'Failed to load universities', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnis();
  }, []);

  const handleOpenAdd = () => {
    setEditingUni(null);
    setName('');
    setShortName('');
    setCampus('');
    setCity('');
    setState('');
    setCountry('India');
    setUniType('Deemed');
    setAccreditation('NAAC A++');
    setRanking('NIRF Ranked');
    setWebsite('https://');
    setContact('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (u: University) => {
    setEditingUni(u);
    setName(u.name);
    setShortName(u.short_name || '');
    setCampus(u.campus || '');
    setCity(u.city);
    setState(u.state);
    setCountry(u.country || 'India');
    setUniType((u.university_type as any) || 'Deemed');
    setAccreditation(u.accreditation || '');
    setRanking(u.ranking || '');
    setWebsite(u.website || '');
    setContact(u.contact || '');
    setDescription(u.description || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || !state) return;

    try {
      const payload = {
        name,
        short_name: shortName,
        campus,
        city,
        state,
        country,
        university_type: uniType,
        accreditation,
        ranking,
        website,
        contact,
        description,
      };

      if (editingUni) {
        await api.updateUniversity(editingUni.id, payload);
        addToast('University details updated successfully', 'success');
      } else {
        await api.createUniversity(payload);
        addToast('University partner added successfully', 'success');
      }
      setModalOpen(false);
      fetchUnis();
    } catch (err: any) {
      addToast(err.message || 'Failed to save university', 'error');
    }
  };

  const handleDelete = async (id: string, uniName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${uniName}? This will also delete linked fee records.`)) return;
    try {
      await api.deleteUniversity(id);
      addToast('University partner removed', 'success');
      fetchUnis();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete university', 'error');
    }
  };

  const filtered = universities.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase()) ||
      (u.short_name && u.short_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Building2 className="w-4 h-4" />
            <span>Institutional Partners Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Partner Universities Directory
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono">
              {universities.length} Institutions
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Partner colleges across India with admission tie-ups, accreditation, campus locations &amp; direct seat allotments.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 self-start sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add University</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search universities by name, short name or city..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-sky-500"
          />
        </div>
      </div>

      {/* Universities Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading universities...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {u.short_name ? u.short_name.slice(0, 3) : u.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {u.accreditation && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {u.accreditation}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {u.university_type}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{u.name}</h3>
                  {u.short_name && (
                    <div className="text-[11px] text-blue-600 font-semibold font-mono mt-0.5">
                      {u.short_name}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {u.campus ? `${u.campus}, ` : ''}
                      {u.city}, {u.state}
                    </span>
                  </p>
                </div>

                {u.ranking && (
                  <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60 font-semibold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{u.ranking}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 font-medium">
                  📚 {(u as any).fee_structures_count || (u as any).courses_count || 0} Programs
                </div>

                <div className="flex items-center gap-2">
                  {u.website && (
                    <a
                      href={u.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md"
                        title="Edit University"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                        title="Delete University"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                {editingUni ? 'Edit Partner University' : 'Add Partner University'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">University Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SRM Institute of Science and Technology"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Name</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. SRMIST"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  required
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Chennai"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  required
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Tamil Nadu"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus</label>
              <input
                type="text"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="Kattankulathur Main Campus"
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Type</label>
                <select
                  value={uniType}
                  onChange={(e) => setUniType(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Deemed">Deemed University</option>
                  <option value="Private">Private University</option>
                  <option value="Autonomous">Autonomous College</option>
                  <option value="State">State University</option>
                  <option value="Central">Central University</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Accreditation</label>
                <input
                  type="text"
                  value={accreditation}
                  onChange={(e) => setAccreditation(e.target.value)}
                  placeholder="NAAC A++"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">National Ranking</label>
                <input
                  type="text"
                  value={ranking}
                  onChange={(e) => setRanking(e.target.value)}
                  placeholder="NIRF Top 20"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://srmist.edu.in"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
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
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
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
