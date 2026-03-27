"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MapListing } from "@/components/map/MapListing";
import type { MapBoundsWgs84 } from "@/components/search/MapSearchAdapter";

const DEFAULT_CENTER: [number, number] = [45.5, -73.57];
const DEFAULT_ZOOM = 10;

export type MapSearchProps = {
  listings: MapListing[];
  /** When all bounds set, map fits this box on first paint. */
  initialBounds?: MapBoundsWgs84 | null;
  /** When true, do not auto-fit the map to all listing markers (e.g. URL bbox is authoritative). */
  suppressAutoFit?: boolean;
  /** Fires after user pans/zooms (debounced). */
  onBoundsChange?: (b: MapBoundsWgs84) => void;
  onMarkerClick?: (listing: MapListing) => void;
  /** Highlight marker */
  selectedId?: string | null;
  className?: string;
  /** Dark UI (buy hub) */
  variant?: "light" | "dark";
};

/**
 * Leaflet + OSM — listing pins, popups, viewport sync for unified search.
 */
export function MapSearch({
  listings,
  initialBounds,
  suppressAutoFit = false,
  onBoundsChange,
  onMarkerClick,
  selectedId,
  className = "",
  variant = "light",
}: MapSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  const emitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onBoundsChangeRef.current) return;
    const b = map.getBounds();
    onBoundsChangeRef.current({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      const tileUrl =
        variant === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      L.tileLayer(tileUrl, {
        attribution:
          variant === "dark"
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> © CARTO'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layer;

      const onMoveEnd = () => {
        if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
        moveTimerRef.current = setTimeout(() => emitBounds(), 400);
      };
      map.on("moveend", onMoveEnd);
      map.on("zoomend", onMoveEnd);
    })();

    return () => {
      cancelled = true;
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [variant, emitBounds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialBounds) return;
    if (!(initialBounds.north > initialBounds.south && initialBounds.east > initialBounds.west)) return;
    map.fitBounds(
      [
        [initialBounds.south, initialBounds.west],
        [initialBounds.north, initialBounds.east],
      ],
      { padding: [24, 24], maxZoom: 14 }
    );
  }, [initialBounds]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      layer.clearLayers();

      const valid = listings.filter(
        (l) =>
          typeof l.latitude === "number" &&
          typeof l.longitude === "number" &&
          !Number.isNaN(l.latitude) &&
          !Number.isNaN(l.longitude)
      );

      valid.forEach((listing) => {
        const lat = listing.latitude as number;
        const lng = listing.longitude as number;
        const priceLabel =
          typeof listing.price === "number" && !Number.isNaN(listing.price)
            ? `$${Math.round(listing.price).toLocaleString("en-CA")}`
            : "";
        const selected = selectedId === listing.id;
        const popupHtml = `
          <div class="min-w-[200px] p-0 text-slate-900">
            ${listing.image ? `<img src="${escapeAttr(listing.image)}" alt="" class="w-full h-28 object-cover rounded-t-lg" />` : ""}
            <div class="p-3">
              <p class="font-semibold">${escapeHtml(listing.title)}</p>
              <p class="text-sm text-slate-600 mt-0.5">${priceLabel}</p>
              ${listing.href ? `<a href="${escapeAttr(listing.href)}" class="inline-block mt-2 text-sm font-medium text-amber-700 hover:underline">View listing →</a>` : ""}
            </div>
          </div>`;

        const icon = L.divIcon({
          className: "map-search-pin",
          html: `<div class="${selected ? "ring-2 ring-amber-400 ring-offset-2" : ""} rounded-lg border border-slate-700 bg-white px-2 py-1 text-xs font-bold text-slate-900 shadow-lg">${priceLabel || "·"}</div>`,
          iconSize: [72, 28],
          iconAnchor: [36, 28],
        });

        const m = L.marker([lat, lng], { icon });
        m.bindPopup(popupHtml, { maxWidth: 300 });
        m.on("click", () => onMarkerClick?.(listing));
        m.addTo(layer);
      });

      if (!suppressAutoFit) {
        if (valid.length === 1) {
          map.setView([valid[0].latitude as number, valid[0].longitude as number], Math.max(map.getZoom(), 13));
        } else if (valid.length > 1) {
          const bounds = L.latLngBounds(valid.map((l) => [l.latitude as number, l.longitude as number]));
          map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listings, selectedId, onMarkerClick, suppressAutoFit]);

  return (
    <div
      ref={containerRef}
      className={[
        "h-full min-h-[320px] w-full overflow-hidden rounded-xl border",
        variant === "dark" ? "border-white/10 bg-[#0f0f0f]" : "border-slate-200 bg-slate-50",
        className,
      ].join(" ")}
      style={{ zIndex: 0 }}
    />
  );
}

function escapeHtml(text: string): string {
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
