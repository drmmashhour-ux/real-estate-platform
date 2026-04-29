/**
 * Minimal localStorage mirrors for PWA offline UX (alongside IndexedDB in `@repo/offline`).
 * Keys are namespaced; payloads stay small (lite listings + last booking summary).
 */

export const LS_LAST_LISTINGS = "syria:pwa:last-listings-v1";
export const LS_LAST_BOOKING = "syria:pwa:last-booking-v1";

export function persistPwaLastListings(locale: string, items: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LS_LAST_LISTINGS,
      JSON.stringify({ locale, items, ts: Date.now() }),
    );
  } catch {
    /* quota / private mode */
  }
}

export type PwaBookingSnapshot = {
  locale: string;
  bookingId: string;
  title: string;
  status: string;
};

export function persistPwaLastBooking(snapshot: PwaBookingSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LS_LAST_BOOKING,
      JSON.stringify({ ...snapshot, ts: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}
