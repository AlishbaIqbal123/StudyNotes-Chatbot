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
