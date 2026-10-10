import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Search } from 'lucide-react';
import { HomeIcon, AccountIcon } from './icons/CustomIcons';
import { ViewTab } from '../types';

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, isBottomBarsVisible } = usePlayer();

  const tabs: { id: ViewTab; label: string; icon?: any; image?: string }[] = [
    { id: 'listen_now', label: 'Beranda', icon: HomeIcon },
    { id: 'search', label: 'Cari', icon: Search },
    { id: 'account', label: 'Akun', icon: AccountIcon },
  ];

  return (
    <nav 
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-transparent backdrop-blur-xl border-t border-white/[0.08] pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 px-2 overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        isBottomBarsVisible 
          ? 'translate-y-0 pointer-events-auto' 
          : 'translate-y-full pointer-events-none'
      }`}
    >
      {/* Subtle transparent glass reflection layer */}
      <div className="absolute inset-0 bg-transparent pointer-events-none" />

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
                isCenterSearch
                  ? isActive
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-white'
                  : isActive
                    ? 'text-[var(--theme-accent)]'
                    : 'text-neutral-400 hover:text-white'
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
                <div className={`transition-all ${
                  isActive 
                    ? 'text-white scale-110' 
                    : 'text-neutral-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              )}
              <span className={`text-[10px] leading-tight tracking-tight whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

