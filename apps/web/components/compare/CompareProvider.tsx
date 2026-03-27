"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { COMPARE_STORAGE_KEY, MAX_COMPARE } from "@/lib/compare/constants";
import { CompareBar } from "./CompareBar";

type Ctx = {
  ids: string[];
  count: number;
  add: (id: string) => boolean;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  hydrated: boolean;
};

const CompareContext = createContext<Ctx | null>(null);

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    const j = raw ? JSON.parse(raw) : null;
    if (Array.isArray(j)) return j.filter((x) => typeof x === "string").slice(0, MAX_COMPARE);
  } catch {
    /* ignore */
  }
  return [];
}

function writeLocal(ids: string[]) {
  try {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function CompareProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let next = readLocal();
    const q = searchParams.get("fsbo") ?? searchParams.get("ids");
    if (q) {
      const fromUrl = q
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_COMPARE);
      const merged = [...new Set([...fromUrl, ...next])].slice(0, MAX_COMPARE);
      next = merged;
      writeLocal(next);
    }
    setIds(next);
    setHydrated(true);
  }, [searchParams]);

  const persist = useCallback(async (next: string[]) => {
    setIds(next);
    writeLocal(next);
    try {
      await fetch("/api/compare/saved", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingIds: next }),
      });
    } catch {
      /* guest or offline */
    }
  }, []);

  const add = useCallback(
    (id: string) => {
      if (ids.includes(id)) return true;
      if (ids.length >= MAX_COMPARE) return false;
      const next = [...ids, id];
      void persist(next);
      void fetch("/api/compare/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "add", listingIds: next }),
      }).catch(() => {});
      return true;
    },
    [ids, persist]
  );

  const remove = useCallback(
    (id: string) => {
      const next = ids.filter((x) => x !== id);
      void persist(next);
    },
    [ids, persist]
  );

  const toggle = useCallback(
    (id: string) => {
      if (ids.includes(id)) remove(id);
      else add(id);
    },
    [ids, add, remove]
  );

  const clear = useCallback(() => {
    void persist([]);
  }, [persist]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const value = useMemo<Ctx>(
    () => ({
      ids,
      count: ids.length,
      add,
      remove,
      toggle,
      has,
      clear,
      hydrated,
    }),
    [ids, add, remove, toggle, has, clear, hydrated]
  );

  return (
    <CompareContext.Provider value={value}>
      {children}
      <CompareBar />
    </CompareContext.Provider>
  );
}

export function CompareProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CompareProviderInner>{children}</CompareProviderInner>
    </Suspense>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
