import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetSession, useGetNotes, useGetChatHistory, useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Send, User, Bot, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SessionNotes() {
  const [, params] = useRoute("/sessions/:id/notes");
  const sessionId = params?.id ? parseInt(params.id) : 0;
  
  const [chatMessage, setChatMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: session, isLoading: sessionLoading } = useGetSession(sessionId, { query: { enabled: !!sessionId } });
  const { data: notes, isLoading: notesLoading } = useGetNotes(sessionId, { query: { enabled: !!sessionId } });
  const { data: chatHistory, isLoading: chatLoading, refetch: refetchChat } = useGetChatHistory(sessionId, { query: { enabled: !!sessionId } });
  
  const sendChatMessage = useSendChatMessage();

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

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
    return <div className="p-8">Loading notes...</div>;
  }

  if (!session || !notes) {
    return <div className="p-8">Notes not found.</div>;
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full border-r overflow-hidden bg-background">
        <div className="p-4 border-b flex items-center justify-between bg-card/50">
          <div className="flex items-center gap-3">
            <Link href={`/sessions/${sessionId}`}>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="font-semibold text-lg line-clamp-1">{session.title}</h2>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-6 md:p-10">
          <div className="max-w-3xl mx-auto w-full space-y-8 pb-10">
            <Tabs defaultValue="detailed" className="w-full">
              <div className="flex justify-between items-center mb-8">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed Notes</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="summary" className="space-y-8 mt-0 outline-none">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <h3>Executive Summary</h3>
                  <p className="text-lg leading-relaxed">{notes.summary}</p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b pb-2">Key Points</h3>
                  <ul className="space-y-3">
                    {notes.keyPoints.map((point, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <div className="mt-1 bg-primary/20 text-primary rounded-full p-1">
                          <Sparkles className="h-3 w-3" />
                        </div>
                        <span className="text-foreground leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="detailed" className="mt-0 outline-none">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {/* Basic rendering of markdown-like text or plain text */}
                  {notes.detailedContent.split('\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 text-foreground/90 leading-relaxed">{paragraph}</p>
                  ))}
                </div>
                
                {notes.studyTips && notes.studyTips.length > 0 && (
                  <div className="mt-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                    <h3 className="text-amber-700 dark:text-amber-500 font-semibold text-lg mb-4 flex items-center">
                      <Sparkles className="mr-2 h-5 w-5" />
                      AI Study Tips
                    </h3>
                    <ul className="space-y-2 list-disc pl-5 text-amber-900/80 dark:text-amber-200/80 marker:text-amber-500">
                      {notes.studyTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>

      {/* Chat Sidebar */}
      <div className="w-full md:w-[400px] flex flex-col h-[50vh] md:h-full bg-muted/10">
        <div className="p-4 border-b bg-card/50 flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Tutor AI</h3>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          ref={scrollRef}
        >
          <div className="flex flex-col gap-1 items-start">
            <div className="bg-primary/10 text-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] text-sm">
              Hi! I'm ready to help you study this material. What questions do you have?
            </div>
          </div>
          
          {chatHistory?.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`px-4 py-3 rounded-2xl text-sm max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-card border shadow-sm text-foreground rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          
          {sendChatMessage.isPending && (
             <div className="flex flex-col gap-1 items-start">
               <div className="bg-card border shadow-sm text-foreground px-4 py-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-2">
                 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                 Thinking...
               </div>
             </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-card/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask a question about the notes..."
              className="flex-1 rounded-full bg-background"
              disabled={sendChatMessage.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full shrink-0"
              disabled={!chatMessage.trim() || sendChatMessage.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
