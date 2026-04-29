"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BrowseListingFavoriteButton } from "@/components/listings/BrowseListingFavoriteButton";
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
import { ListingsGridSkeleton } from "@/components/ui/SkeletonBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { QuebecLocationInput } from "@/components/search/QuebecLocationInput";
import { LISTINGS_MAP_SEARCH_ID } from "@/lib/search/public-map-search-urls";
import { scrollToMapSearchRegion } from "@/lib/ui/scroll-to-map-search";
import { useGeocodedMapFocus } from "@/hooks/useGeocodedMapFocus";
import { computeMapSearchStats } from "@/lib/search/map-search-analytics";
import { BROWSE_EMPTY_LISTINGS } from "@/lib/listings/browse-empty-copy";
import { getListingCardDeterministicInsights } from "@/lib/listings/listing-card-deterministic-insights";
import { track } from "@/lib/tracking";
import { useConversionEngineFlags } from "@/lib/conversion/use-conversion-engine-flags";
import { recordListingsExplorerViewOnce } from "@/modules/conversion/funnel-metrics.service";
import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";
import { recordListingCtaClick } from "@/modules/conversion/conversion-monitoring.service";
import { cn } from "@/lib/utils";

const SEARCH_REASSURANCE_LINE =
  "Verified listings where marked · Clear prices · Secure platform";

function isFeaturedListingActive(featuredUntil: string | null | undefined): boolean {
  if (featuredUntil == null || featuredUntil === "") return false;
  const t = new Date(featuredUntil).getTime();
  return Number.isFinite(t) && t > Date.now();
}

