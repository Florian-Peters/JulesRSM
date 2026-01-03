
import React, { useEffect, useState } from 'react';
import { adService } from '../services/adService';

declare global {
  interface Window {
    adsbygoogle: any[];
    Capacitor?: any; // Capacitor detection
  }
}

interface GoogleAdProps {
  slotId: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  layout?: string;
  demo?: boolean;
}

const GoogleAd: React.FC<GoogleAdProps> = ({ slotId, format = 'auto', layout, demo = false }) => {
  const [adError, setAdError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNativeApp, setIsNativeApp] = useState(false);
  
  // Fetch a random mock ad for demo mode
  const mockAd = demo ? adService.getFeedAd() : null;
  const PUBLISHER_ID = "ca-pub-4505392306905918"; 

  useEffect(() => {
    // 1. Check if we are running as a Native App (APK/IPA via Capacitor)
    const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();
    setIsNativeApp(!!isNative);

    // 2. If Web (and not demo), initialize AdSense
    if (!demo && !isNative) {
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = window.adsbygoogle || [];
          adsbygoogle.push({});
          
          const timer = setTimeout(() => {
            setIsLoading(false);
          }, 3000);
          return () => clearTimeout(timer);
        }
      } catch (e) {
        console.warn("AdSense push failed:", e);
        setAdError(true);
      }
    }
  }, [demo]);

  // --- DEMO MODE (Design Test) ---
  if (demo && mockAd) {
    return (
      <div className="relative w-full aspect-[3/4] mb-4 bg-zinc-950 rounded-[2.5rem] shadow-2xl border border-yellow-500/30 overflow-hidden flex flex-col group">
        <div className="absolute inset-0 z-0">
           <img src={mockAd.imageUrl} className="w-full h-full object-cover opacity-80" alt="Demo Ad" />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start">
          <div className="flex items-center gap-3">
             <img src={mockAd.userAvatar} className="w-10 h-10 rounded-full border-2 border-yellow-500 shadow-lg" alt="" />
             <div className="flex flex-col">
                <span className="font-bold text-sm text-white drop-shadow-md flex items-center gap-1">
                   {mockAd.adBrandName}
                </span>
                <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-wider opacity-90">Gesponsert</span>
             </div>
          </div>
          <div className="bg-yellow-500 text-black px-2 py-1 rounded-md shadow-lg">
             <span className="text-[8px] font-black uppercase tracking-widest">Anzeige</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 pt-0">
           <button className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <span>{mockAd.adCtaText || "Mehr ansehen"}</span>
           </button>
        </div>
      </div>
    );
  }

  // --- NATIVE APP MODE (APK) ---
  // In an APK, we do NOT render the AdSense script. 
  // Instead, we render a container. The AdMob Plugin (Capacitor) will overlay the native view here.
  if (isNativeApp) {
    return (
      <div 
        id={`admob-slot-${slotId}`} 
        className="w-full aspect-[3/4] mb-4 bg-zinc-900/50 rounded-[2.5rem] border border-white/5 flex items-center justify-center relative overflow-hidden"
      >
        <div className="text-center opacity-30">
           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">AdMob Native Ad Area</p>
           <p className="text-[9px] text-zinc-600 mt-1">(Only visible in compiled APK)</p>
        </div>
      </div>
    );
  }

  // --- WEB APP MODE (ADSENSE) ---
  if (adError) return null;

  return (
    <div className="relative w-full aspect-[3/4] mb-4 bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden flex flex-col group">
      {/* Header (Native Look for Google Ad) */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center shadow-lg">
              <span className="text-[10px] font-black text-zinc-500">AD</span>
           </div>
           <div className="flex flex-col">
              <span className="font-bold text-sm text-white drop-shadow-md">Empfehlung</span>
              <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-wider opacity-80">Gesponsert</span>
           </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
           <span className="text-[8px] text-zinc-300 font-black uppercase tracking-widest">Anzeige</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-zinc-900 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 z-0 pointer-events-none">
             <div className="w-12 h-12 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Lade Web Anzeige...</p>
          </div>
        )}
        <div className="absolute inset-0 bg-zinc-800/50 z-0"></div>
        <div className="relative z-10 w-full h-full flex items-center justify-center">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', height: '100%', minHeight: '250px' }}
              data-ad-client={PUBLISHER_ID}
              data-ad-slot={slotId}
              data-ad-format={format}
              data-full-width-responsive="true"
              {...(layout ? { 'data-ad-layout': layout } : {})}
            />
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
         <div className="w-full py-4 bg-zinc-800 text-zinc-500 font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 shadow-lg opacity-50">
            <span>Gesponsert</span>
         </div>
      </div>
    </div>
  );
};

export default GoogleAd;
