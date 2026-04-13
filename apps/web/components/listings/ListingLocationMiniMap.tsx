"use client";

import { useCallback, useEffect, useRef, useState } from "react";
const QUEBEC_FLAG_PIN_SRC = "/flags/quebec.svg";

type Props = {
  title: string;
  priceLabel: string;
  /** When set, pin is placed immediately */
  latitude?: number | null;
  longitude?: number | null;
  /** If no coords, geocode this (e.g. "123 St, Montreal") via `/api/geo/forward-search` */
  geocodeFallbackQuery?: string | null;
  onRequestVisit?: () => void;
};

/**
 * Leaflet + OSM — single listing pin with Québec flag (matches browse map styling).
 */
export function ListingLocationMiniMap({
  title,
  priceLabel,
  latitude: latProp,
  longitude: lngProp,
  geocodeFallbackQuery,
  onRequestVisit,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [resolved, setResolved] = useState<{ lat: number; lng: number } | null>(
    typeof latProp === "number" &&
      typeof lngProp === "number" &&
      Number.isFinite(latProp) &&
      Number.isFinite(lngProp)
      ? { lat: latProp, lng: lngProp }
      : null
  );
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "failed">("idle");

  useEffect(() => {
    if (resolved) return;
    const q = geocodeFallbackQuery?.trim();
    if (!q || q.length < 4) {
      setGeoStatus("failed");
      return;
    }
    let cancelled = false;
    setGeoStatus("loading");
    void (async () => {
      try {
        const r = await fetch(`/api/geo/forward-search?q=${encodeURIComponent(q)}&cc=ca`, {
          cache: "no-store",
        });
        if (!r.ok || cancelled) {
          if (!cancelled) setGeoStatus("failed");
          return;
        }
        const j = (await r.json()) as { ok?: boolean; lat?: number; lon?: number };
        if (!j.ok || typeof j.lat !== "number" || typeof j.lon !== "number") {
          if (!cancelled) setGeoStatus("failed");
          return;
        }
        if (!cancelled) {
          setResolved({ lat: j.lat, lng: j.lon });
          setGeoStatus("idle");
        }
      } catch {
        if (!cancelled) setGeoStatus("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolved, geocodeFallbackQuery]);

  const placeMarker = useCallback(async (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const L = (await import("leaflet")).default;
    markerRef.current?.remove();
    const icon = L.divIcon({
      className: "listing-detail-map-pin",
      html: `<div style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;border:2px solid #D4AF37;background:rgba(0,0,0,0.88);box-shadow:0 4px 14px rgba(0,0,0,0.45);"><img src="${QUEBEC_FLAG_PIN_SRC}" width="22" height="14" alt="" style="object-fit:contain" /></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
    const m = L.marker([lat, lng], { icon }).addTo(map);
    markerRef.current = m;
    const cta =
      onRequestVisit != null
        ? `<p style="margin:10px 0 0"><button type="button" data-llm-cta style="width:100%;padding:8px 12px;border-radius:10px;border:none;background:#D4AF37;color:#0a0a0a;font-weight:600;cursor:pointer;font-size:13px">Request visit &amp; documents</button></p>`
        : "";
    m.bindPopup(
      `<div style="min-width:200px;padding:4px 2px;font-family:system-ui,sans-serif;color:#111">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#92400e">On LECIPM map</p>
        <p style="margin:0;font-weight:600;line-height:1.3">${escapeHtml(title)}</p>
        <p style="margin:6px 0 0;font-weight:700;color:#0a0a0a">${escapeHtml(priceLabel)}</p>
        ${cta}
      </div>`,
      { maxWidth: 280 }
    );
    m.on("popupopen", () => {
      if (!onRequestVisit) return;
      const btn = m.getPopup()?.getElement()?.querySelector("button[data-llm-cta]");
      btn?.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          onRequestVisit();
        },
        { once: true }
      );
    });
    map.setView([lat, lng], 14, { animate: false });
  }, [title, priceLabel, onRequestVisit]);

  useEffect(() => {
    let cancelled = false;
    let resizeObs: ResizeObserver | null = null;
    void (async () => {
      if (!resolved) return;
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;
      const el = containerRef.current;
      const map = L.map(el, { scrollWheelZoom: false }).setView([resolved.lat, resolved.lng], 14);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OSM © CARTO',
      }).addTo(map);
      mapRef.current = map;
      requestAnimationFrame(() => map.invalidateSize());
      map.whenReady(() => map.invalidateSize());
      if (typeof ResizeObserver !== "undefined") {
        resizeObs = new ResizeObserver(() => map.invalidateSize());
        resizeObs.observe(el);
      }
      await placeMarker(resolved.lat, resolved.lng);
    })();
    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [resolved, placeMarker]);

  if (!geocodeFallbackQuery?.trim() && !resolved && (latProp == null || lngProp == null)) {
    return null;
  }

  if (!resolved && geoStatus === "failed") {
    return (
      <p className="mt-3 text-xs text-white/50">
        Approximate area only — open Google Maps below, or contact the representative for the exact pin after you
        connect.
      </p>
    );
  }

  if (!resolved && geoStatus === "loading") {
    return (
      <div className="mt-4 flex min-h-[200px] items-center justify-center rounded-xl border border-white/10 bg-black/40 text-sm text-white/55">
        Loading map…
      </div>
    );
  }

  if (!resolved) return null;

  return (
    <div
      ref={containerRef}
      className="mt-4 min-h-[220px] w-full overflow-hidden rounded-xl border border-[#D4AF37]/25 bg-[#0a0a0a]"
      role="img"
      aria-label={`Map showing approximate location for ${title}`}
    />
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
