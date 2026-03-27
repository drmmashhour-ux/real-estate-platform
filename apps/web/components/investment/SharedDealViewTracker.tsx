"use client";

import { useEffect } from "react";
import { getTrackingSessionId } from "@/lib/tracking";

const STORAGE_PREFIX = "lecipm_sd_tracked_";

/**
 * Records one SharedDealVisit per deal per browser session (non-blocking).
 */
export function SharedDealViewTracker({
  dealId,
  referrerDealId,
  referrerUserId,
}: {
  dealId: string;
  referrerDealId?: string | null;
  /** ?ru= sharer user id */
  referrerUserId?: string | null;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const k = `${STORAGE_PREFIX}${dealId}`;
    try {
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      return;
    }

    void fetch("/api/investment/shared-deal/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealId,
        referrerDealId: referrerDealId && referrerDealId.length > 0 ? referrerDealId : null,
        referrerUserId: referrerUserId && referrerUserId.length > 0 ? referrerUserId : null,
        sessionId: getTrackingSessionId(),
      }),
    }).catch(() => {
      /* ignore */
    });
  }, [dealId, referrerDealId, referrerUserId]);

  return null;
}
