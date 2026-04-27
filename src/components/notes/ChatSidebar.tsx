// src/components/notes/ChatSidebar.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send } from 'lucide-react';
import { ChatMessage } from '@/types/note.types';

interface ChatSidebarProps {
  history: ChatMessage[];
  loading: boolean;
  prompt: string;
  onPromptChange: (val: string) => void;
  onSendMessage: (override?: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  history, 
  loading, 
  prompt, 
  onPromptChange, 
  onSendMessage 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const suggestedPills = [
    { label: "📋 Summarize", val: "Summarize this topic simply" },
    { label: "🔑 Key Points", val: "What are the 5 key points?" },
    { label: "❓ Quiz Me", val: "Ask me a quiz question about this" }
  ];

  return (
    <aside className="w-96 border-l border-border flex flex-col bg-card overflow-hidden">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <Bot className="w-5 h-5 text-[#E60023]" />
        <span className="font-black text-xs uppercase tracking-widest text-foreground">Lumina Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
              m.role === 'user' 
              ? 'bg-[#E60023] text-white rounded-tr-none shadow-lg shadow-red-500/10' 
              : 'bg-muted rounded-tl-none border border-border/50 text-foreground'
            }`}>
              {m.content === "ERROR_BUBBLE" ? (
                <div className="text-red-500 font-bold flex flex-col gap-2">
                  Something went wrong.
                  <button onClick={() => onSendMessage()} className="text-xs underline text-left">Try Again</button>
                </div>
              ) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5 p-2">
            {[0, 0.2, 0.4].map(delay => (
              <motion.div 
                key={delay}
                animate={{ y: [0, -4, 0] }} 
                transition={{ repeat: Infinity, duration: 0.6, delay }} 
                className="w-2 h-2 rounded-full bg-[#E60023]" 
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-6 border-t border-border space-y-4 bg-card/50 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {suggestedPills.map(p => (
            <button 
              key={p.label}
              onClick={() => onSendMessage(p.val)}
              className="shrink-0 px-4 py-2 rounded-full border border-border bg-background text-[10px] font-black uppercase tracking-widest hover:border-[#E60023] hover:text-[#E60023] transition-all"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input 
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSendMessage()}
            placeholder="Ask anything..."
            disabled={loading}
            className="w-full bg-muted rounded-2xl pl-6 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E60023]/20 disabled:opacity-50 transition-all border border-transparent focus:border-[#E60023]/30"
          />
          <button 
            onClick={() => onSendMessage()}
            disabled={loading || !prompt.trim()}
            className="absolute right-2 top-2 w-10 h-10 bg-[#E60023] text-white rounded-xl flex items-center justify-center disabled:opacity-30 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
