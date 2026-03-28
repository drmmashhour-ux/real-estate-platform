"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { GlobalSearchFilterType, SearchEngineMode } from "@/components/search/FilterState";
import {
  MODES,
  MODE_OPTION_STATIC_HREFS,
  MODE_OPTIONS,
  type BrowseMode,
} from "@/components/search/home-search-modes";
import { PriceRangeSlider } from "@/components/search/PriceRangeSlider";
import { SEARCH_JOURNEY } from "@/components/search/search-bar-classes";

function browseModeFromFilterType(ft: GlobalSearchFilterType): BrowseMode {
  if (ft === "sell") return "sell";
  if (ft === "rent") return "rent";
  return "buy";
}

function hrefForBrowseOption(mode: BrowseMode, index: number, buySelf: string, rentSelf: string): string {
  if (mode === "buy" && index === 0) return buySelf;
  if (mode === "rent" && index === 0) return rentSelf;
  return MODE_OPTION_STATIC_HREFS[mode][index];
}

export const PROPERTY_PRICE_PRESETS = [
  { id: "any", label: "Any", min: "", max: "" },
  { id: "under300", label: "< $300k", min: "", max: "300000" },
  { id: "300_500", label: "$300k – $500k", min: "300000", max: "500000" },
  { id: "500_1m", label: "$500k – $1M", min: "500000", max: "1000000" },
  { id: "1m_plus", label: "$1M+", min: "1000000", max: "" },
] as const;

export const STAY_PRICE_PRESETS = [
  { id: "any", label: "Any", min: "", max: "" },
  { id: "under100", label: "< $100", min: "", max: "100" },
  { id: "100_200", label: "$100 – $200", min: "100", max: "200" },
  { id: "200_350", label: "$200 – $350", min: "200", max: "350" },
  { id: "350_plus", label: "$350+", min: "350", max: "" },
] as const;

export function propertyPresetFromPrices(minPrice: string, maxPrice: string): string {
  const norm = (s: string) => {
    const t = s.trim();
    return t === "" || t === "0" ? "" : t;
  };
  const a = norm(minPrice);
  const b = norm(maxPrice);
  const hit = PROPERTY_PRICE_PRESETS.find((p) => p.min === a && p.max === b);
  return hit?.id ?? "custom";
}

export function stayPresetFromPrices(minPrice: string, maxPrice: string): string {
  const a = minPrice.trim();
  const b = maxPrice.trim();
  const hit = STAY_PRICE_PRESETS.find((p) => p.min === a && p.max === b);
  return hit?.id ?? "any";
}

type Base = {
  searchMode: SearchEngineMode;
  location: string;
  onLocationChange: (v: string) => void;
  pricePresetId: string;
  onPricePresetChange: (presetId: string) => void;
  /** Buy/rent — continuous min/max price (CAD) from the range slider. */
  browsePriceMin?: number;
  browsePriceMax?: number;
  onBrowsePriceRangeChange?: (priceMin: number, priceMax: number) => void;
  filtersOpen: boolean;
  onFiltersClick: () => void;
  onSearchClick: () => void;
  activeFilterCount: number;
  /** Hint under location for public listing codes (LEC- / LST-). */
  listingCodeHint?: boolean;
  className?: string;
  /** `light` = white “Centris-style” bar on a dark hero; inputs use dark text. */
  tone?: "dark" | "light";
};

type BuyBar = Base & {
  searchMode: "buy";
  filterType: GlobalSearchFilterType;
  onFilterTypeChange: (v: GlobalSearchFilterType) => void;
  /** Dynamic “by yourself” targets for `MODE_OPTIONS`. */
  buyByYourselfHref?: string;
  rentByYourselfHref?: string;
};

type RentBar = Base & {
  searchMode: "rent";
  filterType: GlobalSearchFilterType;
  onFilterTypeChange: (v: GlobalSearchFilterType) => void;
  buyByYourselfHref?: string;
  rentByYourselfHref?: string;
};

type ShortBar = Base & {
  searchMode: "short";
};

export type SearchBarProps = BuyBar | RentBar | ShortBar;


