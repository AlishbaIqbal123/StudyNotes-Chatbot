import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SessionQuiz() {
  const [, params] = useRoute("/sessions/:id/quiz");
  const sessionId = params?.id ? parseInt(params.id) : 0;
  
  const { data: quiz, isLoading } = useGetQuiz(sessionId, { query: { enabled: !!sessionId } });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (isLoading) return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!quiz || !quiz.questions || quiz.questions.length === 0) return <div className="p-12 text-center text-xl font-bold">Quiz not available.</div>;

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const progress = isFinished ? 100 : ((currentIndex) / questions.length) * 100;

  const handleOptionSelect = (index: number) => {
    if (isRevealed) return;
    setSelectedOption(index);
    setIsRevealed(true);
    
    if (index === currentQuestion.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsRevealed(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsRevealed(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-background relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 inset-x-0 h-1 bg-muted">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-purple-500 shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12 flex-1 flex flex-col relative z-10">
        <div className="flex items-center justify-between mb-10">
          <Link href={`/sessions/${sessionId}`}>
            <Button variant="ghost" className="rounded-full hover:bg-muted font-medium">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Exit Quiz
            </Button>
          </Link>
          <div className="bg-card border shadow-sm px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase">
            {isFinished ? "Results" : `Question ${currentIndex + 1} of ${questions.length}`}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {isFinished ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full text-center space-y-8"
              >
                {/* Confetti simulation using Framer Motion */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center">
                   {[...Array(20)].map((_, i) => (
                     <motion.div
                       key={i}
                       initial={{ y: "100vh", x: 0, opacity: 1, rotate: 0 }}
                       animate={{ 
                         y: "-20vh", 
                         x: (Math.random() - 0.5) * 500,
                         opacity: 0,
                         rotate: 360 
                       }}
                       transition={{ 
                         duration: 2 + Math.random() * 2, 
                         ease: "easeOut",
                         delay: Math.random() * 0.5 
                       }}
                       className={`absolute bottom-0 w-3 h-3 rounded-full ${['bg-primary', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500'][i % 4]}`}
                     />
                   ))}
                </div>

                <div className="relative">
                  <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-xl shadow-primary/30 relative z-10">
                    <Trophy className="h-14 w-14 text-white" />
                  </div>
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -right-4 -top-4 w-16 h-16 bg-card border-4 border-background rounded-full flex items-center justify-center shadow-lg z-20"
                  >
                    <span className="text-xl font-black text-primary">{Math.round((score / questions.length) * 100)}%</span>
                  </motion.div>
                </div>
                
                <div>
                  <h2 className="text-4xl font-black mb-2">Quiz Complete!</h2>
                  <p className="text-xl text-muted-foreground font-medium">
                    You got {score} out of {questions.length} correct.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                  <Button size="lg" className="rounded-full h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/20 w-full sm:w-auto" onClick={handleRestart}>
                    <RotateCcw className="mr-2 h-5 w-5" /> Try Again
                  </Button>
                  <Link href={`/sessions/${sessionId}`}>
                    <Button variant="secondary" size="lg" className="rounded-full h-14 px-8 text-lg font-semibold w-full sm:w-auto">
                      Back to Session
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={`q-${currentIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                className="w-full"
              >
                <Card className="border-none shadow-2xl bg-card relative rounded-[2rem]">
                  <CardContent className="p-8 md:p-12">
                    <h3 className="text-2xl md:text-3xl font-bold leading-relaxed mb-10 text-foreground">
                      {currentQuestion.question}
                    </h3>
                    
                    <div className="space-y-4">
                      {currentQuestion.options.map((option, i) => {
                        const isSelected = selectedOption === i;
                        const isCorrect = i === currentQuestion.correctIndex;
                        
                        let buttonState = "border-border/60 bg-background hover:border-primary/50 hover:shadow-md";
                        let icon = null;
                        let textClass = "text-foreground font-medium";
                        
                        if (isRevealed) {
                          if (isCorrect) {
                            buttonState = "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                            textClass = "text-emerald-700 dark:text-emerald-400 font-bold";
                            icon = <CheckCircle2 className="h-6 w-6 text-emerald-500" />;
                          } else if (isSelected && !isCorrect) {
                            buttonState = "border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-[shake_0.5s_ease-in-out]";
                            textClass = "text-red-700 dark:text-red-400 font-bold";
                            icon = <XCircle className="h-6 w-6 text-red-500" />;
                          } else {
                            buttonState = "border-border/30 bg-background opacity-40";
                          }
                        } else if (isSelected) {
                          buttonState = "border-primary bg-primary/5 shadow-md shadow-primary/10";
                          textClass = "text-primary font-bold";
                        }

                        return (
                          <motion.button
                            key={i}
                            whileHover={!isRevealed ? { scale: 1.01 } : {}}
                            whileTap={!isRevealed ? { scale: 0.99 } : {}}
                            onClick={() => handleOptionSelect(i)}
                            disabled={isRevealed}
                            className={`w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 ${buttonState}`}
                          >
                            <span className={`text-lg md:text-xl leading-relaxed ${textClass}`}>
                              {option}
                            </span>
                            {icon && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>{icon}</motion.div>}
                          </motion.button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-lg text-foreground/90 leading-relaxed relative">
                            <Sparkles className="absolute top-4 right-4 h-6 w-6 text-primary/20" />
                            <span className="font-bold text-primary block mb-2">Explanation</span> 
                            {currentQuestion.explanation}
                          </div>
                          <div className="flex justify-end mt-8">
                            <Button 
                              size="lg" 
                              className="rounded-full h-14 px-10 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                              onClick={handleNext}
                            >
                              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}} />
    </div>
  );
}
