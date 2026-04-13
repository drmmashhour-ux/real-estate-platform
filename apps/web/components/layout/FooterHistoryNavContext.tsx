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

type FooterHistoryNavContextValue = {
  /** When greater than 0, global Back/Continue strips hide — the page owns flow navigation. */
  suppressCount: number;
  registerSuppress: () => () => void;
};

const FooterHistoryNavContext = createContext<FooterHistoryNavContextValue | null>(null);

export function FooterHistoryNavProvider({ children }: { children: ReactNode }) {
  const [suppressCount, setSuppressCount] = useState(0);

  const registerSuppress = useCallback(() => {
    setSuppressCount((c) => c + 1);
    return () => setSuppressCount((c) => Math.max(0, c - 1));
  }, []);

  const value = useMemo(
    () => ({ suppressCount, registerSuppress }),
    [suppressCount, registerSuppress],
  );

  return <FooterHistoryNavContext.Provider value={value}>{children}</FooterHistoryNavContext.Provider>;
}

export function useFooterHistoryNavSuppressed(): boolean {
  const ctx = useContext(FooterHistoryNavContext);
  return (ctx?.suppressCount ?? 0) > 0;
}

/** Call from multi-step flows that already render Back / Continue (or equivalent). */
export function useSuppressFooterHistoryNav(suppress: boolean) {
  const ctx = useContext(FooterHistoryNavContext);
  useEffect(() => {
    if (!ctx || !suppress) return;
    return ctx.registerSuppress();
  }, [ctx, suppress]);
}
