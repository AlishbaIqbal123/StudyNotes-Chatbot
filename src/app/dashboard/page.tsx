'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical, FileText, Video, BookOpen, Sparkles,
  Plus, TrendingUp, Filter, Search, Grid, List, Clock, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import QuranAyahWidget from '@/components/dashboard/QuranAyahWidget';
import PinGridSkeleton from '@/components/ui/PinGridSkeleton';
import { useBackendWakeContext } from '@/components/BackendWakeProvider';

const getTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'youtube': return Video;
    case 'file': return BookOpen;
    default: return FileText;
  }
};

const palettes = [
  { from: 'color-mix(in srgb, #1E40AF, transparent 92%)', to: 'color-mix(in srgb, #1E40AF, transparent 86%)', accent: '#1E40AF', shadow: 'rgba(30,64,175,0.1)' },
  { from: 'color-mix(in srgb, #F59E0B, transparent 92%)', to: 'color-mix(in srgb, #F59E0B, transparent 86%)', accent: '#F59E0B', shadow: 'rgba(245,158,11,0.1)' },
  { from: 'color-mix(in srgb, #3B82F6, transparent 92%)', to: 'color-mix(in srgb, #3B82F6, transparent 86%)', accent: '#3B82F6', shadow: 'rgba(59,130,246,0.1)' },
  { from: 'color-mix(in srgb, #D97706, transparent 92%)', to: 'color-mix(in srgb, #D97706, transparent 86%)', accent: '#D97706', shadow: 'rgba(217,119,6,0.1)' },
];

interface DashboardNote {
  id: string;
  title?: string;
  source_type?: string;
  createdAt?: { seconds: number } | string | number | Date;
  isGuest?: boolean;
  visual_prompt?: string;
  quizzes?: unknown[];
  flashcards?: unknown[];
  [key: string]: unknown;
}

interface QuranItem {
  id: string;
  renderType: 'quran';
}

interface ActionItem {
  id: string;
  renderType: 'action';
  title: string;
  desc: string;
  subject: string;
}

interface NoteItem {
  id: string;
  renderType: 'note';
  data: DashboardNote;
  index: number;
}

type GridItem = QuranItem | ActionItem | NoteItem;

