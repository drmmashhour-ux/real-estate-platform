"use client";

import { useEffect, useRef } from "react";

/** One-shot `POST /api/sybnb/events` (`listing_view`). SYBNB-10. */
export function SybnbListingViewBeacon({ listingId }: { listingId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch("/api/sybnb/events", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({ type: "listing_view", listingId }),
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined);
  }, [listingId]);

  return null;
}
