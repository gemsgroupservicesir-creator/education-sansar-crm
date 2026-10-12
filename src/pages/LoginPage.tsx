import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  CalendarCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useNotifications();

  const [identifier, setIdentifier] = useState('admin@educationsansar.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your email or username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(identifier.trim(), password);
      showToast(`Welcome back, ${loggedUser.name}!`, 'success');
      navigate('/');
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password. Please verify your credentials.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-900 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* ============================================================== */}
      {/* LEFT: HERO & BRANDING PANEL (Visible on lg+ screens) */}
      {/* ============================================================== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white p-10 flex-col justify-between relative overflow-hidden border-r border-blue-900/60 shadow-2xl">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Top Logo & Title */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-white/10">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">
                  Education Sansar
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-400/20 text-sky-200 border border-sky-400/30">
                  CRM 2.0
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                Admission Management &amp; Student Recruitment Portal
              </p>
            </div>
          </div>

          <div className="pt-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-700/60 text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Nepal &amp; India Higher Education 2026 Intake</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Practical Admission CRM for Modern Consultancies
            </h1>
            <p className="text-sm text-blue-200/80 leading-relaxed pt-1">
              Engineered specifically for study-in-India education counselors to manage student inquiries, partner university fee matrices, follow-ups, and admissions.
            </p>
          </div>
        </div>

        {/* Core Value Props List */}
        <div className="relative z-10 my-8 space-y-4">
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                University &amp; Course Fee Database
              </h3>
              <p className="text-[11px] text-blue-200/70 mt-0.5">
                Verified tuition, hostel, one-time fees, and side-by-side comparison for 2–5 partner universities.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Fast Counseling Desk &amp; Action Lists
              </h3>
              <p className="text-[11px] text-blue-200/70 mt-0.5">
                14-stage lead lifecycle, 1-click calls, WhatsApp outreach, and instant course matchmaker.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Google Sheets &amp; Meta Ads Auto-Sync
              </h3>
              <p className="text-[11px] text-blue-200/70 mt-0.5">
                Phone deduplication matches incoming leads, updates profiles, and preserves notes.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Security Banner */}
        <div className="relative z-10 pt-6 border-t border-blue-900 flex items-center justify-between text-[11px] text-blue-300/80">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict Role-Based Access Control</span>
          </div>
          <span>Kathmandu &amp; Delhi Hubs</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT: LOGIN FORM & QUICK DEMO ACCESS */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto bg-slate-50">
        {/* Mobile Header (Visible only on mobile/tablet) */}
        <div className="lg:hidden flex items-center gap-3 pb-6 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base">Education Sansar</span>
            <span className="text-xs block text-slate-500">Admission Consultancy CRM</span>
          </div>
        </div>

        {/* Center Container */}
        <div className="max-w-md w-full mx-auto my-auto py-6 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Secure Portal
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500">
              Enter your credentials to access your student leads, university fees, and admissions pipeline.
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 animate-in fade-in space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold">Authentication notice: </span>
                  <span>{error}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickLogin(DEMO_ACCOUNTS[0])}
                className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>⚡ Click to enter directly as Super Admin (Bikash Karki)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input: Email or Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@educationsansar.com or aarav"
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs font-medium"
                />
              </div>
            </div>

            {/* Input: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-600 font-medium">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all ${
                loading
                  ? 'bg-blue-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/20 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Production System Info */}
          <div className="pt-4 border-t border-slate-200">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-center space-y-1">
              <p className="text-xs font-semibold text-slate-700">Official Staff &amp; Administrator Portal</p>
              <p className="text-[11px] text-slate-500">
                Please enter your registered Education Sansar CRM credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200/80 text-center text-xs text-slate-400 space-y-1">
          <p>© 2026 Education Sansar Consultancy CRM · All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            Need help? Contact system administrator at <span className="font-semibold text-slate-600">admin@educationsansar.com</span>
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: FORGOT PASSWORD INFO */}
      {/* ============================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 p-4 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Forgot Your Password?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                For security reasons, counselor and telecaller passwords are managed directly by your organization's Super Admin.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="font-semibold text-slate-900">How to reset:</div>
              <p className="text-[11px] text-slate-600">
                1. Ask your Super Admin to open the <strong className="text-slate-800">Counselors</strong> page.
              </p>
              <p className="text-[11px] text-slate-600">
                2. Click the <strong className="text-slate-800">Reset Password</strong> key icon on your profile.
              </p>
              <p className="text-[11px] text-slate-600">
                3. Your new credentials will be active immediately.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
