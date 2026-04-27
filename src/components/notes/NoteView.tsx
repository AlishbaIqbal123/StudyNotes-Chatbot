// src/components/notes/NoteView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronRight, BrainCircuit, Zap, Layers, Mic,
  Book, Trophy, Image as ImageIcon, X, Menu, GripVertical,
  Plus, Loader2
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { useNoteData } from '@/hooks/useNoteData';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useResizableSidebar } from '@/hooks/useResizableSidebar';

import { studyApi } from '@/lib/api';
import MermaidDiagram from './MermaidDiagram';
import ChatSidebar from './ChatSidebar';
import QuizSection from './QuizSection';
import GallerySection from './GallerySection';
import RateLimitModal from './RateLimitModal';
import ThemeToggle from '@/components/theme/ThemeToggle';

import 'katex/dist/katex.min.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://Alishba-1342-lumina-backend.hf.space';
type TabType = 'notes' | 'roadmap' | 'mindmap' | 'quiz' | 'flashcards' | 'podcast' | 'gallery';

export default function NoteView({ id }: { id: string }) {
  const { note, loading, error, setNote } = useNoteData(id);
  const { history, loading: chatLoading, sendMessage } = useChatHistory(note?.simplified_notes || note?.simplified_content || '');
  const { width: sidebarWidth, startResizing } = useResizableSidebar(288, 200, 480);
  
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [chatPrompt, setChatPrompt] = useState('');
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Generation States
  const [generatingCards, setGeneratingCards] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const expiry = parseInt(localStorage.getItem('lumina_rate_limit_ts') || '0');
    if (expiry > Date.now()) setShowBanner(true);
  }, []);

  const handleSendMessage = async (override?: string) => {
    const res = await sendMessage(override || chatPrompt);
    if (res.error === "RATE_LIMIT_REACHED") {
      setIsRateLimitOpen(true);
    }
    if (!override) setChatPrompt('');
  };

  const handleGenerateMoreFlashcards = async () => {
    if (generatingCards) return;
    setGeneratingCards(true);
    try {
      const formData = new FormData();
      formData.append('source_text', note?.source_text || note?.simplified_notes || '');
      formData.append('existing_cards', JSON.stringify(note?.flashcards || []));
      const res = await fetch(`${API_BASE_URL}/generate-more-flashcards`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.flashcards) {
        setNote(prev => prev ? ({
          ...prev,
          flashcards: [...(prev.flashcards || []), ...data.flashcards]
        }) : null);
      }
    } catch (err) {
      console.error('Failed to generate more flashcards:', err);
    } finally {
      setGeneratingCards(false);
    }
  };

  const handleGenerateMoreQuiz = async () => {
    if (generatingQuiz) return;
    setGeneratingQuiz(true);
    try {
      const formData = new FormData();
      formData.append('source_text', note?.source_text || note?.simplified_notes || '');
      formData.append('existing_questions', JSON.stringify(note?.quizzes || []));
      const res = await fetch(`${API_BASE_URL}/generate-more-quiz`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.questions) {
        setNote(prev => prev ? ({
          ...prev,
          quizzes: [...(prev.quizzes || []), ...data.questions]
        }) : null);
      }
    } catch (err) {
      console.error('Failed to generate more questions:', err);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const toggleFlip = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background text-muted-foreground font-medium">Preparing your study session...</div>;
  if (error || !note) return <div className="h-screen flex items-center justify-center bg-background text-red-500 font-bold">{error || 'Note not found'}</div>;

  const notesContent = note.simplified_notes || note.simplified_content || "";

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <RateLimitModal 
        isOpen={isRateLimitOpen} 
        onClose={() => setIsRateLimitOpen(false)} 
        upgradeUrl="https://openrouter.ai/credits" 
      />

      {/* ── LEFT SIDEBAR ── */}
      <aside 
        style={{ width: isSidebarCollapsed ? '5rem' : `${sidebarWidth}px` }}
        className="bg-card border-r border-border flex flex-col p-6 transition-all duration-300 ease-in-out relative group overflow-visible"
      >
        {!isSidebarCollapsed && (
          <div 
            onMouseDown={startResizing}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors z-50"
          >
            <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}

        <div className={`flex ${isSidebarCollapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'} mb-10 overflow-visible`}>
          <Link 
            href="/dashboard" 
            className="flex items-center gap-3 shrink-0 overflow-visible"
            title={isSidebarCollapsed ? "Return to Gallery" : ""}
          >
            <div className="w-10 h-10 bg-[#E60023] rounded-xl flex items-center justify-center text-white shadow-xl shadow-red-500/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-black text-lg tracking-tighter whitespace-nowrap overflow-hidden">
                Lumina
              </span>
            )}
          </Link>
          
          <div className="flex items-center gap-2">
            {!isSidebarCollapsed && <ThemeToggle />}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {isSidebarCollapsed && (
          <div className="flex justify-center mb-6 overflow-visible">
            <ThemeToggle />
          </div>
        )}

        <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar overflow-x-hidden">
          {[
            { id: 'notes', label: 'Detailed Notes', icon: Book },
            { id: 'roadmap', label: 'Study Roadmap', icon: ChevronRight },
            { id: 'mindmap', label: 'Concept Map', icon: BrainCircuit },
            { id: 'quiz', label: 'Knowledge Quiz', icon: Trophy },
            { id: 'flashcards', label: 'Flashcards', icon: Layers },
            { id: 'podcast', label: 'Audio Lab', icon: Mic },
            { id: 'gallery', label: 'Visual Gallery', icon: ImageIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              title={isSidebarCollapsed ? tab.label : ""}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all duration-300 relative group overflow-hidden ${
                activeTab === tab.id ? 'bg-[#E60023] text-white shadow-lg shadow-red-500/20' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && (
                <span className="truncate whitespace-nowrap overflow-hidden">
                  {tab.label}
                </span>
              )}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-border z-50">
                  {tab.label}
                </div>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        {showBanner && (
          <div className="bg-yellow-400 p-3 flex items-center justify-between px-8 text-orange-900 font-bold text-sm sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI generation is paused for today. Existing notes are fully accessible.
            </div>
            <button onClick={() => setShowBanner(false)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto p-12">
            {/* Title Section Replacement */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-4">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {note.source_type || 'Document'} Study Session
                </span>
              </div>
              <h1 
                className="text-4xl lg:text-6xl font-black tracking-tight leading-tight break-words text-foreground"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {note.title}
              </h1>
              <div 
                className="mt-4 h-1 rounded-full bg-primary"
                style={{ 
                  width: '80px',
                  animation: 'expandWidth 0.8s ease forwards 0.3s',
                  transform: 'scaleX(0)',
                  transformOrigin: 'left'
                }} 
              />
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.article 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="article-container pb-[8rem] overflow-y-visible"
              >
                {activeTab === 'notes' && (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      // Table Components Replacement
                      table: ({ children }) => (
                        <div className="my-8 w-full overflow-x-auto rounded-2xl border border-border shadow-md">
                          <table className="w-full border-collapse text-sm text-left">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-5 py-4 font-black uppercase tracking-wider text-xs border-b border-white/20">
                          {children}
                        </th>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-border">
                          {children}
                        </tbody>
                      ),
                      tr: ({ children, ...props }: any) => (
                        <tr className="even:bg-muted/30 hover:bg-primary/5 transition-colors">
                          {children}
                        </tr>
                      ),
                      td: ({ children }) => (
                        <td className="px-5 py-4 text-sm opacity-85">
                          {children}
                        </td>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-[2.8rem] font-[900] text-[#E60023] border-b-[3px] border-[#E60023] pb-[0.5rem] mt-[3rem] mb-[1.5rem] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-[2rem] font-[800] border-l-[4px] border-[#E60023] pl-[1rem] mt-[2.5rem] mb-[1rem] text-foreground leading-snug">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-[1.4rem] font-[700] text-muted-foreground tracking-[0.05em] uppercase mt-[2rem] mb-[0.75rem]">{children}</h3>
                      ),
                      p: ({ children }) => <p className="text-[1.05rem] leading-[1.9] opacity-85 mb-[1.25rem] max-w-[72ch]">{children}</p>,
                      strong: ({ children }) => <strong className="bg-[#FFF3CD] text-[#E60023] px-[4px] py-0 rounded-[3px] font-bold">{children}</strong>,
                      blockquote: ({ children }) => (
                        <blockquote className="bg-gradient-to-r from-[#E6002305] to-transparent border-l-[4px] border-[#E60023] p-[1.5rem] pl-[2rem] rounded-r-[1rem] italic text-[1.1rem] text-[#E60023] my-[1.5rem]" style={{ fontFamily: "'Playfair Display', serif" }}>{children}</blockquote>
                      ),
                      ul: ({ children }) => <ul className="space-y-4 my-6 markdown-ul">{children}</ul>,
                      li: ({ children, node }: any) => {
                        const isOrdered = (node?.parent as any)?.tagName === 'ol' || (node as any).ordered;
                        const index = (node as any).index || 0;
                        return (
                          <li className="flex items-start gap-4 text-[1rem] mb-4">
                            <span className={`mt-1.5 shrink-0 text-[#E60023] font-black ${isOrdered ? '' : 'bullet-icon'}`}>{isOrdered ? `${index+1}.` : ''}</span>
                            <div className="flex-1">{children}</div>
                          </li>
                        );
                      },
                      code: ({ node, className, children }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        if (match?.[1] === 'mermaid') return <MermaidDiagram chart={String(children)} />;
                        return <code className="bg-[#E6002310] text-[#E60023] px-[6px] py-[2px] rounded-[4px] font-mono text-sm font-bold">{children}</code>;
                      }
                    }}
                  >
                    {notesContent}
                  </ReactMarkdown>
                )}

                {activeTab === 'roadmap' && <MermaidDiagram chart={note.roadmap} />}
                {activeTab === 'mindmap' && <MermaidDiagram chart={note.mind_map} />}
                
                {activeTab === 'quiz' && (
                  <div className="space-y-6">
                    <QuizSection quizzes={note.quizzes} />
                    <div className="flex justify-center pt-10">
                      <button 
                        onClick={handleGenerateMoreQuiz}
                        disabled={generatingQuiz}
                        className="flex items-center gap-2 px-8 py-4 rounded-full border-2 border-[#E60023] text-[#E60023] font-black hover:bg-[#E60023] hover:text-white transition-all duration-300 disabled:opacity-50"
                      >
                        {generatingQuiz ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {generatingQuiz ? "Generating..." : "+ Generate 10 More Questions"}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'flashcards' && (
                  <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {note.flashcards.map((card, i) => (
                        <div key={i} className="flashcard-scene h-64 group cursor-pointer" onClick={() => toggleFlip(i)}>
                          <div className={`flashcard-card w-full h-full ${flippedCards[i] ? 'flipped' : ''}`}>
                            {/* FRONT */}
                            <div className="flashcard-face flashcard-front bg-card border-2 border-border rounded-[2.5rem] p-10 flex flex-col justify-center items-center shadow-lg group-hover:border-primary transition-colors">
                              <span className="absolute top-6 right-8 text-xs font-black opacity-30">{i + 1} / {note.flashcards.length}</span>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 opacity-40">Concept</h4>
                              <p className="font-bold text-xl text-center leading-tight">{card.front}</p>
                              <span className="absolute bottom-6 text-[10px] font-black text-muted-foreground opacity-30 uppercase tracking-widest">Click to reveal</span>
                            </div>
                            {/* BACK */}
                            <div className="flashcard-face flashcard-back bg-[#E60023] text-white rounded-[2.5rem] p-10 flex flex-col justify-center items-center shadow-2xl">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4">Definition</h4>
                              <p className="font-bold text-lg text-center leading-relaxed">{card.back}</p>
                              <span className="absolute bottom-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Click to flip back</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center">
                      <button 
                        onClick={handleGenerateMoreFlashcards}
                        disabled={generatingCards}
                        className="flex items-center gap-2 px-8 py-4 rounded-full border-2 border-[#E60023] text-[#E60023] font-black hover:bg-[#E60023] hover:text-white transition-all duration-300 disabled:opacity-50"
                      >
                        {generatingCards ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        {generatingCards ? "Generating..." : "+ Generate 10 More Flashcards"}
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'gallery' && <GallerySection content={notesContent} />}
                {activeTab === 'podcast' && (
                  <div className="bg-card border-2 border-border rounded-[3rem] p-12 italic shadow-xl leading-[2] text-lg font-medium opacity-90" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {note.podcast_script || "Audio script not available."}
                  </div>
                )}
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <ChatSidebar 
        history={history}
        loading={chatLoading}
        prompt={chatPrompt}
        onPromptChange={setChatPrompt}
        onSendMessage={handleSendMessage}
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .flashcard-scene { perspective: 1000px; }
        .flashcard-card { 
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); 
          transform-style: preserve-3d; 
          position: relative; 
          width: 100%;
          height: 100%;
        }
        .flashcard-card.flipped { transform: rotateY(180deg); }
        .flashcard-face { 
          backface-visibility: hidden; 
          position: absolute; 
          inset: 0; 
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .flashcard-back { transform: rotateY(180deg); }
        .bullet-icon::before { content: '●'; }

        ::selection {
          background-color: #E60023;
          color: #ffffff;
        }
        ::-moz-selection {
          background-color: #E60023;
          color: #ffffff;
        }

        @keyframes expandWidth {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
