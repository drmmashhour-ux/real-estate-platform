"use client";

import { useState, useEffect, useCallback, useRef, useMemo, useId } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, MapPin, SlidersHorizontal } from "lucide-react";
import { SearchEngineBar, SearchFiltersProvider, useSearchEngineContext } from "@/components/search/SearchEngine";
import { hasValidMapBounds, type GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import { StaysSearchResultsSkeleton } from "@/components/bnhub/StaysSearchResultsSkeleton";
import type { MapBoundsWgs84 } from "@/components/search/MapSearchAdapter";
import { MapSearch } from "@/components/search/MapSearch";
import type { MapListing } from "@/components/map/MapListing";
import { hasValidCoordinates } from "@/components/map/MapListing";
import { hasActiveStaysFilters, type StaysSearchFilters } from "@/lib/bnhub/stays-filters";
import { trackBehaviorEvent } from "@/lib/learning/client/trackBehaviorEvent";
import { ListingCodeBadge } from "@/components/bnhub/ListingCodeBadge";
import { StaysAccessibilityToolbar } from "@/components/accessibility/StaysAccessibilityToolbar";
import { BNHUB_STAYS_MAP_SECTION_ID } from "@/lib/search/public-map-search-urls";
import { scrollToMapSearchRegion } from "@/lib/ui/scroll-to-map-search";
import { useGeocodedMapFocus } from "@/hooks/useGeocodedMapFocus";
import { EmptyState } from "@/components/ui/EmptyState";
import { BROWSE_EMPTY_LISTINGS } from "@/lib/listings/browse-empty-copy";

type Listing = {
  id: string;
  listingCode?: string;
  title: string;
  city: string;
  region?: string | null;
  nightPriceCents: number;
  photos: unknown;
  verificationStatus: string;
  maxGuests: number;
  beds: number;
  baths: number;
  latitude: number | null;
  longitude: number | null;
  roomType?: string | null;
  propertyType?: string | null;
  description?: string | null;
  noiseLevel?: string | null;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
  _count: { reviews: number; bookings?: number };
  /** Search attaches one synthetic row with DB average `propertyRating` (1–5). */
  reviews?: { propertyRating: number }[];
  aiScore?: number;
  aiBreakdown?: {
    relevance: number;
    performance: number;
    demand: number;
    price: number;
    personalization: number;
    recency: number;
  };
  aiLabels?: string[];
  /** Present when `BEHAVIOR_LEARNING_RANK_ENABLED=1` and sort is AI/recommended. */
  learningRankScore?: number;
  learningExplanation?: string;
  learningExplanationDetail?: string;
  /** From cached listing quality — short pill when thresholds are met. */
  qualityBadgeLabel?: string | null;
};

const DEFAULT_STAY_FILTERS: StaysSearchFilters = {
  noiseLevel: null,
  familyFriendly: false,
  partyFriendly: false,
  petsOnly: false,
  petType: null,
  guestPetWeightKg: null,
  expWaterfront: false,
  expDowntown: false,
  expAttractions: false,
  svcAirportPickup: false,
  svcParking: false,
  svcShuttle: false,
};

function photoFirst(listing: Listing): string | null {
  const p = listing.photos;
  if (Array.isArray(p) && p.length > 0 && typeof p[0] === "string") return p[0];
  return null;
}

function reviewAvgOutOf5FromSearch(listing: Listing): number | undefined {
  const raw = listing.reviews?.[0]?.propertyRating;
  if (raw == null) return undefined;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function toMapListing(l: Listing): MapListing | null {
  if (!hasValidCoordinates(l)) return null;
  const img = photoFirst(l);
  const avg5 = reviewAvgOutOf5FromSearch(l);
  const rc = l._count.reviews ?? 0;
  const hasPublishedAvg = avg5 != null && rc > 0;
  const pseudo = pseudoReview(l);
  const addressParts = [l.city?.trim(), l.region?.trim()].filter(Boolean) as string[];
  const addressLine = addressParts.length > 0 ? addressParts.join(", ") : undefined;

  return {
    id: l.id,
    latitude: l.latitude as number,
    longitude: l.longitude as number,
    price: l.nightPriceCents / 100,
    title: l.title,
    image: img ?? undefined,
    address: addressLine,
    href: `/bnhub/stays/${l.id}`,
    aiScore: typeof l.aiScore === "number" ? l.aiScore : undefined,
    /** BNHUB inventory is always on LECIPM — use brand mark on the map pin (not the generic flag). */
    platformListing: true,
    listingHeadline: "Nightly stay",
    reviewAverageOutOf5: hasPublishedAvg ? avg5 : null,
    reviewCount: rc,
    guestScoreOutOf10: hasPublishedAvg ? null : pseudo,
    guestScoreLabel: hasPublishedAvg ? null : reviewLabel(pseudo),
  };
}

/** Discovery badges from AI score + light demand signal — max 2 to avoid clutter */
function discoveryBadges(listing: Listing, medianNightCents: number): string[] {
  const s = listing.aiScore ?? 0;
  const out: string[] = [];
  if (s >= 85) out.push("🔥 Hot");
  else if (s >= 70) out.push("⭐ Great value");
  const bookings = listing._count.bookings ?? 0;
  const greatPrice =
    medianNightCents > 0 && listing.nightPriceCents > 0 && listing.nightPriceCents <= medianNightCents * 0.95;
  if (greatPrice && !out.includes("⭐ Great value") && s >= 60) out.push("⭐ Great value");
  if (bookings >= 2 || listing._count.reviews >= 3) out.push("⚡ High demand");
  return [...new Set(out)].slice(0, 2);
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function pseudoReview(listing: Listing) {
  const base = 7.5 + Math.min(listing._count.reviews, 40) * 0.04 + (listing.verificationStatus === "VERIFIED" ? 0.4 : 0);
  return Math.min(9.6, Math.max(6.8, Number(base.toFixed(1))));
}

function reviewLabel(score: number) {
  if (score >= 9) return "Wonderful";
  if (score >= 8.5) return "Excellent";
  if (score >= 8) return "Very Good";
  if (score >= 7) return "Good";
  return "Review score";
}

/** Screen-reader summary for listing cards (type, city, price, bedrooms). */
function stayListingAriaLabel(listing: Listing): string {
  const type = listing.propertyType?.trim() || "Short-term stay";
  const city = listing.city?.trim() || "Unknown city";
  const price = formatCurrency(listing.nightPriceCents);
  const beds = listing.beds;
  const bedLabel = beds === 1 ? "1 bedroom" : `${beds} bedrooms`;
  return `${listing.title}. ${type}, ${city}, ${price} per night, ${bedLabel}.`;
}

export function StaysSearchResults() {
  const searchParams = useSearchParams();
  const spKey = searchParams.toString();
  const { applied, reset, applyPatch, setFiltersOpen, filtersOpen, activeFilterCount } = useSearchEngineContext();
  const smartQueryInputId = useId();
  const sortSelectId = useId();
  const mapLayoutSelectId = useId();
  const popularFiltersPanelId = useId();

  const [listings, setListings] = useState<Listing[]>([]);
  const [emptyFallbackListings, setEmptyFallbackListings] = useState<Listing[]>([]);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [smartQuery, setSmartQuery] = useState("");
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [intentNote, setIntentNote] = useState<string | null>(null);
  const [showMapInline, setShowMapInline] = useState(false);
  const sugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [staysFilters, setStaysFilters] = useState<StaysSearchFilters>(DEFAULT_STAY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const boundsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staysMapDeepLinkScrollKey = useRef<string | null>(null);
  const [popularFiltersOpen, setPopularFiltersOpen] = useState(false);
  /** AI score breakdown — enable in development builds or add ?debug=1 (handled via public env in future). */
  const showAiDebug = process.env.NODE_ENV === "development";

  useEffect(
    () => () => {
      if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current);
    },
    []
  );

  useEffect(() => {
    if (sugTimer.current) clearTimeout(sugTimer.current);
    const q = smartQuery.trim();
    if (q.length < 2) {
      setSmartSuggestions([]);
      return;
    }
    sugTimer.current = setTimeout(() => {
      fetch(`/api/ai/search/suggest?q=${encodeURIComponent(q)}&limit=8`)
        .then((res) => res.json())
        .then((data) => setSmartSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []))
        .catch(() => setSmartSuggestions([]));
    }, 280);
    return () => {
      if (sugTimer.current) clearTimeout(sugTimer.current);
    };
  }, [smartQuery]);

  const applyAiIntent = () => {
    const q = smartQuery.trim();
    if (!q) return;
    fetch("/api/ai/search/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, context: "nightly_stay" }),
    })
      .then((res) => res.json())
      .then((data) => {
        setIntentNote(typeof data.explanation === "string" ? data.explanation : null);
        const f = data.suggestedFilters;
        if (!f) return;
        applyPatch({
          ...(f.priceMaxCents != null ? { priceMax: Math.floor(f.priceMaxCents / 100) } : {}),
          ...(f.priceMinCents != null ? { priceMin: Math.floor(f.priceMinCents / 100) } : {}),
          ...(f.sort === "price_asc"
            ? { sort: "priceAsc" }
            : f.sort === "price_desc"
              ? { sort: "priceDesc" }
              : f.sort === "newest"
                ? { sort: "newest" }
                : {}),
        });
        setFiltersOpen(true);
      })
      .catch(() => setIntentNote(null));
  };

  const fetchListings = useCallback(() => {
    setLoading(true);
    const searchBlob = [applied.location, smartQuery].filter(Boolean).join(" | ").slice(0, 500);
    if (searchBlob) {
      fetch("/api/ai/activity", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "search", searchQuery: searchBlob }),
      }).catch(() => {});
    }
    const body: GlobalSearchFiltersExtended & { type: "short"; staysFilters: StaysSearchFilters } = {
      ...applied,
      type: "short",
      staysFilters,
    };
    fetch("/api/bnhub/stays/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        const rows = data?.data;
        setListings(Array.isArray(rows) ? rows : []);
      })
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [applied, smartQuery, staysFilters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (loading) return;
    if (listings.length === 0) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("lecipm_journey_search_used")) return;
    sessionStorage.setItem("lecipm_journey_search_used", "1");
    void fetch("/api/journey/event", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "search_used" }),
    }).catch(() => {});
  }, [loading, listings.length]);

  const fetchRelaxedNearby = useCallback(() => {
    setFallbackLoading(true);
    const body: GlobalSearchFiltersExtended & { type: "short"; staysFilters: StaysSearchFilters } = {
      ...applied,
      type: "short",
      north: null,
      south: null,
      east: null,
      west: null,
      staysFilters: DEFAULT_STAY_FILTERS,
    };
    fetch("/api/bnhub/stays/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        const rows = data?.data;
        setEmptyFallbackListings(Array.isArray(rows) ? rows.slice(0, 12) : []);
      })
      .catch(() => setEmptyFallbackListings([]))
      .finally(() => setFallbackLoading(false));
  }, [applied]);

  useEffect(() => {
    if (loading) return;
    if (listings.length > 0) {
      setEmptyFallbackListings([]);
      return;
    }
    void fetchRelaxedNearby();
  }, [loading, listings.length, fetchRelaxedNearby]);

  useEffect(() => {
    if (searchParams.get("mapLayout") !== "map") return;
    if (loading) return;
    if (listings.length === 0) return;
    if (staysMapDeepLinkScrollKey.current === spKey) return;
    staysMapDeepLinkScrollKey.current = spKey;
    setShowMapInline(true);
    scrollToMapSearchRegion(BNHUB_STAYS_MAP_SECTION_ID, { delayMs: 500 });
  }, [loading, listings.length, spKey, searchParams]);

  const mapLayout = applied.mapLayout ?? "split";
  const mapPins = useMemo(
    () => listings.map(toMapListing).filter((x): x is MapListing => x != null),
    [listings]
  );
  const hasActiveFilters = activeFilterCount > 0 || hasActiveStaysFilters(staysFilters);

  const medianNightCents = useMemo(() => {
    if (listings.length === 0) return 0;
    const sorted = [...listings].map((l) => l.nightPriceCents).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  }, [listings]);

  const recommendedTop = useMemo(() => {
    return [...listings]
      .filter((l) => typeof l.aiScore === "number" || typeof l.learningRankScore === "number")
      .sort((a, b) => {
        const bx = b.learningRankScore ?? b.aiScore ?? 0;
        const ax = a.learningRankScore ?? a.aiScore ?? 0;
        return bx - ax;
      })
      .slice(0, 5);
  }, [listings]);

  const onBoundsChange = useCallback(
    (b: MapBoundsWgs84) => {
      if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current);
      boundsDebounceRef.current = setTimeout(() => {
        applyPatch({
          north: b.north,
          south: b.south,
          east: b.east,
          west: b.west,
        });
      }, 300);
    },
    [applyPatch]
  );

  const initialBounds =
    hasValidMapBounds(applied) && applied.north != null && applied.south != null && applied.east != null && applied.west != null
      ? { north: applied.north, south: applied.south, east: applied.east, west: applied.west }
      : null;

  const staysMapBoundsActive = hasValidMapBounds(applied);
  const locationMapFocus = useGeocodedMapFocus(applied.location, staysMapBoundsActive);

  const setLayout = (layout: "list" | "split" | "map") => {
    applyPatch({ mapLayout: layout });
    if (layout === "map" || layout === "split") {
      scrollToMapSearchRegion(BNHUB_STAYS_MAP_SECTION_ID, { delayMs: 220 });
    }
  };

  const jumpToStaysMapSearch = useCallback(
    (listingId?: string) => {
      if (listingId) setSelectedId(listingId);
      setShowMapInline(true);
      applyPatch({ mapLayout: "split" });
      scrollToMapSearchRegion(BNHUB_STAYS_MAP_SECTION_ID, { delayMs: 260 });
    },
    [applyPatch]
  );

  const mapSearchEl = (
    <MapSearch
      listings={mapPins}
      initialBounds={initialBounds}
      focusPoint={locationMapFocus}
      onBoundsChange={onBoundsChange}
      selectedId={selectedId}
      onMarkerClick={(ml) => {
        setSelectedId(ml.id);
        const row = listings.find((l) => l.id === ml.id);
        if (row) {
          trackBehaviorEvent({
            eventType: "MAP_PIN_CLICK",
            pageType: "bnhub_stays_search",
            listingId: ml.id,
            city: row.city,
            category: "stay",
            propertyType: row.propertyType,
            priceCents: row.nightPriceCents,
            aiScoreSnapshot: row.aiScore ?? null,
          });
        }
        document.getElementById(`stay-card-${ml.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }}
      variant="dark"
      enableHeatZones
      className="h-[420px] w-full"
    />
  );

  const resultCards = useMemo(
    () => (
      <div className="space-y-4">
        {listings.map((listing) => {
          const reviewScore = pseudoReview(listing);
          const badges = discoveryBadges(listing, medianNightCents);
          const labelPills =
            badges.length > 0 ? badges : (listing.aiLabels ?? []).slice(0, 3);
          return (
            <Link
              key={listing.id}
              id={`stay-card-${listing.id}`}
              href={`/bnhub/stays/${listing.id}`}
              aria-label={stayListingAriaLabel(listing)}
              onMouseEnter={() => setSelectedId(listing.id)}
              onMouseLeave={() => setSelectedId(null)}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-stays-open-map]")) {
                  e.preventDefault();
                  jumpToStaysMapSearch(listing.id);
                  return;
                }
                fetch("/api/search/events", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ eventType: "CLICK", listingId: listing.id }),
                }).catch(() => {});
                void fetch("/api/journey/event", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: "listing_click", listingId: listing.id }),
                }).catch(() => {});
                trackBehaviorEvent({
                  eventType: "LISTING_CLICK",
                  pageType: "bnhub_stays_search",
                  listingId: listing.id,
                  city: listing.city,
                  category: "stay",
                  propertyType: listing.propertyType,
                  priceCents: listing.nightPriceCents,
                  aiScoreSnapshot: listing.aiScore ?? null,
                });
              }}
              title={
                listing.aiBreakdown
                  ? `Why this result: relevance and personalization — use ?debug=1 for details`
                  : undefined
              }
              className={`group grid gap-4 overflow-hidden rounded-[12px] border border-bnhub-border bg-bnhub-card p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)] transition hover:shadow-lg md:grid-cols-[240px_minmax(0,1fr)_180px] ${
                selectedId === listing.id ? "border-bnhub-gold ring-2 ring-bnhub-gold/35" : "hover:border-bnhub-gold/25"
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-neutral-900">
                {photoFirst(listing) ? (
                  <img
                    src={photoFirst(listing)!}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">No photo</div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold leading-tight text-bnhub-gold sm:text-2xl group-hover:underline">{listing.title}</h2>
                      <ListingCodeBadge code={listing.listingCode} />
                      {labelPills.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2 py-0.5 text-xs font-semibold text-[#7a5f12]"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    {showAiDebug && listing.aiScore != null && listing.aiBreakdown ? (
                      <p className="mt-1 font-mono text-[10px] text-slate-500">
                        score {listing.aiScore.toFixed(4)} · r {listing.aiBreakdown.relevance.toFixed(2)} · p{" "}
                        {listing.aiBreakdown.performance.toFixed(2)} · d {listing.aiBreakdown.demand.toFixed(2)} · $ {listing.aiBreakdown.price.toFixed(2)} · pers{" "}
                        {listing.aiBreakdown.personalization.toFixed(2)} · rec {listing.aiBreakdown.recency.toFixed(2)}
                      </p>
                    ) : null}
                    {listing.learningExplanation ? (
                      <p className="mt-1 text-xs text-slate-500" title={listing.learningExplanationDetail}>
                        {listing.learningExplanation}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-bnhub-text-secondary">
                      <span className="font-medium text-bnhub-text">{listing.city}</span>
                      {listing.region ? <span>{listing.region}</span> : null}
                      <span
                        data-stays-open-map
                        className="inline-flex cursor-pointer items-center gap-1 text-premium-gold underline-offset-2 hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Show on map
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-200">{reviewLabel(reviewScore)}</p>
                      <p className="text-xs text-neutral-500">
                        {listing._count.reviews > 0 ? `${listing._count.reviews.toLocaleString()} reviews` : "New listing"}
                      </p>
                    </div>
                    <div className="rounded-md border border-premium-gold/40 bg-premium-gold/15 px-2.5 py-1 text-sm font-bold text-premium-gold">
                      {reviewScore}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold text-neutral-200">
                  {listing.propertyType ?? "Stay"} · {listing.roomType ?? "Entire place"}
                </p>
                <p className="mt-1 text-sm text-neutral-400">
                  {listing.beds} bed{listing.beds !== 1 ? "s" : ""} · {listing.baths} bathroom
                  {listing.baths !== 1 ? "s" : ""} · up to {listing.maxGuests} guests
                </p>
                {listing.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{listing.description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.qualityBadgeLabel ? (
                    <span
                      className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200"
                      title="Listing quality reflects content, pricing, performance, behavior, and trust signals."
                    >
                      {listing.qualityBadgeLabel}
                    </span>
                  ) : null}
                  {listing.verificationStatus === "VERIFIED" ? (
                    <span className="rounded-full border border-premium-gold/35 bg-premium-gold/10 px-2.5 py-1 text-xs font-semibold text-premium-gold">
                      Verified listing
                    </span>
                  ) : null}
                  {listing.familyFriendly ? (
                    <span className="rounded-full border border-premium-gold/25 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-neutral-200">
                      Family-friendly
                    </span>
                  ) : null}
                  {listing.petsAllowed ? (
                    <span className="rounded-full border border-premium-gold/25 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-neutral-200">
                      Pets allowed
                    </span>
                  ) : null}
                  {listing.noiseLevel ? (
                    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-semibold capitalize text-neutral-400">
                      {listing.noiseLevel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl border border-premium-gold/15 bg-black/50 p-4">
                <div className="text-right">
                  <p className="text-xs text-neutral-500">Per night</p>
                  <p className="text-3xl font-extrabold tracking-tight text-premium-gold">
                    {formatCurrency(listing.nightPriceCents)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">Taxes and fees may apply</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-premium-gold/90">Free cancellation</p>
                  <span className="inline-flex w-full items-center justify-center rounded-lg bg-premium-gold px-4 py-3 text-sm font-bold text-[#0a0a0a] transition hover:brightness-110">
                    See availability
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    ),
    [listings, selectedId, showAiDebug, medianNightCents, jumpToStaysMapSearch]
  );

  const checkboxClass = "h-4 w-4 rounded border-neutral-600 bg-[#1a1a1a] text-[#d4af37] focus:ring-[#d4af37]";
  const sidebarCardClass = "rounded-2xl border border-premium-gold/20 bg-[#141414] p-5 text-neutral-100";
  const fieldClass =
    "mt-1 w-full rounded-lg border border-neutral-600 bg-[#1a1a1a] px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500";

  return (
    <div className="space-y-6 bg-[#080808] text-neutral-100">
      <section
        id="stays-smart-search"
        aria-labelledby="stays-smart-search-heading"
        className="scroll-mt-24 rounded-2xl border border-premium-gold/20 bg-[#141414] p-4"
      >
        <h2
          id="stays-smart-search-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-premium-gold/80"
        >
          Smart search (intent + suggestions)
        </h2>
        <div className="relative flex flex-wrap items-start gap-2">
          <div className="relative min-w-[200px] flex-1">
            <label htmlFor={smartQueryInputId} className="sr-only">
              Describe what you are looking for in your own words
            </label>
            <input
              id={smartQueryInputId}
              type="text"
              placeholder='Try: "cheap condo near metro"'
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-600 bg-[#1a1a1a] px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-premium-gold focus:outline-none focus:ring-1 focus:ring-premium-gold"
              autoComplete="off"
            />
            {smartSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 z-20 mt-1 max-h-44 overflow-auto rounded-lg border border-neutral-600 bg-[#1a1a1a] py-1 shadow-xl">
                {smartSuggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-neutral-200 hover:bg-white/5"
                      onClick={() => {
                        setSmartQuery(s);
                        setSmartSuggestions([]);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={applyAiIntent}
            className="rounded-lg border border-premium-gold/35 bg-premium-gold/10 px-4 py-2.5 text-sm font-medium text-premium-gold hover:bg-premium-gold/15"
            aria-label="Apply suggested filters from smart search"
          >
            Apply AI to filters
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Rule-based only. Use this to narrow the results faster, then refine with the sidebar.
        </p>
        {intentNote ? <p className="mt-2 text-xs text-premium-gold">{intentNote}</p> : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside aria-label="Stay search filters" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className={sidebarCardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-100">Filter for your perfect stay</p>
                <p className="text-xs text-neutral-400">
                  {hasActiveFilters ? "Some filters are active." : "No extra filters applied yet."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setStaysFilters(DEFAULT_STAY_FILTERS);
                }}
                className="text-xs font-semibold text-premium-gold hover:underline"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <label htmlFor={sortSelectId} className="block text-sm font-semibold text-neutral-100">
              Sort results
            </label>
            <select
              id={sortSelectId}
              value={applied.sort ?? "recommended"}
              onChange={(e) => {
                const v = e.target.value;
                applyPatch({
                  sort:
                    v === "priceAsc" || v === "priceDesc" || v === "newest" || v === "recommended" || v === "ai"
                      ? v
                      : "recommended",
                });
              }}
              className={fieldClass}
            >
              <option value="recommended">AI recommended</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
            <p className="mt-2 text-xs text-neutral-400">
              AI ranking blends relevance, demand, value, and your preferences when signed in.
            </p>
          </div>

          <div className={sidebarCardClass}>
            <p className="text-sm font-semibold text-neutral-100">Your budget per night</p>
            <label className="mt-4 block text-sm text-neutral-300">
              Max nightly price
              <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={applied.priceMax && applied.priceMax > 0 ? applied.priceMax : 1000}
                onChange={(e) => applyPatch({ priceMax: Number(e.target.value) })}
                className="mt-2 w-full accent-[#d4af37]"
              />
            </label>
            <p className="mt-2 text-sm font-medium text-premium-gold">
              Up to {formatCurrency((applied.priceMax && applied.priceMax > 0 ? applied.priceMax : 1000) * 100)}
            </p>
          </div>

          <div className={sidebarCardClass}>
            <button
              type="button"
              aria-expanded={popularFiltersOpen}
              aria-controls={popularFiltersPanelId}
              onClick={() => setPopularFiltersOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 rounded-lg text-left outline-none ring-offset-[#141414] transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-premium-gold/60"
            >
              <span className="text-sm font-semibold text-neutral-100">Popular filters</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-premium-gold transition-transform duration-200 ${popularFiltersOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {popularFiltersOpen ? (
              <div
                id={popularFiltersPanelId}
                className="mt-4 space-y-3 border-t border-premium-gold/10 pt-4 text-sm text-neutral-300"
              >
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={applied.roomType === "Entire place"}
                    onChange={(e) => applyPatch({ roomType: e.target.checked ? "Entire place" : "" })}
                    className={checkboxClass}
                  />
                  Entire place
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={staysFilters.familyFriendly}
                    onChange={(e) => setStaysFilters((s) => ({ ...s, familyFriendly: e.target.checked }))}
                    className={checkboxClass}
                  />
                  Family-friendly
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={staysFilters.petsOnly}
                    onChange={(e) => setStaysFilters((s) => ({ ...s, petsOnly: e.target.checked }))}
                    className={checkboxClass}
                  />
                  Pets allowed
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={staysFilters.svcParking}
                    onChange={(e) => setStaysFilters((s) => ({ ...s, svcParking: e.target.checked }))}
                    className={checkboxClass}
                  />
                  Parking
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={staysFilters.expDowntown}
                    onChange={(e) => setStaysFilters((s) => ({ ...s, expDowntown: e.target.checked }))}
                    className={checkboxClass}
                  />
                  Downtown
                </label>
              </div>
            ) : null}
          </div>

          <div className={sidebarCardClass}>
            <p className="text-sm font-semibold text-neutral-100">Bedrooms and bathrooms</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-sm text-neutral-300">
                Bedrooms
                <select
                  value={applied.bedrooms ?? ""}
                  onChange={(e) => applyPatch({ bedrooms: e.target.value ? Number(e.target.value) : null })}
                  className={fieldClass}
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </label>
              <label className="text-sm text-neutral-300">
                Bathrooms
                <select
                  value={applied.bathrooms ?? ""}
                  onChange={(e) => applyPatch({ bathrooms: e.target.value ? Number(e.target.value) : null })}
                  className={fieldClass}
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </label>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <p className="text-sm font-semibold text-neutral-100">Lifestyle and pets</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-neutral-300">
                Noise level
                <select
                  value={staysFilters.noiseLevel ?? ""}
                  onChange={(e) =>
                    setStaysFilters((s) => ({
                      ...s,
                      noiseLevel: (e.target.value || null) as StaysSearchFilters["noiseLevel"],
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="">Any</option>
                  <option value="quiet">Quiet</option>
                  <option value="moderate">Moderate</option>
                  <option value="lively">Lively</option>
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={staysFilters.partyFriendly}
                  onChange={(e) => setStaysFilters((s) => ({ ...s, partyFriendly: e.target.checked }))}
                  className={checkboxClass}
                />
                Party-friendly
              </label>
              <label className="block text-sm text-neutral-300">
                Pet type
                <select
                  value={staysFilters.petType ?? ""}
                  onChange={(e) =>
                    setStaysFilters((s) => ({
                      ...s,
                      petType: (e.target.value || null) as StaysSearchFilters["petType"],
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="">Any</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="block text-sm text-neutral-300">
                Pet weight (kg)
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Any"
                  value={staysFilters.guestPetWeightKg ?? ""}
                  onChange={(e) =>
                    setStaysFilters((s) => ({
                      ...s,
                      guestPetWeightKg: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className={fieldClass}
                />
              </label>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <p className="text-sm font-semibold text-neutral-100">Experience and services</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-300">
              {(
                [
                  ["expWaterfront", "Waterfront"],
                  ["expDowntown", "Downtown"],
                  ["expAttractions", "Near attractions"],
                  ["svcAirportPickup", "Airport pickup"],
                  ["svcParking", "Parking service"],
                  ["svcShuttle", "Shuttle"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(staysFilters[key])}
                    onChange={(e) => setStaysFilters((s) => ({ ...s, [key]: e.target.checked }))}
                    className={checkboxClass}
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void fetchListings()}
              className="mt-4 w-full rounded-lg bg-premium-gold px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:brightness-110"
            >
              Apply stay filters
            </button>
          </div>
        </aside>

        <section
          id={BNHUB_STAYS_MAP_SECTION_ID}
          aria-label="Stay listings and map"
          className="min-w-0 scroll-mt-28 space-y-4 lg:scroll-mt-24"
        >
          <StaysAccessibilityToolbar />
          <div className="rounded-2xl border border-premium-gold/20 bg-[#141414] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-premium-gold">
                  {loading
                    ? `${applied.location?.trim() || "BNHUB"}: Finding stays…`
                    : `${applied.location?.trim() || "BNHUB"}: ${listings.length} propert${listings.length === 1 ? "y" : "ies"} found`}
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {hasActiveFilters ? "Filters active on this search." : "Search verified stays and compare availability."}
                </p>
                {mapLayout !== "list" ? (
                  <p className="mt-2 text-sm text-premium-gold/90">
                    Map + search: pan or zoom to narrow results to the visible area (with your dates and filters).
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMapInline((v) => {
                      const next = !v;
                      if (next) scrollToMapSearchRegion(BNHUB_STAYS_MAP_SECTION_ID, { delayMs: 200 });
                      return next;
                    });
                  }}
                  aria-expanded={showMapInline}
                  className="inline-flex items-center gap-2 rounded-full border border-premium-gold/35 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-white/5"
                  aria-label={showMapInline ? "Hide map preview above results" : "Show map preview above results"}
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {showMapInline ? "Hide map" : "Show on map"}
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-full border border-premium-gold/35 px-4 py-2 text-sm font-semibold text-neutral-200 hover:bg-white/5"
                  aria-expanded={filtersOpen}
                  aria-controls="search-filters-panel"
                  aria-label="Open full search filters panel"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Filters
                  {activeFilterCount > 0 ? (
                    <span className="rounded-full bg-premium-gold/20 px-2 py-0.5 text-xs text-premium-gold">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
                <label htmlFor={mapLayoutSelectId} className="sr-only">
                  Choose layout: list only, map with list, or map first
                </label>
                <select
                  id={mapLayoutSelectId}
                  value={mapLayout}
                  onChange={(e) => setLayout(e.target.value as "list" | "split" | "map")}
                  className="rounded-full border border-premium-gold/35 bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-neutral-200"
                >
                  <option value="list">List view</option>
                  <option value="split">Map + list</option>
                  <option value="map">Map first</option>
                </select>
              </div>
            </div>
          </div>

          {showMapInline ? (
            <div className="rounded-2xl border border-premium-gold/20 bg-[#141414] p-3">{mapSearchEl}</div>
          ) : null}

          {loading ? (
            <StaysSearchResultsSkeleton />
          ) : listings.length === 0 ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-premium-gold/20 bg-[#141414] p-6 sm:p-10">
                <EmptyState title={BROWSE_EMPTY_LISTINGS.title} description={BROWSE_EMPTY_LISTINGS.description}>
                  <>
                    <button type="button" onClick={() => reset()} className="lecipm-cta-gold-solid min-h-[44px] px-6 py-2.5 text-sm">
                      Reset filters
                    </button>
                    <Link
                      href="/bnhub/stays"
                      className="lecipm-cta-gold-outline inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 text-sm"
                    >
                      View all stays
                    </Link>
                    <Link
                      href="/explore"
                      className="lecipm-cta-gold-outline inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 text-sm"
                    >
                      Browse featured listings
                    </Link>
                  </>
                </EmptyState>
                <ul className="mx-auto mt-8 max-w-lg list-inside list-disc space-y-2 text-left text-sm text-neutral-400">
                  <li>Zoom out on the map or clear map bounds so we can search a wider area.</li>
                  <li>Relax dates, price range, or guest count.</li>
                  <li>Turn off stay filters (pets, waterfront, etc.) one at a time.</li>
                  <li>Try a nearby city or region in the search bar.</li>
                </ul>
              </div>
              {fallbackLoading ? (
                <div className="rounded-2xl border border-premium-gold/20 bg-[#141414] p-4">
                  <p className="mb-3 text-sm font-medium text-neutral-300">Loading popular stays nearby…</p>
                  <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="min-w-[200px] max-w-[220px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]"
                      >
                        <div className="aspect-[16/10] animate-pulse bg-white/10" />
                        <div className="space-y-2 p-3">
                          <div className="h-4 w-[85%] animate-pulse rounded bg-white/10" />
                          <div className="h-3 w-[55%] animate-pulse rounded bg-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : emptyFallbackListings.length > 0 ? (
                <div className="rounded-2xl border border-premium-gold/25 bg-[#0a0a0a] p-5">
                  <h3 className="text-lg font-bold tracking-tight text-[#D4AF37]">Popular on BNHUB — still available</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Broader search (no map box) — tap a stay to view details.
                  </p>
                  <div className="mt-4 flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {emptyFallbackListings.map((l) => (
                      <Link
                        key={l.id}
                        href={`/bnhub/stays/${l.id}`}
                        className="min-w-[200px] max-w-[240px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-[#D4AF37]/45"
                      >
                        <div className="aspect-[16/10] bg-white/10">
                          {photoFirst(l) ? (
                            <img src={photoFirst(l)!} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-white/40">No photo</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-semibold text-neutral-100">{l.title}</p>
                          <p className="mt-1 text-xs text-neutral-500">{l.city}</p>
                          <p className="mt-2 text-sm font-bold text-[#D4AF37]">{formatCurrency(l.nightPriceCents)}/night</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div ref={listRef} className="space-y-4">
              {recommendedTop.length >= 3 ? (
                <div className="rounded-2xl border border-[#D4AF37]/35 bg-[#050505] p-5 shadow-[0_0_48px_-16px_rgba(212,175,55,0.25)]">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold tracking-tight text-[#D4AF37]">Recommended for you</h3>
                    <p className="text-xs text-white/55">
                      Top picks by AI ranking for this search — compare value and fit before you book.
                    </p>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {recommendedTop.map((l) => (
                      <Link
                        key={l.id}
                        href={`/bnhub/stays/${l.id}`}
                        aria-label={`Recommended: ${stayListingAriaLabel(l)}`}
                        className="min-w-[200px] max-w-[240px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition hover:border-[#D4AF37]/45"
                      >
                        <div className="aspect-[16/10] bg-white/10">
                          {photoFirst(l) ? (
                            <img src={photoFirst(l)!} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-white/40">No photo</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-semibold text-white">{l.title}</p>
                          <p className="mt-1 text-xs text-white/45">{l.city}</p>
                          <p className="mt-2 text-sm font-bold text-[#D4AF37]">{formatCurrency(l.nightPriceCents)} / night</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {mapLayout === "list" && resultCards}
              {mapLayout === "split" && (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="min-w-0">{resultCards}</div>
                  <div className="sticky top-24 h-fit rounded-2xl border border-premium-gold/20 bg-[#141414] p-3">{mapSearchEl}</div>
                </div>
              )}
              {mapLayout === "map" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-premium-gold/20 bg-[#141414] p-3">{mapSearchEl}</div>
                  {resultCards}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function StaysSearchClient() {
  return (
    <SearchFiltersProvider mode="short">
      <div className="relative z-[60]">
        <SearchEngineBar />
      </div>
      <StaysSearchResults />
    </SearchFiltersProvider>
  );
}
