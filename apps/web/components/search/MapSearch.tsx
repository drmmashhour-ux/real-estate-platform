"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapListing } from "@/components/map/MapListing";
import type { MapBoundsWgs84 } from "@/components/search/MapSearchAdapter";
import { priceVsMedianLabel } from "@/lib/search/map-search-analytics";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { BNHUB_LOGO_SRC } from "@/lib/brand/bnhub-logo";

/** LECIPM mark — map pin for on-platform real-estate (FSBO / CRM), not BNHUB stays. */
const LECIPM_PLATFORM_MAP_PIN_ICON_SRC = "/branding/logo-icon.svg";
/** Québec flag — pin glyph for non-platform listings (Leaflet HTML). */
const QUEBEC_FLAG_PIN_SRC = "/flags/quebec.svg";

function isBnhubStaysMapListing(listing: MapListing): boolean {
  return Boolean(listing.platformListing && listing.listingHeadline === "Nightly stay");
}

const DEFAULT_CENTER: [number, number] = [45.5, -73.57];
const DEFAULT_ZOOM = 10;

export type MapFocusPoint = { lat: number; lng: number };

const GOLD = "#D4AF37";
const LIGHT_GOLD = "#e8d5a3";
const PIN_GRAY = "#e5e7eb";
const PIN_SOLD_BG = "#475569";
const PIN_SOLD_BORDER = "#334155";
const PIN_OFFER_STRONG_BG = "#b45309";
const PIN_OFFER_STRONG_BORDER = "#92400e";
const PIN_OFFER_BG = "#d97706";
const PIN_OFFER_BORDER = "#b45309";
const PIN_RENT_BG = "#0369a1";
const PIN_RENT_BORDER = "#0c4a6e";

export type MapSearchProps = {
  listings: MapListing[];
  /** When all bounds set, map fits this box on first paint. */
  initialBounds?: MapBoundsWgs84 | null;
  /**
   * Center map on a geocoded search location when there is no URL bbox.
   * Does not write bounds to the parent (programmatic move is ignored briefly).
   */
  focusPoint?: MapFocusPoint | null;
  /** Zoom when applying focusPoint (default 13). */
  focusZoom?: number;
  /** When true, do not auto-fit the map to all listing markers (e.g. URL bbox is authoritative). */
  suppressAutoFit?: boolean;
  /** Fires after user pans/zooms (debounced 300ms). */
  onBoundsChange?: (b: MapBoundsWgs84) => void;
  onMarkerClick?: (listing: MapListing) => void;
  /** Highlight marker */
  selectedId?: string | null;
  className?: string;
  /** Dark UI + gold accents (BNHUB premium) */
  variant?: "light" | "dark";
  /** Soft gold heat zones from clustered average AI scores */
  enableHeatZones?: boolean;
  /** Median price of visible pins — used for “vs typical” hints in popups only. */
  marketMedianPrice?: number | null;
  /** Exposed to assistive tech — list view remains the non-map path. */
  "aria-label"?: string;
};

function pinStyle(listing: MapListing): { bg: string; border: string; text: string } {
  if (isBnhubStaysMapListing(listing)) {
    return { bg: "#0F0F0F", border: "#D4AF37", text: "#D4AF37" };
  }
  if (listing.transactionKey === "sold") {
    return { bg: PIN_SOLD_BG, border: PIN_SOLD_BORDER, text: "#f8fafc" };
  }
  if (listing.transactionKey === "offer_accepted") {
    return { bg: PIN_OFFER_STRONG_BG, border: PIN_OFFER_STRONG_BORDER, text: "#fffbeb" };
  }
  if (listing.transactionKey === "offer_received") {
    return { bg: PIN_OFFER_BG, border: PIN_OFFER_BORDER, text: "#fffbeb" };
  }
  if (listing.dealKind === "rent") {
    return { bg: PIN_RENT_BG, border: PIN_RENT_BORDER, text: "#e0f2fe" };
  }
  const s = listing.aiScore ?? 68;
  if (s >= 85) return { bg: GOLD, border: "#b8962e", text: "#0a0a0a" };
  if (s >= 70) return { bg: LIGHT_GOLD, border: "#a89050", text: "#1a1a1a" };
  return { bg: PIN_GRAY, border: "#9ca3af", text: "#374151" };
}

/** Hover label — listing price + area median (same view) when available */
function pinTooltipLabel(listing: MapListing, median: number): string {
  const rentSuffix = listing.dealKind === "rent" ? "/mo" : "";
  const price =
    typeof listing.price === "number" && Number.isFinite(listing.price)
      ? `$${Math.round(listing.price).toLocaleString("en-CA")}${rentSuffix}`
      : "Ask price on listing";
  if (median > 0) {
    return `${price} · Median here: $${Math.round(median).toLocaleString("en-CA")}${rentSuffix}`;
  }
  return price;
}

