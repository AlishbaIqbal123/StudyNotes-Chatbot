'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload as UploadIcon, Video, FileText, Type, Sparkles,
  CheckCircle2, ArrowRight, Brain, Zap, Globe, AlertCircle, X,
  Lock, UserPlus, LogIn
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { studyApi } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

const inputTypes = [
  {
    id: 'upload' as const,
    label: 'Document',
    icon: FileText,
    desc: 'PDF, DOCX, Images',
    color: '#E60023',
  },
  {
    id: 'youtube' as const,
    label: 'YouTube',
    icon: Video,
    desc: 'Lecture / Video link',
    color: '#3B9BC8',
  },
  {
    id: 'text' as const,
    label: 'Deep Text',
    icon: Type,
    desc: 'Raw notes / Abstract',
    color: '#5E7B5A',
  },
] as const;

const steps = [
  'Initializing Atelier Environment...',
  'Extracting Raw Content...',
  'Deep Researching via Tavily...',
  'Synthesizing Insights & Visuals...',
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
  const [showLimitModal, setShowLimitModal] = useState(false);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [generationType, setGenerationType] = useState('all');

  const generationOptions = [
    { id: 'all', label: 'Full Mastery Package', desc: 'Notes, Quiz, Flashcards, Roadmap, Audio' },
    { id: 'notes', label: 'Detailed Notes only', desc: 'Core study material' },
    { id: 'quiz', label: 'Knowledge Quiz only', desc: '15-20+ adaptive questions' },
    { id: 'flashcards', label: 'Flashcard Deck only', desc: '25-30+ recall cards' },
    { id: 'podcast', label: 'Audio Labs only', desc: 'Deep-dive podcast script' },
  ];

  const simulateProgress = () => {
    let p = 0;
    let s = 0;
    const iv = setInterval(() => {
      p += Math.random() * 8;
      if (p > 92) p = 92;
      setProgress(Math.min(p, 92));
      if (s < steps.length - 1 && p > (s + 1) * 18) {
        s++;
        setStepIdx(s);
      }
    }, 1200);
    return iv;
  };

  const handleProcess = async (type: string) => {
    if (loading) return;

    if (!user) {
      const guestCount = parseInt(localStorage.getItem('lumina_guest_gen_count') || '0');
      if (guestCount >= 1) {
        setShowLimitModal(true);
        return;
      }
    }
    
    if (type === 'file' && file && file.size > 15 * 1024 * 1024) {
      setError('Content volume exceeds atelier capacity (15MB limit).');
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(5);
    setStepIdx(0);
    const iv = simulateProgress();

    try {
      let response;
      if (type === 'youtube') {
        if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
          throw new Error('Please provide a valid YouTube URL.');
        }
        response = await studyApi.processYoutube(youtubeUrl, generationType);
      }
      else if (type === 'text') {
        if (rawText.length < 50) throw new Error('Input text is too brief (min 50 chars).');
        response = await studyApi.processText(rawText, generationType);
      }
      else if (type === 'file' && file) {
        response = await studyApi.processFile(file, generationType);
      }
      else throw new Error('No valid input detected.');

      clearInterval(iv);
      setProgress(100);
      setStepIdx(steps.length - 1);

      if (response?.data) {
        const noteData = {
          ...response.data,
          userId: user?.id || 'guest',
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
          const currentCount = parseInt(localStorage.getItem('lumina_guest_gen_count') || '0');
          localStorage.setItem('lumina_guest_gen_count', (currentCount + 1).toString());
        }

        setTimeout(() => router.push(`/notes?id=${noteId}`), 1200);
      }
    } catch (err: any) {
      clearInterval(iv);
      const msg = err?.response?.data?.detail || err?.message || 'The atelier encountered an error. Please try again.';
      setError(msg);
      setLoading(false);
      setProgress(0);
      setStepIdx(0);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative max-w-5xl mx-auto py-6">
        
        {/* Limit Modal */}
        <AnimatePresence>
          {showLimitModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLimitModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
               <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-card rounded-[3rem] p-10 shadow-2xl border border-border text-center overflow-hidden">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                     <Lock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Limit <span className="italic">Reached</span></h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-10">Free guest access is exhausted. Unlock unlimited research by joining the atelier.</p>
                  <div className="grid gap-3">
                     <Link href="/signup" className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">Initialize Account</Link>
                     <Link href="/login" className="flex items-center justify-center gap-2 w-full py-4 bg-background border border-border text-foreground rounded-full font-black text-[10px] uppercase tracking-widest">Returning Member</Link>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-primary/20 bg-primary/5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Content Ingestion</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            New Study <span className="italic">Session</span>
          </h1>
          <p className="text-lg max-w-2xl text-muted-foreground">Transform source material into research-backed notes.</p>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 text-red-500"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                   <p className="text-xs font-black uppercase tracking-widest mb-1">Synthesis Failure</p>
                   <p className="text-sm font-medium">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/10 rounded-lg">
                   <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-3">
              {inputTypes.map((tab) => (
                <button
                  key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`group w-full relative p-6 rounded-[2rem] transition-all duration-300 ${
                    activeTab === tab.id ? 'bg-card shadow-xl border-primary/30 border' : 'bg-card/40 hover:bg-card border border-border'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                         style={{ background: activeTab === tab.id ? tab.color : 'var(--muted)', color: activeTab === tab.id ? 'white' : 'var(--muted-foreground)' }}>
                      <tab.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-sm mb-0.5">{tab.label}</h4>
                      <p className="text-[10px] uppercase tracking-widest opacity-40 font-black">{tab.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8">
              <div className="bg-card min-h-[450px] rounded-[2.5rem] border border-border p-8 lg:p-12 shadow-sm">
                <AnimatePresence mode="wait">
                  {activeTab === 'upload' && (
                    <motion.div key="u" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                       <div className="mb-10 text-left"><h3 className="text-2xl font-bold mb-2">Ingest Document</h3><p className="text-sm text-muted-foreground">PDF, DOCX, or Images supported.</p></div>
                       <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                         className={`relative flex-1 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center p-10 ${dragOver || file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.docx,.doc,.txt" onChange={e => setFile(e.target.files?.[0] || null)} />
                          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">{file ? <CheckCircle2 className="w-8 h-8 text-primary" /> : <UploadIcon className="w-8 h-8 opacity-20" />}</div>
                          <span className="text-lg font-bold">{file ? file.name : 'Drop File Here'}</span>
                       </div>
                       <div className="mt-10 mb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Generation Mode</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {generationOptions.map(opt => (
                              <button 
                                key={opt.id} onClick={() => setGenerationType(opt.id)}
                                className={`text-left p-4 rounded-2xl border transition-all ${
                                  generationType === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
                                }`}
                              >
                                <p className="text-xs font-bold mb-0.5">{opt.label}</p>
                                <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                       </div>
                       <button disabled={!file} onClick={() => handleProcess('file')} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 disabled:opacity-30">Initiate Synthesis</button>
                    </motion.div>
                  )}
                  {activeTab === 'youtube' && (
                    <motion.div key="y" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                       <div className="mb-10 text-left"><h3 className="text-2xl font-bold mb-2">YouTube Link</h3><p className="text-sm text-muted-foreground">Extract knowledge from lectures.</p></div>
                       <input type="url" placeholder="Paste link..." className="w-full bg-muted rounded-2xl px-6 py-5 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
                       <div className="flex-1" />
                       <div className="mt-10 mb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Generation Mode</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {generationOptions.map(opt => (
                              <button 
                                key={opt.id} onClick={() => setGenerationType(opt.id)}
                                className={`text-left p-4 rounded-2xl border transition-all ${
                                  generationType === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
                                }`}
                              >
                                <p className="text-xs font-bold mb-0.5">{opt.label}</p>
                                <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                       </div>
                       <button disabled={!youtubeUrl} onClick={() => handleProcess('youtube')} className="w-full py-5 bg-[#3B9BC8] text-white rounded-[1.5rem] font-bold shadow-lg disabled:opacity-30">Transduce Video</button>
                    </motion.div>
                  )}
                  {activeTab === 'text' && (
                    <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                       <div className="mb-10 text-left"><h3 className="text-2xl font-bold mb-2">Deep Text</h3><p className="text-sm text-muted-foreground">Synthesize raw thoughts.</p></div>
                       <textarea className="flex-1 min-h-[250px] w-full bg-muted rounded-[2rem] p-8 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Paste content..." value={rawText} onChange={e => setRawText(e.target.value)} />
                       <div className="mt-10 mb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Generation Mode</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {generationOptions.map(opt => (
                              <button 
                                key={opt.id} onClick={() => setGenerationType(opt.id)}
                                className={`text-left p-4 rounded-2xl border transition-all ${
                                  generationType === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
                                }`}
                              >
                                <p className="text-xs font-bold mb-0.5">{opt.label}</p>
                                <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                       </div>
                       <button disabled={rawText.length < 50} onClick={() => handleProcess('text')} className="w-full py-5 bg-[#5E7B5A] text-white rounded-[1.5rem] font-bold shadow-lg disabled:opacity-30">Harmonize Concepts</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-[3rem] p-20 flex flex-col items-center border border-border shadow-xl">
             <div className="w-32 h-32 rounded-full border-2 border-primary/10 flex items-center justify-center mb-10 relative">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }} className="absolute inset-0 border-t-2 border-primary rounded-full" />
                <Brain className="w-12 h-12 text-primary animate-pulse" />
             </div>
             <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>{steps[stepIdx]}</h2>
             <div className="w-full max-w-sm h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
             </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
