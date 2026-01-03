
import React, { useState, useEffect, useRef } from 'react';
import { Post, Comment } from '../types';
import { databaseService } from '../services/databaseService';
import { geminiService } from '../services/geminiService';

interface PostDetailOverlayProps {
  post: Post;
  currentUserId: string;
  onClose: () => void;
  onLike: (id: string) => void;
  onUpdatePost: (postId: string, count: number) => void; // Update comment count in parent
}

const PostDetailOverlay: React.FC<PostDetailOverlayProps> = ({ post, currentUserId, onClose, onLike, onUpdatePost }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isRemixing, setIsRemixing] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [localLike, setLocalLike] = useState(post.isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(post.likes);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  useEffect(() => {
    setLocalLike(post.isLiked);
    setLocalLikeCount(post.likes);
  }, [post.isLiked, post.likes]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const fetched = await databaseService.getComments(post.id);
      setComments(fetched);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleLike = () => {
    // Optimistic update
    const newLikedState = !localLike;
    setLocalLike(newLikedState);
    setLocalLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike(post.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by @${post.username}`,
          text: post.caption,
          url: window.location.href, // Or a specific post URL if routing existed
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      alert("Sharing not supported on this device/browser.");
    }
  };

  const handleSubmitComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      const newComment = await databaseService.addComment(post.id, commentText);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      onUpdatePost(post.id, comments.length + 1);
      
      // Scroll to bottom
      if (scrollRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      alert("Kommentar konnte nicht gesendet werden.");
    }
  };

  const handleRemix = async () => {
    if (!commentText.trim()) return;
    setIsRemixing(true);
    try {
      const remixed = await geminiService.remixCaption(commentText);
      setCommentText(remixed);
    } catch (error) {
      console.error("Comment remix failed", error);
    } finally {
      setIsRemixing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="p-4 -ml-4 text-white hover:text-rose-500 transition-colors"
            aria-label="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <img src={post.userAvatar} className="w-8 h-8 rounded-full border border-white/10" alt="" />
            <div className="flex items-center gap-1">
               <span className="font-bold text-sm text-white">@{post.username}</span>
               {post.userIsVerified && (
                  <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
               )}
            </div>
          </div>
        </div>
        <button onClick={handleShare} className="p-2 text-white/80 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar" ref={scrollRef}>
        {/* Media */}
        <div className="w-full bg-zinc-900 mb-4">
          {post.mediaType === 'video' ? (
            <video 
              src={post.imageUrl} 
              className="w-full h-auto max-h-[70vh] object-contain mx-auto" 
              controls 
              autoPlay 
              playsInline 
            />
          ) : (
            <img 
              src={post.imageUrl} 
              className="w-full h-auto max-h-[70vh] object-contain mx-auto" 
              alt={post.caption} 
            />
          )}
        </div>

        {/* Content Info */}
        <div className="px-6 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 transition-all active:scale-125 ${localLike ? 'text-rose-500' : 'text-white'}`}
              >
                <svg 
                  className="w-7 h-7" 
                  fill={localLike ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm font-black tracking-tighter">{localLikeCount.toLocaleString()}</span>
              </button>
              
              <div className="flex items-center gap-2 text-white">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-black tracking-tighter">{comments.length}</span>
              </div>
            </div>
            
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              {new Date(post.timestamp).toLocaleDateString()}
            </span>
          </div>

          <p className="text-sm text-zinc-100 font-medium leading-relaxed whitespace-pre-wrap">
            {post.caption}
          </p>
        </div>

        <div className="h-px bg-white/10 mx-6 mb-6" />

        {/* Comments Section */}
        <div className="px-6 space-y-6 pb-20">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Comments</h3>
          
          {isLoadingComments ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img src={comment.userAvatar} className="w-8 h-8 rounded-full border border-white/5 shrink-0" alt="" />
                <div className="flex-1 min-w-0 bg-zinc-900/50 p-3 rounded-2xl rounded-tl-none">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-white">@{comment.username}</span>
                    {comment.userIsVerified && (
                        <svg className="w-3 h-3 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    )}
                    <span className="text-[9px] text-zinc-500 font-medium">
                      {formatTimeAgo(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-zinc-600 italic py-4">No comments yet. Be the first!</p>
          )}
        </div>
      </div>

      {/* Comment Input Footer */}
      <div className="p-4 bg-zinc-950 border-t border-white/10 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <form onSubmit={handleSubmitComment} className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-zinc-900 rounded-2xl px-4 py-2 border border-white/5 focus-within:border-rose-500/50 transition-all">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Drop a comment..."
              className="flex-1 bg-transparent border-none text-white placeholder-zinc-500 focus:ring-0 text-sm py-2"
            />
            <button
              type="button"
              onClick={handleRemix}
              disabled={isRemixing || !commentText.trim()}
              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30 mr-2"
            >
              <svg className={`w-5 h-5 ${isRemixing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="text-rose-500 font-black text-xs uppercase tracking-widest disabled:opacity-30 active:scale-90 transition-transform"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostDetailOverlay;
