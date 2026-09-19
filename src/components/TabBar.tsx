import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Search, Home, Sparkles, User } from 'lucide-react';
import { ViewTab } from '../types';

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab } = usePlayer();

  const tabs: { id: ViewTab; label: string; icon: any }[] = [
    { id: 'search', label: 'Cari', icon: Search },
    { id: 'listen_now', label: 'Beranda', icon: Home },
    { id: 'recommendations', label: 'Rekomendasi', icon: Sparkles },
    { id: 'account', label: 'Akun', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e]/95 backdrop-blur-xl border-t border-white/10 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 px-3">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'recommendations' && activeTab === 'radio');
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-[#fa2d48]' : 'text-neutral-400'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
