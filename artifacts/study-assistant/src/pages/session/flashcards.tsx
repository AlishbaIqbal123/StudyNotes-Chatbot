import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetFlashcards } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export function SessionFlashcards() {
  const [, params] = useRoute("/sessions/:id/flashcards");
  const sessionId = params?.id ? parseInt(params.id) : 0;
  
  const { data: flashcardsData, isLoading } = useGetFlashcards(sessionId, { query: { enabled: !!sessionId } });
  
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Initialize cards when data arrives
  if (flashcardsData && cards.length === 0) {
    setCards([...flashcardsData]);
  }

  if (isLoading) return <div className="p-8 text-center">Loading flashcards...</div>;
  if (!cards || cards.length === 0) return <div className="p-8 text-center">Flashcards not available.</div>;

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, 150);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setTimeout(() => {
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
    }, 150);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/sessions/${sessionId}`}>
          <Button variant="ghost" size="icon" className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-muted-foreground">Flashcards</span>
            <span>{currentIndex + 1} / {cards.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Button variant="outline" size="icon" className="rounded-full shrink-0" onClick={handleShuffle} title="Shuffle">
          <Shuffle className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center perspective-[1000px]">
        {/* Card Container for 3D flip effect */}
        <div 
          className="w-full max-w-2xl aspect-[4/3] md:aspect-[3/2] relative cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d transition-all duration-500 ease-out"
            initial={false}
            animate={{ rotateX: isFlipped ? 180 : 0 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front of card */}
            <div 
              className="absolute inset-0 w-full h-full backface-hidden bg-card border-2 shadow-xl rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="absolute top-6 left-6 text-sm font-semibold text-primary/50 uppercase tracking-wider">Front</span>
              <h3 className="text-2xl md:text-4xl font-bold leading-tight text-foreground">
                {currentCard.front}
              </h3>
              <p className="absolute bottom-6 text-sm text-muted-foreground animate-pulse">Click to flip</p>
            </div>

            {/* Back of card */}
            <div 
              className="absolute inset-0 w-full h-full backface-hidden bg-primary/5 border-2 border-primary/20 shadow-xl rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
            >
              <span className="absolute top-6 left-6 text-sm font-semibold text-primary/50 uppercase tracking-wider">Back</span>
              <p className="text-xl md:text-3xl font-medium leading-relaxed text-foreground/90">
                {currentCard.back}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full w-14 h-14 p-0 shadow-sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button 
            variant="default" 
            size="lg" 
            className="rounded-full w-14 h-14 p-0 shadow-md shadow-primary/20"
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
