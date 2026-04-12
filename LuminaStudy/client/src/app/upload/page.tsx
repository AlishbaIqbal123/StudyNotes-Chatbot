'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload as UploadIcon, Video, FileText, Type, Sparkles,
  CheckCircle2, ArrowRight, Brain, Zap, Globe, AlertCircle, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { studyApi } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const inputTypes = [
  {
    id: 'upload' as const,
    label: 'Document',
    icon: FileText,
    desc: 'PDF, DOCX, Images',
    color: 'var(--atelier-crimson)',
    accent: 'var(--primary-deep)',
  },
  {
    id: 'youtube' as const,
    label: 'YouTube',
    icon: Video,
    desc: 'Lecture / Video link',
    color: 'var(--atelier-sky)',
    accent: '#1E4A6A',
  },
  {
    id: 'text' as const,
    label: 'Deep Text',
    icon: Type,
    desc: 'Raw notes / Abstract',
    color: 'var(--atelier-sage)',
    accent: '#1E4A1E',
  },
] as const;

const steps = [
  'Initializing Atelier Environment...',
  'Extracting Raw Content...',
  'Processing with Lumina AI...',
  'Synthesizing Insights & Quizzes...',
  'Finalizing Your Study Board...'
];

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube' | 'text'>('upload');
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const simulateProgress = () => {
    let p = 0;
    let s = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12;
      if (p > 92) p = 92;
      setProgress(Math.min(p, 92));
      if (s < steps.length - 1 && p > (s + 1) * 18) {
        s++;
        setStepIdx(s);
      }
    }, 1100);
    return iv;
  };

  const handleProcess = async (type: string) => {
    if (loading) return;
    setError(null);
    setLoading(true);
    setProgress(5);
    setStepIdx(0);
    const iv = simulateProgress();

    try {
      let response;
      if (type === 'youtube') response = await studyApi.processYoutube(youtubeUrl);
      else if (type === 'text') response = await studyApi.processText(rawText);
      else if (type === 'file' && file) response = await studyApi.processFile(file);
      else throw new Error('No input provided.');

      clearInterval(iv);
      setProgress(100);
      setStepIdx(steps.length - 1);

      if (response?.data) {
        const noteData = {
          ...response.data,
          userId: user?.uid || user?.id || 'guest',
          createdAt: new Date().toISOString(),
          source_type: type,
          status: 'completed',
        };

        let noteId: string;
        if (user) {
          const docRef = await addDoc(collection(db, 'notes'), {
            ...noteData,
            createdAt: serverTimestamp(),
          });
          noteId = docRef.id;
        } else {
          noteId = `guest_${Date.now()}`;
          localStorage.setItem(`lumina_guest_note_${noteId}`, JSON.stringify(noteData));
        }

        setTimeout(() => router.push(`/notes?id=${noteId}`), 1000);
      }
    } catch (err: any) {
      clearInterval(iv);
      console.error('Processing failed:', err);
      const msg = err?.response?.data?.detail || err?.message || 'The atelier could not process your content. Please check your network and try again.';
      setError(msg);
      setLoading(false);
      setProgress(0);
      setStepIdx(0);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative max-w-5xl mx-auto py-6">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

        {/* Page Header */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-primary/20 bg-primary/5"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Content Ingestion
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            New Study <span className="italic">Session</span>
          </h1>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: 'var(--muted-foreground)', fontFamily: "'Manrope', sans-serif" }}>
            Transform your source material into a curated board of insights, flashcards, and quizzes using Lumina&apos;s digital atelier.
          </p>
        </div>

        {/* ── ERROR ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative overflow-hidden p-5 rounded-[2rem] border border-primary/30 bg-white/40 backdrop-blur-md mb-8 shadow-xl shadow-primary/5"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-primary mb-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Processing Interrupted</h4>
                  <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── LOADING ── */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card mb-8 p-12 lg:p-20 flex flex-col items-center text-center relative overflow-hidden"
            style={{ borderRadius: '3rem' }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-muted overflow-hidden">
               <motion.div 
                 className="h-full bg-primary"
                 animate={{ left: ['-100%', '100%'] }}
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               />
            </div>
            
            <div className="relative mb-12">
               <div className="w-32 h-32 rounded-full border-2 border-primary/10 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="absolute inset-0 p-4"
                  >
                    <div className="w-full h-full border-t-2 border-primary rounded-full blur-[1px]" />
                  </motion.div>
                  <Brain className="w-12 h-12 text-primary animate-pulse" />
               </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={stepIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {steps[stepIdx]}
                </h2>
                <div className="flex items-center justify-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0s' }} />
                   <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                   <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="w-full max-w-sm">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-3">
                <motion.div 
                  className="h-full bg-primary"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase" 
                   style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                 <span>Efficiency Path</span>
                 <span>{Math.round(progress)}% Synthesis</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── MAIN WORKSPACE ── */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Tabs */}
            <div className="lg:col-span-4 space-y-4">
              {inputTypes.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group w-full relative p-6 rounded-[2.25rem] transition-all duration-500 overflow-hidden ${
                    activeTab === tab.id 
                    ? 'p-7 border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)]' 
                    : 'bg-white/40 hover:bg-white/80 border border-white lg:border-transparent lg:hover:border-white'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.id ? 'var(--card)' : undefined,
                  }}
                >
                  <div className="relative z-10 flex items-center gap-5">
                    <div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        activeTab === tab.id ? 'scale-110 rotate-3' : 'group-hover:rotate-2'
                      }`}
                      style={{
                        background: activeTab === tab.id ? tab.color : 'var(--muted)',
                        color: activeTab === tab.id ? 'white' : 'var(--muted-foreground)'
                      }}
                    >
                      <tab.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm tracking-tight mb-0.5" 
                          style={{ fontFamily: "'Space Grotesk', sans-serif", color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                        {tab.label}
                      </h4>
                      <p className="text-xs opacity-60 font-medium">{tab.desc}</p>
                    </div>
                    {activeTab === tab.id && (
                      <motion.div layoutId="tab-active-indicator" className="ml-auto">
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </motion.div>
                    )}
                  </div>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="tab-active-bg" 
                      className="absolute inset-0 bg-primary/5 -z-1"
                    />
                  )}
                </button>
              ))}

              {/* Atelier Stats */}
              <div className="p-8 rounded-[2.5rem] bg-sidebar-bg text-white mt-12 hidden lg:block overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:opacity-40 transition-opacity" />
                 <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Board Insights</h5>
                 <div className="space-y-6 relative z-10">
                    <div>
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-semibold text-white/60">Study Density</span>
                          <span className="text-xs font-bold text-white">High</span>
                       </div>
                       <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-4/5" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between items-end mb-2 text-xs">
                          <span className="text-white/60 font-semibold">Active Studio Memory</span>
                          <span className="text-white font-bold">1.4 GB</span>
                       </div>
                       <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-2/3" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Main Workspace Area */}
            <div className="lg:col-span-8">
              <div className="glass-card min-h-[500px] flex flex-col" style={{ borderRadius: '2.5rem' }}>
                <AnimatePresence mode="wait">
                  
                  {/* DOCUMENT TAB */}
                  {activeTab === 'upload' && (
                    <motion.div 
                      key="tab-upload"
                      initial={{ opacity: 0, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-8 lg:p-12 h-full flex flex-col"
                    >
                       <div className="mb-10 text-center lg:text-left">
                          <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Ingest Document</h3>
                          <p className="text-sm text-muted-foreground">Select a file from your device to begin the synthesis.</p>
                       </div>

                       <div
                         onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                         onDragLeave={() => setDragOver(false)}
                         onDrop={e => {
                           e.preventDefault();
                           setDragOver(false);
                           const f = e.dataTransfer.files[0];
                           if (f) setFile(f);
                         }}
                         className={`relative flex-1 group border-2 border-dashed rounded-[2rem] transition-all duration-500 overflow-hidden min-h-[250px] cursor-pointer flex flex-col items-center justify-center p-10 ${
                           dragOver || file ? 'border-primary/50 bg-primary/[0.02] scale-[1.01]' : 'border-muted hover:border-primary/30 bg-muted/20 hover:bg-muted/40'
                         }`}
                       >
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept=".pdf,.docx,.doc,.txt"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                          />
                          
                          <div className="relative">
                            <div className="w-20 h-20 rounded-[1.75rem] bg-white flex items-center justify-center shadow-2xl mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500">
                               {file ? <CheckCircle2 className="w-8 h-8 text-primary" /> : <UploadIcon className="w-8 h-8 text-muted-foreground" />}
                            </div>
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse opacity-0 group-hover:opacity-40 transition-opacity" />
                          </div>

                          <span className="text-lg font-bold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                             {file ? file.name : 'Drop File Here'}
                          </span>
                          <span className="text-xs text-muted-foreground mb-6 uppercase tracking-widest font-bold">
                             {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOCX, or TXT (Max 20MB)'}
                          </span>

                          {file && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setFile(null); }}
                              className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-deep underline underline-offset-4"
                            >
                               Discard Selection
                            </button>
                          )}
                       </div>

                       <button
                         disabled={!file}
                         onClick={() => handleProcess('file')}
                         className="btn-primary w-full py-5 rounded-3xl mt-10 disabled:grayscale disabled:opacity-50"
                       >
                          Initiate Synthesis <ArrowRight className="w-4 h-4" />
                       </button>
                    </motion.div>
                  )}

                  {/* YOUTUBE TAB */}
                  {activeTab === 'youtube' && (
                    <motion.div 
                      key="tab-youtube"
                      initial={{ opacity: 0, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-8 lg:p-12 h-full flex flex-col"
                    >
                       <div className="mb-10">
                          <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>YouTube Transduction</h3>
                          <p className="text-sm text-muted-foreground">The atelier will derive transcripts and visual context from the video.</p>
                       </div>

                       <div className="space-y-8 flex-1">
                          <div className="relative group">
                             <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#3B9BC8]/10 flex items-center justify-center">
                                <Video className="w-4 h-4 text-[#3B9BC8]" />
                             </div>
                             <input 
                               type="url"
                               placeholder="Paste YouTube Link..."
                               className="lumina-input pl-16 py-5 rounded-[1.5rem] bg-muted/30 focus:bg-white transition-all text-sm font-semibold"
                               value={youtubeUrl}
                               onChange={e => setYoutubeUrl(e.target.value)}
                             />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             {['University Lecture', 'Technical Workshop', 'Research Summary', 'TED Talk'].map(tag => (
                               <button 
                                 key={tag}
                                 onClick={() => setYoutubeUrl(prev => prev || 'https://')}
                                 className="p-4 rounded-2xl bg-muted/40 hover:bg-[#3B9BC8]/5 hover:border-[#3B9BC8]/20 border border-transparent text-left transition-all"
                               >
                                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground group-hover:text-[#3B9BC8]">{tag}</span>
                               </button>
                             ))}
                          </div>
                       </div>

                        <button
                         disabled={!youtubeUrl.trim()}
                         onClick={() => handleProcess('youtube')}
                         className="w-full py-5 rounded-3xl mt-10 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:grayscale shadow-xl shadow-atelier-sky/20"
                         style={{ background: 'var(--atelier-sky)' }}
                       >
                          Transduce Content <Zap className="w-4 h-4" />
                       </button>
                    </motion.div>
                  )}

                  {/* TEXT TAB */}
                  {activeTab === 'text' && (
                    <motion.div 
                      key="tab-text"
                      initial={{ opacity: 0, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, x: -10 }}
                      className="p-8 lg:p-12 h-full flex flex-col"
                    >
                       <div className="mb-10 flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Direct Synthesis</h3>
                            <p className="text-sm text-muted-foreground">Input raw academic thoughts or content blocks.</p>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-black text-muted-foreground tracking-widest">{rawText.length} Chars</span>
                          </div>
                       </div>

                       <div className="relative flex-1">
                          <textarea 
                            className="w-full h-full min-h-[300px] p-8 rounded-[2rem] bg-muted/30 focus:bg-white border-2 border-transparent focus:border-[#5E7B5A]/20 outline-none resize-none transition-all text-sm font-medium leading-relaxed"
                            placeholder="Begin typing or paste your content block here..."
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                          />
                       </div>

                        <button
                         disabled={rawText.trim().length < 20}
                         onClick={() => handleProcess('text')}
                         className="w-full py-5 rounded-3xl mt-10 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:grayscale shadow-xl shadow-atelier-sage/20"
                         style={{ background: 'var(--atelier-sage)' }}
                       >
                          Harmonize Concepts <Sparkles className="w-4 h-4" />
                       </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

