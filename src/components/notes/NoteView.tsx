// src/components/notes/NoteView.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronRight, BrainCircuit, Zap, Layers, Mic,
  Book, Trophy, Image as ImageIcon, X, Menu, GripVertical,
  Plus, Loader2, Play, Pause, Sparkles, Volume2, VolumeX, Bot
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

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setIsMobileOrTablet(isMobile);
      if (!isMobile) {
        setIsLeftDrawerOpen(false);
        setIsRightDrawerOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generation States
  const [generatingCards, setGeneratingCards] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // Audio Lab (TTS) States
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speechProgress, setSpeechProgress] = useState(0)
  const [ttsSpeed, setTtsSpeed] = useState(1)
  const speedRef = useRef(1) // ref so speakChunk always reads latest speed
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const chunksRef = useRef<string[]>([])
  const chunkIndexRef = useRef(0)
  const totalCharsRef = useRef(0)
  const spokenCharsRef = useRef(0)
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const didStartRef = useRef(false) // guard against double-start

  // ── Dialogue line type ──────────────────────────────────────────────────────
  interface DialogueLine { speaker: 'MAYA' | 'ALEX' | 'OTHER'; text: string }

  /** Parse the podcast script into per-speaker dialogue lines (no names spoken) */
  const parseDialogue = (): DialogueLine[] => {
    const raw = note?.podcast_script || note?.simplified_notes || note?.simplified_content || ''
    const lines: DialogueLine[] = []
    for (const line of raw.split('\n')) {
      const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').trim()
      if (!clean) continue
      const maya = clean.match(/^MAYA:\s*(.+)/i)
      const alex = clean.match(/^ALEX:\s*(.+)/i)
      if (maya) lines.push({ speaker: 'MAYA', text: maya[1].trim() })
      else if (alex) lines.push({ speaker: 'ALEX', text: alex[1].trim() })
      else {
        // Non-dialogue line — strip markdown noise, skip if empty
        const stripped = clean
          .replace(/#{1,6}\s/g, '')
          .replace(/`{1,3}/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/>\s/g, '')
          .replace(/---+/g, '')
          .trim()
        if (stripped) lines.push({ speaker: 'OTHER', text: stripped })
      }
    }
    // Fallback: if no MAYA/ALEX lines found, treat whole script as plain text chunks
    if (!lines.some(l => l.speaker !== 'OTHER')) {
      const fallback = raw
        .replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '')
        .replace(/`{1,3}/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/>\s/g, '').replace(/---+/g, '').trim()
      return [{ speaker: 'MAYA', text: fallback }]
    }
    return lines
  }

  /**
   * Pick two distinct English voices — one for MAYA, one for ALEX.
   * Tries to get a female + male pair; falls back to two different voices.
   */
  const pickVoices = (all: SpeechSynthesisVoice[]): { maya: SpeechSynthesisVoice | null; alex: SpeechSynthesisVoice | null } => {
    const en = all.filter(v => v.lang.startsWith('en'))
    if (en.length === 0) return { maya: all[0] || null, alex: all[1] || null }

    // Heuristic: voices with "female"/"woman"/"zira"/"samantha"/"karen" in name → female
    const femaleHints = /female|woman|zira|samantha|karen|victoria|moira|fiona|tessa|susan|google uk english female/i
    const maleHints = /male|man|david|james|daniel|alex|google uk english male/i

    const females = en.filter(v => femaleHints.test(v.name))
    const males = en.filter(v => maleHints.test(v.name))

    // MAYA = female (or first en voice), ALEX = male (or second en voice)
    const maya = females[0] || en[0] || null
    const alex = males[0] || en.find(v => v !== maya) || en[1] || null

    return { maya, alex }
  }

  const stopKeepAlive = () => {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null }
  }

  const startKeepAlive = () => {
    stopKeepAlive()
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume()
    }, 10000)
  }

  const speakChunk = (
    voices: { maya: SpeechSynthesisVoice | null; alex: SpeechSynthesisVoice | null },
    lines: DialogueLine[],
    idx: number,
    speedMult: number
  ) => {
    const synth = window.speechSynthesis
    if (idx >= lines.length) {
      setIsSpeaking(false); setIsPaused(false); setSpeechProgress(100); stopKeepAlive(); return
    }

    const line = lines[idx]
    const utterance = new SpeechSynthesisUtterance(line.text)
    utteranceRef.current = utterance

    const voice = line.speaker === 'ALEX' ? voices.alex : voices.maya
    if (voice) utterance.voice = voice

    const baseRate = line.speaker === 'MAYA' ? 0.95 : line.speaker === 'ALEX' ? 0.88 : 0.90
    utterance.rate = Math.min(3, baseRate * speedRef.current)  // always read latest speed
    utterance.pitch = line.speaker === 'MAYA' ? 1.15 : line.speaker === 'ALEX' ? 0.88 : 1.0
    utterance.volume = line.speaker === 'OTHER' ? 0.85 : 1.0

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        const spoken = spokenCharsRef.current + e.charIndex
        setSpeechProgress(Math.min(99, Math.round((spoken / totalCharsRef.current) * 100)))
      }
    }
    utterance.onend = () => {
      spokenCharsRef.current += line.text.length
      chunkIndexRef.current = idx + 1
      speakChunk(voices, lines, idx + 1, speedMult)
    }
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error('TTS error:', e.error)
        setIsSpeaking(false); setIsPaused(false); stopKeepAlive()
      }
    }

    synth.speak(utterance)
  }

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support audio playback.')
      return
    }

    const synth = window.speechSynthesis

    if (isPaused) {
      synth.resume(); setIsPaused(false); setIsSpeaking(true); startKeepAlive(); return
    }

    synth.cancel(); stopKeepAlive()
    didStartRef.current = false

    const lines = parseDialogue()
    if (!lines.length || !lines.some(l => l.text)) {
      alert('No content available to read.'); return
    }

    chunksRef.current = lines.map(l => l.text)
    chunkIndexRef.current = 0
    spokenCharsRef.current = 0
    totalCharsRef.current = lines.reduce((s, l) => s + l.text.length, 0)

    setIsSpeaking(true); setIsPaused(false); setSpeechProgress(0)

    const currentSpeed = ttsSpeed

    const doSpeak = (allVoices: SpeechSynthesisVoice[]) => {
      if (didStartRef.current) return
      didStartRef.current = true
      const voices = pickVoices(allVoices)
      startKeepAlive()
      speakChunk(voices, lines, 0, currentSpeed)
    }

    const voices = synth.getVoices()
    if (voices.length > 0) {
      doSpeak(voices)
    } else {
      synth.onvoiceschanged = () => { synth.onvoiceschanged = null; doSpeak(synth.getVoices()) }
      setTimeout(() => doSpeak(synth.getVoices()), 400)
    }
  }

  const handlePause = () => {
    const synth = window.speechSynthesis
    if (isSpeaking && !isPaused) {
      synth.pause()
      setIsPaused(true)
      setIsSpeaking(false)
      stopKeepAlive()
    }
  }

  const handleStop = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setSpeechProgress(0)
    chunkIndexRef.current = 0
    spokenCharsRef.current = 0
    stopKeepAlive()
  }

  const handleNodeClick = (label: string) => {
    const prompt = `Can you explain the concept "${label}" from our roadmap/mindmap in detail? Please provide: 1. Core Definition, 2. Pre-requisites, 3. Detailed Explanation, and 4. A summary conclusion.`;
    handleSendMessage(prompt);
    setShowBanner(true);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      stopKeepAlive()
    }
  }, [])

  const handleSendMessage = async (override?: string) => {
    const res = await sendMessage(override || chatPrompt);
    if (res.error === "RATE_LIMIT_REACHED") setIsRateLimitOpen(true);
    if (!override) setChatPrompt('');
  };

  const handleGenerateMoreFlashcards = async () => {
    if (generatingCards) return;
    setGeneratingCards(true);
    try {
      // Get source text — try multiple fields
      const sourceText =
        note?.raw_text ||
        note?.source_text ||
        note?.simplified_content?.slice(0, 6000) ||
        note?.simplified_notes?.slice(0, 6000) ||
        note?.title ||
        "";

      if (!sourceText || sourceText.trim().length < 10) {
        console.error("No source text available for flashcard generation");
        return;
      }

      // MUST use FormData — backend expects Form fields not JSON
      const formData = new FormData();
      formData.append("source_text", sourceText);
      formData.append(
        "existing_cards",
        JSON.stringify(note?.flashcards || [])
      );

      const res = await fetch(
        `${API_BASE_URL}/generate-more-flashcards`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Server error ${res.status}:`, errorText);
        return;
      }

      const data = await res.json();

      if (data.flashcards && data.flashcards.length > 0) {
        setNote((prev: any) => ({
          ...prev,
          flashcards: [...(prev?.flashcards || []), ...data.flashcards],
        }));
      }
    } catch (err) {
      console.error("Failed to generate more flashcards:", err);
    } finally {
      setGeneratingCards(false);
    }
  };

  const handleGenerateMoreQuiz = async () => {
    if (generatingQuiz) return;
    setGeneratingQuiz(true);
    try {
      const sourceText =
        note?.raw_text ||
        note?.source_text ||
        note?.simplified_content?.slice(0, 6000) ||
        note?.simplified_notes?.slice(0, 6000) ||
        "";

      if (!sourceText || sourceText.trim().length < 10) {
        console.error("No source text available");
        return;
      }

      const formData = new FormData();
      formData.append("source_text", sourceText);
      formData.append(
        "existing_questions",
        JSON.stringify(note?.quizzes || [])
      );

      const res = await fetch(
        `${API_BASE_URL}/generate-more-quiz`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Server error ${res.status}:`, errorText);
        return;
      }

      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setNote((prev: any) => ({
          ...prev,
          quizzes: [...(prev?.quizzes || []), ...data.questions],
        }));
      }
    } catch (err) {
      console.error("Failed to generate more quiz questions:", err);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-background">Preparing your study session...</div>;
  if (error || !note) return <div className="h-screen flex items-center justify-center bg-background text-red-500">{error || 'Note not found'}</div>;

  // Notes content — strip any quiz/flashcard/podcast sections that may have leaked
  // from old backend-generated notes. New backend generates pure notes, but old stored
  // notes may still contain these sections.
  const rawNotes = (note.simplified_notes || note.simplified_content || "").trim();
  const notesContent = rawNotes
    // Remove ## Knowledge Quiz / ## [Knowledge Quiz] sections and everything after until next ##
    .replace(/^##\s*\[?Knowledge Quiz\]?[\s\S]*?(?=\n##\s|\n#\s|$)/gim, '')
    // Remove ## Recall Flashcards sections
    .replace(/^##\s*\[?Recall Flashcards\]?[\s\S]*?(?=\n##\s|\n#\s|$)/gim, '')
    // Remove ## Audio Lab Script sections
    .replace(/^##\s*\[?Audio Lab Script\]?[\s\S]*?(?=\n##\s|\n#\s|$)/gim, '')
    // Remove ## Visual Style Prompt sections
    .replace(/^##\s*\[?Visual Style Prompt\]?[\s\S]*?(?=\n##\s|\n#\s|$)/gim, '')
    // Remove ## Study Roadmap sections (these have their own tab)
    .replace(/^##\s*\[?Study Roadmap\]?[\s\S]*?(?=\n##\s|\n#\s|$)/gim, '')
    // Remove ## Concept Mind Map sections (these have their own tab)
    .replace(/^##\s*\[?Concept Mind Map\]?[\s\S]*?(?=\n##\s|\n#\s|$)/gim, '')
    // Remove pipe-separated quiz lines (Question | A | B | C | D | Answer)
    .replace(/^[^|\n]+\|[^|\n]+\|[^|\n]+\|[^|\n]+\|[^|\n]+\|[A-E]\s*$/gm, '')
    // Remove IMAGE_URL_HERE placeholder lines
    .replace(/!\[.*?\]\(IMAGE_URL_HERE\)/g, '')
    .trim();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
      <RateLimitModal isOpen={isRateLimitOpen} onClose={() => setIsRateLimitOpen(false)} upgradeUrl="https://openrouter.ai/credits" />

      {/* Backdrop for mobile drawers */}
      {isMobileOrTablet && (isLeftDrawerOpen || isRightDrawerOpen) && (
        <div 
          onClick={() => { setIsLeftDrawerOpen(false); setIsRightDrawerOpen(false); }}
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* SIDEBAR — left nav with resize handle */}
      <aside
        style={{ 
          width: isMobileOrTablet ? '280px' : (isSidebarCollapsed ? '5rem' : `${sidebarWidth}px`), 
          minWidth: isMobileOrTablet ? '280px' : (isSidebarCollapsed ? '5rem' : '180px'), 
          maxWidth: isMobileOrTablet ? '280px' : '480px',
          position: isMobileOrTablet ? 'fixed' : 'relative',
          left: isMobileOrTablet ? (isLeftDrawerOpen ? '0' : '-280px') : '0',
          top: 0,
          bottom: 0,
          height: '100%',
          zIndex: isMobileOrTablet ? 50 : 10,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="glass-card border-r border-border flex flex-col shrink-0"
      >
        <div className="flex items-center justify-between mb-8 px-6 pt-6 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform"><BookOpen className="w-5 h-5" /></div>
            {(!isSidebarCollapsed || isMobileOrTablet) && <span className="font-extrabold text-lg bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Lumina</span>}
          </Link>
          {!isMobileOrTablet && (
            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-muted/85 rounded-xl transition-colors text-muted-foreground hover:text-foreground"><Menu className="w-4 h-4" /></button>
          )}
          {isMobileOrTablet && (
            <button onClick={() => setIsLeftDrawerOpen(false)} className="p-2 hover:bg-muted/85 rounded-xl transition-colors text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-6">
          {[
            {
              title: 'Study Core',
              items: [
                { id: 'notes', label: 'Detailed Notes', icon: Book },
                { id: 'roadmap', label: 'Study Roadmap', icon: ChevronRight },
                { id: 'mindmap', label: 'Concept Map', icon: BrainCircuit },
              ]
            },
            {
              title: 'Practice & Recall',
              items: [
                { id: 'quiz', label: 'Knowledge Quiz', icon: Trophy },
                { id: 'flashcards', label: 'Flashcards', icon: Layers },
              ]
            },
            {
              title: 'Multimedia Lab',
              items: [
                { id: 'podcast', label: 'Audio Lab', icon: Mic },
                { id: 'gallery', label: 'Visual Gallery', icon: ImageIcon },
              ]
            }
          ].map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              {(!isSidebarCollapsed || isMobileOrTablet) && (
                <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as TabType);
                      if (isMobileOrTablet) setIsLeftDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-xl font-bold text-sm transition-all duration-200 relative group/btn ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-primary/95 to-primary/80 text-white shadow-md shadow-primary/10'
                        : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-accent to-secondary rounded-r-full" />
                    )}
                    <tab.icon className={`w-4 h-4 shrink-0 transition-colors ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground/80 group-hover/btn:text-foreground'}`} />
                    {(!isSidebarCollapsed || isMobileOrTablet) && <span className="truncate">{tab.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-4 border-t border-border/50 flex flex-col items-center gap-4 px-4 pb-6 shrink-0 bg-card/45">
          <ThemeToggle />
          {(!isSidebarCollapsed || isMobileOrTablet) && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-35 text-muted-foreground">
              Lumina Engine v2.0
            </span>
          )}
        </div>

        {/* Resize handle — right edge of left sidebar */}
        {!isSidebarCollapsed && !isMobileOrTablet && (
          <div
            onMouseDown={startResizing}
            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10 group"
            title="Drag to resize"
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-border rounded-full group-hover:bg-primary/40 transition-colors" />
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Sticky Mobile/Tablet Header */}
        {isMobileOrTablet && (
          <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border/50 h-16 flex items-center justify-between px-4 z-30 shrink-0">
            <button 
              onClick={() => setIsLeftDrawerOpen(true)}
              className="p-2 hover:bg-muted rounded-xl transition-colors text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm"><BookOpen className="w-4 h-4" /></div>
              <span className="font-extrabold text-base bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Lumina</span>
            </div>
            <button 
              onClick={() => setIsRightDrawerOpen(true)}
              className="p-2 hover:bg-muted rounded-xl transition-colors text-primary relative"
            >
              <Bot className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-background animate-pulse" />
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="w-full px-8 py-10" style={{ paddingLeft: 'clamp(1.25rem, 3vw, 2.5rem)', paddingRight: 'clamp(1.25rem, 3vw, 2.5rem)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Study Session</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{note.title}</h1>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.article key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-32">
                {activeTab === 'notes' && (
                  <div className={`lumina-prose ${isSidebarCollapsed ? 'full-width' : ''}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({ children }) => (
                          <h1 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '2.6rem',
                            fontWeight: 900,
                            color: 'var(--primary)',
                            borderBottom: '3px solid var(--primary)',
                            paddingBottom: '0.5rem',
                            marginTop: '3rem',
                            marginBottom: '1.5rem',
                            lineHeight: 1.2
                          }}>{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 style={{
                            fontSize: '1.9rem',
                            fontWeight: 800,
                            borderLeft: '5px solid var(--primary)',
                            paddingLeft: '1rem',
                            marginTop: '2.5rem',
                            marginBottom: '1rem',
                            color: 'var(--foreground)'
                          }}>{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 style={{
                            fontSize: '1.35rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            marginTop: '2rem',
                            marginBottom: '0.75rem',
                            letterSpacing: '0.02em'
                          }}>{children}</h3>
                        ),
                        h4: ({ children }) => (
                          <h4 style={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            fontStyle: 'italic',
                            color: 'var(--muted-foreground)',
                            marginTop: '1.5rem',
                            marginBottom: '0.5rem'
                          }}>{children}</h4>
                        ),
                        p: ({ children }) => (
                          <p style={{
                            fontSize: '1.05rem',
                            lineHeight: 1.9,
                            marginBottom: '1.25rem',
                            opacity: 0.85
                          }}>{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong style={{
                            backgroundColor: 'rgba(30, 64, 175, 0.08)',
                            color: 'var(--primary)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: 700
                          }}>{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em style={{
                            color: '#10B981',
                            fontStyle: 'italic'
                          }}>{children}</em>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote style={{
                            background: 'linear-gradient(to right, rgba(30, 64, 175, 0.06), transparent)',
                            borderLeft: '4px solid var(--secondary)',
                            padding: '0.875rem 1.25rem',
                            borderRadius: '0 0.75rem 0.75rem 0',
                            margin: '1.25rem 0',
                            fontStyle: 'italic',
                            fontSize: '0.975rem',
                            lineHeight: 1.7,
                            color: 'var(--foreground)',
                            opacity: 0.9,
                          }}>{children}</blockquote>
                        ),
                        ul: ({ children }) => (
                          <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: '1rem 0 1.5rem 0'
                          }}>{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{
                            paddingLeft: '1.5rem',
                            margin: '1rem 0 1.5rem 0',
                            counterReset: 'list-counter'
                          }}>{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            marginBottom: '0.6rem',
                            fontSize: '1rem',
                            lineHeight: 1.7,
                            opacity: 0.88
                          }}>
                            <span style={{
                              display: 'inline-block',
                              minWidth: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary)',
                              marginTop: '0.55rem',
                              flexShrink: 0
                            }} />
                            <span>{children}</span>
                          </li>
                        ),
                        table: ({ children }) => (
                          <div style={{
                            width: '100%',
                            overflowX: 'auto',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--border)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                            WebkitOverflowScrolling: 'touch',
                            margin: '1.25rem 0',
                            resize: 'horizontal',
                            overflow: 'auto',
                          }}>
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '0.875rem',
                              textAlign: 'left',
                              tableLayout: 'auto',
                               margin: 0,
                             }}>{children}</table>
                           </div>
                         ),
                         thead: ({ children }) => (
                           <thead style={{
                             backgroundColor: 'var(--sidebar-bg)',
                             color: '#ffffff',
                           }}>{children}</thead>
                         ),
                         th: ({ children }) => (
                           <th style={{
                             padding: '0.75rem 1rem',
                             fontWeight: 800,
                             fontSize: '0.72rem',
                             textTransform: 'uppercase',
                             letterSpacing: '0.06em',
                             whiteSpace: 'nowrap',
                             borderRight: '1px solid rgba(255,255,255,0.12)',
                             borderBottom: '2px solid rgba(255,255,255,0.15)',
                             color: '#ffffff',
                             position: 'relative',
                             overflow: 'hidden',
                             resize: 'horizontal',
                             minWidth: '80px',
                           }}>{children}</th>
                         ),
                         tbody: ({ children }) => (
                           <tbody>{children}</tbody>
                         ),
                         tr: ({ children }: any) => (
                           <tr style={{ borderBottom: '1px solid var(--border)' }}
                             onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--muted)')}
                             onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                           >{children}</tr>
                         ),
                         td: ({ children }) => (
                           <td style={{
                             padding: '0.875rem 1.25rem',
                             fontSize: '0.875rem',
                             verticalAlign: 'top',
                             lineHeight: 1.6,
                             borderRight: '1px solid var(--border)',
                             borderBottom: '1px solid var(--border)',
                             wordBreak: 'break-word',
                             minWidth: '100px',
                           }}>{children}</td>
                        ),
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-mermaid/.exec(className || '')
                          if (!inline && match) {
                            return (
                              <div style={{ margin: '1.75rem 0 2rem' }}>
                                <MermaidDiagram
                                  chart={String(children).replace(/\n$/, '')}
                                  onNodeClick={handleNodeClick}
                                />
                              </div>
                            )
                          }
                          if (!inline) {
                            // Extract language label from className e.g. "language-python"
                            const lang = (className || '').replace('language-', '').trim()
                            return (
                              <div style={{
                                margin: '0.65rem 0 0.85rem',
                                borderRadius: '0.6rem',
                                overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 3px 12px rgba(0,0,0,0.12)',
                              }}>
                                {/* Code block header bar */}
                                <div style={{
                                  background: '#161b22',
                                  padding: '0.3rem 0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                  {/* Traffic-light dots */}
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                                  {lang && (
                                    <span style={{
                                      marginLeft: 'auto',
                                      fontSize: '0.6rem',
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.1em',
                                      color: 'rgba(255,255,255,0.35)',
                                      fontFamily: 'monospace',
                                    }}>{lang}</span>
                                  )}
                                </div>
                                {/* Code body */}
                                <div style={{
                                  background: '#0d1117',
                                  padding: '0.55rem 0.8rem',
                                  overflowX: 'auto',
                                  maxHeight: '380px',
                                  overflowY: 'auto',
                                }}>
                                  <code style={{
                                    color: '#e6edf3',
                                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                                    fontSize: '0.78rem',
                                    lineHeight: 1.5,
                                    display: 'block',
                                    whiteSpace: 'pre',
                                  }} {...props}>{children}</code>
                                </div>
                              </div>
                            )
                          }
                          // Inline code
                          return (
                            <code style={{
                              backgroundColor: 'rgba(124,58,237,0.07)',
                              color: 'var(--primary)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontFamily: "'Fira Code', 'Consolas', monospace",
                              fontSize: '0.82em',
                              border: '1px solid rgba(124,58,237,0.15)',
                            }} {...props}>{children}</code>
                          )
                        },
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer"
                            style={{
                              color: 'var(--primary)',
                              fontWeight: 600,
                              textDecoration: 'underline',
                              textDecorationColor: 'rgba(124,58,237,0.3)'
                            }}
                          >{children}</a>
                        ),
                        hr: () => (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            margin: '1.75rem 0',
                          }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                          </div>
                        ),
                      }}
                    >
                      {notesContent}
                    </ReactMarkdown>
                  </div>
                )}

                {activeTab === 'roadmap' && <div className="bg-card border rounded-[2rem] p-8 shadow-sm"><MermaidDiagram chart={note.roadmap} onNodeClick={handleNodeClick} /></div>}
                {activeTab === 'mindmap' && <div className="bg-card border rounded-[2rem] p-8 shadow-sm"><MermaidDiagram chart={note.mind_map} onNodeClick={handleNodeClick} /></div>}
                {activeTab === 'quiz' && (
                  <div className="space-y-10">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Knowledge Quiz
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {note.quizzes?.length || 0} questions — select an answer to check
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateMoreQuiz}
                        disabled={generatingQuiz}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {generatingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        More Questions
                      </button>
                    </div>

                    {/* Empty state */}
                    {(!note.quizzes || note.quizzes.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                          <Trophy className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-bold text-lg mb-2">No quiz questions yet</p>
                        <p className="text-muted-foreground text-sm mb-6">Click "More Questions" to generate a quiz for this note.</p>
                      </div>
                    )}

                    <QuizSection quizzes={note.quizzes || []} />
                  </div>
                )}

                {activeTab === 'flashcards' && (
                  <div className="space-y-10">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                          Flashcard Deck
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {note.flashcards?.length || 0} cards — click any card to flip
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateMoreFlashcards}
                        disabled={generatingCards}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {generatingCards ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        More Cards
                      </button>
                    </div>

                    {/* Empty state */}
                    {(!note.flashcards || note.flashcards.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                          <Layers className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-bold text-lg mb-2">No flashcards yet</p>
                        <p className="text-muted-foreground text-sm mb-6">Click "More Cards" to generate flashcards for this note.</p>
                      </div>
                    )}

                    {/* Card grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(note.flashcards || []).map((card, i) => (
                        <motion.div
                          key={i}
                          className="cursor-pointer"
                          style={{ perspective: '1200px', height: '200px' }}
                          onClick={() => setFlippedCards(prev => ({ ...prev, [i]: !prev[i] }))}
                        >
                          <motion.div
                            animate={{ rotateY: flippedCards[i] ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                            style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                          >
                            {/* Front */}
                            <div
                              style={{ backfaceVisibility: 'hidden' }}
                              className="absolute inset-0 bg-card border-2 border-border hover:border-primary/30 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm transition-colors"
                            >
                              <span className="text-[9px] font-black uppercase tracking-widest text-primary/50">Concept</span>
                              <p className="font-bold text-base leading-snug text-center">{card.front}</p>
                              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 text-center">Tap to reveal</span>
                            </div>
                            {/* Back */}
                            <div
                              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                              className="absolute inset-0 bg-primary rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl"
                            >
                              <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Answer</span>
                              <p className="font-bold text-base leading-snug text-center text-white">{card.back}</p>
                              <div className="h-1 w-10 bg-white/20 rounded-full mx-auto" />
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'podcast' && (
                  <div className="max-w-2xl mx-auto py-12 px-4">
                    {/* Player Card */}
                    <div style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '2rem',
                      padding: '3rem',
                      textAlign: 'center',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: '100px', height: '100px',
                        background: isSpeaking
                          ? 'linear-gradient(135deg, var(--primary), #a78bfa)'
                          : 'var(--foreground)',
                        borderRadius: '2rem',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        transition: 'all 0.3s ease',
                        boxShadow: isSpeaking
                          ? '0 0 40px rgba(124,58,237,0.4)'
                          : 'none'
                      }}>
                        <Mic style={{
                          width: '40px', height: '40px',
                          color: isSpeaking ? '#fff' : 'var(--primary)',
                          animation: isSpeaking ? 'pulse 1s infinite' : 'none'
                        }} />
                      </div>

                      {/* Title */}
                      <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.75rem', fontWeight: 800,
                        marginBottom: '0.5rem'
                      }}>
                        {isSpeaking ? 'Now Playing...' : isPaused ? 'Paused' : 'Audio Summary'}
                      </h2>
                      <p style={{
                        color: 'var(--muted-foreground)',
                        fontSize: '0.875rem',
                        marginBottom: '2rem'
                      }}>
                        {note?.podcast_script
                          ? 'Podcast script ready'
                          : 'Reading study notes aloud'}
                      </p>

                      {/* Progress Bar */}
                      <div style={{
                        background: 'var(--muted)',
                        borderRadius: '999px',
                        height: '6px',
                        margin: '0 0 2rem',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: 'var(--primary)',
                          height: '100%',
                          width: `${speechProgress}%`,
                          borderRadius: '999px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>

                      {/* Controls */}
                      <div style={{
                        display: 'flex', gap: '1rem',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        {/* Stop */}
                        <button onClick={handleStop}
                          disabled={!isSpeaking && !isPaused}
                          style={{
                            width: '48px', height: '48px',
                            borderRadius: '50%',
                            border: '2px solid var(--border)',
                            background: 'transparent',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: (!isSpeaking && !isPaused) ? 0.4 : 1
                          }}>
                          <VolumeX style={{ width: '20px', height: '20px' }} />
                        </button>

                        {/* Play / Pause main button */}
                        <button
                          onClick={isSpeaking ? handlePause : handlePlay}
                          style={{
                            width: '72px', height: '72px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            border: 'none',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                            transition: 'transform 0.15s ease'
                          }}
                          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          {isSpeaking ? (
                            <Pause style={{ width: '28px', height: '28px', color: '#fff' }} />
                          ) : (
                            <Play style={{ width: '28px', height: '28px', color: '#fff', marginLeft: '4px' }} />
                          )}
                        </button>

                        {/* Resume if paused */}
                        {isPaused && (
                          <button onClick={handlePlay}
                            style={{
                              width: '48px', height: '48px',
                              borderRadius: '50%',
                              border: '2px solid var(--primary)',
                              background: 'transparent',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'var(--primary)'
                            }}>
                            <Volume2 style={{ width: '20px', height: '20px' }} />
                          </button>
                        )}
                      </div>

                      {/* Speed selector */}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem' }}>
                        {[0.75, 1, 1.25, 1.5, 2].map(s => (
                          <button
                            key={s}
                            onClick={() => { setTtsSpeed(s); speedRef.current = s; }}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '0.5rem',
                              border: ttsSpeed === s ? '2px solid var(--primary)' : '2px solid var(--border)',
                              background: ttsSpeed === s ? 'var(--primary)' : 'transparent',
                              color: ttsSpeed === s ? '#fff' : 'var(--muted-foreground)',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {s}×
                          </button>
                        ))}
                      </div>

                      {/* Progress text */}
                      {(isSpeaking || isPaused || speechProgress > 0) && (
                        <p style={{
                          marginTop: '1rem',
                          fontSize: '0.8rem',
                          color: 'var(--muted-foreground)'
                        }}>
                          {speechProgress}% complete
                          {isPaused ? ' — Paused' : ''}
                        </p>
                      )}
                    </div>

                    {/* Script Preview */}
                    {note?.podcast_script && (
                      <div style={{
                        marginTop: '2rem',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '1.5rem',
                        padding: '2rem',
                        maxHeight: '420px',
                        overflowY: 'auto',
                        textAlign: 'left'
                      }}>
                        <p style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.15em',
                          color: 'var(--primary)',
                          marginBottom: '1.5rem'
                        }}>Podcast Script</p>

                        {/* Render each line as a styled dialogue bubble */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                          {note.podcast_script
                            .split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0)
                            .map((line, idx) => {
                              // Strip markdown bold markers: **MAYA:** text → speaker + text
                              const cleaned = line.replace(/\*\*/g, '')
                              const mayaMatch = cleaned.match(/^MAYA:\s*(.+)/)
                              const alexMatch = cleaned.match(/^ALEX:\s*(.+)/)

                              if (mayaMatch) {
                                  return (
                                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                      <span style={{
                                        flexShrink: 0,
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        color: 'var(--primary)',
                                        background: 'rgba(124,58,237,0.08)',
                                        border: '1px solid rgba(124,58,237,0.2)',
                                        borderRadius: '0.5rem',
                                        padding: '0.2rem 0.5rem',
                                        marginTop: '0.15rem',
                                        minWidth: '52px',
                                        textAlign: 'center'
                                      }}>MAYA</span>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.7, margin: 0, opacity: 0.9 }}>
                                      {mayaMatch[1]}
                                    </p>
                                  </div>
                                )
                              }

                              if (alexMatch) {
                                return (
                                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <span style={{
                                      flexShrink: 0,
                                      fontSize: '0.65rem',
                                      fontWeight: 900,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.08em',
                                      color: '#ffffff',
                                      background: '#1a1a2e',
                                      borderRadius: '0.5rem',
                                      padding: '0.2rem 0.5rem',
                                      marginTop: '0.15rem',
                                      minWidth: '52px',
                                      textAlign: 'center'
                                    }}>ALEX</span>
                                    <p style={{ fontSize: '0.9rem', lineHeight: 1.7, margin: 0, opacity: 0.9 }}>
                                      {alexMatch[1]}
                                    </p>
                                  </div>
                                )
                              }

                              // Non-dialogue line (stage direction, blank separator, etc.)
                              return (
                                <p key={idx} style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--muted-foreground)',
                                  fontStyle: 'italic',
                                  margin: 0,
                                  paddingLeft: '0.5rem',
                                  borderLeft: '2px solid var(--border)'
                                }}>
                                  {cleaned}
                                </p>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'gallery' && <GallerySection content={notesContent} />}
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </main >

      <ChatSidebar 
        history={history} 
        loading={chatLoading} 
        prompt={chatPrompt} 
        onPromptChange={setChatPrompt} 
        onSendMessage={handleSendMessage}
        isMobileOrTablet={isMobileOrTablet}
        isOpen={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
      />

      {/* Floating Action Button for Chat on Mobile */}
      {isMobileOrTablet && !isRightDrawerOpen && (
        <button
          onClick={() => setIsRightDrawerOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-30 border border-primary/20"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-card" />
        </button>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .flashcard-scene { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; }
        .flipped { transform: rotateY(180deg); }
        ::selection { background: var(--primary); color: #fff; }
        ::-moz-selection { background: var(--primary); color: #fff; }

        .lumina-prose { max-width: 72ch; transition: max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
        .lumina-prose.full-width { max-width: 100%; }

        /* Nested list indent levels */
        .lumina-prose ul ul li span:first-child { 
          background: transparent; 
          border: 2px solid var(--primary); 
        }
        .lumina-prose ul ul ul li span:first-child { 
          background: transparent;
          border: none;
          width: 4px; height: 4px;
          background-color: var(--secondary);
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div >
  );
}
