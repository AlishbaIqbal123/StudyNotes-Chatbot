import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { NoteData } from '@/types/note.types';
import type { GenerationStatusReport } from '@/lib/generationStatus';

export async function persistNoteUpdate(
  noteId: string,
  patch: Partial<NoteData> & { generation_status?: GenerationStatusReport },
  isGuest: boolean
): Promise<void> {
  if (isGuest) {
    const key = `lumina_guest_note_${noteId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...existing, ...patch }));
    return;
  }
  await updateDoc(doc(db, 'notes', noteId), patch);
}
