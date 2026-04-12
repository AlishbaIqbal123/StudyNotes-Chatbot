'use client';

import React, { Suspense } from 'react';
import NoteView from '@/components/notes/NoteView';
import { useSearchParams } from 'next/navigation';

import DashboardLayout from '@/components/dashboard/DashboardLayout';

function NoteContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] font-black uppercase tracking-widest text-muted-foreground/30">
        No Insight ID Provided
      </div>
    );
  }

  return <NoteView id={id} />;
}

export default function NotePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
          <div className="h-[60vh] flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
      }>
        <NoteContent />
      </Suspense>
    </DashboardLayout>
  );
}
