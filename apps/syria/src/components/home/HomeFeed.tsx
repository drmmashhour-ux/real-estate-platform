"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { FeedListingCard } from "@/components/FeedListingCard";
import { Card } from "@/components/ui/Card";
import type { SyriaProperty } from "@/generated/prisma";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/cn";

type Item = Pick<
  SyriaProperty,
  | "id"
  | "titleAr"
  | "titleEn"
  | "state"
  | "governorate"
  | "city"
  | "cityAr"
  | "cityEn"
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

  const { ref: sentinelRef } = useInView({
    rootMargin: "320px 0px",
    onChange: (inView) => {
      if (inView) void load();
    },
  });

  if (items.length === 0) {
    return <Card className="border-dashed p-8 text-center text-sm text-[color:var(--darlink-text-muted)]">{emptyKey}</Card>;
  }

  return (
    <div className="space-y-2">
      {items.map((l, i) => (
        <FeedListingCard key={l.id} listing={l} locale={locale} priority={i < 4} />
      ))}
      {hasMore ? (
        <div className="pt-1" ref={sentinelRef}>
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
