export const META_PIXEL_ID =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "" : "";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Dedupe rapid duplicate ViewContent for the same listing (e.g. beacon + track both firing). */
const viewContentLast = new Map<string, number>();
const VIEW_CONTENT_DEBOUNCE_MS = 4000;

function pickListingId(meta?: Record<string, unknown> | null): string | null {
  if (!meta || typeof meta !== "object") return null;
  const raw =
    (meta.listing_id as string | undefined) ??
    (meta.listingId as string | undefined) ??
    (meta.fsboListingId as string | undefined);
  if (typeof raw === "string" && raw.trim()) return raw.trim().slice(0, 96);
  return null;
}

function pickNumericCad(meta?: Record<string, unknown> | null): number | undefined {
  if (!meta) return undefined;
  const v =
    typeof meta.value === "number"
      ? meta.value
      : typeof meta.total_cents === "number"
        ? meta.total_cents / 100
        : typeof meta.amountCents === "number"
          ? meta.amountCents / 100
          : typeof meta.value_cents === "number"
            ? meta.value_cents / 100
            : undefined;
  if (v == null || !Number.isFinite(v) || v < 0) return undefined;
  return v;
}

/** Custom events — generic funnel instrumentation */
export function fbqReportEvent(eventName: string, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("trackCustom", eventName, payload ?? {});
  } catch {
    /* ignore */
  }
}

export function fbqPageView(): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", "PageView");
  } catch {
    /* ignore */
  }
}

/**
 * Standard event — primary booking CTA clicked (Reserve) before API call.
 * Pairs with ViewContent → InitiateCheckout for funnel audiences.
 */
export function metaPixelTrackAddToCart(meta?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  const listingId = pickListingId(meta);
  try {
    const payload: Record<string, unknown> = {
      content_type: "product",
      content_name: "BNHUB booking intent",
    };
    if (listingId) payload.content_ids = [listingId];
    window.fbq("track", "AddToCart", payload);
  } catch {
    /* ignore */
  }
}

/**
 * Standard event — listing detail views (retargeting + dynamic ads seed).
 * @see https://developers.facebook.com/docs/meta-pixel/reference
 */
export function metaPixelTrackViewContent(meta?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  const listingId = pickListingId(meta);
  const dedupeKey = listingId ?? "_noid";
  const now = Date.now();
  const prev = viewContentLast.get(dedupeKey) ?? 0;
  if (now - prev < VIEW_CONTENT_DEBOUNCE_MS) return;
  viewContentLast.set(dedupeKey, now);
  try {
    const payload: Record<string, unknown> = {
      content_type: "product",
      content_name: "Listing",
    };
    if (listingId) payload.content_ids = [listingId];
    window.fbq("track", "ViewContent", payload);
  } catch {
    /* ignore */
  }
}

/** Standard event — guest started booking / checkout (InitiateCheckout). */
export function metaPixelTrackInitiateCheckout(meta?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    const listingId = pickListingId(meta);
    const value = pickNumericCad(meta);
    const payload: Record<string, unknown> = {
      content_type: "product",
      currency: "CAD",
    };
    if (listingId) payload.content_ids = [listingId];
    if (value != null) payload.value = value;
    window.fbq("track", "InitiateCheckout", payload);
  } catch {
    /* ignore */
  }
}

/**
 * Standard event — completed paid booking (audience exclusion for “visited but no booking”).
 * Only fires when `payment_confirmed` is true so pending holds stay retargetable.
 */
export function metaPixelTrackPurchase(meta?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (meta?.payment_confirmed !== true) return;
  try {
    const listingId = pickListingId(meta);
    const value = pickNumericCad(meta);
    const payload: Record<string, unknown> = { currency: "CAD" };
    if (listingId) {
      payload.content_type = "product";
      payload.content_ids = [listingId];
    }
    if (value != null && value > 0) payload.value = value;
    window.fbq("track", "Purchase", payload);
  } catch {
    /* ignore */
  }
}
