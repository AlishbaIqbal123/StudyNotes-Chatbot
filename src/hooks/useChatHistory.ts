// src/hooks/useChatHistory.ts
import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/note.types';
import { studyApi } from '@/lib/api';

export function useChatHistory(noteContent: string) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || loading) return { error: null };

    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setHistory(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const context = noteContent.slice(0, 8000);
      const currentHistory = [...history, userMessage];
      const historyList = currentHistory.slice(-6);
      const response = await studyApi.chat(prompt, context, historyList as any);

      if (response.data.error === "RATE_LIMIT_REACHED") {
        setHistory(prev => prev.slice(0, -1)); // Remove the last user message
        return { error: "RATE_LIMIT_REACHED" };
      }

      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.data.answer || "I could not process that." 
      };
      setHistory(prev => [...prev, assistantMessage]);
      return { error: null };
    } catch (err) {
      console.error('Chat error:', err);
      setHistory(prev => [...prev, { role: 'assistant', content: "ERROR_BUBBLE" }]);
      return { error: "COMMUNICATION_ERROR" };
    } finally {
      setLoading(false);
    }
  }, [history, loading, noteContent]);

  const clearHistory = () => setHistory([]);

  return { history, loading, sendMessage, clearHistory };
}
