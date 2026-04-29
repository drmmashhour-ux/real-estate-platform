"use client";

import { useEffect } from "react";
import { persistPwaLastBooking, type PwaBookingSnapshot } from "@/lib/pwa/local-cache";

export function PwaPersistBookingSnapshot({ locale, bookingId, title, status }: PwaBookingSnapshot) {
  useEffect(() => {
    persistPwaLastBooking({ locale, bookingId, title, status });
  }, [bookingId, locale, status, title]);

  return null;
}
