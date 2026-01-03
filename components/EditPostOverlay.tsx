
import React, { useState } from 'react';
import { Post } from '../types';
import { geminiService } from '../services/geminiService';

interface EditPostOverlayProps {
  post: Post;
  onClose: () => void;
  onUpdate: (postId: string, newCaption: string) => void;
}

const EditPostOverlay: React.FC<EditPostOverlayProps> = ({ post, onClose, onUpdate }) => {
  const [caption, setCaption] = useState(post.caption);
  const [isRemixing, setIsRemixing] = useState(false);

  const handleRemix = async () => {
    if (!caption.trim()) return;
    setIsRemixing(true);
    try {
      const remixed = await geminiService.remixCaption(caption);
      setCaption(remixed);
    } catch (error) {
      console.error("Edit remix failed", error);
    } finally {
      setIsRemixing(false);
    }
  };

  const handleSave = () => {
    onUpdate(post.id, caption);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-zinc-950 rounded-[2.5rem] border border-white/10 p-8 animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Edit Vibe</h2>
        <p className="text-sm text-zinc-500 mb-8">Adjust your caption and tags.</p>

        <div className="space-y-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-white/5">
            {post.mediaType === 'video' ? (
              <video src={post.imageUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Caption & Tags</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's the vibe?"
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-rose-500/50 outline-none resize-none font-bold text-sm"
              rows={4}
            />
            <button
              type="button"
              onClick={handleRemix}
              disabled={isRemixing || !caption.trim()}
              className="mt-2 text-xs font-black text-rose-400 flex items-center gap-2 hover:text-rose-300 transition-colors disabled:opacity-30"
            >
              <svg className={`w-3 h-3 ${isRemixing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI TEXT REMIX
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-zinc-900 text-zinc-400 font-black py-4 rounded-2xl border border-white/5 active:scale-95 transition-transform"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={!caption.trim()}
              className="flex-1 bg-rose-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-600/20 active:scale-95 transition-transform disabled:opacity-30 uppercase tracking-widest text-xs"
            >
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPostOverlay;
