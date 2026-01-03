
import React, { useState } from 'react';
import { databaseService } from '../services/databaseService';

interface AuthProps {
  onSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await databaseService.signIn(email, password);
      } else {
        if (!username.trim()) throw new Error("Username is required");
        await databaseService.signUp(email, password, username);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-[#8b5cf6]/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[30%] bg-[#f97316]/10 blur-[100px] rounded-full" />

      <div className="w-full max-w-sm z-10 space-y-12">
        <div className="text-center space-y-6">
          <div className="flex justify-center animate-in zoom-in duration-1000">
            <img 
              src="assets/logo.png" 
              style={{ width: 180, height: 180 }} 
              className="drop-shadow-[0_0_35px_rgba(236,72,153,0.3)] object-contain" 
              alt="Logo" 
            />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-[44px] font-[900] italic uppercase tracking-tighter text-white animate-in slide-in-from-bottom-2 duration-700 leading-none">
              {isLogin ? 'ENTER THE VIBE' : 'START YOUR ERA'}
            </h1>
            <p className="text-zinc-600 font-black uppercase text-[10px] tracking-[0.6em] mt-2">
              REAL SOCIAL MEET
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="group">
              <input
                type="text"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-[#ec4899]/30 outline-none backdrop-blur-md transition-all font-black text-xs tracking-widest placeholder-zinc-700"
                required={!isLogin}
              />
            </div>
          )}

          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-[#ec4899]/30 outline-none backdrop-blur-md transition-all font-black text-xs tracking-widest placeholder-zinc-700"
            required
          />

          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900/40 border border-white/5 rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-[#ec4899]/30 outline-none backdrop-blur-md transition-all font-black text-xs tracking-widest placeholder-zinc-700"
            required
          />

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[9px] text-red-500 font-black uppercase tracking-widest text-center animate-in shake duration-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f97316] rounded-[2rem] text-white font-[900] uppercase tracking-[0.4em] shadow-2xl shadow-pink-900/20 active:scale-95 transition-all disabled:opacity-50 mt-6 text-[12px] animate-shine"
          >
            {loading ? 'CONNECTING...' : isLogin ? 'SIGN IN' : 'GET STARTED'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 hover:text-white transition-colors"
          >
            {isLogin ? "No account? Sign up" : "Already a member? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
