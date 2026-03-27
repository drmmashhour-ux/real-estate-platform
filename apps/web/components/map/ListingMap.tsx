"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./MapView";
import { MapPriceLegend, type MapDisplayMode } from "./MapPriceLegend";

/** Center: southern Québec / Montreal–Quebec corridor (default for regional exploration). */
export const LISTING_MAP_QUEBEC_CENTER = { lat: 46.75, lng: -71.25 } as const;
export const LISTING_MAP_QUEBEC_ZOOM = 7;

const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export type { MapDisplayMode };

export type ListingMapProps = Omit<MapViewProps, "center" | "zoom"> & {
  center?: MapViewProps["center"];
  zoom?: number;
  /** When true, show price-band legend (heatmap mode). */
  showPriceLegend?: boolean;
};

/**
 * Lazy-loaded map for listing markers (Leaflet + OSM). Defaults to Québec region center/zoom.
 */
export function ListingMap({
  center = LISTING_MAP_QUEBEC_CENTER,
  zoom = LISTING_MAP_QUEBEC_ZOOM,
  showPriceLegend = false,
  displayMode = "markers",
  disabled = false,
  className = "",
  ...rest
}: ListingMapProps) {
  return (
    <div className={`relative h-full w-full min-h-[320px] ${className}`.trim()}>
      <MapView
        center={center}
        zoom={zoom}
        displayMode={displayMode}
        disabled={disabled}
        className="h-full min-h-[320px] w-full"
        {...rest}
      />
      {showPriceLegend && displayMode === "priceHeatmap" && !disabled ? <MapPriceLegend /> : null}
    </div>
  );
}
