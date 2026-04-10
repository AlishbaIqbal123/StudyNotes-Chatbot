import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useGetDashboardSummary, useGetRecentSessions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Layers, Zap, ArrowRight, FileText, Youtube, Brain, Sparkles, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function Dashboard() {
  const { user, isLoading: userLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!userLoading && !user) {
      setLocation("/login");
    }
  }, [user, userLoading, setLocation]);

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { enabled: !!user }
  });

  const { data: recentSessions, isLoading: sessionsLoading } = useGetRecentSessions({
    query: { enabled: !!user }
  });

  if (userLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-8 w-full">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const getIconForType = (type: string) => {
    switch(type) {
      case 'youtube': return <Youtube className="h-6 w-6 text-red-500" />;
      case 'file': return <FileText className="h-6 w-6 text-blue-500" />;
      default: return <BookOpen className="h-6 w-6 text-primary" />;
    }
  };

  const getCardGradient = (type: string) => {
    switch(type) {
      case 'youtube': return "from-red-500/10 to-transparent border-red-500/20 hover:border-red-500/50";
      case 'file': return "from-blue-500/10 to-transparent border-blue-500/20 hover:border-blue-500/50";
      default: return "from-primary/10 to-transparent border-primary/20 hover:border-primary/50";
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tight relative inline-block"
          >
            Hi, {user.name?.split(' ')[0]} 👋
            <span className="absolute bottom-0 left-0 w-full h-1.5 bg-primary/20 rounded-full" />
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground mt-2"
          >
            Ready to master something new today?
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/upload">
            <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 w-full md:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              New Session
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-none shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <span className="flex items-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" /> +12%
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Sessions</p>
                {summaryLoading ? <Skeleton className="h-10 w-20" /> : (
                  <p className="text-4xl font-bold tracking-tight text-foreground">{summary?.totalSessions || 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass border-none shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <Zap className="h-6 w-6 text-amber-500" />
                </div>
                <span className="flex items-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3 mr-1" /> +5%
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Flashcards Mastered</p>
                {summaryLoading ? <Skeleton className="h-10 w-20" /> : (
                  <p className="text-4xl font-bold tracking-tight text-foreground">{summary?.totalFlashcards || 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass border-none shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Brain className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Quizzes Taken</p>
                {summaryLoading ? <Skeleton className="h-10 w-20" /> : (
                  <p className="text-4xl font-bold tracking-tight text-foreground">{summary?.totalQuizzes || 0}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Continue Learning</h2>
          <Link href="/library">
            <Button variant="ghost" className="text-primary font-semibold hover:bg-primary/10">
              View Library <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {sessionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[280px] w-full rounded-[2rem]" />
            ))}
          </div>
        ) : recentSessions?.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-muted/20 border border-border/50 rounded-[2.5rem] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-mesh opacity-50" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-background shadow-lg rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No sessions yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">Upload a document, paste a link, or enter text to generate your first interactive study session.</p>
              <Link href="/upload">
                <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold">
                  Create First Session
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentSessions?.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Link href={`/sessions/${session.id}`}>
                  <Card className={`h-[280px] border-2 bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col bg-gradient-to-b ${getCardGradient(session.inputType)}`}>
                    <CardHeader className="pb-4 pt-6 px-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-background rounded-2xl shadow-sm">
                          {getIconForType(session.inputType)}
                        </div>
                        {session.status === 'ready' ? (
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">Ready</span>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full animate-pulse">Processing</span>
                        )}
                      </div>
                      <CardTitle className="text-xl line-clamp-2 leading-tight">{session.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 mt-auto flex flex-col gap-4">
                      {session.status === 'processing' && (
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-2/3 animate-pulse rounded-full" />
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <CardDescription className="text-xs font-medium uppercase tracking-wider">
                          {format(new Date(session.createdAt), 'MMM d, yyyy')}
                        </CardDescription>
                        {session.subject && (
                          <span className="text-xs bg-background shadow-sm border px-2.5 py-1 rounded-md font-medium text-foreground">
                            {session.subject}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
