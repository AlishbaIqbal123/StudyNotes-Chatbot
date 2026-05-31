'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, X, ArrowLeft } from 'lucide-react';
import CursorEyesCartoon from '@/components/ui/CursorEyesCartoon';
import PinGridSkeleton from '@/components/ui/PinGridSkeleton';
import {
  UPLOAD_ERROR_META,
  type UploadErrorType,
} from '@/lib/uploadErrors';

interface ErrorStateScreenProps {
  errorType: UploadErrorType;
  message?: string;
  detail?: string;
  isRetryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  onBack?: () => void;
}

export default function ErrorStateScreen({
  errorType,
  message,
  detail,
  isRetryable = false,
  onRetry,
  onDismiss,
  onBack,
}: ErrorStateScreenProps) {
  const meta = UPLOAD_ERROR_META[errorType];
  const displayMessage = message || meta.subtitle;

  return (
    <div className="fixed inset-0 z-[210] overflow-y-auto">
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md">
        <div className="opacity-40 pointer-events-none p-6 lg:p-10 max-w-[1600px] mx-auto">
          <PinGridSkeleton showStats={false} cardCount={8} />
        </div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative w-full max-w-md p-8 md:p-10 rounded-[2.5rem] bg-card/90 backdrop-blur-xl border border-border shadow-2xl text-center"
        >
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-muted/60 text-muted-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex justify-center mb-6">
            <CursorEyesCartoon mood={meta.mood} />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">
            {meta.title}
          </p>
          <h2
            className="text-xl md:text-2xl font-bold mb-3 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {displayMessage}
          </h2>
          {detail && detail !== displayMessage && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-6 line-clamp-3">
              {detail}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            {isRetryable && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            )}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-border bg-card text-xs font-black uppercase tracking-widest hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to form
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
