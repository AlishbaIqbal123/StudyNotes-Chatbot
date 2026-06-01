'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload as UploadIcon, Video, FileText, Type, Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { studyApi } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import RateLimitModal from '@/components/notes/RateLimitModal';
import UploadLoadingOverlay from '@/components/upload/UploadLoadingOverlay';
import UploadColdStartBanner from '@/components/upload/UploadColdStartBanner';
import ErrorStateScreen from '@/components/ui/ErrorStateScreen';
import { useBackendWakeContext } from '@/components/BackendWakeProvider';
import {
  classifyUploadError,
  isUploadErrorType,
  UPLOAD_ERROR_META,
  type UploadErrorType,
} from '@/lib/uploadErrors';
import {
  inferGenerationStatus,
  markQuotaLimitReached,
  parseGenerationStatusFromResponse,
  type GenerationStatusReport,
} from '@/lib/generationStatus';
import { parseApiError } from '@/lib/apiErrors';

// ── Error classifier (re-exported helpers) ─────────────────────────────────────

const inputTypes = [
  { id: 'upload' as const, label: 'Document', icon: FileText, desc: 'PDF, DOCX, PPTX, TXT', color: '#1E40AF' },
  { id: 'youtube' as const, label: 'Video Transcript', icon: Video, desc: 'Paste captions or lecture text', color: '#F59E0B' },
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
  const { status: backendStatus, pingBackend } = useBackendWakeContext();
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube' | 'text'>('upload');
  const [loading, setLoading] = useState(false);
  const [dynamicStatusText, setDynamicStatusText] = useState(steps[0]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<UploadErrorType | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | undefined>();
  const [isRetryable, setIsRetryable] = useState(false);
  const [wakeStatus, setWakeStatus] = useState<'idle' | 'waking' | 'ready'>('idle');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [existingNotesCount, setExistingNotesCount] = useState<number | undefined>(undefined);
  const [generationReport, setGenerationReport] = useState<GenerationStatusReport | null>(null);

  const [transcriptTitle, setTranscriptTitle] = useState('');
  const [manualTranscript, setManualTranscript] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [generationType, setGenerationType] = useState('all');
  const [lastProcessType, setLastProcessType] = useState<string>('');

  const isOptionSelected = (id: string) => {
    return generationType.split(',').map(x => x.trim()).includes(id);
  };

  const toggleGenerationType = (id: string) => {
    if (id === 'all') {
      setGenerationType('all');
      return;
    }
    const current = generationType.split(',').map(x => x.trim()).filter(Boolean);
    let updated = current.filter(x => x !== 'all');
    if (updated.includes(id)) {
      updated = updated.filter(x => x !== id);
    } else {
      updated.push(id);
    }
    if (updated.length === 0) {
      setGenerationType('all');
    } else {
      setGenerationType(updated.join(','));
    }
  };

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

  const inputReady =
    (activeTab === 'upload' && !!file) ||
    (activeTab === 'youtube' && manualTranscript.trim().length >= 50) ||
    (activeTab === 'text' && rawText.length >= 50);

  // Pre-warm backend while user prepares content (before they click generate)
  useEffect(() => {
    if (inputReady && backendStatus !== 'online') {
      void pingBackend();
    }
  }, [inputReady, backendStatus, pingBackend]);

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

  const clearPreviewParams = () => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('previewError');
    url.searchParams.delete('previewLoading');
    const qs = url.searchParams.toString();
    window.history.replaceState({}, '', qs ? `${url.pathname}?${qs}` : url.pathname);
  };

  const clearError = () => {
    setError(null);
    setErrorType(null);
    setErrorDetail(undefined);
    setIsRetryable(false);
    clearPreviewParams();
  };

  const showError = (type: UploadErrorType, message: string, detail?: string, retryable = false) => {
    setErrorType(type);
    setError(message);
    setErrorDetail(detail);
    setIsRetryable(retryable);
  };

  // Preview URLs: ?previewLoading=1 | ?previewError=network (etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewError = params.get('previewError');
    const previewLoading = params.get('previewLoading');

    if (isUploadErrorType(previewError)) {
      if (previewError === 'rate_limit') {
        setShowLimitModal(true);
        return;
      }
      const retryable = previewError === 'network' || previewError === 'server' || previewError === 'generation_failed';
      showError(previewError, UPLOAD_ERROR_META[previewError].subtitle, undefined, retryable);
    }

    if (previewLoading === '1') {
      setLoading(true);
      setWakeStatus('waking');
      setProgress(42);
      setDynamicStatusText(steps[2]);
    }
  }, []);

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
      showError('file_too_large', 'Content volume exceeds atelier capacity (15MB limit).');
      return;
    }
    if (type === 'youtube' && manualTranscript.trim().length < 50) {
      showError('validation', 'Paste at least 50 characters of transcript or lecture notes.');
      return;
    }
    if (type === 'text' && rawText.length < 50) {
      showError('validation', 'Input text is too brief (min 50 chars).');
      return;
    }
    if (type === 'file' && !file) {
      showError('validation', 'Choose a document before starting synthesis.');
      return;
    }

    clearError();
    setLoading(true);
    setWakeStatus(backendStatus === 'online' ? 'ready' : 'waking');
    setProgress(5);
    const iv = simulateProgress();

    // Wake HF backend in parallel — no manual URL visit needed
    void pingBackend().then((ok) => setWakeStatus(ok ? 'ready' : 'waking'));

    try {
      let response;
      if (type === 'youtube') {
        const content = transcriptTitle.trim()
          ? `# ${transcriptTitle.trim()}\n\n${manualTranscript.trim()}`
          : manualTranscript.trim();
        response = await studyApi.processText(content, generationType);
      }
      else if (type === 'text') {
        response = await studyApi.processText(rawText, generationType);
      }
      else if (type === 'file' && file) {
        response = await studyApi.processFile(file, generationType);
      }
      else {
        throw Object.assign(new Error('No valid input detected.'), { _validation: true });
      }

      clearInterval(iv);
      setProgress(100);
      setDynamicStatusText('Completed! Redirecting to study board...');

      // Normalise response — axios wraps in {data}, fetch returns raw JSON
      const responseData = response?.data ?? response;

      if (
        responseData &&
        ['completed', 'partial', 'quota_exceeded'].includes(String(responseData.status))
      ) {
        const notesBody = responseData.simplified_content || responseData.simplified_notes || '';
        const genStatus =
          parseGenerationStatusFromResponse(responseData as Record<string, unknown>) ||
          inferGenerationStatus({ ...responseData, simplified_notes: notesBody } as Record<string, unknown>);

        const noteData = {
          ...responseData,
          simplified_notes: notesBody,
          userId: user?.id || 'guest',
          createdAt: new Date().toISOString(),
          source_type: type,
          source_text: responseData.source_text || responseData.raw_text || '',
          status: genStatus.overall === 'completed' ? 'completed' : 'partial',
          generation_status: genStatus,
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

        const isPartial = genStatus.overall !== 'completed';
        if (genStatus.quotaExceeded) markQuotaLimitReached();

        if (isPartial) {
          const count = await getExistingNotesCount();
          setExistingNotesCount(count + 1);
          setGenerationReport(genStatus);
          setTimeout(() => router.push(`/notes?id=${noteId}&limitReached=1`), 800);
        } else {
          setTimeout(() => router.push(`/notes?id=${noteId}`), 800);
        }
      } else if (responseData?.status === 'failed') {
        throw Object.assign(new Error(responseData?.detail || 'Generation failed. Please try again.'), { _generation: true });
      } else {
        throw Object.assign(new Error(responseData?.detail || 'Generation failed. Please try again.'), { _generation: true });
      }
    } catch (err) {
      clearInterval(iv);
      console.error("[LUMINA] Ingestion failed with error:", err);

      const errorVal = err as { message?: string; _validation?: boolean; _generation?: boolean };
      const apiErr = parseApiError(err);

      if (errorVal._validation) {
        showError('validation', errorVal.message || 'Please complete the form before synthesizing.');
      } else if (errorVal._generation) {
        showError('generation_failed', errorVal.message || 'Generation failed.', errorVal.message, true);
      } else if (apiErr.kind === 'quota_exceeded' || apiErr.kind === 'payment_required') {
        markQuotaLimitReached();
        const count = await getExistingNotesCount();
        setExistingNotesCount(count);
        setGenerationReport(null);
        setShowLimitModal(true);
      } else {
        showError(apiErr.uploadErrorType, apiErr.userHint, apiErr.detail, apiErr.isRetryable);
      }
      setLoading(false);
      setWakeStatus('idle');
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
          generationStatus={generationReport}
        />

        {/* Pinterest-style skeleton loading overlay */}
        {loading && (
          <UploadLoadingOverlay
            statusText={dynamicStatusText}
            progress={progress}
            wakeStatus={wakeStatus}
          />
        )}

        {/* Typed error screen with cursor-following cartoon */}
        {errorType && !loading && (
          <ErrorStateScreen
            errorType={errorType}
            message={error || undefined}
            detail={errorDetail}
            isRetryable={isRetryable}
            onRetry={isRetryable ? () => handleProcess(lastProcessType || activeTab) : undefined}
            onDismiss={clearError}
            onBack={clearError}
          />
        )}

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

          <UploadColdStartBanner />
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
                            key={opt.id} disabled={loading} onClick={() => toggleGenerationType(opt.id)}
                            className={`text-left p-4 rounded-2xl border transition-all ${isOptionSelected(opt.id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
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
                    <div className="mb-8 text-left">
                      <h3 className="text-2xl font-bold mb-2">Video Transcript</h3>
                      <p className="text-sm text-muted-foreground">
                        Paste the lecture transcript or captions (from YouTube → ⋯ → Show transcript → copy, or any caption file).
                      </p>
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col min-h-0">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Lecture title (optional)</p>
                        <input
                          type="text"
                          disabled={loading}
                          placeholder="e.g. APIs & Webhooks — Lecture 3"
                          className="w-full bg-muted rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          value={transcriptTitle}
                          onChange={e => setTranscriptTitle(e.target.value)}
                        />
                      </div>
                      <textarea
                        disabled={loading}
                        className="flex-1 min-h-[220px] w-full bg-muted rounded-[2rem] p-6 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        placeholder="Paste full transcript here (minimum 50 characters)..."
                        value={manualTranscript}
                        onChange={e => setManualTranscript(e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Automatic YouTube link extraction is not available — paste the text and we will build your study board from it.
                      </p>
                    </div>

                    <div className="mt-10 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Generation Mode</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {generationOptions.map(opt => (
                          <button
                            key={opt.id} disabled={loading} onClick={() => toggleGenerationType(opt.id)}
                            className={`text-left p-4 rounded-2xl border transition-all ${isOptionSelected(opt.id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
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
                      disabled={loading || manualTranscript.trim().length < 50}
                      onClick={() => handleProcess('youtube')}
                      className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-bold shadow-lg shadow-primary/20 disabled:opacity-30"
                    >
                      Synthesize from Transcript
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
                            key={opt.id} disabled={loading} onClick={() => toggleGenerationType(opt.id)}
                            className={`text-left p-4 rounded-2xl border transition-all ${isOptionSelected(opt.id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/20 bg-card'
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
