import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { 
  Search, 
  Sun, 
  Moon, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Radio, 
  CheckCircle2, 
  Database,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppleNavbarProps {
  onSearchFocus?: () => void;
}

export const AppleNavbar: React.FC<AppleNavbarProps> = ({ onSearchFocus }) => {
  const { 
    isDarkMode, 
    toggleDarkMode, 
    user, 
    isAuthLoading, 
    signInWithGoogleAction, 
    signOutAction,
    activeTab,
    setActiveTab
  } = usePlayer();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full apple-glass border-b border-black/5 dark:border-white/10 px-4 md:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div 
          onClick={() => setActiveTab('listen_now')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fa2d48] to-[#ff5268] flex items-center justify-center text-white shadow-md shadow-[#fa2d48]/25 group-hover:scale-105 transition-transform duration-200">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white group-hover:text-[#fa2d48] transition-colors">
                vanz music
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#fa2d48]/10 text-[#fa2d48] border border-[#fa2d48]/20">
                beta testing
              </span>
            </div>
          </div>
        </div>

        {/* Global Quick Search Button / Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <button
            id="global-search-btn"
            onClick={() => {
              setActiveTab('search');
              if (onSearchFocus) onSearchFocus();
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
              activeTab === 'search'
                ? 'bg-black/10 dark:bg-white/15 text-neutral-900 dark:text-white ring-2 ring-[#fa2d48]/50'
                : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Search className="w-4 h-4 text-neutral-400" />
            <span className="text-sm">Cari artis, lagu, lirik YouTube...</span>
          </button>
        </div>

        {/* Right Action Icons: Offline status, Theme Toggle, Google User */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Offline / IndexedDB indicator badge */}
          <div 
            title={isOnline ? "IndexedDB & Firebase Online" : "Mode Offline (Data dari IndexedDB)"}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 border border-black/5 dark:border-white/5"
          >
            {isOnline ? (
              <>
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px]">IndexedDB Siap</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px]">Offline</span>
              </>
            )}
          </div>

          {/* Dark / Light Toggle */}
          <button
            id="toggle-dark-mode-btn"
            onClick={toggleDarkMode}
            aria-label="Toggle tema gelap atau terang"
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
          </button>

          {/* Google Auth Profile */}
          <div className="relative">
            {user ? (
              <button
                id="user-profile-btn"
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/10 hover:border-[#fa2d48]/40 transition-all"
              >
                <span className="hidden sm:inline text-xs font-medium text-neutral-800 dark:text-neutral-200 max-w-[100px] truncate">
                  {user.displayName || 'Pengguna'}
                </span>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-[#fa2d48]/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#fa2d48] text-white flex items-center justify-center text-xs font-bold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </button>
            ) : (
              <button
                id="google-login-btn"
                onClick={signInWithGoogleAction}
                disabled={isAuthLoading}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#fa2d48] hover:bg-[#e0263f] text-white shadow-sm shadow-[#fa2d48]/25 active:scale-95 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Masuk Google</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileMenuOpen && user && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl apple-glass shadow-2xl border border-black/10 dark:border-white/10 p-3 z-50 overflow-hidden"
                >
                  <div className="px-2 py-2 border-b border-black/5 dark:border-white/10">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {user.displayName}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {user.email}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Firebase Auth Aktif</span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('library');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#fa2d48]" />
                      <span>Koleksi Musik Saya</span>
                    </button>

                    <button
                      id="signout-button"
                      onClick={() => {
                        signOutAction();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