export default function DashboardPage() {
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'youtube' | 'file' | 'text'>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { user } = useAuth();
  const { status: backendStatus, pingBackend, wakeIntervalMs } = useBackendWakeContext();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timer: NodeJS.Timeout | null = null;

    const getGuestNotes = (): DashboardNote[] => {
      try {
        return Object.keys(localStorage)
          .filter(k => k.startsWith('lumina_guest_note_'))
          .map(k => {
            const n = JSON.parse(localStorage.getItem(k) || '{}');
            return { id: k.replace('lumina_guest_note_', ''), ...n, isGuest: true };
          });
      } catch { return []; }
    };

    if (user) {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: false },
        (snap) => {
          const userNotes = snap.docs.map(d => ({ id: d.id, ...d.data() } as DashboardNote));
          setNotes([...userNotes, ...getGuestNotes()]);
          setLoading(false);
        },
        (err) => {
          console.error('Library snapshot error:', err);
          setNotes(getGuestNotes());
          setLoading(false);
        }
      );
    } else {
      timer = setTimeout(() => {
        setNotes(getGuestNotes());
        setLoading(false);
      }, 0);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [user?.id]);

  const handleDelete = async (noteId: string, isGuest: boolean) => {
    if (!confirm('Are you sure you want to delete this archive? This action cannot be undone.')) return;

    try {
      if (isGuest) {
        localStorage.removeItem(`lumina_guest_note_${noteId}`);
      } else {
        await deleteDoc(doc(db, 'notes', noteId));
      }
      setNotes(notes.filter(n => n.id !== noteId));
      setOpenMenu(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete note.');
    }
  };

  const handleRename = async (noteId: string, isGuest: boolean) => {
    const newTitle = prompt('Enter new title for this archive:');
    if (!newTitle || !newTitle.trim()) return;

    try {
      if (isGuest) {
        const key = `lumina_guest_note_${noteId}`;
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        data.title = newTitle.trim();
        localStorage.setItem(key, JSON.stringify(data));
      } else {
        await updateDoc(doc(db, 'notes', noteId), { title: newTitle.trim() });
      }
      setNotes(notes.map(n => n.id === noteId ? { ...n, title: newTitle.trim() } : n));
      setOpenMenu(null);
    } catch (err) {
      console.error('Rename error:', err);
      alert('Failed to rename note.');
    }
  };

  const filteredNotes = filter === 'all' ? notes : notes.filter(n => n.source_type === filter);

  return (
    <DashboardLayout>
      <div className="relative" onClick={() => setOpenMenu(null)}>

        {/* Editorial Header */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-primary/20 bg-primary/5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Digital Archive
            </span>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                Knowledge <span className="italic">Atelier</span>
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Your curated board of intellectual synthesis. Each piece is a gateway to deeper conceptual understanding.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1.5 rounded-[2rem] bg-muted/30 backdrop-blur-md border border-white lg:mb-1 self-start">
              {(['all', 'file', 'youtube', 'text'] as const).map(f => (
                <button
                  key={f}
                  onClick={(e) => { e.stopPropagation(); setFilter(f); }}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filter === f ? 'bg-white text-primary shadow-lg shadow-black/5' : 'text-muted-foreground hover:text-black'
                    }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {f === 'all' ? 'All' : f === 'file' ? 'Docs' : f === 'youtube' ? 'Transcript' : 'Text'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Focus Time */}
          <div className="p-6 rounded-[2rem] bg-card border border-border hover:border-primary/20 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Focus Time</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">24.5</span>
              <span className="text-sm font-bold text-muted-foreground">hrs</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Active study workspace sessions</p>
          </div>

          {/* New Concepts */}
          <div className="p-6 rounded-[2rem] bg-card border border-border hover:border-gold transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-secondary/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Concepts</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-gold">142</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Unique ideas synthesized by Lumina AI</p>
          </div>

          {/* Retention */}
          <div className="p-6 rounded-[2rem] bg-card border border-border hover:border-primary/20 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retention Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">88</span>
              <span className="text-sm font-bold text-muted-foreground">%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Spaced recall target retention score</p>
          </div>
        </div>

        {/* Pinterest-style skeleton while library loads */}
        {loading && (
          <PinGridSkeleton showHeader={false} showStats cardCount={12} />
        )}

        {/* EMPTY STATE */}
        {!loading && filteredNotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 lg:py-40 text-center"
          >
            <div className="relative mb-10">
              <div className="w-24 h-24 rounded-[2.25rem] bg-muted/40 flex items-center justify-center rotate-3 border-2 border-white">
                <Plus className="w-10 h-10 text-muted-foreground opacity-30" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-[1.25rem] bg-primary flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Start Your First Collection</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">Your knowledge board is a blank canvas. Upload source material to begin the synthesis process.</p>
            <div className="w-full max-w-md mb-10">
              <QuranAyahWidget
                backendStatus={backendStatus}
                onRefresh={() => void pingBackend()}
                wakeIntervalMs={wakeIntervalMs}
              />
            </div>
            <Link href="/upload" className="btn-primary px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20">
              Initiate New Synthesis <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* PIN GRID */}
        {!loading && filteredNotes.length > 0 && (() => {
          // Generate heterogeneous list
          const itemsToRender: GridItem[] = [];
          let noteInserted = 0;

          for (let i = 0; i < Math.max(filteredNotes.length + 2, 4); i++) {
            if (i === 1) {
              itemsToRender.push({
                id: 'quran-widget',
                renderType: 'quran',
              });
            } else if (i === 3) {
              itemsToRender.push({
                id: 'action-card-default',
                renderType: 'action',
                title: "Advanced Calculus II",
                desc: "Master limits, derivatives, integrals, and vector analysis with our smart flashcard deck.",
                subject: "Core Mathematics",
              });
            } else {
              const note = filteredNotes[noteInserted];
              if (note) {
                itemsToRender.push({
                  id: note.id,
                  renderType: 'note',
                  data: note,
                  index: noteInserted
                });
                noteInserted++;
              }
            }
          }

          return (
            <div className="masonry-grid-view">
              {itemsToRender.map((item, idx) => {
                if (item.renderType === 'quran') {
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.5 }}
                    >
                      <QuranAyahWidget
                        backendStatus={backendStatus}
                        onRefresh={() => void pingBackend()}
                        wakeIntervalMs={wakeIntervalMs}
                      />
                    </motion.div>
                  );
                }

                if (item.renderType === 'action') {
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.5 }}
                    >
                      <div className="p-8 rounded-[2.5rem] bg-[#0A1128] text-white border border-white/10 hover:border-gold hover:shadow-gold-glow transition-all duration-500 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[9px] font-black uppercase tracking-widest">
                              {item.subject}
                            </span>
                            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                          </div>
                          <h3 className="text-2xl font-black tracking-tight mb-2 font-serif text-white group-hover:text-amber-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                        <Link href="/flashcards" className="mt-8 flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gold-gradient hover:opacity-90 text-[#0A1128] text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.01]">
                          <span>Study Now</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                }

                // Normal note
                const note = item.data;
                const type = note.source_type || 'file';
                const Icon = getTypeIcon(type);
                const palette = palettes[item.index % palettes.length];
                const date = note.createdAt
                  ? new Date(
                      typeof note.createdAt === 'object' && note.createdAt && 'seconds' in note.createdAt
                        ? (note.createdAt as { seconds: number }).seconds * 1000
                        : (note.createdAt as string | number | Date)
                    ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Recent Archive';

                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                    className="group relative"
                  >
                    {/* Management Dropdown */}
                    <div className="absolute top-6 right-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenu(openMenu === note.id ? null : note.id); }}
                        className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-xl flex items-center justify-center text-zinc-900 hover:bg-primary hover:text-white transition-all"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {openMenu === note.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute top-12 right-0 w-48 rounded-2xl bg-white shadow-2xl border border-zinc-100 p-2 overflow-hidden"
                          >
                            <button
                              onClick={() => handleRename(note.id, !!note.isGuest)}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-50 text-sm font-bold text-zinc-700 transition-colors"
                            >
                              Rename Archive
                            </button>
                            <button
                              onClick={() => handleDelete(note.id, !!note.isGuest)}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-sm font-bold text-red-600 transition-colors"
                            >
                              Delete Permanently
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Link href={`/notes?id=${note.id}`}>
                      <div className="pin-card-outer relative overflow-hidden flex flex-col rounded-[2.5rem] bg-card border border-border hover:border-gold-hover transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_48px_96px_-32px_rgba(0,0,0,0.15)]">

                        {/* Pinterest Pin Visual */}
                        <div className="relative overflow-hidden aspect-[16/11] w-full bg-muted/10 min-h-[220px]">
                          <img
                            src={`https://image.pollinations.ai/prompt/${encodeURIComponent(note.visual_prompt || note.title || 'academic study artwork')}?width=600&height=400&nologo=true&seed=${note.id}`}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            alt={note.title}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${note.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                            }}
                          />

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                          {/* Floaties */}
                          <div className="absolute top-4 left-4 z-20">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-xl">
                              <Icon className="w-3 h-3" style={{ color: palette.accent }} />
                              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: palette.accent, fontFamily: "'Space Grotesk', sans-serif" }}>
                                {type}
                              </span>
                            </div>
                          </div>

                          {note.isGuest && (
                            <div className="absolute bottom-4 left-4 z-20">
                              <div className="px-2 py-0.5 rounded bg-primary/20 backdrop-blur-md text-[8px] font-black uppercase tracking-widest text-primary border border-primary/20">
                                Guest Archive
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Meta */}
                        <div className="p-6 lg:p-8">
                          <h3 className="font-bold text-base lg:text-lg leading-tight mb-4 group-hover:text-primary transition-colors line-clamp-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {note.title || 'Untitled Piece'}
                          </h3>

                          <div className="flex items-center justify-between pt-4 border-t border-muted/50">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: palette.accent }} />
                              <span className="text-[10px] font-black tracking-widest uppercase opacity-40">
                                {(note.quizzes?.length || 0) + (note.flashcards?.length || 0)} Assets
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <style jsx global>{`
        .masonry-grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
          padding: 2rem 0;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
        }
        
        .shimmer {
          background: linear-gradient(90deg, var(--muted) 25%, var(--card) 50%, var(--muted) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer {
          to { background-position-x: -200%; }
        }
      `}</style>
    </DashboardLayout>
  );
}

