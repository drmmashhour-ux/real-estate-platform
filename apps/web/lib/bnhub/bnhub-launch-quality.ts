/** BNHub launch / quick listing — minimum quality bar for first bookings. */

export const BNHUB_LAUNCH_MIN_PHOTOS = 3;
export const BNHUB_LAUNCH_MIN_DESCRIPTION = 120;
export const BNHUB_LAUNCH_MIN_AMENITIES = 3;

export const BNHUB_LAUNCH_TAG_NEW = "bnhub:new_listing";
export const BNHUB_LAUNCH_TAG_SPECIAL = "bnhub:special_offer";

export type LaunchQualityResult = { ok: true } | { ok: false; errors: string[] };

export function validateBnhubLaunchListingQuality(input: {
  description: string;
  photos: string[];
  amenities: string[];
}): LaunchQualityResult {
  const errors: string[] = [];
  const desc = input.description?.trim() ?? "";
  if (desc.length < BNHUB_LAUNCH_MIN_DESCRIPTION) {
    errors.push(`Description must be at least ${BNHUB_LAUNCH_MIN_DESCRIPTION} characters (clear, specific copy helps first bookings).`);
  }
  if (input.photos.length < BNHUB_LAUNCH_MIN_PHOTOS) {
    errors.push(`Add at least ${BNHUB_LAUNCH_MIN_PHOTOS} photo URLs (wide living area, bedroom, kitchen or bath).`);
  }
  if (input.amenities.length < BNHUB_LAUNCH_MIN_AMENITIES) {
    errors.push(`Add at least ${BNHUB_LAUNCH_MIN_AMENITIES} amenities (e.g. Wi‑Fi, kitchen, heating).`);
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

export function parsePhotoUrls(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http://") || s.startsWith("https://"));
}

export function parseAmenitiesList(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}

export function launchTagsFromFlags(flags: { newListing?: boolean; specialOffer?: boolean }): string[] {
  const tags: string[] = [];
  if (flags.newListing) tags.push(BNHUB_LAUNCH_TAG_NEW);
  if (flags.specialOffer) tags.push(BNHUB_LAUNCH_TAG_SPECIAL);
  return tags;
}

export function mergeExperienceTags(existing: unknown, add: string[]): string[] {
  const base = Array.isArray(existing) ? existing.filter((x): x is string => typeof x === "string") : [];
  return [...new Set([...base, ...add])];
}

export function bnhubLaunchBadgesFromTags(tags: unknown): { newListing: boolean; specialOffer: boolean } {
  const arr = Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];
  return {
    newListing: arr.includes(BNHUB_LAUNCH_TAG_NEW),
    specialOffer: arr.includes(BNHUB_LAUNCH_TAG_SPECIAL),
  };
}
