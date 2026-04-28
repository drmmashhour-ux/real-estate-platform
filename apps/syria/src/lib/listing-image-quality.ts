/**
 * ORDER SYBNB-129 — bounded JPEG/WebP quality for listing thumbnails & hero (slow DSL / mobile).
 * Set `NEXT_PUBLIC_LISTING_IMAGE_QUALITY` (client-visible) or `LISTING_IMAGE_QUALITY` at build time (default 45).
 */
function parseListingImageQuality(raw: string | undefined): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return 45;
  return Math.min(100, Math.max(20, n));
}

/** Server + client: reads `NEXT_PUBLIC_*` first so browse cards get consistent quality after hydration. */
export const LISTING_IMAGE_QUALITY = parseListingImageQuality(
  typeof process !== "undefined" ?
    process.env.NEXT_PUBLIC_LISTING_IMAGE_QUALITY ?? process.env.LISTING_IMAGE_QUALITY
  : undefined,
);
