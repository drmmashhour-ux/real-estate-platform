"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { circlePolygonGeoJson } from "@/lib/map/radius-search";
import { compsToHeatmapFeatureCollection } from "@/lib/map/heatmap";

export type MapComparable = {
  id: string;
  address: string;
  city?: string;
  salePriceCents?: number;
  priceCents: number;
  latitude: number | null;
  longitude: number | null;
  listingStatus?: string;
};

const HEAT_SOURCE = "lecipm-heat";
const HEAT_LAYER = "lecipm-heatmap";
const RADIUS_SOURCE = "lecipm-radius";
const RADIUS_FILL = "lecipm-radius-fill";
const RADIUS_LINE = "lecipm-radius-line";

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export type ComparableMapProps = {
  comps: MapComparable[];
  onSelect?: (c: MapComparable) => void;
  heatmapEnabled?: boolean;
  circleCenter?: { lat: number; lng: number } | null;
  circleRadiusKm?: number | null;
  pickCenterMode?: boolean;
  onPickCenter?: (ll: { lng: number; lat: number }) => void;
  className?: string;
};

function displayPriceCents(c: MapComparable): number {
  return c.salePriceCents ?? c.priceCents;
}

function ensureLayers(map: mapboxgl.Map) {
  if (map.getSource(HEAT_SOURCE)) return;

  map.addSource(HEAT_SOURCE, { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: HEAT_LAYER,
    type: "heatmap",
    source: HEAT_SOURCE,
    paint: {
      "heatmap-weight": [
        "interpolate",
        ["linear"],
        ["get", "price"],
        0,
        0,
        50_000_000,
        0.35,
        200_000_000,
        0.65,
        600_000_000,
        1,
      ],
      "heatmap-intensity": 1,
      "heatmap-radius": 28,
      "heatmap-opacity": 0.85,
    },
  });

  map.addSource(RADIUS_SOURCE, { type: "geojson", data: EMPTY_FC });
  map.addLayer({
    id: RADIUS_FILL,
    type: "fill",
    source: RADIUS_SOURCE,
    paint: {
      "fill-color": "#D4AF37",
      "fill-opacity": 0.08,
    },
  });
  map.addLayer({
    id: RADIUS_LINE,
    type: "line",
    source: RADIUS_SOURCE,
    paint: {
      "line-color": "#D4AF37",
      "line-width": 2,
      "line-opacity": 0.9,
    },
  });
}

function applyHeatAndRadius(
  map: mapboxgl.Map,
  comps: MapComparable[],
  heatmapEnabled: boolean,
  circleCenter: { lat: number; lng: number } | null | undefined,
  circleRadiusKm: number | null | undefined,
) {
  if (!map.getSource(HEAT_SOURCE)) return;

  const heat = map.getSource(HEAT_SOURCE) as mapboxgl.GeoJSONSource;
  heat.setData(
    compsToHeatmapFeatureCollection(
      comps.map((c) => ({
        latitude: c.latitude,
        longitude: c.longitude,
        priceCents: displayPriceCents(c),
      })),
    ),
  );
  map.setLayoutProperty(HEAT_LAYER, "visibility", heatmapEnabled ? "visible" : "none");

  const radiusSrc = map.getSource(RADIUS_SOURCE) as mapboxgl.GeoJSONSource;
  if (circleCenter && circleRadiusKm != null && circleRadiusKm > 0) {
    const feat = circlePolygonGeoJson(circleCenter.lat, circleCenter.lng, circleRadiusKm);
    radiusSrc.setData({ type: "FeatureCollection", features: [feat] });
  } else {
    radiusSrc.setData(EMPTY_FC);
  }
}

export default function ComparableMap({
  comps,
  onSelect,
  heatmapEnabled = true,
  circleCenter,
  circleRadiusKm,
  pickCenterMode = false,
  onPickCenter,
  className = "",
}: ComparableMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const onSelectRef = useRef(onSelect);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || !token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-73.7, 45.55],
      zoom: 11,
    });
    mapRef.current = map;

    map.on("load", () => {
      ensureLayers(map);
      setMapReady(true);
    });

    return () => {
      setMapReady(false);
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    applyHeatAndRadius(map, comps, heatmapEnabled, circleCenter ?? null, circleRadiusKm ?? null);
  }, [mapReady, comps, heatmapEnabled, circleCenter, circleRadiusKm]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const valid = comps.filter((c) => c.latitude != null && c.longitude != null);
    for (const c of valid) {
      const el = document.createElement("button");
      el.type = "button";
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "9999px";
      el.style.background = "#D4AF37";
      el.style.border = "2px solid rgba(0,0,0,0.55)";
      el.style.cursor = "pointer";
      el.style.padding = "0";
      el.setAttribute("aria-label", `Comparable ${c.address}`);

      const price = displayPriceCents(c);
      const marker = new mapboxgl.Marker(el)
        .setLngLat([c.longitude!, c.latitude!])
        .setPopup(
          new mapboxgl.Popup({ offset: 12 }).setHTML(
            `<div style="color:#111;font-size:13px;min-width:140px">
                <strong>${escapeHtml(c.address)}</strong><br/>
                $${(price / 100).toLocaleString()}<br/>
                <span style="opacity:.75">${escapeHtml(c.listingStatus ?? "")}</span>
              </div>`,
          ),
        )
        .addTo(map);

      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelectRef.current?.(c);
      });

      markersRef.current.push(marker);
    }

    if (valid.length > 0) {
      const b = new mapboxgl.LngLatBounds([valid[0]!.longitude!, valid[0]!.latitude!], [
        valid[0]!.longitude!,
        valid[0]!.latitude!,
      ]);
      for (const c of valid) {
        b.extend([c.longitude!, c.latitude!]);
      }
      map.fitBounds(b, { padding: 48, maxZoom: 14, duration: 600 });
    }
  }, [mapReady, comps]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: mapboxgl.MapMouseEvent) => {
      if (!pickCenterMode) return;
      onPickCenter?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };

    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [pickCenterMode, onPickCenter]);

  if (!token) {
    return (
      <div
        className={`flex w-full min-h-[320px] items-center justify-center rounded-xl border border-white/10 bg-black/40 px-4 text-center text-sm text-white/70 ${className}`}
      >
        Set <code className="text-amber-200/90">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-[min(520px,70vh)] min-h-[320px] rounded-xl border border-white/10 ${className}`}
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