export function SearchBar(props: SearchBarProps) {
  const {
    location,
    onLocationChange,
    pricePresetId,
    onPricePresetChange,
    browsePriceMin,
    browsePriceMax,
    onBrowsePriceRangeChange,
    filtersOpen,
    onFiltersClick,
    onSearchClick,
    activeFilterCount,
    listingCodeHint = false,
    className = "",
    tone = "dark",
  } = props;

  const { searchMode } = props;
  const presets = searchMode === "short" ? STAY_PRICE_PRESETS : PROPERTY_PRICE_PRESETS;
  const effectivePreset = pricePresetId;
  const isStays = searchMode === "short";
  const isGoldBar = searchMode === "buy" || searchMode === "rent";
  const light = tone === "light" && !isStays;
  const hasBrowseModes = (searchMode === "buy" || searchMode === "rent") && "filterType" in props;

  const [browseMode, setBrowseMode] = useState<BrowseMode>(() =>
    "filterType" in props ? browseModeFromFilterType(props.filterType) : "buy"
  );

  const syncedFilterType = "filterType" in props ? props.filterType : null;
  useEffect(() => {
    if (syncedFilterType == null) return;
    setBrowseMode(browseModeFromFilterType(syncedFilterType));
  }, [syncedFilterType]);

  const buySelfHrefResolved =
    hasBrowseModes && "buyByYourselfHref" in props && props.buyByYourselfHref ? props.buyByYourselfHref : "/listings";
  const rentSelfHrefResolved =
    hasBrowseModes && "rentByYourselfHref" in props && props.rentByYourselfHref
      ? props.rentByYourselfHref
      : "/listings?dealType=RENT";

  const hidePriceForSellMode = hasBrowseModes && browseMode === "sell";

  const shell =
    light
      ? "flex flex-col gap-3 rounded-none border-0 bg-transparent p-0 shadow-none sm:flex-row sm:flex-wrap sm:items-end sm:gap-3"
      : [
          "flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#141414]/90 p-3 shadow-lg shadow-black/30 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:p-4",
          isStays ? "border-slate-700/80 bg-slate-900/70" : "",
        ].join(" ");

  const labelCls = light ? "text-slate-500" : "text-slate-500";
  const inputCls = light
    ? "border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-premium-gold/60 focus:outline-none focus:ring-2 focus:ring-premium-gold/25"
    : "border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40";
  const hintCls = light ? "text-slate-500" : "text-slate-500";
  const typeRail = light ? "border-slate-200 bg-slate-100 p-0.5" : "border-white/10 bg-black/30 p-0.5";
  const priceIdle = light
    ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
    : "border-white/10 bg-black/30 text-slate-300 hover:border-white/20 hover:text-white";
  const filterIdle = light
    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    : "border-white/15 bg-black/30 text-slate-200 hover:border-white/25 hover:bg-white/5";
  const filterActive = light
    ? "border-premium-gold/60 bg-premium-gold/10 text-[#8a6a1e]"
    : "border-premium-gold/50 bg-premium-gold/10 text-premium-gold";

  return (
    <div className={[shell, className].join(" ")}>
      <div className={`min-w-0 flex-1 ${light ? "sm:min-w-[280px]" : "sm:min-w-[200px]"}`}>
        <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${labelCls}`}>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder={
            light
              ? "City, neighbourhood, region, address, or LEC- / LST- code"
              : isStays
                ? "City or listing code"
                : "City, area, or LEC- / LST- code"
          }
          className={`w-full rounded-xl border ${inputCls}`}
        />
        {listingCodeHint ? (
          <p className={`mt-1.5 text-[11px] ${hintCls}`}>
            Enter a public listing code (e.g. LST-ABCDEF) and press Search to open that listing.
          </p>
        ) : null}
      </div>

      {hasBrowseModes ? (
        <div className="w-full min-w-0 sm:max-w-[min(100%,640px)]">
          <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${labelCls}`}>Mode</label>
          <div className={`flex flex-wrap gap-1 rounded-xl border p-0.5 ${typeRail}`}>
            {MODES.map((id) => {
              const on = browseMode === id;
              const modeCls = on
                ? light
                  ? "border-premium-gold bg-premium-gold text-black shadow-sm"
                  : "border-premium-gold/80 bg-premium-gold text-black shadow-sm"
                : light
                  ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  : "border-white/10 bg-black/40 text-slate-400 hover:border-white/20 hover:text-white";
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    const next: BrowseMode = id;
                    setBrowseMode(next);
                    props.onFilterTypeChange(
                      next === "sell" ? "sell" : next === "rent" ? "rent" : "buy"
                    );
                  }}
                  className={[
                    "flex-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition sm:min-w-[64px] sm:px-3 sm:text-xs",
                    modeCls,
                  ].join(" ")}
                >
                  {id === "buy" ? "Buy" : id === "sell" ? "Sell" : "Rent"}
                </button>
              );
            })}
          </div>
          <div className="mt-2 space-y-1.5">
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${labelCls}`}>
              {browseMode === "buy" && "Buying paths"}
              {browseMode === "rent" && "Rental paths"}
              {browseMode === "sell" && "Selling paths"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MODE_OPTIONS[browseMode].map((option, i) => (
                <Link
                  key={option}
                  href={hrefForBrowseOption(browseMode, i, buySelfHrefResolved, rentSelfHrefResolved)}
                  className={[SEARCH_JOURNEY, "min-h-[2.5rem] flex-1 min-w-[7rem] justify-center text-center"].join(" ")}
                >
                  {option}
                </Link>
              ))}
            </div>
            {browseMode === "sell" ? (
              <p className={`text-[10px] ${hintCls}`}>
                Or press Search to open the full selling hub. Property type and keyword features are in Filters.
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="w-full sm:w-auto">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Type</label>
          <div className="rounded-xl border border-slate-600 bg-slate-950/50 px-3 py-2 text-center text-xs font-medium text-emerald-400">
            Short-term
          </div>
        </div>
      )}

      <div className="w-full min-w-0 sm:min-w-[260px] sm:max-w-[min(100%,420px)] sm:flex-1">
        {!hidePriceForSellMode ? (
          <>
            <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${labelCls}`}>
              {isStays ? "Nightly price ($)" : "Price (CAD)"}
            </label>
            {isStays ? (
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onPricePresetChange(p.id)}
                    className={[
                      "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                      effectivePreset === p.id
                        ? "border-transparent bg-premium-gold text-black"
                        : ["border", priceIdle].join(" "),
                    ].join(" ")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ) : null}
            {!isStays &&
            onBrowsePriceRangeChange != null &&
            typeof browsePriceMin === "number" &&
            typeof browsePriceMax === "number" ? (
              <PriceRangeSlider
                priceMin={browsePriceMin}
                priceMax={browsePriceMax}
                onChange={({ priceMin, priceMax }) => onBrowsePriceRangeChange(priceMin, priceMax)}
                tone={light ? "light" : "dark"}
              />
            ) : null}
          </>
        ) : (
          <p className={`text-[11px] ${hintCls}`}>Price filters apply when you search Buy or Rent (use Filters for property type).</p>
        )}
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
        <button
          type="button"
          onClick={onFiltersClick}
          className={[
            "relative rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
            filtersOpen || activeFilterCount > 0 ? filterActive : filterIdle,
            isStays &&
              (filtersOpen || activeFilterCount > 0
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                : "border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700/60"),
          ].join(" ")}
        >
          Filters
          {activeFilterCount > 0 ? (
            <span
              className={[
                "ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px]",
                light ? "bg-premium-gold/25 text-slate-900" : "bg-white/15 text-white",
              ].join(" ")}
            >
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onSearchClick}
          className={[
            "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition",
            light ? "min-h-[46px] min-w-[46px] px-4 py-3 sm:min-w-[52px]" : "px-5 py-2.5 text-sm",
            isStays
              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              : "text-black hover:brightness-110",
          ].join(" ")}
          style={isGoldBar ? { background: "var(--color-premium-gold)" } : undefined}
          aria-label="Search"
        >
          {light ? (
            <>
              <Search className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span className="sr-only">Search</span>
            </>
          ) : (
            "Search"
          )}
        </button>
      </div>
    </div>
  );
}
