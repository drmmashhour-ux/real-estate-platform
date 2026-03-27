"use client";

import { useEffect, useRef } from "react";

/**
 * Logs one listing_view per page load + dwell time on tab hide (signed-in only; 401 ignored).
 * Uses visibilitychange to avoid double-counting views on unmount.
 */
export function LogListingView({ listingId }: { listingId: string }) {
  const start = useRef(Date.now());
  const dwellSent = useRef(false);

  useEffect(() => {
    start.current = Date.now();
    fetch("/api/ai/activity", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "listing_view", listingId }),
    }).catch(() => {});

    const onVis = () => {
      if (document.visibilityState !== "hidden" || dwellSent.current) return;
      dwellSent.current = true;
      const sec = Math.min(3600, Math.floor((Date.now() - start.current) / 1000));
      if (sec < 5) return;
      fetch("/api/ai/activity", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "session_heartbeat",
          listingId,
          durationSeconds: sec,
          metadata: { phase: "listing_dwell" },
        }),
      }).catch(() => {});
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [listingId]);

  return null;
}
