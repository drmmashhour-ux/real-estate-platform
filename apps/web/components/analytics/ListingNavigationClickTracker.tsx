"use client";

import { useEffect } from "react";
import { track, TrackingEvent } from "@/lib/tracking";

const RE_STAY = /^\/bnhub\/stays\/([^/?#]+)/;
const RE_BNHUB_LISTING = /^\/bnhub\/listings\/([^/?#]+)/;
const RE_UNIFIED = /^\/listings\/([^/?#]+)/;

function parseListingHref(href: string): { surface: string; ref: string } | null {
  try {
    const u = new URL(href, typeof window !== "undefined" ? window.location.origin : "https://lecipm.com");
    const p = u.pathname;
    let m = p.match(RE_STAY);
    if (m) return { surface: "bnhub_stay", ref: m[1] };
    m = p.match(RE_BNHUB_LISTING);
    if (m) return { surface: "bnhub_listing", ref: m[1] };
    m = p.match(RE_UNIFIED);
    if (m) return { surface: "unified_listing", ref: m[1] };
  } catch {
    return null;
  }
  return null;
}

/**
 * Delegates clicks on listing links → `listing_click` traffic (GA/Meta + first-party DB).
 * Complements detail-page `listing_view` / `listing_viewed` beacons.
 */
export function ListingNavigationClickTracker() {
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const parsed = parseListingHref(href);
      if (!parsed) return;
      track(TrackingEvent.LISTING_CLICK, {
        meta: {
          surface: parsed.surface,
          ref: parsed.ref,
          href: href.slice(0, 512),
        },
      });
    };
    document.addEventListener("click", onPointerDown, true);
    return () => document.removeEventListener("click", onPointerDown, true);
  }, []);

  return null;
}
