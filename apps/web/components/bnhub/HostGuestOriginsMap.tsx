"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { FeatureGroup } from "leaflet";
import type { GuestOriginAggregate } from "@/lib/bnhub/guest-origin-geo";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = { lat: 20, lng: 0 };
const DEFAULT_ZOOM = 2;

type Props = {
  origins: GuestOriginAggregate[];
  totalBookings: number;
  className?: string;
};

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function HostGuestOriginsMap({ origins, totalBookings, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<FeatureGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const renderMarkers = useCallback(() => {
    if (!mapRef.current || typeof window === "undefined") return;
    const L = require("leaflet") as typeof import("leaflet");
    const map = mapRef.current;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const markers: ReturnType<typeof L.marker>[] = [];

    for (const o of origins) {
      const r = Math.min(28, 10 + Math.sqrt(o.count) * 3);
      const html = `<div style="display:flex;align-items:center;justify-content:center;min-width:32px;height:32px;padding:0 8px;border-radius:9999px;background:rgba(201,169,110,.95);color:#0a0a0a;font-size:12px;font-weight:700;border:2px solid rgba(0,0,0,.35);box-shadow:0 2px 10px rgba(0,0,0,.4)">${escapeHtml(String(o.count))}</div>`;
      const icon = L.divIcon({
        className: "bnhub-guest-origin-pin",
        html,
        iconSize: [r + 16, 32],
        iconAnchor: [(r + 16) / 2, 32],
      });
      const m = L.marker([o.lat, o.lng], { icon });
      m.bindPopup(
        `<div class="p-1 text-slate-900 text-sm"><strong>${escapeHtml(o.label)}</strong><br/><span class="text-slate-600">${o.count} booking${o.count === 1 ? "" : "s"}</span></div>`,
        { maxWidth: 240 }
      );
      markers.push(m);
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      group.addTo(map);
      layerRef.current = group;
      try {
        map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 5 });
      } catch {
        map.setView([origins[0]!.lat, origins[0]!.lng], 4);
      }
    } else {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM);
    }
  }, [origins]);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const L = require("leaflet") as typeof import("leaflet");
    if (mapRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
      [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      DEFAULT_ZOOM
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    mapRef.current = map;
    renderMarkers();
    setMapReady(true);

    return () => {
      if (layerRef.current && mapRef.current) {
        mapRef.current.removeLayer(layerRef.current);
      }
      layerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once; markers sync in following effect
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    renderMarkers();
  }, [origins, renderMarkers]);

  return (
    <section className={`bnhub-panel mb-8 p-5 sm:p-6 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-premium-gold/90">Where your guests book from</h2>
      <p className="mt-2 max-w-3xl text-xs text-neutral-500">
        Based on each guest&apos;s profile country (and city when provided) — not live GPS. Helps you tune amenities and
        messaging for international vs local travelers.
      </p>
      <div className="relative mt-4">
        <div
          ref={containerRef}
          className="h-[min(52vh,420px)] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50"
          style={{ minHeight: 280 }}
        />
        {!mapReady ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-sm text-neutral-500">
            Loading map…
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {origins.length === 0 ? (
          <span className="text-sm text-neutral-500">
            {totalBookings === 0
              ? "No bookings yet — markers appear when guests reserve."
              : "Guest home countries aren’t on profile yet — ask guests to complete location in account settings for richer map data."}
          </span>
        ) : (
          origins.map((o) => (
            <span
              key={o.countryCode + o.label}
              className="rounded-full border border-premium-gold/25 bg-premium-gold/10 px-3 py-1 text-xs text-neutral-200"
            >
              <span className="font-medium text-premium-gold">{o.label}</span>
              <span className="text-neutral-500"> · {o.count}</span>
            </span>
          ))
        )}
      </div>
    </section>
  );
}
