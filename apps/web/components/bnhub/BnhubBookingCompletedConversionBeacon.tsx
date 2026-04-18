"use client";

import { useEffect, useRef } from "react";
import { trackBookingCompleted } from "@/modules/bnhub/conversion/bnhub-guest-conversion-tracker";

export function BnhubBookingCompletedConversionBeacon({
  listingId,
  paymentConfirmed,
}: {
  listingId: string;
  paymentConfirmed: boolean;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !listingId || !paymentConfirmed) return;
    sent.current = true;
    trackBookingCompleted(listingId);
  }, [listingId, paymentConfirmed]);
  return null;
}
