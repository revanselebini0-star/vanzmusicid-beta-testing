import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { 
  Search, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon, 
  Radio, 
  CheckCircle2, 
  Database,
  WifiOff,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminVerifiedBadge } from './AdminVerifiedBadge';

interface AppleNavbarProps {
  onSearchFocus?: () => void;
}

export const AppleNavbar: React.FC<AppleNavbarProps> = ({ onSearchFocus }) => {
  const { 
    isDarkMode, 
    toggleDarkMode, 
    user, 
    isAdmin,
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
                beta
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

        {/* Right Action Icons: Offline status, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Offline / IndexedDB indicator badge */}
          <div 
            title={isOnline ? "IndexedDB & Firebase Online" : "Mode Offline (Data dari IndexedDB)"}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 border border-black/5 dark:border-white/5"
          >
            {isOnline ? (
              <>
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px]">Online</span>
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

          {/* User Auth Profile / Login Button */}
          <div className="relative">
            {user ? (
              <button
                id="user-profile-btn"
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/10 hover:border-[#fa2d48]/40 transition-all"
              >
                <span className="hidden sm:inline text-xs font-medium text-neutral-800 dark:text-neutral-200 max-w-[110px] truncate">
                  {user.displayName || 'Pengguna'}
                </span>
                {isAdmin && (
                  <AdminVerifiedBadge className="w-3.5 h-3.5 text-white shrink-0" />
                )}
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-[#fa2d48]/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#fa2d48] text-white flex items-center justify-center text-xs font-bold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </button>
            ) : (
              <button
                id="nav-account-btn"
                onClick={() => setActiveTab('account')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#fa2d48] hover:bg-[#e0263f] text-white shadow-sm shadow-[#fa2d48]/25 active:scale-95 transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Masuk / Akun</span>
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {user.displayName || 'Pengguna Vanz'}
                      </p>
                      {isAdmin && (
                        <AdminVerifiedBadge className="w-3.5 h-3.5 text-white shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      {user.email || 'Akun Tamu'}
                    </p>
                    {isAdmin ? (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-white font-bold">
                        <AdminVerifiedBadge className="w-3 h-3 text-white shrink-0" />
                        <span>Admin Resmi</span>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Akun Aktif & Terisolasi</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('account');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#fa2d48]" />
                      <span>Ganti Foto Profil & Nama</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('playlist');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
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
