"use client";

import { useEffect, useRef } from "react";
import { ProductAnalyticsEvents, reportProductEvent } from "@/lib/analytics/product-analytics";

export function ListingViewedBeacon({
  listingId,
  surface,
  city,
  listingKind,
}: {
  listingId: string;
  surface: "bnhub" | "unified_listings";
  city?: string | null;
  listingKind?: string | null;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !listingId) return;
    sent.current = true;
    reportProductEvent(ProductAnalyticsEvents.LISTING_VIEWED, {
      listing_id: listingId,
      surface,
      ...(city ? { city: String(city).slice(0, 64) } : {}),
      ...(listingKind ? { listing_kind: listingKind } : {}),
    });
    let sessionId: string | undefined;
    if (typeof window !== "undefined") {
      sessionId = window.sessionStorage.getItem("lecipm_mi_sid") ?? undefined;
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        window.sessionStorage.setItem("lecipm_mi_sid", sessionId);
      }
    }
    void fetch("/api/marketing-intelligence/v1/listing-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ listingId, surface, sessionId }),
    }).catch(() => {});
  }, [listingId, surface, city, listingKind]);

  return null;
}
