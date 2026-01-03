
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface LiveStreamProps {
  onClose: () => void;
  onSaveRecording?: (blob: Blob) => void;
}

// Utils
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveStream: React.FC<LiveStreamProps> = ({ onClose, onSaveRecording }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [status, setStatus] = useState('Preparing...');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [transcriptions, setTranscriptions] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [shouldRecord, setShouldRecord] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initial Permission Request
  useEffect(() => {
    const initCamera = async () => {
      setPermissionError(null);
      setStatus('Requesting access...');
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(userStream);
        setHasPermission(true);
        setStatus('Camera Ready');
      } catch (err: any) {
        console.error("Camera Init Error:", err);
        setHasPermission(false);
        setPermissionError('Camera/Microphone access denied.');
        setStatus('Error');
      }
    };
    initCamera();
    return () => stopStream();
  }, []);

  // Bind stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("AutoPlay fail:", e));
    }
  }, [stream]);

  const startStream = async () => {
    if (!hasPermission || !stream) return;
    
    setIsStreaming(true);
    setStatus('AI Host Connecting...');

    // Start local recording if enabled
    if (shouldRecord) {
      try {
        const options = { mimeType: 'video/webm' };
        // Fallback for Safari/iOS which might prefer mp4 or specific types
        const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported('video/webm') ? options : undefined);
        recorderRef.current = recorder;
        recordedChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        
        recorder.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Failed to start recorder:", e);
      }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    try {
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: 'You are a trendy AI live host. Greet your user. React to their movements and speech. Be interactive, use verbalized emojis, and create a great vibe.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setStatus('LIVE');
            startAudioInput();
            startVideoStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscriptions(prev => [...prev.slice(-2), { role: 'user', text: message.serverContent!.inputTranscription!.text }]);
            }
            if (message.serverContent?.outputTranscription) {
              setTranscriptions(prev => [...prev.slice(-2), { role: 'ai', text: message.serverContent!.outputTranscription!.text }]);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              if (ctx.state === 'closed') return;
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
            }
          },
          onclose: () => {
             // Handle close manually via stopStream usually
          },
          onerror: (e) => {
            console.error('AI Error:', e);
            setStatus('AI Error');
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Session failed", err);
      setIsStreaming(false);
      setStatus('Connection Error');
    }
  };

  const startAudioInput = () => {
    if (!audioContextRef.current || !stream) return;
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        int16[i] = inputData[i] * 32768;
      }
      const pcmBase64 = encode(new Uint8Array(int16.buffer));
      sessionRef.current?.sendRealtimeInput({
        media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' }
      });
    };

    source.connect(processor);
    processor.connect(audioContextRef.current.destination);
  };

  const startVideoStreaming = () => {
    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !sessionRef.current || !isStreaming) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      canvasRef.current.width = 320;
      canvasRef.current.height = 240;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            sessionRef.current?.sendRealtimeInput({
              media: { data: base64, mimeType: 'image/jpeg' }
            });
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.5);
    }, 1500);
    return () => clearInterval(interval);
  };

  const stopStream = () => {
    // Stop recording first if active
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
       recorderRef.current.onstop = () => {
         if (onSaveRecording && recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
            onSaveRecording(blob);
         }
       };
       recorderRef.current.stop();
       setIsRecording(false);
    } else {
       // Just close if not recording
       setIsStreaming(false);
    }

    // Clean up connections
    sessionRef.current?.close();
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close().catch(() => {});
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Dedicated Close Handler
  const handleClose = () => {
      stopStream();
      onClose(); // Triggers unmount in Parent
  };

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col animate-in fade-in duration-300">
      {/* Background Video Layer */}
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000 ${hasPermission ? 'opacity-100' : 'opacity-0'}`} 
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay UI */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 flex flex-col p-6">
        
        {/* Header */}
        <div className="flex justify-between items-start pt-[env(safe-area-inset-top)]">
          <button 
            onClick={handleClose}
            className="p-3 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10 active:scale-90"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex flex-col gap-2 items-end">
            <div className="px-4 py-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/5 text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Live Status</p>
              <p className={`text-xs font-black uppercase italic ${isStreaming ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                {status}
              </p>
            </div>
            {isRecording && (
               <div className="px-3 py-1 bg-red-600 rounded-full flex items-center gap-2 animate-pulse">
                 <div className="w-2 h-2 bg-white rounded-full" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">REC</span>
               </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-end gap-6 mb-8">
          {!hasPermission && hasPermission !== null ? (
            <div className="bg-zinc-900/90 backdrop-blur-3xl p-10 rounded-[3rem] border border-rose-500/20 text-center max-w-sm mx-auto shadow-2xl">
              <h3 className="text-xl font-black uppercase italic mb-4">Camera Access</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-8">{permissionError || 'We need access to your camera and mic.'}</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >Open Settings</button>
            </div>
          ) : isStreaming ? (
            <div className="space-y-4 max-w-[85%]">
              {transcriptions.map((t, i) => (
                <div key={i} className={`animate-in slide-in-from-left duration-300 ${t.role === 'ai' ? 'ml-0' : 'ml-4'}`}>
                  <p className={`text-[8px] font-black uppercase mb-1 ${t.role === 'ai' ? 'text-rose-400' : 'text-zinc-500'}`}>
                    {t.role === 'ai' ? 'AI Co-Host' : 'You'}
                  </p>
                  <div className={`px-4 py-3 rounded-2xl text-sm font-bold backdrop-blur-md ${t.role === 'ai' ? 'bg-rose-600 text-white shadow-xl' : 'bg-black/60 text-zinc-300 border border-white/10'}`}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center animate-in zoom-in-95 duration-700 flex flex-col items-center gap-6">
               <p className="text-sm font-black uppercase tracking-[0.4em] text-white/60">Vibe Check Ready</p>
               
               {/* Record Toggle */}
               <div 
                 onClick={() => setShouldRecord(!shouldRecord)}
                 className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all cursor-pointer ${shouldRecord ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/10'}`}
               >
                 <div className={`w-4 h-4 rounded-full border-2 border-current flex items-center justify-center`}>
                    {shouldRecord && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest">Record & Post to Feed</span>
               </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pb-[env(safe-area-inset-bottom)]">
          {hasPermission && !isStreaming && (
            <button
              onClick={startStream}
              className="w-full py-7 bg-gradient-to-r from-rose-600 to-orange-600 rounded-[2.5rem] text-white font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(225,29,72,0.5)] active:scale-95 transition-all"
            >Start Vibe Check</button>
          )}
          {isStreaming && (
            <button
              onClick={stopStream}
              className="w-full py-7 bg-zinc-950/80 backdrop-blur-2xl rounded-[2.5rem] text-rose-500 font-black uppercase tracking-[0.4em] border border-white/5 active:scale-95 transition-all"
            >End Stream</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
