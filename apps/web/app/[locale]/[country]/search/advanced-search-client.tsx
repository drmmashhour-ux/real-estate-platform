"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingsBrowseClient } from "@/components/listings/ListingsBrowseClient";
import {
  DEFAULT_GLOBAL_FILTERS,
  globalFiltersToBnhubParams,
  globalFiltersToUrlParams,
  type GlobalSearchFiltersExtended,
  urlParamsToGlobalFilters,
} from "@/components/search/FilterState";

type ListingMode = "sale" | "rent" | "commercial" | "stays";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30";
const labelCls = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/55";
const sectionCls = "space-y-3";

function parseLocationParts(loc: string): { city: string; region: string } {
  const t = loc.trim();
  if (!t) return { city: "", region: "" };
  const i = t.indexOf(",");
  if (i < 0) return { city: t, region: "" };
  return { city: t.slice(0, i).trim(), region: t.slice(i + 1).trim() };
}

function chipCls(on: boolean) {
  return [
    "rounded-lg border px-3 py-2 text-xs font-medium transition sm:text-sm",
    on
      ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
      : "border-white/10 bg-black/50 text-white/75 hover:border-white/20",
  ].join(" ");
}

export function AdvancedSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spKey = searchParams.toString();

  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [listingMode, setListingMode] = useState<ListingMode>("sale");
  const [ptHouse, setPtHouse] = useState(false);
  const [ptCondo, setPtCondo] = useState(false);
  const [ptCommercial, setPtCommercial] = useState(false);
  const [ptLand, setPtLand] = useState(false);
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [featParking, setFeatParking] = useState(false);
  const [featFurnished, setFeatFurnished] = useState(false);
  const [featNewConstruction, setFeatNewConstruction] = useState(false);
  const [featPool, setFeatPool] = useState(false);
  const [insuredOnly, setInsuredOnly] = useState(false);
  const [sort, setSort] = useState<"relevance" | "newest" | "priceLow" | "priceHigh">("relevance");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const f = urlParamsToGlobalFilters(new URLSearchParams(spKey));
    const { city: c, region: r } = parseLocationParts(f.location);
    setCity(c);
    setRegion(r);
    setMinPrice(f.priceMin > 0 ? String(f.priceMin) : "");
    setMaxPrice(f.priceMax > 0 ? String(f.priceMax) : "");
    if (f.type === "short") setListingMode("stays");
    else if (f.type === "rent") setListingMode("rent");
    else if (f.type === "commercial") setListingMode("commercial");
    else setListingMode("sale");

    const pts = new Set((f.propertyTypes ?? []).map((x) => x.toUpperCase()));
    setPtHouse(pts.has("SINGLE_FAMILY"));
    setPtCondo(pts.has("CONDO"));
    setPtCommercial(pts.has("COMMERCIAL"));
    setPtLand(pts.has("LAND"));

    setBedrooms(f.bedrooms != null ? String(f.bedrooms) : "");
    setBathrooms(f.bathrooms != null ? String(f.bathrooms) : "");

    const feats = new Set(f.features.map((x) => x.toLowerCase()));
    setFeatParking(feats.has("parking"));
    setFeatFurnished(f.furnished === "yes");
    setFeatNewConstruction(feats.has("new construction") || f.type === "new_construction");
    setFeatPool(feats.has("pool"));
    setInsuredOnly(f.insuredOnly === true);

    const s = f.sort ?? "recommended";
    if (s === "newest") setSort("newest");
    else if (s === "priceAsc") setSort("priceLow");
    else if (s === "priceDesc") setSort("priceHigh");
    else setSort("relevance");
  }, [spKey]);

  const buildGlobal = useCallback((): GlobalSearchFiltersExtended => {
    const location = [city.trim(), region.trim()].filter(Boolean).join(", ");
    const priceMin = Math.max(0, parseInt(minPrice, 10) || 0);
    const priceMax = Math.max(0, parseInt(maxPrice, 10) || 0);
    const bedN = parseInt(bedrooms, 10);
    const bathN = parseInt(bathrooms, 10);
    const bedroomsVal = bedrooms !== "" && Number.isFinite(bedN) && bedN >= 0 ? bedN : null;
    const bathroomsVal = bathrooms !== "" && Number.isFinite(bathN) && bathN >= 0 ? bathN : null;

    const features: string[] = [];
    if (featParking) features.push("parking");
    if (featPool) features.push("pool");
    if (featNewConstruction) features.push("new construction");

    const sortResolved =
      sort === "newest"
        ? "newest"
        : sort === "priceLow"
          ? "priceAsc"
          : sort === "priceHigh"
            ? "priceDesc"
            : "recommended";

    const residentialTypes: string[] = [];
    if (ptHouse) residentialTypes.push("SINGLE_FAMILY");
    if (ptCondo) residentialTypes.push("CONDO");
    if (ptLand) residentialTypes.push("LAND");
    if (ptCommercial && listingMode !== "commercial") residentialTypes.push("COMMERCIAL");

    const common = {
      location,
      priceMin,
      priceMax,
      bedrooms: bedroomsVal,
      bathrooms: bathroomsVal,
      features,
      sort: sortResolved,
      page: 1,
      propertyType: "",
      checkIn: "",
      checkOut: "",
      guests: null,
      leaseMonthsMin: null,
      minSqft: null,
      maxSqft: null,
      yearBuiltMin: null,
      yearBuiltMax: null,
      north: null,
      south: null,
      east: null,
      west: null,
      mapLayout: "split" as const,
      roomType: "",
      insuredOnly,
    };

    if (listingMode === "stays") {
      return {
        ...DEFAULT_GLOBAL_FILTERS,
        ...common,
        type: "short",
        furnished: "any",
        propertyTypes: [],
        rentListingCategory: null,
      };
    }

    if (listingMode === "commercial") {
      return {
        ...DEFAULT_GLOBAL_FILTERS,
        ...common,
        type: "commercial",
        furnished: "any",
        propertyTypes: [],
        propertyType: "COMMERCIAL",
        rentListingCategory: null,
      };
    }

    if (listingMode === "rent") {
      return {
        ...DEFAULT_GLOBAL_FILTERS,
        ...common,
        type: "rent",
        furnished: featFurnished ? "yes" : "any",
        propertyTypes: residentialTypes.filter((p) => p !== "COMMERCIAL"),
        rentListingCategory: residentialTypes.includes("COMMERCIAL") ? "commercial" : "residential",
      };
    }

    const onlyCommercialChip = ptCommercial && !ptHouse && !ptCondo && !ptLand;
    if (onlyCommercialChip) {
      return {
        ...DEFAULT_GLOBAL_FILTERS,
        ...common,
        type: "commercial",
        furnished: "any",
        propertyTypes: [],
        propertyType: "COMMERCIAL",
        rentListingCategory: null,
      };
    }

    if (residentialTypes.length > 0) {
      return {
        ...DEFAULT_GLOBAL_FILTERS,
        ...common,
        type: "residential",
        furnished: "any",
        propertyTypes: residentialTypes,
        rentListingCategory: null,
      };
    }

    return {
      ...DEFAULT_GLOBAL_FILTERS,
      ...common,
      type: "buy",
      furnished: "any",
      propertyTypes: [],
      rentListingCategory: null,
    };
  }, [
    city,
    region,
    minPrice,
    maxPrice,
    listingMode,
    ptHouse,
    ptCondo,
    ptCommercial,
    ptLand,
    bedrooms,
    bathrooms,
    featParking,
    featFurnished,
    featNewConstruction,
    featPool,
    insuredOnly,
    sort,
  ]);

  const apply = useCallback(() => {
    if (listingMode === "stays") {
      const g = buildGlobal();
      const qs = globalFiltersToBnhubParams({ ...g, type: "short" }).toString();
      router.push(qs ? `/bnhub/stays?${qs}` : "/bnhub/stays");
      setDrawerOpen(false);
      return;
    }
    const g = buildGlobal();
    const p = globalFiltersToUrlParams(g);
    const qs = p.toString();
    router.push(qs ? `/search?${qs}` : "/search");
    setDrawerOpen(false);
  }, [buildGlobal, listingMode, router]);

  const filterBody = useMemo(
    () => (
      <div className="space-y-8">
        <div className={sectionCls}>
          <p className={labelCls}>Listing type</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["sale", "For sale"],
                ["rent", "For rent"],
                ["commercial", "Commercial"],
                ["stays", "BNHUB stays"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setListingMode(id)}
                className={chipCls(listingMode === id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={sectionCls}>
          <p className={labelCls}>Location</p>
          <input className={inputCls} placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <input
            className={`${inputCls} mt-2`}
            placeholder="Region / area (optional)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>

        <div className={sectionCls}>
          <p className={labelCls}>Price (CAD)</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              className={inputCls}
              type="number"
              min={0}
              step={10000}
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              className={inputCls}
              type="number"
              min={0}
              step={10000}
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {listingMode !== "stays" ? (
          <div className={sectionCls}>
            <p className={labelCls}>Property type</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={chipCls(ptHouse)} onClick={() => setPtHouse((v) => !v)}>
                House
              </button>
              <button type="button" className={chipCls(ptCondo)} onClick={() => setPtCondo((v) => !v)}>
                Condo
              </button>
              <button type="button" className={chipCls(ptCommercial)} onClick={() => setPtCommercial((v) => !v)}>
                Commercial
              </button>
              <button type="button" className={chipCls(ptLand)} onClick={() => setPtLand((v) => !v)}>
                Land
              </button>
            </div>
          </div>
        ) : null}

        <div className={sectionCls}>
          <p className={labelCls}>Rooms</p>
          <div className="grid grid-cols-2 gap-2">
            <select className={inputCls} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
              <option value="">Bedrooms — any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  {n}+ beds
                </option>
              ))}
            </select>
            <select className={inputCls} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)}>
              <option value="">Bathrooms — any</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={String(n)}>
                  {n}+ baths
                </option>
              ))}
            </select>
          </div>
        </div>

        {listingMode !== "stays" ? (
          <div className={sectionCls}>
            <p className={labelCls}>Features</p>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={featParking} onChange={(e) => setFeatParking(e.target.checked)} />
                Parking
              </label>
              {listingMode === "rent" ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                  <input type="checkbox" checked={featFurnished} onChange={(e) => setFeatFurnished(e.target.checked)} />
                  Furnished
                </label>
              ) : null}
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={featNewConstruction}
                  onChange={(e) => setFeatNewConstruction(e.target.checked)}
                />
                New construction
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={featPool} onChange={(e) => setFeatPool(e.target.checked)} />
                Pool
              </label>
              <div className="my-2 h-px bg-white/5" />
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#D4AF37]">
                <input type="checkbox" checked={insuredOnly} onChange={(e) => setInsuredOnly(e.target.checked)} />
                Insured brokers only 🛡️
              </label>
            </div>
          </div>
        ) : null}

        <div className={sectionCls}>
          <p className={labelCls}>Sort</p>
          <select
            className={inputCls}
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            disabled={listingMode === "stays"}
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="priceLow">Price · Low to high</option>
            <option value="priceHigh">Price · High to low</option>
          </select>
        </div>

        <p className="text-xs text-white/45">
          Map filters coming soon. Results use the same rules as the public listings catalog.
        </p>
      </div>
    ),
    [
      listingMode,
      city,
      region,
      minPrice,
      maxPrice,
      ptHouse,
      ptCondo,
      ptCommercial,
      ptLand,
      bedrooms,
      bathrooms,
      featParking,
      featFurnished,
      featNewConstruction,
      featPool,
      insuredOnly,
      sort,
    ]
  );

  const applyBar = (
    <div className="flex gap-2 border-t border-white/10 bg-[#0a0a0a] p-4 lg:border-0 lg:bg-transparent lg:p-0">
      <button
        type="button"
        onClick={() => apply()}
        className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-semibold text-black hover:brightness-105"
      >
        {listingMode === "stays" ? "Search stays in BNHUB" : "Apply filters"}
      </button>
      <button
        type="button"
        onClick={() => {
          router.push("/search");
          setDrawerOpen(false);
        }}
        className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/70 hover:border-white/25"
      >
        Reset
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold text-[#D4AF37] sm:text-2xl">Advanced search</h1>
            <p className="mt-1 text-sm text-white/55">Full filters · URL syncs for sharing · BNHUB opens for stays</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-sm text-white/60 hover:text-[#D4AF37]">
              Home
            </Link>
            <Link href="/listings" className="text-sm text-white/60 hover:text-[#D4AF37]">
              Simple browse
            </Link>
            <button
              type="button"
              className="rounded-lg border border-[#D4AF37]/40 px-4 py-2 text-sm font-medium text-[#D4AF37] lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[320px_1fr] lg:gap-8 lg:px-6 lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-xl border border-white/10 bg-black/60 p-5">
            {filterBody}
            <div className="mt-8">{applyBar}</div>
          </div>
        </aside>

        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="Search filters">
            <button
              type="button"
              className="absolute inset-0 bg-black/80"
              aria-label="Close filters"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#D4AF37]">Filters</span>
                <button type="button" className="text-white/60" onClick={() => setDrawerOpen(false)}>
                  Close
                </button>
              </div>
              {filterBody}
              <div className="sticky bottom-0 left-0 right-0 mt-6 bg-[#0b0b0b] pt-2">{applyBar}</div>
            </div>
          </div>
        ) : null}

        <main className="min-w-0">
          {listingMode === "stays" ? (
            <div className="rounded-xl border border-white/10 bg-black/60 p-8 text-center">
              <p className="text-lg text-white/85">Short-term stays use BNHUB.</p>
              <p className="mt-2 text-sm text-white/55">
                Set city and price, then apply to open the stays search with your criteria.
              </p>
              <button
                type="button"
                onClick={() => apply()}
                className="mt-6 rounded-full bg-[#D4AF37] px-8 py-3 text-sm font-semibold text-black"
              >
                Go to BNHUB stays
              </button>
            </div>
          ) : (
            <ListingsBrowseClient embedded hideSearchEngineBar hubMode="buy" />
          )}
        </main>
      </div>
    </div>
  );
}
