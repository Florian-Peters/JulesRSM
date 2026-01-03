
import React from 'react';
import { Challenge } from '../types';

interface ChallengeBarProps {
  challenges: Challenge[];
  onStartNew: () => void;
  onBoost: (challengeId: string) => void;
  currentFilter: Challenge['type'] | 'ALL';
  onFilterChange: (filter: Challenge['type'] | 'ALL') => void;
  currentSort: 'REWARD' | 'EXPIRY';
  onSortChange: (sort: 'REWARD' | 'EXPIRY') => void;
  currentUserUsername?: string;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onSubmitProof?: (id: string) => void;
}

const ChallengeBar: React.FC<ChallengeBarProps> = ({ 
  challenges, 
  onStartNew, 
  onBoost,
  currentFilter,
  onFilterChange,
  currentSort,
  onSortChange,
  currentUserUsername,
  onAccept,
  onDecline,
  onSubmitProof
}) => {
  const filterOptions: (Challenge['type'] | 'ALL')[] = ['ALL', 'AI', 'MUSIC', 'REAL', 'USER'];

  return (
    <div className="py-6 space-y-5">
      <div className="px-6 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">Live Quests</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Earn RSM & Glory</p>
          </div>
          
          {/* Sorting Controls */}
          <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
            <button 
              onClick={() => onSortChange('REWARD')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentSort === 'REWARD' 
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>Reward</span>
              <svg className={`w-3 h-3 ${currentSort === 'REWARD' ? 'text-[#f97316]' : 'opacity-50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button 
              onClick={() => onSortChange('EXPIRY')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentSort === 'EXPIRY' 
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>Time</span>
              <svg className={`w-3 h-3 ${currentSort === 'EXPIRY' ? 'text-rose-500' : 'opacity-50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filterOptions.map(filter => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                currentFilter === filter 
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                  : 'bg-zinc-900/50 text-zinc-500 border-white/5 hover:border-white/20 hover:text-zinc-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar pl-6 pb-4">
        <div className="flex gap-4 w-max pr-6">
          <button 
            onClick={onStartNew}
            className="w-36 h-48 rounded-[2rem] bg-zinc-900 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-3 shrink-0 hover:bg-zinc-800 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8b5cf6] via-[#ec4899] to-[#f97316] p-[2px] group-hover:scale-110 transition-transform">
               <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
               </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">New Quest</span>
          </button>

          {challenges.map((challenge) => {
            const isTarget = challenge.targetUsername && currentUserUsername && challenge.targetUsername === currentUserUsername;
            const isAccepted = challenge.status === 'ACCEPTED';
            const isExpired = challenge.status === 'EXPIRED';

            return (
              <div 
                key={challenge.id}
                className="w-72 h-48 rounded-[2rem] bg-zinc-900 border border-white/5 p-5 flex flex-col justify-between shrink-0 relative overflow-hidden group transition-transform"
                onClick={() => onBoost(challenge.id)}
              >
                {/* Background Gradient based on State */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${
                   isAccepted ? 'from-green-500/10 to-transparent' : 
                   isTarget && challenge.status === 'OPEN' ? 'from-orange-500/10 to-transparent' : 
                   'from-white/5 to-transparent'
                }`} />
                
                <div className="relative z-10 pointer-events-none">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                      challenge.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' :
                      challenge.type === 'AI' ? 'bg-purple-500/20 text-purple-400' :
                      challenge.type === 'MUSIC' ? 'bg-blue-500/20 text-blue-400' :
                      challenge.type === 'USER' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {challenge.status === 'ACCEPTED' ? 'ACTIVE' : challenge.type}
                    </span>
                    <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                      <span className="text-[10px] font-black text-white">{challenge.reward}</span>
                      <span className="text-[8px] font-black text-[#f97316]">RSM</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1 text-white line-clamp-1">{challenge.title}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{challenge.description}</p>
                </div>

                <div className="relative z-10 mt-auto pointer-events-auto">
                   {isTarget && challenge.status === 'OPEN' ? (
                     <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onAccept?.(challenge.id); }}
                          className="flex-1 bg-white text-black text-[10px] font-black uppercase py-2 rounded-xl shadow-lg hover:scale-105 transition-transform"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDecline?.(challenge.id); }}
                          className="px-4 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase py-2 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-colors"
                        >
                          Decline
                        </button>
                     </div>
                   ) : isAccepted ? (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onSubmitProof?.(challenge.id); }}
                        className="w-full bg-green-500 text-black text-[10px] font-black uppercase py-2 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:scale-105 transition-transform flex items-center justify-center gap-2"
                     >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Submit Proof
                     </button>
                   ) : (
                    <div className="flex justify-between items-end">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(3, Math.ceil(challenge.participants / 100) + 1))].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border border-black bg-zinc-800" />
                        ))}
                        {challenge.participants > 0 && (
                          <div className="w-6 h-6 rounded-full border border-black bg-zinc-800 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-zinc-400">+{challenge.participants}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                          {challenge.expiresIn}
                        </span>
                      </div>
                    </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChallengeBar;
