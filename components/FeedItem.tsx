
import React, { useRef, useState, useEffect } from 'react';
import { Post } from '../types';

interface FeedItemProps {
  post: Post;
  currentUserId: string;
  onLike: (id: string) => void;
  onOpenComments: (post: Post) => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  onViewPost: (post: Post) => void;
}

const FeedItem: React.FC<FeedItemProps> = ({ post, currentUserId, onLike, onOpenComments, onEdit, onDelete, onViewPost }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showCaption, setShowCaption] = useState(true);
  const [manualPause, setManualPause] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  // Strikter Check auf Identität
  const isOwnPost = currentUserId && post.userId === currentUserId;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (post.mediaType === 'video' && videoRef.current) {
      if (isIntersecting && !manualPause && !hasEnded) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else if (!isIntersecting) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isIntersecting, manualPause, hasEnded, post.mediaType]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused || hasEnded) {
      videoRef.current.play();
      setIsPlaying(true);
      setManualPause(false);
      setHasEnded(false);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setManualPause(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    
    // If unmuting and volume is 0, reset to 1
    if (!newMuted && volume === 0) {
      setVolume(1);
      videoRef.current.volume = 1;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent play toggle
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);
  };

  const toggleCaption = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCaption(!showCaption);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };
  
  const handleVideoEnd = () => {
    setIsPlaying(false);
    setHasEnded(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    onDelete(post.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    onEdit(post);
  };

  const handleAdClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.adLink) window.open(post.adLink, '_blank');
  };

  return (
    <div className={`relative w-full aspect-[3/4] mb-4 group overflow-hidden bg-zinc-950 rounded-[2.5rem] shadow-2xl ${post.isAd ? 'border-2 border-yellow-500/30' : 'border border-white/5'}`}>
      
      {/* Ad Label Overlay */}
      {post.isAd && (
        <div className="absolute top-4 left-4 z-30">
           <div className="bg-yellow-500 text-black px-3 py-1 rounded-md font-black text-[10px] uppercase tracking-widest shadow-lg">
              Gesponsert
           </div>
        </div>
      )}

      {post.mediaType === 'video' ? (
        <div className="relative w-full h-full cursor-pointer" onClick={togglePlay}>
          <video
            ref={videoRef}
            src={post.imageUrl}
            className="w-full h-full object-cover"
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => { setIsPlaying(true); setHasEnded(false); }}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnd}
          />
          
          {/* Pause Icon Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${manualPause || hasEnded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-black/40 backdrop-blur-sm p-6 rounded-full border border-white/10">
              {hasEnded ? (
                <svg className="w-12 h-12 text-white fill-current" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
              ) : (
                <svg className="w-12 h-12 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </div>
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {/* Standard Post Actions */}
            {!post.isAd && isOwnPost && (
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-3 bg-rose-600/80 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-30">
                    <button onClick={handleEditClick} className="w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-zinc-100 hover:bg-white/10 flex items-center gap-3 transition-colors">Bearbeiten</button>
                    <button onClick={handleDeleteClick} className="w-full px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 flex items-center gap-3 transition-colors">Löschen</button>
                  </div>
                )}
              </div>
            )}
            
            {/* View Details Button (Disabled for Ads to force CTA) */}
            {!post.isAd && (
              <button 
                onClick={(e) => { e.stopPropagation(); onViewPost(post); }}
                className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </button>
            )}

            <button 
              onClick={toggleCaption}
              className={`p-3 backdrop-blur-md rounded-full border border-white/10 active:scale-90 transition-all shadow-lg ${showCaption ? 'bg-rose-600/60 text-white' : 'bg-black/40 text-zinc-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            </button>

            {/* Play/Pause Button */}
            <button 
              onClick={togglePlay}
              className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-all shadow-lg"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : hasEnded ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            {/* Volume Control */}
            <div 
              className="relative flex items-center justify-end"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
               {showVolumeSlider && (
                 <div className="absolute right-full mr-2 bg-black/60 backdrop-blur-md rounded-full p-2 border border-white/10 animate-in fade-in slide-in-from-right-2 h-10 flex items-center">
                   <input
                     type="range"
                     min="0"
                     max="1"
                     step="0.05"
                     value={isMuted ? 0 : volume}
                     onChange={handleVolumeChange}
                     onClick={(e) => e.stopPropagation()}
                     className="w-24 accent-rose-500 h-1 cursor-pointer"
                   />
                 </div>
               )}
               
               <button 
                onClick={toggleMute}
                className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 active:scale-90 transition-all"
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
            <div 
              className="h-full bg-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.8)] transition-all duration-100 ease-linear" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div 
          className="relative w-full h-full group cursor-pointer"
          onClick={() => !post.isAd && onViewPost(post)}
        >
          <img
            src={post.imageUrl}
            alt={post.caption}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
      )}
      
      {/* Caption & Info Overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-6 transition-all duration-500 ${!showCaption && post.mediaType === 'video' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
      >
        <div className="flex items-center gap-3 mb-3 pointer-events-auto" onClick={(e) => { if(!post.isAd) { e.stopPropagation(); onViewPost(post); }}}>
          <img src={post.userAvatar} className="w-10 h-10 rounded-full border-2 border-white/20 shadow-xl" alt="" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm tracking-tight drop-shadow-md text-white">@{post.username}</span>
              {post.userIsVerified && (
                <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              )}
            </div>
            {post.isAd && <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{post.adBrandName} Official</span>}
          </div>
          {post.challengeId && (
            <span className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest border border-rose-500/30 backdrop-blur-md">
              Quest Complete
            </span>
          )}
        </div>
        
        <div className="pointer-events-auto cursor-pointer active:opacity-70 transition-opacity" onClick={(e) => { if(!post.isAd) { e.stopPropagation(); onViewPost(post); }}}>
          <p className="text-sm line-clamp-2 mb-4 text-zinc-100 font-medium leading-relaxed drop-shadow-sm">
            {post.caption}
          </p>
        </div>
        
        {post.isAd ? (
          <div className="pointer-events-auto">
             <button 
                onClick={handleAdClick}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95"
             >
                <span>{post.adCtaText || "Mehr erfahren"}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
             </button>
          </div>
        ) : (
          <div className="flex items-center gap-6 pointer-events-auto">
            <button 
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-2 transition-all active:scale-125 ${post.isLiked ? 'text-rose-500' : 'text-white'}`}
            >
              <svg 
                className="w-8 h-8 drop-shadow-lg" 
                fill={post.isLiked ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm font-black tracking-tighter">{post.likes.toLocaleString()}</span>
            </button>
            
            <button 
              onClick={() => onOpenComments(post)}
              className="flex items-center gap-2 text-white hover:text-rose-400 transition-all active:scale-110"
            >
              <svg className="w-8 h-8 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-black tracking-tighter">{post.comments}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedItem;
