'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import {
  POPOVER_ACTIONS,
  LuminaPromptIntent,
  type PromptSource,
} from '@/lib/chatPrompts';

export interface AskLuminaAnchor {
  x: number;
  y: number;
  term: string;
  excerpt?: string;
  source: PromptSource;
}

interface AskLuminaPopoverProps {
  anchor: AskLuminaAnchor | null;
  onClose: () => void;
  onAsk: (intent: LuminaPromptIntent) => void;
}

export default function AskLuminaPopover({
  anchor,
  onClose,
  onAsk,
}: AskLuminaPopoverProps) {
  if (!anchor) return null;

  const left = Math.min(Math.max(anchor.x, 12), typeof window !== 'undefined' ? window.innerWidth - 280 : anchor.x);
  const top = Math.min(Math.max(anchor.y, 12), typeof window !== 'undefined' ? window.innerHeight - 220 : anchor.y);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.15 }}
        data-ask-lumina
        className="fixed z-[100] w-[268px] rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden"
        style={{ left, top }}
        role="dialog"
        aria-label="Ask Lumina"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-2 px-3 py-2.5 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/60">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Ask Lumina</p>
            <p className="text-xs font-bold truncate text-foreground" title={anchor.term}>
              {anchor.term.length > 48 ? `${anchor.term.slice(0, 48)}…` : anchor.term}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-2 grid grid-cols-2 gap-1.5">
          {POPOVER_ACTIONS.map((action) => (
            <button
              key={action.intent}
              type="button"
              onClick={() => onAsk(action.intent)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-[11px] font-bold text-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]"
            >
              <span className="text-sm">{action.short}</span>
              <span className="leading-tight">{action.label}</span>
            </button>
          ))}
        </div>

        <p className="px-3 pb-2 text-[9px] text-muted-foreground/70 text-center">
          Opens AI tutor →
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
