'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload as UploadIcon, Video, FileText, Type, Sparkles,
  CheckCircle2, Brain, AlertCircle, X, Lock, RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { studyApi } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import RateLimitModal from '@/components/notes/RateLimitModal';

// ── Error classifier ──────────────────────────────────────────────────────────
interface ClassifiedError {
  message: string;
  isRateLimit: boolean;
  isRetryable: boolean;
}

function classifyError(err: unknown): ClassifiedError {
  const errorVal = err as { response?: { status?: number; data?: { detail?: string } }; message?: string; code?: string };
  const status = errorVal?.response?.status;
  const detail = (errorVal?.response?.data?.detail || errorVal?.message || '').toLowerCase();

  if (status === 429) {
    return { message: '', isRateLimit: true, isRetryable: false };
  }
  if (!errorVal?.response && (errorVal?.code === 'ERR_NETWORK' || errorVal?.message?.includes('Network'))) {
    return {
      message: 'Network error — please check your connection and try again.',
      isRateLimit: false,
      isRetryable: true,
    };
  }
  if (status === 400 && (detail.includes('transcript') || detail.includes('youtube') || detail.includes('caption'))) {
    return {
      message: 'Could not extract the video transcript. Try pasting the transcript manually using the link below.',
      isRateLimit: false,
      isRetryable: false,
    };
  }
  if (status === 400 && (detail.includes('too short') || detail.includes('minimum') || detail.includes('insufficient'))) {
    return {
      message: 'The extracted content is too short. Please provide more detailed source material.',
      isRateLimit: false,
      isRetryable: false,
    };
  }
  if (status === 500) {
    return {
      message: 'The AI service encountered an unexpected error. Please try again in a moment.',
      isRateLimit: false,
      isRetryable: true,
    };
  }
  return {
    message: errorVal?.response?.data?.detail || errorVal?.message || 'An unexpected error occurred. Please try again.',
    isRateLimit: false,
    isRetryable: false,
  };
}

const inputTypes = [
  { id: 'upload' as const, label: 'Document', icon: FileText, desc: 'PDF, DOCX, PPTX, TXT', color: '#1E40AF' },
  { id: 'youtube' as const, label: 'YouTube', icon: Video, desc: 'Lecture / Video link', color: '#F59E0B' },
  { id: 'text' as const, label: 'Deep Text', icon: Type, desc: 'Raw notes / Abstract', color: '#3B82F6' },
] as const;

const steps = [
  'Initializing Atelier Environment...',
  'Extracting Raw Content...',
  'Synthesizing with Gemini 2.5 Pro...',
  'Building Study Materials...',
  'Finalizing Your Study Board...'
];

