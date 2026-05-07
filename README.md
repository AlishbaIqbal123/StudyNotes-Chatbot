# LuminaStudy — AI-Powered Study Platform

Transform PDFs, YouTube videos, and raw text into beautiful, structured study content: notes, quizzes, flashcards, roadmaps, and podcast scripts.

---

## Project Structure

```
/                          ← Next.js 16 frontend (Firebase Hosting)
  src/                     ← React components, pages, hooks, lib
  public/                  ← Static assets
  firebase.json            ← Firebase Hosting config
  .firebaserc              ← Firebase project config

hf_final_deploy/           ← ✅ CANONICAL BACKEND (deployed to Hugging Face Spaces)
  main.py                  ← FastAPI app entry point
  app/services/
    ai_service.py          ← OpenRouter AI generation pipeline
    extraction_service.py  ← YouTube/PDF/DOCX text extraction
  Dockerfile               ← HF Spaces deployment config
  requirements.txt

server/                    ← Local development reference only (NOT deployed)
  main.py
  app/services/
```

> **Important:** `hf_final_deploy/` is the single source of truth for the backend.
> It is deployed to Hugging Face Spaces at: `https://Alishba-1342-lumina-backend.hf.space`
> The `server/` directory is for local development only.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Hosting | Firebase Hosting (static export) |
| Auth | Firebase Auth (Email + Google OAuth) |
| Database | Firebase Firestore |
| Backend | FastAPI (Python 3.12) |
| Backend Hosting | Hugging Face Spaces (Docker) |
| AI | OpenRouter → Google Gemini 2.5 Pro |
| Images | Pollinations.ai, Wikipedia/Wikimedia |

---

## Local Development Setup

### Frontend

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.local.example .env.local

# 3. Run dev server
npm run dev
```

### Backend (local)

```bash
cd server

# Copy env template
cp .env.example .env  # or create .env manually

# Install dependencies
pip install -r requirements.txt

# Run
uvicorn main:app --reload --port 8000
```

### Backend (deploy to Hugging Face)

```bash
cd hf_final_deploy

# Set OPENROUTER_API_KEY as a secret in HF Spaces settings
# Then push to the HF Space git remote
git push
```

---

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=https://your-hf-space.hf.space
```

### Backend (`hf_final_deploy/.env`)
```
OPENROUTER_API_KEY=your_key_here
```

---

## Deploy

```bash
# Build and deploy frontend to Firebase
npm run build
firebase deploy --only hosting
```
