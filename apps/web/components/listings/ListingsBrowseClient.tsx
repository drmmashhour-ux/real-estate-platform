"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Columns2, LayoutGrid, Map as MapIcon } from "lucide-react";
import { PLATFORM_NAME } from "@/config/branding";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ListingsGridSkeleton } from "@/components/ui/SkeletonBlock";
import { SearchEngineBar, SearchFiltersProvider, useSearchEngineContext } from "@/components/search/SearchEngine";
import { hasValidMapBounds, urlParamsToGlobalFilters } from "@/components/search/FilterState";
import { MapSearch } from "@/components/search/MapSearch";
import { SmartMapInsightsPanel } from "@/components/search/SmartMapInsightsPanel";
import type { MapListing } from "@/components/map/MapListing";
import { hasValidCoordinates } from "@/components/map/MapListing";
import {
  hasActivePropertyBrowseFilters,
  type PropertyBrowseFilters,
} from "@/lib/buy/property-browse-filters";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";
import { trackLaunchEvent } from "@/src/modules/launch/LaunchTracker";
import { ListingTransactionFlag } from "@/components/listings/ListingTransactionFlag";
import { SearchSmartComparePanel } from "@/components/compare/SearchSmartComparePanel";
import { LISTINGS_MAP_SEARCH_ID } from "@/lib/search/public-map-search-urls";
import { scrollToMapSearchRegion } from "@/lib/ui/scroll-to-map-search";
import { useGeocodedMapFocus } from "@/hooks/useGeocodedMapFocus";
import { computeMapSearchStats } from "@/lib/search/map-search-analytics";
import { BROWSE_EMPTY_LISTINGS } from "@/lib/listings/browse-empty-copy";
import { ListingBadges } from "@/components/listings/ListingBadges";
import { GreenFilterSection } from "@/components/listings/GreenFilterSection";
import { GreenListingBadge } from "@/components/listings/GreenListingBadge";
import { isGreenFiltersActive } from "@/modules/green-ai/green-search-filter.service";
import type { GreenRankingSortMode, GreenSearchFilters } from "@/modules/green-ai/green-search.types";

/** Luxury residential hero — Unsplash (modern home, dusk). */
const LISTINGS_HERO_BG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop";

/** Match server MAX_LIMIT — load more rows for map pins than the gallery page size. */
const MAP_BROWSE_LIMIT = 60;

type Row = {
  kind?: "fsbo" | "crm";
  id: string;
  title: string;
  priceCents: number;
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  coverImage: string | null;
  images: string[];
  propertyType: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  noiseLevel?: string | null;
  familyFriendly?: boolean;
  petsAllowed?: boolean;
  transactionFlag?: {
    key: "offer_received" | "offer_accepted" | "sold";
    label: string;
    tone: "amber" | "emerald" | "slate";
  } | null;
  verifiedListing?: boolean;
  /** FSBO featured window — when active, may show “Top listing” micro-badge */
  featuredUntil?: string | null;
  greenVerifiedListing?: boolean;
  lecipmGreenVerificationLevel?: string | null;
  lecipmGreenConfidence?: number | null;
  green?: {
    currentScore: number | null;
    projectedScore: number | null;
    scoreDelta: number | null;
    label: "GREEN" | "IMPROVABLE" | "LOW" | null;
    quebecLabel: string | null;
    improvementPotential: "high" | "medium" | "low" | null;
    estimatedIncentives: number | null;
    rationale: string[];
    disclaimer: string;
  };
  greenIntelligence?: {
    brokerCallouts: string[];
    rankingBoostSuggestion: number | null;
    rationale: string[];
  };
};

function isFeaturedListingActive(featuredUntil: string | null | undefined): boolean {
  if (featuredUntil == null || featuredUntil === "") return false;
  const t = new Date(featuredUntil).getTime();
  return Number.isFinite(t) && t > Date.now();
}

