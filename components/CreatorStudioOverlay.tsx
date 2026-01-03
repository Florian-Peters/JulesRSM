
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface CreatorStudioOverlayProps {
  user: User;
  onClose: () => void;
}

const CreatorStudioOverlay: React.FC<CreatorStudioOverlayProps> = ({ user, onClose }) => {
  const [isConnected, setIsConnected] = useState(user.isCreator || false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [animateChart, setAnimateChart] = useState(false);

  // Mock Data for chart (Last 7 days)
  const weeklyData = [45, 62, 58, 81, 75, 95, 120]; 
  const maxVal = Math.max(...weeklyData);

  useEffect(() => {
    setTimeout(() => setAnimateChart(true), 300);
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate API connection delay
    setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-md pt-[calc(1rem+env(safe-area-inset-top))] sticky top-0 z-20">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h2 className="text-lg font-black uppercase tracking-tighter text-white leading-none">Creator Studio</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Monetization</p>
                </div>
             </div>
             <button onClick={onClose} className="p-3 bg-zinc-900 rounded-full border border-white/10 text-white hover:bg-zinc-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">Estimated Revenue</p>
                        {isConnected && (
                             <div className="px-2 py-1 bg-green-500/20 rounded-md border border-green-500/30">
                                <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Active</span>
                             </div>
                        )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-5xl font-[900] text-white tracking-tight drop-shadow-lg">
                            ${isConnected ? (user.earnings || 1240.50).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                        </span>
                        <span className="text-zinc-500 font-bold">USD</span>
                    </div>

                    {isConnected ? (
                        <div className="flex gap-4">
                             <div className="px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                +12.5% this week
                             </div>
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-500 italic">Connect your AdSense account to see your earnings.</p>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 rounded-[2rem] p-6 border border-white/5 flex flex-col justify-between h-32">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-white">{isConnected ? (user.adImpressions ? (user.adImpressions / 1000).toFixed(1) + 'K' : '45.2K') : '-'}</p>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Ad Impressions</p>
                    </div>
                </div>
                <div className="bg-zinc-900 rounded-[2rem] p-6 border border-white/5 flex flex-col justify-between h-32">
                     <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-white">{isConnected ? `$${user.rpm || '2.45'}` : '-'}</p>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">RPM (Avg)</p>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-zinc-900 rounded-[2.5rem] p-6 border border-white/5">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-black uppercase tracking-wide text-white">Performance</h3>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Last 7 Days</span>
                    </div>
                </div>
                <div className="flex items-end justify-between h-40 gap-3 px-2">
                    {weeklyData.map((val, i) => (
                        <div key={i} className="w-full flex flex-col justify-end group h-full cursor-pointer">
                             <div className="text-[9px] font-bold text-white text-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                ${isConnected ? (val * (user.rpm || 2.45) / 10).toFixed(0) : 0}
                             </div>
                             <div 
                                style={{ height: animateChart && isConnected ? `${(val / maxVal) * 100}%` : '5%' }} 
                                className={`w-full rounded-xl transition-all duration-[1500ms] ease-out ${isConnected ? 'bg-gradient-to-t from-green-600 to-green-400 opacity-80 hover:opacity-100' : 'bg-zinc-800'}`}
                             />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 px-2 text-[9px] font-bold text-zinc-600 uppercase">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
            </div>

            {/* AdSense Connect Section */}
            <div className="bg-zinc-900 rounded-[2.5rem] p-1 border border-white/5">
                {!isConnected ? (
                    <div className="bg-white rounded-[2.3rem] p-8 text-center">
                        <div className="w-20 h-20 bg-zinc-100 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg transform -rotate-3">
                           {/* Google AdSense Icon simulation */}
                           <div className="text-3xl font-bold text-zinc-600">
                             <span className="text-blue-500">G</span>
                             <span className="text-red-500">o</span>
                             <span className="text-yellow-500">o</span>
                             <span className="text-blue-500">g</span>
                             <span className="text-green-500">l</span>
                             <span className="text-red-500">e</span>
                           </div>
                        </div>
                        <h4 className="text-black text-xl font-black uppercase italic tracking-tighter mb-3">Monetize Your Vibe</h4>
                        <p className="text-xs text-zinc-500 font-medium mb-8 leading-relaxed max-w-xs mx-auto">
                            Link your Google AdSense account to start earning real money from your content, views, and engagement.
                        </p>
                        <button 
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full py-5 bg-black text-white font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                        >
                            {isConnecting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Connecting Securely...
                                </>
                            ) : (
                                <>
                                    Connect AdSense
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="p-6">
                         <h3 className="text-sm font-black uppercase tracking-wide text-white mb-4 pl-2">Configuration</h3>
                         <div className="space-y-3">
                             <div className="flex items-center justify-between p-5 bg-zinc-950 rounded-2xl border border-green-500/20 shadow-lg">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                        <span className="text-2xl font-bold text-zinc-700">A</span>
                                     </div>
                                     <div>
                                         <p className="text-sm font-black text-white">Google AdSense</p>
                                         <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                             Connected
                                         </p>
                                     </div>
                                 </div>
                                 <button className="text-zinc-500 hover:text-white">
                                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                 </button>
                             </div>
                             
                             <button className="w-full py-5 bg-zinc-800 text-zinc-300 font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-700 hover:text-white transition-colors text-xs flex items-center justify-center gap-2">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                 Withdraw Funds
                             </button>
                         </div>
                    </div>
                )}
            </div>
            
            <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest pb-4">
                Partner Program ID: PUB-{Math.floor(Math.random() * 100000000)}
            </p>
        </div>
    </div>
  );
};

export default CreatorStudioOverlay;
