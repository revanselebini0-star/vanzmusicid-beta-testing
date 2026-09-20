import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Search, ListMusic } from 'lucide-react';
import { HomeIcon, RecommendationIcon, AccountIcon } from './icons/CustomIcons';
import { ViewTab } from '../types';

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = usePlayer();

  const tabs: { id: ViewTab; label: string; icon: any }[] = [
    { id: 'listen_now', label: 'Beranda', icon: HomeIcon },
    { id: 'recommendations', label: 'Rekomendasi', icon: RecommendationIcon },
    { id: 'playlist', label: 'Playlist', icon: ListMusic },
    { id: 'search', label: 'Cari', icon: Search },
    { id: 'account', label: 'Akun', icon: AccountIcon },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e]/95 backdrop-blur-xl border-t border-white/10 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 px-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'recommendations' && activeTab === 'radio');
          const isCenterSearch = tab.id === 'search';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all relative ${
                isActive ? 'text-[var(--theme-accent)]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {isCenterSearch ? (
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-[var(--theme-accent)] text-white shadow-md shadow-[var(--theme-glow)]' 
                    : 'bg-white/5 text-neutral-300'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              )}
              <span className={`text-[10px] tracking-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

