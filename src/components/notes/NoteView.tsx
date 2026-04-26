//src/components/notes/NoteView.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronRight, BrainCircuit, Zap, Layers, Mic,
  MessageSquare, Share2, Download, CheckCircle, CheckCircle2, XCircle,
  Volume2, VolumeX, Bot, Send, Brain, X, Sparkles, RotateCcw, Minus,
  Search, Book, PenTool, Trophy, Menu, Plus, Clock, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { studyApi } from '@/lib/api';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
// Markdown plugins for GFM, Math, and KaTeX rendering
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import 'katex/dist/katex.min.css';
import ThemeToggle from '../theme/ThemeToggle';

// Initialize Mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      primaryColor: '#E60023',
      primaryTextColor: '#fff',
      primaryBorderColor: '#E60023',
      lineColor: '#E60023',
      secondaryColor: '#5E7B5A',
      tertiaryColor: '#fff',
    },
    securityLevel: 'loose',
    fontFamily: "'Space Grotesk', sans-serif",
  });
}

// Global styles for Mermaid and Visuals
const GlobalVisualStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .mermaid svg {
      font-family: 'Space Grotesk', sans-serif !important;
      max-width: 100% !important;
      height: auto !important;
      cursor: grab;
    }
    .mermaid svg:active {
      cursor: grabbing;
    }
    .mermaid .node rect, .mermaid .node circle, .mermaid .node polygon, .mermaid .node path {
      stroke-width: 2px !important;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));
    }
    .mermaid .edgePath path {
      stroke: #E60023 !important;
      stroke-width: 2.5px !important;
      opacity: 0.6;
    }
    .mermaid .marker {
      fill: #E60023 !important;
      stroke: #E60023 !important;
    }
    .mermaid .nodeLabel {
      font-weight: 600 !important;
      color: #1a1a1a !important;
      font-size: 14px !important;
    }
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.8; }
    }
    .skeleton-box {
      animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .mermaid .node, .mermaid .clickable {
      cursor: pointer !important;
    }
    .mermaid svg * {
      pointer-events: all !important;
    }
    .mermaid .node:hover rect, .mermaid .node:hover circle, .mermaid .node:hover polygon, .mermaid .node:hover path {
      stroke: #10b981 !important;
      stroke-width: 3px !important;
      filter: brightness(1.1);
    }
    .lumina-prose {
      color: var(--foreground);
    }
    .lumina-prose p {
      margin-bottom: 2rem;
    }
  `}} />
);


const sanitizeMermaid = (chart: string) => {
  if (!chart) return '';
  let sanitized = chart.trim();
  const validKeywords = ['graph', 'flowchart', 'mindmap', 'sequenceDiagram', 'gantt', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'pie', 'gitGraph'];
  const firstWord = sanitized.split(/\s+/)[0];
  if (!validKeywords.includes(firstWord)) {
    sanitized = `flowchart TD\n${sanitized}`;
  }
  sanitized = sanitized.replace(/```mermaid/g, '').replace(/```/g, '');
  if ((sanitized.startsWith('graph') || sanitized.startsWith('flowchart')) && !sanitized.includes('classDef')) {
    sanitized += `
    classDef start fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px;
    classDef process fill:#6366f1,stroke:#4f46e5,color:#fff,stroke-width:1px;
    classDef decision fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px;
    classDef endNode fill:#ef4444,stroke:#dc2626,color:#fff,stroke-width:2px;
    `;
  }
  return sanitized;
};

const Mermaid = ({ chart, onNodeClick }: { chart: string, onNodeClick?: (label: string) => void }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      const sanitized = sanitizeMermaid(chart);
      if (!sanitized || typeof window === 'undefined') return;
      
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'loose',
        fontFamily: "'Space Grotesk', sans-serif",
        themeVariables: {
          primaryColor: '#10b981',
          primaryTextColor: '#1a1a1a',
          primaryBorderColor: '#059669',
          lineColor: '#6366f1',
          secondaryColor: '#f9f9f9',
          tertiaryColor: '#fff',
          fontSize: '16px',
          mainBkg: '#ffffff',
          nodeBorder: '#e2e8f0',
        }
      });

      const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
      try {
        const { svg } = await mermaid.render(id, sanitized);
        if (isMounted) {
          setSvg(svg);
          setError(false);
        }
      } catch (err) {
        console.error('Mermaid failed:', err);
        if (isMounted) setError(true);
      }
    };
    renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 3));
    }
  };

  const isActuallyDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isActuallyDragging.current = false;
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      isActuallyDragging.current = true;
    }
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only block if we've moved significantly
    if (isActuallyDragging.current) {
      return;
    }
    
    const target = e.target as HTMLElement;
    // Extremely inclusive search for any mermaid node or label
    const node = target.closest('.node, .mindmap-node, .clickable, .label-container, [id^="flowchart-"], [id^="mindmap-"], [class*="node"]');
    
    if (node && onNodeClick) {
      // Direct label extraction
      const label = node.querySelector('.nodeLabel, .label, text, span, div')?.textContent || node.textContent;
      if (label && label.trim()) {
        onNodeClick(label.trim());
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="mermaid-container relative my-12 group overflow-hidden rounded-[2.5rem] border border-border/50 bg-card shadow-sm p-8"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controls Overlay */}
      <div className="absolute top-6 right-8 flex items-center gap-2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.2, 3)); }} 
          className="w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center pointer-events-auto"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.2, 0.5)); }} 
          className="w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center pointer-events-auto"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button 
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setZoom(1); setPosition({ x: 0, y: 0 }); }} 
          className="w-10 h-10 rounded-full bg-background/90 backdrop-blur border border-border shadow-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center pointer-events-auto"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!svg && !error ? (
          <motion.div 
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-[300px] flex flex-col items-center justify-center gap-4"
          >
            <div className="w-48 h-48 rounded-full bg-primary/5 skeleton-box" />
            <div className="w-64 h-4 bg-primary/5 rounded-full skeleton-box" />
          </motion.div>
        ) : error ? (
          <div className="py-20 text-center opacity-40 italic">Visual synthesis temporarily unavailable</div>
        ) : (
          <motion.div 
            key="svg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: zoom,
              x: position.x,
              y: position.y
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ 
              transformOrigin: 'center center'
            }}
            dangerouslySetInnerHTML={{ __html: svg }} 
            className="mermaid flex justify-center cursor-pointer"
            onPointerUp={handleContainerClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
};


const SmartImage = ({ src, alt }: { src: string, alt?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [error, setError] = useState(false);
  
  const fallback = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1080&auto=format&fit=crop";

  return (
    <div className="my-12 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative cursor-zoom-in overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white/10"
        onClick={() => setZoomed(true)}
      >
        <div className={`absolute inset-0 bg-muted transition-opacity duration-700 ${isLoaded ? 'opacity-0' : 'opacity-100'}`} />
        <motion.img 
          layoutId={`img-${src}`}
          src={error ? fallback : src} 
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={`w-full transition-all duration-1000 ${isLoaded ? 'scale-100 blur-0' : 'scale-110 blur-xl'}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
          <div className="text-white">
            <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-70">Focus Insight</p>
            <p className="text-lg font-bold">{alt || 'Visual Synthesis'}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Lightbox */}
      <AnimatePresence>
        {zoomed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-10 cursor-zoom-out"
            onClick={() => setZoomed(false)}
          >
            <motion.img 
              layoutId={`img-${src}`}
              src={error ? fallback : src}
              className="max-w-full max-h-full rounded-3xl shadow-2xl"
            />
            <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">
              <X className="w-10 h-10" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function NoteView({ id }: { id: string }) {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'roadmap' | 'mindmap' | 'quiz' | 'flashcards' | 'podcast' | 'gallery'>('notes');
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedMermaid, setZoomedMermaid] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const docRef = doc(db, 'notes', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNote(docSnap.data());
        } else {
          const guestNote = localStorage.getItem(`lumina_guest_note_${id}`);
          if (guestNote) setNote(JSON.parse(guestNote));
        }
      } catch (err) {
        console.error('Failed to fetch note:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const [showHistory, setShowHistory] = useState(false);

  // Load chat from storage or initialize with welcome message
  useEffect(() => {
    if (!id) return;
    const key = `lumina_chat_${id}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch (e) {
        setChatHistory([]);
      }
    } else if (note?.title) {
      setChatHistory([{
        role: 'assistant',
        content: `Greetings, Scholar. I am **Atelier**, your academic mentor for this session on *${note.title}*. How may I assist your mastery today?`
      }]);
    }
  }, [id, !!note]); // Length is always 2 (string, boolean)

  // Persist chat to storage
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(`lumina_chat_${id}`, JSON.stringify(chatHistory));
    }
  }, [chatHistory, id]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim() || chatLoading) return;
    const userMsg = { role: 'user' as const, content: chatPrompt };
    const currentHistory = [...chatHistory];
    setChatHistory(prev => [...prev, userMsg]);
    const p = chatPrompt;
    setChatPrompt('');
    setChatLoading(true);
    try {
      const context = note?.simplified_content || note?.title || '';
      const response = await studyApi.chat(p, context, currentHistory);
      setChatHistory(prev => [...prev, { role: 'assistant' as const, content: response.data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant' as const, content: 'Pardon me, Scholar. I encountered a connectivity issue. Shall we try again?' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const startNewChat = () => {
    if (chatHistory.length === 0) return;
    if (confirm('Start a fresh conversation? Current history will be cleared.')) {
      setChatHistory([]);
      localStorage.removeItem(`lumina_chat_${id}`);
    }
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert("Your browser does not support audio playback. Please try Chrome or Edge.");
      return;
    }
    const synth = window.speechSynthesis;
    
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const fullText = note?.podcast_script || note?.simplified_content || '';
    if (!fullText) return;

    // Clean markdown and symbols before speaking
    const cleanText = (text: string) => {
      return text
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Clean links
        .replace(/\*\*|\*|_|~|`|#|>/g, ' ') // Aggressively remove all markdown symbols
        .replace(/MAYA:\s*/gi, '')     // Don't say the speaker name
        .replace(/ALEX:\s*/gi, '')     // Don't say the speaker name
        .replace(/[:|\\/-]/g, ' ')     // Replace technical symbols with spaces
        .replace(/[^\w\s.,?!']/g, ' ') // Remove ANY non-alphanumeric/punctuation character
        .replace(/\s+/g, ' ')          // Collapse extra spaces
        .trim();
    };

    const chunks = fullText.split('\n')
      .map(cleanText)
      .filter((t: string) => t.length > 5); // Skip very short/empty lines
    setIsSpeaking(true);
    
    let index = 0;
    const speak = () => {
      if (index >= chunks.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.rate = 1.05;
      
      utterance.onend = () => {
        index++;
        speak();
      };

      utterance.onerror = () => setIsSpeaking(false);
      synth.speak(utterance);
    };

    synth.cancel();
    speak();
  };

  const [sidebarWidth, setSidebarWidth] = useState(384); // Default lg:w-96
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => setIsResizing(false);

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 320 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  const handleNodeClick = React.useCallback(async (label: string) => {
    const promptText = `Deep Dive: Explain "${label}". Please detail the prerequisites, the foundational pre-understandings required, and a comprehensive explanation of this specific element within the context of our study material.`;
    
    // Immediate UI feedback and acknowledgment
    setChatLoading(true);
    setChatHistory(prev => [
      ...prev, 
      { role: 'user', content: promptText },
      { role: 'assistant', content: `One moment, Scholar. I am initiating a deep dive into **${label}** for you...` }
    ]);
    
    try {
      const context = note?.simplified_content || note?.title || '';
      const response = await studyApi.chat(promptText, context, chatHistory);
      // Remove the "One moment" message and add the real one
      setChatHistory(prev => {
        const filtered = prev.filter(m => !m.content.includes("initiating a deep dive"));
        return [...filtered, { role: 'assistant', content: response.data.answer }];
      });
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'The deep dive encountered an error. Please try clicking the node again.' }]);
    } finally {
      setChatLoading(false);
    }
  }, [note, chatHistory]);

  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);

  const extractImages = (markdown: string) => {
    if (!markdown) return [];
    // Improved regex to handle various markdown image formats and whitespace
    const regex = /!\[(.*?)\]\s*\((.*?)\)/g;
    const images = [];
    let match;
    while ((match = regex.exec(markdown)) !== null) {
      if (match[2] && match[2].startsWith('http')) {
        images.push({ alt: match[1] || 'Visual Exhibit', url: match[2].trim() });
      }
    }
    return images;
  };

  const images = extractImages(note?.simplified_content || '');

  const tabs = [
    { id: 'notes', label: 'Detailed Notes', Icon: Book },
    { id: 'roadmap', label: 'Study Roadmap', Icon: ChevronRight },
    { id: 'mindmap', label: 'Concept Map', Icon: BrainCircuit },
    { id: 'gallery', label: 'Visual Exhibits', Icon: ImageIcon },
    { id: 'quiz', label: 'Knowledge Quiz', Icon: Trophy },
    { id: 'flashcards', label: 'Flashcards', Icon: Layers },
    { id: 'podcast', label: 'Audio Podcast', Icon: Mic },
  ] as const;

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-12 h-12 border-t-2 border-primary rounded-full mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Assembling Workspace...</p>
      </div>
    );
  }

  if (!note) return <div className="h-screen flex items-center justify-center">Note not found.</div>;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      
      {/* ── LEFT SIDEBAR ── */}
      <aside 
        className={`bg-card border-r border-border flex flex-col transition-all duration-500 ease-in-out h-full overflow-hidden no-print ${isLeftSidebarCollapsed ? 'w-24' : 'w-72'}`}
      >
        <div className="p-6 flex flex-col h-full items-center">
          <div className={`flex ${isLeftSidebarCollapsed ? 'flex-col gap-6' : 'flex-row items-center justify-between w-full'} mb-10`}>
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary flex items-center justify-center text-white rotate-3 group-hover:rotate-0 transition-all shadow-lg shadow-primary/20">
                 <BookOpen className="w-5 h-5" />
              </div>
              {!isLeftSidebarCollapsed && (
                <div className="flex flex-col">
                   <span className="font-black text-sm tracking-tighter leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Return</span>
                   <span className="text-primary text-[8px] font-black uppercase tracking-[0.2em] leading-none mt-0.5">to Gallery</span>
                </div>
              )}
            </Link>
            <div className={`flex ${isLeftSidebarCollapsed ? 'flex-col items-center gap-4' : 'items-center gap-2'}`}>
               <ThemeToggle />
               <button 
                 onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                 className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0"
               >
                 <Menu className="w-4 h-4 text-muted-foreground" />
               </button>
            </div>
          </div>

          <div className="space-y-2 mb-auto overflow-y-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <tab.Icon className="w-5 h-5 shrink-0" />
                {!isLeftSidebarCollapsed && (
                  <span className="text-xs font-bold tracking-tight whitespace-nowrap">{tab.label}</span>
                )}
              </button>
            ))}
          </div>

          {!isLeftSidebarCollapsed && (
            <div className="mt-10 p-6 rounded-[2rem] bg-foreground text-background relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
               <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-2">System Status</p>
               <h4 className="text-sm font-bold">Deep Research Integrated</h4>
            </div>
          )}
        </div>
      </aside>

      {/* ── CENTER: CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative no-scrollbar no-print">
         <GlobalVisualStyles />
         
         <div className="max-w-4xl mx-auto mb-12 text-left no-print">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                 <div>
                    <div className="inline-flex px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-widest text-primary mb-4">
                      {note.source_type || 'Research'} Exhibit
                    </div>
                    {/* Manual title removed to avoid duplication with markdown H1 */}
                 </div>
                 <div className="flex items-center gap-3 no-print">
                     <button 
                       onClick={() => window.print()}
                       className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border text-xs font-bold hover:bg-muted transition-all"
                     >
                        <Download className="w-4 h-4" /> Export PDF
                     </button>
                     <button 
                       onClick={async () => {
                         const shareData = {
                           title: note.title,
                           text: `Check out these study notes on ${note.title} from LuminaStudy!`,
                           url: window.location.href,
                         };
                         if (navigator.share) {
                           try { await navigator.share(shareData); } catch (e) {}
                         } else {
                           navigator.clipboard.writeText(window.location.href);
                           alert('Link copied to clipboard!');
                         }
                       }}
                       className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                     >
                        <Share2 className="w-4 h-4" /> Share Guide
                     </button>
                 </div>
               </div>
            </motion.div>
         </div>

         <div className="max-w-4xl mx-auto pb-32">
            <AnimatePresence mode="wait">
               <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                     {activeTab === 'notes' && (
                    <article className="lumina-prose text-left">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            img: ({ src, alt }: any) => <SmartImage src={src || ''} alt={alt || ''} />,
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-mermaid/.exec(className || '');
                              return !inline && match ? (
                                <Mermaid chart={String(children).replace(/\n$/, '')} />
                              ) : (
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono" {...props}>{children}</code>
                              );
                            },
                             blockquote: ({ children }) => {
                               // Helper to extract text safely from React children
                               const getChildText = (node: any): string => {
                                 if (!node) return '';
                                 if (typeof node === 'string' || typeof node === 'number') return String(node);
                                 if (Array.isArray(node)) return node.map(getChildText).join('');
                                 if (node.props?.children) return getChildText(node.props.children);
                                 return '';
                               };

                               const fullText = getChildText(children);
                               
                               let icon = <BookOpen className="w-6 h-6" />;
                               let colorClass = 'border-primary bg-primary/5 text-primary/80';
                               let label = 'NOTE';

                               if (fullText.includes('[!TIP]')) {
                                 icon = <Sparkles className="w-6 h-6" />;
                                 colorClass = 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400';
                                 label = 'FOCUS INSIGHT';
                               } else if (fullText.includes('[!IMPORTANT]')) {
                                 icon = <Zap className="w-6 h-6" />;
                                 colorClass = 'border-amber-500 bg-amber-500/5 text-amber-700 dark:text-amber-400';
                                 label = 'CRITICAL';
                               }

                               return (
                                 <div className={`my-12 p-8 rounded-[2rem] border-l-[12px] shadow-sm ${colorClass}`}>
                                   <div className="flex items-center gap-3 mb-4">
                                      <div className="p-2 rounded-lg bg-current/10">{icon}</div>
                                      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                                   </div>
                                   <div className="text-xl font-medium leading-relaxed italic opacity-90">
                                     {React.Children.map(children, (child: any) => {
                                       const cleanNode = (node: any): any => {
                                         if (typeof node === 'string') {
                                           return node.replace(/\[!(TIP|IMPORTANT|NOTE|CAUTION|WARNING)\]/g, '').trim();
                                         }
                                         if (node?.props?.children) {
                                           return React.cloneElement(node, {
                                             children: React.Children.map(node.props.children, cleanNode)
                                           });
                                         }
                                         return node;
                                       };
                                       return cleanNode(child);
                                     })}
                                   </div>
                                 </div>
                               );
                             },
                             h1: ({ children }) => (
                               <h1 className="text-5xl lg:text-7xl font-black mt-24 mb-12 text-primary tracking-tighter leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                                 {children}
                               </h1>
                             ),
                             h2: ({ children }) => (
                               <h2 className="text-4xl font-extrabold mt-24 mb-12 pl-8 border-l-[12px] border-primary text-foreground flex items-center gap-5 group">
                                 <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                   <Layers className="w-8 h-8" />
                                 </div>
                                 {children}
                               </h2>
                             ),
                             h3: ({ children }) => (
                               <h3 className="text-2xl font-black mt-16 mb-8 text-muted-foreground/90 flex items-center gap-4 uppercase tracking-[0.2em]">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                 {children}
                               </h3>
                             ),
                             p: ({ children }) => <div className="text-lg leading-relaxed mb-12 opacity-80 font-medium max-w-[85ch]">{children}</div>,
                             strong: ({ children }) => (
                               <strong className="px-1.5 py-0.5 bg-yellow-400/20 text-foreground font-black rounded-md border-b-2 border-yellow-400/30">
                                 {children}
                               </strong>
                             ),
                             ul: ({ children }) => <ul className="space-y-4 mb-10 ml-4 list-none">{children}</ul>,
                             ol: ({ children }) => <ol className="list-decimal list-inside space-y-4 mb-10 ml-4 font-bold">{children}</ol>,
                             li: ({ children }) => (
                               <li className="flex gap-4 text-xl opacity-90 group relative pl-10 mb-6">
                                 <div className="absolute left-0 top-1.5 p-1 rounded-md bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                   <CheckCircle2 className="w-4 h-4" />
                                 </div>
                                 <div className="flex-1">{children}</div>
                               </li>
                             ),
                             table: ({ children }) => (
                               <div className="my-16 overflow-x-auto rounded-[2.5rem] border-2 border-primary/20 shadow-2xl bg-card/50 backdrop-blur-md no-scrollbar">
                                 <table className="w-full border-collapse text-left text-lg min-w-[600px]">
                                   {children}
                                 </table>
                                </div>
                             ),
                             thead: ({ children }) => <thead className="bg-primary/10 border-b-2 border-primary/20">{children}</thead>,
                             th: ({ children }) => <th className="p-10 font-black uppercase tracking-tighter text-xs text-primary border-r border-primary/10 last:border-r-0">{children}</th>,
                             td: ({ children }) => <td className="p-10 border-b border-primary/5 text-base font-medium border-r border-primary/5 last:border-r-0">{children}</td>,
                             tr: ({ children }) => <tr className="hover:bg-primary/[0.02] transition-colors even:bg-muted/5">{children}</tr>,
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline decoration-primary/20 hover:decoration-primary transition-all">
                                {children}
                              </a>
                            )
                          }}
                        >
                         {note.simplified_content || '# No notes available.'}
                       </ReactMarkdown>
                    </article>
                   )}
                   {activeTab === 'roadmap' && (
                    <div className="p-12 rounded-[3rem] bg-card border border-border shadow-sm text-left relative group">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Study Roadmap</h3>
                         <button 
                           onClick={() => setZoomedMermaid(note.roadmap_mermaid || note.roadmap || "graph TD\n A[Start] --> B[Mastery]")}
                           className="p-3 bg-muted rounded-full hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md"
                           title="Zoom Diagram"
                         >
                           <Search className="w-5 h-5" />
                         </button>
                       </div>
                       <p className="text-sm text-muted-foreground mb-10">Visual guide derived from source material. Click any step for a deep dive.</p>
                       <Mermaid 
                         chart={note.roadmap_mermaid || note.roadmap || "graph TD\n A[Start] --> B[Mastery]"} 
                         onNodeClick={handleNodeClick}
                       />
                    </div>
                  )}
 
                  {activeTab === 'mindmap' && (
                    <div className="p-12 rounded-[3rem] bg-card border border-border shadow-sm text-left relative group">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Concept Map</h3>
                         <button 
                           onClick={() => setZoomedMermaid(note.mind_map_mermaid || note.mind_map || "mindmap\n Root((Concept))")}
                           className="p-3 bg-muted rounded-full hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md"
                           title="Zoom Diagram"
                         >
                           <Search className="w-5 h-5" />
                         </button>
                       </div>
                       <p className="text-sm text-muted-foreground mb-10">Interactive semantic network. Click nodes to explore pre-requisites.</p>
                       <Mermaid 
                         chart={note.mind_map_mermaid || note.mind_map || "mindmap\n Root((Concept))"} 
                         onNodeClick={handleNodeClick}
                       />
                    </div>
                  )}

                  {activeTab === 'quiz' && (
                    <div className="space-y-8 text-left">
                       {(note.quizzes || []).map((q: any, i: number) => (
                         <div key={i} className="p-10 rounded-[2.5rem] bg-card border border-border shadow-sm">
                            <h4 className="text-xl font-bold mb-8">{q.question}</h4>
                            <div className="grid gap-3">
                               {q.options.map((opt: string) => {
                                 const revealed = quizScore !== null;
                                 const isSelected = userAnswers[i] === opt;
                                 const isCorrect = revealed && opt === q.answer;
                                 return (
                                   <button 
                                     key={opt} onClick={() => quizScore === null && setUserAnswers(prev => ({...prev, [i]: opt}))}
                                     className={`p-5 rounded-2xl text-left text-sm font-semibold border transition-all ${
                                       isCorrect ? 'bg-green-500/10 border-green-500 text-green-500' :
                                       isSelected ? 'bg-primary text-white' : 'bg-background border-border hover:border-primary/20'
                                     }`}
                                   >
                                     {opt}
                                   </button>
                                 );
                               })}
                            </div>
                         </div>
                       ))}
                       {quizScore === null ? (
                         <button 
                           onClick={() => {
                             let score = 0;
                             (note.quizzes || []).forEach((q: any, i: number) => {
                               if (userAnswers[i] === q.answer) score++;
                             });
                             setQuizScore(score);
                           }} 
                           className="w-full py-6 bg-primary text-white rounded-[2rem] font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                         >
                           Submit Evaluation
                         </button>
                       ) : (
                         <div className="p-10 rounded-[2.5rem] bg-foreground text-background text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                            <div className="relative z-10">
                               <h3 className="text-4xl font-bold mb-2">{(quizScore / (note.quizzes?.length || 1) * 100).toFixed(0)}%</h3>
                               <p className="text-xs font-black uppercase tracking-widest opacity-60">Session Performance Score</p>
                               <button onClick={() => { setQuizScore(null); setUserAnswers({}); }} className="mt-8 px-8 py-3 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest">Retry Evaluation</button>
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  {activeTab === 'flashcards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {(note.flashcards || []).map((card: any, i: number) => (
                         <div key={i} className="h-80 cursor-pointer" onClick={() => setFlippedCards(p => ({...p, [i]: !p[i]}))}>
                           <motion.div animate={{ rotateY: flippedCards[i] ? 180 : 0 }} transition={{ duration: 0.6 }} className="relative w-full h-full preserve-3d">
                              <div className="absolute inset-0 bg-card border border-border rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center backface-hidden">
                                 <h4 className="text-xl font-bold">{card.front}</h4>
                              </div>
                              <div className="absolute inset-0 bg-primary text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
                                 <p className="text-lg font-medium">{card.back}</p>
                              </div>
                           </motion.div>
                         </div>
                       ))}
                    </div>
                  )}

                  {activeTab === 'podcast' && (() => {
                    const script = note?.podcast_script || note?.simplified_content || '';
                    const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
                    // Parse speaker lines
                    const lines = script.split('\n').filter((l: string) => l.trim());
                    const parsed = lines.map((line: string) => {
                      const mayaMatch = line.match(/^\*{0,2}MAYA:\*{0,2}\s*(.*)/i);
                      const alexMatch = line.match(/^\*{0,2}ALEX:\*{0,2}\s*(.*)/i);
                      if (mayaMatch) return { speaker: 'MAYA', text: mayaMatch[1].trim() };
                      if (alexMatch) return { speaker: 'ALEX', text: alexMatch[1].trim() };
                      return { speaker: 'NARR', text: line.trim() };
                    });
                    const hasParsed = parsed.some((l: any) => l.speaker !== 'NARR');
                    return (
                      <div className="text-left space-y-8">
                        {/* Header + Controls */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 rounded-[2.5rem] bg-card border border-border shadow-sm">
                          <div className="w-20 h-20 shrink-0 bg-foreground text-background rounded-[1.5rem] flex items-center justify-center shadow-xl">
                            <Mic className={`w-8 h-8 text-primary ${isSpeaking ? 'animate-pulse' : ''}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Audio Lab Podcast</p>
                            <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>MAYA & ALEX Deep Dive</h2>
                            <p className="text-sm text-muted-foreground mt-1">{wordCount} words · ~{Math.ceil(wordCount / 130)} min listen</p>
                          </div>
                          <button
                            onClick={handleSpeech}
                            className="shrink-0 px-8 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                          >
                            {isSpeaking ? '⏹ Stop' : '▶ Play'}
                          </button>
                        </div>

                        {/* Waveform animation when playing */}
                        {isSpeaking && (
                          <div className="flex items-end justify-center gap-1 h-12 px-4">
                            {Array.from({ length: 28 }).map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 rounded-full bg-primary"
                                animate={{ height: ['8px', `${16 + Math.random() * 28}px`, '8px'] }}
                                transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: i * 0.04 }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Script Display */}
                        <div className="space-y-4">
                          {hasParsed ? (
                            parsed.map((line: any, i: number) => {
                              if (line.speaker === 'NARR') return (
                                <p key={i} className="text-sm text-muted-foreground italic text-center px-8">{line.text}</p>
                              );
                              const isMaya = line.speaker === 'MAYA';
                              return (
                                <div key={i} className={`flex gap-4 ${isMaya ? '' : 'flex-row-reverse'}`}>
                                  <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black text-white shadow-md ${isMaya ? 'bg-violet-500' : 'bg-primary'}`}>
                                    {line.speaker[0]}
                                  </div>
                                  <div className={`max-w-[78%] p-5 rounded-2xl text-sm leading-relaxed font-medium ${isMaya ? 'bg-violet-500/10 border border-violet-500/20 text-foreground rounded-tl-none' : 'bg-primary/10 border border-primary/20 text-foreground rounded-tr-none'}`}>
                                    <span className={`text-[9px] font-black uppercase tracking-widest block mb-2 ${isMaya ? 'text-violet-500' : 'text-primary'}`}>{line.speaker}</span>
                                    {line.text}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-8 rounded-[2rem] bg-card border border-border">
                              <p className="text-base leading-relaxed opacity-80 whitespace-pre-wrap">{script || 'Podcast script not available for this session.'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                   {activeTab === 'gallery' && (
                    <div className="space-y-8">
                       <div className="text-left mb-10">
                          <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Visual Exhibit Gallery</h3>
                          <p className="text-sm text-muted-foreground">A curated collection of AI-generated diagrams and conceptual illustrations to visualize complex topics.</p>
                       </div>
                       
                       {images.length > 0 ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {images.map((img: any, i: number) => (
                              <div key={i} className="group relative">
                                 <div 
                                   className="aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-border shadow-sm hover:shadow-2xl transition-all duration-500 cursor-zoom-in"
                                   onClick={() => setZoomedImage(img.url)}
                                 >
                                    <img 
                                      src={img.url} 
                                      alt={img.alt} 
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                      onError={(e) => {
                                         e.currentTarget.parentElement!.style.display = 'none';
                                      }}
                                    />
                                 </div>
                                 <div className="mt-4 flex items-center justify-between px-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{img.alt || 'Exhibit'}</span>
                                    <button 
                                      onClick={() => window.open(img.url, '_blank')}
                                      className="p-2 rounded-lg bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Open in new tab"
                                    >
                                       <Share2 className="w-3 h-3" />
                                    </button>
                                 </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="py-20 text-center opacity-30">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest">No visual exhibits found in this session.</p>
                         </div>
                       )}
                    </div>
                  )}

               </motion.div>
            </AnimatePresence>
         </div>
      </main>

      {/* ── RIGHT SIDEBAR: CHAT ── */}
      <div 
        onMouseDown={startResizing}
        className={`hidden lg:flex w-1.5 h-full cursor-col-resize hover:bg-primary/20 transition-colors z-50 ${isResizing ? 'bg-primary/40' : 'bg-transparent'}`}
      />

      <aside 
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : '100%' }}
        className="bg-card border-l border-border flex flex-col shrink-0 transition-none relative no-print"
      >
         {/* History Panel Overlay */}
         <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ x: '100%' }} 
                animate={{ x: 0 }} 
                exit={{ x: '100%' }}
                className="absolute inset-0 bg-card z-50 p-8 flex flex-col border-l border-border shadow-2xl"
              >
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                       <Clock className="w-4 h-4 text-primary" /> Chat History
                    </h3>
                    <button onClick={() => setShowHistory(false)} className="p-2 rounded-xl hover:bg-muted">
                       <X className="w-4 h-4" />
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {chatHistory.length > 0 ? (
                      <div className="p-4 rounded-2xl bg-muted/50 border border-border group cursor-pointer hover:border-primary/30 transition-all">
                         <p className="text-xs font-bold mb-1 truncate">{chatHistory[0].content}</p>
                         <p className="text-[10px] text-muted-foreground">{chatHistory.length} messages in this session</p>
                      </div>
                    ) : (
                      <p className="text-center py-10 text-xs text-muted-foreground opacity-50 italic">No previous syntheses found.</p>
                    )}
                 </div>
              </motion.div>
            )}
         </AnimatePresence>

         <div className="p-8 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Brain className="w-6 h-6 text-primary" />
               <span className="font-bold text-sm tracking-tight">Atelier Chat</span>
            </div>
            <div className="flex items-center gap-2">
               <button 
                 onClick={startNewChat}
                 className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                 title="New Chat"
               >
                 <Plus className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setShowHistory(!showHistory)}
                 className={`p-2 rounded-xl transition-colors ${showHistory ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                 title="Chat History"
               >
                 <Clock className="w-4 h-4" />
               </button>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            {chatHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed text-left ${
                   m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'
                 }`}>
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-primary">{children}</h2>,
                          p: ({ children }) => <p className="mb-2 leading-relaxed opacity-90">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 ml-2">{children}</ul>,
                          li: ({ children }) => <li className="font-medium">{children}</li>,
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto rounded-xl border border-border">
                              <table className="w-full border-collapse text-[11px] text-left">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => <th className="p-2 bg-muted border-b border-border font-bold">{children}</th>,
                          td: ({ children }) => <td className="p-2 border-b border-border/50">{children}</td>,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}
                 </div>
              </div>
            ))}
            {chatLoading && <div className="p-2 opacity-50">Thinking...</div>}
            <div ref={chatBottomRef} />
         </div>
         <form onSubmit={handleChat} className="p-6 bg-muted">
            <div className="relative">
               <input 
                 value={chatPrompt} onChange={e => setChatPrompt(e.target.value)}
                 className="w-full bg-card rounded-2xl pl-6 pr-16 py-5 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20"
                 placeholder="Ask a question..."
               />
               <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center transition-all hover:scale-105">
                  <Send className="w-5 h-5" />
               </button>
            </div>
         </form>
      </aside>

      {/* ── LIGHTBOX MODALS ── */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button className="absolute top-8 right-8 p-3 bg-card rounded-full shadow-2xl hover:bg-muted text-foreground">
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={zoomedImage} 
              alt="Zoomed Exhibit" 
              className="max-w-[90vw] max-h-[90vh] rounded-[2rem] shadow-2xl border-4 border-card object-contain"
            />
          </motion.div>
        )}

        {zoomedMermaid && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-8"
          >
            <button 
              onClick={() => setZoomedMermaid(null)}
              className="absolute top-8 right-8 p-3 bg-card rounded-full shadow-2xl hover:bg-muted text-foreground z-50"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-card rounded-[3rem] p-12 shadow-2xl border border-border"
            >
              <Mermaid chart={zoomedMermaid} onNodeClick={handleNodeClick} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        ${isResizing ? 'body { cursor: col-resize !important; user-select: none; }' : ''}
        
        @media print {
          .no-print { display: none !important; }
          
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          div, main, aside, section {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
            display: block !important;
          }

          .max-w-4xl {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 2cm !important;
          }

          h1 { font-size: 32pt !important; line-height: 1.2 !important; margin-bottom: 20pt !important; }
          h2 { font-size: 24pt !important; margin-top: 30pt !important; margin-bottom: 15pt !important; page-break-after: avoid; }
          p, li { font-size: 12pt !important; line-height: 1.6 !important; page-break-inside: avoid; }
          
          table { width: 100% !important; border-collapse: collapse !important; margin: 20pt 0 !important; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          td, th { border: 1px solid #ccc !important; padding: 10pt !important; text-align: left !important; }
          th { background-color: #f0f0f0 !important; }

          .bg-primary/5, .bg-muted/5, .shadow-2xl, .shadow-xl, .backdrop-blur-md {
            background: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
          }
          
          .border-l-[12px] { border-left: 6pt solid black !important; }
        }
      `}} />
      
      {/* ── HIDDEN PRINT AREA ── */}
      {/* ── PRINT CONTENT (ALWAYS VISIBLE TO PRINTER) ── */}
      <div className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-10 z-[200]">
        <h1 className="text-4xl font-black mb-8 border-b-4 border-black pb-4">{note.title}</h1>
        <div className="space-y-8">
           <ReactMarkdown 
             remarkPlugins={[remarkGfm, remarkMath]} 
             rehypePlugins={[rehypeKatex]}
             components={{
               h1: ({ children }) => <h1 className="text-3xl font-bold mt-12 mb-6">{children}</h1>,
               h2: ({ children }) => <h2 className="text-2xl font-bold mt-10 mb-5 border-l-8 border-black pl-4">{children}</h2>,
               h3: ({ children }) => <h3 className="text-xl font-bold mt-8 mb-4">{children}</h3>,
               p: ({ children }) => <p className="text-base leading-relaxed mb-6">{children}</p>,
               ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-6">{children}</ul>,
               li: ({ children }) => <li className="text-base">{children}</li>,
               table: ({ children }) => <div className="my-8"><table className="w-full border-collapse border border-black">{children}</table></div>,
               th: ({ children }) => <th className="border border-black p-3 bg-gray-100 font-bold text-left">{children}</th>,
               td: ({ children }) => <td className="border border-black p-3">{children}</td>,
               blockquote: ({ children }) => <div className="border-l-4 border-gray-400 pl-4 italic my-6 text-gray-700">{children}</div>
             }}
           >
             {note.simplified_content || '# No content available'}
           </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
