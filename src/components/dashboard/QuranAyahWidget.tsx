'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Sparkles } from 'lucide-react';
import { getDailyAyah, getRandomAyah, type QuranAyah } from '@/lib/quranAyahs';
import type { BackendStatus } from '@/hooks/useBackendWake';

interface QuranAyahWidgetProps {
  backendStatus?: BackendStatus;
  onRefresh?: () => void;
  wakeIntervalMs?: number;
  className?: string;
}

export default function QuranAyahWidget({
  backendStatus = 'idle',
  onRefresh,
  wakeIntervalMs = 10 * 60 * 1000,
  className = '',
}: QuranAyahWidgetProps) {
  const [ayah, setAyah] = useState<QuranAyah>(() => getDailyAyah());
  const [mode, setMode] = useState<'daily' | 'refresh'>('daily');
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    setAyah(getRandomAyah());
    setMode('refresh');
    onRefresh?.();
    window.setTimeout(() => setSpinning(false), 600);
  };

  const statusLabel =
    backendStatus === 'online'
      ? 'AI engine ready'
      : backendStatus === 'waking'
        ? 'Waking AI engine…'
        : backendStatus === 'sleeping'
          ? 'AI engine sleeping — tap refresh'
          : 'Checking engine…';

  const statusColor =
    backendStatus === 'online'
      ? 'bg-emerald-500'
      : backendStatus === 'waking'
        ? 'bg-amber-400 animate-pulse'
        : 'bg-muted-foreground/40';

  return (
    <div
      className={`p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0A1128] via-[#0f1a3a] to-[#0A1128] text-white border border-white/10 hover:border-emerald-500/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.12)] transition-all duration-500 flex flex-col justify-between min-h-[300px] relative overflow-hidden group ${className}`}
    >
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')]" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-[9px] font-black uppercase tracking-widest">
            Daily Ayah
          </span>
          <Sparkles className="w-4 h-4 text-emerald-400/80" />
        </div>

        <motion.p
          key={ayah.arabic}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          dir="rtl"
          className="text-2xl md:text-3xl font-bold leading-loose text-right mb-4"
          style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
        >
          {ayah.arabic}
        </motion.p>

        <motion.p
          key={ayah.translation}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-zinc-300 leading-relaxed italic opacity-90"
        >
          &ldquo;{ayah.translation}&rdquo;
        </motion.p>
      </div>

      <div className="relative z-10 flex items-center justify-between pt-5 mt-4 border-t border-white/10 gap-3 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-bold text-emerald-400/90">{ayah.reference}</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate">
              {statusLabel}
            </span>
          </div>
          <span className="text-[8px] text-zinc-600 leading-snug">
            Ayah changes daily · AI ping every {Math.round(wakeIntervalMs / 60000)} min while app is open
          </span>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-emerald-500/20 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shrink-0"
          title="New ayah + wake AI backend"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
          {mode === 'daily' ? 'Refresh' : 'New ayah'}
        </button>
      </div>
    </div>
  );
}
