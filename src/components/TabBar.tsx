import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Search } from 'lucide-react';
import { HomeIcon, RecommendationIcon, AccountIcon } from './icons/CustomIcons';
import { ViewTab } from '../types';

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, isBottomBarsVisible } = usePlayer();

  const tabs: { id: ViewTab; label: string; icon?: any; image?: string }[] = [
    { id: 'listen_now', label: 'Beranda', icon: HomeIcon },
    { id: 'recommendations', label: 'Rekomendasi', icon: RecommendationIcon },
    { id: 'search', label: 'Cari', icon: Search },
    { 
      id: 'vanzupdate', 
      label: 'vanzupdate', 
      image: 'https://cdn.phototourl.com/free/2026-09-19-571b25e0-aa49-47c1-9fa7-8f7127a2a4cd.png' 
    },
    { id: 'account', label: 'Akun', icon: AccountIcon },
  ];

  return (
    <nav 
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/[0.12] shadow-[0_-4px_24px_rgba(0,0,0,0.5)] pb-[max(env(safe-area-inset-bottom),8px)] pt-2 px-1 overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        isBottomBarsVisible 
          ? 'translate-y-0 pointer-events-auto' 
          : 'translate-y-full pointer-events-none'
      }`}
    >
      {/* Specular glass reflection layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.09] via-transparent to-transparent pointer-events-none" />

      <div className="flex items-center justify-around relative z-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'recommendations' && activeTab === 'radio');
          const isCenterSearch = tab.id === 'search';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-1.5 sm:px-2 rounded-xl transition-all relative ${
                isActive ? 'text-[var(--theme-accent)]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.image ? (
                <div className={`w-5 h-5 rounded-full overflow-hidden transition-transform ring-1 ${
                  isActive 
                    ? 'ring-[var(--theme-accent)] scale-110 shadow-sm shadow-[var(--theme-glow)]' 
                    : 'ring-white/20 opacity-80'
                }`}>
                  <img 
                    src={tab.image} 
                    alt={tab.label} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : isCenterSearch ? (
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[var(--theme-accent)] text-white shadow-lg shadow-[var(--theme-glow)]' 
                    : 'bg-white/10 text-neutral-200 border border-white/10'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              )}
              <span className={`text-[10px] tracking-tight whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

