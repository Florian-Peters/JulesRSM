
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';

interface CreateChallengeOverlayProps {
  onClose: () => void;
  onCreate: (title: string, description: string, reward: number, acceptanceHours: number, durationHours: number, targetUsername?: string) => Promise<void>;
  userBalance: number;
}

const CreateChallengeOverlay: React.FC<CreateChallengeOverlayProps> = ({ onClose, onCreate, userBalance }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState(200);
  const [isDuel, setIsDuel] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [acceptanceHours, setAcceptanceHours] = useState(12);
  const [durationHours, setDurationHours] = useState(24);
  const [isRemixing, setIsRemixing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRemix = async () => {
    if (!description.trim()) return;
    setIsRemixing(true);
    try {
      const remixed = await geminiService.remixCaption(description);
      setDescription(remixed);
    } catch (error) {
      console.error("Description remix failed", error);
    } finally {
      setIsRemixing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || reward > userBalance) return;
    
    setIsSubmitting(true);
    try {
      const target = isDuel ? targetUsername.replace('@', '').trim() : undefined;
      await onCreate(title, description, reward, acceptanceHours, durationHours, target);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = title.trim().length > 0 && description.trim().length > 0 && reward <= userBalance && (!isDuel || targetUsername.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={!isSubmitting ? onClose : undefined} />
      
      <div className="relative w-full max-w-md bg-zinc-950 rounded-[2.5rem] border border-white/10 p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Start a Quest</h2>
        <p className="text-sm text-zinc-500 mb-6">Set a challenge, offer RSM, and watch the community vibe.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Duel Switcher */}
          <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white">Direct Duel</p>
              <p className="text-[10px] text-zinc-500 font-bold">Challenge someone 1v1</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDuel(!isDuel)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isDuel ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDuel ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {isDuel && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2 block">Target User</label>
              <input
                type="text"
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder="@username"
                className="w-full bg-zinc-900 border border-orange-500/30 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-orange-500/50 outline-none placeholder-zinc-700 font-bold"
                required={isDuel}
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Quest Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Jump in the lake!"
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-rose-500/50 outline-none font-bold"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Description & Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to happen..."
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-rose-500/50 outline-none resize-none text-sm"
              rows={3}
              required
            />
            <button
              type="button"
              onClick={handleRemix}
              disabled={isRemixing || !description.trim()}
              className="mt-2 text-xs font-black text-rose-400 flex items-center gap-2 hover:text-rose-300 transition-colors disabled:opacity-30"
            >
              <svg className={`w-3 h-3 ${isRemixing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI VIBE CHECK
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Time to Accept</label>
              <select 
                value={acceptanceHours}
                onChange={(e) => setAcceptanceHours(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-4 text-white text-xs font-bold outline-none"
              >
                <option value={1}>1 Hour</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Time to Complete</label>
              <select 
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-4 text-white text-xs font-bold outline-none"
              >
                <option value={1}>1 Hour</option>
                <option value={2}>2 Hours</option>
                <option value={24}>24 Hours</option>
                <option value={168}>1 Week</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Reward (RSM)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max={Math.min(userBalance, 2000)}
                step="50"
                value={reward}
                onChange={(e) => setReward(parseInt(e.target.value))}
                className="flex-1 accent-rose-600"
              />
              <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 min-w-[80px] justify-center">
                <span className="font-black text-white">{reward}</span>
                <span className="text-[10px] font-black text-[#f97316]">RSM</span>
              </div>
            </div>
            {reward > userBalance && (
              <p className="text-[10px] text-red-500 font-bold mt-2 uppercase">Not enough RSM!</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-zinc-900 text-zinc-400 font-black py-4 rounded-2xl border border-white/5 active:scale-95 transition-transform disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 bg-white text-black font-black py-4 rounded-2xl shadow-xl shadow-white/5 active:scale-95 transition-transform disabled:opacity-30 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  CREATING...
                </>
              ) : (
                isDuel ? 'SEND DUEL' : 'START QUEST'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeOverlay;
