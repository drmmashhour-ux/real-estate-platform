"use client";

import { useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BrowseFilterPanelFooter } from "@/components/search/BrowseFilterPanelFooter";
import { FilterCategory, FilterPanel } from "@/components/search/FilterPanel";
import { ActiveFilterChips } from "@/components/search/ActiveFilterChips";
import {
  BNHUB_AMENITY_KEYS,
  globalFiltersToUrlParams,
  listingTypeForSaleBrowseHref,
  type RentListingCategory,
  type SearchEngineMode,
} from "@/components/search/FilterState";
import { QuickFilterChips } from "@/components/search/QuickFilterChips";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { HomeSearchBar } from "@/components/search/HomeSearchBar";
import { SearchBar, propertyPresetFromPrices } from "@/components/search/SearchBar";
import { SearchEngineContext, useSearchEngineContext } from "@/components/search/search-engine-context";
import { useSearchFilters, type UseSearchFiltersResult } from "@/hooks/useSearchFilters";
import { parseListingCodeFromSearchQuery } from "@/lib/listing-code-public";

export { useSearchEngineContext } from "@/components/search/search-engine-context";

export type SearchFiltersProviderProps = {
  mode: SearchEngineMode;
  children: ReactNode;
};

/** Hook + context only — use with `SearchEngineBar` when the toolbar must sit inside custom layout (e.g. below page title). */
export function SearchFiltersProvider({ mode, children }: SearchFiltersProviderProps) {
  const search = useSearchFilters(mode);
  return <SearchEngineContext.Provider value={search}>{children}</SearchEngineContext.Provider>;
}

export type SearchEngineBarProps = {
  /** Extra classes on the filter panel card (e.g. stays slate theme). */
  filterPanelClassName?: string;
  /** White inputs + gold search control (public listings hero). */
  barTone?: "dark" | "light";
  /**
   * Puts the bar + save in a white card; quick/active chips sit below on the hero overlay (Centris-style).
   * Ignored when `barTone` is not `light`.
   */
  heroLayout?: boolean;
  /** Homepage only — structured Rent / Buy / Sell + journey + property row. */
  heroBrowseMode?: "buy" | "rent";
  onHeroBrowseModeChange?: (m: "buy" | "rent") => void;
};

