# AI Study Assistant

## Overview

A full-featured AI-powered study assistant web app where students can upload content and get AI-generated notes, quizzes, flashcards, and chat with a context-aware AI tutor.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion (artifacts/study-assistant)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Build**: esbuild (CJS bundle)

## Features

- Full authentication (signup/login/logout with JWT)
- Dashboard with stats and recent sessions
- Upload screen: text, YouTube URL, or file input
- AI-generated notes (summary + detailed with key points)
- Interactive quiz with score tracking
- 3D flip animation flashcards
- AI chatbot sidebar (context-aware to the notes)
- Library (saved sessions grid)
- Profile + Settings (dark/light mode)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## DB Schema

Tables: `users`, `study_sessions`, `notes`, `quiz_questions`, `flashcards`, `chat_messages`

## API Routes

All routes under `/api`:
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST /sessions`, `GET/DELETE /sessions/:id`, `POST /sessions/:id/generate`
- `GET /sessions/:id/notes`, `GET /sessions/:id/quiz`, `GET /sessions/:id/flashcards`
- `POST /sessions/:id/chat`, `GET /sessions/:id/chat/history`
- `GET /dashboard/summary`, `GET /dashboard/recent`
