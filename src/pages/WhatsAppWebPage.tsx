import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  Battery,
  Wifi,
  Power,
  Flame,
  Check,
  CheckCheck,
  Clock,
  BookOpen,
  GraduationCap,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  UserCheck,
  Sliders,
  X,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { WhatsAppSession, WhatsAppChatSummary } from '../types';

export const WhatsAppWebPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetPhoneParam = searchParams.get('phone');
  const { currentUser, currentRole, isSuperAdmin } = useAuth();
  const { showToast } = useNotifications();

  // Session state
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [simulatedPhone, setSimulatedPhone] = useState('+977 9801234567');
  const [counselors, setCounselors] = useState<any[]>([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState<string>('c-prakash');

  // Chats & Conversation state
  const [chats, setChats] = useState<WhatsAppChatSummary[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatFilter, setChatFilter] = useState<'all' | 'qualified' | 'unread' | 'high_intent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [activeChatData, setActiveChatData] = useState<{ lead: any; messages: any[]; qualification: any } | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [showPairingCode, setShowPairingCode] = useState(false);

  // Inbound Student WhatsApp Simulator Modal
  const [showInboundTestModal, setShowInboundTestModal] = useState(false);
  const [inboundPhone, setInboundPhone] = useState('+977 9801234567');
  const [inboundStudentName, setInboundStudentName] = useState('Aryan Thapa');
  const [inboundMessage, setInboundMessage] = useState('Hi! I want to study MBBS in Bangladesh. I scored 84% in 12th PCB and have 35 Lakh budget. Which college is best?');
  const [simulatingInbound, setSimulatingInbound] = useState(false);
  const [requestingPairingCode, setRequestingPairingCode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Session and Counselors
  const loadSession = async () => {
    try {
      const sess = await api.getWhatsAppSession(selectedCounselorId);
      setSession(sess);
      setAiAutoReply(sess.ai_auto_reply === 1);
    } catch (err: any) {
      console.warn('Failed to fetch WhatsApp session:', err.message);
    } finally {
      setLoadingSession(false);
    }
  };

  const loadCounselors = async () => {
    try {
      const list = await api.getCounselors();
      setCounselors(list);
      if (list.length > 0 && !selectedCounselorId) {
        setSelectedCounselorId(list[0].id);
      }
    } catch {}
  };

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const data = await api.getWhatsAppChats({
        counselorId: selectedCounselorId,
        search: searchQuery,
        filter: chatFilter
      });
      setChats(data);

      // If targeted by URL param or default first
      if (targetPhoneParam && !selectedPhone) {
        const found = data.find(c => c.phone.includes(targetPhoneParam) || c.whatsapp_number.includes(targetPhoneParam));
        if (found) {
          setSelectedPhone(found.phone);
        } else if (data.length > 0) {
          setSelectedPhone(data[0].phone);
        }
      } else if (!selectedPhone && data.length > 0) {
        setSelectedPhone(data[0].phone);
      }
    } catch (err: any) {
      console.warn('Failed to load WhatsApp chats:', err.message);
    } finally {
      setLoadingChats(false);
    }
  };

  // Load active chat thread messages
  const loadActiveChatMessages = async (phone: string) => {
    setLoadingMessages(true);
    try {
      const data = await api.getWhatsAppChatMessages(phone);
      setActiveChatData(data);
    } catch (err: any) {
      showToast('Failed to load chat messages: ' + err.message, 'error');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadCounselors();
    loadSession();
  }, [selectedCounselorId]);

  useEffect(() => {
    if (session?.status === 'CONNECTED') {
      loadChats();
    }
  }, [session?.status, chatFilter, searchQuery, selectedCounselorId]);

  useEffect(() => {
    if (selectedPhone) {
      loadActiveChatMessages(selectedPhone);
    }
  }, [selectedPhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatData?.messages]);

  // QR Countdown Timer
  useEffect(() => {
    let timer: any = null;
    if (session?.status === 'QR_READY') {
      timer = setInterval(() => {
        setQrCountdown(prev => {
          if (prev <= 1) {
            loadSession();
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [session?.status]);

  // Real-time live polling for incoming messages and device pairing status
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (session?.status === 'CONNECTED') {
        api.getWhatsAppChats({
          counselorId: selectedCounselorId,
          search: searchQuery,
          filter: chatFilter
        }).then(data => setChats(data)).catch(() => {});

        if (selectedPhone) {
          api.getWhatsAppChatMessages(selectedPhone)
            .then(data => setActiveChatData(data))
            .catch(() => {});
        }
      } else {
        api.getWhatsAppSession(selectedCounselorId).then(s => {
          if (s.status === 'CONNECTED' && session?.status !== 'CONNECTED') {
            setSession(s);
            showToast('🎉 WhatsApp linked successfully! Ready to chat.', 'success');
            loadChats();
          } else if (s.qr_code_data && s.qr_code_data !== session?.qr_code_data) {
            setSession(s);
          }
        }).catch(() => {});
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [session?.status, selectedCounselorId, selectedPhone, searchQuery, chatFilter]);

  // Handle start QR session
  const handleStartQR = async (phoneNumber?: string) => {
    try {
      const counselor = counselors.find(c => c.id === selectedCounselorId);
      const res = await api.startWhatsAppSession({
        counselorId: selectedCounselorId,
        counselorName: counselor?.name || 'Counselor',
        phoneNumber: phoneNumber || undefined
      });
      setSession(res);
      setQrCountdown(90);
      showToast(phoneNumber ? 'Official WhatsApp pairing code requested.' : 'Real WhatsApp QR Code generated. Point WhatsApp scanner to link device.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to initialize session', 'error');
    }
  };

  const handleRequestPairingCode = async () => {
    if (!simulatedPhone.trim()) {
      showToast('Please enter your phone number to request pairing code', 'warning');
      return;
    }
    setRequestingPairingCode(true);
    try {
      await handleStartQR(simulatedPhone.trim());
    } finally {
      setRequestingPairingCode(false);
    }
  };

  // Send Inbound Student WhatsApp Message Test
  const handleSendInboundTest = async () => {
    if (!inboundMessage.trim() || !inboundPhone.trim()) {
      showToast('Please enter student phone and message', 'warning');
      return;
    }
    setSimulatingInbound(true);
    try {
      const res = await api.simulateInboundWhatsAppMessage({
        phone: inboundPhone.trim(),
        studentName: inboundStudentName.trim() || 'Student',
        message: inboundMessage.trim(),
        counselorId: selectedCounselorId
      });
      showToast('🎉 Student message received! AI replied and qualified lead. Moved to Leads tab.', 'success');
      setShowInboundTestModal(false);
      setSelectedPhone(inboundPhone.trim());
      await loadChats();
      await loadActiveChatMessages(inboundPhone.trim());
    } catch (err: any) {
      showToast(err.message || 'Failed to simulate student message', 'error');
    } finally {
      setSimulatingInbound(false);
    }
  };

  // Simulate scan / link device
  const handleSimulateScan = async () => {
    try {
      const counselor = counselors.find(c => c.id === selectedCounselorId);
      const res = await api.simulateScanWhatsAppDevice({
        counselorId: selectedCounselorId,
        phoneNumber: simulatedPhone,
        counselorName: counselor?.name || 'Prakash Yadav',
        deviceName: 'Chrome 124.0 (macOS Sonoma)'
      });
      setSession(res.session);
      showToast('🎉 WhatsApp linked successfully! Ready to chat with students.', 'success');
      loadChats();
    } catch (err: any) {
      showToast(err.message || 'Linking failed', 'error');
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to log out from this WhatsApp Web session?')) return;
    try {
      const res = await api.disconnectWhatsAppSession(selectedCounselorId);
      setSession(res.session);
      showToast('WhatsApp Web session logged out.', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Toggle AI auto reply
  const handleToggleAi = async () => {
    if (!session) return;
    const nextVal = !aiAutoReply;
    try {
      await api.toggleWhatsAppAIAutoReply(session.id, nextVal);
      setAiAutoReply(nextVal);
      showToast(nextVal ? 'AI Auto-Counselor enabled for this WhatsApp session' : 'AI Auto-Counselor paused (Manual Counselor Mode)', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !selectedPhone) return;

    setSending(true);
    try {
      const counselor = counselors.find(c => c.id === selectedCounselorId);
      await api.sendWhatsAppChatMessage(selectedPhone, {
        message: text.trim(),
        senderName: counselor?.name || 'Counselor',
        counselorId: selectedCounselorId,
        triggerAiResponse: false
      });
      setInputMessage('');
      await loadActiveChatMessages(selectedPhone);
      await loadChats();
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  // AI Suggest Reply draft
  const handleAiSuggestReply = async () => {
    if (!selectedPhone || !activeChatData) return;
    setAiGenerating(true);
    try {
      const lastStudentMsg = [...activeChatData.messages].reverse().find(m => m.sender !== 'GGS AI Counselor' && m.sender !== 'Counselor')?.content || 'Inquiring about admission criteria';
      const history = activeChatData.messages.slice(-4).map(m => ({
        sender: (m.sender.includes('Counselor') ? 'ai' : 'student') as 'ai' | 'student',
        message: m.content
      }));

      const res = await api.sendStudentChatMessage({
        message: lastStudentMsg,
        leadId: activeChatData.lead?.id,
        phone: selectedPhone,
        studentName: activeChatData.lead?.student_name,
        chatHistory: history,
        source: 'WhatsApp Web Counselor Assist'
      });

      setInputMessage(res.reply);
      showToast('AI draft generated! Review and click Send.', 'success');
    } catch (err: any) {
      showToast('AI assist error: ' + err.message, 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  // Promote / Move Lead to Leads Tab
  const handlePromoteLead = async () => {
    if (!selectedPhone || !activeChatData) return;
    try {
      const details = activeChatData.qualification?.details || {};
      const res = await api.promoteLeadFromWhatsApp(selectedPhone, {
        course: details.course,
        university: details.university || details.country,
        marks: details.marks,
        budget: details.budget,
        counselorId: selectedCounselorId,
        promotedBy: currentUser?.name || 'Counselor'
      });
      showToast(`🎯 Lead ${res.lead.student_name} successfully moved to Leads tab with verified details!`, 'success');
      await loadActiveChatMessages(selectedPhone);
      await loadChats();
    } catch (err: any) {
      showToast(err.message || 'Failed to promote lead', 'error');
    }
  };

  // Quick message template options
  const quickTemplates = [
    { label: '🇧🇩 MBBS Bangladesh Fees', text: 'Namaste! The total 5-year MBBS package in top Bangladesh medical colleges (Kumudini, Dhaka National) ranges from 35,000 to 45,000 USD including hostel & food. What is your +2 Biology percentage?' },
    { label: '🇮🇳 SRM / CU B.Tech CSE', text: 'Hello! For B.Tech in Computer Science & AI at SRM University or Chandigarh University, fees range between 1.8 to 3.5 Lakh INR per year, with up to 50% scholarships for Nepali students. May I know your +2 PCM marks?' },
    { label: '📄 Document Checklist', text: 'Here are the required documents to reserve your seat: 1) SEE/10th Marksheet, 2) +2 Transcript/Admit Card, 3) Citizenship/Passport copy, 4) Passport photos. You can send them right here on WhatsApp!' },
    { label: '🏆 Scholarship Pre-approval', text: 'Congratulations! Based on your academic score, you qualify for our 25% to 50% merit tuition scholarship bracket. Would you like me to reserve an early-bird scholarship seat for you?' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                WhatsApp Web Hub
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live Sync
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan QR code, link counselor WhatsApp account, chat with incoming students, and automatically qualify leads
              </p>
            </div>
          </div>
        </div>

        {/* Counselor Selector & Session Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Counselor:</span>
            <select
              value={selectedCounselorId}
              onChange={e => setSelectedCounselorId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {counselors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.designation || 'Counselor'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowInboundTestModal(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Simulate incoming student WhatsApp message to test AI auto-counselor and CRM lead capture"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test Student WhatsApp AI</span>
          </button>

          {session?.status === 'CONNECTED' ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected: {session.phone_number || '+977 9801234567'}</span>
                <span className="text-[10px] text-emerald-600 font-normal">({session.device_name || 'WhatsApp Web'})</span>
              </div>
              <button
                onClick={handleDisconnect}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Disconnect WhatsApp Session"
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Not Linked</span>
              </span>
              <button
                onClick={() => handleStartQR()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Link Device</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: DISCONNECTED / QR SCAN SCREEN */}
      {session?.status !== 'CONNECTED' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Instructions */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <Smartphone className="w-3.5 h-3.5" />
                  Step-by-Step Device Linking
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Connect WhatsApp to Education Sansar CRM
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Link your personal or office WhatsApp device. Inbound student messages will automatically chat with our AI counselor, extract marks &amp; budget, and promote qualified leads to your Leads tab.
                </p>
              </div>

              <ol className="space-y-3.5 text-xs text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    Open <strong className="text-slate-900">WhatsApp</strong> on your mobile phone.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    Tap <strong className="text-slate-900">Menu</strong> (Android) or <strong className="text-slate-900">Settings</strong> (iPhone) and select <strong className="text-slate-900">Linked Devices</strong>.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    Tap on <strong className="text-slate-900">Link a Device</strong> and point your phone camera at this QR code.
                  </div>
                </li>
              </ol>

              {/* Pairing code toggle */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowPairingCode(!showPairingCode)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  <span>{showPairingCode ? '← Scan QR code instead' : 'Link with 8-digit phone pairing code instead →'}</span>
                </button>
              </div>

              {/* Simulated Auto-Scan Simulator for Testing */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>Direct Connect / Fast Pairing:</span>
                  <span className="text-[10px] text-blue-600 font-mono">Auto-Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={simulatedPhone}
                    onChange={e => setSimulatedPhone(e.target.value)}
                    placeholder="+977 9801234567"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 font-mono"
                  />
                  <button
                    onClick={handleSimulateScan}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors"
                  >
                    Connect Phone
                  </button>
                </div>
              </div>
            </div>

            {/* QR Code Graphic Box */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              {showPairingCode ? (
                <div className="text-center py-6 space-y-4 w-full max-w-xs">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
                    🔢
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Official WhatsApp Pairing Code</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter your phone number to generate an official 8-digit WhatsApp pairing code
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={simulatedPhone}
                      onChange={e => setSimulatedPhone(e.target.value)}
                      placeholder="+977 9801234567"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 font-mono"
                    />
                    <button
                      onClick={handleRequestPairingCode}
                      disabled={requestingPairingCode}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors disabled:opacity-50"
                    >
                      {requestingPairingCode ? 'Requesting...' : 'Get Code'}
                    </button>
                  </div>

                  <div className="px-6 py-3 rounded-xl bg-white border-2 border-emerald-500 font-mono text-2xl font-extrabold text-emerald-700 tracking-widest shadow-sm inline-block">
                    {session?.pairing_code || 'GGS-9841'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Open WhatsApp &gt; Linked Devices &gt; Link with phone number instead
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {session?.qr_code_data ? (
                    <div className="relative group p-2 bg-white rounded-2xl shadow-md border-2 border-emerald-500">
                      <img
                        src={session.qr_code_data}
                        alt="WhatsApp Web Scannable QR Code"
                        className="w-64 h-64 object-contain rounded-xl"
                      />
                      <div
                        onClick={handleSimulateScan}
                        className="absolute inset-0 bg-slate-900/60 rounded-xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center cursor-pointer"
                        title="Click to connect phone immediately or scan directly with WhatsApp camera"
                      >
                        <Smartphone className="w-8 h-8 mb-2 text-emerald-400 animate-bounce" />
                        <span className="font-bold text-xs">Simulate Scan & Connect</span>
                        <span className="text-[10px] text-slate-300">Or scan with phone camera directly</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-64 h-64 bg-white p-4 rounded-2xl shadow-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                      <QrCode className="w-12 h-12 text-emerald-600 mb-2 animate-pulse" />
                      <p className="text-xs font-bold text-slate-700">Scan QR with WhatsApp</p>
                      <p className="text-[11px] text-slate-500 mt-1">Open WhatsApp &gt; Linked Devices &gt; Link a Device</p>
                      <button
                        onClick={() => handleStartQR()}
                        className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Generate QR Code
                      </button>
                    </div>
                  )}

                  {/* Countdown status */}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 w-full px-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Auto-refresh in {qrCountdown}s
                    </span>
                    <button
                      onClick={() => handleStartQR()}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh QR</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleSimulateScan}
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 hover:brightness-105 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Phone Scan &amp; Open WhatsApp Web</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CONNECTED 3-PANE WHATSAPP WEB WORKSPACE */}
      {session?.status === 'CONNECTED' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
          {/* WhatsApp Web Sub-Header */}
          <div className="h-14 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                {(session.counselor_name || 'Counselor').charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>{session.counselor_name || 'Prakash Yadav'}</span>
                  <span className="text-[10px] font-mono text-slate-500 font-normal">
                    {session.phone_number || '+977 9801234567'}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online (WhatsApp Web Multi-device Sync Active)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* AI Auto Reply Mode Toggle */}
              <button
                onClick={handleToggleAi}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                  aiAutoReply
                    ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
                title="When ON, incoming student inquiries are automatically answered and qualified by the AI Counselor"
              >
                <Bot className={`w-3.5 h-3.5 ${aiAutoReply ? 'text-purple-600 animate-spin-slow' : 'text-slate-400'}`} />
                <span>AI Auto-Counselor: {aiAutoReply ? 'ON' : 'PAUSED'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs">
                <Battery className="w-4 h-4 text-emerald-600" />
                <span className="font-mono text-[11px]">{session.battery_level || 88}%</span>
                <Wifi className="w-4 h-4 text-emerald-600" />
              </div>

              <button
                onClick={handleDisconnect}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                title="Log out session"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* 3-Column Content Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* COLUMN 1: CHATS SIDEBAR (320px) */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
              {/* Search & Filter Bar */}
              <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search student or phone..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
                  <button
                    onClick={() => setChatFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      chatFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All ({chats.length})
                  </button>
                  <button
                    onClick={() => setChatFilter('qualified')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                      chatFilter === 'qualified' ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <span>🎯 Qualified</span>
                  </button>
                  <button
                    onClick={() => setChatFilter('high_intent')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                      chatFilter === 'high_intent' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <span>🔥 Hot Leads</span>
                  </button>
                </div>
              </div>

              {/* Chats Stream List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {loadingChats ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Loading conversations...</span>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <div>No WhatsApp chats found.</div>
                  </div>
                ) : (
                  chats.map(chat => {
                    const isSelected = selectedPhone === chat.phone;
                    return (
                      <div
                        key={chat.phone}
                        onClick={() => setSelectedPhone(chat.phone)}
                        className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative ${
                          isSelected ? 'bg-emerald-50/70 border-r-4 border-r-emerald-600' : 'hover:bg-slate-100/70 bg-white'
                        }`}
                      >
                        {/* Student Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                          {chat.lead_name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {chat.lead_name}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {chat.course && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-[120px]">
                                {chat.course}
                              </span>
                            )}
                            {chat.is_qualified && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                                {chat.qualification_score}%
                              </span>
                            )}
                            {chat.lead_temperature === 'HOT' && (
                              <Flame className="w-3 h-3 text-rose-600" />
                            )}
                          </div>

                          <p className="text-xs text-slate-500 truncate">
                            {chat.last_message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUMN 2: ACTIVE CONVERSATION WINDOW (FLEX-1) */}
            <div className="flex-1 flex flex-col bg-[#efeae2] border-r border-slate-200 overflow-hidden relative">
              {/* WhatsApp Wallpaper subtle overlay */}
              <div 
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#128C7E 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }}
              />

              {selectedPhone && activeChatData ? (
                <>
                  {/* Chat Top Header */}
                  <div className="h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 flex items-center justify-between z-10 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {(activeChatData.lead?.student_name || 'Student').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate flex items-center gap-2">
                          <span>{activeChatData.lead?.student_name || 'Prospective Student'}</span>
                          {activeChatData.qualification?.isQualified && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                              🎯 Qualified ({activeChatData.qualification?.score}%)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {selectedPhone} &bull; {activeChatData.lead?.preferred_course || 'Inquiry'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePromoteLead}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        title="Ensure lead is active in the CRM Leads Tab with captured details"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Move to Leads Tab</span>
                      </button>

                      {activeChatData.lead && (
                        <button
                          onClick={() => navigate(`/leads/${activeChatData.lead.id}`)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="Open CRM Lead Detail"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Bubble Stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10">
                    {loadingMessages ? (
                      <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Loading chat messages...</span>
                      </div>
                    ) : activeChatData.messages.length === 0 ? (
                      <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                        <MessageCircle className="w-10 h-10 text-slate-300 mx-auto" />
                        <div>No messages yet in this conversation thread.</div>
                        <p className="text-[11px] text-slate-400">
                          Send a message below or use a quick template.
                        </p>
                      </div>
                    ) : (
                      activeChatData.messages.map(msg => {
                        const isStudent = msg.sender !== 'GGS AI Counselor' && !msg.sender.includes('Counselor');
                        const isAI = msg.sender === 'GGS AI Counselor';

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isStudent ? 'items-start' : 'items-end'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl p-3 shadow-xs text-xs space-y-1 relative ${
                                isStudent
                                  ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
                                  : isAI
                                  ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none border border-emerald-200/80'
                                  : 'bg-[#d9fdd3] text-slate-900 rounded-tr-none border border-emerald-300'
                              }`}
                            >
                              {/* Sender Pill */}
                              <div className="flex items-center justify-between gap-3 text-[10px] font-bold border-b border-black/5 pb-1">
                                <span className={isStudent ? 'text-blue-600' : isAI ? 'text-purple-700' : 'text-emerald-700'}>
                                  {isStudent ? 'Student' : isAI ? '🤖 GGS AI Counselor' : msg.sender}
                                </span>
                                <span className="text-[9px] text-slate-400 font-normal">
                                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              {/* Message Text with preserved line breaks */}
                              <p className="whitespace-pre-wrap leading-relaxed text-[12px]">
                                {msg.content}
                              </p>

                              {/* Checkmarks */}
                              {!isStudent && (
                                <div className="flex justify-end pt-0.5">
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Message Templates Bar */}
                  <div className="px-3 py-2 bg-white/95 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px] z-10 shrink-0">
                    <span className="text-slate-400 text-[10px] font-bold uppercase shrink-0">Templates:</span>
                    {quickTemplates.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(t.text)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Input & Action Bar */}
                  <div className="p-3 bg-white border-t border-slate-200 z-10 space-y-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAiSuggestReply}
                        disabled={aiGenerating}
                        className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
                        title="AI will analyze student's question and Knowledge Base to draft an answer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>{aiGenerating ? 'Drafting...' : 'AI Suggest Reply'}</span>
                      </button>

                      <div className="flex-1 relative">
                        <textarea
                          rows={2}
                          value={inputMessage}
                          onChange={e => setInputMessage(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type WhatsApp response to student... (Press Enter to send)"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-slate-50 focus:bg-white"
                        />
                      </div>

                      <button
                        onClick={() => handleSendMessage()}
                        disabled={sending || !inputMessage.trim()}
                        className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-40 transition-all shrink-0 shadow-sm shadow-emerald-700/20"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center text-emerald-600">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-sm">Select a Conversation</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Choose an inquiry from the left sidebar to inspect AI qualification, chat with the student, or move them into the CRM Leads tab.
                  </p>
                </div>
              )}
            </div>

            {/* COLUMN 3: STUDENT QUALIFICATION DOSSIER & LEAD CAPTURE (300px) */}
            <div className="w-76 border-l border-slate-200 flex flex-col bg-white overflow-y-auto p-4 space-y-5 shrink-0">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Lead Qualification Dossier
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time attributes captured by AI Chatbot
                </p>
              </div>

              {activeChatData ? (
                <>
                  {/* Qualification Score Meter */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Qualification Score</span>
                      <span className="font-mono font-extrabold text-sm text-purple-700">
                        {activeChatData.qualification?.score || 0}/100
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          (activeChatData.qualification?.score || 0) >= 70
                            ? 'bg-rose-500'
                            : (activeChatData.qualification?.score || 0) >= 45
                            ? 'bg-emerald-500'
                            : 'bg-amber-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, activeChatData.qualification?.score || 10))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        (activeChatData.qualification?.score || 0) >= 70
                          ? 'bg-rose-100 text-rose-800'
                          : (activeChatData.qualification?.score || 0) >= 45
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {activeChatData.qualification?.status || 'In Progress'}
                      </span>
                    </div>
                  </div>

                  {/* Captured Required Fields */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Captured Lead Details
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Target Course</div>
                        <div className="font-bold text-slate-900">
                          {activeChatData.qualification?.details?.course || activeChatData.lead?.preferred_course || 'Undecided'}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Country / University</div>
                        <div className="font-bold text-slate-900">
                          {activeChatData.qualification?.details?.university || activeChatData.qualification?.details?.country || activeChatData.lead?.preferred_university || 'Not Specified'}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Academic Score / Marks</div>
                        <div className="font-bold text-slate-900">
                          {activeChatData.qualification?.details?.marks || (activeChatData.lead?.percentage_12th ? `${activeChatData.lead.percentage_12th}%` : 'Not Captured Yet')}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Target Budget</div>
                        <div className="font-bold text-slate-900">
                          {activeChatData.qualification?.details?.budget || activeChatData.lead?.budget || 'Not Specified'}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Intake Year</div>
                        <div className="font-bold text-slate-900">
                          {activeChatData.qualification?.details?.intake || 'Fall 2026'}
                        </div>
                      </div>

                      {activeChatData.qualification?.details?.entranceExam && (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Entrance Exam</div>
                          <div className="font-bold text-slate-900">
                            {activeChatData.qualification.details.entranceExam}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action: Move / Sync to Leads Tab */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <button
                      onClick={handlePromoteLead}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Promote to Leads Tab</span>
                    </button>

                    {activeChatData.lead && (
                      <button
                        onClick={() => navigate(`/leads/${activeChatData.lead.id}`)}
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Lead Profile in CRM</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a chat thread to inspect lead qualification details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Test Inbound Student Message Modal */}
      {showInboundTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <h3 className="font-bold text-sm">Test Student WhatsApp Message</h3>
              </div>
              <button
                onClick={() => setShowInboundTestModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Simulate a student sending a WhatsApp message to this counselor. The AI will immediately converse using the Knowledge Base, extract student details (course, marks, budget), and promote qualified leads directly to the Leads tab!
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Phone Number</label>
                <input
                  type="text"
                  value={inboundPhone}
                  onChange={e => setInboundPhone(e.target.value)}
                  placeholder="+977 9801234567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={inboundStudentName}
                  onChange={e => setInboundStudentName(e.target.value)}
                  placeholder="Aryan Thapa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inbound WhatsApp Message</label>
                <textarea
                  rows={3}
                  value={inboundMessage}
                  onChange={e => setInboundMessage(e.target.value)}
                  placeholder="Hi, I want admission in MBBS Bangladesh. I scored 84% in 12th PCB and my budget is 35 Lakhs. Which college is best?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowInboundTestModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInboundTest}
                  disabled={simulatingInbound}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {simulatingInbound ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AI Conversing &amp; Qualifying...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Inbound Message</span>
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

