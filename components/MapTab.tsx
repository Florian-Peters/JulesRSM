import React, { useEffect, useRef, useState } from 'react';
import { User, PinItem } from '../types';
import { databaseService } from '../services/databaseService';

// Available Pins for the Shop
const PIN_ITEMS: PinItem[] = [
  { id: 'default', name: 'Basic', price: 0, borderColor: '#3f3f46', glowColor: 'transparent', description: 'Clean and simple.' },
  { id: 'neon_pink', name: 'Neon Pink', price: 500, borderColor: '#ec4899', glowColor: '#ec4899', description: 'Glow like a rave.' },
  { id: 'golden', name: 'Golden VIP', price: 2000, borderColor: '#eab308', glowColor: '#fbbf24', description: 'For the real ballers.' },
  { id: 'coachella', name: 'Festival Vibes', price: 1500, borderColor: '#14b8a6', glowColor: '#2dd4bf', description: 'Limited Edition 2025', limitedEdition: true },
  { id: 'cyber', name: 'Cyberpunk', price: 800, borderColor: '#8b5cf6', glowColor: '#a78bfa', description: 'Glitch in the matrix.' },
];

interface MapTabProps {
  currentUser: User | null;
  onUpdateUser: () => void;
}

export default function MapTab({ currentUser, onUpdateUser }: MapTabProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [liveUsers, setLiveUsers] = useState<User[]>([]);
  // Default to false (Live) if undefined, unless explicitly set to true in DB
  const [isGhostMode, setIsGhostMode] = useState(currentUser?.isGhostMode ?? false);
  const [showShop, setShowShop] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  // Track if we have already centered the map on the user once
  const hasCenteredMapRef = useRef(false);
  // Last DB update time to throttle writes
  const lastDbUpdateRef = useRef<number>(0);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Check if L is available
    if (typeof (window as any).L === 'undefined') {
       console.error("Leaflet not loaded");
       return;
    }
    const L = (window as any).L;

    // ResizeObserver for layout shifts
    const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
            mapRef.current.invalidateSize();
        }
    });
    resizeObserver.observe(mapContainerRef.current);

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([51.505, -0.09], 13); // Default view until geo kicks in

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 2. Geolocation Handler (Runs when Ghost Mode changes)
  useEffect(() => {
    if (isGhostMode) {
      setUserLocation(null);
      return;
    }

    if (!('geolocation' in navigator)) {
      console.error("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        
        // Update DB throttled (every 5 seconds max)
        const now = Date.now();
        if (now - lastDbUpdateRef.current > 5000) {
           lastDbUpdateRef.current = now;
           setIsBroadcasting(true);
           databaseService.updateLocation(latitude, longitude)
             .then(() => {
                 setTimeout(() => setIsBroadcasting(false), 1000);
             })
             .catch(console.warn);
        }

        // Fly to user initially
        if (mapRef.current && !hasCenteredMapRef.current) {
           mapRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 1.5 });
           hasCenteredMapRef.current = true;
        }
      },
      (err) => {
        console.warn("Geo Watch Error:", err.code, err.message);
        if (err.code === 1) { // Permission Denied
            setIsGhostMode(true);
            databaseService.toggleGhostMode(true);
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isGhostMode]);

  // 3. Polling Other Users (Runs independently)
  useEffect(() => {
    const fetchOthers = async () => {
      try {
        const users = await databaseService.getLiveUsers();
        setLiveUsers(users);
      } catch (e) {
        console.error("Error fetching live users", e);
      }
    };
    
    fetchOthers();
    const interval = setInterval(fetchOthers, 5000); // More frequent polling (5s)
    return () => clearInterval(interval);
  }, []);

  // 4. Marker Rendering (Runs whenever data/state changes)
  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;

    // Prepare list of users to render
    const usersToRender: { user: User; isSelf: boolean }[] = [];

    // Add Self if Live and Location available
    if (!isGhostMode && userLocation && currentUser) {
        usersToRender.push({
            user: { 
                ...currentUser, 
                locationLat: userLocation[0], 
                locationLng: userLocation[1] 
            },
            isSelf: true
        });
    }

    // Add Others
    liveUsers.forEach(u => {
        // Avoid duplicating self if backend returns it
        if (currentUser && u.id === currentUser.id) return;
        usersToRender.push({ user: u, isSelf: false });
    });

    const activeIds = new Set<string>();

    usersToRender.forEach(({ user, isSelf }) => {
        if (!user.locationLat || !user.locationLng) return;
        activeIds.add(user.id);

        const pinStyle = PIN_ITEMS.find(p => p.id === user.currentPinStyle) || PIN_ITEMS[0];
        const borderColor = pinStyle.borderColor;
        const glowColor = pinStyle.glowColor;

        const iconHtml = `
          <div class="relative w-12 h-12 transition-transform duration-500">
             <div class="absolute inset-0 rounded-full border-2 bg-black overflow-hidden" style="border-color: ${borderColor}; box-shadow: 0 0 15px ${glowColor};">
                <img src="${user.avatar}" class="w-full h-full object-cover" />
             </div>
             ${isSelf ? `<div class="pulse-ring" style="border: 2px solid ${borderColor}"></div>` : ''}
             <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 whitespace-nowrap shadow-lg">
                <span class="text-[9px] font-black text-white uppercase tracking-widest">${user.username}</span>
             </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-pin-icon',
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        if (markersRef.current[user.id]) {
            // Update existing marker
            const marker = markersRef.current[user.id];
            marker.setLatLng([user.locationLat, user.locationLng]);
            marker.setIcon(customIcon);
            marker.setZIndexOffset(isSelf ? 1000 : 0); // Always put self on top
        } else {
            // Create new marker
            const marker = L.marker([user.locationLat, user.locationLng], { 
                icon: customIcon,
                zIndexOffset: isSelf ? 1000 : 0 
            }).addTo(mapRef.current);
            markersRef.current[user.id] = marker;
        }
    });

    // Cleanup removed markers
    Object.keys(markersRef.current).forEach(id => {
        if (!activeIds.has(id)) {
            mapRef.current.removeLayer(markersRef.current[id]);
            delete markersRef.current[id];
        }
    });

  }, [liveUsers, userLocation, isGhostMode, currentUser]);

  const handleGhostToggle = async () => {
    const newState = !isGhostMode;
    setIsGhostMode(newState);
    if (!newState) {
       // Reset center ref to fly to user again when location comes back
       hasCenteredMapRef.current = false;
    }
    await databaseService.toggleGhostMode(newState);
    onUpdateUser();
  };

  const handleBuyOrEquip = async (pin: PinItem) => {
    if (!currentUser) return;
    setPurchasingId(pin.id);
    try {
       await databaseService.buyPin(pin.id, pin.price);
       onUpdateUser();
    } catch (err: any) {
       alert(err.message);
    } finally {
       setPurchasingId(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-zinc-900">
      {/* Map Container */}
      <div ref={mapContainerRef} id="map" className="absolute inset-0 w-full h-full z-0" style={{ minHeight: '100%', minWidth: '100%' }} />

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto bg-black/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
           {/* Status Indicator with broadcasting animation */}
           <div className="relative">
             <div className={`w-2.5 h-2.5 rounded-full ${isGhostMode ? 'bg-zinc-500' : 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]'}`} />
             {isBroadcasting && !isGhostMode && (
               <div className="absolute inset-0 w-full h-full rounded-full bg-green-400 animate-ping opacity-75" />
             )}
           </div>
           
           <div className="flex flex-col">
              <div className="flex items-center gap-2">
                 <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Status</span>
                 {isBroadcasting && !isGhostMode && (
                    <span className="text-[8px] font-black text-green-400 uppercase tracking-widest animate-pulse">• Sending</span>
                 )}
              </div>
              <span className={`text-xs font-black uppercase ${isGhostMode ? 'text-zinc-400' : 'text-green-400'}`}>
                 {isGhostMode ? 'Ghost Mode' : 'Live'}
              </span>
           </div>
           <button 
             onClick={handleGhostToggle}
             className={`ml-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${isGhostMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30'}`}
           >
             {isGhostMode ? 'GO LIVE' : 'HIDE'}
           </button>
        </div>

        <button 
           onClick={() => setShowShop(true)}
           className="pointer-events-auto p-3 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full shadow-lg shadow-orange-900/20 active:scale-95 transition-transform border-2 border-white/10"
        >
           <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </button>
      </div>

      {/* Locating Indicator */}
      {!isGhostMode && !userLocation && (
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] pointer-events-none flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">Locating...</span>
         </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute bottom-24 left-4 z-[500] pointer-events-none">
         <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 space-y-1 shadow-xl">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Active Nearby</p>
            <p className="text-2xl font-black text-white italic">{liveUsers.length}</p>
         </div>
      </div>

      {/* Shop Modal */}
      {showShop && (
         <div className="absolute inset-0 z-[1000] bg-black/90 backdrop-blur-xl animate-in slide-in-from-bottom duration-300 flex flex-col pt-[env(safe-area-inset-top)]">
            <div className="px-6 py-4 flex justify-between items-center border-b border-white/10">
               <h2 className="text-xl font-black italic uppercase tracking-tighter">Pin Shop</h2>
               <button onClick={() => setShowShop(false)} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="px-6 py-4 bg-zinc-900/50 flex justify-between items-center">
               <span className="text-xs font-bold text-zinc-400">Your Balance</span>
               <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white">{currentUser?.rsm}</span>
                  <span className="text-xs font-black text-[#f97316]">RSM</span>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 no-scrollbar">
               {PIN_ITEMS.map(pin => {
                  const isOwned = currentUser?.unlockedPins?.includes(pin.id);
                  const isEquipped = currentUser?.currentPinStyle === pin.id;

                  return (
                     <div key={pin.id} className={`bg-zinc-900 border rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden transition-all ${isEquipped ? 'border-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.2)] scale-[1.02]' : 'border-white/5'}`}>
                        {pin.limitedEdition && (
                           <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-yellow-500/30">Limited</div>
                        )}
                        
                        {/* Preview */}
                        <div className="relative w-16 h-16 mt-2">
                           <div className="absolute inset-0 rounded-full border-4 bg-black" style={{ borderColor: pin.borderColor, boxShadow: `0 0 20px ${pin.glowColor}` }}>
                              <img src={currentUser?.avatar} className="w-full h-full rounded-full object-cover p-0.5 opacity-80" alt="" />
                           </div>
                        </div>

                        <div className="text-center">
                           <h3 className="text-sm font-bold text-white">{pin.name}</h3>
                           <p className="text-[10px] text-zinc-500 leading-tight mt-1">{pin.description}</p>
                        </div>

                        <button
                           onClick={() => handleBuyOrEquip(pin)}
                           disabled={purchasingId !== null || (!isOwned && (currentUser?.rsm || 0) < pin.price)}
                           className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest mt-auto transition-all ${
                              isEquipped 
                                 ? 'bg-zinc-800 text-zinc-500 cursor-default' 
                                 : isOwned 
                                    ? 'bg-white text-black hover:bg-zinc-200 shadow-lg' 
                                    : 'bg-rose-600 text-white shadow-lg shadow-rose-900/20 hover:bg-rose-500'
                           }`}
                        >
                           {isEquipped ? 'Equipped' : isOwned ? 'Equip' : purchasingId === pin.id ? 'Buying...' : `Buy ${pin.price} RSM`}
                        </button>
                     </div>
                  );
               })}
            </div>
         </div>
      )}
    </div>
  );
}