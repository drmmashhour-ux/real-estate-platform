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
import type { MapListing } from "@/components/map/MapListing";
import { hasValidCoordinates } from "@/components/map/MapListing";
import {
  hasActivePropertyBrowseFilters,
  type PropertyBrowseFilters,
} from "@/lib/buy/property-browse-filters";

/** Luxury residential hero — Unsplash (modern home, dusk). */
const LISTINGS_HERO_BG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2400&auto=format&fit=crop";

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
};

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

function toMapListing(row: Row): MapListing | null {
  if (!hasValidCoordinates(row)) return null;
  const img = row.coverImage || row.images[0] || null;
  return {
    id: row.id,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    price: row.priceCents / 100,
    title: row.title,
    image: img ?? undefined,
    href: `/listings/${row.id}`,
  };
}

type BrowseProps = { embedded?: boolean; hubMode?: "buy" | "rent" };

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

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
  const mapLayout = appliedFromUrl.mapLayout ?? "list";
  const listSort = appliedFromUrl.sort ?? "recommended";

  const fetchList = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const base = urlParamsToGlobalFilters(new URLSearchParams(searchParams.toString()));
      const f = hubMode === "rent" ? { ...base, type: "rent" as const } : base;
      const r = await fetch("/api/buyer/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, page, limit: 24, propertyFilters }),
        cache: "no-store",
      });
      if (!r.ok) {
        setFetchError(r.status >= 500 ? "Server error — please try again." : "Could not load listings.");
        setData([]);
        setTotal(0);
        return;
      }
      const j = await r.json();
      setData(Array.isArray(j.data) ? j.data : []);
      setTotal(typeof j.total === "number" ? j.total : 0);
    } catch {
      setFetchError("Network error — check your connection and try again.");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchParams, page, propertyFilters, hubMode]);

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

  const mapPins = data.map(toMapListing).filter((x): x is MapListing => x != null);

  const setLayout = (layout: "list" | "split" | "map") => {
    applyPatch({ mapLayout: layout });
  };

  const hasMore = page * 24 < total;
  const pfActive = hasActivePropertyBrowseFilters(propertyFilters);

  const listGrid = useMemo(
    () => (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((row) => {
          const img = row.coverImage || row.images[0] || null;
          const price = `$${(row.priceCents / 100).toLocaleString("en-CA")}`;
          return (
            <Link
              key={row.id}
              id={`listing-card-${row.id}`}
              href={`/listings/${row.id}`}
              onMouseEnter={() => setSelectedId(row.id)}
              onMouseLeave={() => setSelectedId(null)}
              className={`group block overflow-hidden rounded-2xl border bg-white/[0.03] shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C9A646]/35 hover:shadow-[var(--shadow-card-hover)] ${
                selectedId === row.id ? "border-[#C9A646]/50 ring-1 ring-[#C9A646]/30" : "border-white/10"
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
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-slate-600">
                    {row.kind === "crm" ? (
                      <span className="rounded-full border border-[#C9A646]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C9A646]">
                        Broker CRM
                      </span>
                    ) : null}
                    <span>No photo</span>
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5">
                <p className="line-clamp-2 text-sm font-semibold text-white">{row.title}</p>
                <p className="mt-1 text-lg font-bold text-[#C9A646]">{price}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {row.city}
                  {row.address ? ` · ${row.address}` : ""}
                  {row.bedrooms != null ? ` · ${row.bedrooms} bd` : ""}
                  {row.bathrooms != null ? ` · ${row.bathrooms} ba` : ""}
                  {row.propertyType ? ` · ${row.propertyType.replace(/_/g, " ")}` : ""}
                </p>
                {row.kind === "fsbo" && (row.noiseLevel || row.familyFriendly || row.petsAllowed) ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.noiseLevel ? (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">{row.noiseLevel}</span>
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
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Property details</span>
                  <span className="text-xs font-medium text-[#C9A646] transition group-hover:text-[#E8D5A0]">
                    View full listing →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    ),
    [data, selectedId]
  );

  const mapSearchEl = (
    <MapSearch
      listings={mapPins}
      initialBounds={initialBounds}
      suppressAutoFit={Boolean(initialBounds)}
      onBoundsChange={onBoundsChange}
      selectedId={selectedId}
      onMarkerClick={(ml) => {
        setSelectedId(ml.id);
        document.getElementById(`listing-card-${ml.id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }}
      variant="dark"
      className="h-[420px] w-full"
    />
  );

  const filterPanel = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#C9A646]/90">Lifestyle, pets &amp; experience</p>
      <p className="mt-1 text-[11px] text-slate-500">Narrow FSBO listings; broker CRM rows hide when these filters are on.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Noise
          <select
            value={propertyFilters.noiseLevel ?? ""}
            onChange={(e) =>
              setPropertyFilters((s) => ({
                ...s,
                noiseLevel: (e.target.value || null) as PropertyBrowseFilters["noiseLevel"],
              }))
            }
            className="rounded-lg border border-white/15 bg-[#0B0B0B] px-2 py-1.5 text-sm text-slate-200"
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
            checked={Boolean(propertyFilters.familyFriendly)}
            onChange={(e) => setPropertyFilters((s) => ({ ...s, familyFriendly: e.target.checked }))}
            className="rounded border-white/20"
          />
          Family-friendly
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(propertyFilters.partyFriendly)}
            onChange={(e) => setPropertyFilters((s) => ({ ...s, partyFriendly: e.target.checked }))}
            className="rounded border-white/20"
          />
          Party-friendly
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(propertyFilters.petsOnly)}
            onChange={(e) => setPropertyFilters((s) => ({ ...s, petsOnly: e.target.checked }))}
            className="rounded border-white/20"
          />
          Pets allowed
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
          Pet type
          <select
            value={propertyFilters.petType ?? ""}
            onChange={(e) =>
              setPropertyFilters((s) => ({
                ...s,
                petType: (e.target.value || null) as PropertyBrowseFilters["petType"],
              }))
            }
            className="rounded-lg border border-white/15 bg-[#0B0B0B] px-2 py-1.5 text-sm text-slate-200"
          >
            <option value="">Any</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-400">
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
            className="w-full rounded-lg border border-white/15 bg-[#0B0B0B] px-2 py-1.5 text-sm text-slate-200"
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
          <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
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
          className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-semibold text-[#0B0B0B] hover:bg-[#D4B35A]"
        >
          Apply lifestyle filters
        </button>
        {pfActive ? (
          <button
            type="button"
            onClick={() => {
              setPropertyFilters(EMPTY_PF);
            }}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
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
          <span className="text-slate-400">Searching…</span>
        ) : (
          <>
            <span className="text-[#E8C547]">{total.toLocaleString()}</span>{" "}
            <span className="text-slate-300">propert{total === 1 ? "y" : "ies"} found</span>
            {pfActive ? (
              <span className="ml-2 text-xs font-normal text-[#C9A646]">· Lifestyle filters on</span>
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
                  ? "bg-[#C9A646]/20 text-[#E8D5A3] ring-1 ring-[#C9A646]/40"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
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
          className="rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-sm text-slate-200 focus:border-[#C9A646]/45 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/30"
        >
          <option value="recommended">Recommended</option>
          <option value="newest">Newest</option>
          <option value="priceAsc">Price · Low to high</option>
          <option value="priceDesc">Price · High to low</option>
        </select>
      </div>
    </div>
  );

  const paginationBar =
    !loading && !fetchError && total > 0 ? (
      <div className="flex flex-wrap items-center justify-center gap-2 py-4 text-sm text-slate-300">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(1)}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-30"
          aria-label="First page"
        >
          «
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => goToPage(page - 1)}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-30"
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="min-w-[8rem] text-center tabular-nums text-slate-400">
          {page} / {totalPages}
          {hasMore ? "+" : ""}
        </span>
        <button
          type="button"
          disabled={!hasMore}
          onClick={() => goToPage(page + 1)}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-30"
          aria-label="Next page"
        >
          ›
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => goToPage(totalPages)}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-slate-400 hover:bg-white/5 disabled:opacity-30"
          aria-label="Last page"
        >
          »
        </button>
      </div>
    ) : null;

  const lifestyleSection = (
    <details className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] open:bg-white/[0.03]">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[#C9A646] [&::-webkit-details-marker]:hidden">
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {resultsToolbar}

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
        )}

        {!loading && !fetchError && data.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              icon="🏠"
              title="No listings match these filters"
              description="Try widening the city, price range, or property type — or clear filters to see everything available."
            >
              <button
                type="button"
                onClick={reset}
                className="rounded-xl bg-[#C9A646] px-6 py-2.5 text-sm font-bold text-[#0B0B0B] transition hover:bg-[#D4B35A]"
              >
                Clear search filters
              </button>
            </EmptyState>
          </div>
        ) : null}

      </div>
    </>
  );

  if (embedded) {
    return grid;
  }

  return <main className="min-h-screen bg-[#0B0B0B] pb-24 text-white">{grid}</main>;
}

