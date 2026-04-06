"use client";

import { useState, useEffect, useCallback, useRef, useMemo, useId } from "react";
import Link from "next/link";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { SearchEngineBar, SearchFiltersProvider, useSearchEngineContext } from "@/components/search/SearchEngine";
import { hasValidMapBounds, type GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import type { MapBoundsWgs84 } from "@/components/search/MapSearchAdapter";
import { MapSearch } from "@/components/search/MapSearch";
import type { MapListing } from "@/components/map/MapListing";
import { hasValidCoordinates } from "@/components/map/MapListing";
import { hasActiveStaysFilters, type StaysSearchFilters } from "@/lib/bnhub/stays-filters";
import { trackBehaviorEvent } from "@/lib/learning/client/trackBehaviorEvent";
import { StaysAccessibilityToolbar } from "@/components/accessibility/StaysAccessibilityToolbar";

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

function toMapListing(l: Listing): MapListing | null {
  if (!hasValidCoordinates(l)) return null;
  const img = photoFirst(l);
  return {
    id: l.id,
    latitude: l.latitude as number,
    longitude: l.longitude as number,
    price: l.nightPriceCents / 100,
    title: l.title,
    image: img ?? undefined,
    href: `/bnhub/stays/${l.id}`,
    aiScore: typeof l.aiScore === "number" ? l.aiScore : undefined,
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
  const { applied, reset, applyPatch, setFiltersOpen, filtersOpen, activeFilterCount } = useSearchEngineContext();
  const smartQueryInputId = useId();
  const sortSelectId = useId();
  const mapLayoutSelectId = useId();

  const [listings, setListings] = useState<Listing[]>([]);
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

  const mapLayout = applied.mapLayout ?? "list";
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

  const setLayout = (layout: "list" | "split" | "map") => {
    applyPatch({ mapLayout: layout });
  };

  const mapSearchEl = (
    <MapSearch
      listings={mapPins}
      initialBounds={initialBounds}
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
              onClick={() => {
                fetch("/api/search/events", {
                  method: "POST",
                  credentials: "same-origin",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ eventType: "CLICK", listingId: listing.id }),
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
              className={`group grid gap-4 overflow-hidden rounded-2xl border bg-white p-4 transition hover:shadow-lg md:grid-cols-[240px_minmax(0,1fr)_180px] ${
                selectedId === listing.id ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/35" : "border-slate-200"
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
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
                      <h2 className="text-2xl font-bold leading-tight text-[#006ce4] group-hover:underline">{listing.title}</h2>
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
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium">{listing.city}</span>
                      {listing.region ? <span>{listing.region}</span> : null}
                      <span className="inline-flex items-center gap-1 text-[#006ce4]">
                        <MapPin className="h-3.5 w-3.5" />
                        Show on map
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{reviewLabel(reviewScore)}</p>
                      <p className="text-xs text-slate-500">
                        {listing._count.reviews > 0 ? `${listing._count.reviews.toLocaleString()} reviews` : "New listing"}
                      </p>
                    </div>
                    <div className="rounded-md bg-[#003b95] px-2.5 py-1 text-sm font-bold text-white">{reviewScore}</div>
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-900">
                  {listing.propertyType ?? "Stay"} · {listing.roomType ?? "Entire place"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {listing.beds} bed{listing.beds !== 1 ? "s" : ""} · {listing.baths} bathroom
                  {listing.baths !== 1 ? "s" : ""} · up to {listing.maxGuests} guests
                </p>
                {listing.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{listing.description}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.verificationStatus === "VERIFIED" ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Verified stay
                    </span>
                  ) : null}
                  {listing.familyFriendly ? (
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      Family-friendly
                    </span>
                  ) : null}
                  {listing.petsAllowed ? (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      Pets allowed
                    </span>
                  ) : null}
                  {listing.noiseLevel ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                      {listing.noiseLevel}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Per night</p>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">{formatCurrency(listing.nightPriceCents)}</p>
                  <p className="mt-1 text-xs text-slate-500">Taxes and fees may apply</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-emerald-700">Free cancellation</p>
                  {listing.listingCode ? <p className="font-mono text-[11px] text-slate-400">{listing.listingCode}</p> : null}
                  <span className="inline-flex w-full items-center justify-center rounded-lg bg-[#006ce4] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0057b8]">
                    See availability
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    ),
    [listings, selectedId, showAiDebug, medianNightCents]
  );

  const checkboxClass = "h-4 w-4 rounded border-slate-300 text-[#006ce4] focus:ring-[#006ce4]";
  const sidebarCardClass = "rounded-2xl border border-slate-200 bg-white p-5";

  return (
    <div className="space-y-6 bg-[#f5f7fa] text-slate-900">
      <section
        id="stays-smart-search"
        aria-labelledby="stays-smart-search-heading"
        className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <h2 id="stays-smart-search-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#006ce4] focus:outline-none focus:ring-1 focus:ring-[#006ce4]"
              autoComplete="off"
            />
            {smartSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 z-20 mt-1 max-h-44 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                {smartSuggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
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
            className="rounded-lg border border-[#006ce4]/30 bg-[#006ce4]/5 px-4 py-2.5 text-sm font-medium text-[#006ce4] hover:bg-[#006ce4]/10"
            aria-label="Apply suggested filters from smart search"
          >
            Apply AI to filters
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Rule-based only. Use this to narrow the results faster, then refine with the sidebar.</p>
        {intentNote ? <p className="mt-2 text-xs text-[#006ce4]">{intentNote}</p> : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside aria-label="Stay search filters" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className={sidebarCardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Filter for your perfect stay</p>
                <p className="text-xs text-slate-500">
                  {hasActiveFilters ? "Some filters are active." : "No extra filters applied yet."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setStaysFilters(DEFAULT_STAY_FILTERS);
                }}
                className="text-xs font-semibold text-[#006ce4] hover:underline"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <label htmlFor={sortSelectId} className="block text-sm font-semibold text-slate-900">
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
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="recommended">AI recommended</option>
              <option value="priceAsc">Price: low to high</option>
              <option value="priceDesc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">AI ranking blends relevance, demand, value, and your preferences when signed in.</p>
          </div>

          <div className={sidebarCardClass}>
            <p className="text-sm font-semibold text-slate-900">Your budget per night</p>
            <label className="mt-4 block text-sm text-slate-600">
              Max nightly price
              <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={applied.priceMax && applied.priceMax > 0 ? applied.priceMax : 1000}
                onChange={(e) => applyPatch({ priceMax: Number(e.target.value) })}
                className="mt-2 w-full accent-[#006ce4]"
              />
            </label>
            <p className="mt-2 text-sm font-medium text-slate-800">
              Up to {formatCurrency((applied.priceMax && applied.priceMax > 0 ? applied.priceMax : 1000) * 100)}
            </p>
          </div>

          <div className={sidebarCardClass}>
            <p className="text-sm font-semibold text-slate-900">Popular filters</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
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
          </div>

          <div className={sidebarCardClass}>
            <p className="text-sm font-semibold text-slate-900">Bedrooms and bathrooms</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-600">
                Bedrooms
                <select
                  value={applied.bedrooms ?? ""}
                  onChange={(e) => applyPatch({ bedrooms: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </label>
              <label className="text-sm text-slate-600">
                Bathrooms
                <select
                  value={applied.bathrooms ?? ""}
                  onChange={(e) => applyPatch({ bathrooms: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
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
            <p className="text-sm font-semibold text-slate-900">Lifestyle and pets</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-600">
                Noise level
                <select
                  value={staysFilters.noiseLevel ?? ""}
                  onChange={(e) =>
                    setStaysFilters((s) => ({
                      ...s,
                      noiseLevel: (e.target.value || null) as StaysSearchFilters["noiseLevel"],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="quiet">Quiet</option>
                  <option value="moderate">Moderate</option>
                  <option value="lively">Lively</option>
                </select>
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={staysFilters.partyFriendly}
                  onChange={(e) => setStaysFilters((s) => ({ ...s, partyFriendly: e.target.checked }))}
                  className={checkboxClass}
                />
                Party-friendly
              </label>
              <label className="block text-sm text-slate-600">
                Pet type
                <select
                  value={staysFilters.petType ?? ""}
                  onChange={(e) =>
                    setStaysFilters((s) => ({
                      ...s,
                      petType: (e.target.value || null) as StaysSearchFilters["petType"],
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="block text-sm text-slate-600">
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
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>

          <div className={sidebarCardClass}>
            <p className="text-sm font-semibold text-slate-900">Experience and services</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
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
              className="mt-4 w-full rounded-lg bg-[#006ce4] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0057b8]"
            >
              Apply stay filters
            </button>
          </div>
        </aside>

        <section aria-label="Stay listings and map" className="min-w-0 space-y-4">
          <StaysAccessibilityToolbar />
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {applied.location?.trim() || "BNHub"}: {listings.length} propert{listings.length === 1 ? "y" : "ies"} found
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {hasActiveFilters ? "Filters active on this search." : "Search verified stays and compare availability."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMapInline((v) => !v)}
                  aria-expanded={showMapInline}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  aria-label={showMapInline ? "Hide map preview above results" : "Show map preview above results"}
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  {showMapInline ? "Hide map" : "Show on map"}
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  aria-expanded={filtersOpen}
                  aria-controls="search-filters-panel"
                  aria-label="Open full search filters panel"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  Filters
                  {activeFilterCount > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-900">{activeFilterCount}</span>
                  ) : null}
                </button>
                <label htmlFor={mapLayoutSelectId} className="sr-only">
                  Choose layout: list only, map with list, or map first
                </label>
                <select
                  id={mapLayoutSelectId}
                  value={mapLayout}
                  onChange={(e) => setLayout(e.target.value as "list" | "split" | "map")}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  <option value="list">List view</option>
                  <option value="split">Map + list</option>
                  <option value="map">Map first</option>
                </select>
              </div>
            </div>
          </div>

          {showMapInline ? <div className="rounded-2xl border border-slate-200 bg-white p-3">{mapSearchEl}</div> : null}

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#006ce4]" />
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-600">No listings match your search. Try different dates, price, or stay preferences.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => reset()} className="text-sm font-medium text-[#006ce4] hover:underline">
                  Clear filters
                </button>
                <Link href="/bnhub/host/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  List your property →
                </Link>
              </div>
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
                  <div className="sticky top-24 h-fit rounded-2xl border border-slate-200 bg-white p-3">{mapSearchEl}</div>
                </div>
              )}
              {mapLayout === "map" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">{mapSearchEl}</div>
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
