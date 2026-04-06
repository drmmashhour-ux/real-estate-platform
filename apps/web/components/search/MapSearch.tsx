"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapListing } from "@/components/map/MapListing";
import type { MapBoundsWgs84 } from "@/components/search/MapSearchAdapter";

const DEFAULT_CENTER: [number, number] = [45.5, -73.57];
const DEFAULT_ZOOM = 10;

const GOLD = "#D4AF37";
const LIGHT_GOLD = "#e8d5a3";
const PIN_GRAY = "#e5e7eb";

export type MapSearchProps = {
  listings: MapListing[];
  /** When all bounds set, map fits this box on first paint. */
  initialBounds?: MapBoundsWgs84 | null;
  /** When true, do not auto-fit the map to all listing markers (e.g. URL bbox is authoritative). */
  suppressAutoFit?: boolean;
  /** Fires after user pans/zooms (debounced 300ms). */
  onBoundsChange?: (b: MapBoundsWgs84) => void;
  onMarkerClick?: (listing: MapListing) => void;
  /** Highlight marker */
  selectedId?: string | null;
  className?: string;
  /** Dark UI + gold accents (BNHub premium) */
  variant?: "light" | "dark";
  /** Soft gold heat zones from clustered average AI scores */
  enableHeatZones?: boolean;
  /** Exposed to assistive tech — list view remains the non-map path. */
  "aria-label"?: string;
};

function pinStyle(score?: number): { bg: string; border: string; text: string } {
  const s = score ?? 68;
  if (s >= 85) return { bg: GOLD, border: "#b8962e", text: "#0a0a0a" };
  if (s >= 70) return { bg: LIGHT_GOLD, border: "#a89050", text: "#1a1a1a" };
  return { bg: PIN_GRAY, border: "#9ca3af", text: "#374151" };
}

/** Generic labels only — no fabricated metrics */
function pinTooltipLabel(score?: number): string {
  const s = score ?? 0;
  if (s >= 85) return "High demand area";
  if (s >= 70) return "Great value zone";
  return "Trending location";
}

function zoneTooltipLabel(avg: number): string {
  if (avg >= 82) return "High demand area";
  if (avg >= 70) return "Great value zone";
  return "Trending location";
}

type CellAgg = { sum: number; n: number; lat: number; lng: number };

const GRID_DEG = 0.045;

/**
 * Leaflet + OSM — listing pins, optional heat zones, popups, viewport sync for unified search.
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
  enableHeatZones = true,
  "aria-label": ariaLabel = "Map of listings in this search. Use the list view to browse without the map.",
}: MapSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const heatLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const [mapEpoch, setMapEpoch] = useState(0);

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

      const heatLayer = L.layerGroup().addTo(map);
      const layer = L.layerGroup().addTo(map);
      mapRef.current = map;
      heatLayerRef.current = heatLayer;
      layerRef.current = layer;
      setMapEpoch((e) => e + 1);

      const onMoveEnd = () => {
        if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
        moveTimerRef.current = setTimeout(() => emitBounds(), 300);
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
      heatLayerRef.current = null;
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
    const heatLayer = heatLayerRef.current;
    if (!map || !layer || !heatLayer) return;

    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;
      layer.clearLayers();
      heatLayer.clearLayers();

      const valid = listings.filter(
        (l) =>
          typeof l.latitude === "number" &&
          typeof l.longitude === "number" &&
          !Number.isNaN(l.latitude) &&
          !Number.isNaN(l.longitude)
      );

      if (enableHeatZones && valid.length >= 2) {
        const cells = new Map<string, CellAgg>();
        for (const l of valid) {
          const lat = l.latitude as number;
          const lng = l.longitude as number;
          const gx = Math.floor(lat / GRID_DEG);
          const gy = Math.floor(lng / GRID_DEG);
          const key = `${gx}_${gy}`;
          const ai = typeof l.aiScore === "number" ? l.aiScore : 68;
          const cur = cells.get(key);
          if (!cur) {
            cells.set(key, { sum: ai, n: 1, lat, lng });
          } else {
            cur.sum += ai;
            cur.n += 1;
            cur.lat += lat;
            cur.lng += lng;
          }
        }
        for (const cell of cells.values()) {
          const avg = cell.sum / cell.n;
          const clat = cell.lat / cell.n;
          const clng = cell.lng / cell.n;
          const t = Math.min(1, Math.max(0, (avg - 55) / 45));
          const fillOpacity = 0.06 + t * 0.2;
          const stroke = avg >= 82 ? GOLD : avg >= 70 ? "#c9a227" : "#6b7280";
          const circle = L.circle([clat, clng], {
            radius: 780 + t * 420,
            color: stroke,
            weight: 1,
            fillColor: GOLD,
            fillOpacity,
            interactive: true,
          });
          circle.bindTooltip(zoneTooltipLabel(avg), { sticky: true, direction: "top", opacity: 0.95 });
          circle.addTo(heatLayer);
        }
      }

      valid.forEach((listing) => {
        const lat = listing.latitude as number;
        const lng = listing.longitude as number;
        const priceLabel =
          typeof listing.price === "number" && !Number.isNaN(listing.price)
            ? `$${Math.round(listing.price).toLocaleString("en-CA")}`
            : "";
        const selected = selectedId === listing.id;
        const ps = pinStyle(listing.aiScore);
        const popupHtml = `
          <div class="min-w-[200px] p-0 text-slate-900">
            ${listing.image ? `<img src="${escapeAttr(listing.image)}" alt="" class="w-full h-28 object-cover rounded-t-lg" />` : ""}
            <div class="p-3">
              <p class="font-semibold">${escapeHtml(listing.title)}</p>
              <p class="text-sm text-slate-600 mt-0.5">${priceLabel}</p>
              ${listing.href ? `<a href="${escapeAttr(listing.href)}" class="inline-block mt-2 text-sm font-medium text-amber-700 hover:underline">View listing →</a>` : ""}
            </div>
          </div>`;

        const ring = selected ? "box-shadow:0 0 0 3px rgba(212,175,55,0.85)" : "";
        const icon = L.divIcon({
          className: "map-search-pin",
          html: `<div style="${ring};border-radius:10px;border:1px solid ${ps.border};background:${ps.bg};color:${ps.text};padding:4px 10px;font-size:11px;font-weight:700;white-space:nowrap">${priceLabel || "·"}</div>`,
          iconSize: [80, 30],
          iconAnchor: [40, 30],
        });

        const m = L.marker([lat, lng], { icon });
        m.bindPopup(popupHtml, { maxWidth: 300 });
        m.bindTooltip(pinTooltipLabel(listing.aiScore), { sticky: true, direction: "top" });
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
  }, [listings, selectedId, onMarkerClick, suppressAutoFit, enableHeatZones, mapEpoch]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={ariaLabel}
      className={[
        "h-full min-h-[320px] w-full overflow-hidden rounded-xl border",
        variant === "dark" ? "border-[#D4AF37]/25 bg-[#0a0a0a]" : "border-slate-200 bg-slate-50",
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
