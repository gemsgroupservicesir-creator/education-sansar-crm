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
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  Share2,
  Phone,
  Coins,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { University } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export const UniversitiesPage: React.FC = () => {
  const { addToast } = useNotifications();
  const { currentRole } = useAuth();
  const canManage = true; // Always visible for all users in CRM

  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [page, setPage] = useState(1);
  const pageSize = 24;

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

  // Study in India University Details & Courses Explorer Modal
  const [selectedUniForDetails, setSelectedUniForDetails] = useState<University | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [uniCourses, setUniCourses] = useState<any[]>([]);
  const [loadingUniCourses, setLoadingUniCourses] = useState(false);
  const [uniCoursesSearch, setUniCoursesSearch] = useState('');
  const [uniCoursesLevelFilter, setUniCoursesLevelFilter] = useState('All');
  const [uniCoursesStreamFilter, setUniCoursesStreamFilter] = useState('All');
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'INR'>('USD');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'SII_PARTNER' | 'NIRF_TOP' | 'GOVT' | 'PRIVATE' | 'DELHI_NCR'>('ALL');
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);
  const [isSyncingSii, setIsSyncingSii] = useState(false);

  const handleSyncStudyInIndiaPortal = async () => {
    try {
      setIsSyncingSii(true);
      addToast('Syncing latest updates from Study in India official portal...', 'info');
      const res = await api.syncStudyInIndia('quick');
      if (res.success) {
        addToast(
          `Study in India Sync Complete! ${res.stats?.universitiesAdded || 0} universities & ${res.stats?.coursesAdded || 0} courses imported.`,
          'success'
        );
        fetchUnis();
      } else {
        addToast(res.message || 'Sync in progress', 'warning');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to sync with Study in India', 'error');
    } finally {
      setIsSyncingSii(false);
    }
  };

  const handleOpenUniDetails = async (u: University) => {
    setSelectedUniForDetails(u);
    setDetailsModalOpen(true);
    setLoadingUniCourses(true);
    setUniCourses([]);
    setUniCoursesSearch('');
    setUniCoursesLevelFilter('All');
    setUniCoursesStreamFilter('All');
    try {
      const courses = await api.getUniversityCoursesById(u.id);
      setUniCourses(courses || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load courses for this university', 'error');
    } finally {
      setLoadingUniCourses(false);
    }
  };

  const handleCopyPitch = (course: any, uni: University) => {
    const tuitionUSD = Number(course.tuition_fee_per_year) || 0;
    const usdFee = tuitionUSD > 0 ? `$${tuitionUSD.toLocaleString()}/year` : course.fees_range || 'Standard Fees';
    const inrFee = tuitionUSD > 0 ? `₹${Math.round(tuitionUSD * 86).toLocaleString()}/year` : '';
    const feeStr = inrFee ? `${usdFee} (Approx ${inrFee})` : usdFee;

    const pitchText = `Namaste! 🙏
Official admission details for *${course.course_name}* at *${uni.name}*:

🏛️ *University:* ${uni.name} (${uni.city}, ${uni.state})
🏆 *Accreditation:* ${uni.ranking || 'Study in India Partner'} | ${uni.accreditation || 'UGC / AICTE Approved'}
📚 *Course:* ${course.course_name} (${course.course_level || course.degree_level || 'Degree'})
⏱️ *Duration:* ${course.course_duration || course.duration || 'Standard Duration'}
💰 *Tuition Fee:* ${feeStr}
🎓 *Scholarships:* ${course.scholarship_details || course.scholarship_info || 'Up to 25%-50% merit concession for Nepal students'}
📋 *Eligibility:* ${course.course_eligibility || course.eligibility || '10+2 / Higher Secondary'}
🌐 *Official Website:* ${uni.website || 'https://education-sansar-crm.vercel.app'}

For direct seat reservation and scholarship assistance, contact Gems Group Services Admissions Desk.`;

    navigator.clipboard.writeText(pitchText);
    setCopiedCourseId(course.id);
    setTimeout(() => setCopiedCourseId(null), 2500);
    addToast('Pitch copied to clipboard! Ready to paste on WhatsApp or Email.', 'success');
  };

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

  const availableStates = Array.from(new Set(universities.map((u) => u.state).filter(Boolean))).sort();

  const filtered = universities.filter((u) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      (u.state && u.state.toLowerCase().includes(q)) ||
      (u.short_name && u.short_name.toLowerCase().includes(q)) ||
      (u.ranking && u.ranking.toLowerCase().includes(q));
    const matchesState = selectedState === 'All' || u.state?.toLowerCase() === selectedState.toLowerCase();
    const matchesType = selectedType === 'All' || u.university_type?.toLowerCase() === selectedType.toLowerCase();

    let matchesQuick = true;
    if (quickFilter === 'SII_PARTNER') {
      matchesQuick = u.id.startsWith('sii_') || Boolean(u.ranking && u.ranking.includes('SII')) || Boolean(u.description && u.description.includes('Study in India'));
    } else if (quickFilter === 'NIRF_TOP') {
      matchesQuick = Boolean(u.ranking && u.ranking.toLowerCase().includes('nirf') && !u.ranking.toLowerCase().includes('na'));
    } else if (quickFilter === 'GOVT') {
      matchesQuick = Boolean(u.university_type && (u.university_type.toLowerCase().includes('gov') || u.university_type.toLowerCase().includes('public') || u.university_type.toLowerCase().includes('central') || u.university_type.toLowerCase().includes('state')));
    } else if (quickFilter === 'PRIVATE') {
      matchesQuick = Boolean(u.university_type && (u.university_type.toLowerCase().includes('private') || u.university_type.toLowerCase().includes('deemed')));
    } else if (quickFilter === 'DELHI_NCR') {
      matchesQuick = ['delhi', 'noida', 'greater noida', 'gurgaon', 'gurugram', 'ghaziabad', 'faridabad'].some(c => u.city?.toLowerCase().includes(c) || u.state?.toLowerCase().includes(c));
    }

    return matchesSearch && matchesState && matchesType && matchesQuick;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedUnis = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Official Study in India (SII) &amp; Partner Institutions Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            Partner Universities &amp; Institutes
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
              {universities.length} Empaneled
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Official Study in India empanelled colleges &amp; universities across India. Direct admission tie-ups, AISHE verified, NIRF rankings, and exclusive Nepal merit fee concessions.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleSyncStudyInIndiaPortal}
              disabled={isSyncingSii}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-900/20 disabled:opacity-50 transition-all cursor-pointer"
              title="Pull latest empaneled colleges and course additions directly from studyinindia.gov.in"
            >
              <RefreshCw className={`w-4 h-4 text-purple-200 ${isSyncingSii ? 'animate-spin' : ''}`} />
              <span>{isSyncingSii ? 'Syncing Portal...' : 'Sync Study in India'}</span>
            </button>
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

      {/* Quick Filter Category Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <button
          onClick={() => { setQuickFilter('ALL'); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            quickFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>All Universities</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200">
            {universities.length}
          </span>
        </button>

        <button
          onClick={() => { setQuickFilter('SII_PARTNER'); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            quickFilter === 'SII_PARTNER'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <span>🇮🇳 Study in India Empaneled</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${quickFilter === 'SII_PARTNER' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            1,273
          </span>
        </button>

        <button
          onClick={() => { setQuickFilter('NIRF_TOP'); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            quickFilter === 'NIRF_TOP'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>NIRF Top Ranked</span>
        </button>

        <button
          onClick={() => { setQuickFilter('DELHI_NCR'); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            quickFilter === 'DELHI_NCR'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Delhi NCR (Noida / Greater Noida)</span>
        </button>

        <button
          onClick={() => { setQuickFilter('GOVT'); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            quickFilter === 'GOVT'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Government / Central</span>
        </button>

        <button
          onClick={() => { setQuickFilter('PRIVATE'); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            quickFilter === 'PRIVATE'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
          }`}
        >
          <span>Private &amp; Deemed</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search universities by name, AISHE code, ranking, city or state..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-sky-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* State Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="All">All States ({availableStates.length})</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="All">All Types</option>
            <option value="Government">Government / Public</option>
            <option value="Private">Private</option>
            <option value="Deemed">Deemed</option>
            <option value="Autonomous">Autonomous</option>
          </select>

          {(search || selectedState !== 'All' || selectedType !== 'All' || quickFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedState('All');
                setSelectedType('All');
                setQuickFilter('ALL');
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors"
            >
              Clear Filters
            </button>
          )}

          <div className="text-slate-500 font-medium text-[11px] ml-auto">
            Showing <strong className="text-slate-800">{filtered.length}</strong> institutions
          </div>
        </div>
      </div>

      {/* Universities Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span>Loading universities...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">No institutions found matching your search.</p>
          <p className="text-slate-400">Try adjusting your search query or state filter.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedUnis.map((u) => (
              <div
                key={u.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      {u.short_name ? u.short_name.slice(0, 3) : u.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {u.id.startsWith('sii_') && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                          🇮🇳 SII Partner
                        </span>
                      )}
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
                    <h3 
                      onClick={() => handleOpenUniDetails(u)}
                      className="font-bold text-sm text-slate-900 leading-snug cursor-pointer hover:text-sky-600 transition-colors"
                      title="Click to view Study in India course catalog & fees"
                    >
                      {u.name}
                    </h3>
                    {u.short_name && (
                      <div className="text-[11px] text-blue-600 font-semibold font-mono mt-0.5">
                        AISHE: {u.short_name}
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

                  {u.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {u.description}
                    </p>
                  )}

                  {/* Primary Study in India Courses Trigger Button */}
                  <button
                    onClick={() => handleOpenUniDetails(u)}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-sky-900/10 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-sky-200" />
                    <span>View Courses &amp; Study in India Fees ({(u as any).fee_structures_count || (u as any).legacy_courses_count || (u as any).courses_count || 'View'})</span>
                    <ArrowRight className="w-3 h-3 text-sky-200" />
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-medium">
                    📚 {(u as any).fee_structures_count || (u as any).legacy_courses_count || (u as any).courses_count || 0} Programs
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

                    {canManage && (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
              <div className="text-slate-500 font-medium">
                Showing{' '}
                <strong className="text-slate-800">
                  {(page - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-800">
                  {Math.min(page * pageSize, filtered.length)}
                </strong>{' '}
                of <strong className="text-slate-800">{filtered.length}</strong> institutions
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-800 font-bold font-mono">
                  Page {page} of {totalPages}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
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

      {/* Study in India University Details & Courses Explorer Modal */}
      {detailsModalOpen && selectedUniForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <span>🇮🇳</span> Official Study in India (SII) Empaneled Institute
                    </span>
                    {selectedUniForDetails.short_name && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-sky-200 border border-white/10">
                        AISHE: {selectedUniForDetails.short_name}
                      </span>
                    )}
                    {selectedUniForDetails.ranking && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {selectedUniForDetails.ranking}
                      </span>
                    )}
                    {selectedUniForDetails.accreditation && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        {selectedUniForDetails.accreditation}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {selectedUniForDetails.name}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {selectedUniForDetails.campus ? `${selectedUniForDetails.campus}, ` : ''}{selectedUniForDetails.city}, {selectedUniForDetails.state}, {selectedUniForDetails.country}
                    </span>
                    <span>&bull;</span>
                    <span className="text-sky-300 font-semibold">{selectedUniForDetails.university_type} Institution</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 relative z-10 shrink-0">
                  {selectedUniForDetails.website && (
                    <a
                      href={selectedUniForDetails.website}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Open Official Website"
                    >
                      <Globe className="w-3.5 h-3.5 text-sky-300" />
                      <span className="hidden sm:inline">Website</span>
                      <ExternalLink className="w-3 h-3 text-slate-300" />
                    </a>
                  )}

                  <button
                    onClick={() => setDetailsModalOpen(false)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <div className="text-slate-400 text-[11px]">Academic Programs</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {uniCourses.length} <span className="text-xs font-normal text-slate-400">Courses</span>
                  </div>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <div className="text-slate-400 text-[11px]">Nepal / International Quota</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    Authorized <span className="text-xs font-normal text-slate-400">Direct Seats</span>
                  </div>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <div className="text-slate-400 text-[11px]">Merit Scholarship Waiver</div>
                  <div className="text-lg font-black text-amber-300 mt-0.5">
                    Up to 50% <span className="text-xs font-normal text-slate-400">Tuition Off</span>
                  </div>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 text-[11px]">Fee Currency Display</div>
                    <div className="text-xs font-bold text-sky-300 mt-0.5">
                      {currencyMode === 'USD' ? 'Official USD ($)' : 'Converted INR (₹)'}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrencyMode(prev => prev === 'USD' ? 'INR' : 'USD')}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 text-[10px] font-bold"
                  >
                    Switch to {currencyMode === 'USD' ? '₹ INR' : '$ USD'}
                  </button>
                </div>
              </div>
            </div>

            {/* Course Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={uniCoursesSearch}
                  onChange={(e) => setUniCoursesSearch(e.target.value)}
                  placeholder="Search program by name, degree, specialization..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-sky-500 transition-all font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Level Filter */}
                <select
                  value={uniCoursesLevelFilter}
                  onChange={(e) => setUniCoursesLevelFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="All">All Degrees / Levels</option>
                  <option value="UG">Undergraduate (UG / B.Tech / B.Sc / BBA)</option>
                  <option value="PG">Postgraduate (PG / M.Tech / MBA / M.Sc)</option>
                  <option value="PhD">Doctorate (PhD)</option>
                  <option value="Diploma">Diploma / Polytechnic</option>
                </select>

                {/* Stream Filter */}
                <select
                  value={uniCoursesStreamFilter}
                  onChange={(e) => setUniCoursesStreamFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="All">All Disciplines / Streams</option>
                  <option value="Engineering & Technology">Engineering &amp; Technology</option>
                  <option value="Management & Business">Management &amp; Business</option>
                  <option value="Sciences & Mathematics">Sciences &amp; Mathematics</option>
                  <option value="Medical & Allied Health">Medical &amp; Allied Health</option>
                  <option value="Law & Legal Studies">Law &amp; Legal Studies</option>
                  <option value="Humanities & Social Sciences">Humanities &amp; Social Sciences</option>
                  <option value="Commerce & Finance">Commerce &amp; Finance</option>
                  <option value="Arts & Design">Arts &amp; Design</option>
                </select>

                {(uniCoursesSearch || uniCoursesLevelFilter !== 'All' || uniCoursesStreamFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setUniCoursesSearch('');
                      setUniCoursesLevelFilter('All');
                      setUniCoursesStreamFilter('All');
                    }}
                    className="text-xs text-rose-600 hover:underline font-bold px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Courses List Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">
              {loadingUniCourses ? (
                <div className="py-24 text-center text-slate-500 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mx-auto" />
                  <p className="text-sm font-semibold">Loading official Study in India course catalog &amp; fee structures...</p>
                </div>
              ) : (
                (() => {
                  const filteredCourses = uniCourses.filter((c: any) => {
                    const q = uniCoursesSearch.trim().toLowerCase();
                    const matchesSearch = !q || c.course_name?.toLowerCase().includes(q) || c.stream?.toLowerCase().includes(q) || c.short_name?.toLowerCase().includes(q);
                    const matchesLevel = uniCoursesLevelFilter === 'All' || c.course_level === uniCoursesLevelFilter || c.degree_level?.toLowerCase().includes(uniCoursesLevelFilter.toLowerCase());
                    const matchesStream = uniCoursesStreamFilter === 'All' || c.stream?.toLowerCase() === uniCoursesStreamFilter.toLowerCase();
                    return matchesSearch && matchesLevel && matchesStream;
                  });

                  if (filteredCourses.length === 0) {
                    return (
                      <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-800">No courses match the selected filters</h4>
                        <p className="text-xs text-slate-500">Try clearing the search or choosing "All Disciplines".</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>Showing <strong className="text-slate-800">{filteredCourses.length}</strong> Study in India course offerings for {selectedUniForDetails.name}</span>
                        <span className="text-[11px] italic text-slate-400">*Estimated INR fees calculated at ₹86/USD standard conversion</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredCourses.map((c: any) => {
                          const tuitionUSD = Number(c.tuition_fee_per_year) || 0;
                          const totalFullUSD = Number(c.total_full_course_fee) || 0;
                          const tuitionINR = tuitionUSD > 0 ? Math.round(tuitionUSD * 86) : 0;
                          const totalFullINR = totalFullUSD > 0 ? Math.round(totalFullUSD * 86) : 0;

                          return (
                            <div
                              key={c.id || c.course_id}
                              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200">
                                    {c.course_level || c.degree_level || 'UG'} &bull; {c.course_duration || c.duration || '4 Years'}
                                  </span>
                                  {c.stream && (
                                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-[180px]">
                                      {c.stream}
                                    </span>
                                  )}
                                </div>

                                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                  {c.course_name}
                                </h4>

                                {/* Fee Box */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-500 font-medium">Annual Tuition Fee:</span>
                                    <span className="font-black text-sky-700 text-sm">
                                      {currencyMode === 'USD'
                                        ? (tuitionUSD > 0 ? `$${tuitionUSD.toLocaleString()}/yr` : c.fees_range || 'Contact Desk')
                                        : (tuitionINR > 0 ? `₹${tuitionINR.toLocaleString()}/yr` : (tuitionUSD > 0 ? `$${tuitionUSD.toLocaleString()}` : c.fees_range || 'Contact Desk'))}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-1">
                                    <span>Full Course Cost:</span>
                                    <span className="font-semibold text-slate-800">
                                      {currencyMode === 'USD'
                                        ? (totalFullUSD > 0 ? `$${totalFullUSD.toLocaleString()}` : (tuitionUSD > 0 ? `$${(tuitionUSD * 4).toLocaleString()} est.` : 'Standard Fees'))
                                        : (totalFullINR > 0 ? `₹${totalFullINR.toLocaleString()}` : (tuitionINR > 0 ? `₹${(tuitionINR * 4).toLocaleString()} est.` : 'Standard Fees'))}
                                    </span>
                                  </div>

                                  {currencyMode === 'USD' && tuitionINR > 0 && (
                                    <div className="text-[10px] text-slate-400 text-right">
                                      Approx ₹{tuitionINR.toLocaleString()} INR / year
                                    </div>
                                  )}
                                  {currencyMode === 'INR' && tuitionUSD > 0 && (
                                    <div className="text-[10px] text-slate-400 text-right">
                                      Official ${tuitionUSD.toLocaleString()} USD / year
                                    </div>
                                  )}
                                </div>

                                {/* Eligibility & Scholarship Details */}
                                <div className="space-y-1 text-xs">
                                  {(c.course_eligibility || c.eligibility) && (
                                    <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
                                      <strong className="text-slate-700">Eligibility:</strong> {c.course_eligibility || c.eligibility}
                                    </p>
                                  )}
                                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-800 text-[11px] flex items-start gap-1.5 font-medium">
                                    <span className="shrink-0 mt-0.5">🎓</span>
                                    <span>{c.scholarship_details || c.scholarship_info || 'Study in India Merit Scholarship / Concession Applicable'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons for Counselors */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                  onClick={() => handleCopyPitch(c, selectedUniForDetails)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                  title="Copy structured admission pitch for counselor"
                                >
                                  {copiedCourseId === c.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700 font-bold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Copy Pitch</span>
                                    </>
                                  )}
                                </button>

                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(
                                    `Namaste! Here are the admission details for ${c.course_name} at ${selectedUniForDetails.name}:\n\n` +
                                    `• Institution: ${selectedUniForDetails.name} (${selectedUniForDetails.city}, ${selectedUniForDetails.state})\n` +
                                    `• Program: ${c.course_name} (${c.course_level || 'Degree'})\n` +
                                    `• Tuition Fee: ${c.tuition_fee_per_year ? `$${Number(c.tuition_fee_per_year).toLocaleString()}/yr` : c.fees_range || 'Standard'}\n` +
                                    `• Scholarship: ${c.scholarship_details || 'Up to 30%-50% waiver'}\n\n` +
                                    `For counseling and seat reservation, connect with Gems Group Services.`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Share WhatsApp</span>
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                <span>Direct authorized admission partner &bull; Gems Group Services (Sector 94, Noida)</span>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
              >
                Close Explorer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
