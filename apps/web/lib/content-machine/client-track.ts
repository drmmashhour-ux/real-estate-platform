const SESSION_ATTR_KEY = (listingId: string) => `lecipm_cp_listing_${listingId}`;

/**
 * Remember which `MachineGeneratedContent` id brought the guest (from `?cc=` view), so a later paid booking can attribute **conversion**.
 */
export function rememberContentAttribution(listingId: string, contentId: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_ATTR_KEY(listingId), contentId);
  } catch {
    /* ignore */
  }
}

/** Read and remove stored content id for this listing (call once when recording conversion). */
export function consumeContentAttribution(listingId: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const k = SESSION_ATTR_KEY(listingId);
    const v = sessionStorage.getItem(k);
    if (v) sessionStorage.removeItem(k);
    return v;
  } catch {
    return null;
  }
}

/**
 * Client-side fire-and-forget for attributed listing traffic (`?cc=` content piece id).
 * Use `dedupeSession` for clicks so repeated taps don’t inflate counts.
 */
export function fireContentPerformanceEvent(
  contentId: string,
  listingId: string,
  event: "view" | "click" | "conversion",
  opts?: { dedupeSession?: boolean }
): void {
  if (event === "view" || event === "click") {
    rememberContentAttribution(listingId, contentId);
  }
  if (opts?.dedupeSession && typeof sessionStorage !== "undefined") {
    const key = `lecipm_cp_${event}_${contentId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  }
  void fetch("/api/content-machine/performance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId, listingId, event }),
    keepalive: true,
  }).catch(() => {});
}
