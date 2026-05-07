# Design Document — LuminaStudy Fixes

## Overview

This document describes the technical design for all 9 fix areas in LuminaStudy. The implementation touches the FastAPI backend (`hf_final_deploy/`), the Next.js frontend (`src/`), and project-level configuration files.

---

## 1. Secure API Key Management

### Changes
- **`hf_final_deploy/.env`** — create with new OpenRouter key (not committed)
- **`hf_final_deploy/.env.example`** — template with placeholder values
- **`.env.local`** — create at project root with Firebase config vars (not committed)
- **`.env.local.example`** — template for developers
- **`.gitignore`** — add `.env`, `.env.local`, `server/.env`, `hf_final_deploy/.env`
- **`src/lib/firebase.ts`** — replace hardcoded strings with `process.env.NEXT_PUBLIC_FIREBASE_*`
- **`hf_final_deploy/main.py`** — add startup warning if `OPENROUTER_API_KEY` is missing

### Environment Variables
```
# .env.local.example
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=https://Alishba-1342-lumina-backend.hf.space

# hf_final_deploy/.env.example
OPENROUTER_API_KEY=
```

---

## 2. Backend Consolidation

### Changes
- Delete `hf_deploy/` directory entirely
- Delete `server/server/` nested duplicate
- Update `server/.env` with new API key
- Update `README.md` to document `hf_final_deploy/` as canonical backend
- `hf_final_deploy/` remains unchanged structurally — just update `.env`

---

## 3. Selective Content Generation

### `hf_final_deploy/app/services/ai_service.py`

Add `generation_type: str = 'all'` parameter to `process_document()`:

```python
def process_document(text, topic, source_type, source_url, generation_type='all'):
    compressed = _compress_source(text)
    images = _fetch_educational_images(topic)
    image_md = build_image_md(images)

    result = {
        "title": topic,
        "simplified_notes": "",
        "quizzes": [],
        "flashcards": [],
        "roadmap": "",
        "mind_map": "",
        "podcast_script": "",
        "visual_prompt": ""
    }

    if generation_type in ('all', 'notes'):
        notes_raw = _generate_notes(compressed, image_md)
        notes_data = _parse_notes(notes_raw)
        result.update(notes_data)

    if generation_type in ('all', 'quiz', 'flashcards'):
        qf_raw = _generate_quiz_and_flashcards(compressed)
        qf_data = _parse_quiz_and_flashcards(qf_raw)
        if generation_type == 'flashcards':
            result['flashcards'] = qf_data.get('flashcards', [])
        else:
            result['quizzes'] = qf_data.get('quizzes', [])
            result['flashcards'] = qf_data.get('flashcards', [])

    if generation_type == 'all':
        diag_raw = _generate_diagrams(compressed)
        diag_data = _parse_diagrams(diag_raw)
        result.update(diag_data)

    if generation_type in ('all', 'podcast'):
        pod_raw = _generate_podcast(compressed)
        result['podcast_script'] = _parse_podcast(pod_raw)

    return result
```

### `hf_final_deploy/main.py`
Pass `generation_type` to `AIService.process_document()`.

---

## 4. AI Model Upgrade + Notes Quality

### Model
Replace all `_call_openrouter` model arguments with `google/gemini-2.5-pro-preview`.

### Mermaid Validation
```python
VALID_MERMAID_KEYWORDS = ('flowchart', 'graph', 'mindmap', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'gantt', 'pie')

def _validate_mermaid(diagram: str) -> str:
    clean = diagram.strip()
    if not any(clean.startswith(kw) for kw in VALID_MERMAID_KEYWORDS):
        print(f"[LUMINA] WARNING: Invalid mermaid output, discarding")
        return ""
    return clean
```

### Notes Prompt Improvements
- Explicit markdown structure instructions
- Forbid filler phrases
- Require `##` for every major topic, `###` for sub-topics
- Require blockquotes for key insights
- Require tables for comparisons
- Require Mermaid diagrams per section
- Image embedding format: `![alt](url)`

---

## 5. Password Reset Fix

