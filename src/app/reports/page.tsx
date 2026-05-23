'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { BookOpen, BrainCircuit, Layers, Sparkles, Calendar, ChevronRight, FileText, Video } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

interface NoteStats {
  id: string;
  title: string;
  source_type: string;
  flashcards: number;
  quizzes: number;
  createdAt: string;
  isGuest?: boolean;
}

interface Stats {
  totalNotes: number;
  totalFlashcards: number;
  totalQuizzes: number;
  thisMonthNotes: number;
}

function getGuestNoteStats(): NoteStats[] {
  try {
    return Object.keys(localStorage)
      .filter(k => k.startsWith('lumina_guest_note_'))
      .map(k => {
        const note = JSON.parse(localStorage.getItem(k) || '{}');
        return {
          id: k.replace('lumina_guest_note_', ''),
          title: note.title || 'Guest Note',
          source_type: note.source_type || 'text',
          flashcards: (note.flashcards || []).length,
          quizzes: (note.quizzes || []).length,
          createdAt: note.createdAt || new Date().toISOString(),
          isGuest: true,
        };
      });
  } catch { return []; }
}

const sourceIcon = (type: string) => {
  if (type === 'youtube') return Video;
  if (type === 'file') return BookOpen;
  return FileText;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteStats[]>([]);
  const [stats, setStats] = useState<Stats>({ totalNotes: 0, totalFlashcards: 0, totalQuizzes: 0, thisMonthNotes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let all: NoteStats[] = [];

      if (user) {
        try {
          const q = query(collection(db, 'notes'), where('userId', '==', user.id));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            const n = d.data();
            const ts = n.createdAt?.seconds
              ? new Date(n.createdAt.seconds * 1000).toISOString()
              : n.createdAt || new Date().toISOString();
            all.push({
              id: d.id,
              title: n.title || 'Untitled',
              source_type: n.source_type || 'text',
              flashcards: (n.flashcards || []).length,
              quizzes: (n.quizzes || []).length,
              createdAt: ts,
            });
          });
        } catch (e) { console.error(e); }
      }

      all = [...all, ...getGuestNoteStats()];

      // Sort by date desc
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const now = new Date();
      const thisMonth = all.filter(n => {
        const d = new Date(n.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      setNotes(all);
      setStats({
        totalNotes: all.length,
        totalFlashcards: all.reduce((s, n) => s + n.flashcards, 0),
        totalQuizzes: all.reduce((s, n) => s + n.quizzes, 0),
        thisMonthNotes: thisMonth,
      });
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const statCards = [
    { label: 'Total Notes', value: stats.totalNotes, icon: BookOpen, color: '#1E40AF', bg: 'bg-blue-500/10' },
    { label: 'Flashcards', value: stats.totalFlashcards, icon: Layers, color: '#3B82F6', bg: 'bg-sky-500/10' },
    { label: 'Quiz Questions', value: stats.totalQuizzes, icon: BrainCircuit, color: '#F59E0B', bg: 'bg-amber-500/10' },
    { label: 'This Month', value: stats.thisMonthNotes, icon: Calendar, color: '#D97706', bg: 'bg-amber-500/10' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 border border-primary/20 bg-primary/5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Study Analytics
            </span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Study <span className="italic text-primary">Reports</span>
          </h1>
          <p className="text-lg text-muted-foreground">Your academic progress at a glance.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-[2.5rem] p-8 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <s.icon className="w-7 h-7" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-4xl font-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {loading ? '—' : s.value.toLocaleString()}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  {s.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Notes List */}
        {!loading && notes.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-8">
              <BookOpen className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>No Study Data Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed">
              Generate your first note to start tracking your academic progress.
            </p>
            <Link href="/upload" className="btn-primary px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2">
              Generate First Note <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              All Notes
            </h2>
            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-border bg-muted/30">
                <div className="col-span-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</div>
                <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Type</div>
                <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Cards</div>
                <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Quiz</div>
                <div className="col-span-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Date</div>
              </div>

              {loading
                ? [...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-border/50">
                    <div className="col-span-5 h-4 rounded-full skeleton-shimmer" />
                    <div className="col-span-2 h-4 rounded-full skeleton-shimmer mx-auto w-16" />
                    <div className="col-span-2 h-4 rounded-full skeleton-shimmer mx-auto w-10" />
                    <div className="col-span-2 h-4 rounded-full skeleton-shimmer mx-auto w-10" />
                    <div className="col-span-1 h-4 rounded-full skeleton-shimmer ml-auto w-14" />
                  </div>
                ))
                : notes.map((note, i) => {
                  const Icon = sourceIcon(note.source_type);
                  const date = new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors group"
                    >
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <Link href={`/notes?id=${note.id}`} className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                          {note.title}
                        </Link>
                        {note.isGuest && (
                          <span className="shrink-0 text-[8px] font-black uppercase tracking-widest text-primary/60 px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                            Guest
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <Icon className="w-3 h-3" />
                          {note.source_type}
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="text-sm font-black text-primary">{note.flashcards}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="text-sm font-black text-primary">{note.quizzes}</span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <span className="text-[10px] font-bold text-muted-foreground">{date}</span>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Utilizes global skeleton-shimmer */}
    </DashboardLayout>
  );
}
