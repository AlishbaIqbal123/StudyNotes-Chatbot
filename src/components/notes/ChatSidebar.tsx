// src/components/notes/ChatSidebar.tsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, GripVertical, X } from 'lucide-react';
import { ChatMessage } from '@/types/note.types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatSidebarProps {
  history: ChatMessage[];
  loading: boolean;
  prompt: string;
  onPromptChange: (val: string) => void;
  onSendMessage: (override?: string) => void;
  isMobileOrTablet?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  history,
  loading,
  prompt,
  onPromptChange,
  onSendMessage,
  isMobileOrTablet = false,
  isOpen = false,
  onClose,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(384); // 24rem default
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Resize logic
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX.current - e.clientX; // dragging left = wider
      const newWidth = Math.min(600, Math.max(280, startWidth.current + delta));
      setWidth(newWidth);
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const suggestedPills = [
    { label: '📋 Summarize', val: 'Summarize this topic simply' },
    { label: '🔑 Key Points', val: 'What are the 5 key points?' },
    { label: '❓ Quiz Me', val: 'Ask me a quiz question about this' },
  ];

  return (
    <aside
      style={{ 
        width: isMobileOrTablet ? '320px' : `${width}px`, 
        minWidth: isMobileOrTablet ? '320px' : '280px', 
        maxWidth: isMobileOrTablet ? '320px' : '600px',
        position: isMobileOrTablet ? 'fixed' : 'relative',
        right: isMobileOrTablet ? (isOpen ? '0' : '-320px') : '0',
        top: 0,
        bottom: 0,
        height: '100%',
        zIndex: isMobileOrTablet ? 50 : 10,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      className="border-l border-border/60 flex flex-col glass-card overflow-hidden shrink-0"
    >
      {/* Resize handle — left edge */}
      {!isMobileOrTablet && (
        <div
          onMouseDown={onMouseDown}
          className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10 group"
          title="Drag to resize"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-border rounded-full group-hover:bg-primary/40 transition-colors" />
        </div>
      )}

      {/* Header */}
      <div className="pl-5 pr-4 py-4 border-b border-border/50 flex items-center justify-between shrink-0 bg-card/45 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20 shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase tracking-wider text-foreground truncate">
              Lumina Assistant
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        {isMobileOrTablet && onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 no-scrollbar">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center mb-4 shadow-sm">
              <Bot className="w-7 h-7 text-primary" />
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-foreground">Ask Lumina Assistant</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">Ask anything about your notes, request summaries, quizzes, or flashcards.</p>
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] p-3.5 rounded-2xl text-sm break-words overflow-hidden ${m.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-blue-700 text-white rounded-tr-none shadow-md shadow-primary/10 border border-primary/20'
                  : 'bg-card border border-border/80 rounded-tl-none text-foreground shadow-sm'
                }`}
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}
            >
              {m.content === 'ERROR_BUBBLE' ? (
                <div className="text-red-500 font-bold flex flex-col gap-2">
                  Something went wrong. Please try again.
                  <button onClick={() => onSendMessage()} className="text-xs underline text-left opacity-70 hover:opacity-100">
                    Retry
                  </button>
                </div>
              ) : (
                <div
                  className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:overflow-x-auto prose-table:text-xs ${m.role === 'user' ? 'prose-invert' : ''
                    }`}
                  style={{ minWidth: 0, overflow: 'hidden' }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Tables in chat — compact and scrollable
                      table: ({ children }) => (
                        <div style={{ overflowX: 'auto', margin: '0.5rem 0', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }}>
                          <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.75rem', width: '100%' }}>
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th style={{ padding: '0.4rem 0.6rem', background: 'var(--primary)', color: '#fff', fontWeight: 700, fontSize: '0.7rem', whiteSpace: 'nowrap', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid rgba(0,0,0,0.06)', borderRight: '1px solid rgba(0,0,0,0.06)', verticalAlign: 'top', wordBreak: 'break-word' }}>
                          {children}
                        </td>
                      ),
                      // Code blocks — scrollable
                      code: ({ className, children, ...props }: any) => (
                        <code
                          style={{ fontSize: '0.75rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
                          className={className}
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5 p-2 justify-start">
            {[0, 0.2, 0.4].map(delay => (
              <motion.div
                key={delay}
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border/50 space-y-3 bg-card/45 backdrop-blur-md shrink-0">
        {/* Quick pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {suggestedPills.map(p => (
            <button
              key={p.label}
              onClick={() => onSendMessage(p.val)}
              className="shrink-0 px-3.5 py-1.5 rounded-full border border-border/85 bg-card text-[10px] font-bold text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 hover:scale-105 active:scale-95 transition-all whitespace-nowrap shadow-sm"
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Input */}
        <div className="relative">
          <input
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
            placeholder="Ask anything..."
            disabled={loading}
            className="w-full bg-muted/60 focus:bg-background rounded-2xl pl-5 pr-14 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all border border-border/50 focus:border-primary/50 shadow-inner"
          />
          <button
            onClick={() => onSendMessage()}
            disabled={loading || !prompt.trim()}
            className="absolute right-2 top-2 w-9.5 h-9.5 bg-primary hover:opacity-90 text-white rounded-xl flex items-center justify-center disabled:opacity-30 shadow-md shadow-primary/20 active:scale-95 hover:scale-105 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatSidebar;
