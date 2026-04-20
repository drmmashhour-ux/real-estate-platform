"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

const JourneyCorrelationContext = createContext<string | null>(null);

export function JourneyCorrelationProvider({ children }: { children: ReactNode }) {
  const id = useMemo(() => {
    try {
      return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `j-${Date.now()}`;
    } catch {
      return `j-${Date.now()}`;
    }
  }, []);

  return <JourneyCorrelationContext.Provider value={id}>{children}</JourneyCorrelationContext.Provider>;
}

export function useJourneyCorrelationId(): string | null {
  return useContext(JourneyCorrelationContext);
}