/** SearchBar + FilterPanel — requires `SearchFiltersProvider` ancestor. */
export function SearchEngineBar({
  filterPanelClassName = "",
  barTone = "dark",
  heroLayout = false,
  heroBrowseMode,
  onHeroBrowseModeChange,
}: SearchEngineBarProps) {
  const {
    mode,
    draft,
    setDraft,
    apply,
    reset,
    pricePresetId,
    setPricePresetId,
    applyPricePresetBrowse,
    applyPricePresetStays,
    filtersOpen,
    setFiltersOpen,
    activeFilterCount,
    setFilterType,
    cancelFilters,
  } = useSearchEngineContext();

  const router = useRouter();

  const handleSearchClick = useCallback(async () => {
    if (draft.type === "sell") {
      router.push("/selling");
      return;
    }
    const code = parseListingCodeFromSearchQuery(draft.location);
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
    apply();
  }, [apply, draft.location, router]);

  const isShort = mode === "short";
  const tone = barTone === "light" && !isShort ? "light" : "dark";
  const useHero = Boolean(heroLayout && barTone === "light" && !isShort);
  const chipTone = useHero ? "hero" : isShort ? "slate" : "gold";
  const showHomeBar = Boolean(useHero && heroBrowseMode != null && onHeroBrowseModeChange != null);

  const buySelfHrefListings = (() => {
    const listingType = listingTypeForSaleBrowseHref(draft.type);
    const p = globalFiltersToUrlParams({ ...draft, type: listingType });
    const q = p.toString();
    return q ? `/listings?${q}` : "/listings";
  })();

  const rentSelfHrefListings = (() => {
    const p = globalFiltersToUrlParams({ ...draft, type: "rent" });
    const q = p.toString();
    return q ? `/listings?${q}` : "/listings?dealType=RENT";
  })();

  const bar = showHomeBar ? (
    <HomeSearchBar
      tone={tone}
      heroBrowseMode={heroBrowseMode!}
      onHeroBrowseModeChange={onHeroBrowseModeChange!}
      onSearchClick={() => void handleSearchClick()}
    />
  ) : mode === "buy" ? (
      <SearchBar
        searchMode="buy"
        tone={tone}
        location={draft.location}
        onLocationChange={(v) => setDraft((d) => ({ ...d, location: v }))}
        filterType={draft.type}
        onFilterTypeChange={setFilterType}
        buyByYourselfHref={buySelfHrefListings}
        rentByYourselfHref={rentSelfHrefListings}
        pricePresetId={pricePresetId}
        onPricePresetChange={applyPricePresetBrowse}
        browsePriceMin={draft.priceMin}
        browsePriceMax={draft.priceMax}
        onBrowsePriceRangeChange={(min, max) => {
          setDraft((d) => ({ ...d, priceMin: min, priceMax: max }));
          setPricePresetId(propertyPresetFromPrices(String(min), String(max)));
        }}
        filtersOpen={filtersOpen}
        onFiltersClick={() => setFiltersOpen((o) => !o)}
        onSearchClick={() => void handleSearchClick()}
        activeFilterCount={activeFilterCount}
        listingCodeHint
      />
    ) : mode === "rent" ? (
      <SearchBar
        searchMode="rent"
        tone={tone}
        location={draft.location}
        onLocationChange={(v) => setDraft((d) => ({ ...d, location: v }))}
        filterType={draft.type}
        onFilterTypeChange={setFilterType}
        buyByYourselfHref={buySelfHrefListings}
        rentByYourselfHref={rentSelfHrefListings}
        pricePresetId={pricePresetId}
        onPricePresetChange={applyPricePresetBrowse}
        browsePriceMin={draft.priceMin}
        browsePriceMax={draft.priceMax}
        onBrowsePriceRangeChange={(min, max) => {
          setDraft((d) => ({ ...d, priceMin: min, priceMax: max }));
          setPricePresetId(propertyPresetFromPrices(String(min), String(max)));
        }}
        filtersOpen={filtersOpen}
        onFiltersClick={() => setFiltersOpen((o) => !o)}
        onSearchClick={() => void handleSearchClick()}
        activeFilterCount={activeFilterCount}
        listingCodeHint
      />
    ) : (
      <SearchBar
        searchMode="short"
        location={draft.location}
        onLocationChange={(v) => setDraft((d) => ({ ...d, location: v }))}
        pricePresetId={pricePresetId}
        onPricePresetChange={applyPricePresetStays}
        filtersOpen={filtersOpen}
        onFiltersClick={() => setFiltersOpen((o) => !o)}
        onSearchClick={() => void handleSearchClick()}
        activeFilterCount={activeFilterCount}
        listingCodeHint
      />
    );

  const footerSlate = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={reset}
        className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={() => apply()}
        className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400"
      >
        Apply
      </button>
    </div>
  );

  const saveTone = isShort ? "slate" : useHero ? "light" : "gold";

  const barRow = showHomeBar ? (
    <div className="min-w-0 w-full">{bar}</div>
  ) : (
    <div className="flex flex-wrap items-start gap-3">
      <div className="min-w-0 flex-1">{bar}</div>
      <SaveSearchButton tone={saveTone} />
    </div>
  );

  return (
    <div className="relative z-[60] space-y-2">
      {useHero ? (
        <div className="rounded-2xl bg-white p-4 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] ring-1 ring-black/5 sm:p-5">{barRow}</div>
      ) : (
        barRow
      )}
      <ActiveFilterChips tone={chipTone === "hero" ? "hero" : "default"} />
      {!useHero ? <QuickFilterChips tone={chipTone} /> : null}
      <div className="relative z-[60]">
        <FilterPanel
          open={filtersOpen}
          onClose={cancelFilters}
          size={isShort ? "xl" : "2xl"}
          tone={isShort ? "dark" : "light"}
          className={
            isShort
              ? ["border-slate-700/90 bg-slate-900/98 shadow-black/50", filterPanelClassName].join(" ")
              : filterPanelClassName
          }
          footer={isShort ? footerSlate : <BrowseFilterPanelFooter />}
        >
          {isShort ? <ShortFilterFields /> : mode === "rent" ? <RentFilterFields /> : <BuyFilterFields />}
        </FilterPanel>
      </div>
    </div>
  );
}

