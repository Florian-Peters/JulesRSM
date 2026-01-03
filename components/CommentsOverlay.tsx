
import React, { useState, useRef, useEffect } from 'react';
import { Post, Comment } from '../types';
import { databaseService } from '../services/databaseService';
import { geminiService } from '../services/geminiService';

interface CommentsOverlayProps {
  post: Post;
  currentUserId: string;
  onClose: () => void;
  onCommentCountChange: (postId: string, count: number) => void;
}

const CommentsOverlay: React.FC<CommentsOverlayProps> = ({ post, currentUserId, onClose, onCommentCountChange }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isRemixing, setIsRemixing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const fetched = await databaseService.getComments(post.id);
      setComments(fetched);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      const newComment = await databaseService.addComment(post.id, commentText);
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      onCommentCountChange(post.id, comments.length + 1);
    } catch (err) {
      alert("Kommentar konnte nicht gesendet werden.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Kommentar löschen?")) return;
    try {
      await databaseService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCommentCountChange(post.id, comments.length - 1);
    } catch (err) {
      alert("Löschen fehlgeschlagen.");
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
    <div className="fixed inset-0 z-[1000] flex items-end justify-center px-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-zinc-950 rounded-t-[2.5rem] border-t border-white/10 flex flex-col h-[75vh] animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mt-4 mb-6" onClick={onClose} />
        
        <div className="px-6 pb-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
            Comments ({comments.length})
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 group">
                <img src={comment.userAvatar} className="w-9 h-9 rounded-full border border-white/5 shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">@{comment.username}</span>
                      {comment.userIsVerified && (
                         <svg className="w-3 h-3 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      )}
                      <span className="text-[10px] text-zinc-600">
                        {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {comment.userId === currentUserId && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-500 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="p-4 bg-zinc-900 rounded-full text-zinc-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-500 italic">Be the first to vibe check!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-6 bg-zinc-950 border-t border-white/5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 flex items-center bg-zinc-900 rounded-2xl px-4 py-2 border border-white/5 focus-within:border-rose-500/50 transition-all">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add to the vibe..."
                className="flex-1 bg-transparent border-none text-white placeholder-zinc-500 focus:ring-0 text-sm py-2"
              />
              <button
                type="button"
                onClick={handleRemix}
                disabled={isRemixing || !commentText.trim()}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30 mr-2"
                title="AI Remix"
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
    </div>
  );
};

export default CommentsOverlay;
