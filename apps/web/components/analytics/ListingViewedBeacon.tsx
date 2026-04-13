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
  }, [listingId, surface, city, listingKind]);

  return null;
}
