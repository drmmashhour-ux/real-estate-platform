"use client";

import type { OfflineAction, ProcessResult } from "@repo/offline";

/**
 * Applies queued outbound work using existing authenticated fetch routes (cookies).
 */
export async function executeSyriaOfflineAction(action: OfflineAction): Promise<ProcessResult> {
  const v = action.clientVersion;
  const hdr = (): HeadersInit => ({
    "Content-Type": "application/json",
    "X-Client-Offline-Version": String(v),
  });

  switch (action.type) {
    case "booking_request": {
      const listingId = String(action.payload.listingId ?? "").trim();
      const checkIn = String(action.payload.checkIn ?? "").trim();
      const checkOut = String(action.payload.checkOut ?? "").trim();
      const guests = Number(action.payload.guests ?? 0);
      if (!listingId || !checkIn || !checkOut || !Number.isFinite(guests) || guests < 1) {
        return { handled: false };
      }
      const res = await fetch("/api/sybnb/bookings", {
        method: "POST",
        credentials: "include",
        headers: hdr(),
        body: JSON.stringify({ listingId, checkIn, checkOut, guests: Math.floor(guests) }),
      });
      if (res.ok) return { handled: true };
      if (res.status >= 500 || res.status === 429 || res.status === 408) {
        return { handled: false, transient: true };
      }
      return { handled: false };
    }

    case "approve": {
      const bookingId = String(action.payload.bookingId ?? "").trim();
      if (!bookingId) return { handled: false };
      const res = await fetch(`/api/sybnb/bookings/${encodeURIComponent(bookingId)}/approve`, {
        method: "POST",
        credentials: "include",
        headers: hdr(),
      });
      if (res.ok) return { handled: true };
      if (res.status >= 500 || res.status === 429) return { handled: false, transient: true };
      return { handled: false };
    }

    case "decline": {
      const bookingId = String(action.payload.bookingId ?? "").trim();
      if (!bookingId) return { handled: false };
      const res = await fetch(`/api/sybnb/bookings/${encodeURIComponent(bookingId)}/decline`, {
        method: "POST",
        credentials: "include",
        headers: hdr(),
      });
      if (res.ok) return { handled: true };
      if (res.status >= 500 || res.status === 429) return { handled: false, transient: true };
      return { handled: false };
    }

    case "message": {
      /** Outbox reserved — sync endpoint not wired yet; keep drafts in `messages` store only. */
      return { handled: true };
    }

    default:
      return { handled: false };
  }
}
