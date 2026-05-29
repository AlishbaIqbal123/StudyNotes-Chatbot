'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ExternalLink, CheckCircle, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgradeUrl?: string;
  existingNotesCount?: number;
}

export default function RateLimitModal({
  isOpen,
  onClose,
  upgradeUrl = 'https://openrouter.ai/credits',
  existingNotesCount,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
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
            className="relative w-full max-w-[480px] bg-card rounded-[2.5rem] p-12 shadow-2xl border border-border"
          >
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-8 shadow-xl shadow-red-500/20">
                <Zap className="w-10 h-10 text-white fill-white" />
              </div>

              <h2 className="text-3xl font-black mb-3 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                API Limit Reached
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Your AI generation quota has been used up. Your existing notes are completely safe.
              </p>

              {/* Notes safe badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-bold mb-8 border border-green-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                {existingNotesCount !== undefined
                  ? `Your ${existingNotesCount} existing note${existingNotesCount !== 1 ? 's are' : ' is'} safe and fully viewable`
                  : 'Your existing notes are safe and fully viewable'}
              </div>

              {/* Countdown */}
              <div className="mb-10">
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-2">
                  Try again in
                </div>
                <div className="text-5xl font-mono font-black tracking-tighter text-primary">
                  {timeLeft}
                </div>
              </div>

              {/* Actions */}
              <div className="w-full space-y-3">
                <button
                  onClick={handleViewNotes}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  View My Notes
                </button>

                <a
                  href={upgradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 border-2 border-border rounded-2xl font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all"
                >
                  Upgrade API Credits <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="mt-8 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                Previously generated notes are always accessible
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