const FIELD =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#C9A646]/55 focus:outline-none focus:ring-2 focus:ring-[#C9A646]/20";
const LABEL = "block text-xs font-medium text-slate-600";

const PROPERTY_CHECKBOXES = [
  { id: "SINGLE_FAMILY", label: "Single-family home" },
  { id: "CONDO", label: "Condo / loft" },
  { id: "TOWNHOUSE", label: "Townhouse" },
  { id: "MULTI_FAMILY", label: "Multi-unit (plex)" },
  { id: "LAND", label: "Land" },
] as const;

const FEATURE_GRID: readonly [string, string][] = [
  ["elevator", "Elevator"],
  ["waterfront", "Waterfront"],
  ["accessible", "Accessibility"],
  ["vacation", "Vacation / resort"],
  ["smoking", "Smoking allowed"],
  ["pets", "Pets allowed"],
  ["parking", "Parking"],
];

const BUILDING_STYLE: readonly [string, string][] = [
  ["new construction", "New construction"],
  ["bungalow", "Bungalow"],
  ["split-level", "Split-level"],
  ["semi-detached", "Semi-detached"],
  ["historic", "Historic / century"],
  ["multi-story", "Multi-story"],
  ["detached", "Detached"],
  ["row", "Row house"],
];

const PLEX_KEYWORDS: readonly [string, string][] = [
  ["duplex", "Duplex"],
  ["triplex", "Triplex"],
  ["quadruplex", "Quadruplex"],
  ["quintuplex", "Quintuplex"],
];

function CentrisCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#C9A646] focus:ring-[#C9A646]/40"
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}

const LISTING_CATEGORY_SEGMENTS: { id: import("@/components/search/FilterState").GlobalSearchFilterType; label: string }[] =
  [
    { id: "residential", label: "Residential" },
    { id: "commercial", label: "Commercial" },
    { id: "luxury_properties", label: "Luxury" },
    { id: "new_construction", label: "New construction" },
  ];

const RENT_LISTING_CATEGORY_SEGMENTS: { id: RentListingCategory; label: string }[] = [
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "luxury_properties", label: "Luxury" },
  { id: "new_construction", label: "New construction" },
];

