"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { SearchEngineBar, SearchFiltersProvider, useSearchEngineContext } from "@/components/search/SearchEngine";
import { hasValidMapBounds, type GlobalSearchFiltersExtended } from "@/components/search/FilterState";
import { MapSearch } from "@/components/search/MapSearch";
import type { MapListing } from "@/components/map/MapListing";
import { hasValidCoordinates } from "@/components/map/MapListing";
import type { StaysSearchFilters } from "@/lib/bnhub/stays-filters";

type Listing = {
  id: string;
  listingCode?: string;
  title: string;
  city: string;
  nightPriceCents: number;
  photos: unknown;
  verificationStatus: string;
  maxGuests: number;
  beds: number;
  baths: number;
  latitude: number | null;
  longitude: number | null;
  noiseLevel?: string | null;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
  _count: { reviews: number };
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
    href: `/bnhub/${l.id}`,
  };
}

function StaysSearchResults() {
  const { applied, reset, applyPatch, setFiltersOpen, activeFilterCount } = useSearchEngineContext();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [smartQuery, setSmartQuery] = useState("");
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [intentNote, setIntentNote] = useState<string | null>(null);
  const sugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [staysFilters, setStaysFilters] = useState<StaysSearchFilters>({
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
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
  const mapPins = listings.map(toMapListing).filter((x): x is MapListing => x != null);

  const onBoundsChange = useCallback(
    (b: { north: number; south: number; east: number; west: number }) => {
      applyPatch({
        north: b.north,
        south: b.south,
        east: b.east,
        west: b.west,
      });
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

  const hasActiveFilters = activeFilterCount > 0;

  const mapSearchEl = (
    <MapSearch
      listings={mapPins}
      initialBounds={initialBounds}
      onBoundsChange={onBoundsChange}
      selectedId={selectedId}
      onMarkerClick={(ml) => {
        setSelectedId(ml.id);
        document.getElementById(`stay-card-${ml.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }}
      variant="dark"
      className="h-[420px] w-full"
    />
  );

  const listGrid = useMemo(
    () => (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            id={`stay-card-${listing.id}`}
            href={`/bnhub/${listing.id}`}
            onMouseEnter={() => setSelectedId(listing.id)}
            onMouseLeave={() => setSelectedId(null)}
            className={`group flex flex-col overflow-hidden rounded-2xl border bg-slate-900/50 transition hover:border-slate-700 hover:shadow-xl hover:shadow-black/20 ${
              selectedId === listing.id ? "border-emerald-500/60 ring-1 ring-emerald-500/40" : "border-slate-800"
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
              {photoFirst(listing) ? (
                <img
                  src={photoFirst(listing)!}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-600">No photo</div>
              )}
              <span className="absolute left-3 top-3 rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-sm font-semibold text-white shadow">
                ${(listing.nightPriceCents / 100).toFixed(0)}
                <span className="font-normal text-slate-400"> / night</span>
              </span>
              {listing.verificationStatus === "VERIFIED" && (
                <span className="absolute right-3 top-3 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-medium text-slate-950">
                  Verified
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h2 className="font-semibold text-slate-100 group-hover:text-emerald-300/90">{listing.title}</h2>
              {listing.listingCode ? (
                <p className="mt-1 font-mono text-xs text-slate-500">{listing.listingCode}</p>
              ) : null}
              <p className="mt-1 text-sm text-slate-400">
                {listing.city} · {listing.beds} bed{listing.beds !== 1 ? "s" : ""} · {listing.baths} bath
                {listing.baths !== 1 ? "s" : ""} · up to {listing.maxGuests} guests
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {listing.noiseLevel ? (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{listing.noiseLevel}</span>
                ) : null}
                {listing.familyFriendly ? (
                  <span className="rounded bg-sky-900/40 px-1.5 py-0.5 text-[10px] text-sky-200">Family</span>
                ) : null}
                {listing.petsAllowed ? (
                  <span className="rounded bg-emerald-900/40 px-1.5 py-0.5 text-[10px] text-emerald-200">Pets OK</span>
                ) : null}
              </div>
              {listing._count.reviews > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  {listing._count.reviews} review{listing._count.reviews !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    ),
    [listings, selectedId]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/30 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Smart search (intent + suggestions)
        </p>
        <div className="relative flex flex-wrap items-start gap-2">
          <div className="relative min-w-[200px] flex-1">
            <input
              type="text"
              placeholder='Try: "cheap condo near metro"'
              value={smartQuery}
              onChange={(e) => setSmartQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoComplete="off"
            />
            {smartSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 z-20 mt-1 max-h-44 overflow-auto rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-xl">
                {smartSuggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
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
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/15"
          >
            Apply AI to filters
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Rule-based only — prices are nightly caps for stays, not home sale values.
        </p>
        {intentNote && <p className="mt-2 text-xs text-emerald-400/90">{intentNote}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-slate-700 p-0.5">
          {(["list", "split", "map"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLayout(mode)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${
                mapLayout === mode ? "bg-emerald-500/20 text-emerald-200" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {mode === "split" ? "Map + list" : mode}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {mapPins.length} with map pins · {listings.length} results
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lifestyle &amp; pets</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-slate-500">Noise</span>
            <select
              value={staysFilters.noiseLevel ?? ""}
              onChange={(e) =>
                setStaysFilters((s) => ({
                  ...s,
                  noiseLevel: (e.target.value || null) as StaysSearchFilters["noiseLevel"],
                }))
              }
              className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-[13px]"
            >
              <option value="">Any</option>
              <option value="quiet">Quiet</option>
              <option value="moderate">Moderate</option>
              <option value="lively">Lively</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={staysFilters.familyFriendly}
              onChange={(e) => setStaysFilters((s) => ({ ...s, familyFriendly: e.target.checked }))}
              className="rounded border-slate-600"
            />
            Family-friendly
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={staysFilters.partyFriendly}
              onChange={(e) => setStaysFilters((s) => ({ ...s, partyFriendly: e.target.checked }))}
              className="rounded border-slate-600"
            />
            Party-friendly
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={staysFilters.petsOnly}
              onChange={(e) => setStaysFilters((s) => ({ ...s, petsOnly: e.target.checked }))}
              className="rounded border-slate-600"
            />
            Pets allowed
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-slate-500">Pet type</span>
            <select
              value={staysFilters.petType ?? ""}
              onChange={(e) =>
                setStaysFilters((s) => ({
                  ...s,
                  petType: (e.target.value || null) as StaysSearchFilters["petType"],
                }))
              }
              className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-[13px]"
            >
              <option value="">Any</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <span className="text-slate-500">Pet weight (kg)</span>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="—"
              value={staysFilters.guestPetWeightKg ?? ""}
              onChange={(e) =>
                setStaysFilters((s) => ({
                  ...s,
                  guestPetWeightKg: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-20 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-[13px]"
            />
          </label>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Experience &amp; services</p>
        <div className="mt-2 flex flex-wrap gap-3">
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
            <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(staysFilters[key])}
                onChange={(e) => setStaysFilters((s) => ({ ...s, [key]: e.target.checked }))}
                className="rounded border-slate-600"
              />
              {label}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void fetchListings()}
          className="mt-3 rounded-lg bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-600/30"
        >
          Apply stay filters
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-500" />
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-slate-400">No listings match your search. Try different dates or location.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Clear filters
            </button>
            <Link href="/bnhub/host/dashboard" className="text-sm font-medium text-slate-400 hover:text-slate-300">
              List your property →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {listings.length} stay{listings.length !== 1 ? "s" : ""} found
            {hasActiveFilters ? " · filters active" : ""}
          </p>

          <div ref={listRef} className="space-y-4">
            {mapLayout === "list" && listGrid}
            {mapLayout === "split" && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]">
                <div className="min-w-0">{listGrid}</div>
                <div className="min-h-[420px] lg:order-2">{mapSearchEl}</div>
              </div>
            )}
            {mapLayout === "map" && (
              <div className="space-y-4">
                <div className="min-h-[420px] w-full">{mapSearchEl}</div>
                {listGrid}
              </div>
            )}
          </div>
        </>
      )}
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
