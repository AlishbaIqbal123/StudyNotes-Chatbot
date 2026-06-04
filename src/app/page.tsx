'use client';

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sparkles, BookOpen, BrainCircuit, Zap,
  ChevronRight, Play, Bot, Headphones, Archive
} from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/theme/ThemeToggle';
import PWAInstallButton from '@/components/PWAInstallButton';

/* ── Data ─────────────────────────────────────── */
const features = [
  {
    title: 'Archive Retrieval',
    desc: 'Transform PDFs, DOCX, and research papers into structured, beautiful study notes with a single upload.',
    icon: Archive,
    color: '#1E40AF',
  },
  {
    title: 'Visual Synthesis',
    desc: 'Every study session is assigned a unique AI-generated visual anchor to enhance mnemonic recall.',
    icon: Sparkles,
    color: '#3B82F6',
  },
  {
    title: 'Socratic Dialogue',
    desc: 'Engage with an AI tutor that doesn\'t just give answers, but guides you through conceptual hurdles.',
    icon: Bot,
    color: '#F59E0B',
  },
  {
    title: 'Acoustic Labs',
    desc: 'Narrated podcast-style summaries you can listen to on the go. Your content, your pace.',
    icon: Headphones,
    color: '#D97706',
  },
  {
    title: 'Synthesis Engine',
    desc: 'Adaptive, Socratic quizzes generated from your material. Test comprehension, not memorization.',
    icon: BrainCircuit,
    color: '#FBBF24',
  },
];

const stats = [
  { value: '50K+',  label: 'Sessions', icon: BookOpen },
  { value: '1M+',   label: 'Inferences', icon: Sparkles },
  { value: '98%',   label: 'Recall', icon: Zap },
];