/** Buy hub — Centris-style: checkbox grids, range rows, keyword features (`/api/buyer/browse`). */
function BuyFilterFields() {
  const { draft, setDraft, setPricePresetId, setFilterType } = useSearchEngineContext();
  const commercial = draft.type === "commercial";
  const residentialOnly = draft.type === "residential";
  const luxuryMode = draft.type === "luxury_properties";
  const newConstructionMode = draft.type === "new_construction";

  const selectedTypes = draft.propertyTypes ?? [];

  const togglePropertyType = (id: string) => {
    setDraft((d) => {
      const cur = d.propertyTypes ?? [];
      const set = new Set(cur);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...d, propertyTypes: [...set], propertyType: "" };
    });
  };

  const toggleFeature = (kw: string) => {
    setDraft((d) => {
      const has = d.features.includes(kw);
      const nextFeatures = has ? d.features.filter((x) => x !== kw) : [...d.features, kw];
      return { ...d, features: nextFeatures };
    });
  };

  const luxuryOn = draft.priceMin >= 1_000_000;
  const toggleLuxury = () => {
    setDraft((d) => {
      const nextMin = d.priceMin >= 1_000_000 ? 0 : 1_000_000;
      const next = { ...d, priceMin: nextMin };
      setPricePresetId(propertyPresetFromPrices(String(next.priceMin), String(next.priceMax)));
      return next;
    });
  };

  const bedSelect = (
    <select
      value={draft.bedrooms ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        setDraft((d) => ({ ...d, bedrooms: v === "" ? null : parseInt(v, 10) }));
      }}
      className={FIELD}
    >
      <option value="">Any</option>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <option key={n} value={n}>
          {n}+
        </option>
      ))}
    </select>
  );

  const bathSelect = (
    <select
      value={draft.bathrooms ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        setDraft((d) => ({ ...d, bathrooms: v === "" ? null : parseInt(v, 10) }));
      }}
      className={FIELD}
    >
      <option value="">Any</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n}+
        </option>
      ))}
    </select>
  );

  const segmentBtn = (active: boolean) =>
    [
      "min-h-[2.5rem] rounded-lg border px-3 py-2 text-xs font-semibold transition",
      active
        ? "border-[#C9A646] bg-[#C9A646] text-black"
        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
    ].join(" ");

  const featurePill = (kw: string, label: string) => {
    const on = draft.features.includes(kw);
    return (
      <button
        key={kw}
        type="button"
        onClick={() => toggleFeature(kw)}
        className={[
          "min-h-[2.5rem] rounded-lg border px-3 py-2 text-xs font-semibold transition",
          on
            ? "border-[#C9A646] bg-[#C9A646] text-black"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-1">
      <p className="mb-3 text-xs text-slate-500">
        Choose property type and features, then press Search in the footer to apply to the page URL.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <FilterCategory title="Property type" variant="centris" defaultOpen>
          <p className="mb-3 text-[11px] text-slate-500">
            Residential, commercial, luxury, and new construction are exclusive segments for this search.
          </p>
          <div className="flex flex-wrap gap-2">
            {LISTING_CATEGORY_SEGMENTS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterType(id)}
                className={segmentBtn(draft.type === id)}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterCategory>

        <FilterCategory title="Features" variant="centris" defaultOpen>
          <p className="mb-3 text-[11px] text-slate-500">Pool and Garage match keywords in listing descriptions.</p>
          <div className="flex flex-wrap gap-2">
            {featurePill("pool", "Pool")}
            {featurePill("garage", "Garage")}
          </div>
        </FilterCategory>

        <FilterCategory title="Home style" variant="centris" defaultOpen>
          {commercial ? (
            <p className="text-sm text-slate-600">
              Use <strong className="font-semibold text-slate-800">Property type</strong> above and choose Residential to pick home styles here.
            </p>
          ) : (
            <>
              {residentialOnly ? (
                <p className="mb-3 text-[11px] text-slate-500">
                  Residential search excludes commercial listings. Use the Commercial tab for office and retail
                  inventory.
                </p>
              ) : null}
              {luxuryMode ? (
                <p className="mb-3 text-[11px] text-slate-500">
                  Luxury search uses a $1M minimum list price. You can raise the minimum in Other criteria.
                </p>
              ) : null}
              {newConstructionMode ? (
                <p className="mb-3 text-[11px] text-slate-500">
                  New construction matches listings that mention new construction in the title or description.
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PROPERTY_CHECKBOXES.map(({ id, label }) => (
                  <CentrisCheckbox
                    key={id}
                    checked={selectedTypes.includes(id)}
                    onChange={() => togglePropertyType(id)}
                    label={label}
                  />
                ))}
              </div>
            </>
          )}
        </FilterCategory>

        <FilterCategory title="Rooms and more keywords" variant="centris">
          <p className="mb-3 text-[11px] text-slate-500">
            Rooms and baths filter structured fields; other options search listing descriptions (keywords).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              Bedrooms (min)
              {bedSelect}
            </label>
            <label className={LABEL}>
              Bathrooms (min)
              {bathSelect}
            </label>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {FEATURE_GRID.map(([kw, label]) => (
              <CentrisCheckbox
                key={kw}
                checked={draft.features.includes(kw)}
                onChange={() => toggleFeature(kw)}
                label={label}
              />
            ))}
          </div>
        </FilterCategory>

        <FilterCategory title="Building" variant="centris">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              Living area min (sq ft)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.minSqft ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    minSqft: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Min"
              />
            </label>
            <label className={LABEL}>
              Living area max (sq ft)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.maxSqft ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    maxSqft: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Max"
              />
            </label>
            <label className={LABEL}>
              Year built min
              <input
                type="number"
                min={1700}
                max={2100}
                inputMode="numeric"
                value={draft.yearBuiltMin ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    yearBuiltMin: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Min"
              />
            </label>
            <label className={LABEL}>
              Year built max
              <input
                type="number"
                min={1700}
                max={2100}
                inputMode="numeric"
                value={draft.yearBuiltMax ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    yearBuiltMax: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Max"
              />
            </label>
          </div>
          <p className="mb-2 mt-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">Building style</p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {BUILDING_STYLE.map(([kw, label]) => (
              <CentrisCheckbox
                key={kw}
                checked={draft.features.includes(kw)}
                onChange={() => toggleFeature(kw)}
                label={label}
              />
            ))}
          </div>
        </FilterCategory>

        <FilterCategory title="Plex" variant="centris">
          <p className="mb-3 text-[11px] text-slate-500">Match unit count keywords in descriptions (duplex, triplex, …).</p>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {PLEX_KEYWORDS.map(([kw, label]) => (
              <CentrisCheckbox
                key={kw}
                checked={draft.features.includes(kw)}
                onChange={() => toggleFeature(kw)}
                label={label}
              />
            ))}
          </div>
        </FilterCategory>

        <FilterCategory title="Other criteria" variant="centris">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              Min price (CAD)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.priceMin === 0 ? "" : draft.priceMin}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw === "" ? 0 : parseInt(raw, 10) || 0;
                  setDraft((d) => {
                    const next = { ...d, priceMin: v };
                    setPricePresetId(propertyPresetFromPrices(String(next.priceMin), String(next.priceMax)));
                    return next;
                  });
                }}
                className={FIELD}
                placeholder="No min"
              />
            </label>
            <label className={LABEL}>
              Max price (CAD)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.priceMax === 0 ? "" : draft.priceMax}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw === "" ? 0 : parseInt(raw, 10) || 0;
                  setDraft((d) => {
                    const next = { ...d, priceMax: v };
                    setPricePresetId(propertyPresetFromPrices(String(next.priceMin), String(next.priceMax)));
                    return next;
                  });
                }}
                className={FIELD}
                placeholder="No max"
              />
            </label>
            <label className={`sm:col-span-2 ${LABEL}`}>
              <span className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={luxuryOn}
                  onChange={() => toggleLuxury()}
                  className="h-4 w-4 rounded border-slate-300 text-[#C9A646] focus:ring-[#C9A646]/40"
                />
                Luxury ($1M+ minimum price)
              </span>
            </label>
          </div>
        </FilterCategory>
      </div>
    </div>
  );
}

