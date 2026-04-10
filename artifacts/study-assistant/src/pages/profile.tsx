import { useAuth } from "@/lib/auth";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, Calendar, Settings as SettingsIcon, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export function Profile() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { enabled: !!user }
  });

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card className="text-center overflow-hidden border-none shadow-md bg-gradient-to-b from-card to-muted/20">
            <CardContent className="pt-10 pb-8 flex flex-col items-center">
              <Avatar className="h-28 w-28 mb-6 border-4 border-background shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground mt-1">{user.email}</p>
              
              <Link href="/settings" className="mt-6 w-full">
                <Button variant="outline" className="w-full rounded-full">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Edit Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl text-primary">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Total Sessions</p>
                        <p className="text-sm text-muted-foreground">Documents uploaded & analyzed</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{summary?.totalSessions || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-500/10 p-3 rounded-xl text-amber-500">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Saved Sessions</p>
                        <p className="text-sm text-muted-foreground">Pinned for quick access</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{summary?.savedSessions || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Completion Rate</p>
                        <p className="text-sm text-muted-foreground">Successful generations</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">
                      {summary?.totalSessions 
                        ? Math.round((summary.sessionsByStatus.ready / summary.totalSessions) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
