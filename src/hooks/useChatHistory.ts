// src/hooks/useChatHistory.ts
import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/note.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://Alishba-1342-lumina-backend.hf.space';

const CONTEXT_LIMIT = 12000;
const EXCERPT_LIMIT = 4000;

export interface SendMessageOptions {
  excerpt?: string;
}

export function useChatHistory(noteContent: string) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (prompt: string, options?: SendMessageOptions) => {
    if (!prompt.trim() || loading) return { error: null };

    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setHistory(prev => [...prev, userMessage]);
    setLoading(true);

    const placeholderMsg: ChatMessage = { role: 'assistant', content: '' };
    setHistory(prev => [...prev, placeholderMsg]);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('context', noteContent.slice(0, CONTEXT_LIMIT));
      if (options?.excerpt?.trim()) {
        formData.append('excerpt', options.excerpt.trim().slice(0, EXCERPT_LIMIT));
      }
      formData.append('history', JSON.stringify(history));

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        body: formData,
      });

      if (response.status === 429) {
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let isStreaming = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (!isStreaming && chunk.includes('data: ')) {
          isStreaming = true;
        }

        if (isStreaming) {
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const parsed = JSON.parse(raw);

              if (parsed.error) {
                if (parsed.error === 'RATE_LIMIT_REACHED') {
                  setHistory(prev => prev.slice(0, -2));
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
                setHistory(prev => [
                  ...prev.slice(0, -1),
                  { role: 'assistant', content: accumulated },
                ]);
              }

              if (parsed.done) break;
            } catch {
              // skip malformed SSE line
            }
          }
        } else {
          accumulated += chunk;
        }
      }

      if (!isStreaming && accumulated) {
        try {
          const parsed = JSON.parse(accumulated);
          if (parsed.answer) {
            setHistory(prev => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: parsed.answer },
            ]);
          } else {
            setHistory(prev => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: accumulated },
            ]);
          }
        } catch {
          setHistory(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: accumulated },
          ]);
        }
      }

      return { error: null };
    } catch (err) {
      console.error('Chat error:', err);
      const status = typeof err === 'object' && err !== null && 'status' in err
        ? (err as Record<string, unknown>).status
        : undefined;
      const message = err instanceof Error ? err.message : '';
      if (message.includes('429') || status === 429) {
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
