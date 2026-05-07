// src/hooks/useChatHistory.ts
import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/note.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://Alishba-1342-lumina-backend.hf.space';

export function useChatHistory(noteContent: string) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || loading) return { error: null };

    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setHistory(prev => [...prev, userMessage]);
    setLoading(true);

    // Add a placeholder assistant message that we'll stream into
    const placeholderMsg: ChatMessage = { role: 'assistant', content: '' };
    setHistory(prev => [...prev, placeholderMsg]);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('context', noteContent.slice(0, 8000));

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 429) {
        // Remove placeholder
        setHistory(prev => prev.slice(0, -1));
        return { error: 'RATE_LIMIT_REACHED' };
      }

      if (!response.ok || !response.body) {
        setHistory(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: 'Something went wrong. Please try again.' },
        ]);
        return { error: 'COMMUNICATION_ERROR' };
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const parsed = JSON.parse(raw);

            if (parsed.error) {
              if (parsed.error === 'RATE_LIMIT_REACHED') {
                setHistory(prev => prev.slice(0, -2)); // remove user + placeholder
                return { error: 'RATE_LIMIT_REACHED' };
              }
              setHistory(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: 'Something went wrong. Please try again.' },
              ]);
              return { error: 'COMMUNICATION_ERROR' };
            }

            if (parsed.token !== undefined) {
              accumulated += parsed.token;
              // Update the last message (placeholder) with accumulated text
              setHistory(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: accumulated },
              ]);
            }

            if (parsed.done) break;
          } catch {
            // Malformed JSON line — skip
          }
        }
      }

      return { error: null };
    } catch (err: any) {
      console.error('Chat error:', err);
      if (err?.message?.includes('429') || err?.status === 429) {
        setHistory(prev => prev.slice(0, -2));
        return { error: 'RATE_LIMIT_REACHED' };
      }
      setHistory(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
      return { error: 'COMMUNICATION_ERROR' };
    } finally {
      setLoading(false);
    }
  }, [history, loading, noteContent]);

  const clearHistory = () => setHistory([]);

  return { history, loading, sendMessage, clearHistory };
}
