
import React, { useState, useRef, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { adService } from '../services/adService';

interface WalletOverlayProps {
  balance: number;
  onClose: () => void;
  onUpdateBalance: () => void;
}

const WalletOverlay: React.FC<WalletOverlayProps> = ({ balance, onClose, onUpdateBalance }) => {
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [canClose, setCanClose] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    setAdProgress(0);
    setCanClose(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      if (duration > 0) {
        setAdProgress((currentTime / duration) * 100);
      }
    }
  };

  const handleVideoEnded = async () => {
    try {
      await databaseService.watchAdReward();
      onUpdateBalance();
      setAdProgress(100);
      setCanClose(true); // Allow closing after reward
    } catch (err) {
      alert("Failed to claim reward");
      setIsWatchingAd(false);
    }
  };

  const closeAd = () => {
    setIsWatchingAd(false);
    setAdProgress(0);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={!isWatchingAd ? onClose : undefined} />
      
      <div className="relative w-full max-w-sm bg-zinc-950 rounded-[2.5rem] border border-white/10 p-8 animate-in zoom-in-95 duration-300 text-center shadow-2xl overflow-hidden">
        {isWatchingAd ? (
           <div className="py-4 flex flex-col items-center gap-6">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <video 
                  ref={videoRef}
                  src={adService.getRewardedAdVideoUrl()}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                />
                <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
                  <div className="h-full bg-orange-500 transition-all duration-100 ease-linear" style={{ width: `${adProgress}%` }} />
                </div>
                {!canClose && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-white">
                    Reward in progress...
                  </div>
                )}
              </div>

              {canClose ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <h3 className="text-xl font-black uppercase italic text-white">Reward Earned!</h3>
                      <p className="text-zinc-400 text-xs">+50 RSM added to your wallet</p>
                   </div>
                   <button 
                     onClick={closeAd}
                     className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl"
                   >
                     Collect & Close
                   </button>
                </div>
              ) : (
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider animate-pulse">
                   Watching Ad for Reward...
                </div>
              )}
           </div>
        ) : (
          <>
            <div className="mb-8">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Total Balance</p>
               <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-[900] text-white tracking-tighter">{balance}</span>
                  <span className="text-lg font-black text-[#f97316]">RSM</span>
               </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleWatchAd}
                className="w-full py-5 bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 active:scale-95 transition-all group"
              >
                 <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>
                 </div>
                 <div className="text-left">
                    <span className="block text-[10px] font-black text-white/80 uppercase tracking-widest">Watch Ad</span>
                    <span className="block text-sm font-black text-white uppercase">+50 RSM Reward</span>
                 </div>
              </button>

              <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 opacity-60">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">More ways to earn coming soon...</p>
              </div>
            </div>

            <button onClick={onClose} className="mt-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Close Wallet</button>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletOverlay;