const ACCENT = "#D4AF37";
const CARD_BG = "#111";
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

  const showMapPane =
    showMapPaneByLayout && !fetchError && !settledEmptyResults && (loading || data.length > 0);

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((row, cardIndex) => {
        const img = row.coverImage || row.images[0] || null;
        const price = `$${(row.priceCents / 100).toLocaleString("en-CA")}`;
        const addr = [row.address, row.city].filter(Boolean).join(", ") || row.city;
        const detailHref = listingPublicHref(row);
        const insights = getListingCardDeterministicInsights({
          priceCents: row.priceCents,
          city: row.city,
          bedrooms: row.bedrooms,
          medianPriceDollars: medianForCards,
        });
        const microCta =
          insights.some((line) => line.includes("Below median")) ? "Get this deal" : "Contact now";
        const primaryOpportunityCta = conversionEngineFlags.conversionUpgradeV1 ? "Get this opportunity" : microCta;
        const fireListingClick = () => {
          track("listing_click", {
            meta: { listingId: row.id, surface: "lecipm_grid", city: row.city },
          });
          if (conversionEngineFlags.conversionUpgradeV1) {
            recordListingCtaClick({ listingId: row.id, surface: "lecipm_grid" });
          }
        };
        return (
          <article
            key={row.id}
            id={`lecipm-card-${row.id}`}
            onMouseEnter={() => setSelectedId(row.id)}
            onMouseLeave={() => setSelectedId(null)}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left shadow-[0_8px_30px_-12px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out hover:scale-[1.015] hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.65)] ${
              selectedId === row.id ? "border-[#D4AF37]/55 ring-1 ring-[#D4AF37]/25" : "border-[#D4AF37]/20"
            }`}
            style={{ backgroundColor: CARD_BG }}
          >
            <BrowseListingFavoriteButton
              listingId={row.id}
              kind={row.kind === "crm" ? "crm" : "fsbo"}
              className="absolute right-2 top-2 z-10"
            />
            <Link
              href={detailHref}
              onClick={fireListingClick}
              className="relative block aspect-[4/3] overflow-hidden bg-black outline-none ring-[#D4AF37]/30 focus-visible:ring-2"
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt=""
                  loading={cardIndex < 3 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={cardIndex === 0 ? "high" : undefined}
                  className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-black text-sm text-white/40">
                  No photo
                </div>
              )}
              {img ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 top-[35%] bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                  aria-hidden
                />
              ) : null}
              <div className="pointer-events-none absolute bottom-3 left-3 z-[2] flex max-w-[calc(100%-5rem)] flex-wrap items-center gap-1.5">
                {row.verifiedListing ? (
                  <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/20 backdrop-blur-sm">
                    Verified
                  </span>
                ) : null}
                {isFeaturedListingActive(row.featuredUntil) ? (
                  <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#E8D589] backdrop-blur-sm">
                    Top listing
                  </span>
                ) : null}
              </div>
            </Link>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-2xl font-bold tracking-tight" style={{ color: ACCENT }}>
                {price}
              </p>
              <p className="mt-2 line-clamp-2 text-sm font-medium text-white/90">{addr}</p>
              <p className="mt-2 text-xs text-white/50">
                {row.bedrooms != null ? `${row.bedrooms} bd` : "— bd"}
                {" · "}
                {row.bathrooms != null ? `${row.bathrooms} ba` : "— ba"}
                {row.propertyType ? ` · ${row.propertyType}` : ""}
              </p>
              {insights.length ? (
                <ul className="mt-3 space-y-1 text-[11px] leading-snug text-[#E8D589]/90">
                  {insights.map((line) => (
                    <li key={line} className="flex gap-1.5">
                      <span className="text-[#D4AF37]" aria-hidden>
                        ·
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Link
                  href={detailHref}
                  onClick={fireListingClick}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 text-center text-sm font-bold text-[#E8D589] transition hover:bg-[#D4AF37]/20"
                >
                  View details
                </Link>
                <Link
                  href={`${detailHref}#property-contact-cta`}
                  onClick={() => {
                    track("cta_click", {
                      meta: { label: "contact_now", listingId: row.id, surface: "lecipm_grid" },
                    });
                    if (conversionEngineFlags.conversionUpgradeV1) {
                      recordListingCtaClick({ listingId: row.id, surface: "lecipm_grid", label: "opportunity" });
                    }
                  }}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl px-4 text-center text-sm font-bold text-black transition hover:brightness-110"
                  style={{ backgroundColor: ACCENT }}
                >
                  {primaryOpportunityCta}
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );

  const topFilterStrip = (
    <section
      className="border-b border-[#D4AF37]/15 bg-black/90"
      aria-label="Listing filters"
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="flex flex-wrap gap-2">
            <span className="w-full text-[10px] font-semibold uppercase tracking-wide text-white/40 lg:w-auto lg:pr-2">
              Deal type
            </span>
            <button
              type="button"
              onClick={() => applyPatch({ type: "buy" })}
              className={`min-h-[44px] rounded-2xl border px-4 text-sm font-semibold ${
                !dealIsRent ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]" : "border-white/15 text-white/70"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => applyPatch({ type: "rent" })}
              className={`min-h-[44px] rounded-2xl border px-4 text-sm font-semibold ${
                dealIsRent ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]" : "border-white/15 text-white/70"
              }`}
            >
              Rent
            </button>
          </div>

          <div className="min-w-0 flex-1 lg:max-w-xs">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">City</label>
            <input
              type="text"
              value={appliedFromUrl.location}
              onChange={(e) => applyPatch({ location: e.target.value })}
              placeholder="City or area"
              className="min-h-[44px] w-full rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
            />
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:max-w-xs lg:w-64">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">Min price</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={priceMinL || ""}
                onChange={(e) => {
                  const v = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setPriceMinL(v);
                  queuePriceApply(v, priceMaxL >= PRICE_MAX_SLIDER ? 0 : priceMaxL);
                }}
                className="min-h-[44px] w-full rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-2 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">Max price</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={priceMaxL >= PRICE_MAX_SLIDER ? "" : priceMaxL}
                placeholder="Any"
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
                className="min-h-[44px] w-full rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-2 py-2 text-sm text-white placeholder:text-white/35"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/40">Bedrooms</label>
            <select
              value={appliedFromUrl.bedrooms ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                applyPatch({ bedrooms: v === "" ? null : parseInt(v, 10) });
              }}
              className="min-h-[44px] w-full min-w-[8rem] rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-3 py-2 text-sm text-white lg:w-36"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-auto lg:min-w-[14rem]">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Property type</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  ["", "Any"],
                  ["HOUSE", "House"],
                  ["CONDO", "Condo"],
                  ["APARTMENT", "Apartment"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val || "any-strip"}
                  type="button"
                  onClick={() => setPropertyType(val)}
                  className={`flex min-h-[40px] w-full items-center justify-center rounded-xl border px-2 text-center text-xs font-medium sm:min-h-[44px] sm:px-2.5 sm:text-sm ${
                    isPropertyTypeSegmentSelected(val)
                      ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                      : "border-white/15 text-white/75"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
            <span className="w-full text-[10px] font-semibold uppercase tracking-wide text-white/40 lg:w-auto lg:self-end lg:pb-3 lg:pr-1">
              AI sort
            </span>
            {(
              [
                ["priceAsc", "Best deals"] as const,
                ["recommended", "High ROI"] as const,
                ["aiScore", "High demand"] as const,
              ] as const
            ).map(([sort, label]) => {
              const active = listSort === sort;
              return (
                <button
                  key={sort}
                  type="button"
                  onClick={() => applyPatch({ sort })}
                  className={`min-h-[44px] rounded-2xl border px-3 text-xs font-semibold sm:text-sm ${
                    active ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]" : "border-white/15 text-white/75"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );

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

  return (
    <div className="min-h-screen bg-black pb-36 text-white lg:pb-0">
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

          <div className="hidden flex-wrap items-center gap-2 lg:flex lg:shrink-0">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#D4AF37]/25 p-1">
              <button
                type="button"
                onClick={() => applyPatch({ mapLayout: "list" })}
                className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold sm:px-4 ${
                  viewMode === "list" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/60"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPatch({ mapLayout: "split" });
                  focusListingsMap();
                }}
                className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold sm:px-4 ${
                  viewMode === "split" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/60"
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPatch({ mapLayout: "map" });
                  focusListingsMap();
                }}
                className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold sm:px-4 ${
                  viewMode === "map" ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "text-white/60"
                }`}
              >
                Map
              </button>
            </div>
            <label className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-[#D4AF37]/25 bg-[#111] px-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/45">Sort</span>
              <select
                value={listSort}
                onChange={(e) => applyPatch({ sort: e.target.value })}
                className="min-h-[40px] flex-1 bg-transparent py-1 text-sm text-white focus:outline-none"
              >
                <option value="recommended">Recommended</option>
                <option value="priceAsc">Best value (price ↑)</option>
                <option value="priceDesc">Price (high → low)</option>
                <option value="aiScore">High demand</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      {topFilterStrip}

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
              <ListingsGridSkeleton count={6} />
            ) : data.length === 0 ? (
              <EmptyState title={BROWSE_EMPTY_LISTINGS.title} description={BROWSE_EMPTY_LISTINGS.description}>
                <>
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="min-h-[48px] rounded-2xl px-6 font-semibold text-black"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Reset filters
                  </button>
                  <Link
                    href="/explore"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border-2 px-6 font-semibold transition hover:bg-white/[0.06]"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                  >
                    Browse featured listings
                  </Link>
                </>
              </EmptyState>
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
            {mapSearchEl}
          </section>
        ) : null}
      </div>

      <nav
        className="fixed bottom-[calc(3.65rem+env(safe-area-inset-bottom))] left-0 right-0 z-[62] flex items-center justify-between gap-2 border-t border-neutral-700 bg-black/95 px-4 py-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md lg:hidden"
        aria-label="Filters, sort, and map or list view"
      >
        <button
          type="button"
          onClick={scrollMobileBrowseFiltersIntoView}
          className="min-h-[44px] shrink-0 rounded-xl border border-white/15 bg-[#141414]/90 px-3 py-2 text-sm font-semibold text-white/90 shadow-sm shadow-black/30 transition hover:bg-white/[0.08]"
        >
          Filters
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              applyPatch({ mapLayout: "list" });
              setSplitMobilePane("list");
            }}
            className={cn(
              "min-h-[44px] shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
              viewMode === "list" || (viewMode === "split" && splitMobilePane === "list")
                ? "border-[#D4AF37] bg-[#D4AF37] text-black shadow-md shadow-black/40"
                : "border-white/15 bg-neutral-800/90 text-white/85 hover:bg-neutral-700/90"
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
              "min-h-[44px] shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
              viewMode === "map" || (viewMode === "split" && splitMobilePane === "map")
                ? "border-[#D4AF37] bg-[#D4AF37] text-black shadow-md shadow-black/40"
                : "border-white/15 bg-neutral-800/90 text-white/85 hover:bg-neutral-700/90"
            )}
          >
            Map
          </button>
        </div>

        <label className="flex min-h-[44px] min-w-0 shrink items-center rounded-lg border border-white/15 bg-black px-1.5">
          <span className="sr-only">Sort listings</span>
          <select
            value={listSort}
            onChange={(e) => applyPatch({ sort: e.target.value })}
            className="max-w-[7.75rem] min-w-0 flex-1 cursor-pointer truncate bg-transparent py-1.5 pl-1 text-xs font-medium text-white focus:outline-none sm:max-w-[10rem] sm:text-sm"
          >
            <option value="recommended">Recommended</option>
            <option value="priceAsc">Best value (price ↑)</option>
            <option value="priceDesc">Price (high → low)</option>
            <option value="aiScore">High demand</option>
            <option value="newest">Newest</option>
          </select>
        </label>
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
