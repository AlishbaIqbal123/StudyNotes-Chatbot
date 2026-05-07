# Requirements Document

## Introduction

LuminaStudy is an AI-powered study platform that transforms source material (YouTube videos, PDFs, raw text) into structured study content: detailed notes, quizzes, flashcards, roadmaps, and podcast scripts. This document covers nine critical fixes and improvements across security, backend consolidation, AI quality, UX correctness, bug fixes, and new feature implementations. The goal is to make the platform production-ready, reliable, and fully functional for both authenticated users and guests.

## Glossary

- **Platform**: The LuminaStudy application, comprising the Next.js frontend and FastAPI backend.
- **Frontend**: The Next.js 16 application deployed to Firebase Hosting.
- **Backend**: The FastAPI application deployed to Hugging Face Spaces at `hf_final_deploy/`.
- **AI_Service**: The Python module `hf_final_deploy/app/services/ai_service.py` responsible for all OpenRouter API calls and content generation.
- **Extraction_Service**: The Python module `hf_final_deploy/app/services/extraction_service.py` responsible for extracting text from YouTube, PDF, and DOCX sources.
- **NoteView**: The React component `src/components/notes/NoteView.tsx` that renders a single note's study content.
- **useNoteData**: The React hook `src/hooks/useNoteData.ts` that fetches note data from Firestore or localStorage.
- **RateLimitModal**: The React component `src/components/notes/RateLimitModal.tsx` shown when the OpenRouter API quota is exceeded.
- **Upload_Page**: The React page `src/app/upload/page.tsx` where users submit content for AI processing.
- **Dashboard**: The notes listing page where authenticated users see all their saved notes.
- **Guest_Note**: A note generated without authentication, stored in `localStorage` under the key `lumina_guest_note_{id}` where `id` follows the format `guest_TIMESTAMP`.
- **Firestore_Note**: A note stored in the Firebase Firestore `notes` collection, identified by a Firestore document ID.
- **generation_type**: A form field sent to the backend `/process` endpoint specifying which content types to generate: `all`, `notes`, `quiz`, `flashcards`, or `podcast`.
- **OpenRouter**: The third-party AI API gateway used by the Backend to call language models.
- **Rate_Limit_Error**: An HTTP 429 response from OpenRouter indicating the API quota has been exceeded.
- **hf_final_deploy**: The canonical backend directory that is the single source of truth for the deployed Backend.
- **server/**: A legacy local-development backend directory that is no longer the source of truth and must be cleaned up.
- **hf_deploy/**: An older, deprecated backend directory that must be removed.

---

## Requirements

### Requirement 1: Secure API Key Management

**User Story:** As a developer, I want all API keys and secrets removed from version-controlled files, so that credentials are never exposed in the repository.

#### Acceptance Criteria

1. THE Platform SHALL store the OpenRouter API key exclusively in `hf_final_deploy/.env` (not committed to git) and read it via `os.getenv('OPENROUTER_API_KEY')` at runtime.
2. THE Platform SHALL store Firebase configuration values exclusively in a `.env.local` file at the project root (not committed to git) and expose them to the Frontend via `NEXT_PUBLIC_` prefixed environment variables.
3. THE Frontend SHALL read Firebase configuration from `process.env.NEXT_PUBLIC_FIREBASE_API_KEY`, `process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `process.env.NEXT_PUBLIC_FIREBASE_APP_ID` instead of hardcoded string literals.
4. THE Platform SHALL ensure `.env.local`, `.env`, and `server/.env` are listed in `.gitignore` so they are never committed.
5. THE Platform SHALL provide a `.env.local.example` file at the project root listing all required environment variable keys with placeholder values, so developers know what to configure.
6. THE Platform SHALL provide a `hf_final_deploy/.env.example` file listing all required backend environment variable keys with placeholder values.
7. WHEN the Backend starts and `OPENROUTER_API_KEY` is not set or is an empty string, THE Backend SHALL log a clear startup warning: `"WARNING: OPENROUTER_API_KEY is not configured. AI generation will fail."`.
8. THE AI_Service SHALL use the OpenRouter API key stored in `hf_final_deploy/.env` as `OPENROUTER_API_KEY`.

---

### Requirement 2: Backend Consolidation

**User Story:** As a developer, I want a single, authoritative backend directory, so that there is no confusion about which code is deployed and maintenance is straightforward.

#### Acceptance Criteria

1. THE Platform SHALL designate `hf_final_deploy/` as the single source of truth for all backend code.
2. THE Platform SHALL remove the `hf_deploy/` directory entirely from the repository.
3. THE Platform SHALL remove the `server/server/` nested duplicate directory entirely from the repository.
4. THE Platform SHALL retain `server/` only as a lightweight local-development reference; its `server/.env` SHALL be updated to contain the new API key and SHALL be listed in `.gitignore`.
5. WHEN a developer reads the project root `README.md`, THE Platform SHALL clearly document that `hf_final_deploy/` is the deployed backend and `server/` is for local development only.
6. THE `hf_final_deploy/.env` SHALL contain the updated `OPENROUTER_API_KEY` value.

---

### Requirement 3: Selective Content Generation

**User Story:** As a student, I want to choose which type of study content to generate (notes only, quiz only, flashcards only, podcast only, or all), so that I can save time and API quota when I only need one content type.

#### Acceptance Criteria

1. WHEN the `/process` endpoint receives `generation_type='notes'`, THE AI_Service SHALL execute only the notes generation pipeline (Stage 1) and return `simplified_content` populated, with `quizzes`, `flashcards`, `roadmap`, `mind_map`, and `podcast_script` returned as empty arrays or empty strings.
2. WHEN the `/process` endpoint receives `generation_type='quiz'`, THE AI_Service SHALL execute only the quiz and flashcard generation pipeline (Stage 2) and return `quizzes` and `flashcards` populated, with `simplified_content`, `roadmap`, `mind_map`, and `podcast_script` returned as empty or minimal values.
3. WHEN the `/process` endpoint receives `generation_type='flashcards'`, THE AI_Service SHALL execute only the flashcard portion of Stage 2 and return `flashcards` populated, with all other fields returned as empty or minimal values.
4. WHEN the `/process` endpoint receives `generation_type='podcast'`, THE AI_Service SHALL execute only the podcast script generation pipeline (Stage 4) and return `podcast_script` populated, with all other fields returned as empty or minimal values.
5. WHEN the `/process` endpoint receives `generation_type='all'` or the field is absent, THE AI_Service SHALL execute all four generation stages (notes, quiz+flashcards, diagrams, podcast) as currently implemented.
6. THE AI_Service `process_document` method SHALL accept a `generation_type` parameter and branch execution accordingly.
7. THE Backend `/process` endpoint SHALL pass the `generation_type` form field value to `AIService.process_document`.
8. WHEN `generation_type` is an unrecognised value, THE Backend SHALL treat it as `'all'` and proceed with full generation.

---

### Requirement 4: Notes Quality and AI Model Upgrade

**User Story:** As a student, I want my generated notes to be beautifully formatted, deeply researched, and visually rich, so that studying from them is effective and engaging.

#### Acceptance Criteria

1. THE AI_Service SHALL use the model `google/gemini-2.5-pro-preview` for the notes generation call (Stage 1) to maximise formatting quality and research depth.
2. THE AI_Service SHALL use the model `google/gemini-2.5-pro-preview` for the quiz and flashcard generation call (Stage 2).
3. THE AI_Service SHALL use the model `google/gemini-2.5-pro-preview` for the diagram generation call (Stage 3).
4. THE AI_Service SHALL use the model `google/gemini-2.5-pro-preview` for the podcast script generation call (Stage 4).
5. THE AI_Service SHALL use the model `google/gemini-2.5-pro-preview` for the source compression summarisation calls.
6. WHEN the AI_Service generates a Mermaid diagram, THE AI_Service SHALL validate that the output begins with a valid Mermaid keyword (`flowchart`, `graph`, `mindmap`, `sequenceDiagram`, `classDiagram`) before storing it; IF the output does not begin with a valid keyword, THEN THE AI_Service SHALL log a warning and store an empty string for that diagram field.
7. THE notes generation prompt SHALL instruct the model to produce structured markdown with: a top-level `#` title, `##` section headings for every major topic, `###` sub-headings for components, `>` blockquotes for key insights, tables for comparisons, and fenced code blocks for code or Mermaid diagrams.
8. THE notes generation prompt SHALL instruct the model to embed educational images using the exact format `![alt text](url)` at relevant sections.
9. WHEN the AI_Service injects Wikipedia or Wikimedia images into notes, THE AI_Service SHALL verify each image URL is non-empty before embedding it.
10. THE AI_Service notes prompt SHALL explicitly forbid filler phrases such as "in conclusion", "it is important to note", and "as mentioned above".

---

### Requirement 5: Functional Password Reset

**User Story:** As a registered user, I want to receive a real password reset email, so that I can regain access to my account when I forget my password.

#### Acceptance Criteria

1. WHEN a user submits the forgot-password form with a valid email address, THE Frontend SHALL call Firebase Auth `sendPasswordResetEmail(auth, email)` with the provided email address.
2. WHEN `sendPasswordResetEmail` resolves successfully, THE Frontend SHALL display the success state showing "Check your email" with the message "If an account exists for {email}, you'll receive a reset link shortly."
3. IF `sendPasswordResetEmail` throws an error with code `auth/user-not-found` or `auth/invalid-email`, THEN THE Frontend SHALL still display the success state (to avoid user enumeration) without revealing whether the account exists.
4. IF `sendPasswordResetEmail` throws any other error, THEN THE Frontend SHALL display an inline error message: "Something went wrong. Please try again." without navigating away.
5. WHILE the password reset request is in progress, THE Frontend SHALL display a loading spinner and disable the submit button to prevent duplicate submissions.
6. THE forgot-password page SHALL import `sendPasswordResetEmail` from `firebase/auth` and use the `auth` instance from `src/lib/firebase.ts`.

---

### Requirement 6: Guest Note Loading Fix

**User Story:** As a guest user, I want to view the note I just generated without being told it was not found, so that I can review my study content immediately after generation.

#### Acceptance Criteria

1. WHEN `useNoteData` is called with an `id` that begins with the prefix `guest_`, THE useNoteData hook SHALL read the note from `localStorage` using the key `lumina_guest_note_{id}` instead of querying Firestore.
2. WHEN the `localStorage` key `lumina_guest_note_{id}` exists and contains valid JSON, THE useNoteData hook SHALL parse it and set it as the note state.
3. IF the `localStorage` key `lumina_guest_note_{id}` does not exist or contains invalid JSON, THEN THE useNoteData hook SHALL set the error state to `'Guest note not found. It may have been cleared from your browser.'`.
4. WHEN `useNoteData` is called with an `id` that does NOT begin with `guest_`, THE useNoteData hook SHALL query Firestore as currently implemented.
5. THE useNoteData hook SHALL set `loading` to `false` after completing either the localStorage lookup or the Firestore query.

---

### Requirement 7: Billing and Rate Limit Experience

**User Story:** As a user who has hit the API rate limit, I want to continue viewing all my existing notes without interruption, so that my study workflow is not blocked by quota issues.

#### Acceptance Criteria

1. WHEN the Dashboard page mounts, THE Dashboard SHALL load notes from Firestore using `onSnapshot` with Firestore's built-in offline persistence cache, so that previously loaded notes are displayed immediately without a network round-trip.
2. WHEN Firestore returns cached note data while offline or before the network response arrives, THE Dashboard SHALL display those cached notes rather than showing a loading spinner.
3. THE Dashboard SHALL NOT re-fetch or re-query notes on every page navigation if the Firestore snapshot listener is already active and the data has not changed.
4. WHEN the Backend returns an HTTP 429 response during content generation, THE Upload_Page SHALL display the RateLimitModal instead of a generic error message.
5. WHEN the RateLimitModal is displayed, THE RateLimitModal SHALL show the count of the user's existing notes with the message: "Your {count} existing notes are safe and fully viewable."
6. WHEN the RateLimitModal is displayed, THE RateLimitModal SHALL provide a "View My Notes" button that closes the modal and navigates the user to the Dashboard.
7. THE NoteView component SHALL load and display note content that is already stored in Firestore or localStorage without making any new API calls to the Backend.
8. WHEN a user opens a previously generated note, THE useNoteData hook SHALL retrieve it from Firestore or localStorage without triggering any AI generation request.
9. THE RateLimitModal SHALL accept an optional `existingNotesCount` prop of type `number` and display it in the notes-safe message.

---

### Requirement 8: Structured Error Handling

**User Story:** As a user, I want clear, actionable error messages when something goes wrong, so that I know what happened and what to do next.

#### Acceptance Criteria

1. WHEN the Backend returns an HTTP 429 response to the Upload_Page, THE Upload_Page SHALL set a specific error state that triggers the RateLimitModal display rather than showing the generic error banner.
2. WHEN the Backend returns an HTTP 400 response with a detail message containing "transcript" or "YouTube", THE Upload_Page SHALL display the error message: "Could not extract the video transcript. Try pasting the transcript manually using the link below."
3. WHEN the Backend returns an HTTP 400 response with a detail message containing "too short" or "minimum", THE Upload_Page SHALL display the error message: "The extracted content is too short to generate study materials. Please provide more detailed source material."
4. WHEN a network error occurs (no response received), THE Upload_Page SHALL display the error message: "Network error — please check your connection and try again." with a "Retry" button that re-submits the same request.
5. WHEN the Backend returns an HTTP 500 response, THE Upload_Page SHALL display the error message: "The AI service encountered an unexpected error. Please try again in a moment."
6. WHEN the AI_Service `_call_openrouter` function receives an HTTP 429 response from OpenRouter, THE AI_Service SHALL raise an `AIServiceError` with the message `"RATE_LIMIT_EXCEEDED"` so the Backend can return HTTP 429 to the Frontend.
7. WHEN the Backend `/process` endpoint catches an `AIServiceError` with message `"RATE_LIMIT_EXCEEDED"`, THE Backend SHALL return HTTP 429 with `detail: "API rate limit exceeded. Please try again later."`.
8. WHEN the chat endpoint receives a rate limit error from the AI_Service, THE Backend `/chat` endpoint SHALL return HTTP 429 so the Frontend can display the RateLimitModal.
9. WHEN the NoteView `handleSendMessage` function receives a 429 response from the chat endpoint, THE NoteView SHALL open the RateLimitModal.

---

### Requirement 9: Implement Stub Pages

**User Story:** As a student, I want the Flashcards, Reports, and Audio pages to be fully functional, so that I can review all my flashcards globally, track my study progress, and listen to podcast scripts from any note.

#### Acceptance Criteria

##### 9a — Global Flashcards Page (`/flashcards`)

1. WHEN an authenticated user visits `/flashcards`, THE Flashcards_Page SHALL fetch all notes belonging to that user from Firestore and aggregate all `flashcards` arrays into a single deck.
2. WHEN the aggregated deck is loaded, THE Flashcards_Page SHALL display each flashcard as a flip card showing the `front` text on the front face and the `back` text on the back face.
3. WHEN a user clicks a flashcard, THE Flashcards_Page SHALL flip it to reveal the back face using a CSS 3D flip animation.
4. THE Flashcards_Page SHALL display the total card count and the source note title for each card.
5. WHEN no notes with flashcards exist, THE Flashcards_Page SHALL display the message: "No flashcards yet. Generate a note to create your first deck."
6. WHEN a guest user visits `/flashcards`, THE Flashcards_Page SHALL check localStorage for any `lumina_guest_note_*` keys and display flashcards from those notes.

##### 9b — Reports Page (`/reports`)

1. WHEN an authenticated user visits `/reports`, THE Reports_Page SHALL fetch all notes belonging to that user from Firestore and compute: total notes count, total flashcards count (sum of all `flashcards` array lengths), total quiz questions count (sum of all `quizzes` array lengths), and total notes generated this month.
2. THE Reports_Page SHALL display these four statistics as prominent stat cards.
3. THE Reports_Page SHALL display a list of all notes with their title, creation date, and counts of flashcards and quiz questions for each note.
4. WHEN no notes exist, THE Reports_Page SHALL display the message: "No study data yet. Generate your first note to see your stats."
5. WHEN a guest user visits `/reports`, THE Reports_Page SHALL compute and display stats from any `lumina_guest_note_*` keys found in localStorage.

##### 9c — Audio Labs Page (`/audio`)

1. WHEN an authenticated user visits `/audio`, THE Audio_Page SHALL fetch all notes belonging to that user from Firestore that have a non-empty `podcast_script` field.
2. THE Audio_Page SHALL display a list of available podcast episodes, each showing the note title and a play button.
3. WHEN a user clicks the play button for an episode, THE Audio_Page SHALL use the Web Speech API `SpeechSynthesis` to read the `podcast_script` aloud, cleaning markdown syntax before speaking.
4. WHEN audio is playing, THE Audio_Page SHALL display a progress bar and pause/stop controls.
5. WHEN a user clicks pause, THE Audio_Page SHALL call `window.speechSynthesis.pause()` and update the UI to show a resume button.
6. WHEN a user clicks stop, THE Audio_Page SHALL call `window.speechSynthesis.cancel()` and reset the progress bar to zero.
7. WHEN no notes with podcast scripts exist, THE Audio_Page SHALL display the message: "No audio content yet. Generate a note with 'Audio Labs' or 'Full Mastery Package' to create your first episode."
8. WHEN a guest user visits `/audio`, THE Audio_Page SHALL check localStorage for any `lumina_guest_note_*` keys and display podcast episodes from those notes.
9. IF the user's browser does not support `SpeechSynthesis`, THEN THE Audio_Page SHALL display the message: "Audio playback is not supported in your browser. Please use Chrome or Edge."
