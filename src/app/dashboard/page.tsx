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
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Link from 'next/link';

const getTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'youtube': return Video;
    case 'file': return BookOpen;
    default: return FileText;
  }
};

const palettes = [
  { from: 'color-mix(in srgb, var(--atelier-crimson), transparent 90%)', to: 'color-mix(in srgb, var(--atelier-crimson), transparent 85%)', accent: 'var(--atelier-crimson)', shadow: 'rgba(230,0,35,0.1)' },
  { from: 'color-mix(in srgb, var(--atelier-sky), transparent 90%)', to: 'color-mix(in srgb, var(--atelier-sky), transparent 85%)', accent: 'var(--atelier-sky)', shadow: 'rgba(59,155,200,0.1)' },
  { from: 'color-mix(in srgb, var(--atelier-sage), transparent 90%)', to: 'color-mix(in srgb, var(--atelier-sage), transparent 85%)', accent: 'var(--atelier-sage)', shadow: 'rgba(94,123,90,0.1)' },
  { from: 'color-mix(in srgb, var(--atelier-lavender), transparent 90%)', to: 'color-mix(in srgb, var(--atelier-lavender), transparent 85%)', accent: 'var(--atelier-lavender)', shadow: 'rgba(124,111,205,0.1)' },
  { from: 'color-mix(in srgb, var(--atelier-orange), transparent 90%)', to: 'color-mix(in srgb, var(--atelier-orange), transparent 85%)', accent: 'var(--atelier-orange)', shadow: 'rgba(200,85,42,0.1)' },
];

export default function DashboardPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'youtube' | 'file' | 'text'>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLibrary = async () => {
    setLoading(true);
    let finalNotes: any[] = [];
    
    // 1. Fetch Guest Notes
    try {
      const localKeys = Object.keys(localStorage);
      const guestNotes = localKeys
        .filter(k => k.startsWith('lumina_guest_note_'))
        .map(k => {
           const n = JSON.parse(localStorage.getItem(k) || '{}');
           return { id: k.replace('lumina_guest_note_', ''), ...n, isGuest: true };
        });
      finalNotes = [...guestNotes];
    } catch (e) { console.error('Guest notes fetch error:', e); }

    // 2. Fetch User Notes
    if (user) {
      try {
        const q = query(
          collection(db, 'notes'),
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const userNotes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        finalNotes = [...userNotes, ...finalNotes];
      } catch (err) {
        console.error('Library fetch error:', err);
      }
    }
    
    setNotes(finalNotes);
    setLoading(false);
  };

  useEffect(() => {
    fetchLibrary();
  }, [user?.id]);

  const handleDelete = async (noteId: string, isGuest: boolean) => {
    if (!confirm('Are you sure you want to delete this archive? This action cannot be undone.')) return;

    try {
      if (isGuest) {
        localStorage.removeItem(`lumina_guest_note_${noteId}`);
      } else {
        const { deleteDoc, doc } = await import('firebase/firestore');
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
        const { updateDoc, doc } = await import('firebase/firestore');
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
                   className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                     filter === f ? 'bg-white text-primary shadow-lg shadow-black/5' : 'text-muted-foreground hover:text-black'
                   }`}
                   style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                 >
                   {f === 'all' ? 'All' : f === 'file' ? 'Docs' : f === 'youtube' ? 'Video' : 'Text'}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* LOADING SHIMMER GRID */}
        {loading && (
          <div className="masonry-grid-view">
             {[280, 420, 320, 380, 300, 350, 400, 310].map((h, i) => (
                <div key={i} className={`shimmer rounded-[2.5rem]`} style={{ height: h }} />
             ))}
          </div>
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
             <p className="text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed">Your knowledge board is a blank canvas. Upload source material to begin the synthesis process.</p>
             <Link href="/upload" className="btn-primary px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20">
                Initiate New Synthesis <ChevronRight className="w-4 h-4" />
             </Link>
          </motion.div>
        )}

        {/* PIN GRID */}
        {!loading && filteredNotes.length > 0 && (
          <div className="masonry-grid-view">
             {filteredNotes.map((note, idx) => {
                const type = note.source_type || 'file';
                const Icon = getTypeIcon(type);
                const palette = palettes[idx % palettes.length];
                const date = note.createdAt
                  ? new Date(note.createdAt.seconds ? note.createdAt.seconds * 1000 : note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-zinc-900 hover:bg-primary hover:text-white transition-all"
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
                      <div className="pin-card-outer relative overflow-hidden flex flex-col rounded-[2.5rem] bg-card border border-border hover:border-primary/20 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_48px_96px_-32px_rgba(0,0,0,0.15)]">
                        
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
        )}
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

