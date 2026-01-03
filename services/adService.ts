
import { Post } from '../types';

// Mock Ad Inventory
const AD_INVENTORY: Post[] = [
  {
    id: 'ad_1',
    userId: 'sponsor_redbull',
    username: 'Red Bull Energy',
    userAvatar: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&auto=format&fit=crop&q=60',
    userIsVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Verleiht Flügel. 🦅 Hol dir den neuen Summer Edition Geschmack jetzt im Store!',
    likes: 15400,
    comments: 420,
    timestamp: Date.now(),
    isAd: true,
    adBrandName: 'Red Bull',
    adCtaText: 'Jetzt Kaufen',
    adLink: 'https://redbull.com'
  },
  {
    id: 'ad_2',
    userId: 'sponsor_nike',
    username: 'Nike Sportswear',
    userAvatar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=60',
    userIsVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Just Do It. Die neue Cyber-Running Kollektion ist da. 👟🔥 #NikeRunning',
    likes: 8900,
    comments: 120,
    timestamp: Date.now(),
    isAd: true,
    adBrandName: 'Nike',
    adCtaText: 'Shop Collection',
    adLink: 'https://nike.com'
  },
  {
    id: 'ad_3',
    userId: 'sponsor_spotify',
    username: 'Spotify',
    userAvatar: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=100&auto=format&fit=crop&q=60',
    userIsVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    caption: 'Höre deine Musik, überall. 3 Monate Premium kostenlos testen. 🎵',
    likes: 45000,
    comments: 200,
    timestamp: Date.now(),
    isAd: true,
    adBrandName: 'Spotify',
    adCtaText: 'Gratis Testen',
    adLink: 'https://spotify.com'
  }
];

export const adService = {
  // Returns a random ad for the feed
  getFeedAd: (): Post => {
    const randomIndex = Math.floor(Math.random() * AD_INVENTORY.length);
    const ad = { ...AD_INVENTORY[randomIndex] };
    // Create unique ID so we can render multiple ads without key conflicts
    ad.id = `ad_${Date.now()}_${Math.random()}`; 
    return ad;
  },

  // Returns a video ad for the wallet reward (Mocking a video URL)
  getRewardedAdVideoUrl: () => {
    // A copyright-free tech/abstract video
    return "https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4";
  }
};
