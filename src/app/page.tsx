'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Upload, Video, BookOpen, BrainCircuit, Zap, Mic,
  ArrowRight, Star, Users, TrendingUp, FileText, Heart, Globe,
  ChevronRight, Play, Layers, Bot, Headphones, Command, Search, Archive
} from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/theme/ThemeToggle';

/* ── Data ─────────────────────────────────────── */
const features = [
  {
    title: 'Archive Retrieval',
    desc: 'Transform PDFs, DOCX, and research papers into structured, beautiful study notes with a single upload.',
    icon: Archive,
    color: '#E60023',
  },
  {
    title: 'Visual Synthesis',
    desc: 'Every study session is assigned a unique AI-generated visual anchor to enhance mnemonic recall.',
    icon: Sparkles,
    color: '#3B9BC8',
  },
  {
    title: 'Socratic Dialogue',
    desc: 'Engage with an AI tutor that doesn\'t just give answers, but guides you through conceptual hurdles.',
    icon: Bot,
    color: '#5E7B5A',
  },
  {
    title: 'Acoustic Labs',
    desc: 'Narrated podcast-style summaries you can listen to on the go. Your content, your pace.',
    icon: Headphones,
    color: '#7C6FCD',
  },
  {
    title: 'Synthesis Engine',
    desc: 'Adaptive, Socratic quizzes generated from your material. Test comprehension, not memorization.',
    icon: BrainCircuit,
    color: '#C8552A',
  },
];

const stats = [
  { value: '50K+',  label: 'Sessions', icon: BookOpen },
  { value: '1M+',   label: 'Inferences', icon: Sparkles },
  { value: '98%',   label: 'Recall', icon: Zap },
];

