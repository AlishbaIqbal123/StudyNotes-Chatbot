import { useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Brain, Zap, Clock, CheckCircle, AlertCircle, FileText, Youtube } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";

export function SessionOverview() {
  const [, params] = useRoute("/sessions/:id");
  const sessionId = params?.id ? parseInt(params.id) : 0;

  const { data: session, isLoading } = useGetSession(sessionId, {
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
      <div className="max-w-6xl mx-auto w-full px-4 py-12 space-y-10">
        <Skeleton className="h-10 w-32 rounded-full" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-6 w-1/4 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold">Session not found</h2>
          <Link href="/dashboard">
            <Button size="lg" className="rounded-full">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isReady = session.status === 'ready';
  const isProcessing = session.status === 'processing' || session.status === 'pending';
  const isError = session.status === 'error';

  const getIconForType = (type: string) => {
    switch(type) {
      case 'youtube': return <Youtube className="h-5 w-5 mr-2 text-red-500" />;
      case 'file': return <FileText className="h-5 w-5 mr-2 text-blue-500" />;
      default: return <BookOpen className="h-5 w-5 mr-2 text-primary" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-12 space-y-12 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="rounded-full hover:bg-muted font-medium pl-2">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {isReady && <span className="inline-flex items-center text-sm font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm"><CheckCircle className="mr-2 h-4 w-4" /> Ready</span>}
            {isProcessing && <span className="inline-flex items-center text-sm font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm"><Clock className="mr-2 h-4 w-4 animate-pulse" /> Processing</span>}
            {isError && <span className="inline-flex items-center text-sm font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm"><AlertCircle className="mr-2 h-4 w-4" /> Failed</span>}
            
            <div className="flex items-center px-3 py-1.5 bg-muted/50 rounded-full text-sm font-semibold border border-border/50 shadow-sm">
              {getIconForType(session.inputType)}
              <span className="capitalize">{session.inputType}</span>
            </div>

            {session.subject && (
               <span className="text-sm bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                 {session.subject}
               </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
            {session.title}
          </h1>
          <p className="text-lg text-muted-foreground font-medium flex items-center">
            Created {format(new Date(session.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>
      </motion.div>

      {isProcessing && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-none shadow-2xl bg-card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
            <CardContent className="pt-6 flex flex-col items-center justify-center p-16 text-center relative z-10">
              <div className="w-24 h-24 relative flex items-center justify-center mb-8">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 rounded-3xl animate-spin opacity-30 blur-lg" />
                <div className="bg-background w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center relative z-10 border border-primary/20">
                  <Brain className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-foreground">Forging Knowledge</h3>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto font-medium leading-relaxed">
                Our AI is extracting key concepts, building flashcards, and generating quizzes. Hang tight, this is the heavy lifting.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isReady && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Link href={`/sessions/${session.id}/notes`}>
              <Card className="h-full border-none shadow-xl bg-gradient-to-b from-blue-500/10 to-card hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 cursor-pointer group rounded-[2rem]">
                <CardHeader className="p-8 pb-4">
                  <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner border border-blue-500/20">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Smart Notes</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <CardDescription className="text-base text-foreground/70 leading-relaxed font-medium">
                    Review beautifully formatted summaries, key concepts, and detailed study notes extracted from your material.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link href={`/sessions/${session.id}/flashcards`}>
              <Card className="h-full border-none shadow-xl bg-gradient-to-b from-amber-500/10 to-card hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 cursor-pointer group rounded-[2rem]">
                <CardHeader className="p-8 pb-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner border border-amber-500/20">
                    <Zap className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Flashcards</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <CardDescription className="text-base text-foreground/70 leading-relaxed font-medium">
                    Memorize definitions and facts rapidly with our interactive 3D flip cards and spaced-repetition UI.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Link href={`/sessions/${session.id}/quiz`}>
              <Card className="h-full border-none shadow-xl bg-gradient-to-b from-primary/10 to-card hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 cursor-pointer group rounded-[2rem]">
                <CardHeader className="p-8 pb-4">
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner border border-primary/20">
                    <Brain className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Practice Quiz</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <CardDescription className="text-base text-foreground/70 leading-relaxed font-medium">
                    Test your knowledge, identify gaps, and solidify understanding with an auto-generated assessment.
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}
