import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSession, useGenerateContent } from "@workspace/api-client-react";
import type { CreateSessionBodyInputType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Youtube, AlignLeft, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<CreateSessionBodyInputType>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const createSession = useCreateSession();
  const generateContent = useGenerateContent();

  const handleProcess = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter a title for your study session.", variant: "destructive" });
      return;
    }
    if (!content.trim()) {
      toast({ title: "Content required", description: "Please provide content to process.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const session = await createSession.mutateAsync({
        data: {
          title,
          inputType: activeTab,
          inputContent: content,
        }
      });

      await generateContent.mutateAsync({ id: session.id });

      toast({
        title: "Session created!",
        description: "We are generating your study materials.",
      });
      
      setLocation(`/sessions/${session.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to create session",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const tabs = [
    { id: "text", label: "Raw Text", icon: AlignLeft },
    { id: "youtube", label: "YouTube Link", icon: Youtube },
    { id: "file", label: "Document", icon: FileText }
  ] as const;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-12 md:py-20 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/10 rounded-[100%] blur-[100px] -z-10" />

      <div className="text-center mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
          What are we <span className="gradient-text">studying?</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto font-medium">
          Upload your notes, paste a link, or drop a document. We'll turn it into an interactive learning experience.
        </p>
      </div>

      <div className="space-y-10 relative z-10">
        <div className="space-y-3 max-w-2xl mx-auto">
          <Label htmlFor="title" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground ml-1">Session Title</Label>
          <Input 
            id="title" 
            placeholder="e.g. Introduction to Cellular Respiration" 
            className="text-xl py-7 px-6 rounded-2xl bg-card border-2 border-border/50 focus-visible:ring-primary/20 shadow-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <div className="bg-card border border-border/50 shadow-xl rounded-[2rem] overflow-hidden">
          {/* Custom Tabs */}
          <div className="flex p-2 bg-muted/30 border-b border-border/50 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setContent(""); }}
                  disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all relative ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-background shadow-sm rounded-xl border border-border/50"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isActive && tab.id === 'youtube' ? 'text-red-500' : isActive && tab.id === 'file' ? 'text-blue-500' : isActive ? 'text-primary' : ''}`} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="relative min-h-[350px] flex flex-col bg-background">
            <AnimatePresence mode="wait">
              {isProcessing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-background/80 backdrop-blur-md flex items-center justify-center flex-col"
                >
                  <div className="w-24 h-24 relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 rounded-3xl animate-spin opacity-20 blur-md" />
                    <div className="bg-card w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center relative z-10 border border-border/50">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Extracting Knowledge</h3>
                  <div className="flex items-center gap-2 text-muted-foreground font-medium">
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>Analyzing content...</motion.span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-8 flex-1 flex flex-col h-full">
              {activeTab === "text" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
                  <Textarea 
                    placeholder="Paste your notes, essay, or study material here..." 
                    className="flex-1 min-h-[300px] resize-none border-0 focus-visible:ring-0 p-0 text-lg leading-relaxed bg-transparent shadow-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isProcessing}
                  />
                </motion.div>
              )}

              {activeTab === "youtube" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                    <Youtube className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">YouTube URL</h3>
                  <p className="text-muted-foreground text-center mb-8 max-w-sm">
                    We'll extract the transcript and create comprehensive study materials.
                  </p>
                  <Input 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="max-w-md w-full py-7 px-6 text-lg rounded-2xl text-center shadow-inner"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isProcessing}
                  />
                </motion.div>
              )}

              {activeTab === "file" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center h-full">
                  <div 
                    className={`w-full max-w-xl border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center transition-all duration-300 ${
                      content ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/50 cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isProcessing) setContent("Dummy extracted text from file. The real API would handle parsing.");
                    }}
                  >
                    <div className="w-20 h-20 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                      <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">{content ? "File Ready" : "Select a Document"}</h3>
                    <p className="text-muted-foreground text-center text-sm font-medium">
                      {content ? "Click 'Generate Magic' to continue" : "PDF, DOCX, or TXT up to 10MB"}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="rounded-full px-12 text-lg h-16 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
            onClick={handleProcess}
            disabled={isProcessing}
          >
            <Sparkles className="w-6 h-6 mr-3" />
            Generate Magic
          </Button>
        </div>
      </div>
    </div>
  );
}
