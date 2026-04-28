"use client";

import { useEffect, useRef } from "react";

/**
 * ORDER SYBNB-70 — one-shot `POST /api/sybnb/events` (`listing_open`) from `/listing/[id]`.
 * Short-stay discovery detail (`/sybnb/listings/[id]`) keeps using `SybnbListingViewBeacon` (`listing_view`).
 */
export function SybnbListingOpenBeacon({ listingId }: { listingId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch("/api/sybnb/events", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ type: "listing_open", listingId }),
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined);
  }, [listingId]);

  return null;
}