/* ── Component ─────────────────────────────────── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.98]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-500">
      
      {/* ── AMBIENT ARTISTRY ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[10%] right-[5%] w-[35vw] h-[35vw] bg-primary/5 rounded-full blur-[100px]" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── NAVIGATION ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-background/80 backdrop-blur-xl py-4 border-b border-border' : 'py-8'}`}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-lg shadow-primary/20">
                 <Sparkles className="text-white w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="font-black text-xl tracking-tighter leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Lumina</span>
                 <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] leading-none mt-0.5">Atelier</span>
              </div>
           </Link>

           <div className="hidden lg:flex items-center gap-10">
              {['Gallery', 'Methodology', 'Pricing'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item}
                </a>
              ))}
           </div>

           <div className="flex items-center gap-4 lg:gap-8">
              <ThemeToggle />
              <Link href="/login" className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground hover:opacity-60 transition-opacity hidden sm:block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Login
              </Link>
              <Link href="/signup" className="px-8 py-3 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Enter Atelier
              </Link>
           </div>
        </div>
      </nav>

      <main className="relative z-10">

        {/* ── EDITORIAL HERO ── */}
        <section className="pt-48 pb-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:items-center">
              
              <motion.div 
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="lg:col-span-7"
              >
                 <motion.div
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 border border-primary/20 bg-primary/5"
                 >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                       Synthesizing Intelligence
                    </span>
                 </motion.div>

                 <h1 className="text-6xl sm:text-8xl md:text-9xl font-bold tracking-tighter leading-[0.85] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                    The <span className="italic">Digital</span><br />Atelier<span className="text-primary">.</span>
                 </h1>

                 <p className="text-xl md:text-2xl text-muted-foreground max-w-xl leading-relaxed mb-12" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Where raw data becomes refined insight. Transform any content into a curated exhibit of structured knowledge.
                 </p>

                 <div className="flex flex-wrap gap-4">
                    <Link href="/signup" className="px-10 py-5 rounded-full bg-foreground text-background text-xs font-black uppercase tracking-[0.2em] hover:bg-primary shadow-2xl transition-all">
                       Start synthesis
                    </Link>
                    <Link href="/upload" className="px-10 py-5 rounded-full bg-card border border-border text-foreground text-xs font-black uppercase tracking-[0.2em] hover:border-primary transition-all">
                       Guest Access
                    </Link>
                 </div>

                 <div className="mt-16 flex items-center gap-12 border-t border-border pt-12">
                    {stats.map((s, i) => (
                      <div key={i} className="flex flex-col">
                         <span className="text-3xl font-bold tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{s.label}</span>
                      </div>
                    ))}
                 </div>
              </motion.div>

              {/* MASONRY VISUAL PREVIEW */}
              <div className="lg:col-span-5 relative">
                 <div className="masonry-preview">
                    {[
                      { h: 'h-64', c: 'bg-primary/10', icon: BookOpen, l: 'Neural Arch' },
                      { h: 'h-48', c: 'bg-foreground text-background', icon: Zap, l: 'Logic Labs', dark: true },
                      { h: 'h-72', c: 'bg-card border border-border', icon: BrainCircuit, l: 'Socratic Cells' },
                      { h: 'h-64', c: 'bg-muted', icon: Video, l: 'Motion Archive' },
                    ].map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                        className={`mb-6 rounded-[2.5rem] p-8 flex flex-col justify-between group cursor-default transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl border border-border/50 break-inside-avoid inline-block w-full ${m.h} ${m.c}`}
                      >
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${m.dark ? 'bg-background/10' : 'bg-foreground/5'}`}>
                            <m.icon className="w-5 h-5" />
                         </div>
                         <div className="flex flex-col text-left">
                            <span className={`text-[10px] font-black uppercase tracking-widest mb-1 opacity-40`}>Exhibit {i+1}</span>
                            <span className={`text-lg font-bold tracking-tight`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.l}</span>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* ── METHODOLOGY SECTION ── */}
        <section id="methodology" className="py-40 bg-foreground text-background transition-colors duration-500">
           <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="mb-24 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                 <div className="max-w-xl text-left">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Our Philosophy</span>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
                       The Synthesis <span className="italic text-primary">Process</span>.
                    </h2>
                 </div>
                 <p className="max-w-md text-background/60 leading-relaxed text-lg text-left">
                    We don't just summarize. We reconstruct your material into a multi-sensory learning experience designed for high-density cognitive retention.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {features.map((f, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -10 }}
                      className="p-10 rounded-[3rem] bg-background/5 border border-background/10 hover:border-primary/40 transition-all duration-500 text-left"
                    >
                       <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8" style={{ backgroundColor: `${f.color}20`, color: f.color }}>
                          <f.icon className="w-7 h-7" />
                       </div>
                       <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
                       <p className="opacity-60 leading-relaxed">{f.desc}</p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* ── REIMAGINED CTA ── */}
        <section className="py-40 px-6 lg:px-12 max-w-[1400px] mx-auto">
           <div className="relative rounded-[4rem] bg-primary p-20 lg:p-32 overflow-hidden shadow-2xl shadow-primary/20">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-black/5 -skew-x-12 translate-x-1/4" />
              <div className="relative z-10 text-center text-white">
                 <Sparkles className="w-16 h-16 mx-auto mb-10 opacity-30" />
                 <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Resonate with <span className="italic">Clarity</span>.
                 </h2>
                 <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto mb-12 leading-relaxed">
                    Join the vanguard of academic excellence. Enter the atelier and start your first synthesis today.
                 </p>
                 <div className="flex flex-wrap justify-center gap-6">
                    <Link href="/signup" className="px-12 py-6 rounded-full bg-white text-primary text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                       Access the Lab
                    </Link>
                    <Link href="/upload" className="px-12 py-6 rounded-full border-2 border-white text-white text-xs font-black uppercase tracking-widest hover:bg-white hover:text-primary transition-all">
                       Interactive Demo
                    </Link>
                 </div>
              </div>
           </div>
        </section>

      </main>

      {/* ── ATELIER FOOTER ── */}
      <footer className="py-20 px-6 lg:px-12 border-t border-border">
         <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
            <div className="text-left">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                     <Sparkles className="text-white w-4 h-4" />
                  </div>
                  <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Lumina Atelier</span>
               </div>
               <p className="text-muted-foreground text-sm max-w-xs leading-relaxed" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Designing the future of cognitive synthesis. Registered intellectual laboratory © 2026.
               </p>
            </div>

            <div className="flex gap-20">
               <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6 block">Archive</span>
                  <ul className="space-y-3 text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                     <li><a href="#" className="hover:text-primary transition-colors">Gallery</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Labs</a></li>
                  </ul>
               </div>
               <div className="text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-6 block">Ethics</span>
                  <ul className="space-y-3 text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                     <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                     <li><a href="#" className="hover:text-primary transition-colors">Manifesto</a></li>
                  </ul>
               </div>
            </div>
         </div>
         <div className="max-w-[1400px] mx-auto mt-20 pt-10 border-t border-border flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Synthesized with Excellence</span>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Archive Operational</span>
            </div>
         </div>
      </footer>

      <style jsx global>{`
        .masonry-preview {
          columns: 2;
          column-gap: 1.5rem;
          padding: 2rem 0;
        }
      `}</style>

    </div>
  );
}
