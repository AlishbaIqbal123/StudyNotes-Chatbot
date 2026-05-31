'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { studyApi } from '@/lib/api';

/** Ping HF Space while the app tab is open (free tier still sleeps when nobody visits) */
export const WAKE_INTERVAL_MS = 10 * 60 * 1000; // 10 min — keeps backend warm during active sessions

export type BackendStatus = 'idle' | 'waking' | 'online' | 'sleeping';

export function useBackendWake() {
  const [status, setStatus] = useState<BackendStatus>('idle');
  const [lastPingAt, setLastPingAt] = useState<number>(0);
  const lastPing = useRef<number>(0);

  const pingBackend = useCallback(async () => {
    setStatus(prev => (prev === 'online' ? prev : 'waking'));
    try {
      const res = await studyApi.healthCheck();
      if (res?.status === 'online') {
        setStatus('online');
        const now = Date.now();
        lastPing.current = now;
        setLastPingAt(now);
        return true;
      }
      setStatus('sleeping');
      return false;
    } catch {
      setStatus('sleeping');
      return false;
    }
  }, []);

  useEffect(() => {
    void pingBackend();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const stale = Date.now() - lastPing.current > WAKE_INTERVAL_MS;
        if (stale) void pingBackend();
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void pingBackend();
      }
    }, WAKE_INTERVAL_MS);

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pingBackend]);

  return { status, pingBackend, wakeIntervalMs: WAKE_INTERVAL_MS, lastPingAt };
}
