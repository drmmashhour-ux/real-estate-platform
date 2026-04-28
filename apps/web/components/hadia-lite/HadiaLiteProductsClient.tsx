"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatHadialinkLiteLine } from "@/lib/hadia-lite/format-text-row";
import { getHadialinkNetworkMode } from "@/lib/hadia-lite/network";
import type { HadiaLiteListingItem } from "@/lib/hadia-lite/demo-products";

const LS_KEY = "hadialink_lite:firstPage:v1";

type Api = { ok?: boolean; items?: HadiaLiteListingItem[]; hasMore?: boolean; nextPage?: number | null };

function readLs(): HadiaLiteListingItem[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { items?: HadiaLiteListingItem[] };
    return j.items?.length ? j.items : null;
  } catch {
    return null;
  }
}

export function HadiaLiteProductsClient(props: {
  locale: string;
  initialItems: HadiaLiteListingItem[];
  initialHasMore: boolean;
  initialNextPage: number | null;
  initialLimit: number;
}) {
  const { locale, initialItems, initialHasMore, initialNextPage, initialLimit } = props;
  const ar = locale.toLowerCase().startsWith("ar");
  const [rows, setRows] = useState<HadiaLiteListingItem[]>(() => initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextPage, setNextPage] = useState<number | null>(initialNextPage);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  /** Network-aware density for page size parity with Syria. */
  const densityLimit = initialLimit;

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      setBusy(true);
      setErr(null);
      try {
        const density = typeof window !== "undefined" ? getHadialinkNetworkMode() : "rich";
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(densityLimit),
          density,
        });
        const res = await fetch(`/api/hadia-lite/listings?${qs.toString()}`, { cache: "no-store" });
        const j = (await res.json()) as Api;
        const items = j.items ?? [];
        if (!append) setRows(items);
        else setRows((prev) => [...prev, ...items]);
        setHasMore(Boolean(j.hasMore));
        setNextPage(typeof j.nextPage === "number" ? j.nextPage : null);

        if (page === 1 && items.length) {
          localStorage.setItem(LS_KEY, JSON.stringify({ items, ts: Date.now() }));
        }
      } catch {
        setErr("Connection slow — try again.");
        if (!append) {
          const c = typeof window !== "undefined" ? readLs() : null;
          if (c?.length) setRows(c);
        }
      } finally {
        setBusy(false);
      }
    },
    [densityLimit],
  );

  useEffect(() => {
    const c = readLs();
    if (c?.length && initialItems.length === 0) {
      setRows(c);
      void fetchPage(1, false);
      return;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || busy || nextPage == null) return;
    await fetchPage(nextPage, true);
  }, [busy, fetchPage, hasMore, nextPage]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || busy) return;
    const ob = new IntersectionObserver(
      (entries) => {
        const [e] = entries;
        if (e?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px", threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [busy, hasMore, loadMore, rows.length]);

  return (
    <div className="space-y-4">
      {err ? (
        <p className="rounded-lg border border-amber-900/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">{err}</p>
      ) : null}
      <ul className="mt-6 space-y-3 text-sm">
        {rows.map((row, i) => (
          <li key={row.id} className="rounded-lg border border-neutral-800/80 bg-neutral-950/60">
            {/* Placeholder stripe — thumbnails optional in lite mode */}
            <div className="h-2 rounded-t-lg bg-neutral-800/90" aria-hidden />
            <div className="p-3">
              <span className="text-neutral-200">{formatHadialinkLiteLine(row, ar)}</span>
              {/* progressive image omitted in catalogue list — full visuals on eventual detail route */}
            </div>
          </li>
        ))}
      </ul>
      <div ref={sentinel} className="h-px w-full opacity-0" aria-hidden />

      <div className="flex flex-wrap gap-3">
        {hasMore ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadMore()}
            className="rounded-lg border border-amber-800/60 bg-neutral-950 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-neutral-900 disabled:opacity-40"
          >
            {busy ? "…" : "Load more"}
          </button>
        ) : (
          <p className="text-xs text-neutral-500">End of catalogue.</p>
        )}
      </div>
    </div>
  );
}
