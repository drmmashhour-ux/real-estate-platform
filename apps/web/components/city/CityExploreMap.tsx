"use client";

import { useState } from "react";
import { ListingMap, type MapDisplayMode } from "@/components/map/ListingMap";
import type { MapListing } from "@/components/map/MapListing";

type Props = {
  listings: MapListing[];
  cityLabel: string;
};

/**
 * BNHub map with markers vs price-intensity (heatmap-style circles).
 */
export function CityExploreMap({ listings, cityLabel }: Props) {
  const [mode, setMode] = useState<MapDisplayMode>("markers");

  return (
    <section className="mt-14" aria-labelledby="city-map-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="city-map-heading" className="text-xl font-semibold text-slate-900">
            Stays on the map — {cityLabel}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Listings with coordinates. Switch between pins and price intensity.
          </p>
        </div>
        <div
          className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm"
          role="group"
          aria-label="Map display mode"
        >
          <button
            type="button"
            onClick={() => setMode("markers")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              mode === "markers" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Markers
          </button>
          <button
            type="button"
            onClick={() => setMode("priceHeatmap")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              mode === "priceHeatmap" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Heatmap
          </button>
        </div>
      </div>
      <div className="mt-4 min-h-[340px]">
        <ListingMap
          listings={listings}
          displayMode={mode}
          showPriceLegend
          className="min-h-[340px]"
        />
      </div>
    </section>
  );
}
