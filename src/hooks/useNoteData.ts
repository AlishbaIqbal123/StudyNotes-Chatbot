// src/hooks/useNoteData.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NoteData } from '@/types/note.types';

export function useNoteData(id: string) {
  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchNote = async () => {
      // Guest note path — read from localStorage
      if (id.startsWith('guest_')) {
        try {
          const raw = localStorage.getItem(`lumina_guest_note_${id}`);
          if (raw) {
            const parsed = JSON.parse(raw) as NoteData;
            if (isMounted) setNote(parsed);
          } else {
            if (isMounted) setError('Guest note not found. It may have been cleared from your browser.');
          }
        } catch {
          if (isMounted) setError('Guest note not found. It may have been cleared from your browser.');
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // Firestore path — authenticated note
      try {
        const docRef = doc(db, 'notes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && isMounted) {
          setNote(docSnap.data() as NoteData);
        } else if (isMounted) {
          setError('Note not found');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch note:', err);
          setError('Failed to load note data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNote();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { note, loading, error, setNote };
}
