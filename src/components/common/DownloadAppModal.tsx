import React, { useState } from 'react';
import {
  X,
  Monitor,
  Laptop,
  Tablet,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Download,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  FolderOpen
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'mac' | 'win' | 'ipad'>('mac');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const releasePath = '/Users/prakashyadav/Downloads/education-sansar-crm/release';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Gems Group Services CRM Apps</h2>
              <p className="text-xs text-blue-200">
                Official native & standalone apps for macOS, Windows, and iPadOS
              </p>
            </div>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => setActiveTab('mac')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'mac'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-white/20'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>macOS (Apple Mac)</span>
            </button>

            <button
              onClick={() => setActiveTab('win')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'win'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-white/20'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Windows (10 & 11)</span>
            </button>

            <button
              onClick={() => setActiveTab('ipad')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'ipad'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-white/20'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span>iPadOS (Apple iPad)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* TAB 1: macOS */}
          {activeTab === 'mac' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Build Ready
                    </span>
                    <span className="text-xs font-semibold text-slate-700">Apple Silicon (M1/M2/M3/M4) & Intel</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">macOS Desktop Application</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fast native Mac app with custom title bar, menu bar shortcuts, auto-reloading, and background alerts.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-800">Version 1.0.0</div>
                  <div className="text-[11px] text-slate-400">136 MB</div>
                </div>
              </div>

              {/* Package Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900">Apple Disk Image (.DMG)</span>
                    <span className="text-[11px] font-semibold text-blue-700">136 MB</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-3">
                    Recommended. Open DMG and drag Gems CRM to your Applications folder.
                  </p>
                  <div className="font-mono text-[10px] p-2 bg-white rounded-lg border border-blue-200 text-slate-700 break-all select-all">
                    Gems Group Services CRM-1.0.0-arm64.dmg
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Standalone ZIP (.ZIP)</span>
                    <span className="text-[11px] font-semibold text-slate-600">132 MB</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-3">
                    Pre-extracted application. Unzip and run directly from anywhere.
                  </p>
                  <div className="font-mono text-[10px] p-2 bg-white rounded-lg border border-slate-200 text-slate-700 break-all select-all">
                    Gems Group Services CRM-1.0.0-arm64-mac.zip
                  </div>
                </div>
              </div>

              {/* Local File Finder Access */}
              <div className="p-4 rounded-xl bg-slate-900 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold">Open Built App in Mac Finder</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`open "${releasePath}"`, 'mac-open')}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white transition-colors"
                  >
                    {copiedText === 'mac-open' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Terminal Command</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  The installers are located right on your Mac. Run this command in Terminal to reveal them instantly in Finder:
                </p>
                <div className="font-mono text-xs p-2.5 bg-black/40 rounded-lg text-emerald-300 border border-slate-800 break-all select-all">
                  open "{releasePath}"
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Windows */}
          {activeTab === 'win' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Build Ready
                    </span>
                    <span className="text-xs font-semibold text-slate-700">Windows 10 & 11 (64-bit x64)</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">Windows Desktop Application</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official Windows package with Desktop shortcut, Start Menu integration, and auto-sync.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-800">Version 1.0.0</div>
                  <div className="text-[11px] text-slate-400">131 MB</div>
                </div>
              </div>

              {/* Package Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900">Setup Installer (.EXE)</span>
                    <span className="text-[11px] font-semibold text-blue-700">131 MB</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-3">
                    One-click NSIS Windows installer. Creates Start Menu and Desktop shortcuts automatically.
                  </p>
                  <div className="font-mono text-[10px] p-2 bg-white rounded-lg border border-blue-200 text-slate-700 break-all select-all">
                    Gems Group Services CRM Setup 1.0.0.exe
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Portable Executable (.EXE)</span>
                    <span className="text-[11px] font-semibold text-slate-600">113 MB</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-3">
                    Zero-installation standalone EXE. Copy to a USB drive or PC and run immediately.
                  </p>
                  <div className="font-mono text-[10px] p-2 bg-white rounded-lg border border-slate-200 text-slate-700 break-all select-all">
                    Gems Group Services CRM 1.0.0.exe
                  </div>
                </div>
              </div>

              {/* Windows File Location */}
              <div className="p-4 rounded-xl bg-slate-900 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold">Package Storage Path</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`${releasePath}/Gems Group Services CRM Setup 1.0.0.exe`, 'win-copy')}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white transition-colors"
                  >
                    {copiedText === 'win-copy' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Installer Path</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  To send to a Windows user or counselor, send the setup file from this directory:
                </p>
                <div className="font-mono text-xs p-2.5 bg-black/40 rounded-lg text-blue-300 border border-slate-800 break-all select-all">
                  {releasePath}/Gems Group Services CRM Setup 1.0.0.exe
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: iPadOS */}
          {activeTab === 'ipad' && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white shadow-xs">
                      Instant Setup
                    </span>
                    <span className="text-xs font-semibold text-blue-900">Apple iPadOS & iOS PWA App</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">Install on iPad in 30 Seconds</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Apple iPadOS allows installing the CRM directly as a standalone fullscreen app with zero App Store friction.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-800">Fullscreen PWA</div>
                  <div className="text-[11px] text-emerald-600 font-semibold">Touch Optimized</div>
                </div>
              </div>

              {/* 3 Simple Steps */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900">Open in Safari on iPad</div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Open Safari on your iPad and go to{' '}
                      <a
                        href="https://education-sansar-crm.vercel.app"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-semibold underline"
                      >
                        https://education-sansar-crm.vercel.app
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900">Tap the Share Button</div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      At the top of Safari (or bottom toolbar), tap the <strong>Share icon</strong> (a square with an arrow pointing up).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900">Select "Add to Home Screen" & Tap "Add"</div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Scroll down in the Share sheet and tap <strong>"Add to Home Screen"</strong> with the plus (+) icon, then tap <strong>"Add"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* What You Get on iPad */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 mb-2">What happens on your iPad:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Appears directly on Home Screen & Dock</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Runs full-screen with no Safari browser bars</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Split View & Stage Manager multitasking</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant offline caching with Service Worker</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure TLS & Neon Cloud Sync Enabled</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <a
              href="https://education-sansar-crm.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
            >
              <span>Open Web Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
