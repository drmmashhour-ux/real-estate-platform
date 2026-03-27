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
import type { ProductInsightsClientSnapshot } from "@/lib/insights/product-insights-minimal";

const SESSION_KEY = "lecipm_pi_snap_v1";
const SESSION_TTL_MS = 5 * 60_000;

type Status = "idle" | "loading" | "ready" | "error";

type Ctx = {
  data: ProductInsightsClientSnapshot | null;
  status: Status;
  /** analyzeToSaveRate < 30% with enough signal */
  isLowSaveConversion: boolean;
  /** Platform avg deals/user < 2 with enough users */
  isLowAvgDealsPerUser: boolean;
  compareUsageLow: boolean;
  refresh: () => void;
};

const ProductInsightsContext = createContext<Ctx | null>(null);

function readSessionCache(): ProductInsightsClientSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { at, payload } = JSON.parse(raw) as { at: number; payload: ProductInsightsClientSnapshot };
    if (Date.now() - at > SESSION_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeSessionCache(payload: ProductInsightsClientSnapshot) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {
    /* quota */
  }
}

export function ProductInsightsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProductInsightsClientSnapshot | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const load = useCallback(async () => {
    const cached = readSessionCache();
    if (cached) {
      setData(cached);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/product-insights/snapshot", { credentials: "same-origin" });
      const json = (await res.json()) as ProductInsightsClientSnapshot;
      setData(json);
      writeSessionCache(json);
      setStatus("ready");
    } catch {
      setData(null);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isLowSaveConversion = useMemo(() => {
    if (!data) return false;
    const rate = data.analyzeToSaveRate;
    return data.analyzeEvents >= 5 && rate != null && rate < 30;
  }, [data]);

  const isLowAvgDealsPerUser = useMemo(() => {
    if (!data) return false;
    return data.totalUsers >= 3 && data.avgDealsPerUser < 2;
  }, [data]);

  const compareUsageLow = Boolean(data?.compareUsageLow);

  const value = useMemo<Ctx>(
    () => ({
      data,
      status,
      isLowSaveConversion,
      isLowAvgDealsPerUser,
      compareUsageLow,
      refresh: load,
    }),
    [data, status, isLowSaveConversion, isLowAvgDealsPerUser, compareUsageLow, load]
  );

  return <ProductInsightsContext.Provider value={value}>{children}</ProductInsightsContext.Provider>;
}

export function useProductInsights(): Ctx {
  const ctx = useContext(ProductInsightsContext);
  if (!ctx) {
    return {
      data: null,
      status: "idle",
      isLowSaveConversion: false,
      isLowAvgDealsPerUser: false,
      compareUsageLow: false,
      refresh: () => {},
    };
  }
  return ctx;
}
