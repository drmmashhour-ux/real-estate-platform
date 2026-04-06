/**
 * Legacy hook — review timing is handled by `runBnhubGuestExperienceEngine` (6–12h after checkout, gated).
 * Kept for compatibility if imported elsewhere; does not send immediately.
 */
export async function deliverBnhubReviewRequest(_payload: {
  bookingId: string;
  guestId: string;
  listingId: string;
}): Promise<void> {
  /* no-op: see lib/bnhub/guest-experience/engine.ts */
}
