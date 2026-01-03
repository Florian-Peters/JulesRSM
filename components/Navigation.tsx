
import React from 'react';

interface NavigationProps {
  activeTab: 'home' | 'map' | 'create' | 'leaderboard' | 'profile';
  setActiveTab: (tab: any) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { id: 'create', icon: 'M12 4v16m8-8H4' },
    { id: 'leaderboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-black/80 backdrop-blur-3xl border-t border-white/5 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-[400] flex justify-between items-center shadow-[0_-15px_50px_rgba(0,0,0,0.9)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCreate = tab.id === 'create';

        if (isCreate) {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative -top-8 w-18 h-18 bg-gradient-to-br from-[#8b5cf6] via-[#ec4899] to-[#f97316] rounded-full flex items-center justify-center text-white shadow-[0_12px_30px_rgba(236,72,153,0.4)] border-4 border-black active:scale-90 transition-all z-50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
              <svg className="w-9 h-9 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={tab.icon} />
              </svg>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-[1.5rem] transition-all relative group ${isActive ? 'text-[#ec4899] bg-[#ec4899]/10 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : 'text-zinc-600 hover:text-zinc-200'}`}
          >
            <svg className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {isActive && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-r from-[#ec4899] to-[#f97316] rounded-full shadow-[0_0_12px_rgba(236,72,153,1)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
