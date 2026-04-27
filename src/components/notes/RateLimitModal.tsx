// src/components/notes/RateLimitModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ExternalLink, Clock, CheckCircle } from 'lucide-react';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgradeUrl: string;
}

export default function RateLimitModal({ isOpen, onClose, upgradeUrl }: RateLimitModalProps) {
  const [timeLeft, setTimeLeft] = useState<string>('60:00');

  useEffect(() => {
    if (!isOpen) return;

    const calculateTime = () => {
      const now = Date.now();
      const expiry = parseInt(localStorage.getItem('lumina_rate_limit_ts') || '0');
      
      if (!expiry || now > expiry) {
        // Set new expiry for 1 hour if not set
        const newExpiry = now + 3600000;
        localStorage.setItem('lumina_rate_limit_ts', newExpiry.toString());
        return '60:00';
      }

      const diff = expiry - now;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTime());
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

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
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-8 shadow-xl shadow-red-500/20">
                <Zap className="w-10 h-10 text-white fill-white" />
              </div>

              <h2 className="text-3xl font-black mb-3 tracking-tight">You've Hit the Free Limit ⚡</h2>
              <p className="text-muted-foreground mb-8">Your AI quota for today has been used up.</p>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-bold mb-10">
                <CheckCircle className="w-3 h-3" />
                Your existing notes are safe and fully accessible
              </div>

              <div className="mb-10">
                <div className="text-sm font-black uppercase tracking-widest text-muted-foreground/50 mb-2">Try again in</div>
                <div className="text-5xl font-mono font-black tracking-tighter text-primary">
                  {timeLeft}
                </div>
              </div>

              <div className="w-full space-y-4">
                <a 
                  href={upgradeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-5 bg-[#E60023] text-white rounded-2xl font-black shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Upgrade API Credits <ExternalLink className="w-4 h-4" />
                </a>
                
                <button 
                  onClick={onClose}
                  className="w-full py-5 border-2 border-border rounded-2xl font-black text-sm hover:bg-muted transition-all"
                >
                  View My Existing Notes
                </button>
              </div>

              <p className="mt-8 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                💾 Previously generated notes are stored and always viewable
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
