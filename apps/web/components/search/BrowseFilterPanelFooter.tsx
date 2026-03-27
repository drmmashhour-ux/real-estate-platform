"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchEngineContext } from "@/components/search/search-engine-context";

/**
 * Centris-style footer: Reset + Close, then full-width Search (N properties).
 */
export function BrowseFilterPanelFooter() {
  const { draft, mode, apply, reset, cancelFilters } = useSearchEngineContext();
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    if (mode === "short") return;
    setLoading(true);
    try {
      const res = await fetch("/api/buyer/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          countOnly: true,
          page: 1,
        }),
      });
      const j = (await res.json()) as { total?: number };
      if (typeof j.total === "number") setTotal(j.total);
      else setTotal(null);
    } catch {
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }, [draft, mode]);

  useEffect(() => {
    if (mode === "short") return;
    const t = window.setTimeout(() => void fetchCount(), 320);
    return () => window.clearTimeout(t);
  }, [fetchCount, mode]);

  if (mode === "short") return null;

  const outline =
    "min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50";

  const primary =
    "flex min-h-12 w-full items-center justify-center rounded-xl bg-[#C9A646] px-4 text-sm font-bold text-[#0B0B0B] shadow-md transition hover:brightness-105 disabled:opacity-60";

  const countPart =
    loading && total === null
      ? "…"
      : total != null
        ? `${total.toLocaleString()} ${total === 1 ? "property" : "properties"}`
        : "—";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => reset()} className={outline}>
          Reset
        </button>
        <button type="button" onClick={() => cancelFilters()} className={outline}>
          Close
        </button>
      </div>
      <button type="button" onClick={() => apply()} className={primary}>
        Search ({countPart})
      </button>
    </div>
  );
}
