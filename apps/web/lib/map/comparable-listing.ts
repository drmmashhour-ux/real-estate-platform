import { FSBO_MODERATION, FSBO_STATUS, isFsboPubliclyVisible } from "@/lib/fsbo/constants";

/** FSBO rows safe to expose as market comparables (active listings + closed sales). */
export function isComparableListingVisible(listing: {
  status: string;
  moderationStatus: string;
  expiresAt?: Date | string | null;
  archivedAt?: Date | null;
}): boolean {
  if (listing.moderationStatus !== FSBO_MODERATION.APPROVED || listing.archivedAt) {
    return false;
  }
  if (listing.status === FSBO_STATUS.SOLD) {
    return true;
  }
  if (listing.status === FSBO_STATUS.ACTIVE) {
    return isFsboPubliclyVisible(listing);
  }
  return false;
}
