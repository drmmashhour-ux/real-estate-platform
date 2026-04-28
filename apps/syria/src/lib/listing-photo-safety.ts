/** ORDER SYBNB-66 — identical payloads after trim = duplicate uploads / abuse signal. */
export function hasDuplicateListingImages(images: string[]): boolean {
  const trimmed = images.map((s) => s.trim()).filter(Boolean);
  if (trimmed.length <= 1) return false;
  return new Set(trimmed).size !== trimmed.length;
}

/** Queue listing for moderation when automated checks fire (duplicates today). Future: irrelevant / AI flags. */
export function listingPhotoSafetyNeedsReview(images: string[]): boolean {
  return hasDuplicateListingImages(images);
}
