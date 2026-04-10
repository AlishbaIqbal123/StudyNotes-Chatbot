import { useAuth } from "@/lib/auth";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, Calendar, Settings as SettingsIcon, BookOpen, Flame, Award, Target } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { motion } from "framer-motion";

export function Profile() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { enabled: !!user }
  });

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8 md:py-12 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
        <Link href="/settings">
          <Button variant="outline" className="rounded-full">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="text-center overflow-hidden border-none shadow-xl bg-card relative">
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
              <CardContent className="pt-16 pb-8 flex flex-col items-center relative z-10">
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-purple-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl relative z-10">
                    <AvatarFallback className="bg-muted text-primary text-4xl font-bold">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground mt-1 font-medium">{user.email}</p>
                <div className="mt-6 py-2 px-4 bg-muted/50 rounded-full flex items-center text-sm font-semibold">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  Joined {format(new Date(user.createdAt), 'MMM yyyy')}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Flame className="mr-2 h-5 w-5 text-orange-500" /> Study Streak
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Current Streak", value: "3 Days", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
                { label: "Longest Streak", value: "14 Days", icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                { label: "Sessions Goal", value: "5 / Wk", icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Completion", value: "92%", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Card key={i} className="bg-card border-none shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`p-3 rounded-full ${stat.bg} ${stat.color} mb-3`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="text-xl font-bold mb-4">Lifetime Activity</h3>
            <Card className="border-none shadow-lg">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="space-y-0 divide-y divide-border/50">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-6">
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-4 rounded-2xl text-primary">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Total Sessions</p>
                          <p className="text-sm text-muted-foreground font-medium">Documents uploaded & analyzed</p>
                        </div>
                      </div>
                      <span className="text-3xl font-black gradient-text">{summary?.totalSessions || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-500">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Flashcards</p>
                          <p className="text-sm text-muted-foreground font-medium">Individual cards generated</p>
                        </div>
                      </div>
                      <span className="text-3xl font-black">{summary?.totalFlashcards || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500/10 p-4 rounded-2xl text-blue-500">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Quizzes</p>
                          <p className="text-sm text-muted-foreground font-medium">Practice tests taken</p>
                        </div>
                      </div>
                      <span className="text-3xl font-black">{summary?.totalQuizzes || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Needed icons
function CheckCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
  )
}
