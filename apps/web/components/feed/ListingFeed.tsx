"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { UserProfile } from "@/lib/ai/userProfile";
import { trackEvent } from "@/src/services/analytics";

import {
  getSessionBoostCitiesForApi,
  ListingCard,
  recordFeedCityBoost,
  type FeedListing,
} from "./ListingCard";

const PAGE_LIMIT = 10;

type ApiListing = {
  id: string;
  title: string;
  city: string;
  price: number;
  imageUrl: string | null;
  createdAt: string;
  conversionIntent?: "low" | "medium" | "high";
  socialProofStrength?: "low" | "medium" | "high";
  reputationLevel?: "low" | "medium" | "high";
  hostReputationLevel?: "low" | "medium" | "high";
};

type FeedResponse = {
  listings: ApiListing[];
  nextCursor: string | null;
  ranked?: boolean;
};

export type ListingFeedProps = {
  userProfile?: UserProfile;
  /** e.g. `/en/ca` — used for stay detail links */
  basePath: string;
  /** Server `flags.RECOMMENDATIONS` — when false, UI uses a compact list; API still returns chronological order */
  recommendationsEnabled: boolean;
};

const SCROLL_MILESTONES = [0.25, 0.5, 0.75, 1] as const;

function normalizeBasePath(p: string) {
  return p.replace(/\/$/, "") || "";
}

/**
 * Infinite listing feed: ranked batch from `/api/feed/listings` when recommendations are on;
 * same endpoint with simple ordering when off. Session city boost via `boostCities` query param.
 */
export function ListingFeed({ basePath, recommendationsEnabled, userProfile }: ListingFeedProps) {
  void userProfile;
  const base = normalizeBasePath(basePath);
  const [listings, setListings] = useState<FeedListing[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialDone, setInitialDone] = useState(false);

  const loadRef = useRef(false);
  const milestoneSent = useRef<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (c: string | null) => {
      const qs = new URLSearchParams();
      qs.set("limit", String(PAGE_LIMIT));
      if (c) qs.set("cursor", c);
      const boost = getSessionBoostCitiesForApi();
      if (boost) qs.set("boostCities", boost);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/feed/listings?${qs.toString()}`, { method: "GET", cache: "no-store" });
        if (!res.ok) {
          setError("Could not load feed");
          return;
        }
        const data = (await res.json()) as FeedResponse;
        const mapped: FeedListing[] = data.listings.map((l) => ({
          id: l.id,
          title: l.title,
          city: l.city,
          price: l.price,
          imageUrl: l.imageUrl,
          conversionIntent: l.conversionIntent,
          socialProofStrength: l.socialProofStrength,
          reputationLevel: l.reputationLevel,
          hostReputationLevel: l.hostReputationLevel,
        }));
        setListings((prev) => {
          if (!c) return mapped;
          const seen = new Set(prev.map((x) => x.id));
          const out = [...prev];
          for (const l of mapped) {
            if (seen.has(l.id)) continue;
            seen.add(l.id);
            out.push(l);
          }
          return out;
        });
        setNextCursor(data.nextCursor);
      } catch {
        setError("Could not load feed");
      } finally {
        setLoading(false);
        setInitialDone(true);
        loadRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchPage(null);
    }, 0);
    return () => clearTimeout(t);
  }, [fetchPage]);

  const hasMore = Boolean(nextCursor);

  const loadMore = useCallback(() => {
    if (!nextCursor || loading || loadRef.current) return;
    loadRef.current = true;
    void fetchPage(nextCursor);
  }, [nextCursor, loading, fetchPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, hasMore, listings.length]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const st = h.scrollTop || document.body.scrollTop;
      const sh = h.scrollHeight - h.clientHeight;
      if (sh <= 0) return;
      const depth = st / sh;
      for (const m of SCROLL_MILESTONES) {
        if (depth >= m - 0.01) {
          const key = String(m);
          if (milestoneSent.current.has(key)) continue;
          milestoneSent.current.add(key);
          void trackEvent("feed_scroll_depth", { depth: m });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stayHref = (id: string) => `${base}/stays/${encodeURIComponent(id)}`;

  if (initialDone && !loading && listings.length === 0 && !error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-12 text-center text-muted-foreground">
        <p className="text-base">No listings available yet</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center text-sm text-destructive" role="alert">
        {error}
      </div>
    );
  }

  if (!recommendationsEnabled) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-background">
          {listings.map((l) => (
            <li key={l.id}>
              <a
                href={stayHref(l.id)}
                className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                onClick={() => {
                  recordFeedCityBoost(l.city);
                  void trackEvent("feed_click", { listingId: l.id, city: l.city });
                }}
              >
                <p className="font-medium text-foreground line-clamp-1">{l.title}</p>
                <p className="text-sm text-muted-foreground">{l.city}</p>
                <p className="text-sm font-semibold tabular-nums mt-0.5">
                  {l.price > 0 ? `$${l.price % 1 === 0 ? l.price.toFixed(0) : l.price.toFixed(2)}/night` : "View pricing"}
                </p>
              </a>
            </li>
          ))}
        </ul>
        {loading && <p className="text-center text-sm text-muted-foreground py-4">Loading…</p>}
        <div ref={sentinelRef} className="h-4" aria-hidden />
        {!hasMore && listings.length > 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">You&apos;re all caught up</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto sm:max-w-lg">
      {listings.map((l) => (
        <ListingCard
          key={l.id}
          listing={l}
          href={stayHref(l.id)}
          showConversionBadge={recommendationsEnabled}
          highlightSocialProof={
            recommendationsEnabled &&
            userProfile?.behaviorType === "high_intent" &&
            l.socialProofStrength === "high"
          }
        />
      ))}
      {loading && listings.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Loading listings…</p>
      )}
      {loading && listings.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-3">Loading more…</p>
      )}
      <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
      {!hasMore && listings.length > 0 && (
        <p className="text-center text-xs text-muted-foreground pb-8 pt-2">You&apos;re all caught up</p>
      )}
    </div>
  );
}
