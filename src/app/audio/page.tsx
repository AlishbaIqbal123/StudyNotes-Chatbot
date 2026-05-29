'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Play, Pause, Square, Sparkles, Mic, ChevronRight, Volume2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

interface Episode {
  id: string;
  title: string;
  script: string;
  isGuest?: boolean;
}

function cleanScript(script: string): string {
  return script
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s/g, '')
    .replace(/---/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .trim();
}

function estimateDuration(script: string): string {
  const words = script.split(/\s+/).length;
  const minutes = Math.ceil(words / 130); // ~130 wpm for TTS
  return `~${minutes} min`;
}

function getGuestEpisodes(): Episode[] {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('lumina_guest_note_'))
      .map(k => {
        const note = JSON.parse(localStorage.getItem(k) || '{}');
        return note.podcast_script
          ? { id: k.replace('lumina_guest_note_', ''), title: note.title || 'Guest Note', script: note.podcast_script, isGuest: true }
          : null;
      })
      .filter(Boolean) as Episode[];
  } catch { return []; }
}

export default function AudioLabsPage() {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1); // ref so speakLine always reads latest speed
  const [browserSupported, setBrowserSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const totalCharsRef = useRef(0);
  const spokenCharsRef = useRef(0);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const didStartRef = useRef(false); // guard against double-start

  useEffect(() => {
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      const timer = setTimeout(() => {
        setBrowserSupported(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let all: Episode[] = [];

      if (user) {
        try {
          const q = query(collection(db, 'notes'), where('userId', '==', user.id));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            const n = d.data();
            if (n.podcast_script) {
              all.push({ id: d.id, title: n.title || 'Untitled', script: n.podcast_script });
            }
          });
        } catch (e) { console.error(e); }
      }

      all = [...all, ...getGuestEpisodes()];
      setEpisodes(all);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  /** Parse podcast script into per-speaker dialogue lines */
  interface DialogueLine { speaker: 'MAYA' | 'ALEX' | 'OTHER'; text: string }

  const parseDialogue = (script: string): DialogueLine[] => {
    const lines: DialogueLine[] = []
    for (const line of script.split('\n')) {
      const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').trim()
      if (!clean) continue
      const maya = clean.match(/^MAYA:\s*(.+)/i)
      const alex = clean.match(/^ALEX:\s*(.+)/i)
      if (maya) lines.push({ speaker: 'MAYA', text: maya[1].trim() })
      else if (alex) lines.push({ speaker: 'ALEX', text: alex[1].trim() })
      else {
        const stripped = clean
          .replace(/#{1,6}\s/g, '').replace(/`{1,3}/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/>\s/g, '').replace(/---+/g, '').trim()
        if (stripped) lines.push({ speaker: 'OTHER', text: stripped })
      }
    }
    if (!lines.some(l => l.speaker !== 'OTHER')) {
      const fallback = cleanScript(script)
      return [{ speaker: 'MAYA', text: fallback }]
    }
    return lines
  }

  const pickVoices = (all: SpeechSynthesisVoice[]) => {
    const en = all.filter(v => v.lang.startsWith('en'))
    if (en.length === 0) return { maya: all[0] || null, alex: all[1] || null }
    const femaleHints = /female|woman|zira|samantha|karen|victoria|moira|fiona|tessa|susan|google uk english female/i
    const maleHints = /male|man|david|james|daniel|alex|google uk english male/i
    const females = en.filter(v => femaleHints.test(v.name))
    const males = en.filter(v => maleHints.test(v.name))
    const maya = females[0] || en[0] || null
    const alex = males[0] || en.find(v => v !== maya) || en[1] || null
    return { maya, alex }
  }

  const stopKeepAlive = () => {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
  };

  const startKeepAlive = () => {
    stopKeepAlive();
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 10000);
  };

  const speakLine = (
    voices: { maya: SpeechSynthesisVoice | null; alex: SpeechSynthesisVoice | null },
    lines: DialogueLine[],
    idx: number,
    speedMult: number
  ) => {
    const synth = window.speechSynthesis;
    if (idx >= lines.length) {
      setIsSpeaking(false); setIsPaused(false); setProgress(100); stopKeepAlive(); return;
    }
    const line = lines[idx];
    const utterance = new SpeechSynthesisUtterance(line.text);
    utteranceRef.current = utterance;

    const voice = line.speaker === 'ALEX' ? voices.alex : voices.maya;
    if (voice) utterance.voice = voice;

    // Base rate per speaker × speedRef.current so live speed changes take effect immediately
    const baseRate = line.speaker === 'MAYA' ? 0.95 : line.speaker === 'ALEX' ? 0.88 : 0.90;
    utterance.rate = Math.min(3, baseRate * speedRef.current);
    utterance.pitch = line.speaker === 'MAYA' ? 1.15 : line.speaker === 'ALEX' ? 0.88 : 1.0;
    utterance.volume = line.speaker === 'OTHER' ? 0.85 : 1.0;

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        const spoken = spokenCharsRef.current + e.charIndex;
        setProgress(Math.min(99, Math.round((spoken / totalCharsRef.current) * 100)));
      }
    };
    utterance.onend = () => {
      spokenCharsRef.current += line.text.length;
      chunkIndexRef.current = idx + 1;
      speakLine(voices, lines, idx + 1, speedMult);
    };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        setIsSpeaking(false); setIsPaused(false); stopKeepAlive();
      }
    };
    synth.speak(utterance);
  };

  const currentEpisode = episodes.find(e => e.id === currentId);

  const handlePlay = (episode: Episode) => {
    if (!browserSupported) return;
    const synth = window.speechSynthesis;

    if (currentId === episode.id && isPaused) {
      synth.resume(); setIsPaused(false); setIsSpeaking(true); startKeepAlive(); return;
    }

    synth.cancel(); stopKeepAlive(); setProgress(0);
    didStartRef.current = false;

    const lines = parseDialogue(episode.script);
    if (!lines.length) return;

    chunksRef.current = lines.map(l => l.text);
    chunkIndexRef.current = 0;
    spokenCharsRef.current = 0;
    totalCharsRef.current = lines.reduce((s, l) => s + l.text.length, 0);

    setCurrentId(episode.id); setIsSpeaking(true); setIsPaused(false);

    const currentSpeed = speed;

    const doSpeak = (allVoices: SpeechSynthesisVoice[]) => {
      if (didStartRef.current) return; // prevent double-fire
      didStartRef.current = true;
      voicesRef.current = allVoices;
      const voices = pickVoices(allVoices);
      startKeepAlive();
      speakLine(voices, lines, 0, currentSpeed);
    };

    const voices = synth.getVoices();
    if (voices.length > 0) {
      doSpeak(voices);
    } else {
      const handleVoicesChanged = () => {
        synth.removeEventListener('voiceschanged', handleVoicesChanged);
        doSpeak(synth.getVoices());
      };
      synth.addEventListener('voiceschanged', handleVoicesChanged);
      setTimeout(() => {
        synth.removeEventListener('voiceschanged', handleVoicesChanged);
        doSpeak(synth.getVoices());
      }, 400);
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
    stopKeepAlive();
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentId(null);
    chunkIndexRef.current = 0;
    spokenCharsRef.current = 0;
    stopKeepAlive();
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-primary/20 bg-primary/5">
            <Headphones className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Audio Labs
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Auditory <span className="italic text-primary">Labs</span>
          </h1>
          <p className="text-lg text-muted-foreground">Listen to AI-generated podcast summaries of your notes.</p>
        </div>

        {/* Browser not supported */}
        {!browserSupported && (
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 mb-10">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">Audio playback is not supported in your browser. Please use Chrome or Edge.</p>
          </div>
        )}

        {/* Active Player Bar */}
        <AnimatePresence>
          {currentEpisode && (isSpeaking || isPaused) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
            >
              <div className="bg-[#0F0807] text-white rounded-[2rem] p-6 shadow-2xl border border-white/10 flex items-center gap-6">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Now Playing</p>
                  <p className="font-bold text-sm truncate">{currentEpisode.title}</p>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Speed selector */}
                  <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
                    {[0.75, 1, 1.25, 1.5, 2].map(s => (
                      <button
                        key={s}
                        onClick={() => { setSpeed(s); speedRef.current = s; }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${speed === s ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                  {isSpeaking ? (
                    <button onClick={handlePause}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => handlePlay(currentEpisode)}
                      className="w-10 h-10 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={handleStop}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-[2rem] shimmer" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && episodes.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8">
              <Headphones className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>No Audio Content Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed">
              Generate a note with the <strong>Audio Labs</strong> or <strong>Full Mastery Package</strong> option to create your first episode.
            </p>
            <Link href="/upload" className="btn-primary px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2">
              Create First Episode <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Episode list */}
        {!loading && episodes.length > 0 && (
          <div className="space-y-4 pb-32">
            {episodes.map((ep, i) => {
              const isActive = currentId === ep.id;
              const isPlaying = isActive && isSpeaking;
              const isPausedThis = isActive && isPaused;

              return (
                <motion.div
                  key={ep.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-300 ${isActive
                    ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/10'
                    : 'bg-card border-border hover:border-primary/20 hover:shadow-md'
                    }`}
                >
                  {/* Play button */}
                  <button
                    onClick={() => isPlaying ? handlePause() : handlePlay(ep)}
                    disabled={!browserSupported}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${isPlaying
                      ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                      : isPausedThis
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground hover:bg-primary hover:text-white'
                      } disabled:opacity-40`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-base truncate">{ep.title}</h3>
                      {ep.isGuest && (
                        <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-primary/60 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                          Guest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Volume2 className="w-3 h-3" />
                        {estimateDuration(ep.script)}
                      </span>
                      {isActive && (
                        <>
                          <div className="flex items-center gap-1">
                            {[...Array(4)].map((_, j) => (
                              <motion.div
                                key={j}
                                className="w-1 bg-primary rounded-full"
                                animate={isPlaying ? { height: [4, 12, 4] } : { height: 4 }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: j * 0.15 }}
                              />
                            ))}
                          </div>
                          {/* Speed buttons — only on active row */}
                          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                            {[0.75, 1, 1.25, 1.5, 2].map(s => (
                              <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); setSpeed(s); speedRef.current = s; }}
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-black transition-all ${speed === s ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                              >
                                {s}×
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {isActive && (
                      <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Stop button (only when active) */}
                  {isActive && (
                    <button
                      onClick={handleStop}
                      className="w-10 h-10 rounded-full bg-muted hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .shimmer {
          background: linear-gradient(90deg, var(--muted) 25%, var(--card) 50%, var(--muted) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer { to { background-position-x: -200%; } }
      `}</style>
    </DashboardLayout>
  );
}