/** Long-term rent — Centris-style accordion (wired to `/api/buyer/browse`). */
function RentFilterFields() {
  const { draft, setDraft, setPricePresetId } = useSearchEngineContext();
  const leaseVal = draft.leaseMonthsMin != null && draft.leaseMonthsMin > 0 ? String(draft.leaseMonthsMin) : "";

  const toggleFeature = (kw: string) => {
    setDraft((d) => {
      const has = d.features.includes(kw);
      const nextFeatures = has ? d.features.filter((x) => x !== kw) : [...d.features, kw];
      return { ...d, features: nextFeatures };
    });
  };

  const rentSegmentBtn = (active: boolean) =>
    [
      "min-h-[2.5rem] rounded-lg border px-3 py-2 text-xs font-semibold transition",
      active
        ? "border-[#C9A646] bg-[#C9A646] text-black"
        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
    ].join(" ");

  const rentFeaturePill = (kw: string, label: string) => {
    const on = draft.features.includes(kw);
    return (
      <button
        key={kw}
        type="button"
        onClick={() => toggleFeature(kw)}
        className={[
          "min-h-[2.5rem] rounded-lg border px-3 py-2 text-xs font-semibold transition",
          on
            ? "border-[#C9A646] bg-[#C9A646] text-black"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  const rentFeatureBtn = (kw: string, label: string) => {
    const on = draft.features.includes(kw);
    return (
      <button
        key={kw}
        type="button"
        onClick={() => toggleFeature(kw)}
        className={[
          "min-h-[2.5rem] rounded-lg border px-3 py-2 text-xs font-semibold transition",
          on
            ? "border-[#C9A646] bg-[#C9A646] text-black"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  const setRentListingCategory = (id: RentListingCategory) => {
    setDraft((d) => {
      if (id !== "luxury_properties") {
        return { ...d, type: "rent" as const, rentListingCategory: id };
      }
      const nextMin = Math.max(d.priceMin, 1_000_000);
      queueMicrotask(() =>
        setPricePresetId(propertyPresetFromPrices(String(nextMin), String(d.priceMax)))
      );
      return { ...d, type: "rent" as const, rentListingCategory: id, priceMin: nextMin };
    });
  };

  return (
    <div className="space-y-1">
      <p className="mb-3 text-xs text-slate-500">
        Rental filters — price range stays on the search bar. Press Search in the footer to apply.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <FilterCategory title="Property type" variant="centris" defaultOpen>
          <p className="mb-3 text-[11px] text-slate-500">
            Residential, commercial, luxury, and new construction narrow long-term rentals.
          </p>
          <div className="flex flex-wrap gap-2">
            {RENT_LISTING_CATEGORY_SEGMENTS.map(({ id, label }) => {
              const active =
                draft.rentListingCategory === id ||
                (draft.rentListingCategory == null && id === "residential");
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRentListingCategory(id)}
                  className={rentSegmentBtn(active)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </FilterCategory>

        <FilterCategory title="Features" variant="centris" defaultOpen>
          <p className="mb-3 text-[11px] text-slate-500">Pool and Garage match keywords in listing descriptions.</p>
          <div className="flex flex-wrap gap-2">
            {rentFeaturePill("pool", "Pool")}
            {rentFeaturePill("garage", "Garage")}
          </div>
        </FilterCategory>

        <FilterCategory title="Lease duration" variant="centris" defaultOpen>
          <label className={LABEL}>
            Minimum lease
            <select
              value={leaseVal}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d) => ({
                  ...d,
                  leaseMonthsMin: v === "" ? null : parseInt(v, 10) || null,
                }));
              }}
              className={FIELD}
            >
              <option value="">Any length</option>
              <option value="6">6+ months</option>
              <option value="12">12+ months</option>
              <option value="24">24+ months</option>
            </select>
          </label>
        </FilterCategory>

        <FilterCategory title="Furnished" variant="centris">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "any" as const, label: "Any" },
                { id: "yes" as const, label: "Furnished" },
                { id: "no" as const, label: "Unfurnished" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, furnished: id }))}
                className={[
                  "min-h-[2.5rem] rounded-lg border px-3 py-2 text-xs font-semibold transition",
                  draft.furnished === id
                    ? "border-[#C9A646] bg-[#C9A646] text-black"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterCategory>

        <FilterCategory title="Rental keywords" variant="centris">
          <p className="mb-2 text-[11px] text-slate-500">Keyword matches in listing descriptions.</p>
          <div className="flex flex-wrap gap-2">
            {rentFeatureBtn("utilities included", "Utilities included")}
            {rentFeatureBtn("parking", "Parking")}
            {rentFeatureBtn("transit", "Near transit")}
          </div>
        </FilterCategory>

        <FilterCategory title="Building" variant="centris">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              Min living area (sq ft)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.minSqft ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    minSqft: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Any"
              />
            </label>
            <label className={LABEL}>
              Max living area (sq ft)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.maxSqft ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    maxSqft: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Any"
              />
            </label>
            <label className={`sm:col-span-2 ${LABEL}`}>
              Year built (min)
              <input
                type="number"
                min={1700}
                max={2100}
                inputMode="numeric"
                value={draft.yearBuiltMin ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    yearBuiltMin: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Any"
              />
            </label>
          </div>
        </FilterCategory>

        <FilterCategory title="Other criteria" variant="centris">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              Min monthly price (CAD)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.priceMin === 0 ? "" : draft.priceMin}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw === "" ? 0 : parseInt(raw, 10) || 0;
                  setDraft((d) => {
                    const next = { ...d, priceMin: v };
                    setPricePresetId(propertyPresetFromPrices(String(next.priceMin), String(next.priceMax)));
                    return next;
                  });
                }}
                className={FIELD}
                placeholder="No min"
              />
            </label>
            <label className={LABEL}>
              Max monthly price (CAD)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.priceMax === 0 ? "" : draft.priceMax}
                onChange={(e) => {
                  const raw = e.target.value;
                  const v = raw === "" ? 0 : parseInt(raw, 10) || 0;
                  setDraft((d) => {
                    const next = { ...d, priceMax: v };
                    setPricePresetId(propertyPresetFromPrices(String(next.priceMin), String(next.priceMax)));
                    return next;
                  });
                }}
                className={FIELD}
                placeholder="No max"
              />
            </label>
            <label className={LABEL}>
              Min bedrooms
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.bedrooms ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    bedrooms: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Any"
              />
            </label>
            <label className={LABEL}>
              Min bathrooms
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.bathrooms ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    bathrooms: raw === "" ? null : parseInt(raw, 10) || null,
                  }));
                }}
                className={FIELD}
                placeholder="Any"
              />
            </label>
          </div>
        </FilterCategory>
      </div>
    </div>
  );
}

