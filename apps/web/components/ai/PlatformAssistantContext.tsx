"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { AssistantPageContext } from "@/lib/ai/assistant-router";
import type { GlobalSearchFiltersExtended } from "@/components/search/FilterState";

type PlatformAssistantContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  pageContext: AssistantPageContext;
  lastSearchSnapshot: Partial<GlobalSearchFiltersExtended> | null;
  setLastSearchSnapshot: (v: Partial<GlobalSearchFiltersExtended> | null) => void;
  compareListingIds: [string, string] | null;
  setCompareListingIds: (v: [string, string] | null) => void;
};

const Ctx = createContext<PlatformAssistantContextValue | null>(null);

export function PlatformAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [lastSearchSnapshot, setLastSearchSnapshot] = useState<Partial<GlobalSearchFiltersExtended> | null>(null);
  const [compareListingIds, setCompareListingIds] = useState<[string, string] | null>(null);
  const pathname = usePathname();

  const pageContext = useMemo((): AssistantPageContext => {
    const listingM = pathname.match(/^\/listings\/([^/]+)/);
    const stayM = pathname.match(/^\/bnhub\/stays\/([^/]+)/);
    return {
      pathname,
      listingId: listingM?.[1],
      stayId: stayM?.[1],
      compareListingIds: compareListingIds ?? undefined,
    };
  }, [pathname, compareListingIds]);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      pageContext,
      lastSearchSnapshot,
      setLastSearchSnapshot,
      compareListingIds,
      setCompareListingIds,
    }),
    [open, toggle, pageContext, lastSearchSnapshot, compareListingIds]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatformAssistant(): PlatformAssistantContextValue {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("usePlatformAssistant requires PlatformAssistantProvider");
  }
  return v;
}
