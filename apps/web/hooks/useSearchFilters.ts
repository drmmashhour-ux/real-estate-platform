"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  countActiveGlobalFilters,
  DEFAULT_GLOBAL_FILTERS,
  DEFAULT_STAYS_FILTERS,
  globalFiltersToUrlParams,
  OPEN_FULL_PROPERTY_FILTERS_PARAM,
  type GlobalSearchFiltersExtended,
  type GlobalSearchFilterType,
  type SearchEngineMode,
  urlParamsToGlobalFilters,
} from "@/components/search/FilterState";
import {
  PROPERTY_PRICE_PRESETS,
  STAY_PRICE_PRESETS,
  propertyPresetFromPrices,
  stayPresetFromPrices,
} from "@/components/search/SearchBar";
import { ProductAnalyticsEvents, reportProductEvent } from "@/lib/analytics/product-analytics";

export type { SearchEngineMode } from "@/components/search/FilterState";

export type UseSearchFiltersResult = {
  mode: SearchEngineMode;
  draft: GlobalSearchFiltersExtended;
  setDraft: Dispatch<SetStateAction<GlobalSearchFiltersExtended>>;
  /** Stays only — applied snapshot used for API fetch */
  applied: GlobalSearchFiltersExtended;
  apply: () => void;
  reset: () => void;
  pricePresetId: string;
  setPricePresetId: Dispatch<SetStateAction<string>>;
  applyPricePresetBrowse: (presetId: string) => void;
  applyPricePresetStays: (presetId: string) => void;
  filtersOpen: boolean;
  setFiltersOpen: Dispatch<SetStateAction<boolean>>;
  activeFilterCount: number;
  setFilterType: (t: GlobalSearchFilterType) => void;
  /** Merge partial filters and apply immediately (URL for browse, applied snapshot for stays). */
  applyPatch: (patch: Partial<GlobalSearchFiltersExtended>) => void;
  /** Close filters without applying — restores draft from URL (browse) or last applied (short). */
  cancelFilters: () => void;
};

function isBrowseMode(mode: SearchEngineMode): mode is "buy" | "rent" {
  return mode === "buy" || mode === "rent";
}

/** URL → filters; rent hub keeps `type: rent` and `listingCategory` from the query. */
function browseFiltersFromUrl(spKey: string, mode: "buy" | "rent"): GlobalSearchFiltersExtended {
  const next = urlParamsToGlobalFilters(new URLSearchParams(spKey));
  if (mode !== "rent") return next;
  return {
    ...next,
    type: "rent",
    rentListingCategory: next.rentListingCategory,
  };
}

/**
 * Global filter state: draft vs URL (buy / rent) or draft vs applied (short).
 * Apply / Reset follow the global `GlobalSearchFilters` contract.
 */
