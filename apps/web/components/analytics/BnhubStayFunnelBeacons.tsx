"use client";

import { useEffect, useRef } from "react";
import { track, TrackingEvent } from "@/lib/tracking";

/**
 * Once per page: fires `scroll_50` when the guest scrolls halfway down (engagement signal for funnel drop-off).
 */
export function BnhubStayScrollDepthBeacon({
  listingId,
  surface = "bnhub_stay",
}: {
  listingId: string;
  surface?: string;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (!listingId) return;

    const fire = () => {
      if (sent.current) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) return;
      const ratio = doc.scrollTop / scrollable;
      if (ratio < 0.5) return;
      sent.current = true;
      track(TrackingEvent.SCROLL_50, {
        meta: { listing_id: listingId, surface, depth: "50pct" },
      });
    };

    const onScroll = () => {
      fire();
    };

    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    fire();
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [listingId, surface]);

  return null;
}
