import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

declare const __APP_BUILD_TIME__: string;

export const AutoUpdateListener: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const currentBuildTimeRef = useRef<string>(
    typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : ''
  );
  const serverBuildIdRef = useRef<string>('');

  const checkForUpdates = async () => {
    try {
      // Add timestamp query parameter to bypass aggressive browser caching
      const res = await fetch(`/api/system/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) return;
      const data = await res.json();
      const serverBuildTime = data.buildTime;
      const serverBuildId = data.buildId;

      if (!serverBuildIdRef.current && serverBuildId) {
        serverBuildIdRef.current = serverBuildId;
      }

      // Check if build changed
      const localTime = currentBuildTimeRef.current;
      const buildChanged = 
        (localTime && serverBuildTime && localTime !== serverBuildTime) ||
        (serverBuildIdRef.current && serverBuildId && serverBuildIdRef.current !== serverBuildId);

      if (buildChanged) {
        console.log('[AutoUpdater] New deployment detected:', {
          localTime,
          serverBuildTime,
          serverBuildId
        });
        setHasUpdate(true);

        // Tell service worker to check for updates immediately
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.update();
            }
          });
        }
      }
    } catch (e) {
      // Quietly ignore network blips
    }
  };

  useEffect(() => {
    // 1. Initial check after 5 seconds
    const initialTimer = setTimeout(checkForUpdates, 5000);

    // 2. Poll every 45 seconds
    const intervalTimer = setInterval(checkForUpdates, 45000);

    // 3. Check whenever user refocuses tab / brings app to front
    const handleFocus = () => checkForUpdates();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    const handleOnline = () => checkForUpdates();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    // 4. Listen for Service Worker controller change (PWA instant update)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[AutoUpdater] Service worker updated, refreshing client...');
        window.location.reload();
      });
    }

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        Promise.all(names.map((name) => caches.delete(name))).finally(() => {
          window.location.reload();
        });
      });
    } else {
      window.location.reload();
    }
  };

  if (!hasUpdate || updateDismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-blue-500/40 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>New Update Available</span>
              <span className="px-1.5 py-0.2 bg-blue-500 text-[9px] font-extrabold uppercase rounded">
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              A fresh update was pushed. Reload to get latest changes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleApplyUpdate}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Reloading...' : 'Update'}</span>
          </button>
          <button
            onClick={() => setUpdateDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
