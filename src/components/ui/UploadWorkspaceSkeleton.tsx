'use client';

import React from 'react';

function ShimmerBar({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-full ${className}`} />;
}

export default function UploadWorkspaceSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10" aria-hidden>
      <div className="space-y-4">
        <ShimmerBar className="h-6 w-40" />
        <ShimmerBar className="h-14 w-full max-w-lg" />
        <ShimmerBar className="h-4 w-full max-w-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6 rounded-[2rem] border border-border/50 bg-card/40 flex items-center gap-5">
              <div className="skeleton-shimmer w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <ShimmerBar className="h-3 w-24" />
                <ShimmerBar className="h-2 w-32" />
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-8">
          <div className="min-h-[450px] rounded-[2.5rem] border border-border/50 bg-card/40 p-8 lg:p-12 space-y-8">
            <div className="space-y-2">
              <ShimmerBar className="h-7 w-48" />
              <ShimmerBar className="h-3 w-64" />
            </div>
            <div className="skeleton-shimmer flex-1 min-h-[220px] rounded-[2rem] border-2 border-dashed border-border/40" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-border/40 space-y-2">
                  <ShimmerBar className="h-3 w-28" />
                  <ShimmerBar className="h-2 w-full" />
                </div>
              ))}
            </div>
            <div className="skeleton-shimmer h-14 w-full rounded-[1.5rem]" />
          </div>
        </div>
      </div>
    </div>
  );
}
