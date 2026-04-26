'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot, Zap, Headphones, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  variant?: 'login' | 'signup';
}

const boards = [
  { label: 'Neural Networks', gradient: 'linear-gradient(135deg,#E60023,#FF6B6B)', h: 160 },
  { label: 'Quantum Physics',  gradient: 'linear-gradient(135deg,#7C6FCD,#C4B5E0)', h: 200 },
  { label: 'Cell Biology',     gradient: 'linear-gradient(135deg,#5E7B5A,#A8C5A0)', h: 160 },
  { label: 'Data Structures',  gradient: 'linear-gradient(135deg,#3B9BC8,#BCDFF1)', h: 180 },
];

export default function AuthLayout({ children, title, subtitle, variant = 'login' }: AuthLayoutProps) {
  const benefits = [
    { icon: Bot,        text: 'Notes from any PDF or Video' },
    { icon: Zap,        text: 'AI Quizzes & Flashcards' },
    { icon: Headphones, text: 'Audio Study Summaries' },
    { icon: BookOpen,   text: 'Pinterest-style Knowledge Board' },
  ];

  return (
    <div className="min-h-screen auth-split" style={{ background: 'var(--background)' }}>

      {/* ── Left Panel — Brand/Visual ── */}
      <div
        className="auth-visual relative overflow-hidden flex flex-col justify-between p-16"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7C6FCD 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 relative z-10 w-fit">
          <div
            className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #B7001A, var(--primary))' }}
          >
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--sidebar-foreground)', fontFamily: "'Space Grotesk', sans-serif" }}>
            LuminaStudy
          </span>
        </Link>

        {/* Mid content */}
        <div className="relative z-10 py-12">
          {variant === 'login' ? (
            <div className="space-y-10">
              {/* Mini board preview */}
              <div className="grid grid-cols-2 gap-4 rounded-[2rem] overflow-hidden" style={{ maxWidth: 380 }}>
                {boards.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="relative flex items-end p-5 rounded-[1.5rem]"
                    style={{ background: b.gradient, height: b.h }}
                  >
                    <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-md" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {b.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--sidebar-foreground)', opacity: 0.6, fontFamily: "'Space Grotesk', sans-serif" }}>
                  ✦ AI Synthesis Active
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p
                  className="text-4xl lg:text-5xl font-bold leading-[1.1]"
                  style={{ color: 'var(--sidebar-foreground)', opacity: 0.95, fontFamily: "'Playfair Display', serif" }}
                >
                  Knowledge,<br />
                  <span className="italic opacity-60">beautifully organized.</span>
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-12">
              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl lg:text-6xl font-bold leading-tight"
                style={{ color: 'var(--sidebar-foreground)', fontFamily: "'Playfair Display', serif" }}
              >
                Your Personal<br /><span className="italic opacity-50">Learning Atelier</span>
              </motion.h2>
              <div className="space-y-6">
                {benefits.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-5"
                  >
                    <div className="w-11 h-11 rounded-[1.125rem] flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(230,0,35,0.12)', border: '1px solid rgba(230,0,35,0.1)' }}>
                      <b.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-base font-semibold" style={{ color: 'var(--sidebar-foreground)', opacity: 0.75, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {b.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom strip */}
        <div className="relative z-10 pt-10 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--sidebar-foreground)', opacity: 0.3, fontFamily: "'Space Grotesk', sans-serif" }}>
            Join 50,000+ students studying smarter
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col justify-center px-10 md:px-20 py-16 relative overflow-hidden"
        style={{ background: 'var(--background)' }}
      >
        {/* Subtle bg orb */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(230,0,35,0.03) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />

        <div className="max-w-md w-full mx-auto">
          {/* Heading */}
          <div className="mb-12">
            <h1
              className="text-5xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: 'var(--foreground)' }}
            >
              {title}
            </h1>
            <p className="text-base font-medium opacity-50" style={{ color: 'var(--foreground)', fontFamily: "'Manrope', sans-serif" }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  );
}