const STAYS_AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi‑Fi",
  kitchen: "Kitchen",
  ac: "A/C",
  parking: "Parking",
  washer: "Washer / laundry",
  pet_friendly: "Pet-friendly",
  verified: "Verified host",
  instant_book: "Instant book",
};

/** BNHub — dates, guests, amenities. */
function ShortFilterFields() {
  const { draft, setDraft } = useSearchEngineContext();

  function toggleStaysFeature(feat: string) {
    setDraft((d) => ({
      ...d,
      features: d.features.includes(feat) ? d.features.filter((x) => x !== feat) : [...d.features, feat],
    }));
  }

  const staysKeys = [...BNHUB_AMENITY_KEYS, "verified", "instant_book"] as const;

  return (
    <>
      <p className="mb-4 text-xs text-slate-500">
        Short-term stays — dates and guest count; nightly price presets are on the bar. Amenities match listing data.
      </p>
      <div className="space-y-3">
        <FilterCategory title="Dates" defaultOpen variant="slate">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-400">
              Check-in
              <input
                type="date"
                value={draft.checkIn ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, checkIn: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950/80 px-2 py-2 text-sm text-slate-100"
              />
            </label>
            <label className="block text-xs text-slate-400">
              Check-out
              <input
                type="date"
                value={draft.checkOut ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, checkOut: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950/80 px-2 py-2 text-sm text-slate-100"
              />
            </label>
          </div>
        </FilterCategory>

        <FilterCategory title="Guests" variant="slate">
          <label className="block text-xs text-slate-400">
            Number of guests
            <input
              type="number"
              min={1}
              placeholder="1"
              value={draft.guests ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                setDraft((d) => ({
                  ...d,
                  guests: raw === "" ? null : parseInt(raw, 10) || null,
                }));
              }}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950/80 px-2 py-2 text-sm text-slate-100"
            />
          </label>
        </FilterCategory>

        <FilterCategory title="Amenities" variant="slate">
          <div className="flex flex-col gap-2.5 text-sm text-slate-300">
            {staysKeys.map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.features.includes(key)}
                  onChange={() => toggleStaysFeature(key)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                {STAYS_AMENITY_LABELS[key] ?? key}
              </label>
            ))}
          </div>
        </FilterCategory>
      </div>
    </>
  );
}

export type SearchEngineProps = {
  mode: SearchEngineMode;
  /** Content below the search bar + filter dropdown (e.g. smart search, results). */
  children?: ReactNode;
  /** Extra classes on the filter panel card (e.g. stays slate theme). */
  filterPanelClassName?: string;
};

export function SearchEngine({ mode, children, filterPanelClassName = "" }: SearchEngineProps) {
  return (
    <SearchFiltersProvider mode={mode}>
      <SearchEngineBar filterPanelClassName={filterPanelClassName} />
      {children}
    </SearchFiltersProvider>
  );
}
