'use client';

import React from 'react';
import { motion } from 'framer-motion';
import PinGridSkeleton from '@/components/ui/PinGridSkeleton';

interface UploadLoadingOverlayProps {
  statusText: string;
  progress: number;
  wakeStatus?: 'idle' | 'waking' | 'ready';
}

export default function UploadLoadingOverlay({
  statusText,
  progress,
  wakeStatus = 'idle',
}: UploadLoadingOverlayProps) {
  const wakeLabel =
    wakeStatus === 'waking'
      ? 'Waking AI engine on Hugging Face…'
      : wakeStatus === 'ready'
        ? 'AI engine online — synthesizing…'
        : null;

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto pointer-events-none">
          <PinGridSkeleton showStats cardCount={12} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[201] p-4 md:p-6 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto p-5 md:p-6 rounded-[2rem] bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl pointer-events-auto"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                Building your study board
              </p>
              <p
                className="text-sm md:text-base font-bold text-foreground truncate"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {statusText}
              </p>
              {wakeLabel && (
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${wakeStatus === 'waking' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                  {wakeLabel}
                </p>
              )}
            </div>
            <span className="text-lg font-mono font-black text-primary shrink-0">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-accent to-secondary"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            />
          </div>

          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-3 text-center">
            First request after sleep may take up to 60s on free tier
          </p>
        </motion.div>
      </div>
    </div>
  );
}
