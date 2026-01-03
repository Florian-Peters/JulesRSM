
import React, { useState, useRef } from 'react';
import { User } from '../types';

interface EditProfileOverlayProps {
  user: User;
  onClose: () => void;
  onSave: (updates: any) => Promise<void>;
  onUpdateCover?: (blob: Blob) => Promise<void>;
}

const EditProfileOverlay: React.FC<EditProfileOverlayProps> = ({ user, onClose, onSave, onUpdateCover }) => {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [website, setWebsite] = useState(user.website || '');
  const [socials, setSocials] = useState({
    instagram: user.socials?.instagram || '',
    twitter: user.socials?.twitter || '',
    tiktok: user.socials?.tiktok || ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave({ 
        username, 
        bio,
        location,
        website,
        socials
      });
      onClose();
    } catch (err: any) {
      alert("Fehler beim Speichern: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCover) return;
    
    setIsUploadingCover(true);
    try {
      await onUpdateCover(file);
    } catch (err: any) {
      alert("Cover upload failed: " + err.message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-zinc-950 rounded-[2.5rem] border border-white/10 p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Edit Identity</h2>
        <p className="text-sm text-zinc-500 mb-8">Customize how the world sees you.</p>

        {onUpdateCover && (
          <div className="mb-8">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Cover Image</label>
            <div 
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-32 rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors overflow-hidden relative group"
            >
              <img src={user.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="" />
              <div className="relative z-10 flex flex-col items-center">
                {isUploadingCover ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] font-black uppercase text-zinc-400">Tap to Change</span>
                  </>
                )}
              </div>
            </div>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-rose-500/50 outline-none font-bold text-sm"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world who you are..."
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-rose-500/50 outline-none resize-none font-medium text-sm"
                rows={3}
              />
            </div>
          
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-rose-500/50 outline-none font-medium text-sm"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="yourlink.com"
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-rose-500/50 outline-none font-medium text-sm"
                  />
               </div>
            </div>

            <div className="pt-2 border-t border-white/5">
               <label className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 block mt-2">Social Handles</label>
               <div className="space-y-3">
                  <div className="flex items-center bg-zinc-900 rounded-2xl border border-white/5 px-4">
                     <span className="text-zinc-500 font-bold text-xs w-20">Instagram</span>
                     <input
                        type="text"
                        value={socials.instagram}
                        onChange={(e) => setSocials({...socials, instagram: e.target.value})}
                        placeholder="@username"
                        className="flex-1 bg-transparent border-none text-white focus:ring-0 py-3 text-sm font-medium"
                     />
                  </div>
                  <div className="flex items-center bg-zinc-900 rounded-2xl border border-white/5 px-4">
                     <span className="text-zinc-500 font-bold text-xs w-20">Twitter/X</span>
                     <input
                        type="text"
                        value={socials.twitter}
                        onChange={(e) => setSocials({...socials, twitter: e.target.value})}
                        placeholder="@username"
                        className="flex-1 bg-transparent border-none text-white focus:ring-0 py-3 text-sm font-medium"
                     />
                  </div>
                  <div className="flex items-center bg-zinc-900 rounded-2xl border border-white/5 px-4">
                     <span className="text-zinc-500 font-bold text-xs w-20">TikTok</span>
                     <input
                        type="text"
                        value={socials.tiktok}
                        onChange={(e) => setSocials({...socials, tiktok: e.target.value})}
                        placeholder="@username"
                        className="flex-1 bg-transparent border-none text-white focus:ring-0 py-3 text-sm font-medium"
                     />
                  </div>
               </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-900 text-zinc-400 font-black py-4 rounded-2xl border border-white/5 active:scale-95 transition-transform"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSaving || !username.trim()}
              className="flex-1 bg-white text-black font-black py-4 rounded-2xl shadow-xl shadow-white/5 active:scale-95 transition-transform disabled:opacity-30 uppercase tracking-widest text-xs"
            >
              {isSaving ? 'SAVING...' : 'SAVE IDENTITY'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileOverlay;
