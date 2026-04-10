import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Brain, Zap, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function SessionOverview() {
  const [, params] = useRoute("/sessions/:id");
  const sessionId = params?.id ? parseInt(params.id) : 0;

  const { data: session, isLoading, refetch } = useGetSession(sessionId, {
    query: {
      enabled: !!sessionId,
      refetchInterval: (query) => {
        const currentSession = query.state.data;
        if (currentSession && (currentSession.status === 'pending' || currentSession.status === 'processing')) {
          return 3000;
        }
        return false;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Session not found</h2>
          <Link href="/dashboard">
            <Button variant="link" className="mt-4">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isReady = session.status === 'ready';
  const isProcessing = session.status === 'processing' || session.status === 'pending';
  const isError = session.status === 'error';

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {isReady && <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Ready to Study</span>}
          {isProcessing && <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Clock className="mr-1.5 h-3.5 w-3.5 animate-pulse" /> Processing Content</span>}
          {isError && <span className="inline-flex items-center text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full"><AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Generation Failed</span>}
          {session.subject && (
             <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
               {session.subject}
             </span>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">{session.title}</h1>
      </div>

      {isProcessing && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="pt-6 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyzing your content</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Our AI is extracting key concepts, building flashcards, and generating quizzes. This usually takes 30-60 seconds.
            </p>
          </CardContent>
        </Card>
      )}

      {isReady && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Link href={`/sessions/${session.id}/notes`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <CardTitle>Smart Notes</CardTitle>
                  <CardDescription>Review extracted summaries, key concepts, and detailed study notes.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <Link href={`/sessions/${session.id}/flashcards`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="h-6 w-6" />
                  </div>
                  <CardTitle>Flashcards</CardTitle>
                  <CardDescription>Memorize definitions and facts with interactive spaced-repetition cards.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <Link href={`/sessions/${session.id}/quiz`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="h-6 w-6" />
                  </div>
                  <CardTitle>Practice Quiz</CardTitle>
                  <CardDescription>Test your knowledge with an auto-generated multiple choice quiz.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}
