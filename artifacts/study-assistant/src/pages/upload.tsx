import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSession, useGenerateContent } from "@workspace/api-client-react";
import type { CreateSessionBodyInputType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Youtube, AlignLeft, UploadCloud, Sparkles } from "lucide-react";
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
      // 1. Create the session
      const session = await createSession.mutateAsync({
        data: {
          title,
          inputType: activeTab,
          inputContent: content,
        }
      });

      // 2. Trigger generation
      await generateContent.mutateAsync({ id: session.id });

      toast({
        title: "Session created!",
        description: "We are generating your study materials.",
      });
      
      // Navigate to session overview
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

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">What are we studying?</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upload your notes, paste a link, or drop a document. We'll turn it into an interactive learning experience.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-medium">Session Title</Label>
          <Input 
            id="title" 
            placeholder="e.g. Introduction to Cellular Respiration" 
            className="text-lg py-6"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CreateSessionBodyInputType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 mb-8">
            <TabsTrigger value="text" className="text-sm rounded-lg" disabled={isProcessing}>
              <AlignLeft className="w-4 h-4 mr-2" /> Text
            </TabsTrigger>
            <TabsTrigger value="youtube" className="text-sm rounded-lg" disabled={isProcessing}>
              <Youtube className="w-4 h-4 mr-2" /> YouTube
            </TabsTrigger>
            <TabsTrigger value="file" className="text-sm rounded-lg" disabled={isProcessing}>
              <UploadCloud className="w-4 h-4 mr-2" /> File Upload
            </TabsTrigger>
          </TabsList>
          
          <div className="relative rounded-2xl border bg-card shadow-sm min-h-[300px] flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {isProcessing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center flex-col"
                >
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-foreground">Extracting Knowledge</h3>
                  <p className="text-muted-foreground mt-2">This might take a few moments...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <TabsContent value="text" className="m-0 p-0 flex-1 flex flex-col outline-none">
              <Textarea 
                placeholder="Paste your notes, essay, or study material here..." 
                className="flex-1 min-h-[300px] resize-none border-0 focus-visible:ring-0 p-6 text-base"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isProcessing}
              />
            </TabsContent>
            
            <TabsContent value="youtube" className="m-0 p-6 flex-1 flex flex-col justify-center outline-none">
              <div className="max-w-xl w-full mx-auto space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                    <Youtube className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-center font-medium text-lg">Paste a YouTube Video URL</h3>
                <p className="text-center text-muted-foreground text-sm mb-4">
                  We'll extract the transcript and create study materials. Works best for lectures and educational content.
                </p>
                <Input 
                  placeholder="https://www.youtube.com/watch?v=..." 
                  className="py-6"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="file" className="m-0 p-6 flex-1 flex flex-col justify-center outline-none">
               <div className="max-w-xl w-full mx-auto">
                 {/* Dummy file upload UI for now */}
                <div 
                  className="border-2 border-dashed border-primary/20 hover:border-primary/50 bg-muted/10 transition-colors rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => {
                    if (!isProcessing) setContent("Dummy extracted text from file for demonstration purposes. The real API would handle file parsing.");
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="font-medium text-lg">Click to select a file</h3>
                  <p className="text-muted-foreground text-sm mt-2 text-center">
                    PDF, DOCX, or TXT up to 10MB
                  </p>
                  {content && activeTab === "file" && (
                    <div className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      File loaded successfully
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end">
          <Button 
            size="lg" 
            className="rounded-full px-8 text-base h-14"
            onClick={handleProcess}
            disabled={isProcessing}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create Magic
          </Button>
        </div>
      </div>
    </div>
  );
}