export function ListingsBrowseClient({ embedded = false, hubMode = "buy" }: BrowseProps) {
  const mode = hubMode === "rent" ? "rent" : "buy";
  return (
    <SearchFiltersProvider mode={mode}>
      {embedded ? (
        <div className="bg-[#0B0B0B] pb-16 text-white">
          <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
            <h2 className="text-lg font-semibold text-white">
              {hubMode === "rent" ? "Search rentals" : "Search properties"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Filters sync to the URL — share or bookmark your results.</p>
            <div className="mt-4">
              <SearchEngineBar />
            </div>
          </div>
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
              <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#E8C547]/95">
                {PLATFORM_NAME}
              </p>
              <h1 className="mt-4 text-center text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.1]">
                {hubMode === "rent"
                  ? "Find your next long-term rental"
                  : "Step into your next home in Québec"}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-white/90 sm:text-lg">
                Public catalog — no sign-in required. Filters sync to the URL so you can share or bookmark your search.
              </p>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/75">
                <span className="font-medium text-[#E8C547]">AI</span> — shortlist a property, then{" "}
                <Link href="/analyze" className="text-white underline decoration-[#C9A646]/80 underline-offset-2 hover:text-white">
                  run investment analysis
                </Link>{" "}
                or{" "}
                <Link href="/dashboard/ai" className="text-white underline decoration-[#C9A646]/80 underline-offset-2 hover:text-white">
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
