"use client";

import { useEffect, useRef } from "react";
import { consumeContentAttribution, fireContentPerformanceEvent } from "@/lib/content-machine/client-track";

/**
 * After a **paid** booking, if this browser had viewed the listing with `?cc=`, increment **conversions** on that content row.
 */
export function ContentPerformanceConversionBeacon({
  listingId,
  paymentConfirmed,
}: {
  listingId: string;
  paymentConfirmed: boolean;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (!paymentConfirmed || !listingId || sent.current) return;
    const contentId = consumeContentAttribution(listingId);
    if (!contentId) return;
    sent.current = true;
    fireContentPerformanceEvent(contentId, listingId, "conversion");
  }, [listingId, paymentConfirmed]);

  return null;
}
