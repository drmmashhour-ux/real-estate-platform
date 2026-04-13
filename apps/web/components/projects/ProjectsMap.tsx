"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { priceVsMedianLabel } from "@/lib/search/map-search-analytics";

const PLATFORM_MAP_PIN_ICON_SRC = "/branding/logo-icon.svg";
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

function medianStartingPrice(projectList: Project[]): number {
  const prices = projectList.map((p) => p.startingPrice).filter((n) => typeof n === "number" && Number.isFinite(n) && n > 0);
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function formatFromPrice(n: number): string {
  return n >= 1000 ? `From $${(n / 1000).toFixed(0)}k` : `$${n.toLocaleString("en-CA")}`;
}

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

    const median = medianStartingPrice(projects);

    projects.forEach((p) => {
      const { lat, lng } = getCoords(p);
      const priceMini = formatFromPrice(p.startingPrice);
      const ring = p.featured
        ? `box-shadow:0 0 0 2px ${FEATURED_GOLD},0 2px 8px rgba(0,0,0,.35)`
        : "box-shadow:0 2px 8px rgba(0,0,0,.25)";
      const pinHtml = `<div style="display:flex;align-items:center;gap:4px;${ring};border-radius:10px;border:1px solid rgba(255,255,255,.9);background:rgba(15,23,42,.92);padding:3px 7px 3px 4px">
        <img src="${escapeAttr(PLATFORM_MAP_PIN_ICON_SRC)}" alt="" width="16" height="16" style="width:16px;height:16px;object-fit:contain;flex-shrink:0;border-radius:3px" />
        <span style="font-size:10px;font-weight:700;color:#f8fafc;white-space:nowrap">${escapeHtml(priceMini)}</span>
      </div>`;
      const markerIcon = L.divIcon({
        className: "projects-map-pin",
        html: pinHtml,
        iconSize: [118, 28],
        iconAnchor: [59, 28],
      });

      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);

      const priceStr = formatFromPrice(p.startingPrice);
      const vsMedian =
        median > 0 && p.startingPrice > 0 ? priceVsMedianLabel(p.startingPrice, median) : "";
      const medianLine =
        median > 0
          ? `<p class="text-sm font-semibold text-slate-800 mt-2 tabular-nums">Median in this view: ${escapeHtml(formatFromPrice(median).replace(/^From /, ""))}</p>`.replace(
              "Median in this view: $",
              "Median in this view: From $"
            )
          : "";

      marker.bindPopup(
        `<div class="min-w-[200px] max-w-[280px] p-2 text-slate-900">
          <div class="flex items-center gap-2 mb-2 pb-2 border-b border-amber-200/90">
            <img src="${escapeAttr(PLATFORM_MAP_PIN_ICON_SRC)}" alt="" width="18" height="18" style="width:18px;height:18px;object-fit:contain;border-radius:3px" />
            <span class="text-xs font-bold uppercase tracking-wide text-amber-900">${escapeHtml(PLATFORM_NAME)} project</span>
          </div>
          <p class="font-semibold">${escapeHtml(p.name)}</p>
          <p class="text-sm text-slate-600">${escapeHtml(p.city ?? "")}</p>
          <p class="text-sm font-semibold text-slate-800 mt-1 tabular-nums">Starting from: ${escapeHtml(priceStr)}</p>
          ${median > 0 ? `<p class="text-sm font-semibold text-slate-800 mt-1 tabular-nums">Median in this view: ${escapeHtml(priceStr.includes("From") ? formatFromPrice(median) : `$${Math.round(median).toLocaleString("en-CA")}`)}</p>` : ""}
          ${vsMedian ? `<p class="text-xs text-slate-600 mt-1.5 leading-snug">${escapeHtml(vsMedian)}</p>` : ""}
          <a href="/projects/${escapeAttr(p.id)}" class="mt-2 inline-block rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-teal-700">View project</a>
        </div>`,
        { maxWidth: 300 }
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
