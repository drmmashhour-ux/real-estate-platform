"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Map as MapIcon } from "lucide-react";
import { SearchEngineBar } from "@/components/search/SearchEngine";
import { useSearchEngineContext } from "@/components/search/search-engine-context";
import { globalFiltersToUrlParams, listingTypeForSaleBrowseHref } from "@/components/search/FilterState";

/** Matches BNHUB / listings toolbar: gold outline, muted fill, bold label — Inter `text-sm font-bold` like SearchBar controls. */
const MAP_SEARCH_BTN =
  "inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-premium-gold bg-neutral-500/25 px-4 py-2.5 text-sm font-bold tracking-tight text-premium-gold shadow-sm transition hover:bg-neutral-500/40";

export function useExploreListingsMapHref(): string {
  const { draft } = useSearchEngineContext();
  return useMemo(() => {
    const listingType = listingTypeForSaleBrowseHref(draft.type);
    const p = globalFiltersToUrlParams({ ...draft, type: listingType });
    p.set("mapLayout", "map");
    return `/listings?${p.toString()}`;
  }, [draft]);
}

/** Same SearchEngine + FilterPanel as `/listings` (buy mode) — shared with BNHUB-style filter UX. */
export function ExploreQuebecHeroSearch({ mapHref }: { mapHref: string }) {
  return (
    <div className="mt-10 space-y-0 rounded-2xl border border-white/20 bg-white/95 p-4 shadow-[0_24px_80px_rgb(0_0_0/0.35)] backdrop-blur-sm sm:p-5">
      <SearchEngineBar barTone="light" />
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-3">
        <Link href={mapHref} className={MAP_SEARCH_BTN}>
          <MapIcon className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
          Map
        </Link>
      </div>
    </div>
  );
}
