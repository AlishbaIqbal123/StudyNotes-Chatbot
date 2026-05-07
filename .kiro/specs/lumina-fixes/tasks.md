# Implementation Tasks — LuminaStudy Fixes

## Task List

- [x] 1. Security — Environment Files and Key Management
  - [x] 1.1 Create hf_final_deploy env file with new OpenRouter API key
  - [x] 1.2 Create hf_final_deploy env example file with placeholder values
  - [x] 1.3 Create env.local at project root with Firebase config vars
  - [x] 1.4 Create env.local.example at project root with placeholder keys
  - [x] 1.5 Update gitignore to exclude all env files
  - [x] 1.6 Update firebase.ts to read from process.env NEXT_PUBLIC vars
  - [x] 1.7 Update server env file with new API key

- [x] 2. Backend Consolidation — Cleanup
  - [x] 2.1 Delete hf_deploy directory
  - [x] 2.2 Delete server/server nested duplicate directory
  - [x] 2.3 Update README to document hf_final_deploy as canonical backend

- [x] 3. Backend — AI Model Upgrade and Notes Quality
  - [x] 3.1 Replace all model strings in ai_service.py with google/gemini-2.5-pro-preview
  - [x] 3.2 Add validate_mermaid helper and apply to roadmap and mind_map outputs
  - [x] 3.3 Rewrite notes generation prompt for rich markdown structure
  - [x] 3.4 Add startup warning in main.py when OPENROUTER_API_KEY is missing

- [x] 4. Backend — Rate Limit Error Propagation
  - [x] 4.1 Raise RATE_LIMIT_EXCEEDED error on HTTP 429 from OpenRouter in call_openrouter
  - [x] 4.2 Catch RATE_LIMIT_EXCEEDED in process endpoint and return HTTP 429
  - [x] 4.3 Catch RATE_LIMIT_EXCEEDED in chat endpoint and return HTTP 429

- [x] 5. Backend — Selective Content Generation
  - [x] 5.1 Add generation_type parameter to process_document in ai_service.py
  - [x] 5.2 Implement branching logic for each generation_type value
  - [x] 5.3 Pass generation_type from process endpoint to AIService.process_document

- [x] 6. Frontend — Fix Guest Note Loading
  - [x] 6.1 Update useNoteData.ts to detect guest_ prefix and read from localStorage

- [x] 7. Frontend — Fix Password Reset
  - [x] 7.1 Replace fake setTimeout in forgot-password page with real Firebase sendPasswordResetEmail

- [x] 8. Frontend — Rate Limit UX and RateLimitModal
  - [x] 8.1 Update RateLimitModal to accept existingNotesCount prop and show View My Notes button
  - [x] 8.2 Update upload page to detect HTTP 429 and show RateLimitModal
  - [x] 8.3 Update dashboard page to use onSnapshot for offline-first note loading

- [x] 9. Frontend — Structured Error Handling in Upload Page
  - [x] 9.1 Add classifyError helper in upload page that maps status codes to messages
  - [x] 9.2 Add Retry button for network errors in upload page
  - [x] 9.3 Update NoteView chat handler to open RateLimitModal on 429 response

- [x] 10. Frontend — Implement Flashcards Page
  - [x] 10.1 Rewrite flashcards page to fetch all user notes and aggregate flashcards
  - [x] 10.2 Implement flip card UI with note title badge and total count
  - [x] 10.3 Add guest note support for flashcards page

- [x] 11. Frontend — Implement Reports Page
  - [x] 11.1 Rewrite reports page to fetch all notes and compute stats
  - [x] 11.2 Implement stat cards and notes list table UI
  - [x] 11.3 Add guest note support for reports page

- [x] 12. Frontend — Implement Audio Labs Page
  - [x] 12.1 Rewrite audio page to fetch all notes with podcast_script
  - [x] 12.2 Implement episode list with play buttons and active player using Web Speech API
  - [x] 12.3 Add guest note support and browser compatibility check for audio page