/* ── Component ─────────────────────────────────── */
export default function LandingPage() {
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.98]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-500">
      
      {/* ── AMBIENT ARTISTRY ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="ambient-glow-1" />
         <div className="ambient-glow-2" />
      </div>

      {/* ── NAVIGATION ── */}
      <div className="fixed top-6 left-0 right-0 px-4 z-50 flex justify-center">
        <nav className="glass border border-border/40 px-6 py-3 rounded-full flex items-center justify-between w-full max-w-5xl shadow-lg shadow-primary/5 transition-all duration-500">
           <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8.5 h-8.5 rounded-xl bg-primary flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-md shadow-primary/20 shrink-0">
                 <Sparkles className="text-white w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                 <span className="font-black text-sm tracking-tight leading-none text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Lumina</span>
                 <span className="text-primary text-[8px] font-black uppercase tracking-[0.2em] leading-none mt-0.5">Atelier</span>
              </div>
           </Link>

           <div className="hidden lg:flex items-center gap-8">
              {['Gallery', 'Methodology', 'Pricing'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {item}
                </a>
              ))}
           </div>

           <div className="flex items-center gap-4">
              <PWAInstallButton compact={true} />
              <ThemeToggle />
              <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-foreground hover:opacity-60 transition-opacity hidden sm:block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Login
              </Link>
              <Link href="/signup" className="px-6 py-2.5 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-wider shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Enter Atelier
              </Link>
           </div>
        </nav>
      </div>

      <main className="relative z-10">

        {/* ── EDITORIAL HERO ── */}
        <section className="pt-36 pb-32 px-6 lg:px-12 max-w-[1400px] mx-auto">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:items-center">
              
              <motion.div 
                style={{ opacity: heroOpacity, scale: heroScale }}
                className="lg:col-span-7"
              >
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
                      { 
                        id: 'm1',
                        h: 'min-h-[250px]', 
                        c: 'bg-card border border-border shadow-lg hover:border-primary/30', 
                        render: () => (
                          <div className="flex flex-col justify-between h-full text-left">
                            <div className="flex justify-between items-center">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-full">Archive</span>
                            </div>
                            <div className="my-4">
                              <h4 className="text-base font-black tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Neural Systems</h4>
                              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">8 synthesized pages, 2 conceptual maps, 1 podcast summary.</p>
                            </div>
                            <div className="flex gap-1.5 mt-2">
                              <div className="w-6 h-1 bg-primary/20 rounded-full" />
                              <div className="w-12 h-1 bg-primary rounded-full" />
                              <div className="w-8 h-1 bg-primary/40 rounded-full" />
                            </div>
                          </div>
                        )
                      },
                      { 
                        id: 'm2',
                        h: 'min-h-[210px]', 
                        c: 'bg-[#0A1128] text-white border border-white/10 hover:border-gold hover:shadow-gold-glow', 
                        render: () => (
                          <div className="flex flex-col justify-between h-full text-left relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl" />
                            <div className="flex justify-between items-center">
                              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                <Zap className="text-amber-400 w-4 h-4 fill-amber-400" />
                              </div>
                              <span className="text-[9px] font-black text-gold uppercase tracking-widest bg-amber-500/20 text-gold border border-amber-500/30 px-2.5 py-1 rounded-full">Flashcard</span>
                            </div>
                            <div className="my-3">
                              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Question 04</p>
                              <h4 className="text-sm font-semibold tracking-tight text-white mt-0.5 leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>What is backpropagation?</h4>
                            </div>
                            <div className="text-[9px] text-gold font-bold uppercase tracking-widest flex items-center gap-1">
                              <span>Reveal Answer</span>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                          </div>
                        )
                      },
                      { 
                        id: 'm3',
                        h: 'min-h-[270px]', 
                        c: 'bg-card border border-border shadow-lg hover:border-primary/30', 
                        render: () => (
                          <div className="flex flex-col justify-between h-full text-left">
                            <div className="flex justify-between items-center">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-border px-2.5 py-1 rounded-full">Tutor</span>
                            </div>
                            <div className="my-3 space-y-2 flex-1 flex flex-col justify-center">
                              <div className="p-2.5 rounded-2xl rounded-tl-none bg-muted text-[10px] text-foreground leading-relaxed">
                                Why do we use activation functions in networks?
                              </div>
                              <div className="p-2.5 rounded-2xl rounded-tr-none bg-primary/5 border border-primary/10 text-[10px] text-primary leading-relaxed self-end">
                                To introduce non-linearity.
                              </div>
                            </div>
                            <span className="text-[9px] text-muted-foreground font-bold">Active dialogue...</span>
                          </div>
                        )
                      },
                      { 
                        id: 'm4',
                        h: 'min-h-[230px]', 
                        c: 'bg-card border border-border shadow-lg hover:border-primary/30', 
                        render: () => (
                          <div className="flex flex-col justify-between h-full text-left">
                            <div className="flex justify-between items-center">
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Headphones className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-full">Audio Lab</span>
                            </div>
                            <div className="my-3">
                              <h4 className="text-base font-black tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Quantum Synthesis</h4>
                              <p className="text-[10px] text-muted-foreground mt-1">Lecture 12 summary podcast.</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20">
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              </div>
                              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                <div className="w-1/3 h-full bg-primary" />
                              </div>
                            </div>
                          </div>
                        )
                      },
                    ].map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                        className={`mb-6 rounded-[2.5rem] p-8 flex flex-col justify-between group cursor-default transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl border border-border/50 break-inside-avoid inline-block w-full ${m.h} ${m.c}`}
                      >
                         {m.render()}
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* ── METHODOLOGY SECTION ── */}
        <section id="methodology" className="py-40 bg-muted/30 text-foreground border-y border-border/50 transition-colors duration-500">
           <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="mb-24 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                 <div className="max-w-xl text-left">
                    <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Our Philosophy</span>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter" style={{ fontFamily: "'Playfair Display', serif" }}>
                       The Synthesis <span className="italic text-primary">Process</span>.
                    </h2>
                 </div>
                 <p className="max-w-md text-muted-foreground leading-relaxed text-lg text-left">
                    We don&apos;t just summarize. We reconstruct your material into a multi-sensory learning experience designed for high-density cognitive retention.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {features.map((f, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -10 }}
                      className="p-10 rounded-[3rem] bg-card border border-border/80 shadow-sm hover:border-primary/40 hover:shadow-lg transition-all duration-500 text-left"
                    >
                       <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8" style={{ backgroundColor: `${f.color}20`, color: f.color }}>
                          <f.icon className="w-7 h-7" />
                       </div>
                       <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
                       <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* ── REIMAGINED CTA ── */}
        <section className="py-40 px-6 lg:px-12 max-w-[1400px] mx-auto">
           <div className="relative rounded-[4rem] bg-gradient-to-r from-[#0A1128] via-[#1E40AF] to-[#D97706] p-20 lg:p-32 overflow-hidden shadow-2xl shadow-primary/25">
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
