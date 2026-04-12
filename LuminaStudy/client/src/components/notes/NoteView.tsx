'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  BrainCircuit,
  Zap,
  Layers,
  Mic,
  MessageSquare,
  Share2,
  Download,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  Bot,
  Send,
  Brain,
  X,
  Sparkles,
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
    { id: 'notes', label: 'Journal', icon: BookOpen },
    { id: 'roadmap', label: 'Roadmap', icon: ChevronRight },
    { id: 'mindmap', label: 'Mind Map', icon: BrainCircuit },
    { id: 'quiz', label: 'Evaluation', icon: Zap },
    { id: 'flashcards', label: 'Memory', icon: Layers },
    { id: 'podcast', label: 'Auditory', icon: Mic },
  ] as const;

  const palettes = [
    { bg: 'color-mix(in srgb, var(--atelier-crimson), transparent 92%)', accent: 'var(--atelier-crimson)', shadow: 'rgba(230,0,35,0.08)' },
    { bg: 'color-mix(in srgb, var(--atelier-sage), transparent 92%)', accent: 'var(--atelier-sage)', shadow: 'rgba(94,123,90,0.08)' },
    { bg: 'color-mix(in srgb, var(--atelier-sky), transparent 92%)', accent: 'var(--atelier-sky)', shadow: 'rgba(59,155,200,0.08)' },
    { bg: 'color-mix(in srgb, var(--atelier-lavender), transparent 92%)', accent: 'var(--atelier-lavender)', shadow: 'rgba(124,111,205,0.08)' },
  ];

  return (
    <div className="relative min-h-screen bg-[#FFF8F5] text-[#160E0C]">
      
      {/* ── ATELIER CONTROL BAR ── */}
      <div className="sticky top-0 z-30 mb-8 py-4 bg-[#FFF8F5]/80 backdrop-blur-xl border-b border-[#160E0C10] -mx-4 px-4 md:-mx-8 md:px-8 lg:-mx-16 lg:px-16">
         <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center bg-white/40 p-1.5 rounded-2xl border border-white">
               {tabs.map((tab) => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`relative px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-primary' : 'text-zinc-500 hover:text-primary'}`}
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
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all ${showChat ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-white text-zinc-500 hover:border-primary/20'}`}
               >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Interrogate</span>
               </button>
            </div>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* ── MAIN VIEWPORT AREA ── */}
        <div className="flex-1 min-w-0">
          
            {/* HERO COVER */}
            <section className="relative h-[250px] lg:h-[400px] overflow-hidden rounded-[3rem] shadow-2xl bg-[#2D2D2D] mb-12">
               <div className="absolute inset-0 bg-black/30 z-10" />
               <img 
                 src={`https://pollinations.ai/p/${encodeURIComponent(note.visual_prompt || note.title || "academic study atmosphere")}?width=1920&height=1080&model=flux&nologo=true&seed=${id.length}`} 
                 className="w-full h-full object-cover"
                 alt={note.title}
                 loading="lazy"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20" />
               
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
                      <div className="mb-12 flex items-center justify-between">
                         <div>
                            <div className="flex items-center gap-2 mb-2">
                               <div className="w-6 h-[2px] bg-primary" />
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                  Digital Archive / {activeTab}
                               </span>
                            </div>
                            <h2 className="text-3xl lg:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                               {tabs.find(t => t.id === activeTab)?.label} <span className="italic text-primary">Exhibit</span>
                            </h2>
                         </div>
                         
                         <div className="flex gap-2">
                            <button className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-white transition-colors"><Share2 className="w-5 h-5" /></button>
                            <button className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-white transition-colors"><Download className="w-5 h-5" /></button>
                         </div>
                      </div>

                      {/* TAB: NOTES */}
                      {activeTab === 'notes' && (
                         <div className="bg-white/40 backdrop-blur-md p-8 lg:p-16 rounded-[3rem] shadow-sm border border-white">
                            <div className="prose prose-zinc prose-pre:bg-zinc-900 prose-pre:text-white max-w-none">
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
                         <div className="bg-white/40 backdrop-blur-md p-8 lg:p-16 rounded-[3rem] shadow-sm border border-white">
                            <div className="mb-12">
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 block">Strategic Plan</span>
                               <h3 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Study <span className="italic text-primary">Trajectory</span></h3>
                               <p className="mt-4 text-sm text-zinc-500 max-w-xl">A specialized execution path derived from your content volume, optimized for retention.</p>
                            </div>
                            <Mermaid chart={note.roadmap || "graph TD\n  Start[Begin] --> Learn[Learn Details]\n  Learn --> Practice[Practice Skills]\n  Practice --> Master[Mastery]"} />
                         </div>
                      )}

                      {/* TAB: MINDMAP */}
                      {activeTab === 'mindmap' && (
                         <div className="bg-white/40 backdrop-blur-md p-8 lg:p-16 rounded-[3rem] shadow-sm border border-white">
                            <div className="mb-12">
                               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 block">Visual Hierarchy</span>
                               <h3 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Concept <span className="italic text-primary">Map</span></h3>
                               <p className="mt-4 text-sm text-zinc-500 max-w-xl">A hierarchical map of interconnected insights and their logical foundations.</p>
                            </div>
                            <Mermaid chart={note.mind_map || "mindmap\n  root((Concept))\n    Origins\n    Mechanisms\n    Impacts"} />
                         </div>
                      )}

                      {/* TAB: QUIZ */}
                      {activeTab === 'quiz' && (
                         <div className="space-y-8">
                            {quizScore !== null && (
                               <div className="p-12 rounded-[3rem] text-center bg-primary text-white shadow-2xl">
                                  <h3 className="text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{((quizScore / note.quizzes.length) * 100).toFixed(0)}%</h3>
                                  <p className="opacity-80 mb-8">You mastered {quizScore} of {note.quizzes.length} concepts.</p>
                                  <button onClick={resetQuiz} className="px-8 py-3 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">Retry</button>
                               </div>
                            )}
                            {(note.quizzes || []).map((q: any, i: number) => (
                               <div key={i} className="bg-white/40 backdrop-blur-md p-8 lg:p-10 rounded-[2.5rem] border border-white shadow-sm">
                                  <h4 className="text-xl font-bold mb-6">{q.question}</h4>
                                  <div className="grid gap-3">
                                     {q.options.map((opt: string, oi: number) => {
                                        const isSelected = userAnswers[i] === opt;
                                        const revealed = quizScore !== null;
                                        const isCorrect = revealed && opt === q.answer;
                                        const isWrong = revealed && isSelected && opt !== q.answer;
                                        return (
                                           <button 
                                              key={oi}
                                              disabled={revealed}
                                              onClick={() => handleQuizSelect(i, opt)}
                                              className={`p-5 rounded-2xl text-left text-sm font-semibold transition-all border ${
                                                isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 
                                                isWrong ? 'bg-red-50 border-red-200 text-red-700' :
                                                isSelected ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 
                                                'bg-white border-black/5 text-zinc-600 hover:border-primary/20'
                                              }`}
                                           >
                                              {opt}
                                           </button>
                                        );
                                     })}
                                  </div>
                               </div>
                            ))}
                            {!quizScore && (
                               <button 
                                  onClick={submitQuiz}
                                  className="w-full py-5 bg-primary text-white rounded-[2rem] font-bold shadow-xl shadow-primary/20"
                               >
                                  Evaluate Core Knowledge
                               </button>
                            )}
                         </div>
                      )}

                      {/* TAB: FLASHCARDS */}
                      {activeTab === 'flashcards' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(note.flashcards || []).map((card: any, i: number) => (
                               <div key={i} className="h-[350px] cursor-pointer group" onClick={() => toggleFlip(i)}>
                                  <motion.div 
                                     className="relative w-full h-full"
                                     animate={{ rotateY: flippedCards[i] ? 180 : 0 }}
                                     transition={{ duration: 0.6 }}
                                     style={{ transformStyle: 'preserve-3d' }}
                                  >
                                     {/* Front */}
                                     <div className="absolute inset-0 bg-white shadow-sm border border-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center backface-hidden">
                                        <Sparkles className="w-8 h-8 text-primary mb-6 opacity-20" />
                                        <h4 className="text-xl font-bold">{card.front}</h4>
                                        <p className="absolute bottom-10 text-[9px] font-black uppercase text-zinc-400">Reveal Truth</p>
                                     </div>
                                     {/* Back */}
                                     <div className="absolute inset-0 bg-primary text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                                        <p className="text-lg font-medium">{card.back}</p>
                                     </div>
                                  </motion.div>
                               </div>
                            ))}
                         </div>
                      )}

                      {/* TAB: PODCAST */}
                      {activeTab === 'podcast' && (
                         <div className="max-w-2xl mx-auto py-12 text-center">
                            <div className="bg-zinc-900 text-white p-16 rounded-[4rem] shadow-2xl">
                               <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-12 shadow-glow">
                                  <Mic className={isSpeaking ? 'animate-pulse' : ''} />
                               </div>
                               <h3 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Synthesis Stream</h3>
                               <p className="text-white/40 mb-12">An AI-voiced auditory summary of your study piece.</p>
                               <button 
                                  onClick={handleSpeech}
                                  className="px-12 py-5 bg-primary rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/40 active:scale-95 transition-all"
                                >
                                  {isSpeaking ? 'Halt Stream' : 'Begin Stream'}
                               </button>
                               {note.podcast_script && (
                                  <div className="mt-16 text-left p-8 bg-white/5 rounded-3xl border border-white/5 text-sm text-white/50 h-64 overflow-y-auto no-scrollbar italic">
                                     {note.podcast_script}
                                  </div>
                                )}
                            </div>
                         </div>
                      )}
                 </motion.div>
               </AnimatePresence>
            </div>
        </div>

        {/* ── AI CHAT SIDEBAR ── */}
        <AnimatePresence>
          {showChat && (
            <motion.aside
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className="lg:w-[400px] w-full shrink-0 h-[calc(100vh-120px)] sticky top-24 bg-white rounded-[3rem] shadow-2xl border border-black/5 flex flex-col overflow-hidden"
            >
               <div className="p-8 border-b border-black/5 flex items-center justify-between bg-[#FFF8F5]/50">
                  <div className="flex items-center gap-3">
                     <Brain className="w-6 h-6 text-primary" />
                     <span className="font-bold text-sm">Atelier Intelligence</span>
                  </div>
                  <button onClick={() => setShowChat(false)} className="w-10 h-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
                     <X className="w-5 h-5 text-zinc-400" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                  {chatHistory.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <Sparkles className="w-12 h-12 mb-4 text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Inquire regarding the synthesis</p>
                     </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] p-5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' : 'bg-zinc-100 text-zinc-800 rounded-tl-none'}`}>
                          {msg.content}
                       </div>
                    </div>
                  ))}
                  {chatLoading && (
                     <div className="flex gap-1.5 p-4 bg-zinc-50 rounded-2xl w-16">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-150" />
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce delay-300" />
                     </div>
                  )}
                  <div ref={chatBottomRef} />
               </div>

               <div className="p-6 bg-white border-t border-black/5">
                  <form onSubmit={handleChat} className="flex gap-2">
                     <input 
                       type="text" 
                       placeholder="Deepen your inquiry..."
                       className="flex-1 bg-zinc-50 border-none rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                       value={chatPrompt}
                       onChange={e => setChatPrompt(e.target.value)}
                    />
                    <button type="submit" className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                       <Send className="w-5 h-5" />
                    </button>
                  </form>
               </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .shadow-glow { box-shadow: 0 0 30px rgba(230,0,35,0.4); }
      `}</style>
    </div>
  );
}
