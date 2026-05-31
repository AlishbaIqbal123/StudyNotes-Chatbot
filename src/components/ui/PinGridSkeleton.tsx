'use client';

import React from 'react';

interface PinGridSkeletonProps {
  cardCount?: number;
  showHeader?: boolean;
  showStats?: boolean;
  showFilters?: boolean;
  className?: string;
}

function ShimmerBar({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-full ${className}`} />;
}

function PinCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`rounded-[2rem] border border-border/60 bg-card/40 overflow-hidden ${tall ? 'row-span-2' : ''}`}>
      <div className={`skeleton-shimmer w-full ${tall ? 'h-[320px]' : 'aspect-[16/11] min-h-[180px]'}`} />
      <div className="p-5 space-y-3">
        <ShimmerBar className="h-3.5 w-[78%]" />
        <ShimmerBar className="h-2.5 w-[52%]" />
        <div className="flex justify-between pt-2">
          <ShimmerBar className="h-2 w-16" />
          <ShimmerBar className="h-2 w-12" />
        </div>
      </div>
    </div>
  );
}

export default function PinGridSkeleton({
  cardCount = 12,
  showHeader = true,
  showStats = true,
  showFilters = true,
  className = '',
}: PinGridSkeletonProps) {
  const heights = [false, true, false, false, true, false, false, true, false, false, true, false];

  return (
    <div className={`w-full animate-in fade-in duration-500 ${className}`} aria-hidden>
      {showHeader && (
        <div className="mb-10 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <ShimmerBar className="h-8 w-36" />
            <div className="flex gap-2">
              <div className="skeleton-shimmer w-10 h-10 rounded-full" />
              <div className="skeleton-shimmer w-10 h-10 rounded-full" />
            </div>
          </div>
          <ShimmerBar className="h-12 w-full max-w-xl" />
          <ShimmerBar className="h-4 w-full max-w-2xl" />
          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer w-9 h-9 rounded-full shrink-0" />
              ))}
            </div>
          )}
        </div>
      )}

      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-[2rem] border border-border/50 bg-card/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="skeleton-shimmer w-10 h-10 rounded-xl" />
                <ShimmerBar className="h-2.5 w-24" />
              </div>
              <ShimmerBar className="h-8 w-20" />
              <ShimmerBar className="h-2 w-40" />
            </div>
          ))}
        </div>
      )}

      <div
        className="grid gap-6 w-full max-w-[1600px] mx-auto"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
      >
        {Array.from({ length: cardCount }).map((_, i) => (
          <PinCardSkeleton key={i} tall={heights[i % heights.length]} />
        ))}
      </div>
    </div>
  );
}
