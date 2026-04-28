"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FeedListingCard } from "@/components/FeedListingCard";
import { Card } from "@/components/ui/Card";
import type { SyriaProperty } from "@/generated/prisma";
import { cn } from "@/lib/cn";
import { SYRIA_CARD_PRIORITY_FIRST_COUNT } from "@/lib/syria/sybn104-performance";

type Item = Pick<
  SyriaProperty,
  | "id"
  | "adCode"
  | "titleAr"
  | "titleEn"
  | "state"
  | "governorate"
  | "city"
  | "cityAr"
  | "cityEn"
  | "area"
  | "districtAr"
  | "districtEn"
  | "price"
  | "currency"
  | "images"
  | "isDirect"
  | "type"
  | "plan"
  | "createdAt"
  | "views"
>;

type FeedResponse = { items: Item[]; hasMore: boolean; nextOffset: number };

export function HomeFeed({ initial, locale, emptyKey }: { initial: Item[]; locale: string; emptyKey: string }) {
  const tHome = useTranslations("home");
  const tBrowse = useTranslations("Browse");
  const [items, setItems] = useState<Item[]>(initial);
  const [nextOffset, setNextOffset] = useState(initial.length);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(`/api/feed?offset=${nextOffset}`, { method: "GET" });
      if (!res.ok) throw new Error("feed");
      const data = (await res.json()) as FeedResponse;
      if (!data.items || !Array.isArray(data.items)) {
        setHasMore(false);
        return;
      }
      setItems((prev) => [...prev, ...data.items]);
      setNextOffset(data.nextOffset);
      setHasMore(data.hasMore);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, nextOffset]);

  const sentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) void load();
        }
      },
      { root: null, rootMargin: "0px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load, hasMore, items.length, nextOffset]);

  if (items.length === 0) {
    return <Card className="border-dashed p-8 text-center text-sm text-[color:var(--darlink-text-muted)]">{emptyKey}</Card>;
  }

  return (
    <div className="space-y-2">
      {items.map((l, i) => (
        <FeedListingCard key={l.id} listing={l} locale={locale} priority={i < SYRIA_CARD_PRIORITY_FIRST_COUNT} />
      ))}
      {hasMore ? (
        <div className="pt-1" ref={sentRef}>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className={cn(
              "w-full min-h-12 rounded-[var(--darlink-radius-xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] px-4 text-sm font-semibold text-[color:var(--darlink-text)]",
              "hover:border-[color:var(--darlink-accent)]/40 disabled:opacity-60",
            )}
          >
            {loadError ? tHome("feedRetry") : loading ? tBrowse("loadingMore") : tHome("loadMoreCta")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
