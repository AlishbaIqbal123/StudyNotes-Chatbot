# LuminaStudy 🌟 - The Pinterest of Learning

LuminaStudy is a high-fidelity, AI-powered study platform designed to transform disorganized academic content into beautiful, interactive learning assets. Built with a focus on aesthetics and student productivity.

## 🚀 Features

### 📂 Knowledge Extraction
- **Smart Uploads:** Support for PDF, DOCX, and Text notes.
- **Video Insights:** Automated transcript extraction and summarization from YouTube links.
- **Simple Wording:** AI translates complex academic jargon into student-friendly, relatable language.

### 🧠 Interactive Study Assets
- **Active Recall Quizzes:** AI-generated MCQs with real-time scoring and feedback.
- **Flip Flashcards:** Aesthetic cards with smooth animations for interval repetition.
- **Study Spotlight (Podcast):** Conversational AI scripts turned into audio summaries using browser-native synthesis.
- **Visual Aids:** Dynamic image generation for complex concepts using Stable Diffusion (via Pollinations.ai).

### 💬 Intelligent Assistant
- **Context-Aware Chat:** A specialized chatbot that answers questions based *strictly* on your uploaded materials.
- **RAG Architecture:** Leverages Retrieval Augmented Generation for precise citations and accuracy.

### 🎨 Design & Experience
- **Pinterest-Style UI:** Responsive masonry grid for a clean, visual-first organization.
- **Soft Aesthetic:** Custom pastel color palette, soft shadows, and smooth motion design (Framer Motion).
- **Identity:** Full authentication system with Firebase integration supporting Email/Password and Social login.

---

## 🏗️ Technical Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Custom Design System
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State:** React Context + Hooks

### Backend
- **Core:** FastAPI (Python) / Node.js
- **Database:** MongoDB (JSON Storage) / Firebase Firestore
- **Authentication:** Firebase Auth / JWT
- **AI Processing:** OpenRouter (Gemini Flash / Mixtral)

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase Project (for Auth/Firestore)
- OpenRouter API Key (for LLM)

### Installation

1. **Clone the Repo & Setup Client:**
   ```bash
   cd client
   npm install
   ```

2. **Configure Environment:**
   Create `.env.local` in the `client` folder:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   ...
   ```

3. **Start Development:**
   ```bash
   # Terminal 1: Frontend
   cd client
   npm run dev

   # Terminal 2: Backend
   cd server
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

---

## 📂 Project Structure
```text
LuminaStudy/
├── client/           # Next.js Frontend
│   ├── src/app/      # Production-ready screens
│   ├── src/components/# Reusable UI (Auth, Dashboard, UI)
│   └── src/lib/      # API Clients & Firebase init
├── server/           # FastAPI Backend
│   ├── app/services/ # AI, Extraction, & Auth logic
│   └── main.py       # API Entry point
├── AI_MODELS_GUIDE.md# Step-by-step AI setup
└── FIREBASE_GUIDE.md # Step-by-step Database/Auth setup
```

## 📜 License
MIT License - Created for students, by students.
