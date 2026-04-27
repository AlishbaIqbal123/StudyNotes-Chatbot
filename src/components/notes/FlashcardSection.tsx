// src/components/notes/FlashcardSection.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { FlashcardItem } from '@/types/note.types';

interface FlashcardSectionProps {
  flashcards: FlashcardItem[];
  onGenerateMore?: () => void;
  isLoading?: boolean;
}

const FlashcardSection: React.FC<FlashcardSectionProps> = ({ flashcards, onGenerateMore, isLoading }) => {
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="p-20 text-center opacity-50 italic">
        No flashcards available for this note.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {flashcards.map((c, i) => (
        <div 
          key={i} 
          onClick={() => setFlippedIndex(flippedIndex === i ? null : i)}
          className="group"
          style={{ perspective: '1200px', height: '18rem' }}
        >
          <motion.div
            initial={false}
            animate={{ rotateY: flippedIndex === i ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              transformStyle: 'preserve-3d' 
            }}
          >
            {/* FRONT */}
            <div 
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute inset-0 bg-card border-2 border-border p-10 rounded-[2.5rem] flex flex-col justify-center text-center shadow-lg group-hover:border-primary transition-colors"
            >
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-border rounded-full" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 opacity-40">The Concept</h4>
              <p className="font-bold text-lg leading-relaxed text-foreground">
                {c.front}
              </p>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-muted-foreground opacity-30 uppercase tracking-widest">Click to reveal</span>
            </div>

            {/* BACK */}
            <div 
              style={{ 
                backfaceVisibility: 'hidden', 
                transform: 'rotateY(180deg)' 
              }}
              className="absolute inset-0 bg-primary p-10 rounded-[2.5rem] flex flex-col justify-center text-center shadow-2xl text-white"
            >
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4">The Definition</h4>
              <p className="font-bold text-lg leading-relaxed">
                {c.back}
              </p>
            </div>
          </motion.div>
        </div>
      ))}

      {/* GENERATE MORE BUTTON */}
      <div 
        style={{ height: '18rem' }}
        className="group cursor-pointer"
        onClick={onGenerateMore}
      >
        <div className="h-full w-full rounded-[2.5rem] border-2 border-dashed border-border group-hover:border-primary/50 bg-gradient-to-br from-card to-muted flex flex-col items-center justify-center p-8 transition-all duration-500 relative overflow-hidden group-hover:shadow-2xl">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            {isLoading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <Sparkles className="w-8 h-8 text-primary" />
            )}
          </div>

          <div className="text-center mb-6">
            <h4 className="text-lg font-black text-foreground mb-1">Master More Concepts</h4>
            <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">10 New Flashcards</p>
          </div>

          <div className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-full text-xs font-black shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
            <Plus className="w-3 h-3" />
            EXPAND DECK
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardSection;
