"use client";

import { useEffect, useRef, useMemo } from "react";
import type { MapListing } from "./MapListing";
import { bandFillColor, priceBandForListing } from "./map-price-bands";
import type { MapDisplayMode } from "./MapPriceLegend";

export type MapViewProps = {
  /** Listings to show; must include latitude, longitude, price, title */
  listings: MapListing[];
  /** Default center when no listings or single point */
  center?: { lat: number; lng: number };
  /** Default zoom when no listings or single point */
  zoom?: number;
  /** Marker pins vs price-band circles (heatmap-style) */
  displayMode?: MapDisplayMode;
  /** Called when a marker is clicked (listing id) */
  onMarkerClick?: (listing: MapListing) => void;
  /** Optional: hide map and show fallback (e.g. no API key) */
  disabled?: boolean;
  /** Class for the container */
  className?: string;
};

const DEFAULT_CENTER = { lat: 45.5, lng: -73.57 };
const DEFAULT_ZOOM = 10;

/**
 * Reusable map view. Uses Leaflet + OSM (no API key required).
 * When disabled or no valid coordinates, shows "Map unavailable".
 * For use in BNHub, real-estate, projects, luxury hubs.
 */
export function MapView({
  listings,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  displayMode = "markers",
  onMarkerClick,
  disabled = false,
  className = "",
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ remove: () => void } | null>(null);
  const markersRef = useRef<{ remove: () => void }[]>([]);

  const validListings = useMemo(
    () =>
      listings.filter(
        (l) =>
          typeof l.latitude === "number" &&
          typeof l.longitude === "number" &&
          !Number.isNaN(l.latitude) &&
          !Number.isNaN(l.longitude) &&
          l.latitude >= -90 &&
          l.latitude <= 90 &&
          l.longitude >= -180 &&
          l.longitude <= 180
      ),
    [listings]
  );

  const showMap = !disabled && typeof window !== "undefined";

  const priceSamples = useMemo(
    () => validListings.map((l) => l.price).filter((p) => typeof p === "number" && !Number.isNaN(p)),
    [validListings]
  );

  useEffect(() => {
    if (!showMap || validListings.length === 0) return;

    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;
      if (!mapContainerRef.current) return;
      if (mapRef.current) return;

      const map = L.map(mapContainerRef.current).setView(
        [center.lat, center.lng],
        zoom
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      mapRef.current = map;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      validListings.forEach((listing) => {
        const lat = listing.latitude;
        const lng = listing.longitude;
        const priceLabel =
          typeof listing.price === "number" && !Number.isNaN(listing.price)
            ? `$${Math.round(listing.price)}`
            : "";

        const popupContent = `
        <div class="min-w-[200px] p-0">
          ${listing.image ? `<img src="${listing.image}" alt="" class="w-full h-28 object-cover rounded-t-lg" />` : ""}
          <div class="p-3">
            <p class="font-semibold text-slate-900">${escapeHtml(listing.title)}</p>
            <p class="text-sm text-slate-600 mt-0.5">${priceLabel}${priceLabel ? " / night" : ""}</p>
            ${listing.href ? `<a href="${listing.href}" class="inline-block mt-2 text-sm font-medium text-rose-600 hover:text-rose-700">View listing →</a>` : ""}
          </div>
        </div>
      `;

        if (displayMode === "priceHeatmap") {
          const band = priceBandForListing(
            typeof listing.price === "number" ? listing.price : 0,
            priceSamples
          );
          const fill = bandFillColor(band);
          const cm = L.circleMarker([lat, lng], {
            radius: 18,
            fillColor: fill,
            color: "#0f172a",
            weight: 1,
            fillOpacity: 0.72,
          });
          cm.bindPopup(popupContent, { maxWidth: 280 });
          cm.on("click", () => onMarkerClick?.(listing));
          cm.addTo(map);
          markersRef.current.push(cm);
        } else {
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: "map-marker-pin",
              html: `<div class="bg-white border-2 border-slate-700 rounded-lg shadow-lg px-2 py-1 text-sm font-semibold text-slate-900 whitespace-nowrap">${priceLabel}</div>`,
              iconSize: [60, 28],
              iconAnchor: [30, 28],
            }),
          });
          marker.bindPopup(popupContent, { maxWidth: 280 });
          marker.on("click", () => onMarkerClick?.(listing));
          marker.addTo(map);
          markersRef.current.push(marker);
        }
      });

      if (validListings.length === 1) {
        map.setView(
          [validListings[0].latitude, validListings[0].longitude],
          Math.max(zoom, 12)
        );
      } else if (validListings.length > 1) {
        const bounds = L.latLngBounds(
          validListings.map((l) => [l.latitude, l.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [showMap, validListings, priceSamples, displayMode, center.lat, center.lng, zoom, onMarkerClick]);

  if (disabled) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 ${className}`}
      >
        <p className="text-sm">Map unavailable</p>
      </div>
    );
  }

  if (validListings.length === 0 && listings.length > 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 ${className}`}
      >
        <p className="text-sm">Map unavailable (no coordinates for listings)</p>
      </div>
    );
  }

  if (validListings.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 ${className}`}
      >
        <p className="text-sm">Map unavailable</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={`h-full min-h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}

function escapeHtml(text: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