const detailedSteps = [
  'Analyzing document structure and text layers...',
  'Synthesizing core concepts and definitions...',
  'Drafting comprehensive Socratic study notes...',
  'Generating interactive practice quizzes...',
  'Structuring active recall flashcard decks...',
  'Designing visual roadmap diagrams...',
  'Creating mind map layouts...',
  'Drafting audio podcast scripts...',
  'Refining study board contents...',
  'Polishing all generated elements...'
];

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube' | 'text'>('upload');
  const [loading, setLoading] = useState(false);
  const [dynamicStatusText, setDynamicStatusText] = useState(steps[0]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRetryable, setIsRetryable] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [existingNotesCount, setExistingNotesCount] = useState<number | undefined>(undefined);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [manualTranscript, setManualTranscript] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [generationType, setGenerationType] = useState('all');
  const [lastProcessType, setLastProcessType] = useState<string>('');

  const generationOptions = [
    { id: 'all', label: 'Full Mastery Package', desc: 'Detailed notes + exam cram + presentation + quiz + more' },
    { id: 'exam_cram', label: 'Exam Tomorrow', desc: 'Ultra-short cram sheet (tables & facts only)' },
    { id: 'presentation', label: 'Presentation Prep', desc: 'Slide-by-slide speaker outline' },
    { id: 'notes', label: 'Detailed Notes only', desc: 'In-depth study guide with section diagrams' },
    { id: 'quiz', label: 'Knowledge Quiz only', desc: '15-20+ adaptive questions' },
    { id: 'flashcards', label: 'Flashcard Deck only', desc: '25-30+ recall cards' },
    { id: 'podcast', label: 'Audio Labs only', desc: 'Deep-dive podcast script' },
  ];

  const generationTip =
    'Tip: Full Mastery and Exam Tomorrow include roadmap & mind-map diagrams. If OpenRouter rate-limits (free tier), wait ~60s and tap Retry.';

  const getExistingNotesCount = async (): Promise<number> => {
    try {
      if (user) {
        const q = query(collection(db, 'notes'), where('userId', '==', user.id));
        const snap = await getDocs(q);
        return snap.size;
      }
      return Object.keys(localStorage).filter(k => k.startsWith('lumina_guest_note_')).length;
    } catch { return 0; }
  };

  const simulateProgress = () => {
    let p = 0;
    let s = 0;
    let detailedIdx = 0;
    
    setDynamicStatusText(steps[0]);

    const iv = setInterval(() => {
      if (p < 90) {
        p += Math.random() * 8 + 2;
        if (p >= 90) p = 90;
        
        if (s < steps.length - 1 && p > (s + 1) * 18) {
          s++;
          setDynamicStatusText(steps[s]);
        }
      } else {
        // Slow crawl above 90%
        p += Math.random() * 0.3 + 0.1;
        if (p > 99) p = 99;
        
        // Cycle detailed steps every 4 ticks (~5 seconds)
        const tick = Math.round((p - 90) * 10);
        if (tick % 4 === 0) {
          setDynamicStatusText(detailedSteps[detailedIdx % detailedSteps.length]);
          detailedIdx++;
        }
      }
      setProgress(p);
    }, 1200);
    return iv;
  };

  const handleProcess = async (type: string) => {
    if (loading) return;
    setLastProcessType(type);

    if (!user) {
      const guestCount = parseInt(localStorage.getItem('lumina_guest_gen_count') || '0');
      if (guestCount >= 50) {
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
    const iv = simulateProgress();

    try {
      let response;
      if (type === 'youtube') {
        if (showManualInput && manualTranscript.length > 50) {
          response = await studyApi.processText(manualTranscript, generationType);
        } else {
          if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
            throw new Error('Please provide a valid YouTube URL.');
          }
          // Pass title and channel to the API
          response = await studyApi.processYoutube(youtubeUrl, generationType, videoTitle, channelName);
        }
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
      setDynamicStatusText('Completed! Redirecting to study board...');

      // Normalise response — axios wraps in {data}, fetch returns raw JSON
      const responseData = response?.data ?? response;

      if (responseData && responseData.status === 'completed') {
        const noteData = {
          ...responseData,
          userId: user?.id || 'guest',
          createdAt: new Date().toISOString(),
          source_type: type,
          source_text: responseData.source_text || responseData.raw_text || '',
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

        setTimeout(() => router.push(`/notes?id=${noteId}`), 800);
      } else {
        // Response came back but status isn't 'completed'
        throw new Error(responseData?.detail || 'Generation failed. Please try again.');
      }
    } catch (err) {
      clearInterval(iv);
      const errorVal = err as { response?: { data?: { detail?: string } }; message?: string };
      console.error("[LUMINA] Ingestion failed with error:", err);
      if (errorVal?.response) {
        console.error("[LUMINA] Backend Response:", errorVal.response.data);
      }
      const classified = classifyError(err);
      if (classified.isRateLimit) {
        const count = await getExistingNotesCount();
        setExistingNotesCount(count);
        setShowLimitModal(true);
      } else {
        const rawMessage = errorVal?.response?.data?.detail || errorVal?.message || '';
        const displayMessage = rawMessage ? `${classified.message} (Detail: ${rawMessage})` : classified.message;
        setError(displayMessage);
        setIsRetryable(classified.isRetryable);
      }
      setLoading(false);
      setProgress(0);
      setDynamicStatusText(steps[0]);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative max-w-5xl mx-auto py-6">

        {/* Rate Limit Modal */}
        <RateLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          existingNotesCount={existingNotesCount}
        />

        {/* Full Screen AI Ingestion Loader Pop-up */}
        <AnimatePresence>
          {loading && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-md"
              />
              {/* Modal Card */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-[500px] p-12 rounded-[3rem] bg-card/75 backdrop-blur-2xl border border-accent/30 shadow-[0_20px_50px_rgba(30,64,175,0.18)] text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent/10 blur-[60px] pointer-events-none" />
                
                <div className="flex flex-col items-center text-center relative z-10">
                  {/* Animated Brain Icon Container */}
                  <div className="w-24 h-24 rounded-3xl border border-accent/20 flex items-center justify-center relative shadow-[0_0_30px_rgba(245,158,11,0.25)] bg-card/60 backdrop-blur-xl shrink-0 mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }} 
                      className="absolute inset-0 border-t-2 border-accent rounded-3xl" 
                    />
                    <Brain className="w-10 h-10 text-accent animate-pulse" />
                  </div>
                  
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent mb-2">
                    Synthesizing Session
                  </p>
                  
                  <h3 className="text-2xl font-black mb-6 tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {dynamicStatusText}
                  </h3>
                  
                  {/* Progress Bar Container */}
                  <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden relative border border-white/5 mb-4 shadow-inner">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary via-accent to-secondary" 
                      animate={{ width: `${progress}%` }} 
                    />
                  </div>
                  
                  <div className="flex justify-between items-center w-full text-xs font-bold text-muted-foreground mt-2">
                    <span className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                      Atelier Status
                    </span>
                    <span className="text-accent text-lg font-mono font-black">{Math.round(progress)}%</span>
                  </div>
                  
                  <p className="mt-8 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-relaxed">
                    Curating Socratic notes & custom visuals
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Guest limit modal (1 free generation) */}
        <AnimatePresence>
          {false && <div />}
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
                  {isRetryable && (
                    <button
                      onClick={() => handleProcess(lastProcessType || activeTab)}
                      className="mt-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Retry
                    </button>
                  )}
                </div>
                <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Selectors & Inline Loading */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`space-y-3 ${loading ? 'pointer-events-none opacity-60' : ''}`}>
              {inputTypes.map((tab) => (
                <button
                  key={tab.id}
                  disabled={loading}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group w-full relative p-6 rounded-[2rem] transition-all duration-300 ${activeTab === tab.id ? 'bg-card shadow-xl border-primary/30 border' : 'bg-card/40 hover:bg-card border border-border'
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

          </div>

          {/* Right Column: Ingestion Canvas Form */}
          <div className={`lg:col-span-8 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="bg-card min-h-[450px] rounded-[2.5rem] border border-border p-8 lg:p-12 shadow-sm">
              <AnimatePresence mode="wait">
                {activeTab === 'upload' && (
                  <motion.div key="u" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <div className="mb-10 text-left"><h3 className="text-2xl font-bold mb-2">Ingest Document</h3><p className="text-sm text-muted-foreground">PDF, DOCX, PPTX, or TXT supported.</p></div>
                    <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                      className={`relative flex-1 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center p-10 ${dragOver || file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <input type="file" disabled={loading} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md" onChange={e => setFile(e.target.files?.[0] || null)} />
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">{file ? <CheckCircle2 className="w-8 h-8 text-primary" /> : <UploadIcon className="w-8 h-8 opacity-20" />}</div>
                      <span className="text-lg font-bold">{file ? file.name : 'Drop File Here'}</span>
                    </div>
                    <div className="mt-10 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Generation Mode</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {generationOptions.map(opt => (
                          <button
                            key={opt.id} disabled={loading} onClick={() => setGenerationType(opt.id)}
                            className={`text-left p-4 rounded-2xl border transition-all ${generationType === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
                              }`}
                          >
                            <p className="text-xs font-bold mb-0.5">{opt.label}</p>
                            <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">{generationTip}</p>
                    </div>
                    <button disabled={!file || loading} onClick={() => handleProcess('file')} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 disabled:opacity-30">Initiate Synthesis</button>
                  </motion.div>
                )}
                {activeTab === 'youtube' && (
                  <motion.div key="y" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <div className="mb-10 text-left">
                      <h3 className="text-2xl font-bold mb-2">YouTube Link</h3>
                      <p className="text-sm text-muted-foreground">Extract knowledge from lectures.</p>
                    </div>

                    {!showManualInput ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Video Link</p>
                          <input type="url" disabled={loading} placeholder="Paste YouTube link..." className="w-full bg-muted rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Video Title (Help AI)</p>
                            <input type="text" disabled={loading} placeholder="e.g. E-commerce Class 1" className="w-full bg-muted rounded-xl px-5 py-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Channel Name</p>
                            <input type="text" disabled={loading} placeholder="e.g. MIT OpenCourseWare" className="w-full bg-muted rounded-xl px-5 py-3 text-xs outline-none focus:ring-2 focus:ring-primary/20" value={channelName} onChange={e => setChannelName(e.target.value)} />
                          </div>
                        </div>

                        <button
                          disabled={loading}
                          onClick={() => setShowManualInput(true)}
                          className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors text-left"
                        >
                          Link not working? Paste transcript manually
                        </button>
                      </div>
                    ) : (
                      <>
                        <textarea
                          disabled={loading}
                          className="w-full min-h-[200px] bg-muted rounded-[2rem] p-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          placeholder="Paste the video transcript here..."
                          value={manualTranscript}
                          onChange={e => setManualTranscript(e.target.value)}
                        />
                        <button
                          disabled={loading}
                          onClick={() => setShowManualInput(false)}
                          className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors text-left"
                        >
                          Back to Link Mode
                        </button>
                      </>
                    )}

                    <div className="mt-10 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Generation Mode</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {generationOptions.map(opt => (
                          <button
                            key={opt.id} disabled={loading} onClick={() => setGenerationType(opt.id)}
                            className={`text-left p-4 rounded-2xl border transition-all ${generationType === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
                              }`}
                          >
                            <p className="text-xs font-bold mb-0.5">{opt.label}</p>
                            <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">{generationTip}</p>
                    </div>
                    <button
                      disabled={loading || (showManualInput ? manualTranscript.length < 50 : !youtubeUrl)}
                      onClick={() => handleProcess('youtube')}
                      className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 disabled:opacity-30"
                    >
                      {showManualInput ? 'Synthesize Transcript' : 'Transduce Video'}
                    </button>
                  </motion.div>
                )}
                {activeTab === 'text' && (
                  <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <div className="mb-10 text-left"><h3 className="text-2xl font-bold mb-2">Deep Text</h3><p className="text-sm text-muted-foreground">Synthesize raw thoughts.</p></div>
                    <textarea disabled={loading} className="flex-1 min-h-[250px] w-full bg-muted rounded-[2rem] p-8 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Paste content..." value={rawText} onChange={e => setRawText(e.target.value)} />
                    <div className="mt-10 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Generation Mode</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {generationOptions.map(opt => (
                          <button
                            key={opt.id} disabled={loading} onClick={() => setGenerationType(opt.id)}
                            className={`text-left p-4 rounded-2xl border transition-all ${generationType === opt.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
                              }`}
                          >
                            <p className="text-xs font-bold mb-0.5">{opt.label}</p>
                            <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">{generationTip}</p>
                    </div>
                    <button disabled={rawText.length < 50 || loading} onClick={() => handleProcess('text')} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 disabled:opacity-30">Harmonize Concepts</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom Info Strip & Aesthetic Gallery */}
        <div className="mt-16 pt-12 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Info Strip */}
            <div className="md:col-span-1 p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex flex-col justify-between">
              <div>
                <Sparkles className="w-8 h-8 text-primary mb-6" />
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Curated Synthesis</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Lumina Atelier leverages advanced AI pipelines to extract, structure, and refine key concepts from your raw lectures and text.
                </p>
              </div>
              <div className="text-[10px] font-black tracking-widest uppercase text-primary mt-6">
                Powered by Gemini 2.5 Pro
              </div>
            </div>

            {/* Gallery Image 1 */}
            <div className="p-6 rounded-[2rem] bg-card border border-border flex flex-col justify-between group overflow-hidden relative">
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-muted mb-4 relative">
                <img
                  src="https://image.pollinations.ai/prompt/microscopy-neural-connection-neon-blue-gold?width=400&height=250&nologo=true&seed=lumina1"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Neural synthesis illustration"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Conceptual Maps</h4>
                <p className="text-[10px] text-muted-foreground">Beautiful interactive visual flowcharts for relationships.</p>
              </div>
            </div>

            {/* Gallery Image 2 */}
            <div className="p-6 rounded-[2rem] bg-card border border-border flex flex-col justify-between group overflow-hidden relative">
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-muted mb-4 relative">
                <img
                  src="https://image.pollinations.ai/prompt/abstract-glowing-geometric-patterns-royal-blue-gold?width=400&height=250&nologo=true&seed=lumina2"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Geometric synthesis representation"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Knowledge Recalls</h4>
                <p className="text-[10px] text-muted-foreground">Spaced-repetition systems dynamically customized to your notes.</p>
              </div>
            </div>
          </div>
        </div>
      </div >
    </DashboardLayout >
  );
}
