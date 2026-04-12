'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  BookOpen,
  Brain,
  Zap,
  Mic,
  Send,
  Bot,
  Layers,
  X,
  ChevronRight,
  BrainCircuit,
  Volume2,
  VolumeX,
  CheckCircle,
  XCircle,
  Share2,
  Download,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { studyApi } from '@/lib/api';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

// Initialize Mermaid with a premium look
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

const Mermaid = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const renderChart = async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid render failed:', err);
      }
    };
    renderChart();
  }, [chart, id]);

  return (
    <div className="flex justify-center my-12 p-8 bg-white/40 backdrop-blur-sm rounded-[2rem] border border-white shadow-sm overflow-hidden">
      <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full max-w-full overflow-x-auto" />
    </div>
  );
};

export default function NoteView({ id }: { id: string }) {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'quiz' | 'flashcards' | 'podcast' | 'roadmap' | 'mindmap'>('notes');
  const [showChat, setShowChat] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Quiz
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Flashcards
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // Toggle card flip
  const toggleFlip = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Podcast TTS
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const docRef = doc(db, 'notes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setNote(docSnap.data());
          return;
        }

        const guestNote = localStorage.getItem(`lumina_guest_note_${id}`);
        if (guestNote) {
          setNote(JSON.parse(guestNote));
          return;
        }
        setNote(null);
      } catch (err) {
        console.error('Failed to fetch note:', err);
        const guestNote = localStorage.getItem(`lumina_guest_note_${id}`);
        if (guestNote) setNote(JSON.parse(guestNote));
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim() || chatLoading) return;

    const userMsg = { role: 'user' as const, content: chatPrompt };
    setChatHistory(prev => [...prev, userMsg]);
    const promptText = chatPrompt;
    setChatPrompt('');
    setChatLoading(true);

    try {
      const context = note?.simplified_content || note?.simplified_notes || note?.raw_text || note?.title || '';
      const response = await studyApi.chat(promptText, context);
      setChatHistory(prev => [...prev, { role: 'bot' as const, content: response.data.answer }]);
    } catch (err) {
      console.error('Chat failed:', err);
      setChatHistory(prev => [...prev, { role: 'bot' as const, content: 'Atelier communication failed. Please check your network.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }
    const script = note?.podcast_script || note?.simplified_content || note?.simplified_notes || 'No synthesis available.';
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    const voices = synth.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
    if (preferred) utterance.voice = preferred;
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const handleQuizSelect = (qIdx: number, option: string) => {
    if (quizScore !== null) return;
    setUserAnswers(prev => ({ ...prev, [qIdx]: option }));
  };

  const submitQuiz = () => {
    let score = 0;
    (note?.quizzes || []).forEach((q: any, i: number) => {
      if (userAnswers[i] === q.answer) score++;
    });
    setQuizScore(score);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setQuizScore(null);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#FFF8F5]">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-[3px] border-primary/10" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="absolute inset-0 border-[3px] border-transparent border-t-primary rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Reconstructing Atelier...
        </p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-12 bg-[#FFF8F5]">
        <XCircle className="w-16 h-16 text-primary mb-6 opacity-20" />
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Atelier Fragment Not Found</h2>
        <p className="text-sm text-muted-foreground mb-10 max-w-sm">This study piece may have been disassembled or was never created.</p>
        <Link href="/dashboard" className="btn-primary px-10 py-4">← Back to Workspace</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'notes', label: 'Journal', icon: BookOpen, color: 'var(--primary)' },
    { id: 'roadmap', label: 'Roadmap', icon: ChevronRight, color: '#C8552A' },
    { id: 'mindmap', label: 'Mind Map', icon: BrainCircuit, color: '#5E7B5A' },
    { id: 'quiz', label: 'Evaluation', icon: Zap, color: '#5E7B5A' },
    { id: 'flashcards', label: 'Memory', icon: Layers, color: '#3B9BC8' },
    { id: 'podcast', label: 'Auditory', icon: Mic, color: '#7C6FCD' },
  ] as const;

  const palettes = [
    { bg: 'color-mix(in srgb, var(--atelier-crimson), transparent 92%)', accent: 'var(--atelier-crimson)', shadow: 'rgba(230,0,35,0.08)' },
    { bg: 'color-mix(in srgb, var(--atelier-sage), transparent 92%)', accent: 'var(--atelier-sage)', shadow: 'rgba(94,123,90,0.08)' },
    { bg: 'color-mix(in srgb, var(--atelier-sky), transparent 92%)', accent: 'var(--atelier-sky)', shadow: 'rgba(59,155,200,0.08)' },
    { bg: 'color-mix(in srgb, var(--atelier-lavender), transparent 92%)', accent: 'var(--atelier-lavender)', shadow: 'rgba(124,111,205,0.08)' },
  ];

  return (
    <div className="relative min-h-[80vh] bg-transparent text-[#160E0C]">
      
      {/* ── ATELIER CONTROL BAR ── */}
      <div className="sticky top-0 z-30 mb-8 py-4 bg-studio-bg/60 backdrop-blur-xl border-b border-[#160E0C10] -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-16 lg:px-16">
         <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center bg-white/40 p-1.5 rounded-2xl border border-white">
               {tabs.map((tab) => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`relative px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600'}`}
                 >
                    <div className="relative z-10 flex items-center gap-2">
                       <tab.icon className="w-3.5 h-3.5" />
                       <span className="hidden sm:inline-block">{tab.label}</span>
                    </div>
                    {activeTab === tab.id && (
                      <motion.div layoutId="subnav-active" className="absolute inset-0 bg-white shadow-sm rounded-xl" />
                    )}
                 </button>
               ))}
            </div>

            <div className="flex items-center gap-2">
               <button 
                  onClick={() => setShowChat(!showChat)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all ${showChat ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-white text-zinc-500'}`}
               >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Interrogate</span>
               </button>
            </div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ── MAIN VIEWPORT AREA ── */}
        <div className={`flex-1 transition-all duration-500`}>
          
            {/* HERO COVER */}
            <section className="relative h-[250px] lg:h-[400px] group overflow-hidden rounded-[3rem] shadow-2xl bg-sidebar-bg mb-12">
               <div className="absolute inset-0 bg-black/30 z-10" />
               <img 
                 src={`https://pollinations.ai/p/${encodeURIComponent(note.visual_prompt || note.title || "academic study atmosphere")}?width=1920&height=1080&model=flux&nologo=true&seed=${id.length}`} 
                 className="w-full h-full object-cover scale-[1.02] group-hover:scale-100 transition-transform duration-[3000ms]"
                 alt={note.title}
                 loading="lazy"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1920&auto=format&fit=crop';
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20 pointer-events-none" />
               
               <div className="absolute bottom-10 left-8 lg:left-12 right-8 z-30">
                  <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="flex flex-col gap-3"
                  >
                     <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                           {note.source_type} Synthesis
                        </span>
                     </div>
                     <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-white leading-tight max-w-3xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {note.title}
                     </h1>
                  </motion.div>
               </div>
            </section>

            {/* EXHIBIT VIEWER */}
            <div className="w-full">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, x: 15 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                 >
                     
                     {/* TAB HEADER */}
                     <div className="mb-12 flex items-center justify-between">
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-[2px] bg-primary" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                 Digital Archive / {activeTab}
                              </span>
                           </div>
                           <h2 className="text-3xl lg:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {tabs.find(t => t.id === activeTab)?.label} <span className="italic">Exhibit</span>
                           </h2>
                        </div>
                        
                        <div className="flex gap-2">
                           <button className="w-12 h-12 rounded-full border border-muted flex items-center justify-center hover:bg-muted transition-colors"><Share2 className="w-5 h-5" /></button>
                           <button className="w-12 h-12 rounded-full border border-muted flex items-center justify-center hover:bg-muted transition-colors"><Download className="w-5 h-5" /></button>
                        </div>
                     </div>

                     {/*TAB: NOTES */}
                     {activeTab === 'notes' && (
                        <div className="glass-card p-8 lg:p-16 rounded-[3rem] shadow-[0_48px_96px_-32px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-1 pointer-events-none group-hover:scale-110 transition-transform duration-[3000ms]" />
                           <div className="lumina-prose relative z-10 max-w-none">
                              <ReactMarkdown
                                components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-mermaid/.exec(className || '');
                                    return !inline && match ? (
                                      <Mermaid chart={String(children).replace(/\n$/, '')} />
                                    ) : (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  img({ node, ...props }: any) {
                                    return (
                                      <div className="my-16 flex flex-col items-center">
                                        <div className="p-1 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border border-black/5 group/img">
                                           <img {...props} className="w-full h-auto rounded-[2.2rem] scale-[1.01] group-hover/img:scale-100 transition-transform duration-1000" loading="lazy" />
                                        </div>
                                        {props.alt && (
                                          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary/40 text-center">{props.alt}</p>
                                        )}
                                      </div>
                                    );
                                  }
                                }}
                              >
                                {note.simplified_content || note.simplified_notes || '*No synthesis available.*'}
                              </ReactMarkdown>
                           </div>
                        </div>
                     )}

                     {/* TAB: ROADMAP */}
                     {activeTab === 'roadmap' && (
                        <div className="glass-card p-6 md:p-12 rounded-[3.5rem] shadow-[0_48px_96px_-32px_rgba(0,0,0,0.06)] bg-white/40 backdrop-blur-3xl border border-white">
                           <div className="mb-12">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 block">Strategic Plan</span>
                              <h3 className="text-3xl lg:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Study <span className="italic text-primary">Trajectory</span></h3>
                              <p className="mt-4 text-sm text-zinc-500 max-w-xl">A specialized execution path derived from your content volume, optimized for retention.</p>
                           </div>
                           <div className="bg-white/40 p-1 rounded-[2.5rem] border border-[#160E0C08] overflow-hidden">
                              <Mermaid chart={note.roadmap || "graph TD\n  Start[Begin Study] --> Review[Review Notes]\n  Review --> Practice[Practice Quiz]\n  Practice --> Finish[Mastery]"} />
                           </div>
                        </div>
                     )}

                     {/* TAB: MINDMAP */}
                     {activeTab === 'mindmap' && (
                        <div className="glass-card p-6 md:p-12 rounded-[3.5rem] shadow-[0_48px_96px_-32px_rgba(0,0,0,0.06)] bg-white/40 backdrop-blur-3xl border border-white">
                           <div className="mb-12">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-atelier-sage mb-2 block">Conceptual Architecture</span>
                              <h3 className="text-3xl lg:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Knowledge <span className="italic text-atelier-sage">Topography</span></h3>
                              <p className="mt-4 text-sm text-zinc-500 max-w-xl">A hierarchical map of interconnected insights and their logical foundations.</p>
                           </div>
                           <div className="bg-white/40 p-1 rounded-[2.5rem] border border-[#160E0C08] overflow-hidden">
                              <Mermaid chart={note.mind_map || "mindmap\n  root((Core Topic))\n    Concepts\n    Applications\n    Fundamentals"} />
                           </div>
                        </div>
                     )}

                     {/* TAB: QUIZ */}
                     {activeTab === 'quiz' && (
                        <div className="space-y-12">
                           {/* Result Banner */}
                           {quizScore !== null && (
                              <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-10 rounded-[3rem] text-center border-t border-white shadow-2xl relative overflow-hidden"
                                style={{
                                  background: quizScore / (note.quizzes?.length || 1) >= 0.7 
                                    ? 'linear-gradient(135deg, #5E7B5A 0%, #3B5B37 100%)' 
                                    : 'linear-gradient(135deg, #E60023 0%, #A30019 100%)'
                                }}
                              >
                                 <div className="relative z-10">
                                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60 mb-4">Competency Result</div>
                                    <div className="text-7xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                                       {((quizScore / note.quizzes.length) * 100).toFixed(0)}%
                                    </div>
                                    <p className="text-white font-medium mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                                       You correctly identified {quizScore} concepts out of {note.quizzes.length}. {quizScore / note.quizzes.length >= 0.8 ? 'Your mastery is exceptional.' : 'Continued study is recommended.'}
                                    </p>
                                    <button onClick={resetQuiz} className="px-8 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
                                       Reset Atelier Evaluation
                                    </button>
                                 </div>
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                              </motion.div>
                           )}

                           <div className="masonry-grid-view">
                              {(note.quizzes || []).map((q: any, i: number) => (
                                 <motion.div 
                                   key={i} 
                                   className="glass-card mb-8 p-8 lg:p-10 rounded-[2.5rem] shadow-xl group hover:-translate-y-2 transition-transform duration-500"
                                   initial={{ opacity: 0, y: 30 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: i * 0.1 }}
                                 >
                                    <div className="flex items-start gap-4 mb-8">
                                       <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center font-black text-sm text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                                          {String(i + 1).padStart(2, '0')}
                                       </div>
                                       <h4 className="text-lg lg:text-xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                          {q.question}
                                       </h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       {q.options.map((opt: string, oiIndex: number) => {
                                          const isSelected = userAnswers[i] === opt;
                                          const revealed = quizScore !== null;
                                          const isCorrect = revealed && opt === q.answer;
                                          const isWrong = revealed && isSelected && opt !== q.answer;

                                          return (
                                             <button 
                                               key={oiIndex}
                                               disabled={revealed}
                                               onClick={() => handleQuizSelect(i, opt)}
                                               className={`p-5 rounded-2xl text-left text-sm font-semibold transition-all flex items-center justify-between gap-3 ${
                                                 isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                                               }`}
                                               style={{
                                                  border: isCorrect ? '2px solid #5E7B5A' : isWrong ? '2px solid #E60023' : isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                  background: isCorrect ? '#5E7B5A08' : isWrong ? '#E6002308' : isSelected ? 'var(--primary)05' : 'transparent',
                                                  color: isCorrect ? '#5E7B5A' : isWrong ? '#E60023' : isSelected ? 'var(--primary)' : 'var(--muted-foreground)',
                                                  opacity: revealed && !isCorrect && !isSelected ? 0.4 : 1
                                               }}
                                             >
                                                <span>{opt}</span>
                                                {isCorrect && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                                                {isWrong && <XCircle className="w-4 h-4 flex-shrink-0" />}
                                             </button>
                                          );
                                       })}
                                    </div>
                                 </motion.div>
                              ))}
                           </div>

                           {!quizScore && (
                              <div className="flex justify-center pt-8">
                                 <button 
                                   disabled={Object.keys(userAnswers).length < (note.quizzes?.length || 0)}
                                   onClick={submitQuiz}
                                   className="btn-primary px-16 py-5 rounded-[2rem] text-sm uppercase font-black tracking-widest shadow-2xl shadow-primary/30 disabled:grayscale disabled:opacity-50 active:scale-95 transition-all"
                                 >
                                    Execute Evaluation Core
                                 </button>
                              </div>
                           )}
                        </div>
                     )}

                     {/* TAB: FLASHCARDS */}
                     {activeTab === 'flashcards' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                           {(note.flashcards || []).map((card: any, i: number) => {
                              const isFlipped = flippedCards[i] || false;
                              const palette = palettes[i % palettes.length];
                              return (
                                 <div 
                                   key={i} 
                                   className="perspective-1000 h-[380px] cursor-pointer group"
                                   onClick={() => toggleFlip(i)}
                                 >
                                    <motion.div 
                                      className="relative w-full h-full preserve-3d transition-transform duration-[800ms] cubic-bezier(0.19, 1, 0.22, 1)"
                                      initial={false}
                                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    >
                                       {/* FRONT */}
                                       <div className="absolute inset-0 backface-hidden rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg border border-white bg-white/40 backdrop-blur-xl">
                                          <div className="absolute top-10 left-10 w-2 h-2 rounded-full" style={{ background: palette.accent }} />
                                          <Sparkles className="w-10 h-10 mb-8 opacity-20" style={{ color: palette.accent }} />
                                          <h4 className="text-xl lg:text-2xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                             {card.front}
                                          </h4>
                                          <div className="absolute bottom-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
                                             Flip to Disclose
                                          </div>
                                       </div>
                                       {/* BACK */}
                                       <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-2xl text-white"
                                            style={{ background: palette.accent }}>
                                          <BrainCircuit className="w-12 h-12 mb-8 opacity-40" />
                                          <p className="text-sm lg:text-base font-bold leading-relaxed">
                                             {card.back}
                                          </p>
                                          <div className="absolute bottom-10 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                             Mastery Archive
                                          </div>
                                       </div>
                                    </motion.div>
                                 </div>
                              );
                           })}
                        </div>
                     )}

                     {/* TAB: PODCAST */}
                     {activeTab === 'podcast' && (
                        <div className="max-w-3xl mx-auto py-12">
                           <div className="glass-card rounded-[4rem] shadow-2xl p-1 lg:p-2">
                              <div className="rounded-[3.8rem] bg-sidebar-bg text-white overflow-hidden p-12 lg:p-20 flex flex-col items-center text-center">
                                 
                                 <div className="relative mb-16">
                                    <div className={`w-32 h-32 lg:w-48 lg:h-48 rounded-full border border-white/10 flex items-center justify-center relative transition-transform duration-1000 ${isSpeaking ? 'scale-110' : ''}`}>
                                       <div className={`absolute inset-0 rounded-full bg-primary/20 blur-3xl transition-opacity duration-1000 ${isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
                                       <div className="relative z-10 w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-primary flex items-center justify-center shadow-[0_0_64px_rgba(230,0,35,0.4)]">
                                          <Mic className={`w-10 h-10 lg:w-12 lg:h-12 ${isSpeaking ? 'animate-pulse' : ''}`} />
                                       </div>
                                       {isSpeaking && [1,2,3].map(i => (
                                          <motion.div 
                                             key={i} 
                                             className="absolute inset-0 rounded-full border border-primary/40"
                                             animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                                             transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
                                          />
                                       ))}
                                    </div>
                                 </div>

                                 <div className="mb-12">
                                    <h3 className="text-3xl lg:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Auditory Synthesis</h3>
                                    <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">Derived audio summary crafted in the digital atelier for hands-free conceptualization.</p>
                                 </div>

                                 <button 
                                    onClick={handleSpeech}
                                    className="group relative px-12 py-5 rounded-full overflow-hidden transition-all active:scale-95"
                                 >
                                    <div className="absolute inset-0 bg-primary group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10 flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em]">
                                       {isSpeaking ? <><VolumeX className="w-5 h-5" /> Halt Transcription</> : <><Volume2 className="w-5 h-5" /> Start Auditory Stream</>}
                                    </div>
                                 </button>
                                 
                                 {note.podcast_script && (
                                    <div className="mt-20 w-full text-left">
                                       <div className="flex items-center gap-2 mb-6 opacity-30">
                                          <div className="w-8 h-[1px] bg-white" />
                                          <span className="text-[10px] font-black uppercase tracking-widest">Atelier Script</span>
                                       </div>
                                       <div className="p-8 rounded-3xl bg-white/5 border border-white/5 text-sm leading-relaxed text-white/60 max-h-[400px] overflow-y-auto no-scrollbar font-medium">
                                          {note.podcast_script}
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>
                     )}
                 </motion.div>
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── AI CHAT SIDEBAR (Integrated Drawer) ── */}
        <AnimatePresence>
          {showChat && (
            <motion.aside
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="w-full lg:w-[400px] bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 flex flex-col sticky top-24 h-[calc(100vh-140px)] z-20"
            >
               <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-primary" />
                     </div>
                     <span className="font-bold text-sm tracking-tight text-[#160E0C]">Atelier Assistant</span>
                  </div>
                  <button onClick={() => setShowChat(false)} className="w-8 h-8 rounded-full hover:bg-zinc-50 flex items-center justify-center text-zinc-400 Transition-all">
                     <X className="w-4 h-4" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                  {chatHistory.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <Brain className="w-10 h-10 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting conceptual inquiry</p>
                     </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-5 rounded-2xl text-xs font-medium leading-relaxed ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10' : 'bg-zinc-50 text-zinc-700 rounded-tl-none border border-zinc-100'}`}>
                          {msg.content}
                       </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex gap-2 p-4 bg-zinc-50 rounded-2xl w-20">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce delay-150" />
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce delay-300" />
                    </div>
                  )}
                  <div ref={chatBottomRef} />
               </div>

               <div className="p-6">
                  <form onSubmit={handleChat} className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-full border border-zinc-100 focus-within:border-primary/20 transition-all">
                     <input 
                       type="text" 
                       placeholder="Inquire further..."
                       className="flex-1 bg-transparent pl-5 py-3 text-xs font-semibold outline-none"
                       value={chatPrompt}
                       onChange={e => setChatPrompt(e.target.value)}
                    />
                    <button disabled={!chatPrompt.trim() || chatLoading} className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-40 hover:scale-105 active:scale-95 transition-all">
                       <Send className="w-4 h-4" />
                    </button>
                  </form>
               </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-glow { shadow: 0 0 40px var(--primary); }
      `}</style>
    </div>
  );
}


