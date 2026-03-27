"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import "leaflet/dist/leaflet.css";

const MONTREAL_CENTER = { lat: 45.5017, lng: -73.5673 };
const ZOOM = 10;

export type HeatmapPoint = {
  projectId: string;
  latitude: number;
  longitude: number;
  demandScore: number;
  demandLabel: "low" | "medium" | "high";
  weight: number;
};

const DEMAND_COLORS = {
  low: "#3b82f6",   // blue
  medium: "#f97316", // orange
  high: "#eab308",   // gold
};

type Props = {
  points: HeatmapPoint[];
  className?: string;
};

export function ProjectsHeatmapMap({ points, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import("leaflet").map> | null>(null);
  const layersRef = useRef<ReturnType<typeof import("leaflet").circle>[]>([]);
  const [mounted, setMounted] = useState(false);

  const initMap = useCallback(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const L = require("leaflet");

    if (mapRef.current) return;
    const map = L.map(containerRef.current).setView([MONTREAL_CENTER.lat, MONTREAL_CENTER.lng], ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;
  }, []);

  useEffect(() => {
    setMounted(true);
    initMap();
    return () => {
      layersRef.current.forEach((layer) => {
        try { if (mapRef.current) mapRef.current.removeLayer(layer); } catch {}
      });
      layersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [initMap]);

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-400 ${className}`}
        style={{ minHeight: 400 }}
      >
        Loading heatmap…
      </div>
    );
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !points.length) return;
    const L = require("leaflet");

    layersRef.current.forEach((layer) => {
      try { map.removeLayer(layer); } catch {}
    });
    layersRef.current = [];

    const bounds: [number, number][] = [];
    points.forEach((pt) => {
      const radius = 400 + pt.weight * 800;
      const color = DEMAND_COLORS[pt.demandLabel] ?? DEMAND_COLORS.medium;
      const circle = L.circle([pt.latitude, pt.longitude], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.35,
        weight: 2,
      }).addTo(map);
      circle.bindTooltip(
        `<span class="font-medium">${pt.demandLabel} demand</span><br/>Score: ${pt.demandScore}`,
        { className: "heatmap-tooltip", offset: [0, -10] }
      );
      layersRef.current.push(circle);
      bounds.push([pt.latitude, pt.longitude]);
    });

    if (bounds.length > 0) {
      try {
        const b = L.latLngBounds(bounds);
        map.fitBounds(b, { padding: [40, 40], maxZoom: 12 });
      } catch {}
    }
  }, [points]);

  return (
    <div
      ref={containerRef}
      className={`h-[480px] w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900 ${className}`}
      style={{ minHeight: 400 }}
    />
  );
}
