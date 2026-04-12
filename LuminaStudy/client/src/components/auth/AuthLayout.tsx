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
        className="auth-visual relative overflow-hidden flex flex-col justify-between p-10"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #E60023 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7C6FCD 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10 w-fit">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg, #B7001A, #E60023)' }}
          >
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            LuminaStudy
          </span>
        </Link>

        {/* Mid content */}
        <div className="relative z-10">
          {variant === 'login' ? (
            <>
              {/* Mini board preview */}
              <div className="grid grid-cols-2 gap-2.5 mb-10 rounded-[1.75rem] overflow-hidden" style={{ maxWidth: 340 }}>
                {boards.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="relative flex items-end p-4 rounded-2xl"
                    style={{ background: b.gradient, height: b.h }}
                  >
                    <span className="text-white text-xs font-bold drop-shadow-md" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {b.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl mb-5"
                style={{ background: 'rgba(255,248,245,0.08)', border: '1px solid rgba(255,248,245,0.1)' }}
              >
                <Bot className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-white/80" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ✦ AI Processing...
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p
                  className="text-3xl font-bold leading-tight"
                  style={{ color: 'rgba(255,248,245,0.9)', fontFamily: "'Playfair Display', serif" }}
                >
                  "Knowledge,<br />
                  <em>beautifully organized.</em>"
                </p>
              </motion.div>
            </>
          ) : (
            <>
              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold leading-tight mb-8"
                style={{ color: 'rgba(255,248,245,0.95)', fontFamily: "'Playfair Display', serif" }}
              >
                Your Personal<br /><em>Learning Atelier</em>
              </motion.h2>
              <div className="space-y-4">
                {benefits.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(230,0,35,0.18)' }}>
                      <b.icon className="w-4.5 w-[18px] h-[18px] text-red-400" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,248,245,0.75)', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {b.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom strip */}
        <div className="relative z-10">
          <p className="text-xs font-medium" style={{ color: 'rgba(255,248,245,0.35)', fontFamily: "'Space Grotesk', sans-serif" }}>
            Join 50,000+ students studying smarter
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col justify-center px-8 md:px-16 py-12 relative overflow-hidden"
        style={{ background: 'var(--background)' }}
      >
        {/* Subtle bg orb */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(230,0,35,0.05) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />

        <div className="max-w-md w-full mx-auto">
          {/* Heading */}
          <div className="mb-9">
            <h1
              className="text-4xl font-bold tracking-tight mb-2.5"
              style={{ fontFamily: "'Playfair Display', serif", color: 'var(--foreground)' }}
            >
              {title}
            </h1>
            <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)', fontFamily: "'Manrope', sans-serif" }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  );
}
