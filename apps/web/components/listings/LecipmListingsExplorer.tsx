"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapSearch } from "@/components/search/MapSearch";
import { SmartMapInsightsPanel } from "@/components/search/SmartMapInsightsPanel";
import { SearchFiltersProvider, useSearchEngineContext } from "@/components/search/SearchEngine";
import {
  hasValidMapBounds,
  OPEN_FULL_PROPERTY_FILTERS_PARAM,
  urlParamsToGlobalFilters,
} from "@/components/search/FilterState";
import type { MapListing } from "@/components/map/MapListing";
import { hasValidCoordinates } from "@/components/map/MapListing";
import { buildFsboPublicListingPath } from "@/lib/seo/public-urls";
import { parseListingCodeFromSearchQuery } from "@/lib/listing-code-public";
import ListingCard from "@/components/listings/ListingCard";
import GoogleListingsMap from "@/components/maps/GoogleListingsMap";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuebecLocationInput } from "@/components/search/QuebecLocationInput";
import { LISTINGS_MAP_SEARCH_ID } from "@/lib/search/public-map-search-urls";
import { scrollToMapSearchRegion } from "@/lib/ui/scroll-to-map-search";
import { useGeocodedMapFocus } from "@/hooks/useGeocodedMapFocus";
import { computeMapSearchStats } from "@/lib/search/map-search-analytics";
import { useConversionEngineFlags } from "@/lib/conversion/use-conversion-engine-flags";
import { recordListingsExplorerViewOnce } from "@/modules/conversion/funnel-metrics.service";
import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";
import { cn } from "@/lib/utils";

/** Phase 4: flip to restore interactive `MapSearch` alongside `GoogleListingsMap`. */
const SHOW_LEGACY_MAP_SEARCH = false;

const SEARCH_REASSURANCE_LINE =
  "Verified listings where marked · Clear prices · Secure platform";

const ACCENT = "#D4AF37";
const PRICE_MAX_SLIDER = 3_000_000;
const PRICE_STEP = 25_000;

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
  transactionFlag?: {
    key: "offer_received" | "offer_accepted" | "sold";
    label: string;
    tone: "amber" | "emerald" | "slate";
  } | null;
  verifiedListing?: boolean;
  featuredUntil?: string | null;
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

/** URL/query source of truth: `mapLayout` — aligns list / split / map chrome across viewports. */
type BrowseViewMode = "list" | "split" | "map";

function mergeFeatures(features: string[], key: string, on: boolean): string[] {
  const s = new Set(features.map((x) => x.toLowerCase()));
  const k = key.toLowerCase();
  if (on) s.add(k);
  else s.delete(k);
  return Array.from(s);
}

