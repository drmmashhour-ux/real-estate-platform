"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";

const MONTREAL: [number, number] = [45.5017, -73.5673];
const DEFAULT_ZOOM = 10;

async function searchCanada(query: string): Promise<{
  lat: number;
  lng: number;
  displayName: string;
  cityForListings: string | null;
} | null> {
  const q = query.trim();
  if (q.length < 4) return null;
  const res = await fetch(`/api/geo/forward-search?q=${encodeURIComponent(q)}&cc=ca`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    ok?: boolean;
    lat?: number;
    lon?: number;
    displayName?: string;
    cityForListings?: string | null;
  };
  if (!j.ok || typeof j.lat !== "number" || typeof j.lon !== "number") return null;
  return {
    lat: j.lat,
    lng: j.lon,
    displayName: j.displayName?.trim() || q,
    cityForListings: j.cityForListings ?? null,
  };
}

type Props = {
  mapListingsHref: string;
};

/**
 * Interactive map without Google Maps API — Leaflet + OSM (dark tiles).
 * Used when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is unset.
 */
export function ExploreLandingOpenMap({ mapListingsHref }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [search, setSearch] = useState("");
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [cityForListings, setCityForListings] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const listingsNearHref = useCallback(() => {
    if (!cityForListings) return mapListingsHref;
    const u = new URL(mapListingsHref, typeof window !== "undefined" ? window.location.origin : "http://local");
    u.searchParams.set("city", cityForListings);
    u.searchParams.set("mapLayout", "map");
    return u.pathname + u.search;
  }, [cityForListings, mapListingsHref]);

  useEffect(() => {
    let cancelled = false;
    let resizeObs: ResizeObserver | null = null;

    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const el = containerRef.current;
      const map = L.map(el, { scrollWheelZoom: true }).setView(MONTREAL, DEFAULT_ZOOM);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> © CARTO',
      }).addTo(map);

      mapRef.current = map;

      const scheduleInvalidate = () => {
        requestAnimationFrame(() => {
          map.invalidateSize();
          requestAnimationFrame(() => map.invalidateSize());
        });
      };
      scheduleInvalidate();
      map.whenReady(scheduleInvalidate);

      if (typeof ResizeObserver !== "undefined") {
        resizeObs = new ResizeObserver(() => map.invalidateSize());
        resizeObs.observe(el);
      }
    })();

    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const placeMarker = useCallback(async (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    const L = (await import("leaflet")).default;
    markerRef.current?.remove();
    const icon = L.divIcon({
      className: "explore-osm-flag-marker",
      html: `<div style="width:40px;height:40px;border-radius:50%;border:2px solid #D4AF37;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.45);"><img src="/flags/quebec.svg" width="22" height="14" alt="" style="object-fit:contain;" /></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
    const m = L.marker([lat, lng], { icon }).addTo(map);
    markerRef.current = m;
    map.setView([lat, lng], 12, { animate: true });
  }, []);

  const onSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const q = search.trim();
      if (!q) return;
      setLoading(true);
      setGeoError(null);
      try {
        const r = await searchCanada(q);
        if (!r) {
          setGeoError("No matches — try another city or address in Canada, or browse featured listings below.");
          setPlaceLabel(null);
          setCityForListings(null);
          return;
        }
        setPlaceLabel(r.displayName);
        setCityForListings(r.cityForListings);
        await placeMarker(r.lat, r.lng);
      } catch {
        setGeoError("Search failed. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    },
    [search, placeMarker]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/50">
        OpenStreetMap (no Google API key required). For Google Places autocomplete, add{" "}
        <code className="text-premium-gold/80">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{" "}
        <code className="text-white/70">apps/web/.env.local</code> and restart the dev server.
      </p>
      <div className="relative overflow-hidden rounded-2xl border border-premium-gold/35 shadow-[0_24px_80px_rgb(0_0_0/0.45)]">
        <div className="absolute left-3 right-3 top-3 z-[500] flex flex-col gap-2 sm:left-4 sm:right-4 sm:flex-row sm:items-start">
          <form onSubmit={onSearch} className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search places in Canada (e.g. Laval, Québec City)"
              className="min-h-[44px] w-full flex-1 rounded-xl border border-white/20 bg-[#0b0b0b]/95 px-3 py-2.5 text-sm text-white shadow-lg backdrop-blur placeholder:text-white/45 focus:border-premium-gold/60 focus:outline-none"
              aria-label="Search map"
            />
            <button
              type="submit"
              disabled={loading || !search.trim()}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl bg-premium-gold px-4 text-sm font-bold text-black disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Search
            </button>
          </form>
        </div>
        <div
          ref={containerRef}
          className="aspect-[16/10] min-h-[320px] w-full sm:min-h-[360px]"
          aria-hidden
        />
      </div>
      {geoError ? <p className="text-xs text-amber-200/90">{geoError}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-white/65">
          {placeLabel ? (
            <>
              <span className="text-white/90">{placeLabel}</span>
              {cityForListings ? (
                <>
                  {" "}
                  — listings:{" "}
                  <Link href={listingsNearHref()} className="font-semibold text-premium-gold hover:underline">
                    {cityForListings}
                  </Link>
                </>
              ) : null}
            </>
          ) : (
            <>Pan and zoom the map, search for a place, then open LECIPM listings.</>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={mapListingsHref}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-premium-gold px-5 text-sm font-bold text-black transition hover:brightness-110"
          >
            Open LECIPM map search
            <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