export function useSearchFilters(mode: SearchEngineMode): UseSearchFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const spKey = searchParams.toString();

  const [draft, setDraft] = useState<GlobalSearchFiltersExtended>(() =>
    isBrowseMode(mode) ? browseFiltersFromUrl(spKey, mode) : { ...DEFAULT_STAYS_FILTERS }
  );
  const [applied, setApplied] = useState<GlobalSearchFiltersExtended>(() =>
    isBrowseMode(mode) ? browseFiltersFromUrl(spKey, mode) : { ...DEFAULT_STAYS_FILTERS }
  );
  const [pricePresetId, setPricePresetId] = useState(() =>
    isBrowseMode(mode)
      ? propertyPresetFromPrices(
          new URLSearchParams(spKey).get("minPrice") ?? "",
          new URLSearchParams(spKey).get("maxPrice") ?? ""
        )
      : "any"
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!isBrowseMode(mode)) return;
    const sp = new URLSearchParams(spKey);
    const next = browseFiltersFromUrl(spKey, mode);
    setDraft(next);
    setApplied(next);
    setPricePresetId(propertyPresetFromPrices(sp.get("minPrice") ?? "", sp.get("maxPrice") ?? ""));
  }, [mode, spKey]);

  /** Deep link from /listings → /buy: open full filter panel once, remove flag from URL. */
  useEffect(() => {
    if (!isBrowseMode(mode)) return;
    const sp = new URLSearchParams(spKey);
    if (sp.get(OPEN_FULL_PROPERTY_FILTERS_PARAM) !== "1") return;
    sp.delete(OPEN_FULL_PROPERTY_FILTERS_PARAM);
    setFiltersOpen(true);
    const next = sp.toString();
    const url = next ? `${pathname}?${next}` : pathname;
    router.replace(url, { scroll: false });
  }, [mode, pathname, spKey, router]);

  const activeFilterCount = useMemo(() => countActiveGlobalFilters(draft, mode), [draft, mode]);

  const applyPricePresetBrowse = useCallback((presetId: string) => {
    const preset = PROPERTY_PRICE_PRESETS.find((x) => x.id === presetId);
    if (!preset) return;
    setPricePresetId(presetId);
    setDraft((d) => ({
      ...d,
      priceMin: preset.min ? parseInt(preset.min, 10) : 0,
      priceMax: preset.max ? parseInt(preset.max, 10) : 0,
    }));
  }, []);

  const applyPricePresetStays = useCallback((presetId: string) => {
    const preset = STAY_PRICE_PRESETS.find((x) => x.id === presetId);
    if (!preset) return;
    setPricePresetId(presetId);
    setDraft((d) => ({
      ...d,
      priceMin: preset.min ? parseInt(preset.min, 10) : 0,
      priceMax: preset.max ? parseInt(preset.max, 10) : 0,
    }));
  }, []);

  const apply = useCallback(() => {
    if (isBrowseMode(mode)) {
      const next = { ...draft, page: 1 };
      setDraft(next);
      setApplied(next);
      const p = globalFiltersToUrlParams(next);
      const qs = p.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
      setFiltersOpen(false);
      reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, {
        action: "apply",
        mode,
        listing_type: next.type,
        has_location: Boolean(next.location?.trim()),
      });
    } else {
      const next = { ...draft, type: "short" as const };
      setApplied(next);
      setPricePresetId(stayPresetFromPrices(String(next.priceMin), String(next.priceMax)));
      setFiltersOpen(false);
      reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, {
        action: "apply",
        mode: "short",
        price_min: next.priceMin,
        price_max: next.priceMax,
      });
    }
  }, [mode, draft, pathname, router]);

  const applyPatch = useCallback(
    (patch: Partial<GlobalSearchFiltersExtended>) => {
      if (isBrowseMode(mode)) {
        setDraft((d) => {
          const next = { ...d, ...patch, page: 1 };
          const p = globalFiltersToUrlParams(next);
          const qs = p.toString();
          queueMicrotask(() => router.push(qs ? `${pathname}?${qs}` : pathname));
          return next;
        });
        setFiltersOpen(false);
        reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, {
          action: "apply_patch",
          mode,
          patch_keys: Object.keys(patch).join(",").slice(0, 160),
        });
      } else {
        setDraft((d) => {
          const next = { ...d, ...patch, type: "short" as const };
          queueMicrotask(() => {
            setApplied(next);
            setPricePresetId(stayPresetFromPrices(String(next.priceMin), String(next.priceMax)));
          });
          return next;
        });
        setFiltersOpen(false);
        reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, {
          action: "apply_patch",
          mode: "short",
          patch_keys: Object.keys(patch).join(",").slice(0, 160),
        });
      }
    },
    [mode, pathname, router]
  );

  const reset = useCallback(() => {
    if (isBrowseMode(mode)) {
      if (mode === "rent") {
        const next = { ...DEFAULT_GLOBAL_FILTERS, type: "rent" as const, rentListingCategory: null };
        setDraft(next);
        setApplied(next);
      } else {
        setDraft({ ...DEFAULT_GLOBAL_FILTERS });
        setApplied({ ...DEFAULT_GLOBAL_FILTERS });
      }
      setPricePresetId("any");
      router.push(pathname);
      setFiltersOpen(false);
      reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, { action: "reset", mode });
    } else {
      const next = { ...DEFAULT_STAYS_FILTERS };
      setDraft(next);
      setApplied(next);
      setPricePresetId("any");
      setFiltersOpen(false);
      reportProductEvent(ProductAnalyticsEvents.SEARCH_USAGE, { action: "reset", mode: "short" });
    }
  }, [mode, pathname, router]);

  const cancelFilters = useCallback(() => {
    if (isBrowseMode(mode)) {
      const next = browseFiltersFromUrl(spKey, mode);
      setDraft(next);
      setApplied(next);
      const sp = new URLSearchParams(spKey);
      setPricePresetId(propertyPresetFromPrices(sp.get("minPrice") ?? "", sp.get("maxPrice") ?? ""));
    } else {
      setDraft({ ...applied });
      setPricePresetId(stayPresetFromPrices(String(applied.priceMin), String(applied.priceMax)));
    }
    setFiltersOpen(false);
  }, [mode, spKey, applied]);

  const setFilterType = useCallback(
    (t: GlobalSearchFilterType) => {
      setDraft((d): GlobalSearchFiltersExtended => {
        if (t === "rent") {
          return { ...d, type: "rent", propertyType: "", propertyTypes: [], rentListingCategory: d.rentListingCategory ?? null };
        }
        if (t === "buy") {
          return { ...d, type: "buy", propertyType: "", propertyTypes: [], rentListingCategory: null };
        }
        if (t === "commercial") {
          return { ...d, type: "commercial", propertyType: "COMMERCIAL", propertyTypes: [], rentListingCategory: null };
        }
        if (t === "new_construction") {
          return { ...d, type: "new_construction", propertyType: "", propertyTypes: [], rentListingCategory: null };
        }
        if (t === "new_listing") {
          return { ...d, type: "new_listing", propertyType: "", propertyTypes: [], sort: "newest", rentListingCategory: null };
        }
        if (t === "residential") {
          return { ...d, type: "residential", propertyType: "", propertyTypes: [], rentListingCategory: null };
        }
        if (t === "sell") {
          return { ...d, type: "sell", propertyType: "", propertyTypes: [], rentListingCategory: null };
        }
        if (t === "luxury_properties") {
          const nextMin = Math.max(d.priceMin, 1_000_000);
          const next: GlobalSearchFiltersExtended = {
            ...d,
            type: "luxury_properties",
            propertyType: "",
            propertyTypes: [],
            priceMin: nextMin,
            rentListingCategory: null,
          };
          queueMicrotask(() =>
            setPricePresetId(propertyPresetFromPrices(String(next.priceMin), String(next.priceMax)))
          );
          return next;
        }
        if (d.type === "commercial") {
          return { ...d, type: t, propertyType: "", propertyTypes: [], rentListingCategory: null };
        }
        return { ...d, type: t, rentListingCategory: null };
      });
    },
    [setPricePresetId]
  );

  return {
    mode,
    draft,
    setDraft,
    applied,
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
    applyPatch,
    cancelFilters,
  };
}
