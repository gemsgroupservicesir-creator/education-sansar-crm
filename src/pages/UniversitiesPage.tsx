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
  Landmark,
  Sparkles,
  Globe,
  CheckSquare,
  Square,
  Check,
  GraduationCap,
  DollarSign,
  BookOpen,
  Layers
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

  // Manual Add/Edit Modals
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

  // Website Fetch Modal States
  const [fetchModalOpen, setFetchModalOpen] = useState(false);
  const [fetchUrl, setFetchUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [selectedCourseIndices, setSelectedCourseIndices] = useState<Set<number>>(new Set());
  const [courseStreamFilter, setCourseStreamFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'profile' | 'courses'>('courses');

  const PRESET_UNIVERSITIES = [
    { name: 'Sharda University', url: 'https://www.sharda.ac.in', location: 'Greater Noida' },
    { name: 'Chandigarh University', url: 'https://chandigarhuniversity.ac.in', location: 'Mohali, Punjab' },
    { name: 'Parul University', url: 'https://paruluniversity.ac.in', location: 'Vadodara, Gujarat' },
    { name: 'Galgotias University', url: 'https://www.galgotiasuniversity.edu.in', location: 'Greater Noida' },
    { name: 'Graphic Era University', url: 'https://geu.ac.in', location: 'Dehradun, Uttarakhand' },
    { name: 'Kathmandu University', url: 'https://ku.edu.np', location: 'Dhulikhel, Nepal' }
  ];

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

  const handleOpenFetchModal = () => {
    setFetchUrl('');
    setExtractedData(null);
    setSelectedCourseIndices(new Set());
    setActiveTab('courses');
    setCourseStreamFilter('All');
    setFetchModalOpen(true);
  };

  const handleFetchWebsite = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || fetchUrl).trim();
    if (!targetUrl) {
      addToast('Please enter a university website link (e.g. https://www.sharda.ac.in)', 'warning');
      return;
    }
    setFetching(true);
    try {
      const res = await api.fetchUniversityFromWebsite(targetUrl);
      if (res.success && res.university) {
        setExtractedData(res.university);
        const allIndices = new Set<number>((res.university.courses || []).map((_: any, idx: number) => idx));
        setSelectedCourseIndices(allIndices);
        addToast(`Successfully extracted ${res.university.name} with ${res.university.courses?.length || 0} courses!`, 'success');
        if (res.university.courses && res.university.courses.length > 0) {
          setActiveTab('courses');
        } else {
          setActiveTab('profile');
        }
      } else {
        throw new Error(res.error || 'Failed to extract university details from link');
      }
    } catch (err: any) {
      addToast(err.message || 'Error fetching university details from link', 'error');
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

  const handleImportWithCourses = async () => {
    if (!extractedData || !extractedData.name) {
      addToast('No university data to import', 'error');
      return;
    }
    const selectedList = (extractedData.courses || []).filter((_: any, idx: number) =>
      selectedCourseIndices.has(idx)
    );

    setImporting(true);
    try {
      const res = await api.importUniversityWithCourses({
        university: extractedData,
        selectedCourses: selectedList,
      });

      addToast(
        `Successfully saved ${res.university_name || extractedData.name} with ${res.courses_created ?? selectedList.length} courses!`,
        'success'
      );
      setFetchModalOpen(false);
      setExtractedData(null);
      fetchUnis();
    } catch (err: any) {
      addToast(err.message || 'Failed to import university and courses', 'error');
    } finally {
      setImporting(false);
    }
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
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleOpenFetchModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-sky-900/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Fetch from Website Link</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add University</span>
            </button>
          </div>
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

      {/* Website Link Fetch Modal */}
      {fetchModalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
                    Fetch University &amp; Courses from Website Link
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      Live Web Parser
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Paste an official university portal link to auto-extract profile, location, ranking, and full academic catalog.
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

            {/* URL Input & Quick Presets Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={fetchUrl}
                    onChange={(e) => setFetchUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchWebsite();
                      }
                    }}
                    placeholder="Enter university URL e.g. https://www.sharda.ac.in or https://chandigarhuniversity.ac.in"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:border-sky-500 font-mono shadow-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleFetchWebsite()}
                  disabled={fetching || !fetchUrl.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl shadow-xs flex items-center gap-2 shrink-0 transition-all"
                >
                  {fetching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Fetch Details</span>
                    </>
                  )}
                </button>
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
                      handleFetchWebsite(preset.url);
                    }}
                    disabled={fetching}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 transition-colors shadow-2xs"
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
                  <div className="inline-flex p-4 rounded-2xl bg-sky-50 text-sky-600 animate-pulse">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Connecting to University Portal...</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Analyzing university website structure, identifying NAAC accreditations, ranking, degree streams, and comprehensive course offerings.
                  </p>
                </div>
              )}

              {!fetching && !extractedData && (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No University Extracted Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Type or paste any university link above or select a preset university to automatically extract information and academic programs.
                  </p>
                </div>
              )}

              {!fetching && extractedData && (
                <div className="space-y-4">
                  {/* Extracted University Overview Card */}
                  <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-white p-4 rounded-2xl border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                        {extractedData.short_name ? extractedData.short_name.slice(0, 3) : extractedData.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{extractedData.name}</h4>
                          {extractedData.short_name && (
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-sky-200 text-sky-800">
                              {extractedData.short_name}
                            </span>
                          )}
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {extractedData.university_type || 'Private'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {extractedData.campus ? `${extractedData.campus}, ` : ''}
                            {extractedData.city}, {extractedData.state}, {extractedData.country}
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                          {extractedData.accreditation && (
                            <span className="font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {extractedData.accreditation}
                            </span>
                          )}
                          {extractedData.ranking && (
                            <span className="font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              {extractedData.ranking}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tabs switcher */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => setActiveTab('courses')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                          activeTab === 'courses'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Detected Courses ({extractedData.courses?.length || 0})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                          activeTab === 'profile'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>University Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Courses Catalog */}
                  {activeTab === 'courses' && (
                    <div className="space-y-3">
                      {/* Controls bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const coursesList = extractedData.courses || [];
                              const filtered = courseStreamFilter === 'All'
                                ? coursesList.map((c: any, idx: number) => ({ ...c, _originalIndex: idx }))
                                : coursesList
                                    .map((c: any, idx: number) => ({ ...c, _originalIndex: idx }))
                                    .filter((c: any) => c.stream === courseStreamFilter);
                              toggleSelectAllCourses(filtered);
                            }}
                            className="flex items-center gap-1.5 font-bold text-sky-700 hover:text-sky-800"
                          >
                            <CheckSquare className="w-4 h-4 text-sky-600" />
                            <span>Select / Deselect Visible</span>
                          </button>
                          <span className="text-slate-300">|</span>
                          <span className="font-semibold text-slate-600">
                            {selectedCourseIndices.size} of {extractedData.courses?.length || 0} selected
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
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              {st === 'All' ? 'All Streams' : st.split('&')[0].trim()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Course items list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                        {(extractedData.courses || [])
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
                                    ? 'bg-sky-50/70 border-sky-300 shadow-2xs'
                                    : 'bg-white border-slate-200 hover:border-slate-300 opacity-70'
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-sky-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1">
                                    <h5 className="font-bold text-xs text-slate-900 leading-snug">
                                      {c.course_name}
                                    </h5>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 shrink-0 font-mono">
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

                  {/* Tab 2: University Profile Edit/Review */}
                  {activeTab === 'profile' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">University Name</label>
                          <input
                            type="text"
                            value={extractedData.name}
                            onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Short Name</label>
                          <input
                            type="text"
                            value={extractedData.short_name || ''}
                            onChange={(e) => setExtractedData({ ...extractedData, short_name: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            value={extractedData.city || ''}
                            onChange={(e) => setExtractedData({ ...extractedData, city: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                          <input
                            type="text"
                            value={extractedData.state || ''}
                            onChange={(e) => setExtractedData({ ...extractedData, state: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                          <input
                            type="text"
                            value={extractedData.country || 'India'}
                            onChange={(e) => setExtractedData({ ...extractedData, country: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Accreditation</label>
                          <input
                            type="text"
                            value={extractedData.accreditation || ''}
                            onChange={(e) => setExtractedData({ ...extractedData, accreditation: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Ranking</label>
                          <input
                            type="text"
                            value={extractedData.ranking || ''}
                            onChange={(e) => setExtractedData({ ...extractedData, ranking: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Official Website</label>
                          <input
                            type="url"
                            value={extractedData.website || ''}
                            onChange={(e) => setExtractedData({ ...extractedData, website: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Details</label>
                          <input
                            type="text"
                            value={extractedData.contact || ''}
                            onChange={(e) => setExtractedData({ ...extractedData, contact: e.target.value })}
                            className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Description</label>
                        <textarea
                          rows={2}
                          value={extractedData.description || ''}
                          onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                {extractedData ? (
                  <span className="font-semibold text-slate-700">
                    ✨ {selectedCourseIndices.size} programs ready to sync &amp; link to CRM
                  </span>
                ) : (
                  <span>Provide link or select a preset to begin</span>
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
                  disabled={!extractedData || selectedCourseIndices.size === 0 || importing}
                  onClick={handleImportWithCourses}
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 disabled:opacity-50 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving &amp; Importing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save University &amp; Import ({selectedCourseIndices.size}) Courses</span>
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
