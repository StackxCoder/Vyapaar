import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallPill, setShowInstallPill] = useState(false);

  useEffect(() => {
    // Offline detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // App Install Prompt logic
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      const visits = parseInt(localStorage.getItem('mv_visits') || '0', 10);
      const dismissed = localStorage.getItem('mv_install_dismissed');
      
      localStorage.setItem('mv_visits', (visits + 1).toString());
      if (visits >= 2 && !dismissed) { // 3rd visit
        setShowInstallPill(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Initial visit count increment
    const visits = parseInt(localStorage.getItem('mv_visits') || '0', 10);
    if (!localStorage.getItem('mv_visit_logged_session')) {
      localStorage.setItem('mv_visits', Math.max(visits, visits + 1).toString()); // safe increment
      localStorage.setItem('mv_visit_logged_session', '1');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        setShowInstallPill(false);
      }
      setInstallPrompt(null);
    });
  };

  const handleDismissPill = () => {
    localStorage.setItem('mv_install_dismissed', 'true');
    setShowInstallPill(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Global Offline / UI Layers */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white text-center text-xs py-1.5 font-bold shadow-md">
          Offline mode — data save ho raha hai
        </div>
      )}

      {showInstallPill && (
        <div className="fixed top-12 left-4 right-4 z-[90] bg-white border border-indigo-100 rounded-xl p-4 shadow-xl flex items-center justify-between md:hidden pb-safe animate-in fade-in slide-in-from-top-4">
          <div>
            <div className="font-bold text-slate-800 text-sm">Install karo phone pe</div>
            <div className="text-xs text-slate-500">Home screen pe app jaisa aayega</div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDismissPill} className="text-xs font-bold text-slate-400 p-2">Baad mein</button>
            <button onClick={handleInstallClick} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm">Install Karo</button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto transition-all duration-300 h-screen w-full pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <BottomNav />
    </div>
  );
}
