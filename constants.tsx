import { Challenge, Post, User, Conversation, Friend } from './types';

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'Neon Self-Portrait',
    description: 'Use the AI filter to turn yourself into a neon cyberpunk character.',
    reward: 500,
    participants: 1240,
    expiresIn: '2h 15m',
    type: 'AI',
    expiresAt: Date.now() + 8100000,
    status: 'OPEN',
    durationHours: 24
  },
  {
    id: 'c2',
    title: 'The "Unheard" Lip Sync',
    description: 'Lip sync to this underground track before it goes viral.',
    reward: 250,
    participants: 4500,
    expiresIn: '12h 40m',
    type: 'MUSIC',
    expiresAt: Date.now() + 45600000,
    status: 'OPEN',
    durationHours: 48
  }
];

export const MOCK_FRIENDS: Friend[] = [
  { id: 'u1', username: 'alex_vibes', avatar: 'https://picsum.photos/seed/alex/100', rsm: 1200, isOnline: true, status: 'Vibing' },
  { id: 'u2', username: 'sara_starlight', avatar: 'https://picsum.photos/seed/sara/100', rsm: 3400, isOnline: true, status: 'At a festival' },
  { id: 'u3', username: 'mike_drop', avatar: 'https://picsum.photos/seed/mike/100', rsm: 800, isOnline: false },
  { id: 'u4', username: 'neon_queen', avatar: 'https://picsum.photos/seed/queen/100', rsm: 5600, isOnline: true, status: 'Creating AI Art' },
  { id: 'u5', username: 'pixel_boy', avatar: 'https://picsum.photos/seed/pixel/100', rsm: 450, isOnline: false },
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    username: 'alex_vibes',
    userAvatar: 'https://picsum.photos/seed/alex/100',
    imageUrl: 'https://picsum.photos/seed/neon/600/800',
    mediaType: 'image',
    caption: 'Cyberpunk energy tonight! ⚡️ #NeonChallenge',
    likes: 1240,
    comments: 2,
    commentsList: [
      { id: 'com1', postId: 'p1', userId: 'u3', username: 'jammer_king', userAvatar: 'https://picsum.photos/seed/king/100', text: 'This looks insane! 🔥', timestamp: Date.now() - 500000 },
      { id: 'com2', postId: 'p1', userId: 'u2', username: 'sara_starlight', userAvatar: 'https://picsum.photos/seed/sara/100', text: 'Love the colors! ✨', timestamp: Date.now() - 100000 }
    ],
    timestamp: Date.now() - 3600000,
    challengeId: 'c1'
  },
  {
    id: 'p2',
    userId: 'u2',
    username: 'sara_starlight',
    userAvatar: 'https://picsum.photos/seed/sara/100',
    imageUrl: 'https://picsum.photos/seed/concert/600/800',
    mediaType: 'image',
    caption: 'Front row seats! Who else is here?',
    likes: 850,
    comments: 1,
    commentsList: [
      { id: 'com3', postId: 'p2', userId: 'u1', username: 'alex_vibes', userAvatar: 'https://picsum.photos/seed/alex/100', text: 'Have fun! 🎸', timestamp: Date.now() - 50000 }
    ],
    timestamp: Date.now() - 7200000
  }
];

export const CURRENT_USER: User = {
  id: 'me',
  username: 'geojammer_01',
  avatar: 'https://picsum.photos/seed/me/100',
  rsm: 1250
};

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    participant: {
      id: 'u1',
      username: 'alex_vibes',
      avatar: 'https://picsum.photos/seed/alex/100',
    },
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Yo, your neon post was fire! 🔥', timestamp: Date.now() - 100000 },
      { id: 'm2', senderId: 'me', text: 'Thanks man! Gemini really pulled through with the filter.', timestamp: Date.now() - 50000 },
      { id: 'm3', senderId: 'u1', text: 'Thinking of joining the lip sync challenge next, you in?', timestamp: Date.now() - 10000 },
    ],
    lastMessage: 'Thinking of joining the lip sync challenge next, you in?',
    unreadCount: 1
  }
];