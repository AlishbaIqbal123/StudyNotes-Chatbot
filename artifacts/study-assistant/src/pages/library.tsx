import { useState } from "react";
import { Link } from "wouter";
import { useListSessions } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Layers, Youtube, FileText, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function Library() {
  const { data: sessions, isLoading } = useListSessions();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSessions = sessions?.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (session.subject && session.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-muted-foreground mt-1">All your generated study materials in one place.</p>
        </div>
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search sessions..." 
            className="pl-9 rounded-full bg-muted/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredSessions?.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-medium text-foreground">No sessions found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or create a new session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredSessions?.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.5) }}
            >
              <Link href={`/sessions/${session.id}`}>
                <Card className="h-full overflow-hidden border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col group bg-card">
                  <CardHeader className="pb-3 pt-5 px-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 bg-muted/50 rounded-xl group-hover:bg-primary/10 transition-colors">
                        {getIconForType(session.inputType)}
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2">{session.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 px-5 pb-5 mt-auto flex flex-col gap-3">
                    <CardDescription className="text-xs">
                      {format(new Date(session.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2">
                      {session.subject && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md font-medium">
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
  );
}
