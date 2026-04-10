import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetFlashcards } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SessionFlashcards() {
  const [, params] = useRoute("/sessions/:id/flashcards");
  const sessionId = params?.id ? parseInt(params.id) : 0;
  
  const { data: flashcardsData, isLoading } = useGetFlashcards(sessionId, { query: { enabled: !!sessionId } });
  
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev

  // Initialize cards
  useEffect(() => {
    if (flashcardsData && cards.length === 0) {
      setCards([...flashcardsData]);
    }
  }, [flashcardsData, cards.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(f => !f);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < cards.length - 1) handleNext();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  if (isLoading) return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!cards || cards.length === 0) return <div className="p-12 text-center text-xl font-bold">Flashcards not available.</div>;

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleNext = () => {
    if (currentIndex === cards.length - 1) return;
    setDirection(1);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(p => p + 1), 150);
  };

  const handlePrev = () => {
    if (currentIndex === 0) return;
    setDirection(-1);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(p => p - 1), 150);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
      setDirection(0);
    }, 150);
  };

  // Variants for sliding animation
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, type: "spring", bounce: 0.2 }
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3 }
    })
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col flex-1 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href={`/sessions/${sessionId}`}>
            <Button variant="ghost" className="rounded-full font-semibold hover:bg-muted">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="rounded-full shadow-sm bg-card hover:bg-muted" 
            onClick={handleShuffle}
          >
            <Shuffle className="mr-2 h-4 w-4" /> Shuffle Deck
          </Button>
        </div>

        {/* Card Area */}
        <div className="flex-1 flex flex-col items-center justify-center perspective-[1500px]">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full max-w-3xl aspect-[4/3] md:aspect-[16/9] relative cursor-pointer group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-700 ease-in-out"
                initial={false}
                animate={{ rotateX: isFlipped ? 180 : 0 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div 
                  className="absolute inset-0 w-full h-full backface-hidden bg-card border border-border/50 shadow-2xl rounded-[2.5rem] p-10 md:p-16 flex flex-col items-center justify-center text-center overflow-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                  <span className="absolute top-8 left-8 text-sm font-bold text-primary uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full">Question</span>
                  <h3 className="text-3xl md:text-5xl font-black leading-tight text-foreground relative z-10">
                    {currentCard.front}
                  </h3>
                  <div className="absolute bottom-8 flex items-center gap-2 text-muted-foreground text-sm font-medium opacity-50 group-hover:opacity-100 transition-opacity">
                    <RotateCcw className="w-4 h-4" /> Click to flip
                  </div>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-primary to-purple-600 shadow-2xl rounded-[2.5rem] p-10 md:p-16 flex flex-col items-center justify-center text-center text-white"
                  style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
                >
                  <div className="absolute inset-0 bg-mesh opacity-20 mix-blend-overlay" />
                  <span className="absolute top-8 left-8 text-sm font-bold text-white uppercase tracking-widest bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">Answer</span>
                  <p className="text-2xl md:text-4xl font-bold leading-relaxed text-white/95 relative z-10 text-balance">
                    {currentCard.back}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Controls */}
        <div className="mt-12 space-y-8">
          <div className="flex items-center justify-between gap-4 max-w-sm mx-auto">
            <span className="text-sm font-bold text-muted-foreground w-8 text-right">{currentIndex + 1}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-muted-foreground w-8">{cards.length}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full w-16 h-16 p-0 shadow-md border-2 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button 
              variant="default" 
              size="lg" 
              className="rounded-full w-16 h-16 p-0 shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              disabled={currentIndex === cards.length - 1}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
          
          <p className="text-center text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-50 hidden md:block">
            Press Space to flip • Arrow keys to navigate
          </p>
        </div>
      </div>
    </div>
  );
}
