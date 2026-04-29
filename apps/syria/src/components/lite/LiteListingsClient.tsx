"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getApiSnapshot, putApiSnapshot } from "@repo/offline";
import { SYRIA_OFFLINE_NAMESPACE } from "@/lib/offline/constants";
import type { LiteListingListItem } from "@/lib/lite/lite-queries";
import { liteListingsSnapshotKey } from "@/lib/lite/lite-cache-keys";
import { firstPageCacheKey } from "@/lib/lite/list-paging";
import { getNetworkMode } from "@/lib/core/network";
import { persistPwaLastListings } from "@/lib/pwa/local-cache";

type ApiJson = {
  ok?: boolean;
  items?: LiteListingListItem[];
  hasMore?: boolean;
  nextPage?: number | null;
};

function readFirstPageLs(locale: string): LiteListingListItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(firstPageCacheKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items?: LiteListingListItem[] };
    return parsed.items?.length ? parsed.items : null;
  } catch {
    return null;
  }
}

export function LiteListingsClient(props: {
  locale: string;
  initialItems: LiteListingListItem[];
  initialHasMore: boolean;
  initialNextPage: number | null;
  initialLimit: number;
}) {
  const { locale, initialItems, initialHasMore, initialNextPage, initialLimit } = props;
  const t = useTranslations("UltraLite");
  const [rows, setRows] = useState<LiteListingListItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextPage, setNextPage] = useState<number | null>(initialNextPage);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [src, setSrc] = useState<"server" | "cache" | "network">("server");
  const sentinel = useRef<HTMLDivElement | null>(null);

  const persistFirstPageLs = useCallback(
    (items: LiteListingListItem[]) => {
      try {
        localStorage.setItem(firstPageCacheKey(locale), JSON.stringify({ items, ts: Date.now() }));
      } catch {
        /* ignore */
      }
    },
    [locale],
  );

  /** Offline IndexedDB last known snapshot when network absent */
  useEffect(() => {
    void (async () => {
      const key = liteListingsSnapshotKey(locale);
      const cached = await getApiSnapshot<LiteListingListItem[]>(SYRIA_OFFLINE_NAMESPACE, key);
      if (cached?.length && typeof navigator !== "undefined" && navigator.onLine === false) {
        setRows(cached);
        setSrc("cache");
      }
    })();
  }, [locale]);

  /** Firstpaint: hydrate from localStorage first page only when SSR sent nothing (cold edge). */
  useEffect(() => {
    const ls = readFirstPageLs(locale);
    if (ls?.length && initialItems.length === 0) setRows(ls);
  }, [initialItems.length, locale]);

  const fetchPaged = useCallback(
    async (page: number, append: boolean) => {
      setBusy(true);
      if (!append) setErr(null);
      try {
        const density = typeof window !== "undefined" ? (getNetworkMode() === "lite" ? "lite" : "rich") : "rich";
        const qs = new URLSearchParams({
          locale,
          page: String(page),
          limit: String(initialLimit),
          density,
        });
        const res = await fetch(`/api/lite/listings?${qs.toString()}`, { cache: "no-store" });
        const j = (await res.json().catch(() => ({}))) as ApiJson;
        const items = j.items ?? [];
        if (append) {
          setRows((prev) => {
            const merged = [...prev, ...items];
            void putApiSnapshot(SYRIA_OFFLINE_NAMESPACE, liteListingsSnapshotKey(locale), merged);
            return merged;
          });
        } else {
          setRows(items);
          void putApiSnapshot(SYRIA_OFFLINE_NAMESPACE, liteListingsSnapshotKey(locale), items);
        }
        const hm = Boolean(j.hasMore);
        const np = typeof j.nextPage === "number" ? j.nextPage : null;
        setHasMore(hm);
        setNextPage(np);
        setSrc("network");

        if (page === 1 && items.length) {
          persistFirstPageLs(items);
          persistPwaLastListings(locale, items);
        }
      } catch {
        setErr(t("connectionSlowRetry"));
        /* keepExisting items — no reset */
      } finally {
        setBusy(false);
      }
    },
    [initialLimit, locale, persistFirstPageLs, t],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || busy || nextPage == null) return;
    await fetchPaged(nextPage, true);
  }, [busy, fetchPaged, hasMore, nextPage]);

  /** Optional infinite scroll */
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
    <div>
      <p className="mb-2 text-[11px] text-neutral-500">{src === "cache" ? t("sourceCache") : t("sourceLive")}</p>

      {err ? <p className="mb-2 rounded-md border border-amber-900/40 bg-amber-950/30 px-3 py-2 text-[11px] text-amber-100">{err}</p> : null}

      <ul className="list-none space-y-2 p-0">
        {rows.map((r) => (
          <li key={r.id} className="ultra-lite-row rounded-md border border-neutral-800/70 bg-neutral-950/40">
            <div className="aspect-[21/9] animate-pulse bg-neutral-800/70" aria-hidden />
            <div className="p-2">
              <Link href={`/sybnb/listings/${r.id}`} className="block font-semibold text-sky-900 hover:underline">
                {r.title}
              </Link>
              <p className="text-[11px] text-neutral-600">{r.location}</p>
              <p className="text-[12px] text-neutral-800">{r.price}</p>
              <button
                type="button"
                className="mt-1 text-[10px] text-sky-800 underline"
                onClick={() => alert(t("noImageInLite"))}
              >
                {t("loadImageStub")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div ref={sentinel} className="h-px w-full opacity-0" aria-hidden />

      <div className="mt-3 flex flex-wrap gap-2">
        {hasMore ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadMore()}
            className="rounded-lg border border-sky-900/60 bg-neutral-950 px-3 py-2 text-[11px] font-semibold text-sky-950 hover:bg-neutral-900 disabled:opacity-40"
          >
            {busy ? "…" : t("loadMore")}
          </button>
        ) : null}
      </div>

      {rows.length === 0 && !busy ? <p className="py-8 text-neutral-600">{t("emptyList")}</p> : null}
    </div>
  );
}
