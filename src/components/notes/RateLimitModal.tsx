'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, CheckCircle, BookOpen, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GenerationStatusPanel from '@/components/notes/GenerationStatusPanel';
import type { GenerationStatusReport } from '@/lib/generationStatus';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingNotesCount?: number;
  generationStatus?: GenerationStatusReport | null;
}

export default function RateLimitModal({
  isOpen,
  onClose,
  existingNotesCount,
  generationStatus,
}: RateLimitModalProps) {
  const [timeLeft, setTimeLeft] = useState<string>('60:00');
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    const calculateTime = () => {
      const now = Date.now();
      let expiry = parseInt(localStorage.getItem('lumina_rate_limit_ts') || '0');
      if (!expiry || now > expiry) {
        expiry = now + 3600000;
        localStorage.setItem('lumina_rate_limit_ts', expiry.toString());
      }
      const diff = expiry - now;
      if (diff <= 0) return '00:00';
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const initialTime = calculateTime();
    const timeout = setTimeout(() => setTimeLeft(initialTime), 0);
    const interval = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  const handleViewNotes = () => {
    onClose();
    router.push('/dashboard');
  };

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-[520px] bg-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-border my-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-6 shadow-xl shadow-red-500/20">
                <Zap className="w-8 h-8 text-white fill-white" />
              </div>

              <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Generation Limit Reached
              </h2>
              <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                {generationStatus?.summary ||
                  'Your free generation quota has been used up. Your existing notes are completely safe.'}
              </p>

              {generationStatus && generationStatus.overall !== 'completed' && (
                <div className="w-full mb-6 text-left">
                  <GenerationStatusPanel report={generationStatus} compact onUpgrade={handleUpgrade} />
                </div>
              )}

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-bold mb-6 border border-green-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                {existingNotesCount !== undefined
                  ? `Your ${existingNotesCount} existing note${existingNotesCount !== 1 ? 's are' : ' is'} safe and fully viewable`
                  : 'Your existing notes are safe and fully viewable'}
              </div>

              <div className="mb-8">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-2">
                  Try again in
                </div>
                <div className="text-4xl md:text-5xl font-mono font-black tracking-tighter text-primary">
                  {timeLeft}
                </div>
              </div>

              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={handleViewNotes}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  View My Notes
                </button>

                <button
                  type="button"
                  onClick={handleUpgrade}
                  className="flex items-center justify-center gap-2 w-full py-4 border-2 border-border rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade Credits
                </button>
              </div>

              <p className="mt-6 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                Regenerate missing sections individually after cooldown
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