### `src/app/forgot-password/page.tsx`
Replace the fake `setTimeout` with:
```typescript
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  try {
    await sendPasswordResetEmail(auth, email);
    setSuccess(true);
  } catch (err: any) {
    const benignCodes = ['auth/user-not-found', 'auth/invalid-email'];
    if (benignCodes.includes(err.code)) {
      setSuccess(true); // Don't reveal if account exists
    } else {
      setError('Something went wrong. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 6. Guest Note Loading Fix

### `src/hooks/useNoteData.ts`
```typescript
const fetchNote = async () => {
  // Guest note path
  if (id.startsWith('guest_')) {
    try {
      const raw = localStorage.getItem(`lumina_guest_note_${id}`);
      if (raw) {
        setNote(JSON.parse(raw) as NoteData);
      } else {
        setError('Guest note not found. It may have been cleared from your browser.');
      }
    } catch {
      setError('Guest note not found. It may have been cleared from your browser.');
    } finally {
      setLoading(false);
    }
    return;
  }
  // Firestore path (existing logic)
  ...
};
```

---

## 7. Rate Limit UX

### Dashboard (`src/app/dashboard/page.tsx`)
- Replace `getDocs` with `onSnapshot` for real-time + offline cache
- Store unsubscribe function in `useEffect` cleanup
- Show cached data immediately, no spinner on re-navigation

### `src/components/notes/RateLimitModal.tsx`
- Add `existingNotesCount?: number` prop
- Show: "Your {existingNotesCount} existing notes are safe and fully viewable."
- Add "View My Notes" button → navigate to `/dashboard`

### `src/app/upload/page.tsx`
- Detect HTTP 429 → set `showLimitModal(true)` instead of `setError()`
- Pass `existingNotesCount` to RateLimitModal

### `hf_final_deploy/app/services/ai_service.py`
- In `_call_openrouter`: on 429 → `raise AIServiceError("RATE_LIMIT_EXCEEDED")`

### `hf_final_deploy/main.py`
- In `/process` handler: catch `AIServiceError("RATE_LIMIT_EXCEEDED")` → return `HTTPException(429)`
- In `/chat` handler: same pattern

---

## 8. Structured Error Handling

### Upload Page Error Classification
```typescript
const classifyError = (err: any): { message: string; isRateLimit: boolean; isRetryable: boolean } => {
  const status = err?.response?.status;
  const detail = (err?.response?.data?.detail || '').toLowerCase();

  if (status === 429) return { message: '', isRateLimit: true, isRetryable: false };
  if (!err?.response) return { message: 'Network error — please check your connection and try again.', isRateLimit: false, isRetryable: true };
  if (status === 400 && (detail.includes('transcript') || detail.includes('youtube')))
    return { message: 'Could not extract the video transcript. Try pasting the transcript manually using the link below.', isRateLimit: false, isRetryable: false };
  if (status === 400 && (detail.includes('too short') || detail.includes('minimum')))
    return { message: 'The extracted content is too short. Please provide more detailed source material.', isRateLimit: false, isRetryable: false };
  if (status === 500)
    return { message: 'The AI service encountered an unexpected error. Please try again in a moment.', isRateLimit: false, isRetryable: true };
  return { message: err?.response?.data?.detail || 'An unexpected error occurred.', isRateLimit: false, isRetryable: false };
};
```

### NoteView Chat 429 Handling
- In `handleSendMessage`: if response status 429 → `setIsRateLimitOpen(true)`

---

## 9. Stub Pages Implementation

### `/flashcards` — Global Flashcard Review
```
State: notes[], flippedCards{}, loading, filter(noteId|'all')
Data: fetch all user notes from Firestore + localStorage guest notes
      aggregate: [{...card, noteTitle, noteId}]
UI:   - Header with total count
      - Filter by note dropdown
      - Masonry grid of flip cards
      - Each card: front face (question), back face (answer, red bg)
      - Note title badge on each card
```

### `/reports` — Study Statistics
```
State: notes[], loading
Data: fetch all user notes
      compute: totalNotes, totalFlashcards, totalQuizzes, thisMonthNotes
UI:   - 4 stat cards (Notes, Flashcards, Quiz Questions, This Month)
      - Notes list table: title | date | flashcards | quiz questions | link
```

### `/audio` — Podcast Player
```
State: notes[], currentEpisode, isSpeaking, isPaused, progress
Data: fetch notes with non-empty podcast_script
UI:   - Episode list (note title + duration estimate + play button)
      - Active player bar at bottom: title, progress bar, play/pause/stop
      - SpeechSynthesis for playback
      - Browser support check
```

---

## File Change Summary

| File | Change Type |
|------|-------------|
| `hf_final_deploy/.env` | Create |
| `hf_final_deploy/.env.example` | Create |
| `hf_final_deploy/app/services/ai_service.py` | Modify — model upgrade, generation_type, rate limit error, Mermaid validation |
| `hf_final_deploy/main.py` | Modify — pass generation_type, 429 handling, startup warning |
| `.env.local` | Create |
| `.env.local.example` | Create |
| `.gitignore` | Modify — add env files |
| `src/lib/firebase.ts` | Modify — use process.env vars |
| `src/hooks/useNoteData.ts` | Modify — guest note localStorage path |
| `src/app/forgot-password/page.tsx` | Modify — real Firebase password reset |
| `src/app/upload/page.tsx` | Modify — error classification, 429→modal |
| `src/app/dashboard/page.tsx` | Modify — onSnapshot for offline cache |
| `src/components/notes/RateLimitModal.tsx` | Modify — existingNotesCount prop, View My Notes button |
| `src/components/notes/NoteView.tsx` | Modify — chat 429 → RateLimitModal |
| `src/app/flashcards/page.tsx` | Replace — full implementation |
| `src/app/reports/page.tsx` | Replace — full implementation |
| `src/app/audio/page.tsx` | Replace — full implementation |
| `server/.env` | Modify — update API key |
| `README.md` | Modify — document backend structure |
| `hf_deploy/` | Delete |
| `server/server/` | Delete |
