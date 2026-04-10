import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export function SessionQuiz() {
  const [, params] = useRoute("/sessions/:id/quiz");
  const sessionId = params?.id ? parseInt(params.id) : 0;
  
  const { data: quiz, isLoading } = useGetQuiz(sessionId, { query: { enabled: !!sessionId } });
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (isLoading) return <div className="p-8 text-center">Loading quiz...</div>;
  if (!quiz || !quiz.questions || quiz.questions.length === 0) return <div className="p-8 text-center">Quiz not available.</div>;

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

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
    <div className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/sessions/${sessionId}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex justify-between text-sm font-medium mb-2">
            <span className="text-muted-foreground">Quiz</span>
            <span>{isFinished ? questions.length : currentIndex + 1} of {questions.length}</span>
          </div>
          <Progress value={isFinished ? 100 : progress} className="h-2" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {isFinished ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-4xl font-bold text-primary">{Math.round((score / questions.length) * 100)}%</span>
              </div>
              <h2 className="text-3xl font-bold">Quiz Complete!</h2>
              <p className="text-lg text-muted-foreground">
                You got {score} out of {questions.length} questions right.
              </p>
              <div className="flex flex-col gap-3 pt-6">
                <Button size="lg" className="rounded-full h-14 text-lg" onClick={handleRestart}>
                  <RotateCcw className="mr-2 h-5 w-5" /> Retake Quiz
                </Button>
                <Link href={`/sessions/${sessionId}`}>
                  <Button variant="outline" size="lg" className="rounded-full h-14 text-lg w-full">
                    Back to Session
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key={`q-${currentIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Card className="border-none shadow-lg bg-card/50 backdrop-blur">
                <CardContent className="p-8 md:p-12">
                  <h3 className="text-2xl font-semibold leading-relaxed mb-8 text-foreground">
                    {currentQuestion.question}
                  </h3>
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, i) => {
                      const isSelected = selectedOption === i;
                      const isCorrect = i === currentQuestion.correctIndex;
                      
                      let optionClass = "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5";
                      let icon = null;
                      
                      if (isRevealed) {
                        if (isCorrect) {
                          optionClass = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                          icon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
                        } else if (isSelected && !isCorrect) {
                          optionClass = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                          icon = <XCircle className="h-5 w-5 text-red-500" />;
                        } else {
                          optionClass = "border-muted-foreground/20 opacity-50";
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleOptionSelect(i)}
                          disabled={isRevealed}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${optionClass}`}
                        >
                          <span className="text-lg">{option}</span>
                          {icon}
                        </button>
                      );
                    })}
                  </div>

                  {isRevealed && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-8 pt-6 border-t"
                    >
                      <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
                        <span className="font-semibold text-foreground">Explanation:</span> {currentQuestion.explanation}
                      </div>
                      <Button 
                        size="lg" 
                        className="w-full mt-6 rounded-full"
                        onClick={handleNext}
                      >
                        {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