const EMPTY_PF: PropertyBrowseFilters = {
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

function listingPublicHref(row: Row): string {
  if (row.kind === "fsbo") {
    return buildFsboPublicListingPath({
      id: row.id,
      city: row.city,
      propertyType: row.propertyType,
    });
  }
  return `/listings/${row.id}`;
}

function toMapListing(row: Row, dealKind: "sale" | "rent"): MapListing | null {
  if (!hasValidCoordinates(row)) return null;
  const img = row.coverImage || row.images[0] || null;
  const tf = row.transactionFlag;
  return {
    id: row.id,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    price: row.priceCents / 100,
    title: row.title,
    image: img ?? undefined,
    href: listingPublicHref(row),
    dealKind,
    transactionKey: tf?.key,
    transactionLabel: tf?.label,
    platformListing: row.kind == null || row.kind === "fsbo" || row.kind === "crm",
    mapRatingNote:
      row.kind === "crm"
        ? "Broker hub listing — connect with your agent for buyer feedback and comparables."
        : null,
  };
}

type BrowseProps = { embedded?: boolean; hubMode?: "buy" | "rent"; hideSearchEngineBar?: boolean };

function ListingsBrowseContent({ embedded, hubMode = "buy" }: BrowseProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const spKey = searchParams.toString();
  const { reset, applyPatch } = useSearchEngineContext();

  const [data, setData] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [propertyFilters, setPropertyFilters] = useState<PropertyBrowseFilters>(EMPTY_PF);
  const [greenFilters, setGreenFilters] = useState<GreenSearchFilters>({});
  const [greenSortMode, setGreenSortMode] = useState<GreenRankingSortMode | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [smartCompareIds, setSmartCompareIds] = useState<string[]>([]);
  const [mapFeedRows, setMapFeedRows] = useState<Row[]>([]);
  const [personalizedTopIds, setPersonalizedTopIds] = useState<Set<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const mapDeepLinkScrollKey = useRef<string | null>(null);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const queryString = useMemo(() => {
    const p = new URLSearchParams(spKey);
    p.delete("page");
    return p.toString();
  }, [spKey]);

  const appliedFromUrl = useMemo(() => {
    const base = urlParamsToGlobalFilters(new URLSearchParams(searchParams.toString()));
    if (hubMode === "rent") return { ...base, type: "rent" as const };
    return base;
  }, [searchParams, hubMode]);
  const mapLayout = appliedFromUrl.mapLayout ?? "split";
  const listSort = appliedFromUrl.sort ?? "recommended";
  const prevMapLayoutRef = useRef<"list" | "split" | "map">(mapLayout);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const base = urlParamsToGlobalFilters(new URLSearchParams(searchParams.toString()));
      const f = hubMode === "rent" ? { ...base, type: "rent" as const } : base;
      const gPayload = isGreenFiltersActive(greenFilters) ? greenFilters : undefined;
      const r = await fetch("/api/buyer/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          page,
          limit: 24,
          propertyFilters,
          greenFilters: gPayload,
          greenSortMode: greenSortMode ?? undefined,
          greenAudience: "public",
        }),
        cache: "no-store",
      });
      if (!r.ok) {
        setFetchError(
          r.status >= 500
            ? "Something went wrong — please try again."
            : "Unable to load listings — please try again."
        );
        setData([]);
        setTotal(0);
        return;
      }
      const j = await r.json();
      let rows: Row[] = Array.isArray(j.data) ? j.data : [];
      if (f.sort === "personalized" && rows.length > 0) {
        try {
          const ids = rows.map((row) => row.id).join(",");
          const rec = await fetch(`/api/recommendations/listings?ids=${encodeURIComponent(ids)}&personalization=1`, {
            cache: "no-store",
          });
          const recJson = (await rec.json()) as { items?: { entityId: string; score: number }[] };
          if (rec.ok && Array.isArray(recJson.items)) {
            const scoreMap = new Map(recJson.items.map((it) => [it.entityId, it.score] as const));
            rows = [...rows].sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
            setPersonalizedTopIds(new Set(recJson.items.slice(0, 3).map((it) => it.entityId)));
          } else {
            setPersonalizedTopIds(new Set());
          }
        } catch {
          setPersonalizedTopIds(new Set());
        }
      } else {
        setPersonalizedTopIds(new Set());
      }
      setData(rows);
      setTotal(typeof j.total === "number" ? j.total : 0);
    } catch {
      setFetchError("Something went wrong — please try again.");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchParams, page, propertyFilters, greenFilters, greenSortMode, hubMode]);

  const fetchMapFeed = useCallback(async () => {
    try {
      const params = new URLSearchParams(queryString);
      const base = urlParamsToGlobalFilters(params);
      const f = hubMode === "rent" ? { ...base, type: "rent" as const } : base;
      const gPayload = isGreenFiltersActive(greenFilters) ? greenFilters : undefined;
      const r = await fetch("/api/buyer/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          page: 1,
          limit: MAP_BROWSE_LIMIT,
          propertyFilters,
          greenFilters: gPayload,
          greenSortMode: greenSortMode ?? undefined,
          greenAudience: "public",
        }),
        cache: "no-store",
      });
      if (!r.ok) return;
      const j = await r.json();
      setMapFeedRows(Array.isArray(j.data) ? j.data : []);
    } catch {
      setMapFeedRows([]);
    }
  }, [queryString, hubMode, propertyFilters, greenFilters, greenSortMode]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (mapLayout !== "map" && mapLayout !== "split") return;
    void fetchMapFeed();
  }, [mapLayout, fetchMapFeed]);

  useEffect(() => {
    const prev = prevMapLayoutRef.current;
    let timeoutId: number | undefined;
    if (prev === "list" && (mapLayout === "map" || mapLayout === "split") && !loading && !fetchError && total > 0) {
      timeoutId = window.setTimeout(() => {
        scrollToMapSearchRegion(LISTINGS_MAP_SEARCH_ID, { delayMs: 60, behavior: "smooth" });
      }, 400);
    }
    prevMapLayoutRef.current = mapLayout;
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [mapLayout, loading, fetchError, total]);

  useEffect(() => {
    const ml = searchParams.get("mapLayout");
    if (ml !== "map" && ml !== "split") return;
    if (loading || fetchError) return;
    if (total === 0) return;
    if (mapDeepLinkScrollKey.current === spKey) return;
    mapDeepLinkScrollKey.current = spKey;
    scrollToMapSearchRegion(LISTINGS_MAP_SEARCH_ID, { delayMs: 480 });
  }, [loading, fetchError, total, spKey, searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetch("/api/analytics/public-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "search_performed",
          metadata: { query: queryString.slice(0, 400), page, hubMode, pathname },
        }),
      }).catch(() => {});
      void trackLaunchEvent("SEARCH", {
        query: queryString.slice(0, 400),
        page,
        hubMode,
        pathname,
      });
    }, 900);
    return () => clearTimeout(t);
  }, [queryString, page, hubMode, pathname]);

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
    hasValidMapBounds(appliedFromUrl) &&
    appliedFromUrl.north != null &&
    appliedFromUrl.south != null &&
    appliedFromUrl.east != null &&
    appliedFromUrl.west != null
      ? {
          north: appliedFromUrl.north,
          south: appliedFromUrl.south,
          east: appliedFromUrl.east,
          west: appliedFromUrl.west,
        }
      : null;

  const mapBoundsActive = hasValidMapBounds(appliedFromUrl);
  const locationMapFocus = useGeocodedMapFocus(appliedFromUrl.location, mapBoundsActive);

  const dealKindForMap: "sale" | "rent" = hubMode === "rent" ? "rent" : "sale";
  const rowsForMap = useMemo(() => {
    if (mapLayout !== "map" && mapLayout !== "split") return data;
    return mapFeedRows.length > 0 ? mapFeedRows : data;
  }, [mapLayout, mapFeedRows, data]);
  const mapPins = useMemo(
    () => rowsForMap.map((row) => toMapListing(row, dealKindForMap)).filter((x): x is MapListing => x != null),
    [rowsForMap, dealKindForMap]
  );
  const mapStats = useMemo(() => computeMapSearchStats(mapPins), [mapPins]);

  const setLayout = (layout: "list" | "split" | "map") => {
    applyPatch({ mapLayout: layout });
  };

  const hasMore = page * 24 < total;
  const pfActive = hasActivePropertyBrowseFilters(propertyFilters);

  const toggleSmartCompare = (id: string) => {
    setSmartCompareIds((current) => {
      if (current.includes(id)) return current.filter((entry) => entry !== id);
      if (current.length >= 3) return [...current.slice(1), id];
      return [...current, id];
    });
  };

  const listGrid = useMemo(
    () => (
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((row) => {
          const img = row.coverImage || row.images[0] || null;
          const price = `$${(row.priceCents / 100).toLocaleString("en-CA")}`;
          const inSmartCompare = smartCompareIds.includes(row.id);
          return (
            <Link
              key={row.id}
              id={`listing-card-${row.id}`}
              href={listingPublicHref(row)}
              onMouseEnter={() => setSelectedId(row.id)}
              onMouseLeave={() => setSelectedId(null)}
              className={`group block overflow-hidden rounded-2xl border bg-white/[0.03] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out hover:scale-[1.015] hover:border-premium-gold/40 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.65)] ${
                selectedId === row.id ? "border-premium-gold/50 ring-1 ring-premium-gold/30" : "border-white/10"
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote FSBO URLs vary by env
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-slate-600">
                    {row.kind === "crm" ? (
                      <span className="rounded-full border border-premium-gold/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-premium-gold">
                        Broker CRM
                      </span>
                    ) : null}
                    <span>No photo</span>
                  </div>
                )}
                {img ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 top-[35%] bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                    aria-hidden
                  />
                ) : null}
                <div className="pointer-events-none absolute bottom-3 left-3 z-[2] max-w-[calc(100%-1.5rem)]">
                  {listSort === "personalized" && personalizedTopIds.has(row.id) ?
                    <span className="mb-1 inline-block rounded-full bg-premium-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                      Best match
                    </span>
                  : null}
                  <div className="flex flex-wrap items-center gap-1">
                    <ListingBadges
                      verified={Boolean(row.verifiedListing)}
                      featuredActive={isFeaturedListingActive(row.featuredUntil)}
                      greenVerified={Boolean(row.greenVerifiedListing)}
                      className="drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]"
                    />
                    {row.green ? <GreenListingBadge green={row.green} /> : null}
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                {row.transactionFlag ? (
                  <div className="mb-3">
                    <ListingTransactionFlag flag={row.transactionFlag} />
                  </div>
                ) : null}
                <p className="line-clamp-2 text-sm font-semibold text-white">{row.title}</p>
                <p className="mt-1 text-xl font-bold tracking-tight text-premium-gold">{price}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {row.city}
                  {row.address ? ` · ${row.address}` : ""}
                  {row.bedrooms != null ? ` · ${row.bedrooms} bd` : ""}
                  {row.bathrooms != null ? ` · ${row.bathrooms} ba` : ""}
                  {row.propertyType ? ` · ${row.propertyType.replace(/_/g, " ")}` : ""}
                </p>
                {row.kind === "fsbo" && (row.lecipmGreenVerificationLevel != null || row.lecipmGreenConfidence != null) ? (
                  <p className="mt-1 text-[10px] leading-snug text-slate-500">
                    AI green: {row.lecipmGreenVerificationLevel?.replace(/_/g, " ") ?? "—"}
                    {row.lecipmGreenConfidence != null ? ` · ${row.lecipmGreenConfidence}% confidence` : ""}
                  </p>
                ) : null}
                {row.kind === "fsbo" && (row.noiseLevel || row.familyFriendly || row.petsAllowed) ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.noiseLevel ? (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-premium-text-muted">{row.noiseLevel}</span>
                    ) : null}
                    {row.familyFriendly ? (
                      <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-200">Family</span>
                    ) : null}
                    {row.petsAllowed ? (
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-200">Pets OK</span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleSmartCompare(row.id);
                    }}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                      inSmartCompare
                        ? "bg-premium-gold text-black"
                        : "border border-white/15 bg-white/[0.03] text-slate-300 hover:border-premium-gold/40 hover:text-white"
                    }`}
                  >
                    {inSmartCompare ? "Selected" : "Smart compare"}
                  </button>
                  <span className="text-xs font-medium text-premium-gold transition group-hover:text-[#E8D5A0]">
                    View property →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    ),
    [data, selectedId, smartCompareIds, listSort, personalizedTopIds]
  );

  const mapSearchEl = (
    <MapSearch
      listings={mapPins}
      initialBounds={initialBounds}
      focusPoint={locationMapFocus}
      suppressAutoFit={Boolean(initialBounds)}
      onBoundsChange={onBoundsChange}
      selectedId={selectedId}
      marketMedianPrice={mapStats?.medianPrice ?? null}
      onMarkerClick={(ml) => {
        setSelectedId(ml.id);
        document.getElementById(`listing-card-${ml.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }}
      variant="dark"
      className="h-[420px] w-full"
    />
  );

  const smartMapPanel = (
    <SmartMapInsightsPanel
      listings={mapPins}
      dealKind={dealKindForMap}
      cityHint={appliedFromUrl.location}
      totalListed={total}
      variant="dark"
    />
  );

  const filterPanel = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold/90">Lifestyle, pets &amp; experience</p>
      <p className="mt-1 text-[11px] text-slate-500">Narrow FSBO listings; broker CRM rows hide when these filters are on.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-premium-text-muted">
          Noise
          <select
            value={propertyFilters.noiseLevel ?? ""}
            onChange={(e) =>
              setPropertyFilters((s) => ({
                ...s,
                noiseLevel: (e.target.value || null) as PropertyBrowseFilters["noiseLevel"],
              }))
            }
            className="rounded-lg border border-white/15 bg-[#0B0B0B] px-2 py-1.5 text-sm text-white/85"
          >
            <option value="">Any</option>
            <option value="quiet">Quiet</option>
            <option value="moderate">Moderate</option>
            <option value="lively">Lively</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={Boolean(propertyFilters.familyFriendly)}
            onChange={(e) => setPropertyFilters((s) => ({ ...s, familyFriendly: e.target.checked }))}
            className="rounded border-white/20"
          />
          Family-friendly
        </label>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={Boolean(propertyFilters.partyFriendly)}
            onChange={(e) => setPropertyFilters((s) => ({ ...s, partyFriendly: e.target.checked }))}
            className="rounded border-white/20"
          />
          Party-friendly
        </label>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={Boolean(propertyFilters.petsOnly)}
            onChange={(e) => setPropertyFilters((s) => ({ ...s, petsOnly: e.target.checked }))}
            className="rounded border-white/20"
          />
          Pets allowed
        </label>
        <label className="flex flex-col gap-1 text-xs text-premium-text-muted">
          Pet type
          <select
            value={propertyFilters.petType ?? ""}
            onChange={(e) =>
              setPropertyFilters((s) => ({
                ...s,
                petType: (e.target.value || null) as PropertyBrowseFilters["petType"],
              }))
            }
            className="rounded-lg border border-white/15 bg-[#0B0B0B] px-2 py-1.5 text-sm text-white/85"
          >
            <option value="">Any</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-premium-text-muted">
          Pet weight (kg)
          <input
            type="number"
            min={0}
            step={1}
            placeholder="—"
            value={propertyFilters.guestPetWeightKg ?? ""}
            onChange={(e) =>
              setPropertyFilters((s) => ({
                ...s,
                guestPetWeightKg: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-2 py-1.5 text-sm text-white/85"
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
            ["svcParking", "Parking"],
            ["svcShuttle", "Shuttle"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={Boolean(propertyFilters[key])}
              onChange={(e) => setPropertyFilters((s) => ({ ...s, [key]: e.target.checked }))}
              className="rounded border-white/20"
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void fetchList()}
          className="rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-[#0B0B0B] hover:bg-premium-gold"
        >
          Apply lifestyle filters
        </button>
        {pfActive ? (
          <button
            type="button"
            onClick={() => {
              setPropertyFilters(EMPTY_PF);
            }}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Clear lifestyle
          </button>
        ) : null}
      </div>
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(total / 24));

  const goToPage = (nextPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) p.delete("page");
    else p.set("page", String(nextPage));
    router.push(`${pathname}?${p.toString()}`);
  };

  const viewModes = [
    { id: "list" as const, label: "Gallery", Icon: LayoutGrid },
    { id: "map" as const, label: "Map", Icon: MapIcon },
    { id: "split" as const, label: "Split", Icon: Columns2 },
  ];

  const resultsToolbar = (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-base font-medium text-white">
        {loading ? (
          <span className="text-premium-text-muted">Searching…</span>
        ) : (
          <>
            <span className="text-premium-gold">{total.toLocaleString()}</span>{" "}
            <span className="text-white/80">propert{total === 1 ? "y" : "ies"} found</span>
            {pfActive ? (
              <span className="ml-2 text-xs font-normal text-premium-gold">· Lifestyle filters on</span>
            ) : null}
          </>
        )}
      </p>

      {!loading && data.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start lg:flex-1 lg:justify-center">
          {viewModes.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setLayout(id)}
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                mapLayout === id
                  ? "bg-premium-gold/20 text-premium-gold ring-1 ring-premium-gold/40"
                  : "text-premium-text-muted hover:bg-white/5 hover:text-white/85",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 opacity-90" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="hidden lg:block lg:flex-1" aria-hidden />
      )}

      {(mapLayout === "split" || mapLayout === "map") && !loading && total > 0 ? (
        <p className="w-full text-center text-xs text-slate-500 lg:text-left">
          Tap <span className="font-medium text-premium-gold/90">Map</span> to jump here. Pan or zoom to search this area — up to {MAP_BROWSE_LIMIT} pins match your filters. Tap a flag for ask price vs median on the map.
        </p>
      ) : null}

      <div className="flex items-center gap-2 lg:min-w-[200px] lg:justify-end">
        <label className="sr-only" htmlFor="listings-sort">
          Sort results
        </label>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Sort</span>
        <select
          id="listings-sort"
          value={listSort}
          onChange={(e) => {
            applyPatch({ sort: e.target.value, page: 1 });
          }}
          className="rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-sm text-white/85 focus:border-premium-gold/45 focus:outline-none focus:ring-1 focus:ring-premium-gold/30"
        >
          <option value="recommended">Recommended</option>
          <option value="personalized">For you (personalized)</option>
          <option value="newest">Newest</option>
          <option value="priceAsc">Price · Low to high</option>
          <option value="priceDesc">Price · High to low</option>
        </select>
      </div>
    </div>
  );

  const paginationBar =
    !loading && !fetchError && total > 0 ? (
      <div className="flex flex-wrap items-center justify-center gap-2 py-4 text-sm text-white/80">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(1)}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-premium-text-muted hover:bg-white/5 disabled:opacity-30"
          aria-label="First page"
        >
          «
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-premium-text-muted hover:bg-white/5 disabled:opacity-30"
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="min-w-[8rem] text-center tabular-nums text-premium-text-muted">
          {page} / {totalPages}
          {hasMore ? "+" : ""}
        </span>
        <button
          type="button"
          disabled={!hasMore}
          onClick={() => goToPage(page + 1)}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-premium-text-muted hover:bg-white/5 disabled:opacity-30"
          aria-label="Next page"
        >
          ›
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => goToPage(totalPages)}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-premium-text-muted hover:bg-white/5 disabled:opacity-30"
          aria-label="Last page"
        >
          »
        </button>
      </div>
    ) : null;

  const greenSection = (
    <details className="mt-6 rounded-2xl border border-emerald-500/20 bg-white/[0.02] open:bg-white/[0.03]">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-emerald-200/95 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          Green search (Québec-inspired)
          <span className="text-xs font-normal text-slate-500">(optional — modeled signals only)</span>
        </span>
      </summary>
      <div className="border-t border-white/10 px-4 pb-4 pt-3">
        <GreenFilterSection
          greenFilters={greenFilters}
          onChange={setGreenFilters}
          sortMode={greenSortMode}
          onSortMode={setGreenSortMode}
          brokerView={false}
        />
      </div>
    </details>
  );

  const lifestyleSection = (
    <details className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] open:bg-white/[0.03]">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-premium-gold [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          Lifestyle &amp; experience
          <span className="text-xs font-normal text-slate-500">(optional — refines FSBO matches)</span>
        </span>
      </summary>
      <div className="border-t border-white/10 px-4 pb-4 pt-2">{filterPanel}</div>
    </details>
  );

  const grid = (
    <>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {resultsToolbar}

        {!loading && !fetchError && total > 0 ? (
          <div className="mt-5 rounded-2xl border border-premium-gold/25 bg-gradient-to-br from-premium-gold/[0.06] to-white/[0.02] px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold tracking-tight text-premium-gold">AI Recommended listings</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Results are ranked for fit against your filters and platform signals. Change location or filters to refresh
              suggestions.
            </p>
          </div>
        ) : null}

        {data.length > 1 ? (
          <div className="mt-6">
            <SearchSmartComparePanel
              rows={data}
              selectedIds={smartCompareIds}
              onRemove={(id) => setSmartCompareIds((current) => current.filter((entry) => entry !== id))}
              onClear={() => setSmartCompareIds([])}
            />
          </div>
        ) : null}

        {greenSection}

        {lifestyleSection}

        {paginationBar}

        {process.env.NODE_ENV === "development" && queryString ? (
          <p className="mt-2 font-mono text-[10px] text-slate-600">
            ?{queryString}
          </p>
        ) : null}

        {fetchError ? (
          <div className="mt-8">
            <ErrorState message={fetchError} onRetry={() => void fetchList()} />
          </div>
        ) : loading ? (
          <div className="mt-8">
            <ListingsGridSkeleton count={6} />
          </div>
        ) : (
          <div ref={listRef} className="mt-6 space-y-4">
            {mapLayout === "list" && listGrid}
            {mapLayout === "split" && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]">
                <div className="min-w-0">{listGrid}</div>
                <div
                  id={LISTINGS_MAP_SEARCH_ID}
                  className="space-y-4 scroll-mt-28 lg:order-2 lg:scroll-mt-24"
                >
                  {smartMapPanel}
                  {mapSearchEl}
                </div>
              </div>
            )}
            {mapLayout === "map" && (
              <div className="space-y-4">
                <div id={LISTINGS_MAP_SEARCH_ID} className="w-full space-y-4 scroll-mt-28 lg:scroll-mt-24">
                  {smartMapPanel}
                  {mapSearchEl}
                </div>
                {listGrid}
              </div>
            )}
          </div>
        )}

        {!loading && !fetchError && data.length === 0 ? (
          <div className="mt-12">
            <EmptyState title={BROWSE_EMPTY_LISTINGS.title} description={BROWSE_EMPTY_LISTINGS.description}>
              <>
                <button type="button" onClick={reset} className="lecipm-cta-gold-solid min-h-[44px] px-6 py-2.5 text-sm">
                  Reset filters
                </button>
                <Link
                  href="/explore"
                  className="lecipm-cta-gold-outline inline-flex min-h-[44px] items-center justify-center px-6 py-2.5 text-sm"
                >
                  Browse featured listings
                </Link>
              </>
            </EmptyState>
          </div>
        ) : null}

      </div>
    </>
  );

  if (embedded) {
    return grid;
  }

  return <main className="min-h-screen bg-brand-background pb-24 text-white">{grid}</main>;
}

export function ListingsBrowseClient({
  embedded = false,
  hubMode = "buy",
  hideSearchEngineBar = false,
}: BrowseProps) {
  const mode = hubMode === "rent" ? "rent" : "buy";
  return (
    <SearchFiltersProvider mode={mode}>
      {embedded ? (
        <div className="bg-[#0B0B0B] pb-16 text-white">
          {!hideSearchEngineBar ? (
            <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
              <h2 className="text-lg font-semibold text-white">
                {hubMode === "rent" ? "Search rentals" : "Search properties"}
              </h2>
              <p className="mt-1 text-xs font-normal leading-snug text-white/50">Find the right property faster</p>
              <p className="mt-1 text-xs text-slate-500">Filters sync to the URL — share or bookmark your results.</p>
              <div className="mt-4">
                <SearchEngineBar />
              </div>
            </div>
          ) : null}
          <ListingsBrowseContent embedded hubMode={hubMode} />
        </div>
      ) : (
        <>
          <section className="relative isolate min-h-[min(78vh,840px)] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('${LISTINGS_HERO_BG}')` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/55 to-[#0B0B0B]" aria-hidden />
            <div className="relative z-10 mx-auto flex max-w-5xl flex-col px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-14">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-premium-gold/95">
                {PLATFORM_NAME}
              </p>
              <h1 className="mt-4 text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.1]">
                {hubMode === "rent"
                  ? "Find your next long-term rental"
                  : "Step into your next home in Québec"}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-center text-xs font-normal leading-snug text-white/55 sm:text-sm sm:text-white/60">
                Find the right property faster
              </p>
              <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-white/90 sm:text-lg">
                Public catalog — no sign-in required. Filters sync to the URL so you can share or bookmark your search.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/75">
                <span className="font-medium text-premium-gold">AI</span> — shortlist a property, then{" "}
                <Link href="/analyze" className="text-white underline decoration-premium-gold/80 underline-offset-2 hover:text-white">
                  run investment analysis
                </Link>{" "}
                or{" "}
                <Link href="/dashboard/ai" className="text-white underline decoration-premium-gold/80 underline-offset-2 hover:text-white">
                  open the AI workspace
                </Link>
                .
              </p>
              <div className="mt-10 w-full">
                <SearchEngineBar barTone="light" heroLayout />
              </div>
            </div>
          </section>
          <ListingsBrowseContent embedded={false} hubMode={hubMode} />
        </>
      )}
    </SearchFiltersProvider>
  );
}
