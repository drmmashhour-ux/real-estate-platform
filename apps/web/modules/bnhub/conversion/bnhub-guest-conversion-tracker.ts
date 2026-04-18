"use client";

import { recordBnhubConversionEventTracked } from "./bnhub-conversion-monitoring.service";

const LS_KEY = "bnhub_guest_conversion_v1";

type ListingAgg = {
  clicks: number;
  views: number;
  bookingStarts: number;
  bookingCompleted: number;
};

type StoreV1 = {
  v: 1;
  searchViews: number;
  byListing: Record<string, ListingAgg>;
};

const mem: StoreV1 = { v: 1, searchViews: 0, byListing: {} };

function isLayerEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const v = process.env.NEXT_PUBLIC_FEATURE_BNHUB_CONVERSION_V1;
  return v === "1" || v === "true";
}

function load(): StoreV1 {
  if (typeof window === "undefined") return mem;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return mem;
    const parsed = JSON.parse(raw) as Partial<StoreV1>;
    if (parsed?.v !== 1 || typeof parsed.searchViews !== "number" || typeof parsed.byListing !== "object") {
      return mem;
    }
    return { v: 1, searchViews: parsed.searchViews, byListing: parsed.byListing ?? {} };
  } catch {
    return mem;
  }
}

function save(s: StoreV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode */
  }
}

function bumpListing(listingId: string, patch: Partial<ListingAgg>): void {
  const s = load();
  const cur = s.byListing[listingId] ?? { clicks: 0, views: 0, bookingStarts: 0, bookingCompleted: 0 };
  s.byListing[listingId] = {
    clicks: cur.clicks + (patch.clicks ?? 0),
    views: cur.views + (patch.views ?? 0),
    bookingStarts: cur.bookingStarts + (patch.bookingStarts ?? 0),
    bookingCompleted: cur.bookingCompleted + (patch.bookingCompleted ?? 0),
  };
  Object.assign(mem, s);
  save(s);
}

function fireServerSignal(
  listingId: string,
  eventType: "listing_click" | "listing_view" | "booking_started" | "booking_completed",
): void {
  if (typeof window === "undefined" || !isLayerEnabled()) return;
  void fetch("/api/bnhub/conversion-signal", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId, eventType, metadata: { source: "bnhub_conversion_v1" } }),
  }).catch(() => {});
}

/** Guest-side search surface viewed (local-only; no listing id). */
export function trackSearchView(): void {
  if (!isLayerEnabled()) return;
  const s = load();
  s.searchViews += 1;
  Object.assign(mem, s);
  save(s);
  recordBnhubConversionEventTracked({ type: "search_view" });
}

export function trackListingClick(listingId: string): void {
  if (!listingId || !isLayerEnabled()) return;
  bumpListing(listingId, { clicks: 1 });
  recordBnhubConversionEventTracked({ type: "listing_click", listingId });
  fireServerSignal(listingId, "listing_click");
}

export function trackListingView(listingId: string): void {
  if (!listingId || !isLayerEnabled()) return;
  bumpListing(listingId, { views: 1 });
  recordBnhubConversionEventTracked({ type: "listing_view", listingId });
  fireServerSignal(listingId, "listing_view");
}

export function trackBookingStarted(listingId: string): void {
  if (!listingId || !isLayerEnabled()) return;
  bumpListing(listingId, { bookingStarts: 1 });
  recordBnhubConversionEventTracked({ type: "booking_started", listingId });
  fireServerSignal(listingId, "booking_started");
}

export function trackBookingCompleted(listingId: string): void {
  if (!listingId || !isLayerEnabled()) return;
  bumpListing(listingId, { bookingCompleted: 1 });
  recordBnhubConversionEventTracked({ type: "booking_completed", listingId });
  fireServerSignal(listingId, "booking_completed");
}

/** Read-only snapshot for debugging / future dashboards (client). */
export function getBnhubGuestConversionLocalSnapshot(): StoreV1 {
  return load();
}
