"use client";

import { useEffect, useRef } from "react";
import { trackListingView } from "@/modules/bnhub/conversion/bnhub-guest-conversion-tracker";

/** Fires V1 listing_view beacon (local + optional conversion-signal) when enabled. */
export function BnhubListingConversionBeacon({ listingId }: { listingId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !listingId) return;
    sent.current = true;
    trackListingView(listingId);
  }, [listingId]);
  return null;
}
