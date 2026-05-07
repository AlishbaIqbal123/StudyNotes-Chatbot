'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Sparkles, BrainCircuit, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

interface AggregatedCard {
  front: string;
  back: string;
  noteTitle: string;
  noteId: string;
}

function getGuestCards(): AggregatedCard[] {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('lumina_guest_note_'))
      .flatMap(k => {
        const note = JSON.parse(localStorage.getItem(k) || '{}');
        return (note.flashcards || []).map((c: any) => ({
          front: c.front,
          back: c.back,
          noteTitle: note.title || 'Guest Note',
          noteId: k.replace('lumina_guest_note_', ''),
        }));
      });
  } catch { return []; }
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState<AggregatedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState('');
  const [filterNote, setFilterNote] = useState<string>('all');
  const [noteOptions, setNoteOptions] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let all: AggregatedCard[] = [];

      if (user) {
        try {
          const q = query(collection(db, 'notes'), where('userId', '==', user.id));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            const note = d.data();
            (note.flashcards || []).forEach((c: any) => {
              all.push({ front: c.front, back: c.back, noteTitle: note.title || 'Untitled', noteId: d.id });
            });
          });
        } catch (e) { console.error(e); }
      }

      all = [...all, ...getGuestCards()];
      setCards(all);

      // Build note filter options
      const seen = new Map<string, string>();
      all.forEach(c => { if (!seen.has(c.noteId)) seen.set(c.noteId, c.noteTitle); });
      setNoteOptions(Array.from(seen.entries()).map(([id, title]) => ({ id, title })));
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const filtered = cards.filter(c => {
    const matchNote = filterNote === 'all' || c.noteId === filterNote;
    const matchSearch = !search || c.front.toLowerCase().includes(search.toLowerCase()) || c.back.toLowerCase().includes(search.toLowerCase());
    return matchNote && matchSearch;
  });

  const toggleFlip = (i: number) => setFlipped(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-primary/20 bg-primary/5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Memory Archive
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Global <span className="italic text-primary">Flashcards</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            {loading ? 'Loading your deck...' : `${filtered.length} card${filtered.length !== 1 ? 's' : ''} across ${noteOptions.length} note${noteOptions.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Controls */}
        {!loading && cards.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cards..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-full bg-card border border-border focus:border-primary/30 focus:ring-2 focus:ring-primary/10 text-sm outline-none transition-all"
              />
            </div>
            {noteOptions.length > 1 && (
              <select
                value={filterNote}
                onChange={e => setFilterNote(e.target.value)}
                className="h-11 px-4 rounded-full bg-card border border-border text-sm font-bold outline-none focus:border-primary/30 transition-all"
              >
                <option value="all">All Notes</option>
                {noteOptions.map(n => (
                  <option key={n.id} value={n.id}>{n.title}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Loading shimmer */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-[2.5rem] shimmer" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && cards.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8">
              <BrainCircuit className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>No Flashcards Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed">
              Generate a note with the Full Mastery Package or Flashcard Deck option to build your first deck.
            </p>
            <Link href="/upload" className="btn-primary px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2">
              Create First Note <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* No search results */}
        {!loading && cards.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-bold">No cards match your search.</p>
          </div>
        )}

        {/* Flip card grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.4 }}
                className="cursor-pointer"
                style={{ perspective: '1200px', height: '220px' }}
                onClick={() => toggleFlip(i)}
              >
                <motion.div
                  animate={{ rotateY: flipped[i] ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                >
                  {/* Front */}
                  <div
                    style={{ backfaceVisibility: 'hidden' }}
                    className="absolute inset-0 bg-card border-2 border-border hover:border-primary/30 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/50 px-2 py-1 rounded-full bg-primary/5 border border-primary/10">
                        {card.noteTitle.slice(0, 25)}{card.noteTitle.length > 25 ? '…' : ''}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Tap to flip</span>
                    </div>
                    <p className="font-bold text-base leading-snug text-center">{card.front}</p>
                    <div className="h-1 w-12 bg-primary/20 rounded-full mx-auto" />
                  </div>

                  {/* Back */}
                  <div
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    className="absolute inset-0 bg-primary rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl"
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Answer</span>
                    <p className="font-bold text-base leading-snug text-center text-white">{card.back}</p>
                    <div className="h-1 w-12 bg-white/20 rounded-full mx-auto" />
                  </div>
                </motion.div>
              </motion.div>
            ))}
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
