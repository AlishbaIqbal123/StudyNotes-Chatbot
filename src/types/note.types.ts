// src/types/note.types.ts

export interface QuizItem {
  question: string;
  options: string[];
  answer: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface NoteData {
  title: string;
  simplified_notes: string;
  exam_cram_notes?: string;
  presentation_notes?: string;
  simplified_content?: string; // Legacy field support
  source_text?: string;
  quizzes: QuizItem[];
  flashcards: FlashcardItem[];
  roadmap: string;
  mind_map: string;
  podcast_script: string;
  visual_prompt: string;
  visual_style_prompt: string;
  source_type?: string;
  raw_text?: string;
  timestamp?: unknown;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