function LecipmListingsExplorerInner() {
  const conversionEngineFlags = useConversionEngineFlags();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mobileBrowseFiltersRef = useRef<HTMLDivElement>(null);
  const { reset, applyPatch } = useSearchEngineContext();
  const resetFilters = reset;

  const [data, setData] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  /** Narrow viewport only: when `viewMode === "split"`, which full-width pane is shown. Not stored in URL. */
  const [splitMobilePane, setSplitMobilePane] = useState<"list" | "map">("list");
  const [mqLg, setMqLg] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const fn = () => setMqLg(m.matches);
    fn();
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    recordListingsExplorerViewOnce(pathname || "listings");
  }, [pathname]);

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const appliedFromUrl = useMemo(() => urlParamsToGlobalFilters(new URLSearchParams(searchParams.toString())), [searchParams]);

  const viewMode: BrowseViewMode = appliedFromUrl.mapLayout ?? "split";

  useEffect(() => {
    const city = searchParams.get("city") ?? "";
    setSearchDraft(city);
  }, [searchParams]);

  const [priceMinL, setPriceMinL] = useState(appliedFromUrl.priceMin);
  const [priceMaxL, setPriceMaxL] = useState(appliedFromUrl.priceMax > 0 ? appliedFromUrl.priceMax : PRICE_MAX_SLIDER);
  useEffect(() => {
    setPriceMinL(appliedFromUrl.priceMin);
    setPriceMaxL(appliedFromUrl.priceMax > 0 ? appliedFromUrl.priceMax : PRICE_MAX_SLIDER);
  }, [appliedFromUrl.priceMin, appliedFromUrl.priceMax]);

  const priceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuePriceApply = useCallback(
    (min: number, max: number) => {
      if (priceDebounce.current) clearTimeout(priceDebounce.current);
      priceDebounce.current = setTimeout(() => {
        applyPatch({ priceMin: min, priceMax: max === PRICE_MAX_SLIDER ? 0 : max });
      }, 320);
    },
    [applyPatch]
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const f = urlParamsToGlobalFilters(new URLSearchParams(searchParams.toString()));
      const r = await fetch("/api/buyer/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, page, limit: 24 }),
        cache: "no-store",
      });
      if (!r.ok) {
        setFetchError(r.status >= 500 ? "Something went wrong — try again." : "Unable to load listings.");
        setData([]);
        setTotal(0);
        return;
      }
      const j = await r.json();
      setData(Array.isArray(j.data) ? j.data : []);
      setTotal(typeof j.total === "number" ? j.total : 0);
    } catch {
      setFetchError("Something went wrong — try again.");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

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

  const dealKindForMap: "sale" | "rent" = appliedFromUrl.type === "rent" ? "rent" : "sale";
  const mapPins = useMemo(
    () => data.map((row) => toMapListing(row, dealKindForMap)).filter((x): x is MapListing => x != null),
    [data, dealKindForMap]
  );
  const mapStats = useMemo(() => computeMapSearchStats(mapPins), [mapPins]);

  /** Same SearchEngine + full filter panel as Buy hub (/buy); preserves current URL filters. */
  const buyHubFullFiltersHref = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.set(OPEN_FULL_PROPERTY_FILTERS_PARAM, "1");
    return `/buy?${p.toString()}`;
  }, [searchParams]);

  const focusListingsMap = () => scrollToMapSearchRegion(LISTINGS_MAP_SEARCH_ID, { delayMs: 220 });

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
        document.getElementById(`lecipm-card-${ml.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }}
      variant="dark"
      className="h-[min(52vh,420px)] w-full lg:h-[calc(100vh-5.5rem)] lg:min-h-[480px]"
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

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchDraft.trim();
    if (!raw) {
      applyPatch({ location: "" });
      return;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
      router.push(`/listings/${encodeURIComponent(raw)}`);
      return;
    }
    const code = parseListingCodeFromSearchQuery(raw);
    if (code) {
      try {
        const res = await fetch(`/api/listings/resolve-code?code=${encodeURIComponent(code)}`);
        const data = (await res.json()) as { url?: string };
        if (res.ok && data.url) {
          router.push(data.url);
          return;
        }
      } catch {
        /* fall through */
      }
      router.push(`/listings/not-found?code=${encodeURIComponent(code)}`);
      return;
    }
    applyPatch({ location: raw });
  };

  const selectedPropertyTypes = appliedFromUrl.propertyTypes?.length
    ? appliedFromUrl.propertyTypes[0]?.toUpperCase() ?? ""
    : appliedFromUrl.propertyType?.trim().toUpperCase() ?? "";

  const isPropertyTypeSegmentSelected = (val: "" | "HOUSE" | "CONDO" | "APARTMENT") =>
    val === "" ? selectedPropertyTypes === "" : selectedPropertyTypes === val;

  const setPropertyType = (t: "" | "HOUSE" | "CONDO" | "APARTMENT") => {
    if (!t) applyPatch({ propertyTypes: [], propertyType: "" });
    else applyPatch({ propertyTypes: [t], propertyType: "" });
  };

  const parkingOn = appliedFromUrl.features.some((x) => x.toLowerCase() === "parking");
  const poolOn = appliedFromUrl.features.some((x) => x.toLowerCase() === "pool");
  const newConstructionOn = appliedFromUrl.type === "new_construction";

  const listSort = appliedFromUrl.sort ?? "recommended";

  const medianForCards = mapStats?.medianPrice ?? null;

  const dealIsRent = appliedFromUrl.type === "rent";

  const listingsInstantSummary = useMemo(() => {
    if (!conversionEngineFlags.conversionUpgradeV1 || !conversionEngineFlags.instantValueV1) return null;
    return buildInstantValueSummary({
      page: "listings",
      intent: dealIsRent ? "rent" : "buy",
      listingsContext: { resultCount: total, dealType: dealIsRent ? "rent" : "sale" },
    });
  }, [dealIsRent, total]);

  const goToPage = (nextPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) p.delete("page");
    else p.set("page", String(nextPage));
    router.push(`${pathname}?${p.toString()}`);
  };


  const showListColumn = viewMode === "list" || viewMode === "split";
  const showMapColumn = viewMode === "map" || viewMode === "split";

  const mobileShowList =
    viewMode === "list" || (viewMode === "split" && splitMobilePane === "list");
  const mobileShowMap =
    viewMode === "map" || (viewMode === "split" && splitMobilePane === "map");

  const showMapPaneByLayout = mqLg ? showMapColumn : mobileShowMap;

  const settledEmptyResults = !loading && !fetchError && data.length === 0;

  const showListPane =
    (mqLg ? showListColumn : mobileShowList) ||
    settledEmptyResults;

  /** Map column & Google placeholder (Phase 3+) only when we have rows to pin. */
  const showMap = data.length > 0;

  const showMapPane =
    showMapPaneByLayout && !fetchError && !settledEmptyResults && showMap;

  const hasDesktopMapColumn = mqLg && Boolean(showMapPane) && showMapColumn;

  const mainGridClass =
    mqLg && showListColumn && hasDesktopMapColumn
      ? "lg:grid-cols-[300px_minmax(0,1fr)_minmax(320px,440px)]"
      : mqLg
        ? "lg:grid-cols-[300px_minmax(0,1fr)]"
        : "";

  const scrollMobileBrowseFiltersIntoView = useCallback(() => {
    mobileBrowseFiltersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const renderBrowseFilters = (pfx: string, containerId?: string) => (
    <div id={containerId} className="space-y-6">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/50">Location</label>
        <input
          type="text"
          value={appliedFromUrl.location}
          onChange={(e) => applyPatch({ location: e.target.value })}
          placeholder="City or area"
          className="min-h-[44px] w-full rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-4 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Price (CAD)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="sr-only" htmlFor={`${pfx}-min`}>
              Minimum price
            </label>
            <input
              id={`${pfx}-min`}
              type="number"
              min={0}
              step={1000}
              value={priceMinL || ""}
              onChange={(e) => {
                const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                setPriceMinL(v);
                queuePriceApply(v, priceMaxL >= PRICE_MAX_SLIDER ? 0 : priceMaxL);
              }}
              className="min-h-[44px] w-full rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor={`${pfx}-max`}>
              Maximum price
            </label>
            <input
              id={`${pfx}-max`}
              type="number"
              min={0}
              step={1000}
              value={priceMaxL >= PRICE_MAX_SLIDER ? "" : priceMaxL}
              placeholder="No max"
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) {
                  setPriceMaxL(PRICE_MAX_SLIDER);
                  queuePriceApply(priceMinL, 0);
                  return;
                }
                const v = Math.max(0, parseInt(raw, 10) || 0);
                setPriceMaxL(v);
                queuePriceApply(priceMinL, v);
              }}
              className="min-h-[44px] w-full rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-3 py-2 text-sm text-white placeholder:text-white/35"
            />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <input
            type="range"
            min={0}
            max={PRICE_MAX_SLIDER}
            step={PRICE_STEP}
            value={Math.min(priceMinL, PRICE_MAX_SLIDER)}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setPriceMinL(v);
              if (v > priceMaxL) setPriceMaxL(v);
              queuePriceApply(v, priceMaxL >= PRICE_MAX_SLIDER ? 0 : Math.max(v, priceMaxL));
            }}
            className="w-full accent-[#D4AF37]"
          />
          <input
            type="range"
            min={0}
            max={PRICE_MAX_SLIDER}
            step={PRICE_STEP}
            value={Math.min(priceMaxL >= PRICE_MAX_SLIDER ? PRICE_MAX_SLIDER : priceMaxL, PRICE_MAX_SLIDER)}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setPriceMaxL(v);
              queuePriceApply(priceMinL, v);
            }}
            className="w-full accent-[#D4AF37]"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Property type</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["", "Any"],
              ["HOUSE", "House"],
              ["CONDO", "Condo"],
              ["APARTMENT", "Apartment"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val || "any"}
              type="button"
              onClick={() => setPropertyType(val)}
              className={`flex min-h-[44px] w-full items-center justify-center rounded-2xl border px-3 py-2 text-center text-xs font-medium transition sm:text-sm ${
                isPropertyTypeSegmentSelected(val)
                  ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                  : "border-white/15 bg-[#111] text-white/80 hover:border-[#D4AF37]/35"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/50">Bedrooms</label>
          <select
            value={appliedFromUrl.bedrooms ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              applyPatch({ bedrooms: v === "" ? null : parseInt(v, 10) });
            }}
            className="min-h-[44px] w-full rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-3 py-2 text-sm text-white"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/50">Bathrooms</label>
          <select
            value={appliedFromUrl.bathrooms ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              applyPatch({ bathrooms: v === "" ? null : parseInt(v, 10) });
            }}
            className="min-h-[44px] w-full rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-3 py-2 text-sm text-white"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Advanced</p>
        <div className="space-y-3">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-white/85">
            <input
              type="checkbox"
              checked={parkingOn}
              onChange={(e) => applyPatch({ features: mergeFeatures(appliedFromUrl.features, "parking", e.target.checked) })}
              className="h-4 w-4 rounded border-[#D4AF37]/40 accent-[#D4AF37]"
            />
            Parking
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-white/85">
            <input
              type="checkbox"
              checked={poolOn}
              onChange={(e) => applyPatch({ features: mergeFeatures(appliedFromUrl.features, "pool", e.target.checked) })}
              className="h-4 w-4 rounded border-[#D4AF37]/40 accent-[#D4AF37]"
            />
            Pool
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-white/85">
            <input
              type="checkbox"
              checked={newConstructionOn}
              onChange={(e) => applyPatch({ type: e.target.checked ? "new_construction" : "buy" })}
              className="h-4 w-4 rounded border-[#D4AF37]/40 accent-[#D4AF37]"
            />
            New construction
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={() => reset()}
        className="min-h-[48px] w-full rounded-2xl border border-white/20 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
      >
        Clear all filters
      </button>
    </div>
  );

  const listingsGrid = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((row, cardIndex) => (
        <ListingCard
          key={row.id}
          row={row}
          cardIndex={cardIndex}
          selected={selectedId === row.id}
          medianForCards={medianForCards}
          conversionUpgradeV1={conversionEngineFlags.conversionUpgradeV1}
          onHoverChange={setSelectedId}
        />
      ))}
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(total / 24));
  const hasResults = data.length > 0;
  const showPaginationBar = !loading && !fetchError && hasResults && totalPages > 1;

  const paginationBar = showPaginationBar ? (
      <div className="mb-6 flex items-center justify-between gap-4 px-0 sm:px-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          className="min-h-[44px] shrink-0 rounded-2xl border border-[#D4AF37]/25 px-4 text-sm font-semibold text-white/85 transition hover:bg-white/5 disabled:pointer-events-none disabled:opacity-30"
        >
          Back
        </button>
        <span className="text-center text-sm tabular-nums text-white/40">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => goToPage(page + 1)}
          className="min-h-[44px] shrink-0 rounded-2xl px-5 text-sm font-bold text-black transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-30"
          style={{ backgroundColor: ACCENT }}
        >
          Next
        </button>
      </div>
    ) : null;

  const desktopSortValue =
    listSort === "priceAsc" || listSort === "priceDesc" || listSort === "newest" ? listSort : "newest";

  return (
    <div className="min-h-screen bg-black pb-24 text-white lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-[#D4AF37]/20 bg-black/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
          <p className="text-[11px] font-normal leading-snug text-white/40 sm:text-xs sm:text-white/45">
            {SEARCH_REASSURANCE_LINE}
          </p>
        </div>
        <div className="mx-auto flex max-w-[1920px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-4">
          <form onSubmit={handleSearchSubmit} className="flex w-full flex-1 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
            <QuebecLocationInput
              id="lecipm-location-search"
              value={searchDraft}
              onChange={setSearchDraft}
              tone="light"
              inputType="search"
              placeholder="Search by city, address, or listing ID"
              className="min-h-[48px] w-full flex-1 rounded-2xl border-2 border-[#D4AF37]/35 bg-white px-4 py-2 text-base text-black placeholder:text-neutral-500 focus:border-[#D4AF37] focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/15"
              autoComplete="off"
            />
            <button
              type="submit"
              className="min-h-[48px] shrink-0 rounded-2xl px-6 text-base font-semibold text-black sm:px-8"
              style={{ backgroundColor: ACCENT }}
            >
              Search properties
            </button>
          </form>
        </div>
      </header>

      {/* Desktop-only: single view/sort row (no duplicate toggles elsewhere). */}
      <div className="mx-auto mb-6 hidden max-w-7xl items-center justify-between px-4 sm:px-6 lg:flex">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyPatch({ mapLayout: "list" })}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition",
              viewMode === "list"
                ? "bg-neutral-700 text-white ring-1 ring-white/15"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            )}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => {
              applyPatch({ mapLayout: "split" });
              focusListingsMap();
            }}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition",
              viewMode === "split"
                ? "bg-neutral-700 text-white ring-1 ring-white/15"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            )}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => {
              applyPatch({ mapLayout: "map" });
              focusListingsMap();
            }}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition",
              viewMode === "map"
                ? "bg-neutral-700 text-white ring-1 ring-white/15"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            )}
          >
            Map
          </button>
        </div>
        <select
          value={desktopSortValue}
          onChange={(e) => applyPatch({ sort: e.target.value })}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
          aria-label="Sort listings"
        >
          <option value="newest">Newest</option>
          <option value="priceAsc">Price (low-high)</option>
          <option value="priceDesc">Price (high-low)</option>
        </select>
      </div>

      {/* Mobile: full filter controls (desktop has the same UI in the left sidebar).
          Header "Filters" scrolls here so choices are visible without leaving the page. */}
      <section
        ref={mobileBrowseFiltersRef}
        id="lecipm-browse-mobile-filters-section"
        className="border-b border-[#D4AF37]/18 bg-[#080808] scroll-mt-[5.75rem] lg:hidden"
        aria-label="Listing filters"
      >
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <h2 className="text-center font-serif text-xl tracking-wide text-[#D4AF37]">Filters</h2>
          <p className="mt-1 text-center text-xs text-white/45">
            Location, price, type, rooms, and amenities — synced with URL and sidebar on larger screens.
          </p>
          <div className="mt-5">{renderBrowseFilters("lecipm-m")}</div>
          <Link
            href={buyHubFullFiltersHref}
            className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#D4AF37]/35 px-4 text-sm font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            Open advanced filters on Buy hub
          </Link>
        </div>
      </section>

      {listingsInstantSummary ? (
        <section className="mx-auto max-w-6xl border-b border-[#D4AF37]/20 bg-black/40 px-4 py-4 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-wide text-[#D4AF37]">Recommended opportunities</p>
          <p className="mt-1 text-sm font-medium text-white">{listingsInstantSummary.headline}</p>
          <p className="mt-1 text-xs text-white/55">{listingsInstantSummary.subheadline}</p>
        </section>
      ) : null}

      <div
        className={`mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 sm:py-12 lg:gap-6 lg:py-16 ${mainGridClass}`}
      >
        <aside className="hidden space-y-4 rounded-2xl border border-[#D4AF37]/20 bg-[#111] p-4 lg:block">
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-black/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]/90">Full property filters</p>
            <p className="mt-1 text-[11px] leading-snug text-white/55">
              Same filter panel as the Buy hub — bedrooms, building style, size, features, and more.
            </p>
            <Link
              href={buyHubFullFiltersHref}
              className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#D4AF37] px-4 text-sm font-bold text-black transition hover:brightness-110"
            >
              Open full filters
            </Link>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">Quick adjust</p>
            {renderBrowseFilters("lecipm-desk", "lecipm-filters")}
          </div>
        </aside>

        {showListPane ? (
          <section className="min-w-0">
            <p className="mb-4 text-sm text-white/60">
              {loading ? "Loading…" : <>{total.toLocaleString()} propert{total === 1 ? "y" : "ies"}</>}
            </p>
            {fetchError ? (
              <ErrorState message={fetchError} onRetry={() => void fetchList()} />
            ) : loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-xl bg-neutral-800" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="py-20 text-center">
                <h2 className="text-2xl text-white">No listings found</h2>
                <p className="mt-2 text-neutral-400">Try adjusting your filters or search location.</p>
                <button type="button" onClick={() => resetFilters()} className="mt-6 rounded-xl bg-[#C9A96A] px-6 py-3 text-black">
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                {paginationBar}
                {listingsGrid}
              </>
            )}
          </section>
        ) : null}

        {showMapPane ? (
          <section
            id={LISTINGS_MAP_SEARCH_ID}
            className="flex min-h-0 w-full scroll-mt-28 flex-col gap-4 lg:scroll-mt-24"
          >
            {smartMapPanel}
            <div className="flex h-full min-h-[400px] w-full min-w-0 flex-1 flex-col lg:min-h-[min(560px,calc(100vh-7rem))]">
              <GoogleListingsMap listings={data} />
            </div>
            {SHOW_LEGACY_MAP_SEARCH ? mapSearchEl : null}
          </section>
        ) : null}
      </div>

      <nav
        className="fixed bottom-0 left-0 z-[70] flex w-full justify-around border-t border-neutral-800 bg-black/95 py-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
        aria-label="Filters, sort, and map or list view"
      >
        <button
          type="button"
          onClick={scrollMobileBrowseFiltersIntoView}
          className="touch-manipulation px-2 text-sm text-neutral-300 active:text-white"
        >
          Filters
        </button>
        <button
          type="button"
          onClick={() => {
            applyPatch({ mapLayout: "list" });
            setSplitMobilePane("list");
          }}
          className={cn(
            "touch-manipulation px-2 text-sm text-neutral-300 active:text-white",
            (viewMode === "list" || (viewMode === "split" && splitMobilePane === "list")) && "text-[#C9A96A]"
          )}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => {
            applyPatch({ mapLayout: "map" });
            setSplitMobilePane("map");
            focusListingsMap();
          }}
          className={cn(
            "touch-manipulation px-2 text-sm text-neutral-300 active:text-white",
            (viewMode === "map" || (viewMode === "split" && splitMobilePane === "map")) && "text-[#C9A96A]"
          )}
        >
          Map
        </button>
        <select
          value={desktopSortValue}
          onChange={(e) => applyPatch({ sort: e.target.value })}
          className="max-w-[40%] min-w-0 touch-manipulation rounded-lg border border-neutral-700/60 bg-transparent text-sm text-neutral-300"
          aria-label="Sort listings"
        >
          <option value="newest">Sort: newest</option>
          <option value="priceAsc">Sort: price ↑</option>
          <option value="priceDesc">Sort: price ↓</option>
        </select>
      </nav>
    </div>
  );
}

export function LecipmListingsExplorer() {
  return (
    <SearchFiltersProvider mode="buy">
      <LecipmListingsExplorerInner />
    </SearchFiltersProvider>
  );
}

export default LecipmListingsExplorer;
