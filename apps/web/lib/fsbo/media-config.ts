/**
 * FSBO listing media — v1: `FsboListing.images` (URLs) + optional `coverImage`.
 *
 * Future (do not implement in v1 — keep API clean):
 * - Videos: add storage prefix `fsbo/{listingId}/videos/` + MIME allowlist, or a `FsboListingMedia` row { kind: "VIDEO", url, sortOrder }.
 * - Documents (PDF): `.../documents/` + virus scan hook before marking public.
 * - Floor plans: same as images with `kind: "FLOOR_PLAN"` or dedicated `floorPlanUrls String[]`.
 *
 * The upload route and `ImageUploader` only handle raster images today; extend with parallel endpoints later.
 */

// Platform-level hard cap; plan-based limits are enforced separately in upload/publish gates.
export const FSBO_MAX_LISTING_IMAGES = 50;

/** Per-file limit for photo uploads */
export const FSBO_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const FSBO_ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const FSBO_IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Logical storage path segment inside bucket or under public/uploads */
export const FSBO_STORAGE_FOLDER_SEGMENT = "fsbo";

/**
 * Derive cover from gallery. Later: respect explicit `coverImage` if present in payload and still in `images`.
 */
export function deriveFsboCoverImage(images: string[]): string | null {
  return images[0] ?? null;
}
