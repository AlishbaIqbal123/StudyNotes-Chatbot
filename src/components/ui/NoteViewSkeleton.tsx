'use client';

import React from 'react';

function Bar({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-full ${className}`} />;
}

function Block({ className = '' }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-xl ${className}`} />;
}

/**
 * Skeleton mirroring NoteView layout: left nav · detailed notes prose · Lumina chat sidebar
 */
export default function NoteViewSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex h-full min-h-[100dvh] bg-background text-foreground overflow-hidden ${className}`} aria-hidden>
      {/* Left sidebar — matches NoteView nav (~288px) */}
      <aside className="hidden lg:flex w-[288px] min-w-[288px] glass-card border-r border-border flex-col shrink-0">
        <div className="flex items-center justify-between px-6 pt-6 mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <Block className="w-10 h-10 rounded-xl" />
            <Bar className="h-5 w-20" />
          </div>
          <Block className="w-8 h-8 rounded-xl" />
        </div>

        <nav className="flex-1 px-4 space-y-6 overflow-hidden">
          {['Study Core', 'Practice & Recall', 'Multimedia Lab'].map((group) => (
            <div key={group} className="space-y-2">
              <Bar className="h-2 w-24 ml-3 opacity-60" />
              {Array.from({ length: group === 'Study Core' ? 5 : group === 'Practice & Recall' ? 2 : 2 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border border-transparent ${
                    group === 'Study Core' && i === 0 ? 'bg-primary/10 border-primary/20' : ''
                  }`}
                >
                  <Block className="w-4 h-4 rounded shrink-0" />
                  <Bar className={`h-3 ${i === 0 && group === 'Study Core' ? 'w-28' : 'w-24'}`} />
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-auto px-4 pb-6 pt-4 border-t border-border/50 flex flex-col items-center gap-3">
          <Block className="w-10 h-10 rounded-xl" />
          <Bar className="h-2 w-24 opacity-40" />
        </div>
      </aside>

      {/* Main — detailed notes column */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header shimmer */}
        <div className="lg:hidden h-16 border-b border-border/50 flex items-center justify-between px-4 shrink-0">
          <Block className="w-9 h-9 rounded-xl" />
          <div className="flex items-center gap-2">
            <Block className="w-8 h-8 rounded-lg" />
            <Bar className="h-4 w-16" />
          </div>
          <Block className="w-9 h-9 rounded-xl" />
        </div>

        <div className="flex-1 overflow-hidden px-6 lg:px-10 py-8 lg:py-10">
          {/* Session badge + title */}
          <div className="mb-10 space-y-4">
            <Bar className="h-6 w-32 rounded-full" />
            <Bar className="h-12 lg:h-16 w-full max-w-3xl" />
            <Bar className="h-10 w-2/3 max-w-xl" />
          </div>

          {/* Reader mode pills — Study / Cram / Present */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Bar className="h-9 w-24 rounded-full" />
            <Bar className="h-9 w-20 rounded-full opacity-70" />
            <Bar className="h-9 w-24 rounded-full opacity-70" />
          </div>

          {/* Prose blocks — h2 with left border, paragraphs, diagram */}
          <div className="space-y-8 max-w-4xl">
            <div className="space-y-3 pl-4 border-l-4 border-primary/20">
              <Bar className="h-7 w-2/3" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <Bar className="h-3 w-full" />
                <Bar className="h-3 w-[95%]" />
                <Bar className="h-3 w-[88%]" />
                {i === 1 && <Bar className="h-3 w-[70%]" />}
              </div>
            ))}

            {/* Mermaid / diagram placeholder */}
            <Block className="w-full h-48 lg:h-56 rounded-2xl border border-border/40" />

            <div className="space-y-3 pl-4 border-l-4 border-primary/20 pt-2">
              <Bar className="h-6 w-1/2" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`b-${i}`} className="space-y-2.5">
                <Bar className="h-3 w-full" />
                <Bar className="h-3 w-[92%]" />
                <Bar className="h-3 w-[80%]" />
              </div>
            ))}

            {/* Blockquote card */}
            <div className="p-5 rounded-r-xl border-l-4 border-secondary/30 bg-muted/20 space-y-2">
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-[85%]" />
            </div>
          </div>
        </div>
      </main>

      {/* Right chat sidebar — matches ChatSidebar (~384px) */}
      <aside className="hidden lg:flex w-[384px] min-w-[384px] glass-card border-l border-border/60 flex-col shrink-0">
        <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Block className="w-8 h-8 rounded-xl" />
            <div className="space-y-1.5">
              <Bar className="h-3 w-24" />
              <Bar className="h-2 w-32 opacity-60" />
            </div>
          </div>
          <Block className="w-7 h-7 rounded-lg" />
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          <div className="flex gap-2">
            <Block className="w-7 h-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-[90%]" />
              <Bar className="h-3 w-[75%]" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <div className="flex-1 max-w-[85%] space-y-2">
              <Bar className="h-3 w-full ml-auto" />
              <Bar className="h-3 w-[80%] ml-auto" />
            </div>
          </div>
          <div className="flex gap-2">
            <Block className="w-7 h-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-[95%]" />
              <Bar className="h-3 w-[60%]" />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border/50 shrink-0 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Bar className="h-7 w-28 rounded-full" />
            <Bar className="h-7 w-32 rounded-full" />
            <Bar className="h-7 w-24 rounded-full" />
          </div>
          <Block className="h-12 w-full rounded-2xl" />
        </div>
      </aside>
    </div>
  );
}
