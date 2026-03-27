"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

const FEATURED_GOLD = "#C9A96E";
const MONTREAL_CENTER = { lat: 45.5017, lng: -73.5673 };
const ZOOM = 11;

type Project = {
  id: string;
  name: string;
  city?: string;
  startingPrice: number;
  featured?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
};

function getCoords(p: Project): { lat: number; lng: number } {
  if (
    p.latitude != null &&
    p.longitude != null &&
    !Number.isNaN(p.latitude) &&
    !Number.isNaN(p.longitude)
  ) {
    return { lat: p.latitude, lng: p.longitude };
  }
  if ((p.city ?? "").toLowerCase() === "laval") return { lat: 45.6066, lng: -73.7243 };
  return MONTREAL_CENTER;
}

type Props = {
  projects: Project[];
  className?: string;
};

export function ProjectsMap({ projects, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [mounted, setMounted] = useState(false);

  const initMap = useCallback(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    const L = require("leaflet");

    if (mapRef.current) return;
    const map = L.map(containerRef.current).setView([MONTREAL_CENTER.lat, MONTREAL_CENTER.lng], ZOOM);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    const goldIcon = L.divIcon({
      className: "custom-marker featured",
      html: `<div style="width:24px;height:24px;border-radius:50%;background:${FEATURED_GOLD};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const defaultIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="width:18px;height:18px;border-radius:50%;background:#14b8a6;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    projects.forEach((p) => {
      const { lat, lng } = getCoords(p);
      const marker = L.marker([lat, lng], {
        icon: p.featured ? goldIcon : defaultIcon,
      }).addTo(map);

      const priceStr =
        p.startingPrice >= 1000
          ? `From $${(p.startingPrice / 1000).toFixed(0)}k`
          : `$${p.startingPrice.toLocaleString()}`;

      marker.bindPopup(
        `<div class="min-w-[180px] p-2">
          <p class="font-semibold text-slate-900">${escapeHtml(p.name)}</p>
          <p class="text-sm text-slate-600">${escapeHtml(p.city ?? "")} · ${priceStr}</p>
          <p class="mt-2 text-xs text-slate-500">AI Insight: High demand area, strong rental zone.</p>
          <a href="/projects/${p.id}" class="mt-2 inline-block rounded bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-teal-600">View Project</a>
        </div>`,
        { maxWidth: 260 }
      );
    });

    mapRef.current = map;
  }, [projects]);

  useEffect(() => {
    setMounted(true);
    initMap();
    return () => {
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
        Loading map…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-[480px] w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900 ${className}`}
      style={{ minHeight: 400 }}
    />
  );
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