function buildMapRatingHtml(listing: MapListing): string {
  const ra = listing.reviewAverageOutOf5;
  const rc = listing.reviewCount ?? 0;
  if (typeof ra === "number" && Number.isFinite(ra) && ra > 0 && rc > 0) {
    const unit = rc === 1 ? "review" : "reviews";
    return `<p class="text-xs font-semibold text-slate-800 tabular-nums">★ ${escapeHtml(ra.toFixed(1))}/5 <span class="font-normal text-slate-600">(${rc} ${unit})</span></p>`;
  }
  const s10 = listing.guestScoreOutOf10;
  if (typeof s10 === "number" && Number.isFinite(s10)) {
    const lab = listing.guestScoreLabel?.trim() ? escapeHtml(listing.guestScoreLabel.trim()) : "Guest score";
    return `<p class="text-xs text-slate-800"><span class="font-semibold">${lab}</span> · <span class="tabular-nums">${escapeHtml(s10.toFixed(1))}/10</span></p>`;
  }
  const note = listing.mapRatingNote?.trim();
  if (note) {
    return `<p class="text-xs leading-snug text-slate-600">${escapeHtml(note)}</p>`;
  }
  return "";
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
  focusPoint = null,
  focusZoom = 13,
  suppressAutoFit = false,
  onBoundsChange,
  onMarkerClick,
  selectedId,
  className = "",
  variant = "light",
  enableHeatZones = true,
  marketMedianPrice = null,
  "aria-label": ariaLabel = "Map of listings in this search. Use the list view to browse without the map.",
}: MapSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const heatLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreBoundsUntilRef = useRef(0);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const [mapEpoch, setMapEpoch] = useState(0);

  const emitBounds = useCallback(() => {
    if (Date.now() < ignoreBoundsUntilRef.current) return;
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
    let resizeObs: ResizeObserver | null = null;
    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const el = containerRef.current;
      const map = L.map(el, { scrollWheelZoom: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
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

      if (cancelled) {
        map.remove();
        mapRef.current = null;
        heatLayerRef.current = null;
        layerRef.current = null;
        return;
      }

      setMapEpoch((e) => e + 1);

      const scheduleInvalidate = () => {
        requestAnimationFrame(() => {
          map.invalidateSize();
          requestAnimationFrame(() => map.invalidateSize());
        });
      };
      scheduleInvalidate();
      map.whenReady(scheduleInvalidate);

      if (typeof ResizeObserver !== "undefined") {
        resizeObs = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObs.observe(el);
      }

      if (cancelled) {
        resizeObs?.disconnect();
        resizeObs = null;
        map.remove();
        mapRef.current = null;
        heatLayerRef.current = null;
        layerRef.current = null;
        return;
      }

      const onMoveEnd = () => {
        if (Date.now() < ignoreBoundsUntilRef.current) return;
        if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
        moveTimerRef.current = setTimeout(() => emitBounds(), 300);
      };
      map.on("moveend", onMoveEnd);
      map.on("zoomend", onMoveEnd);
    })();

    return () => {
      cancelled = true;
      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      resizeObs?.disconnect();
      resizeObs = null;
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
    ignoreBoundsUntilRef.current = Date.now() + 200;
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
    if (!map || !focusPoint) return;
    const hasIb =
      initialBounds != null &&
      initialBounds.north > initialBounds.south &&
      initialBounds.east > initialBounds.west;
    if (hasIb) return;
    ignoreBoundsUntilRef.current = Date.now() + 200;
    map.setView([focusPoint.lat, focusPoint.lng], focusZoom, { animate: false });
  }, [focusPoint, focusZoom, initialBounds, mapEpoch]);

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

      const median =
        typeof marketMedianPrice === "number" && Number.isFinite(marketMedianPrice) && marketMedianPrice > 0
          ? marketMedianPrice
          : 0;

      valid.forEach((listing) => {
        const lat = listing.latitude as number;
        const lng = listing.longitude as number;
        const rentSuffix = listing.dealKind === "rent" ? "/mo" : "";
        const priceLabel =
          typeof listing.price === "number" && !Number.isNaN(listing.price)
            ? `$${Math.round(listing.price).toLocaleString("en-CA")}${rentSuffix}`
            : "";
        const selected = selectedId === listing.id;
        const ps = pinStyle(listing);
        const statusLine = listing.transactionLabel
          ? escapeHtml(listing.transactionLabel)
          : listing.listingHeadline
            ? escapeHtml(listing.listingHeadline)
            : listing.dealKind === "rent"
              ? "For rent"
              : "For sale";
        const vsMedian =
          median > 0 && typeof listing.price === "number" && Number.isFinite(listing.price)
            ? priceVsMedianLabel(listing.price, median)
            : "";
        const medianLine =
          median > 0
            ? `<p class="text-sm font-semibold text-slate-800 tabular-nums">Median for this map view: ${escapeHtml(
                `$${Math.round(median).toLocaleString("en-CA")}${rentSuffix}`
              )}</p>`
            : "";
        const askLine =
          priceLabel !== ""
            ? `<p class="text-base font-bold text-slate-900 tabular-nums">Listing: ${escapeHtml(priceLabel)}</p>`
            : "";
        const ratingHtml = buildMapRatingHtml(listing);
        const logoLockup = listing.platformListing
          ? `<div class="flex flex-col items-center gap-1 flex-shrink-0 w-[44px]">
              <img src="${escapeAttr(isBnhubStaysMapListing(listing) ? BNHUB_LOGO_SRC : LECIPM_PLATFORM_MAP_PIN_ICON_SRC)}" alt="" width="40" height="40" style="width:40px;height:40px;object-fit:contain;border-radius:6px" />
              <span class="text-[9px] font-bold uppercase tracking-wider text-center leading-tight text-amber-900" style="max-width:44px">${escapeHtml(PLATFORM_NAME)}</span>
            </div>`
          : "";
        const pricingCluster = `
            <div class="flex-1 min-w-0 space-y-1">
              ${vsMedian ? `<p class="text-xs text-slate-600 leading-snug">${escapeHtml(vsMedian)}</p>` : ""}
              ${ratingHtml}
            </div>`;
        const priceHeader =
          askLine || medianLine
            ? `<div class="border-b border-slate-200 bg-amber-50/60 px-3 py-2.5">${askLine}${medianLine}</div>`
            : "";
        const nightlyHint =
          listing.platformListing && listing.listingHeadline === "Nightly stay"
            ? ` <span class="text-sm font-semibold text-slate-600">/ night</span>`
            : "";
        const nightlyHintDark =
          listing.platformListing && listing.listingHeadline === "Nightly stay"
            ? ` <span class="text-sm font-semibold text-neutral-500">/ night</span>`
            : "";
        const trimmedAddr = listing.address?.trim();
        const addressLine = trimmedAddr
          ? `<p class="text-sm text-slate-600 leading-snug">${escapeHtml(trimmedAddr)}</p>`
          : "";

        const platformMedianHeader =
          medianLine !== ""
            ? `<div class="border-b border-slate-200 bg-amber-50/60 px-3 py-2.5">${medianLine}</div>`
            : "";

        const platformMedianHeaderDark =
          medianLine !== ""
            ? `<div style="border-bottom:1px solid #1f1f1f;background:#161616;padding:10px 12px">${medianLine.replace(/text-slate-800/g, "text-neutral-200").replace(/text-slate-600/g, "text-neutral-400")}</div>`
            : "";

        const ratingHtmlDark = ratingHtml
          .replace(/text-slate-800/g, "text-neutral-100")
          .replace(/text-slate-600/g, "text-neutral-400");

        const platformPopupHtmlLight = `
          <div class="min-w-[240px] max-w-[300px] p-0 text-slate-900 overflow-hidden rounded-b-md">
            ${platformMedianHeader}
            ${
              listing.image
                ? `<img src="${escapeAttr(listing.image)}" alt="" class="w-full h-40 object-cover bg-slate-100" />`
                : `<div class="h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-500">No photo</div>`
            }
            <div class="p-3 space-y-2">
              ${
                priceLabel !== ""
                  ? `<p class="text-lg font-bold text-slate-900 tabular-nums">${escapeHtml(priceLabel)}${nightlyHint}</p>`
                  : ""
              }
              ${addressLine}
              <p class="font-semibold leading-snug text-slate-900">${escapeHtml(listing.title)}</p>
              ${ratingHtml ? `<div class="pt-1">${ratingHtml}</div>` : ""}
              ${vsMedian ? `<p class="text-xs text-slate-600 leading-snug">${escapeHtml(vsMedian)}</p>` : ""}
              ${
                listing.href
                  ? `<a href="${escapeAttr(listing.href)}" class="inline-block mt-2 text-sm font-medium text-amber-700 hover:underline">View listing →</a>`
                  : ""
              }
            </div>
          </div>`;

        const addressLineDark = trimmedAddr
          ? `<p class="text-sm text-neutral-400 leading-snug">${escapeHtml(trimmedAddr)}</p>`
          : "";

        const platformPopupHtmlDark = `
          <div class="min-w-[240px] max-w-[300px] overflow-hidden rounded-[12px] border border-[#1F1F1F] bg-[#0F0F0F] text-neutral-100 shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
            ${platformMedianHeaderDark}
            ${
              listing.image
                ? `<img src="${escapeAttr(listing.image)}" alt="" class="w-full h-40 object-cover bg-neutral-900" />`
                : `<div class="flex h-32 items-center justify-center bg-neutral-900 text-xs text-neutral-500">No photo</div>`
            }
            <div class="space-y-2 p-4">
              ${
                priceLabel !== ""
                  ? `<p class="text-lg font-bold tabular-nums text-[#D4AF37]">${escapeHtml(priceLabel)}${nightlyHintDark}</p>`
                  : ""
              }
              ${addressLineDark}
              <p class="font-semibold leading-snug text-white">${escapeHtml(listing.title)}</p>
              ${ratingHtml ? `<div class="pt-1">${ratingHtmlDark}</div>` : ""}
              ${vsMedian ? `<p class="text-xs leading-snug text-neutral-500">${escapeHtml(vsMedian)}</p>` : ""}
              ${
                listing.href
                  ? `<a href="${escapeAttr(listing.href)}" class="mt-2 inline-block text-sm font-semibold text-[#D4AF37] underline-offset-4 hover:underline">View listing →</a>`
                  : ""
              }
            </div>
          </div>`;

        const platformPopupHtml =
          variant === "dark" && listing.platformListing && isBnhubStaysMapListing(listing)
            ? platformPopupHtmlDark
            : platformPopupHtmlLight;

        const defaultPopupHtml = `
          <div class="min-w-[220px] max-w-[300px] p-0 text-slate-900">
            ${priceHeader}
            ${listing.image ? `<img src="${escapeAttr(listing.image)}" alt="" class="w-full h-28 object-cover" />` : ""}
            <div class="p-3">
              <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">${statusLine}</p>
              <p class="font-semibold mt-1 leading-snug">${escapeHtml(listing.title)}</p>
              <div class="mt-2 flex gap-3 items-start">
                ${logoLockup}
                ${pricingCluster}
              </div>
              ${listing.href ? `<a href="${escapeAttr(listing.href)}" class="inline-block mt-3 text-sm font-medium text-amber-700 hover:underline">View listing →</a>` : ""}
            </div>
          </div>`;

        const popupHtml = listing.platformListing ? platformPopupHtml : defaultPopupHtml;

        const ring = selected ? "box-shadow:0 0 0 3px rgba(212,175,55,0.85)" : "";
        const pinGlyphSrc = isBnhubStaysMapListing(listing)
          ? BNHUB_LOGO_SRC
          : listing.platformListing
            ? LECIPM_PLATFORM_MAP_PIN_ICON_SRC
            : QUEBEC_FLAG_PIN_SRC;
        const leadMark = listing.platformListing
          ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;border:2px solid ${ps.border};background:linear-gradient(160deg,#1a1a1a 0%,#0a0a0a 100%);flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,.35);overflow:hidden;padding:2px"><img src="${escapeAttr(pinGlyphSrc)}" alt="" width="24" height="24" style="width:24px;height:24px;object-fit:contain;object-position:center top;border-radius:6px"/></span>`
          : `<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;border:2px solid ${ps.border};background:linear-gradient(160deg,#1f1f1f 0%,#0a0a0a 100%);flex-shrink:0;box-shadow:0 2px 10px rgba(0,0,0,.35);overflow:hidden"><img src="${escapeAttr(pinGlyphSrc)}" alt="" width="20" height="13" style="width:20px;height:13px;object-fit:cover;border-radius:1px"/></span>`;
        const pinW = listing.platformListing ? 100 : 92;
        const icon = L.divIcon({
          className: "map-search-pin",
          html: `<div style="display:flex;align-items:center;gap:6px;${ring};border-radius:12px;border:1px solid ${ps.border};background:${ps.bg};color:${ps.text};padding:5px 10px 5px 7px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.35)">${leadMark}<span>${priceLabel || "·"}</span></div>`,
          iconSize: [pinW, 30],
          iconAnchor: [Math.round(pinW / 2), 30],
        });

        const m = L.marker([lat, lng], { icon });
        m.bindPopup(popupHtml, { maxWidth: 320, autoPanPadding: [16, 16] });
        m.bindTooltip(pinTooltipLabel(listing, median), { sticky: true, direction: "top" });
        m.on("click", () => {
          m.openPopup();
          onMarkerClick?.(listing);
        });
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
  }, [listings, selectedId, onMarkerClick, suppressAutoFit, enableHeatZones, marketMedianPrice, mapEpoch, variant]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={ariaLabel}
      className={[
        /* Avoid h-full: it fights explicit heights from parents and can leave Leaflet at 0px. */
        "min-h-[320px] w-full overflow-hidden rounded-[12px] border",
        variant === "dark" ? "border-bnhub-border bg-bnhub-main" : "border-slate-200 bg-slate-50",
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
