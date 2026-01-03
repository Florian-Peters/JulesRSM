import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';

interface AICreateProps {
  onClose: () => void;
  onPost: (caption: string, mediaUrl: string, mediaType: 'image' | 'video', mediaBlob: Blob) => Promise<void>;
  onGoLive?: () => void;
  initialMedia?: { url: string; blob: Blob; type: 'image' | 'video' } | null;
}

const AICreate: React.FC<AICreateProps> = ({ onClose, onPost, onGoLive, initialMedia }) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'ai'>('camera');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(initialMedia?.url || null);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(initialMedia?.blob || null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(initialMedia?.type || 'image');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pressStartTimeRef = useRef<number>(0);

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
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: true
      });

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        try {
          await videoPreviewRef.current.play();
          setIsCameraActive(true);
        } catch (playErr) {
          console.error("Manual video play failed:", playErr);
          setIsCameraActive(true);
        }
      }
    } catch (err: any) {
      console.error("Camera Init Error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Kamera- oder Mikrofon-Zugriff wurde verweigert.');
      } else {
        setPermissionError('Kamera konnte nicht gestartet werden.');
      }
      setIsCameraActive(false);
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

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const { base64, mimeType } = await geminiService.generateImage(aiPrompt);
      const res = await fetch(`data:${mimeType};base64,${base64}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setMediaBlob(blob);
      setMediaUrl(url);
      setMediaType('image');
      setCaption(aiPrompt); // Set prompt as default caption
    } catch (err: any) {
      alert("KI Generierung fehlgeschlagen: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostAction = async () => {
    if (!mediaBlob) return;
    setIsUploading(true);
    try {
      await onPost(caption, mediaUrl || '', mediaType, mediaBlob);
      setUploadSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      alert("Fehler beim Posten: " + err.message);
      setIsUploading(false);
    }
  };

  const handleRemix = async () => {
    if (!caption.trim()) return;
    setIsRemixing(true);
    try {
      const remixed = await geminiService.remixCaption(caption);
      if (remixed) setCaption(remixed);
    } catch (err: any) {
      setIsRemixing(false);
    } finally {
      setIsRemixing(false);
    }
  };

  const captureImage = () => {
    if (!videoPreviewRef.current) return;
    const video = videoPreviewRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setMediaBlob(blob);
          setMediaUrl(URL.createObjectURL(blob));
          setMediaType('image');
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

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
    if (!videoPreviewRef.current?.srcObject) return;
    const stream = videoPreviewRef.current.srcObject as MediaStream;
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        // Ignoriere Video wenn es nur ein Tap war (wird von handlePressEnd behandelt)
        if (Date.now() - pressStartTimeRef.current < 300) {
           return;
        }
        
        const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
        setMediaBlob(blob);
        setMediaUrl(URL.createObjectURL(blob));
        setMediaType('video');
        stopCamera();
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setMediaBlob(file);

    // Simple mime type check
    if (file.type.startsWith('video/')) {
       setMediaType('video');
    } else {
       setMediaType('image');
    }
    stopCamera();
  };

  if (mediaUrl) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col pt-[env(safe-area-inset-top)]">
        <div className="flex-1 relative overflow-hidden bg-zinc-900 flex items-center justify-center">
          {mediaType === 'video' ? <video src={mediaUrl} controls autoPlay loop playsInline className="w-full h-full object-contain bg-black" /> : <img src={mediaUrl} className="w-full h-full object-cover" alt="" />}
          <button onClick={() => setMediaUrl(null)} className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>
        <div className="bg-black p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-6">
          <div className="relative">
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Füge eine Caption hinzu..." className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-rose-500/30 outline-none resize-none font-bold text-sm" rows={2} />
            <button onClick={handleRemix} disabled={isRemixing || !caption.trim()} className="absolute bottom-3 right-3 p-2 bg-rose-500/20 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-500/30">
              {isRemixing ? 'Thinking...' : 'AI Remix'}
            </button>
          </div>
          <button onClick={handlePostAction} disabled={isUploading || uploadSuccess || !mediaBlob} className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.4em] ${uploadSuccess ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'} text-white`}>
            {isUploading ? 'Wird hochgeladen...' : uploadSuccess ? 'Erfolgreich!' : !mediaBlob ? 'Verarbeite...' : 'Jetzt Posten'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-bottom duration-300">
      <div className="flex-1 relative overflow-hidden bg-zinc-950 rounded-b-[3rem] shadow-2xl">
        {activeMode === 'camera' ? (
          <>
            <video ref={videoPreviewRef} autoPlay playsInline muted className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8">
              <button
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                  className={`relative w-24 h-24 rounded-full border-4 border-white flex items-center justify-center transition-all ${isRecording ? 'scale-125' : ''}`}>
                <div className={`rounded-full transition-all ${isRecording ? 'w-10 h-10 bg-red-600 rounded-lg' : 'w-18 h-18 bg-white/20'}`} />
                {isRecording && <div className="absolute -top-16 bg-red-600 px-4 py-1.5 rounded-full animate-pulse text-white text-[10px] font-black uppercase">Recording {recordingTime}s</div>}
              </button>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 italic">Tap for photo • Hold for video</p>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-10 space-y-8">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)]">
               <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
            </div>
            <div className="w-full space-y-4">
              <h3 className="text-center text-xl font-black italic uppercase tracking-tighter">Nano Banana AI</h3>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Was soll die KI für dich erschaffen?"
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-yellow-500/50 outline-none min-h-[120px]"
              />
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full py-5 bg-yellow-500 text-black font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-yellow-500/10 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isGenerating ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'BILD GENERIEREN'}
              </button>
            </div>
          </div>
        )}

        <div className="absolute top-6 left-6 right-6 flex justify-between">
          <button onClick={onClose} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          <div className="flex gap-4">
             <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
             {activeMode === 'camera' && <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>}
          </div>
        </div>
        <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*"
            />
      </div>

      <div className="h-32 bg-black flex items-center justify-around px-10 pb-[env(safe-area-inset-bottom)]">
        <button onClick={() => setActiveMode('camera')} className={`text-[11px] font-black uppercase tracking-widest ${activeMode === 'camera' ? 'text-white border-b-2 border-rose-500' : 'text-zinc-600'}`}>Kamera</button>
        <button onClick={() => setActiveMode('ai')} className={`text-[11px] font-black uppercase tracking-widest ${activeMode === 'ai' ? 'text-white border-b-2 border-yellow-500' : 'text-zinc-600'}`}>AI Gen</button>
        <button onClick={onGoLive} className="text-[11px] font-black uppercase tracking-widest text-zinc-600">Live</button>
      </div>
    </div>
  );
};

export default AICreate;
