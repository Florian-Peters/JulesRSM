
import { supabase } from './supabaseClient';
import { Post, Challenge, User, Comment } from '../types';

const stringifyError = (err: any): string => {
  if (!err) return "Unknown error";
  if (typeof err === 'string') return err;
  if (err.message) return `${err.message}${err.details ? ' (' + err.details + ')' : ''}`;
  try { return JSON.stringify(err); } catch (e) { return String(err); }
};

export const databaseService = {
  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) throw new Error(stringifyError(error));
    
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: data.user.id,
          username, 
          avatar_url: `https://picsum.photos/seed/${username}/100`,
          cover_url: `https://picsum.photos/seed/${username}_cover/800/400`,
          gems: 500,
          bio: ''
        }]);
      
      if (profileError) console.error("Profile creation error:", profileError);
    }
    
    return data.user;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(stringifyError(error));
    return data.user;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getCurrentProfile(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const fallbackUsername = user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.substring(0, 5)}`;
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          username: fallbackUsername,
          avatar_url: `https://picsum.photos/seed/${user.id}/100`,
          cover_url: `https://picsum.photos/seed/${user.id}_cover/800/400`,
          gems: 500,
          bio: ''
        }])
        .select()
        .single();

      if (!insertError) profile = newProfile;
    }
    
    const socials = profile?.socials ? (typeof profile.socials === 'string' ? JSON.parse(profile.socials) : profile.socials) : {};

    return {
      id: user.id,
      username: profile?.username || user.user_metadata?.username || 'User',
      avatar: profile?.avatar_url || `https://picsum.photos/seed/${user.id}/100`,
      coverImage: profile?.cover_url || `https://picsum.photos/seed/${user.id}_cover/800/400`,
      rsm: profile?.gems || 0,
      bio: profile?.bio || '',
      walletAddress: profile?.wallet_address,
      location: profile?.location || '',
      website: profile?.website || '',
      socials: {
        instagram: socials.instagram || '',
        twitter: socials.twitter || '',
        tiktok: socials.tiktok || ''
      },
      locationLat: profile?.location_lat,
      locationLng: profile?.location_lng,
      isGhostMode: profile?.is_ghost_mode ?? true,
      currentPinStyle: profile?.current_pin_style || 'default',
      unlockedPins: profile?.unlocked_pins || ['default'],
      isVerified: profile?.is_verified || false,
      isCreator: profile?.is_verified || false,
      earnings: profile?.is_verified ? 1240.50 : 0,
      adImpressions: profile?.is_verified ? 45200 : 0,
      rpm: 2.45
    };
  },

  async createPost(userId: string, caption: string, mediaBlob: Blob, mediaType: 'image' | 'video', challengeId?: string): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Nicht authentifiziert.");

    // Detect extension from blob or default
    const blobType = mediaBlob.type;
    let fileExt = 'jpg';
    if (blobType.includes('video')) fileExt = 'mp4';
    else if (blobType.includes('png')) fileExt = 'png';
    else if (blobType.includes('webp')) fileExt = 'webp';

    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    // Explicitly set cacheControl for faster delivery
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, mediaBlob, { 
        contentType: blobType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      throw new Error(`Upload fehlgeschlagen: ${stringifyError(uploadError)}`);
    }
    
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('posts')
      .insert([{
        user_id: user.id,
        caption,
        media_url: publicUrl,
        media_type: mediaType,
        challenge_id: challengeId
      }])
      .select('*, profiles(username, avatar_url, is_verified)')
      .single();

    if (error) throw new Error(`Post-Eintrag konnte nicht erstellt werden: ${stringifyError(error)}`);

    return {
      id: data.id,
      userId: data.user_id,
      username: data.profiles?.username || 'Unknown',
      userAvatar: data.profiles?.avatar_url || '',
      imageUrl: data.media_url,
      mediaType: data.media_type,
      caption: data.caption,
      likes: 0,
      comments: 0,
      timestamp: new Date(data.created_at).getTime(),
      challengeId: data.challenge_id,
      userIsVerified: data.profiles?.is_verified
    };
  },

  async getPosts(): Promise<Post[]> {
    const { data: { user } } = await supabase.auth.getUser();

    let { data, error } = await supabase
      .from('posts')
      .select(`*, profiles (username, avatar_url, is_verified)`)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error("getPosts failed:", stringifyError(error));
      return [];
    }

    const likedPostIds = new Set<string>();
    if (user && data.length > 0) {
      try {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        likesData?.forEach((l: any) => likedPostIds.add(l.post_id));
      } catch (e) {}
    }

    return data.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      username: p.profiles?.username || 'user', 
      userAvatar: p.profiles?.avatar_url || `https://picsum.photos/seed/${p.user_id}/100`,
      imageUrl: p.media_url,
      mediaType: p.media_type as 'image' | 'video',
      caption: p.caption || '',
      likes: p.likes || 0,
      comments: 0, // Placeholder
      timestamp: new Date(p.created_at).getTime(),
      challengeId: p.challenge_id,
      isLiked: likedPostIds.has(p.id),
      userIsVerified: p.profiles?.is_verified || false
    }));
  },

  async updateLocation(lat: number, lng: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ 
      location_lat: lat, 
      location_lng: lng,
      location_updated_at: new Date().toISOString()
    }).eq('id', user.id);
  },

  async toggleGhostMode(isGhost: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ is_ghost_mode: isGhost }).eq('id', user.id);
  },

  async getLiveUsers(): Promise<User[]> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_ghost_mode', false)
      .not('location_lat', 'is', null)
      .gt('location_updated_at', fifteenMinutesAgo)
      .limit(50);

    if (error) return [];
    return (data || []).map(p => ({
      id: p.id,
      username: p.username || 'User',
      avatar: p.avatar_url || `https://picsum.photos/seed/${p.id}/100`,
      rsm: p.gems || 0,
      locationLat: p.location_lat,
      locationLng: p.location_lng,
      currentPinStyle: p.current_pin_style || 'default',
      isVerified: p.is_verified || false
    })) as User[];
  },

  async getChallenges(): Promise<Challenge[]> {
    const { data, error } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      reward: c.reward,
      participants: c.participants || 0,
      expiresIn: 'Active',
      expiresAt: new Date(c.expires_at).getTime(),
      type: c.type,
      status: c.status,
      durationHours: c.duration_hours,
      targetUsername: c.target_username
    }));
  },

  async createChallenge(title: string, description: string, reward: number, type: string, acceptanceHours: number, durationHours: number, targetUsername?: string): Promise<Challenge> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data, error } = await supabase.from('challenges').insert([{
      title, description, reward, type, creator_id: user.id,
      expires_at: new Date(Date.now() + acceptanceHours * 3600000).toISOString(),
      duration_hours: durationHours, target_username: targetUsername, status: 'OPEN'
    }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async addComment(postId: string, text: string): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data, error } = await supabase.from('comments').insert([{ post_id: postId, user_id: user.id, text }]).select('*, profiles(username, avatar_url, is_verified)').single();
    if (error) throw new Error(error.message);
    return {
      id: data.id, postId: data.post_id, userId: data.user_id,
      username: data.profiles?.username || 'Unknown',
      userAvatar: data.profiles?.avatar_url || '',
      text: data.text, timestamp: new Date(data.created_at).getTime(),
      userIsVerified: data.profiles?.is_verified
    };
  },

  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase.from('comments').select('*, profiles(username, avatar_url, is_verified)').eq('post_id', postId).order('created_at', { ascending: true });
    if (error) return [];
    return data.map((c: any) => ({
      id: c.id, postId: c.post_id, userId: c.user_id,
      username: c.profiles?.username || 'Unknown',
      userAvatar: c.profiles?.avatar_url || '',
      text: c.text, timestamp: new Date(c.created_at).getTime(),
      userIsVerified: c.profiles?.is_verified
    }));
  },

  // Fix: Added missing deleteComment method
  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw new Error(error.message);
  },

  // Fix: Added missing buyPin method
  async buyPin(pinId: string, price: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from('profiles').select('gems, unlocked_pins').eq('id', user.id).single();
    if (!profile) throw new Error("Profile not found");

    const unlockedPins = profile.unlocked_pins || ['default'];
    
    if (unlockedPins.includes(pinId)) {
      // Already owned, just equip
      await supabase.from('profiles').update({ current_pin_style: pinId }).eq('id', user.id);
      return;
    }

    if (profile.gems < price) throw new Error("Not enough RSM");

    const { error } = await supabase.from('profiles').update({
      gems: profile.gems - price,
      unlocked_pins: [...unlockedPins, pinId],
      current_pin_style: pinId
    }).eq('id', user.id);

    if (error) throw new Error(error.message);
  },

  async watchAdReward(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: p } = await supabase.from('profiles').select('gems').eq('id', user.id).single();
    await supabase.from('profiles').update({ gems: (p?.gems || 0) + 50 }).eq('id', user.id);
  }
};
