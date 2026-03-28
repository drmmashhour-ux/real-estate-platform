"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { globalFiltersToUrlParams, listingTypeForSaleBrowseHref } from "@/components/search/FilterState";
import {
  MODES,
  MODE_OPTION_STATIC_HREFS,
  MODE_OPTIONS,
  type BrowseMode,
} from "@/components/search/home-search-modes";
import { PriceRangeSlider } from "@/components/search/PriceRangeSlider";
import { propertyPresetFromPrices } from "@/components/search/SearchBar";
import { SEARCH_BTN_PRIMARY, SEARCH_BTN_SECONDARY, SEARCH_JOURNEY } from "@/components/search/search-bar-classes";
import { useSearchEngineContext } from "@/components/search/SearchEngine";

function modeFromContext(draftType: string, heroBrowse: "buy" | "rent"): BrowseMode {
  if (draftType === "sell") return "sell";
  if (heroBrowse === "rent") return "rent";
  return "buy";
}

type HomeSearchBarProps = {
  tone: "dark" | "light";
  heroBrowseMode: "buy" | "rent";
  onHeroBrowseModeChange: (m: "buy" | "rent") => void;
  onSearchClick: () => void;
};

export function HomeSearchBar({ tone, heroBrowseMode, onHeroBrowseModeChange, onSearchClick }: HomeSearchBarProps) {
  const {
    draft,
    setDraft,
    setFilterType,
    setPricePresetId,
    filtersOpen,
    setFiltersOpen,
    activeFilterCount,
  } = useSearchEngineContext();

  const [mode, setMode] = useState<BrowseMode>(() => modeFromContext(draft.type, heroBrowseMode));

  useEffect(() => {
    setMode(modeFromContext(draft.type, heroBrowseMode));
  }, [draft.type, heroBrowseMode]);

  const light = tone === "light";
  const labelCls = light ? "text-slate-600" : "text-slate-500";
  const inputCls = light
    ? "border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-premium-gold/60 focus:outline-none focus:ring-2 focus:ring-premium-gold/25"
    : "border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40";

  const filterActive = light
    ? "border-premium-gold/60 bg-premium-gold/10 text-[#8a6a1e]"
    : "border-premium-gold/50 bg-premium-gold/10 text-premium-gold";

  const buySelfHref = (() => {
    const listingType = listingTypeForSaleBrowseHref(draft.type);
    const p = globalFiltersToUrlParams({ ...draft, type: listingType });
    const q = p.toString();
    return q ? `/listings?${q}` : "/listings";
  })();

  const rentSelfHref = (() => {
    const p = globalFiltersToUrlParams({ ...draft, type: "rent" });
    const q = p.toString();
    return q ? `/listings?${q}` : "/listings?dealType=RENT";
  })();

  const subLinks = MODE_OPTIONS[mode].map((option, i) => {
    const href =
      mode === "buy" && i === 0
        ? buySelfHref
        : mode === "rent" && i === 0
          ? rentSelfHref
          : MODE_OPTION_STATIC_HREFS[mode][i]!;
    return { option, href };
  });

  const newListingsHref = (() => {
    const p = globalFiltersToUrlParams({ ...draft, type: "new_listing", sort: "newest" });
    const q = p.toString();
    return q ? `/listings?${q}` : "/listings?dealType=SALE&filterType=new_listing";
  })();

  const showPrice = draft.type !== "sell";

  const setBrowseMode = (m: BrowseMode) => {
    setMode(m);
    if (m === "sell") {
      setFilterType("sell");
      return;
    }
    if (m === "rent") {
      setFilterType("rent");
      onHeroBrowseModeChange("rent");
      return;
    }
    setFilterType("buy");
    onHeroBrowseModeChange("buy");
  };

  return (
    <div
      className={
        light
          ? "flex flex-col gap-4"
          : "flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#141414]/90 p-4 shadow-lg shadow-black/30 backdrop-blur-sm"
      }
    >
      <div className="min-w-0 w-full">
        <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${labelCls}`}>Location</label>
        <input
          type="text"
          value={draft.location}
          onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
          placeholder="City, area, or LEC- / LST- code"
          className={`w-full rounded-lg border ${inputCls}`}
        />
        <p className={`mt-1.5 text-[11px] ${labelCls}`}>
          Enter a public listing code and press Search to open that listing.
        </p>
      </div>

      <div>
        <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${labelCls}`}>Mode</label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((id) => {
            const on = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setBrowseMode(id)}
                className={[
                  SEARCH_BTN_SECONDARY,
                  "flex-1 min-w-[5.5rem] sm:flex-none",
                  on ? "!border-premium-gold !bg-premium-gold !text-black" : "",
                ].join(" ")}
              >
                {id === "buy" ? "Buy" : id === "sell" ? "Sell" : "Rent"}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${labelCls}`}>
          {mode === "buy" && "Buying paths"}
          {mode === "rent" && "Rental paths"}
          {mode === "sell" && "Selling paths"}
        </p>
        <div className="flex flex-wrap gap-2">
          {subLinks.map(({ option, href }) => (
            <Link
              key={option}
              href={href}
              className={[SEARCH_JOURNEY, "flex-1 min-w-[10rem] justify-center sm:flex-none"].join(" ")}
            >
              {option}
            </Link>
          ))}
        </div>
      </div>

      {showPrice ? (
        <div className="min-w-0 w-full">
          <label className={`mb-1 block text-[11px] font-semibold uppercase tracking-wide ${labelCls}`}>Price (CAD)</label>
          <PriceRangeSlider
            priceMin={draft.priceMin}
            priceMax={draft.priceMax}
            onChange={({ priceMin, priceMax }) => {
              setDraft((d) => ({ ...d, priceMin, priceMax }));
              setPricePresetId(propertyPresetFromPrices(String(priceMin), String(priceMax)));
            }}
            tone={light ? "light" : "dark"}
          />
        </div>
      ) : null}

      {draft.type !== "sell" ? (
        <p className={`text-[11px] ${labelCls}`}>
          <Link
            href={newListingsHref}
            className="font-medium text-premium-gold underline decoration-premium-gold/50 underline-offset-2 hover:text-[#d4b55a]"
          >
            Recently added listings (14 days)
          </Link>
          <span className="text-slate-500"> — newest inventory; not a filter preset.</span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className={[
            SEARCH_BTN_SECONDARY,
            "relative px-4 py-2.5 text-sm font-semibold",
            filtersOpen || activeFilterCount > 0 ? filterActive : "",
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
          className={[SEARCH_BTN_PRIMARY, "inline-flex flex-1 min-w-[8rem] items-center justify-center gap-2 sm:flex-none"].join(" ")}
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
