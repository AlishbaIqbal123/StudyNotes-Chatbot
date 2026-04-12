'use client';

import React, { Suspense } from 'react';
import NoteView from '@/components/notes/NoteView';
import { useSearchParams } from 'next/navigation';

function NoteContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest text-muted-foreground">
        No Insight ID Provided
      </div>
    );
  }

  return <NoteView id={id} />;
}

export default function NotePage() {
  return (
    <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    }>
      <NoteContent />
    </Suspense>
  );
}
