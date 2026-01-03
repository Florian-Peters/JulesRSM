import React, { useState, useRef, useEffect } from 'react';

interface AICreateProps {
  onClose: () => void;
  onPost: (caption: string, mediaUrl: string, mediaType: 'image' | 'video', mediaBlob: Blob) => Promise<void>;
  onGoLive?: () => void;
  initialMedia?: { url: string; blob: Blob; type: 'image' | 'video' } | null;
}

const AICreate: React.FC<AICreateProps> = ({ onClose, onPost, onGoLive, initialMedia }) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'ai'>('camera');
  const [caption, setCaption] = useState('');
  
  // State für Medien
  const [mediaUrl, setMediaUrl] = useState<string | null>(initialMedia?.url || null);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(initialMedia?.blob || null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(initialMedia?.type || 'image');
  
  // Kamera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  // Kamera starten/stoppen wenn Modus wechselt
  useEffect(() => {
    if (!mediaUrl && activeMode === 'camera') {
      initCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [facingMode, mediaUrl, activeMode]);

  const initCamera = async () => {
    setPermissionError(null);
    setIsCameraActive(false);
    
    // Constraints für mobile Geräte optimiert
    const constraints: MediaStreamConstraints = {
      video: { 
        facingMode: facingMode,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
      }, 
      audio: true 
    };
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.setAttribute('playsinline', 'true');
        videoPreviewRef.current.muted = true;
        
        await videoPreviewRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera Init Error:", err);
      // Fallback Versuch
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = fallbackStream;
          await videoPreviewRef.current.play();
          setIsCameraActive(true);
        }
      } catch (e) {
        setPermissionError('Kamera konnte nicht gestartet werden. Bitte Berechtigungen in den Einstellungen prüfen.');
      }
    }
  };

  const stopCamera = () => {
    if (videoPreviewRef.current?.srcObject) {
      (videoPreviewRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoPreviewRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // --- HIER IST DER REPARIERTE TEIL FÜR DAS FOTO ---
  const captureImage = () => {
    if (!videoPreviewRef.current || !isCameraActive) return;
    const video = videoPreviewRef.current;

    // Sicherstellen, dass Video-Dimensionen da sind
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Spiegeln wenn Frontkamera
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        // Wir nutzen DataURL für die direkte Anzeige (verhindert schwarzes Bild)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        setMediaUrl(dataUrl); // Sofort anzeigen
        setMediaType('image');

        // Im Hintergrund zu Blob konvertieren für den Upload
        setMediaBlob(null); // Reset blob while processing
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => setMediaBlob(blob))
          .catch(err => console.error("Blob Fehler:", err));
        
        stopCamera();
      } catch (e) {
        console.error("Capture failed:", e);
        alert("Bildaufnahme fehlgeschlagen.");
      }
    }
  };
  // ----------------------------------------------------

  const handlePressStart = () => {
    pressStartTimeRef.current = Date.now();
    startRecording();
  };

  const handlePressEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const duration = Date.now() - pressStartTimeRef.current;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
       mediaRecorderRef.current.stop();
    }

    // If tap was short (< 300ms), treat as photo capture
    if (duration < 300) {
       captureImage();
    }
  };

  const startRecording = () => {
    if (!videoPreviewRef.current?.srcObject || !isCameraActive) return;
    const stream = videoPreviewRef.current.srcObject as MediaStream;
    
    // Codec Auswahl für Android
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = ''; // Browser entscheiden lassen

    try {
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        // Ignoriere Video wenn es nur ein Tap war (wird von handlePressEnd behandelt)
        if (Date.now() - pressStartTimeRef.current < 300) {
           return;
        }

        const finalType = chunksRef.current[0]?.type || 'video/mp4';
        const blob = new Blob(chunksRef.current, { type: finalType });
        
        setMediaBlob(blob);
        // Für Video nutzen wir ObjectURL, da DataURL zu groß wäre
        setMediaUrl(URL.createObjectURL(blob));
        setMediaType('video');
        stopCamera();
      };
      
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (e) {
      console.error("Recording failed:", e);
      alert("Videoaufnahme konnte nicht gestartet werden.");
    }
  };

  const handlePostAction = async () => {
    if (!mediaBlob) return;
    setIsUploading(true);
    try {
      if (mediaBlob.size === 0) throw new Error("Die Mediendatei ist leer.");
      
      // Post absenden
      await onPost(caption, mediaUrl || '', mediaType, mediaBlob);
      
      setUploadSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      console.error("Upload Error:", err);
      alert("Fehler beim Hochladen: " + (err.message || "Netzwerkfehler."));
      setIsUploading(false);
    }
  };

  // --- VORSCHAU ANSICHT ---
  if (mediaUrl) {
    return (
      <div className="fixed inset-0 bg-black z-[1000] flex flex-col pt-[env(safe-area-inset-top)]">
        <div className="flex-1 relative overflow-hidden bg-zinc-900 flex items-center justify-center">
          {mediaType === 'video' ? (
            <video src={mediaUrl} controls autoPlay loop playsInline className="w-full h-full object-contain bg-black" />
          ) : (
            <img src={mediaUrl} className="w-full h-full object-cover" alt="Captured" />
          )}
          
          {/* Zurück Button */}
          <button 
            onClick={() => {
              setMediaUrl(null);
              setMediaBlob(null);
              setIsUploading(false);
              setUploadSuccess(false);
            }} 
            className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>

        {/* Caption & Post Bereich */}
        <div className="bg-black p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-6">
          <textarea 
            value={caption} 
            onChange={(e) => setCaption(e.target.value)} 
            placeholder="Füge eine Caption hinzu..." 
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-[#adff00]/30 outline-none resize-none font-bold text-sm" 
            rows={2} 
          />
          <button 
            onClick={handlePostAction} 
            disabled={isUploading || uploadSuccess || !mediaBlob}
            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.4em] transition-all active:scale-95 ${uploadSuccess ? 'bg-green-500' : 'bg-[#adff00] text-black'} disabled:opacity-70`}
          >
            {isUploading ? 'Wird hochgeladen...' : uploadSuccess ? 'Erfolgreich!' : !mediaBlob ? 'Verarbeite...' : 'Jetzt Jammen'}
          </button>
        </div>
      </div>
    );
  }

  // --- KAMERA ANSICHT ---
  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom duration-300">
      <div className="flex-1 relative overflow-hidden bg-zinc-950 rounded-b-[3rem] shadow-2xl flex flex-col">
        {activeMode === 'camera' ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
               {permissionError ? (
                  <div className="text-center px-10 z-30">
                    <p className="text-zinc-500 text-[10px] font-bold mb-6 uppercase tracking-wider">{permissionError}</p>
                    <button onClick={initCamera} className="px-8 py-4 bg-[#adff00] text-black rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">Kamera aktivieren</button>
                  </div>
               ) : !isCameraActive && (
                  <div className="flex flex-col items-center gap-4 z-30">
                    <div className="w-10 h-10 border-2 border-[#adff00] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black text-[#adff00] uppercase tracking-widest animate-pulse">Wird gestartet...</span>
                  </div>
               )}
               <video 
                 ref={videoPreviewRef} 
                 autoPlay 
                 playsInline 
                 muted 
                 className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${isCameraActive ? 'opacity-100' : 'opacity-0'} transition-opacity`} 
               />
            </div>

            {isCameraActive && (
              <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8 z-30">
                <button 
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                  className={`relative w-24 h-24 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-90 ${isRecording ? 'scale-125' : ''}`}
                >
                  <div className={`rounded-full transition-all ${isRecording ? 'w-10 h-10 bg-red-600 rounded-lg' : 'w-18 h-18 bg-white/20'}`} />
                  {isRecording && <div className="absolute -top-16 bg-red-600 px-4 py-1.5 rounded-full animate-pulse text-white text-[10px] font-black uppercase">Aufnahme {recordingTime}s</div>}
                </button>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Tippen für Foto • Halten für Video</p>
              </div>
            )}
            
            <div className="absolute top-6 left-6 right-6 flex justify-between z-40">
              <button onClick={onClose} className="p-4 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} className="p-4 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Nano Banana <span className="text-[#adff00]">AI</span></h3>
                <button onClick={onClose} className="p-3 bg-zinc-900 rounded-full border border-white/10 text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest text-center mt-20 italic">AI Generation Coming Soon...</p>
          </div>
        )}
      </div>

      <div className="h-32 bg-black flex items-center justify-around px-10 pb-[env(safe-area-inset-bottom)] z-[1010]">
        <button onClick={() => setActiveMode('camera')} className={`text-[11px] font-black uppercase tracking-widest py-4 ${activeMode === 'camera' ? 'text-white border-b-2 border-[#adff00]' : 'text-zinc-600'}`}>Kamera</button>
        <button onClick={() => setActiveMode('ai')} className={`text-[11px] font-black uppercase tracking-widest py-4 ${activeMode === 'ai' ? 'text-white border-b-2 border-[#adff00]' : 'text-zinc-600'}`}>Nano Banana</button>
      </div>
    </div>
  );
};

export default AICreate;