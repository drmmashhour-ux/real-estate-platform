"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/trackEvent";

export function ShareAnalysisViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    trackEvent("listing_analysis_share_viewed", { listingId });
  }, [listingId]);
  return null;
}
