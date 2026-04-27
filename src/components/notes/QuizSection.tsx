// src/components/notes/QuizSection.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Plus, Sparkles, Loader2 } from 'lucide-react';
import { QuizItem } from '@/types/note.types';

interface QuizSectionProps {
  quizzes: QuizItem[];
  onGenerateMore?: () => void;
  isLoading?: boolean;
}

const QuizSection: React.FC<QuizSectionProps> = ({ quizzes, onGenerateMore, isLoading }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleSelect = (idx: number, option: string) => {
    if (answers[idx]) return; // Prevent multiple selections
    setAnswers(prev => ({ ...prev, [idx]: option }));
  };

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="p-20 text-center opacity-50 italic">
        No quiz available for this note.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {quizzes.map((q, i) => {
        const selected = answers[i];
        const isCorrect = selected === q.answer;

        return (
          <div 
            key={i} 
            className={`p-10 rounded-[2.5rem] bg-card border transition-all duration-500 ${
              selected 
                ? isCorrect 
                  ? 'border-green-500/30 bg-green-500/[0.02]' 
                  : 'border-red-500/30 bg-red-500/[0.02]' 
                : 'border-border hover:shadow-xl hover:border-primary/20'
            }`}
          >
            <div className="flex items-start gap-6 mb-8">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 text-sm transition-colors ${
                selected 
                  ? isCorrect 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white' 
                  : 'bg-primary/10 text-primary'
              }`}>
                {selected ? (isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />) : (i + 1)}
              </span>
              <h3 className="text-xl font-black leading-tight text-foreground">
                {q.question}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt, optIdx) => {
                const isOptionSelected = selected === opt;
                const isActualAnswer = opt === q.answer;

                let btnStyle = "border-border hover:border-primary hover:bg-primary/5";
                if (selected) {
                  if (isActualAnswer) btnStyle = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                  else if (isOptionSelected) btnStyle = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                  else btnStyle = "opacity-40 border-border cursor-default";
                }

                return (
                  <button 
                    key={optIdx} 
                    onClick={() => handleSelect(i, opt)}
                    disabled={!!selected}
                    className={`p-6 rounded-2xl border text-left transition-all font-bold text-sm text-foreground active:scale-[0.98] ${btnStyle}`}
                  >
                    <div className="flex gap-4">
                      <span className="opacity-30 font-black">{String.fromCharCode(65 + optIdx)}</span>
                      {opt}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuizSection;
