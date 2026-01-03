
import React, { useState, useEffect, useMemo } from 'react';
import Navigation from './components/Navigation';
import FeedItem from './components/FeedItem';
import ChallengeBar from './components/ChallengeBar';
import AICreate from './components/AICreate';
import LiveStream from './components/LiveStream';
import Auth from './components/Auth';
import EditPostOverlay from './components/EditPostOverlay';
import EditProfileOverlay from './components/EditProfileOverlay';
import CommentsOverlay from './components/CommentsOverlay';
import CreateChallengeOverlay from './components/CreateChallengeOverlay';
import DeleteConfirmationOverlay from './components/DeleteConfirmationOverlay';
import PostDetailOverlay from './components/PostDetailOverlay';
import MapTab from './components/MapTab';
import Messages from './components/Messages';
import WalletOverlay from './components/WalletOverlay';
import CreatorStudioOverlay from './components/CreatorStudioOverlay';
import GoogleAd from './components/GoogleAd';
import Logo from './components/Logo';
import { Post, Challenge, User } from './types';
import { databaseService } from './services/databaseService';
import { supabase } from './services/supabaseClient';
import { MOCK_CHALLENGES, MOCK_FRIENDS } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'create' | 'leaderboard' | 'profile'>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Overlay States
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [isLiveStreamOpen, setIsLiveStreamOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isCreatorStudioOpen, setIsCreatorStudioOpen] = useState(false);
  
  const [creationInitialMedia, setCreationInitialMedia] = useState<{ url: string, blob: Blob, type: 'image' | 'video' } | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | undefined>(undefined);

  const [profileTab, setProfileTab] = useState<'posts' | 'liked'>('posts');

  // Post Interaction States
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [commentingPost, setCommentingPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Challenge Filters
  const [challengeFilter, setChallengeFilter] = useState<Challenge['type'] | 'ALL'>('ALL');
  const [challengeSort, setChallengeSort] = useState<'REWARD' | 'EXPIRY'>('REWARD');

  const handleTabChange = (tab: 'home' | 'map' | 'create' | 'leaderboard' | 'profile') => {
    if (tab === 'create') {
      setIsCreating(true);
    } else {
      setActiveTab(tab);
    }
  };

  // SAFETY TIMEOUT: Forces the app to load even if DB hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || isInitializing) {
        console.warn("Safety timeout triggered: Forcing app load");
        setLoading(false);
        setIsInitializing(false);
      }
    }, 4000); // 4 seconds max load time
    return () => clearTimeout(timer);
  }, [loading, isInitializing]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setIsInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setCurrentUser(null);
        setPosts([]);
        setChallenges([]);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAppData = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      // Cleanup expired challenges silently
      try { await databaseService.cleanupExpiredChallenges(); } catch(e) {}
      
      // Load Profile first
      const profile = await databaseService.getCurrentProfile();
      setCurrentUser(profile);

      // Load Content with Promise.allSettled to prevent one failure from blocking everything
      const [postsResult, challengesResult] = await Promise.allSettled([
        databaseService.getPosts(),
        databaseService.getChallenges()
      ]);
      
      if (postsResult.status === 'fulfilled') {
        setPosts(postsResult.value);
      } else {
        console.error("Failed to load posts", postsResult.reason);
        setPosts([]); // Fallback
      }

      if (challengesResult.status === 'fulfilled' && challengesResult.value.length > 0) {
        setChallenges(challengesResult.value);
      } else {
        setChallenges(MOCK_CHALLENGES); // Fallback to mocks if DB fails or empty
      }

    } catch (err) {
      console.error("Critical Load Error:", err);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const refreshUser = async () => {
     try {
       const profile = await databaseService.getCurrentProfile();
       setCurrentUser(profile);
     } catch (e) {
       console.error(e);
     }
  };

  useEffect(() => {
    if (session) {
      loadAppData();
    }
  }, [session]);

  const filteredAndSortedChallenges = useMemo(() => {
    let result = [...challenges];
    if (challengeFilter !== 'ALL') {
      result = result.filter(c => c.type === challengeFilter);
    }
    result.sort((a, b) => {
      if (challengeSort === 'REWARD') {
        return b.reward - a.reward;
      } else {
        const getMinutes = (timeStr: string) => {
          let totalMinutes = 0;
          const hours = timeStr.match(/(\d+)h/);
          const minutes = timeStr.match(/(\d+)m/);
          if (hours) totalMinutes += parseInt(hours[1]) * 60;
          if (minutes) totalMinutes += parseInt(minutes[1]);
          return totalMinutes || 99999;
        };
        return getMinutes(a.expiresIn) - getMinutes(b.expiresIn);
      }
    });
    return result;
  }, [challenges, challengeFilter, challengeSort]);

  // Combine Posts with Real Ads
  const feedItems = useMemo(() => {
    const items: (Post | { type: 'ad' })[] = [];
    if (!posts) return [];
    
    posts.forEach((post, index) => {
      items.push(post);
      // Insert a Real Ad every 5 posts
      if ((index + 1) % 5 === 0) {
        items.push({ type: 'ad' });
      }
    });
    return items;
  }, [posts]);

  const userPosts = useMemo(() => posts.filter(p => p.userId === currentUser?.id), [posts, currentUser]);
  const likedPosts = useMemo(() => posts.filter(p => p.isLiked), [posts]);

  const handlePost = async (caption: string, _mediaUrl: string, mediaType: 'image' | 'video', mediaBlob?: Blob) => {
    if (!currentUser || !mediaBlob) throw new Error("Fehlende Daten");
    try {
      const newPost = await databaseService.createPost(currentUser.id, caption, mediaBlob, mediaType, activeChallengeId);
      setPosts(prev => [newPost, ...prev]);
      if (activeChallengeId) {
        setChallenges(prev => prev.map(c => c.id === activeChallengeId ? { ...c, status: 'COMPLETED' } : c));
        setActiveChallengeId(undefined);
      }
      setActiveTab('home');
      setIsCreating(false);
      setCreationInitialMedia(null);
    } catch (err: any) {
      console.error("handlePost Error:", err);
      throw err;
    }
  };

  const handleCreateChallenge = async (title: string, description: string, reward: number, acceptanceHours: number, durationHours: number, targetUsername?: string) => {
    if (!currentUser) return;
    try {
      const type = targetUsername ? 'USER' : 'REAL';
      const newChallenge = await databaseService.createChallenge(title, description, reward, type, acceptanceHours, durationHours, targetUsername);
      setChallenges(prev => [newChallenge, ...prev]);
      setCurrentUser(prev => prev ? { ...prev, rsm: prev.rsm - reward } : null);
      setIsCreatingChallenge(false);
      setActiveTab('home');
    } catch (err: any) {
      alert("Failed to create challenge: " + err.message);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      await databaseService.acceptChallenge(challengeId);
      const updatedChallenge = challenges.find(c => c.id === challengeId);
      if (updatedChallenge) {
         const duration = updatedChallenge.durationHours || 24;
         setChallenges(prev => prev.map(c => c.id === challengeId ? { ...c, status: 'ACCEPTED', expiresIn: `${duration}h 0m left` } : c));
      }
    } catch (err: any) {
      alert("Error accepting: " + err.message);
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await databaseService.declineChallenge(challengeId);
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
    } catch (err: any) {
      alert("Error declining: " + err.message);
    }
  };

  const handleSubmitProof = (challengeId: string) => {
    setActiveChallengeId(challengeId);
    setIsCreating(true);
  };

  const handleUpdatePost = async (postId: string, newCaption: string) => {
    try {
      await databaseService.updatePost(postId, newCaption);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, caption: newCaption } : p));
      setEditingPost(null);
    } catch (err) {
      alert("Fehler beim Aktualisieren");
    }
  };

  const handleUpdateProfile = async (updates: any) => {
    if (!currentUser) return;
    try {
      await databaseService.updateProfile(currentUser.id, updates);
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
      loadAppData(); 
    } catch (err: any) {
      console.error("Profile update failed", err);
      alert("Fehler beim Profil-Update");
    }
  };

  const handleCoverUpload = async (file: Blob) => {
     if (currentUser) {
       try {
         const newUrl = await databaseService.updateCoverImage(currentUser.id, file);
         setCurrentUser(prev => prev ? { ...prev, coverImage: newUrl } : null);
       } catch (err: any) {
         throw err;
       }
     }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const isLiked = post.isLiked;
      const newCount = isLiked ? post.likes - 1 : post.likes + 1;
      
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !isLiked, likes: newCount } : p));
      
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
        await supabase.from('posts').update({ likes: newCount }).eq('id', postId);
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id });
        await supabase.from('posts').update({ likes: newCount }).eq('id', postId);
      }
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleCommentCountUpdate = (postId: string, count: number) => {
     setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: count } : p));
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await databaseService.deletePost(postToDelete);
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
      setPostToDelete(null);
    } catch (err: any) {
      alert("Fehler beim Löschen: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
         <div className="flex flex-col items-center gap-4">
            <Logo className="animate-pulse" />
            <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-600 text-xs font-mono animate-pulse mt-4">Initializing...</p>
         </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onSuccess={loadAppData} />;
  }

  return (
    <div className="bg-black min-h-screen pb-20 max-w-lg mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Messages Overlay */}
      {isMessagesOpen && (
        <Messages onClose={() => setIsMessagesOpen(false)} />
      )}

      {/* Overlays */}
      {isCreating && (
        <AICreate 
          onClose={() => { setIsCreating(false); setCreationInitialMedia(null); setActiveChallengeId(undefined); }} 
          onPost={handlePost}
          onGoLive={() => { setIsCreating(false); setIsLiveStreamOpen(true); }}
          initialMedia={creationInitialMedia}
        />
      )}

      {isCreatingChallenge && currentUser && (
        <CreateChallengeOverlay
           onClose={() => setIsCreatingChallenge(false)}
           onCreate={handleCreateChallenge}
           userBalance={currentUser.rsm}
        />
      )}

      {isLiveStreamOpen && (
        <LiveStream 
          onClose={() => setIsLiveStreamOpen(false)} 
          onSaveRecording={(blob) => {
             setIsLiveStreamOpen(false);
             setCreationInitialMedia({ url: URL.createObjectURL(blob), blob, type: 'video' });
             setIsCreating(true);
          }}
        />
      )}
      
      {viewingPost && currentUser && (
        <PostDetailOverlay 
          post={viewingPost}
          currentUserId={currentUser.id}
          onClose={() => setViewingPost(null)}
          onLike={handleLikePost}
          onUpdatePost={handleCommentCountUpdate}
        />
      )}

      {editingPost && (
        <EditPostOverlay 
           post={editingPost}
           onClose={() => setEditingPost(null)}
           onUpdate={handleUpdatePost}
        />
      )}

      {commentingPost && currentUser && (
        <CommentsOverlay 
          post={commentingPost}
          currentUserId={currentUser.id}
          onClose={() => setCommentingPost(null)}
          onCommentCountChange={handleCommentCountUpdate}
        />
      )}

      {postToDelete && (
         <DeleteConfirmationOverlay 
            onCancel={() => setPostToDelete(null)}
            onConfirm={handleDeletePost}
            isDeleting={isDeleting}
         />
      )}

      {isEditingProfile && currentUser && (
         <EditProfileOverlay 
            user={currentUser}
            onClose={() => setIsEditingProfile(false)}
            onSave={handleUpdateProfile}
            onUpdateCover={handleCoverUpload}
         />
      )}

      {isWalletOpen && currentUser && (
         <WalletOverlay 
            balance={currentUser.rsm}
            onClose={() => setIsWalletOpen(false)}
            onUpdateBalance={refreshUser}
         />
      )}

      {isCreatorStudioOpen && currentUser && (
        <CreatorStudioOverlay 
          user={currentUser}
          onClose={() => setIsCreatorStudioOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="min-h-screen bg-black text-white">
        
        {/* Top Header (Visible unless on Map or Profile) */}
        {activeTab !== 'map' && activeTab !== 'profile' && (
           <header className="fixed top-0 left-0 right-0 max-w-lg mx-auto z-[900] bg-black/80 backdrop-blur-xl px-6 py-3 flex justify-between items-center border-b border-white/5 pt-[calc(0.5rem+env(safe-area-inset-top))]">
             <div className="flex items-center gap-2">
                <Logo size={32} />
                <span className="text-xl font-[900] italic tracking-tighter text-white">RSM</span>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsWalletOpen(true)}
                  className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full border border-white/10 active:scale-95 transition-transform"
                >
                   <span className="text-xs font-black text-[#f97316]">{currentUser?.rsm}</span>
                   <div className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
                </button>
                <button onClick={() => setIsMessagesOpen(true)} className="relative p-2 text-zinc-400 hover:text-white transition-colors">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </button>
             </div>
           </header>
        )}
        
        <main className={`pt-[calc(4rem+env(safe-area-inset-top))] ${activeTab === 'map' || activeTab === 'profile' ? 'pt-0' : ''}`}>
          
          {/* HOME FEED */}
          {activeTab === 'home' && (
            <>
              <ChallengeBar 
                challenges={filteredAndSortedChallenges}
                onStartNew={() => setIsCreatingChallenge(true)}
                onBoost={() => {}}
                currentFilter={challengeFilter}
                onFilterChange={setChallengeFilter}
                currentSort={challengeSort}
                onSortChange={setChallengeSort}
                currentUserUsername={currentUser?.username}
                onAccept={handleAcceptChallenge}
                onDecline={handleDeclineChallenge}
                onSubmitProof={handleSubmitProof}
              />
              
              <div className="px-4 pb-24">
                 {feedItems.length > 0 ? (
                    feedItems.map((item, index) => {
                       // CHECK IF ITEM IS A REAL AD
                       if ('type' in item && item.type === 'ad') {
                          // USE THE REAL AD UNIT ID HERE
                          // Demo Mode OFF: Showing real Google Ads (or white box if loading)
                          return <GoogleAd key={`ad-${index}`} slotId="3021506239" format="rectangle" demo={false} />;
                       }
                       
                       const post = item as Post;
                       return (
                         <FeedItem 
                           key={post.id}
                           post={post}
                           currentUserId={currentUser?.id || ''}
                           onLike={handleLikePost}
                           onOpenComments={setCommentingPost}
                           onEdit={setEditingPost}
                           onDelete={(id) => setPostToDelete(id)}
                           onViewPost={setViewingPost}
                         />
                       );
                    })
                 ) : (
                    <div className="py-20 text-center text-zinc-500 text-sm font-bold">No posts yet. Be the first!</div>
                 )}
              </div>
            </>
          )}

          {/* MAP TAB */}
          {activeTab === 'map' && (
             <div className="h-screen w-full relative">
                <MapTab currentUser={currentUser} onUpdateUser={refreshUser} />
             </div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
             <div className="px-6 py-6 pb-24">
                <h2 className="text-3xl font-[900] italic uppercase tracking-tighter mb-6">Top Vibers</h2>
                <div className="space-y-4">
                   {[currentUser, ...MOCK_FRIENDS].filter(Boolean).sort((a,b) => (b?.rsm||0) - (a?.rsm||0)).map((u, i) => (
                      <div key={u?.id || i} className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                         <span className={`font-black text-lg w-6 ${i===0?'text-yellow-500':i===1?'text-zinc-300':i===2?'text-orange-500':'text-zinc-600'}`}>#{i+1}</span>
                         <img src={u?.avatar} className="w-10 h-10 rounded-full" alt="" />
                         <div className="flex-1">
                            <p className="font-bold text-white">{u?.username}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">{u?.rsm} RSM</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && currentUser && (
             <div className="pb-24">
                {/* Profile Header */}
                <div className="relative">
                   <div className="h-48 w-full bg-zinc-800">
                      <img src={currentUser.coverImage} className="w-full h-full object-cover" alt="Cover" />
                   </div>
                   <div className="absolute top-4 right-4 flex gap-2 pt-[env(safe-area-inset-top)]">
                      <button onClick={() => setIsCreatorStudioOpen(true)} className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 text-white shadow-lg">
                         Creator Studio
                      </button>
                      <button onClick={() => setIsEditingProfile(true)} className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 text-white hover:bg-black/60 transition-colors">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                   </div>
                   <div className="absolute -bottom-10 left-6">
                      <div className="relative">
                         <img src={currentUser.avatar} className="w-24 h-24 rounded-[2rem] border-4 border-black object-cover bg-zinc-800" alt="Avatar" />
                         {currentUser.isVerified && (
                            <div className="absolute -bottom-2 -right-2 bg-blue-500 p-1 rounded-full border-4 border-black">
                               <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                            </div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="mt-12 px-6">
                   <h1 className="text-2xl font-[900] text-white flex items-center gap-2">
                      @{currentUser.username}
                   </h1>
                   {currentUser.bio && <p className="text-zinc-400 text-sm mt-2">{currentUser.bio}</p>}
                   
                   <div className="flex gap-6 mt-6 border-b border-white/10 pb-4">
                      <button onClick={() => setProfileTab('posts')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-colors ${profileTab === 'posts' ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}>Posts</button>
                      <button onClick={() => setProfileTab('liked')} className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-colors ${profileTab === 'liked' ? 'border-white text-white' : 'border-transparent text-zinc-500'}`}>Likes</button>
                   </div>

                   <div className="mt-4 grid grid-cols-3 gap-1">
                      {(profileTab === 'posts' ? userPosts : likedPosts).map(post => (
                         <div key={post.id} onClick={() => setViewingPost(post)} className="aspect-[3/4] bg-zinc-900 relative group cursor-pointer overflow-hidden">
                            {post.mediaType === 'video' ? (
                               <video src={post.imageUrl} className="w-full h-full object-cover" muted />
                            ) : (
                               <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-white transition-opacity">
                               <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> {post.likes}</span>
                            </div>
                         </div>
                      ))}
                      {(profileTab === 'posts' ? userPosts : likedPosts).length === 0 && (
                         <div className="col-span-3 py-10 text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">Nothing to see here yet</div>
                      )}
                   </div>
                </div>
             </div>
          )}
          
        </main>
      </div>

      <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
};

export default App;
