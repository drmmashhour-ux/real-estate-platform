const debouncers = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleListingQualityRecompute(listingId: string, delayMs = 3500): void {
  const existing = debouncers.get(listingId);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    debouncers.delete(listingId);
    void import("@/lib/quality/update-listing-quality")
      .then((m) => m.updateListingQuality(listingId))
      .catch((err) => {
        console.warn("[listing-quality] recompute failed", listingId, err);
      });
  }, delayMs);
  debouncers.set(listingId, t);
}
