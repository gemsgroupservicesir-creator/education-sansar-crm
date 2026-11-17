import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Bot,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sliders,
  RefreshCw,
  X,
  Flame,
  Target,
  UserCheck,
  ShieldCheck,
  FileText,
  ExternalLink,
  ArrowRight,
  Check,
  Award,
  Layers,
  Tag,
  HelpCircle,
  GraduationCap,
  Building2,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { KnowledgeItem, KnowledgeCategory, StudentAIChatResponse, Lead } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES: KnowledgeCategory[] = [
  'Course Admissions',
  'Fee & Scholarships',
  'Partner Universities',
  'Visa & Documentation',
  'Eligibility & Deadlines',
  'Entrance Exams',
  'General FAQ'
];

export const KnowledgeBasePage: React.FC = () => {
  const { addToast } = useNotifications();
  const { user } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'knowledge' | 'simulator' | 'train_text'>('knowledge');

  // Knowledge Base State
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<KnowledgeCategory>('Course Admissions');
  const [formQuestion, setFormQuestion] = useState('');
  const [formAltQuestions, setFormAltQuestions] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formTargetCourses, setFormTargetCourses] = useState('');
  const [formTargetUnis, setFormTargetUnis] = useState('');
  const [formQualifyingQ, setFormQualifyingQ] = useState('');
  const [formNurturingCTA, setFormNurturingCTA] = useState('');
  const [formImportance, setFormImportance] = useState('8');
  const [formIsActive, setFormIsActive] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  // Train Text State
  const [trainDocTitle, setTrainDocTitle] = useState('');
  const [trainCategory, setTrainCategory] = useState<KnowledgeCategory>('Course Admissions');
  const [trainRawText, setTrainRawText] = useState('');
  const [trainingLoading, setTrainingLoading] = useState(false);

  // Interactive AI Simulator State
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [simLeadId, setSimLeadId] = useState<string>('');
  const [simStudentName, setSimStudentName] = useState('Pooja Thapa');
  const [simPhone, setSimPhone] = useState('+977 9811223344');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'student' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Namaste! 👋 I am your Senior AI Admissions Counselor at Gems Group Services. Ask me anything about MBBS in Bangladesh, B.Tech Engineering in SRM or Chandigarh, scholarships, eligibility, or entrance exams!',
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [latestSimResult, setLatestSimResult] = useState<StudentAIChatResponse | null>(null);

  // Expanded Answer Card IDs
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loadKnowledgeBase = async () => {
    setLoading(true);
    try {
      const res = await api.getKnowledgeBase({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined
      });
      setItems(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      addToast(err.message || 'Failed to load knowledge base', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLeadsForSimulator = async () => {
    try {
      const res = await api.getLeads({ limit: 40 });
      const list = res.data || res || [];
      setAllLeads(list);
      if (list.length > 0 && !simLeadId) {
        setSimLeadId(list[0].id);
        setSimStudentName(list[0].student_name);
        setSimPhone(list[0].phone || list[0].whatsapp_number || '');
      }
    } catch {}
  };

  useEffect(() => {
    loadKnowledgeBase();
  }, [selectedCategory]);

  useEffect(() => {
    loadLeadsForSimulator();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadKnowledgeBase();
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await api.seedKnowledgeBase();
      addToast('Recommended Knowledge Base seeded with high-converting admission Q&As!', 'success');
      loadKnowledgeBase();
    } catch (err: any) {
      addToast(err.message || 'Failed to seed knowledge base', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCategory('Course Admissions');
    setFormQuestion('');
    setFormAltQuestions('');
    setFormAnswer('');
    setFormKeywords('');
    setFormTargetCourses('B.Tech, MBBS, MBA');
    setFormTargetUnis('SRM University, Chandigarh University');
    setFormQualifyingQ('What is your +2 GPA or percentage?');
    setFormNurturingCTA('Connect directly with our senior admission counselor for free seat booking & document verification.');
    setFormImportance('8');
    setFormIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormQuestion(item.question);

    const alts = Array.isArray(item.alternate_questions) 
      ? item.alternate_questions.join('\n') 
      : item.alternate_questions || '';
    setFormAltQuestions(alts);

    setFormAnswer(item.answer);

    const kws = Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords || '';
    setFormKeywords(kws);

    const crs = Array.isArray(item.target_courses) ? item.target_courses.join(', ') : item.target_courses || '';
    setFormTargetCourses(crs);

    const unis = Array.isArray(item.target_universities) ? item.target_universities.join(', ') : item.target_universities || '';
    setFormTargetUnis(unis);

    setFormQualifyingQ(item.qualifying_question || '');
    setFormNurturingCTA(item.nurturing_cta || '');
    setFormImportance(String(item.importance || 5));
    setFormIsActive(item.is_active === 1);
    setModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formQuestion.trim() || !formAnswer.trim()) {
      addToast('Title, question, and answer are required', 'warning');
      return;
    }

    setSavingItem(true);
    try {
      const payload = {
        title: formTitle.trim(),
        category: formCategory,
        question: formQuestion.trim(),
        alternate_questions: formAltQuestions.split('\n').map(s => s.trim()).filter(Boolean),
        answer: formAnswer.trim(),
        keywords: formKeywords.split(',').map(s => s.trim()).filter(Boolean),
        target_courses: formTargetCourses.split(',').map(s => s.trim()).filter(Boolean),
        target_universities: formTargetUnis.split(',').map(s => s.trim()).filter(Boolean),
        qualifying_question: formQualifyingQ.trim(),
        nurturing_cta: formNurturingCTA.trim(),
        importance: parseInt(formImportance, 10) || 5,
        is_active: formIsActive ? 1 : 0,
        created_by: user?.name || 'Super Admin'
      };

      if (editingItem) {
        await api.updateKnowledgeItem(editingItem.id, payload);
        addToast('Knowledge item updated successfully!', 'success');
      } else {
        await api.createKnowledgeItem(payload);
        addToast('New Knowledge Q&A trained and added to AI Agent!', 'success');
      }

      setModalOpen(false);
      loadKnowledgeBase();
    } catch (err: any) {
      addToast(err.message || 'Failed to save knowledge item', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the knowledge base?`)) return;
    try {
      await api.deleteKnowledgeItem(id);
      addToast(`"${title}" deleted`, 'info');
      loadKnowledgeBase();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete item', 'error');
    }
  };

  const handleTrainFromText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainDocTitle.trim() || !trainRawText.trim() || trainRawText.trim().length < 20) {
      addToast('Please provide a title and at least 20 characters of prospectus/circular text', 'warning');
      return;
    }

    setTrainingLoading(true);
    try {
      const res = await api.trainKnowledgeFromText({
        title: trainDocTitle.trim(),
        category: trainCategory,
        rawText: trainRawText.trim(),
        created_by: user?.name || 'Super Admin'
      });
      addToast(`Extracted and trained ${res.count || res.items?.length || 1} knowledge items into AI Agent!`, 'success');
      setTrainDocTitle('');
      setTrainRawText('');
      setActiveTab('knowledge');
      loadKnowledgeBase();
    } catch (err: any) {
      addToast(err.message || 'Failed to extract knowledge', 'error');
    } finally {
      setTrainingLoading(false);
    }
  };

  const handleSendSimChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || chatSending) return;

    const userMsg = textToSend.trim();
    if (!presetText) setChatInput('');

    // Append student message
    const updatedMessages = [
      ...chatMessages,
      { sender: 'student' as const, text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setChatMessages(updatedMessages);
    setChatSending(true);

    try {
      const chatHistory = updatedMessages.map(m => ({
        sender: m.sender,
        message: m.text
      }));

      const res = await api.sendStudentChatMessage({
        message: userMsg,
        leadId: simLeadId || undefined,
        phone: simPhone || undefined,
        studentName: simStudentName || undefined,
        chatHistory,
        source: 'Simulator'
      });

      setLatestSimResult(res);

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      addToast(err.message || 'Chat simulator failed', 'error');
    } finally {
      setChatSending(false);
    }
  };

  const handleSelectSimLead = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lId = e.target.value;
    setSimLeadId(lId);
    const found = allLeads.find(l => l.id === lId);
    if (found) {
      setSimStudentName(found.student_name);
      setSimPhone(found.phone || found.whatsapp_number || '');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Knowledge Base &amp; Student AI Counselor
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Train admissions, fees, and eligibility. The AI Agent chats with students, qualifies their academic readiness, and nurtures them to counselors.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Seed high-converting default Q&As for MBBS, B.Tech, scholarships, and visas"
          >
            {seeding ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>Seed Recommended Knowledge</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Knowledge Q&amp;A</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Trained Q&amp;A Items</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active in AI Agent Knowledge</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Lead Qualification</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-1">Multi-Stage</div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Scores 0-100% on marks &amp; budget</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Counselor Handoff</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">1-Click WhatsApp</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">wa.me direct link injected</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Inbound Channels</span>
            <Bot className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-900 mt-1">WhatsApp &amp; Web</div>
          <div className="text-[10px] text-purple-600 font-semibold mt-0.5">24/7 AI admission coverage</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'knowledge'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Trained Q&amp;A Repository</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'simulator'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Student Chat &amp; Lead Qualifier Simulator</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Live Test
            </span>
          </button>

          <button
            onClick={() => setActiveTab('train_text')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              activeTab === 'train_text'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Train from Prospectus / Text</span>
          </button>
        </div>
      </div>

      {/* TAB 1: KNOWLEDGE REPOSITORY */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          {/* Search and Category Filters */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions, fees, universities, scholarships, or keywords..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 w-full sm:w-auto shadow-2xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      loadKnowledgeBase();
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" /> Category:
              </span>
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Categories ({totalCount})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Knowledge Cards List */}
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
              <div className="text-xs text-slate-500 font-medium">Loading trained knowledge base...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Knowledge Q&amp;As Found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No articles match your search or filter. Seed the recommended admission pack or add your first knowledge question.
              </p>
              <button
                onClick={handleSeedDefaults}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed Recommended Knowledge Pack</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {items.map(item => {
                const isExpanded = expandedCards[item.id] || false;
                const alts = Array.isArray(item.alternate_questions) ? item.alternate_questions : [];
                const kws = Array.isArray(item.keywords) ? item.keywords : [];
                const courses = Array.isArray(item.target_courses) ? item.target_courses : [];
                const unis = Array.isArray(item.target_universities) ? item.target_universities : [];

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 hover:border-slate-300 transition"
                  >
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {item.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            ★ Priority {item.importance}/10
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Used {item.times_used || 0} times
                          </span>
                          {item.is_active === 1 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active in AI
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              Draft
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Q&A details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Q&A"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Primary Question */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>Primary Question:</span>
                      </span>
                      <p className="text-slate-900 font-medium">{item.question}</p>

                      {alts.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                            Alternate Phrases Matched ({alts.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {alts.slice(0, 4).map((alt, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                                &ldquo;{alt}&rdquo;
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Answer Preview */}
                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Counseling Answer:</span>
                        </span>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <><span>Collapse</span><ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <><span>View Full</span><ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      </div>

                      <div className={`p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/60 font-sans leading-relaxed whitespace-pre-wrap ${
                        isExpanded ? '' : 'line-clamp-3'
                      }`}>
                        {item.answer}
                      </div>
                    </div>

                    {/* Lead Qualification & Nurturing Prompts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                      {item.qualifying_question && (
                        <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/60 text-indigo-900 space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                            <Target className="w-3 h-3 text-indigo-600" />
                            <span>Qualifying Follow-Up Question:</span>
                          </span>
                          <p className="text-[11px] font-medium leading-snug">{item.qualifying_question}</p>
                        </div>
                      )}

                      {item.nurturing_cta && (
                        <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200/60 text-purple-900 space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-purple-600" />
                            <span>Counselor Handoff CTA:</span>
                          </span>
                          <p className="text-[11px] font-medium leading-snug">{item.nurturing_cta}</p>
                        </div>
                      )}
                    </div>

                    {/* Tags / Universities Footer */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
                      {courses.length > 0 && (
                        <div className="flex items-center gap-1 mr-2">
                          <GraduationCap className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-500">Courses:</span>
                          {courses.slice(0, 3).map((c, i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {unis.length > 0 && (
                        <div className="flex items-center gap-1 mr-2">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-500">Universities:</span>
                          {unis.slice(0, 2).map((u, i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                              {u}
                            </span>
                          ))}
                        </div>
                      )}

                      {kws.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Keywords:</span>
                          {kws.slice(0, 5).map((k, i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono">
                              #{k}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI STUDENT CHAT & LEAD QUALIFIER SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Chat Simulator (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col h-[750px] overflow-hidden">
            {/* Chat Simulator Top Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-sm shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs flex items-center gap-1.5">
                    GGS Senior Admissions AI Counselor
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-300">
                    Live Knowledge Base Inference &amp; Qualification Engine
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={simLeadId}
                  onChange={handleSelectSimLead}
                  className="bg-slate-800 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-blue-400"
                >
                  <option value="">-- Test as New Inquiry --</option>
                  {allLeads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.student_name} ({l.phone || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Test Prompt Chips */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="font-bold text-slate-600 text-[10px] uppercase whitespace-nowrap">
                Quick Test Prompts:
              </span>
              <button
                onClick={() => handleSendSimChatMessage('What is Bangladesh MBBS fee and eligibility?')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap transition"
              >
                MBBS Bangladesh Fees
              </button>
              <button
                onClick={() => handleSendSimChatMessage('I scored 78% in 12th. Can I get scholarship in SRM for B.Tech CSE?')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap transition"
              >
                78% in 12th B.Tech Scholarship
              </button>
              <button
                onClick={() => handleSendSimChatMessage('Do I need to pass CEE exam to study MBBS abroad?')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap transition"
              >
                CEE Exam Requirement
              </button>
              <button
                onClick={() => handleSendSimChatMessage('What documents are required for Nepal students?')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap transition"
              >
                Document Checklist
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs leading-relaxed ${
                      msg.sender === 'student'
                        ? 'bg-blue-600 text-white rounded-br-2xs'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] mb-1 opacity-75">
                      <span className="font-bold">
                        {msg.sender === 'student' ? (simStudentName || 'Student') : 'GGS AI Counselor'}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}

              {chatSending && (
                <div className="flex justify-start">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Searching Knowledge Base &amp; evaluating lead qualification...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendSimChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question as a student (e.g. 'What is fee for MBBS in Bangladesh?')..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  disabled={chatSending}
                />
                <button
                  type="submit"
                  disabled={chatSending || !chatInput.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Lead Qualification & Nurturing Inspector (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Qualification Dossier Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Lead Qualification &amp; Nurturing Dossier
                  </h3>
                </div>
                {latestSimResult?.qualification?.status && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      latestSimResult.qualification.status === 'High Intent'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : latestSimResult.qualification.status === 'Qualified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {latestSimResult.qualification.status}
                  </span>
                )}
              </div>

              {/* Score Meter */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700">Qualification Score:</span>
                  <span className="text-indigo-700 font-mono text-sm">
                    {latestSimResult?.qualification?.score || 25}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      (latestSimResult?.qualification?.score || 25) >= 75
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : (latestSimResult?.qualification?.score || 25) >= 50
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                        : 'bg-gradient-to-r from-amber-400 to-blue-500'
                    }`}
                    style={{ width: `${latestSimResult?.qualification?.score || 25}%` }}
                  />
                </div>
              </div>

              {/* Extracted Profile Criteria Grid */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  AI Extracted Profile Attributes:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px]">Interested Course:</span>
                    <strong className="text-slate-800">
                      {latestSimResult?.qualification?.extractedData?.course || 'Detecting from chat...'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px]">Marks / GPA:</span>
                    <strong className="text-emerald-700">
                      {latestSimResult?.qualification?.extractedData?.marks || 'Not yet provided'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px]">Target Destination:</span>
                    <strong className="text-slate-800">
                      {latestSimResult?.qualification?.extractedData?.university || latestSimResult?.qualification?.extractedData?.country || 'India / Bangladesh'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="text-slate-400 block text-[10px]">Budget &amp; Scholarship:</span>
                    <strong className="text-slate-800">
                      {latestSimResult?.qualification?.extractedData?.budget || 'Seeking scholarship'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Assigned Counselor Handoff Card */}
              {latestSimResult?.counselor && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Assigned Counselor Handoff:
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Ready to Convert
                    </span>
                  </div>
                  <div className="text-slate-800">
                    <strong>{latestSimResult.counselor.name}</strong> ({latestSimResult.counselor.phone})
                  </div>
                  <a
                    href={latestSimResult.counselor.waChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition text-xs shadow-2xs mt-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat with Counselor on WhatsApp (wa.me)
                  </a>
                </div>
              )}
            </div>

            {/* Knowledge Base Grounding Citations */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Knowledge Citations Grounding:
                </span>
                <span className="text-[10px] text-slate-400">
                  {latestSimResult?.matchedKnowledge?.length || 0} items retrieved
                </span>
              </div>

              {latestSimResult?.matchedKnowledge && latestSimResult.matchedKnowledge.length > 0 ? (
                <div className="space-y-2">
                  {latestSimResult.matchedKnowledge.map((k, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900">{k.title}</span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">
                          Score: {k.relevanceScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{k.snippet}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Ask a question in the chat to see real-time Knowledge Base grounding citations here.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRAIN FROM PROSPECTUS / TEXT */}
      {activeTab === 'train_text' && (
        <div className="max-w-3xl bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Train Knowledge from University Prospectus or Guidelines
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Paste raw admission criteria, circulars, fee breakdowns, or scholarship rules. The AI will parse and extract verified Q&amp;As directly into the Knowledge Base repository.
            </p>
          </div>

          <form onSubmit={handleTrainFromText} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document / Circular Title *
              </label>
              <input
                type="text"
                required
                value={trainDocTitle}
                onChange={(e) => setTrainDocTitle(e.target.value)}
                placeholder="e.g. SRM University B.Tech 2026 Admission Circular &amp; Scholarships"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Category *
              </label>
              <select
                value={trainCategory}
                onChange={(e) => setTrainCategory(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paste Raw Document Text / Fee Guidelines *
              </label>
              <textarea
                rows={9}
                required
                value={trainRawText}
                onChange={(e) => setTrainRawText(e.target.value)}
                placeholder="Paste university prospectus text, eligibility requirements, annual fee structure, hostel rules, or admission procedures..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                The engine breaks down complex paragraphs into Q&amp;A units with follow-up lead qualifying questions.
              </span>
            </div>

            <button
              type="submit"
              disabled={trainingLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {trainingLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting &amp; Training Q&amp;As...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract &amp; Train into Knowledge Base</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Add / Edit Q&A Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveModal}
            className="w-full max-w-2xl bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingItem ? 'Edit Knowledge Q&A' : 'Add New Knowledge Q&A'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Kumudini Medical College Bangladesh MBBS"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Question *</label>
              <input
                type="text"
                required
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                placeholder="e.g. What is the fee structure for MBBS in Kumudini Women's Medical College?"
                className="w-full p-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alternate Questions / Variations (One per line)
              </label>
              <textarea
                rows={2}
                value={formAltQuestions}
                onChange={(e) => setFormAltQuestions(e.target.value)}
                placeholder="What is Kumudini MBBS fee?&#10;Kumudini Bangladesh admission requirements&#10;How to apply to Kumudini from Nepal"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 resize-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Counseling Answer *</label>
              <textarea
                rows={4}
                required
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                placeholder="Write the comprehensive, verified counseling answer..."
                className="w-full p-2 text-xs rounded-xl border border-slate-300 resize-none"
              />
            </div>

            {/* Lead Qualification & Nurturing Prompts */}
            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Lead Qualification &amp; Counselor Nurturing Configuration
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qualifying Follow-Up Question (Prompted to Student)
                </label>
                <input
                  type="text"
                  value={formQualifyingQ}
                  onChange={(e) => setFormQualifyingQ(e.target.value)}
                  placeholder="e.g. What was your GPA or marks in +2 Science (Physics, Chemistry, Biology)?"
                  className="w-full p-2 text-xs rounded-xl border border-indigo-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nurturing Call to Action (CTA to Counselors)
                </label>
                <input
                  type="text"
                  value={formNurturingCTA}
                  onChange={(e) => setFormNurturingCTA(e.target.value)}
                  placeholder="e.g. Connect directly with our medical counselor for seat reservation and DGHS equivalence assistance."
                  className="w-full p-2 text-xs rounded-xl border border-indigo-200 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keywords (Comma-separated)</label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="mbbs, bangladesh, fee, eligibility"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Courses</label>
                <input
                  type="text"
                  value={formTargetCourses}
                  onChange={(e) => setFormTargetCourses(e.target.value)}
                  placeholder="MBBS, BDS"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Universities</label>
                <input
                  type="text"
                  value={formTargetUnis}
                  onChange={(e) => setFormTargetUnis(e.target.value)}
                  placeholder="Kumudini, Dhaka National"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Importance / Priority (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formImportance}
                  onChange={(e) => setFormImportance(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Active in AI Agent Knowledge</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingItem}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {savingItem ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Knowledge Item</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
