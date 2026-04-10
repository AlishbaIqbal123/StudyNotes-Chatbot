import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetSession, useGetNotes, useGetChatHistory, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Send, Bot, Loader2, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export function SessionNotes() {
  const [, params] = useRoute("/sessions/:id/notes");
  const sessionId = params?.id ? parseInt(params.id) : 0;
  
  const [chatMessage, setChatMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "detailed">("summary");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = useGetSession(sessionId, { query: { enabled: !!sessionId } });
  const { data: notes, isLoading: notesLoading } = useGetNotes(sessionId, { query: { enabled: !!sessionId } });
  const { data: chatHistory, refetch: refetchChat } = useGetChatHistory(sessionId, { query: { enabled: !!sessionId } });
  
  const sendChatMessage = useSendChatMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, sendChatMessage.isPending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const message = chatMessage;
    setChatMessage("");
    
    await sendChatMessage.mutateAsync({
      id: sessionId,
      data: { message }
    });
    
    refetchChat();
  };

  if (sessionLoading || notesLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 p-12">
          <Skeleton className="h-10 w-1/3 mb-12" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-full mb-4" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  if (!session || !notes) {
    return <div className="p-12 text-center text-xl font-bold">Notes not found.</div>;
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full border-r overflow-hidden relative">
        {/* Header */}
        <div className="px-8 py-5 border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link href={`/sessions/${sessionId}`}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h2 className="font-bold text-xl line-clamp-1">{session.title}</h2>
          </div>

          <div className="flex bg-muted/50 p-1 rounded-full border shadow-inner">
            <button 
              onClick={() => setActiveTab("summary")}
              className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'summary' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Summary
            </button>
            <button 
              onClick={() => setActiveTab("detailed")}
              className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'detailed' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Detailed Notes
            </button>
          </div>
        </div>
        
        <ScrollArea className="flex-1 bg-muted/10 relative">
          <div className="max-w-3xl mx-auto w-full px-8 py-12 pb-24">
            <AnimatePresence mode="wait">
              {activeTab === "summary" ? (
                <motion.div 
                  key="summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-12"
                >
                  <div className="relative">
                    <Quote className="absolute -top-4 -left-6 h-12 w-12 text-primary/10 -z-10" />
                    <h3 className="text-3xl font-black mb-6 tracking-tight">Executive Summary</h3>
                    <p className="text-xl leading-relaxed text-foreground/90 font-medium">
                      {notes.summary}
                    </p>
                  </div>
                  
                  <div className="space-y-6 pt-6">
                    <h3 className="text-2xl font-bold flex items-center">
                      <Sparkles className="mr-3 h-6 w-6 text-primary" /> Key Takeaways
                    </h3>
                    <ul className="space-y-4">
                      {notes.keyPoints.map((point, i) => (
                        <li key={i} className="flex gap-4 items-start bg-card p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                          <div className="mt-0.5 bg-gradient-to-br from-primary to-purple-500 text-white rounded-full h-6 w-6 flex items-center justify-center shrink-0 text-sm font-bold shadow-md">
                            {i + 1}
                          </div>
                          <span className="text-lg leading-relaxed font-medium">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="detailed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary max-w-none">
                    {notes.detailedContent.split('\n').map((paragraph, i) => {
                      if (!paragraph.trim()) return <br key={i} />;
                      if (paragraph.startsWith('#')) return <h3 key={i} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace(/^#+\s/, '')}</h3>;
                      
                      return (
                        <p key={i} className="mb-6 text-lg text-foreground/80 leading-relaxed">
                          {/* Hacky bold detection for UI richness */}
                          {paragraph.split(/(\*\*.*?\*\*)/).map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <span key={j} className="bg-primary/10 text-primary px-1.5 rounded font-bold">{part.slice(2, -2)}</span>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                  
                  {notes.studyTips && notes.studyTips.length > 0 && (
                    <div className="mt-16 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-[2rem] p-8 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
                      <h3 className="text-amber-600 dark:text-amber-500 font-bold text-2xl mb-6 flex items-center relative z-10">
                        <Sparkles className="mr-3 h-6 w-6" />
                        AI Study Tips
                      </h3>
                      <ul className="space-y-3 relative z-10">
                        {notes.studyTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-3 text-lg font-medium text-amber-900/80 dark:text-amber-100/80">
                            <span className="text-amber-500 mt-1">•</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Chat Sidebar */}
      <div className="w-full md:w-[450px] flex flex-col h-[50vh] md:h-full bg-card shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-20">
        <div className="px-6 py-5 border-b bg-card flex items-center gap-3 shadow-sm">
          <div className="bg-gradient-to-tr from-primary to-purple-500 p-2 rounded-xl shadow-md text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Tutor AI</h3>
            <p className="text-xs font-semibold text-emerald-500">Online</p>
          </div>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/10"
          ref={scrollRef}
        >
          {/* Welcome Message */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card border shadow-sm text-foreground px-5 py-4 rounded-2xl rounded-tl-sm text-base font-medium">
              Hi! I'm ready to help you study this material. What questions do you have?
            </div>
          </div>
          
          {chatHistory?.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              
              <div 
                className={`px-5 py-4 rounded-2xl text-base font-medium max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' 
                    : 'bg-card border shadow-sm text-foreground rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {sendChatMessage.isPending && (
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
                 <Bot className="w-4 h-4" />
               </div>
               <div className="bg-card border shadow-sm px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                 <div className="flex gap-1">
                   <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
               </div>
             </div>
          )}
        </div>
        
        <div className="p-4 bg-card border-t shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 h-14 px-6 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary/30 text-base"
              disabled={sendChatMessage.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-14 w-14 rounded-full shrink-0 shadow-md shadow-primary/20 hover:scale-105 transition-transform"
              disabled={!chatMessage.trim() || sendChatMessage.isPending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
