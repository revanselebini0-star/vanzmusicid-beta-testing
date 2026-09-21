import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { 
  Search, 
  ExternalLink,
  LogIn, 
  LogOut,
  User as UserIcon,
  Music2
} from 'lucide-react';
import { HomeIcon, RecommendationIcon, AccountIcon } from './icons/CustomIcons';
import { ViewTab } from '../types';

interface SidebarProps {
  onCreatePlaylistClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { 
    activeTab, 
    setActiveTab, 
    user, 
    signOutAction 
  } = usePlayer();

  const navItems: { id: ViewTab; label: string; icon?: any; image?: string }[] = [
    { id: 'listen_now', label: 'Beranda', icon: HomeIcon },
    { id: 'search', label: 'Cari', icon: Search },
    { id: 'recommendations', label: 'Rekomendasi', icon: RecommendationIcon },
    { 
      id: 'vanzupdate', 
      label: 'Vanz Update', 
      image: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png' 
    },
    { id: 'account', label: 'Akun', icon: AccountIcon },
  ];

  return (
    <aside className="hidden lg:flex w-56 shrink-0 h-screen bg-[#1c1c1e] text-neutral-300 flex-col justify-between p-4 select-none border-r border-white/5 font-sans z-20">
      {/* Top Section: Logo & Nav items */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div 
          onClick={() => setActiveTab('listen_now')}
          className="flex items-center gap-2 px-3 pt-2 cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-md bg-[var(--theme-accent)] flex items-center justify-center text-white shadow-sm shadow-[var(--theme-glow)]">
            <Music2 className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white group-hover:text-[var(--theme-accent)] transition-colors">
            Vanz Music
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'recommendations' && activeTab === 'radio');

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'border border-[var(--theme-accent)]/80 text-white bg-white/[0.04]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item.image ? (
                  <div className={`w-4 h-4 rounded-full overflow-hidden shrink-0 ring-1 ${
                    isActive ? 'ring-[var(--theme-accent)]' : 'ring-white/20'
                  }`}>
                    <img 
                      src={item.image} 
                      alt={item.label} 
                      referrerPolicy="no-referrer" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--theme-accent)]' : 'text-neutral-400'}`} />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Buka di Musik & Masuk Button */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        {/* Buka di Musik button */}
        <button 
          onClick={() => setActiveTab('listen_now')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors w-full text-left"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Buka di Musik</span>
        </button>

        {/* Masuk / Login Profile Widget */}
        {user ? (
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('account')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover border border-[var(--theme-accent)]"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[var(--theme-accent)] flex items-center justify-center text-[10px] font-bold text-white">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <span className="text-xs text-white truncate flex-1 font-medium">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </button>
            <button
              onClick={signOutAction}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('account')}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--theme-accent)] hover:opacity-90 text-white text-xs font-bold shadow-md shadow-[var(--theme-glow)] transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk / Akun</span>
          </button>
        )}
      </div>
    </aside>
  );
};
