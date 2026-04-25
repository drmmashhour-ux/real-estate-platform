"use client";

/**
 * Optional richer context for LECI (non-PII). Example from a draft screen:
 *
 *   const { setLeciSurface } = useLeciSurface();
 *   useEffect(() => {
 *     setLeciSurface({
 *       sectionLabel: "Exclusion de garantie",
 *       focusTopic: "warranty",
 *       userRole: "broker",
 *       draftSummary: "Offer draft step 4/9 — warranty module open",
 *     });
 *   }, […]);
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type LeciSurface = {
  /** Human label e.g. "Exclusion de garantie" */
  sectionLabel?: string;
  /** Short non-PII summary of draft state */
  draftSummary?: string;
  /** e.g. warranty, financing, inspection */
  focusTopic?: string;
  /** broker | buyer | seller | admin | visitor */
  userRole?: string;
  /** Compliance UX state when wired: ok | warn | blocked | fail */
  complianceState?: string;
};

type Ctx = {
  surface: LeciSurface;
  setLeciSurface: (patch: Partial<LeciSurface>) => void;
};

const LeciPlatformContext = createContext<Ctx | null>(null);

export function LeciProvider({ children }: { children: ReactNode }) {
  const [surface, setSurface] = useState<LeciSurface>({});
  const setLeciSurface = useCallback((patch: Partial<LeciSurface>) => {
    setSurface((s) => ({ ...s, ...patch }));
  }, []);
  const value = useMemo(() => ({ surface, setLeciSurface }), [surface, setLeciSurface]);
  return <LeciPlatformContext.Provider value={value}>{children}</LeciPlatformContext.Provider>;
}

export function useLeciSurface(): Ctx {
  const x = useContext(LeciPlatformContext);
  if (!x) {
    return {
      surface: {},
      setLeciSurface: () => {},
    };
  }
  return x;
}
