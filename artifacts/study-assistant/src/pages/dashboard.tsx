import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useGetDashboardSummary, useGetRecentSessions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen, Layers, Zap, ArrowRight, FileText, Youtube, Clock, CheckCircle } from "lucide-react";
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
    return <div className="p-8">Loading...</div>;
  }

  const getIconForType = (type: string) => {
    switch(type) {
      case 'youtube': return <Youtube className="h-5 w-5 text-red-500" />;
      case 'file': return <FileText className="h-5 w-5 text-blue-500" />;
      default: return <BookOpen className="h-5 w-5 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ready': 
        return <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><CheckCircle className="mr-1 h-3 w-3" /> Ready</span>;
      case 'processing': 
      case 'pending': 
        return <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full"><Clock className="mr-1 h-3 w-3" /> Processing</span>;
      default: 
        return <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hi, {user.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Ready to learn something new today?</p>
        </div>
        <Link href="/upload">
          <Button size="lg" className="rounded-full px-6 shadow-md shadow-primary/20 transition-transform hover:scale-105">
            <Plus className="mr-2 h-5 w-5" />
            New Study Session
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold text-foreground">{summary?.totalSessions || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-amber-500/5 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flashcards Mastered</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold text-foreground">{summary?.totalFlashcards || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-blue-500/5 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quizzes Taken</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold text-foreground">{summary?.totalQuizzes || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Sessions</h2>
          <Link href="/library">
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {sessionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : recentSessions?.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-3xl border border-dashed">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No sessions yet</h3>
            <p className="text-muted-foreground mt-1 mb-6">Upload a document or paste a link to get started.</p>
            <Link href="/upload">
              <Button>Create your first session</Button>
            </Link>
          </div>
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
                  <Card className="h-full overflow-hidden border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col group">
                    <CardHeader className="pb-3 bg-muted/20">
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-background rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                          {getIconForType(session.inputType)}
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                      <CardTitle className="text-lg mt-4 line-clamp-1">{session.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {format(new Date(session.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {session.subject && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
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

// Needed a Brain icon for the stats
function Brain(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  )
}
