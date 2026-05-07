// src/components/notes/QuizSection.tsx
'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { QuizItem } from '@/types/note.types';

interface QuizSectionProps {
  quizzes: QuizItem[];
  onGenerateMore?: () => void;
  isLoading?: boolean;
}

const QuizSection: React.FC<QuizSectionProps> = ({ quizzes }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleSelect = (idx: number, option: string) => {
    if (answers[idx]) return; // lock after first selection
    setAnswers(prev => ({ ...prev, [idx]: option }));
  };

  /**
   * Resolve the correct answer text from a quiz item.
   * The backend stores `answer` as a letter ("A", "B", "C", "D") that is an
   * index into the options array.  Fall back to treating it as full text if
   * the letter doesn't map to a valid option.
   */
  const resolveCorrectAnswer = (q: QuizItem): string => {
    const letter = q.answer?.trim().toUpperCase();
    const letterIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(letter);
    if (letterIndex !== -1 && q.options[letterIndex] !== undefined) {
      return q.options[letterIndex];
    }
    return q.answer; // already full text
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
        const correctAnswerText = resolveCorrectAnswer(q);
        const isCorrect = selected === correctAnswerText;

        return (
          <div
            key={i}
            className={`p-10 rounded-[2.5rem] bg-card border transition-all duration-500 ${selected
                ? isCorrect
                  ? 'border-green-500/30 bg-green-500/[0.02]'
                  : 'border-red-500/30 bg-red-500/[0.02]'
                : 'border-border hover:shadow-xl hover:border-primary/20'
              }`}
          >
            {/* Question header */}
            <div className="flex items-start gap-6 mb-8">
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 text-sm transition-colors ${selected
                    ? isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-primary/10 text-primary'
                  }`}
              >
                {selected
                  ? isCorrect
                    ? <CheckCircle2 className="w-5 h-5" />
                    : <XCircle className="w-5 h-5" />
                  : (i + 1)}
              </span>
              <h3 className="text-xl font-black leading-tight text-foreground">
                {q.question}
              </h3>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt, optIdx) => {
                const isOptionSelected = selected === opt;
                const isActualAnswer = opt === correctAnswerText;

                let btnStyle = 'border-border hover:border-primary hover:bg-primary/5';
                if (selected) {
                  if (isActualAnswer)
                    btnStyle = 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400';
                  else if (isOptionSelected && !isActualAnswer)
                    btnStyle = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400';
                  else
                    btnStyle = 'opacity-40 border-border cursor-default';
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelect(i, opt)}
                    disabled={!!selected}
                    className={`p-6 rounded-2xl border text-left transition-all font-bold text-sm text-foreground active:scale-[0.98] ${btnStyle}`}
                  >
                    <div className="flex gap-4 items-start">
                      <span
                        className={`font-black shrink-0 ${selected && isActualAnswer
                            ? 'text-green-600 dark:text-green-400'
                            : 'opacity-30'
                          }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {/* "Correct Answer" badge on the right option */}
                    {selected && isActualAnswer && (
                      <div className="mt-2 flex items-center gap-1 text-xs font-black text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Correct Answer
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Banner shown when user picked the wrong answer */}
            {selected && !isCorrect && (
              <div className="mt-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-green-700 dark:text-green-400">
                    Correct Answer
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                    {correctAnswerText}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuizSection;
