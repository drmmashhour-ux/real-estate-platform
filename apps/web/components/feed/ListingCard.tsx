"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

import { trackEvent } from "@/src/services/analytics";
import { cn } from "@/lib/utils";

const BOOST_KEY = "lecipm_feed_cities";
const SEEN_VIEWS = "feed_view_sent";

function readSentViews(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const r = sessionStorage.getItem(SEEN_VIEWS);
    if (!r) return new Set();
    const p = JSON.parse(r) as unknown;
    if (!Array.isArray(p)) return new Set();
    return new Set(p.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function markSentView(id: string) {
  const s = readSentViews();
  s.add(id);
  try {
    sessionStorage.setItem(SEEN_VIEWS, JSON.stringify([...s].slice(-500)));
  } catch {
    // ignore
  }
}

export function recordFeedCityBoost(city: string) {
  if (typeof window === "undefined" || !city?.trim()) return;
  try {
    const t = city.trim();
    const raw = localStorage.getItem(BOOST_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [t, ...arr.filter((c) => c.toLowerCase() !== t.toLowerCase())].slice(0, 5);
    localStorage.setItem(BOOST_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export type FeedListing = {
  id: string;
  title: string;
  city: string;
  price: number;
  imageUrl: string | null;
  /** Server conversion layer — optional */
  conversionIntent?: "low" | "medium" | "high";
  /** From server ranking layer (Order 47). */
  socialProofStrength?: "low" | "medium" | "high";
  /** Level only — never raw score (Order 48). */
  reputationLevel?: "low" | "medium" | "high";
  hostReputationLevel?: "low" | "medium" | "high";
};

type ListingCardProps = {
  listing: FeedListing;
  href: string;
  onBoostCity?: (city: string) => void;
  fullBleed?: boolean;
  /** When true, show a small “High interest” chip for high intent (requires recommendations + data). */
  showConversionBadge?: boolean;
  /** High-intent user + high social proof — subtle emphasis (Order 47). */
  highlightSocialProof?: boolean;
};

/**
 * Swipe-friendly, mobile-first full-width card.
 */
export function ListingCard({
  listing,
  href,
  onBoostCity,
  fullBleed = true,
  showConversionBadge = false,
  highlightSocialProof = false,
}: ListingCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const recordView = useCallback(() => {
    if (readSentViews().has(listing.id)) return;
    markSentView(listing.id);
    void trackEvent("feed_view", { listingId: listing.id, city: listing.city });
  }, [listing.id, listing.city]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.4) {
            recordView();
            break;
          }
        }
      },
      { threshold: [0, 0.4, 0.6] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [recordView]);

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden border-b border-zinc-200 bg-background dark:border-zinc-800",
        fullBleed && "w-full",
        highlightSocialProof && listing.socialProofStrength === "high" && "ring-2 ring-amber-500/25 ring-inset"
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
        <div className="absolute left-3 top-3 flex max-w-[85%] flex-wrap gap-1.5">
          {showConversionBadge && listing.conversionIntent === "high" ? (
            <div className="rounded-full border border-amber-400/40 bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200 backdrop-blur-sm">
              High interest
            </div>
          ) : null}
          {listing.reputationLevel === "high" ? (
            <span className="rounded-full border border-emerald-500/50 bg-emerald-900/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 backdrop-blur-sm">
              Trusted listing
            </span>
          ) : listing.reputationLevel === "medium" ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-900/35 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100 backdrop-blur-sm">
              Trusted listing
            </span>
          ) : null}
          {listing.hostReputationLevel === "high" ? (
            <span className="rounded-full border border-emerald-500/50 bg-emerald-900/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 backdrop-blur-sm">
              Top host
            </span>
          ) : listing.hostReputationLevel === "medium" ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-900/35 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100 backdrop-blur-sm">
              Top host
            </span>
          ) : null}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wide opacity-90">{listing.city}</p>
          <h2 className="mt-0.5 line-clamp-2 text-lg font-semibold leading-tight">{listing.title}</h2>
          <p className="mt-1 text-base font-bold tabular-nums">
            {listing.price > 0 ? `From $${listing.price % 1 === 0 ? listing.price.toFixed(0) : listing.price.toFixed(2)}/night` : "View pricing"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:items-center">
        <p className="line-clamp-1 text-sm text-muted-foreground sm:col-span-1">{listing.title}</p>
        <div className="sm:text-right">
          <Link
            href={href}
            className="inline-flex w-full min-h-[48px] items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-amber-500/20 sm:min-w-[120px] sm:max-w-[180px] sm:justify-center"
            aria-label={`View listing: ${listing.title} in ${listing.city}`}
            onClick={() => {
              recordFeedCityBoost(listing.city);
              onBoostCity?.(listing.city);
              void trackEvent("feed_click", { listingId: listing.id, city: listing.city });
            }}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

export function getSessionBoostCitiesForApi(): string {
  if (typeof window === "undefined") return "";
  try {
    const r = localStorage.getItem(BOOST_KEY);
    if (!r) return "";
    const p = JSON.parse(r) as string[];
    if (!Array.isArray(p)) return "";
    return p
      .filter((x) => typeof x === "string" && x.trim())
      .map((c) => c.trim())
      .join(",");
  } catch {
    return "";
  }
}
