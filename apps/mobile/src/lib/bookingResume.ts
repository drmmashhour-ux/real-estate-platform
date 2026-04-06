/**
 * Serialize booking intent after sign-in redirect (property → auth → summary).
 */
export type BookingResumePayload = {
  listingId: string;
  price: string;
  title: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  coverUrl?: string;
};

export function encodeBookingResume(p: BookingResumePayload): string {
  return encodeURIComponent(JSON.stringify(p));
}

export function decodeBookingResume(raw: string | undefined | null): BookingResumePayload | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const p = JSON.parse(decodeURIComponent(raw)) as BookingResumePayload;
    if (!p.listingId || !p.checkIn || !p.checkOut) return null;
    return p;
  } catch {
    return null;
  }
}
