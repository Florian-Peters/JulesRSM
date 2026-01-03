
import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Friend } from '../types';
import { CURRENT_USER, MOCK_CONVERSATIONS, MOCK_FRIENDS } from '../constants';
import { geminiService } from '../services/geminiService';

interface MessagesProps {
  onClose: () => void;
}

const Messages: React.FC<MessagesProps> = ({ onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [friends] = useState<Friend[]>(MOCK_FRIENDS);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConv?.messages]);

  const handleStartChatWithFriend = (friend: Friend) => {
    const existingConv = conversations.find(c => c.participant.id === friend.id);
    if (existingConv) {
      setActiveConvId(existingConv.id);
    } else {
      const newId = `conv_${Date.now()}`;
      const newConv: Conversation = {
        id: newId,
        participant: {
          id: friend.id,
          username: friend.username,
          avatar: friend.avatar,
        },
        messages: [],
        unreadCount: 0
      };
      setConversations([newConv, ...conversations]);
      setActiveConvId(newId);
    }
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !activeConvId) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: CURRENT_USER.id,
      text: text.trim(),
      timestamp: Date.now()
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConvId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: text.trim(),
          unreadCount: 0
        };
      }
      return conv;
    }));
    setInputText('');
  };

  const handleSmartReply = async () => {
    if (!activeConv || activeConv.messages.length === 0) return;
    setIsGeneratingReply(true);
    const lastMsg = activeConv.messages[activeConv.messages.length - 1];
    try {
      const suggestion = await geminiService.generateSmartReply(
        lastMsg.text, 
        activeConv.participant.username
      );
      setInputText(suggestion);
    } catch (error) {
      console.error("AI Reply failed", error);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col pt-[env(safe-area-inset-top)] animate-in slide-in-from-right duration-300">
      <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button onClick={activeConvId ? () => setActiveConvId(null) : onClose} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activeConvId ? "M15 19l-7-7 7-7" : "M6 18L18 6M6 6l12 12"} />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {activeConvId && (
              <div className="relative">
                <img src={activeConv?.participant.avatar} className="w-9 h-9 rounded-full border border-rose-500/20 shadow-lg shadow-rose-500/10" alt="" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
              </div>
            )}
            <h2 className="text-xl font-black italic uppercase tracking-tighter">
              {activeConvId ? activeConv?.participant.username : 'Social Inbox'}
            </h2>
          </div>
        </div>
        {!activeConvId && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md uppercase tracking-widest">Live</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col no-scrollbar">
        {!activeConvId ? (
          <div className="animate-in fade-in duration-500">
            <section className="px-6 py-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Your Friends</h3>
                <span className="text-[10px] font-bold text-rose-400">See All</span>
              </div>
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    onClick={() => handleStartChatWithFriend(friend)}
                    className="flex-shrink-0 flex flex-col items-center gap-2 group"
                  >
                    <div className="relative p-0.5 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 group-hover:scale-110 transition-transform">
                      <div className="p-0.5 bg-black rounded-full">
                        <img src={friend.avatar} className="w-16 h-16 rounded-full object-cover border border-white/10" alt="" />
                      </div>
                      {friend.isOnline && (
                        <div className="absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full border-4 border-black shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                      )}
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter truncate w-16 text-center group-hover:text-white">
                      {friend.username.split('_')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="flex-1 bg-zinc-950/50 rounded-t-[3rem] border-t border-white/5 pt-8">
              <div className="px-6 mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Recent Chats</h3>
              </div>
              <div className="divide-y divide-white/5">
                {conversations.length > 0 ? (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className="w-full px-6 py-5 flex items-center gap-4 hover:bg-zinc-900/50 transition-colors text-left group"
                    >
                      <div className="relative">
                        <img src={conv.participant.avatar} className="w-14 h-14 rounded-full border border-white/10 shadow-xl group-hover:border-rose-500/50 transition-colors" alt="" />
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 rounded-full border-4 border-black flex items-center justify-center text-[10px] font-black shadow-lg">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-bold text-base text-zinc-100 group-hover:text-white transition-colors">@{conv.participant.username}</span>
                          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Just now</span>
                        </div>
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-zinc-500'}`}>
                          {conv.lastMessage || 'Start a conversation...'}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-rose-500/0 group-hover:bg-rose-500/40 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="px-6 py-20 text-center">
                    <p className="text-zinc-600 italic text-sm font-medium">Pick a friend above to start chatting!</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4 no-scrollbar animate-in slide-in-from-bottom-2 duration-300">
            {activeConv?.messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.2em]">Say something real</p>
              </div>
            )}
            {activeConv?.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.senderId === CURRENT_USER.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-5 py-3.5 rounded-[2rem] text-sm font-semibold shadow-lg ${
                  msg.senderId === CURRENT_USER.id 
                    ? 'bg-rose-600 text-white rounded-tr-none shadow-rose-900/20' 
                    : 'bg-zinc-900 text-zinc-100 rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {activeConvId && (
        <div className="p-6 bg-black border-t border-white/5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3 bg-zinc-900/80 rounded-[2.5rem] px-4 py-2.5 border border-white/5 focus-within:border-rose-500/40 transition-all backdrop-blur-md">
            <button 
              onClick={handleSmartReply}
              disabled={isGeneratingReply}
              className="p-2.5 text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors disabled:opacity-50 active:scale-90"
              title="AI Reply Suggestion"
            >
              <svg className={`w-5 h-5 ${isGeneratingReply ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              placeholder={`Chat with @${activeConv?.participant.username}...`}
              className="flex-1 bg-transparent border-none text-white placeholder-zinc-600 focus:ring-0 text-sm py-2 font-bold"
            />
            <button 
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
              className="bg-rose-600 text-white p-2.5 rounded-full disabled:opacity-30 transition-all active:scale-90 shadow-lg shadow-rose-600/30"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
