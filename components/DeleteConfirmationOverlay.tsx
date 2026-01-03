
import React, { useState } from 'react';

interface DeleteConfirmationOverlayProps {
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationOverlay: React.FC<DeleteConfirmationOverlayProps> = ({ onCancel, onConfirm, isDeleting }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={isDeleting ? undefined : onCancel} />
      
      <div className="relative w-full max-w-sm bg-zinc-950 rounded-[2rem] border border-white/10 p-8 animate-in zoom-in-95 duration-200 text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </div>
        
        <h2 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-white">Delete Post?</h2>
        <p className="text-sm text-zinc-500 font-medium mb-8 leading-relaxed">
          This action cannot be undone. Your post will be permanently removed from the feed.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-900/20 active:scale-95 transition-transform uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-500 disabled:opacity-50 disabled:scale-100"
          >
            {isDeleting ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                DELETING...
              </>
            ) : (
              'YES, DELETE IT'
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full bg-zinc-900 text-zinc-400 font-black py-4 rounded-2xl border border-white/5 active:scale-95 transition-transform uppercase tracking-widest text-xs hover:text-white disabled:opacity-50 disabled:scale-100"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationOverlay;
