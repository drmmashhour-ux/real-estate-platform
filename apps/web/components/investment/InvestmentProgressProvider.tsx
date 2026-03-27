"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readInvestmentProgress, type InvestmentProgress } from "@/lib/investment/activation-storage";

type Ctx = {
  progress: InvestmentProgress;
  refresh: () => void;
};

const InvestmentProgressContext = createContext<Ctx | null>(null);

/**
 * Subscribes to localStorage-backed progress + cross-tab `storage` events so UI updates in real time.
 */
export function InvestmentProgressProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const progress = useMemo(() => readInvestmentProgress(), [tick]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => refresh();
    window.addEventListener("lecipm-activation-flags-changed", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("lecipm-activation-flags-changed", on);
      window.removeEventListener("storage", on);
    };
  }, [refresh]);

  const value = useMemo(() => ({ progress, refresh }), [progress, refresh]);

  return <InvestmentProgressContext.Provider value={value}>{children}</InvestmentProgressContext.Provider>;
}

export function useInvestmentProgressContext(): Ctx | null {
  return useContext(InvestmentProgressContext);
}

export function useInvestmentProgress(): InvestmentProgress {
  const ctx = useContext(InvestmentProgressContext);
  return ctx?.progress ?? { hasAnalyzed: false, hasSaved: false, hasVisitedDashboard: false };
}

export function useRefreshInvestmentProgress(): () => void {
  const ctx = useContext(InvestmentProgressContext);
  return ctx?.refresh ?? (() => {});
}
