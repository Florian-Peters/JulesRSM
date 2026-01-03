
export interface User {
  id: string;
  username: string;
  avatar: string;
  coverImage?: string;
  rsm: number;
  bio?: string;
  walletAddress?: string;
  location?: string;
  website?: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  
  // Map Feature Fields
  locationLat?: number;
  locationLng?: number;
  locationUpdatedAt?: number;
  isGhostMode?: boolean;
  currentPinStyle?: string;
  unlockedPins?: string[];
  
  // Status
  isVerified?: boolean;

  // Monetization / Creator Studio
  isCreator?: boolean;
  earnings?: number; // In USD usually
  adImpressions?: number;
  rpm?: number; // Revenue per mille
}

export interface Friend extends User {
  isOnline: boolean;
  status?: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  likes: number;
  comments: number;
  commentsList?: Comment[];
  timestamp: number;
  challengeId?: string;
  isLiked?: boolean;
  userIsVerified?: boolean; 
  
  // Ad Specific Fields
  isAd?: boolean;
  adCtaText?: string; // Call to Action e.g., "Shop Now"
  adLink?: string;
  adBrandName?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  participants: number;
  expiresIn: string; // Display string
  expiresAt: number; // Timestamp for acceptance deadline
  type: 'AI' | 'REAL' | 'MUSIC' | 'USER';
  creatorId?: string;
  creatorUsername?: string;
  isUserChallenge?: boolean;
  targetUsername?: string;
  
  // Lifecycle fields
  status: 'OPEN' | 'ACCEPTED' | 'COMPLETED' | 'EXPIRED';
  durationHours: number; // Time allowed to complete AFTER acceptance
  acceptedAt?: number;
  completionDeadline?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  timestamp: number;
  userIsVerified?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    avatar: string;
    isVerified?: boolean;
  };
  messages: Message[];
  lastMessage?: string;
  unreadCount: number;
}

export interface PinItem {
  id: string;
  name: string;
  price: number;
  borderColor: string;
  glowColor: string;
  description: string;
  limitedEdition?: boolean;
}
