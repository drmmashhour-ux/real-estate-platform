"use client";

import { useEffect, useRef } from "react";
import { ProductAnalyticsEvents, reportProductEvent } from "@/lib/analytics/product-analytics";

export function BookingCompletedBeacon({
  bookingId,
  paymentConfirmed,
  listingId,
  valueCents,
}: {
  bookingId: string;
  paymentConfirmed: boolean;
  /** For Meta Pixel Purchase / catalog signals */
  listingId?: string;
  valueCents?: number | null;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !bookingId) return;
    sent.current = true;
    reportProductEvent(ProductAnalyticsEvents.BOOKING_COMPLETED, {
      booking_id: bookingId,
      payment_confirmed: paymentConfirmed,
      ...(listingId ? { listing_id: listingId } : {}),
      ...(valueCents != null && Number.isFinite(valueCents) ? { value_cents: valueCents } : {}),
    });
  }, [bookingId, paymentConfirmed, listingId, valueCents]);

  return null;
}
