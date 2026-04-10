import { useState } from "react";
import { Link } from "wouter";
import { useListSessions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, Layers, Youtube, FileText, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type FilterType = "all" | "text" | "youtube" | "file";

export function Library() {
  const { data: sessions, isLoading } = useListSessions();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const filteredSessions = sessions?.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (session.subject && session.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = activeFilter === "all" || session.inputType === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const getIconForType = (type: string) => {
    switch(type) {
      case 'youtube': return <Youtube className="h-5 w-5 text-red-500" />;
      case 'file': return <FileText className="h-5 w-5 text-blue-500" />;
      default: return <BookOpen className="h-5 w-5 text-primary" />;
    }
  };

  const getCardBorder = (type: string) => {
    switch(type) {
      case 'youtube': return "border-t-red-500";
      case 'file': return "border-t-blue-500";
      default: return "border-t-primary";
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Your Library</h1>
          <p className="text-lg text-muted-foreground mt-2">All your generated study materials in one place.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-3xl border shadow-sm">
        <div className="relative w-full md:w-96 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by title or subject..." 
            className="pl-11 h-12 rounded-full bg-muted/30 border-transparent focus:bg-background focus:border-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: "all", label: "All" },
            { id: "text", label: "Text" },
            { id: "youtube", label: "YouTube" },
            { id: "file", label: "Files" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeFilter === filter.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />
          ))}
        </div>
      ) : filteredSessions?.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-32 bg-muted/10 rounded-[3rem] border border-dashed"
        >
          <Layers className="mx-auto h-16 w-16 text-muted-foreground/30 mb-6" />
          <h3 className="text-2xl font-bold text-foreground mb-2">No sessions found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Try adjusting your search filters or create a new study session to get started.</p>
          <Link href="/upload">
            <Button className="mt-8 rounded-full px-8">Create Session</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
          <AnimatePresence>
            {filteredSessions?.map((session, i) => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
              >
                <Link href={`/sessions/${session.id}`}>
                  <Card className={`h-full overflow-hidden border-t-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col bg-card/50 backdrop-blur-sm group ${getCardBorder(session.inputType)}`}>
                    <CardHeader className="pb-3 pt-6 px-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-muted/50 rounded-xl group-hover:bg-background group-hover:shadow-sm transition-all">
                          {getIconForType(session.inputType)}
                        </div>
                        {session.status === 'ready' ? (
                          <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider"><CheckCircle className="mr-1.5 h-3 w-3" /> Ready</span>
                        ) : (
                          <span className="flex items-center text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse"><Clock className="mr-1.5 h-3 w-3" /> Processing</span>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">{session.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 px-6 pb-6 mt-auto flex flex-col gap-4">
                      <div className="flex items-center justify-between mt-auto">
                        <CardDescription className="text-xs font-semibold uppercase tracking-wider">
                          {format(new Date(session.createdAt), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                      {session.subject && (
                        <div className="mt-2">
                          <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-md font-semibold tracking-wide">
                            {session.subject}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
