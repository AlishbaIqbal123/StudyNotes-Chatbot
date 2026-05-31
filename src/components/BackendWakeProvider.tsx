'use client';

import React, { createContext, useContext } from 'react';
import { useBackendWake, type BackendStatus } from '@/hooks/useBackendWake';

interface BackendWakeContextValue {
  status: BackendStatus;
  pingBackend: () => Promise<boolean>;
  wakeIntervalMs: number;
  lastPingAt: number;
}

const BackendWakeContext = createContext<BackendWakeContextValue | null>(null);

export function BackendWakeProvider({ children }: { children: React.ReactNode }) {
  const wake = useBackendWake();
  return (
    <BackendWakeContext.Provider value={wake}>
      {children}
    </BackendWakeContext.Provider>
  );
}

export function useBackendWakeContext() {
  const ctx = useContext(BackendWakeContext);
  if (!ctx) {
    return {
      status: 'idle' as BackendStatus,
      pingBackend: async () => false,
      wakeIntervalMs: 10 * 60 * 1000,
      lastPingAt: 0,
    };
  }
  return ctx;
}
