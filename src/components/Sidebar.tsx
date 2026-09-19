import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { 
  Search, 
  Home, 
  Sparkles, 
  ExternalLink, 
  LogIn, 
  LogOut,
  User as UserIcon,
  Music2
} from 'lucide-react';
import { ViewTab } from '../types';

interface SidebarProps {
  onCreatePlaylistClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { 
    activeTab, 
    setActiveTab, 
    user, 
    isAuthLoading, 
    signInWithGoogleAction, 
    signOutAction 
  } = usePlayer();

  const navItems = [
    { id: 'search' as ViewTab, label: 'Cari', icon: Search },
    { id: 'listen_now' as ViewTab, label: 'Beranda', icon: Home },
    { id: 'recommendations' as ViewTab, label: 'Rekomendasi', icon: Sparkles },
    { id: 'account' as ViewTab, label: 'Akun', icon: UserIcon },
  ];

  return (
    <aside className="hidden lg:flex w-56 shrink-0 h-screen bg-[#1c1c1e] text-neutral-300 flex-col justify-between p-4 select-none border-r border-white/5 font-sans z-20">
      {/* Top Section: Logo & Nav items */}
      <div className="space-y-6">
        {/* Brand Header: Music icon + Music (No Apple Logo) */}
        <div 
          onClick={() => setActiveTab('listen_now')}
          className="flex items-center gap-2 px-3 pt-2 cursor-pointer group"
        >
          <div className="w-6 h-6 rounded-md bg-[#fa2d48] flex items-center justify-center text-white shadow-sm shadow-[#fa2d48]/40">
            <Music2 className="w-4 h-4 fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white group-hover:text-[#fa2d48] transition-colors">
            Music
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
                    ? 'border border-[#fa2d48]/80 text-white bg-white/[0.04]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
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

        {/* Masuk / Login Button */}
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-neutral-400" />
              )}
              <span className="text-xs text-white truncate flex-1 font-medium">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={signOutAction}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogleAction}
            disabled={isAuthLoading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#fa2d48] hover:bg-[#e0263f] text-white text-xs font-bold shadow-md shadow-[#fa2d48]/20 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
        )}
      </div>
    </aside>
  );
};
