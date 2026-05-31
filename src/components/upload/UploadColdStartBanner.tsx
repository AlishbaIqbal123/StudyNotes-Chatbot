'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, CheckCircle2, Moon } from 'lucide-react';
import { useBackendWakeContext } from '@/components/BackendWakeProvider';
import type { BackendStatus } from '@/hooks/useBackendWake';

const BANNER_COPY: Record<
  BackendStatus,
  { title: string; body: string; border: string; icon: typeof Zap; spin?: boolean }
> = {
  idle: {
    title: 'Checking AI engine…',
    body: 'Lumina pings your backend automatically — you never need to open the Hugging Face URL manually.',
    border: 'border-border bg-muted/30',
    icon: Loader2,
    spin: true,
  },
  waking: {
    title: 'Waking AI engine…',
    body: 'Free-tier Hugging Face Spaces sleep when idle. Cold start can take up to 60 seconds — prepare your file while we wake the server.',
    border: 'border-amber-500/30 bg-amber-500/10',
    icon: Loader2,
    spin: true,
  },
  online: {
    title: 'AI engine ready',
    body: 'Backend is awake. Synthesis should start quickly when you tap generate.',
    border: 'border-emerald-500/30 bg-emerald-500/10',
    icon: CheckCircle2,
  },
  sleeping: {
    title: 'AI engine asleep — we will wake it for you',
    body: 'No manual step needed. When you start synthesis, Lumina pings the backend automatically. First request after sleep may take up to 60 seconds.',
    border: 'border-amber-500/30 bg-amber-500/10',
    icon: Moon,
  },
};

export default function UploadColdStartBanner() {
  const { status, pingBackend } = useBackendWakeContext();

  useEffect(() => {
    void pingBackend();
  }, [pingBackend]);

  const copy = BANNER_COPY[status];
  const Icon = copy.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 p-4 md:p-5 rounded-2xl border flex items-start gap-4 ${copy.border}`}
    >
      <div className="w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center shrink-0 shadow-sm">
        <Icon className={`w-5 h-5 text-primary ${copy.spin ? 'animate-spin' : ''}`} />
      </div>
      <div className="min-w-0 text-left">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">
            {copy.title}
          </p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{copy.body}</p>
      </div>
      <span
        className={`hidden sm:block w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
          status === 'online'
            ? 'bg-emerald-500'
            : status === 'waking' || status === 'idle'
              ? 'bg-amber-400 animate-pulse'
              : 'bg-muted-foreground/40'
        }`}
        aria-hidden
      />
    </motion.div>
  );
}
