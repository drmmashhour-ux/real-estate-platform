/**
 * Duplicate prevention: only one active listing per property per listing type (unless policy allows).
 */

import { prisma } from "@/lib/db";
import type { DuplicateOutcome, ListingType } from "./constants";

/**
 * Check whether linking this listing to this property identity is allowed, blocked, or requires manual review.
 * - If propertyIdentityId is null (new identity), outcome is "allowed".
 * - If property already has an active link for the same listingType and a different listingId => blocked or manual_review_required.
 * - If same listingId already linked => treat as allowed (idempotent link).
 */
export async function checkDuplicateOutcome(
  propertyIdentityId: string | null,
  listingId: string,
  listingType: ListingType,
  _linkedByUserId: string
): Promise<DuplicateOutcome> {
  if (!propertyIdentityId) return "allowed";

  const existingLinks = await prisma.propertyIdentityLink.findMany({
    where: {
      propertyIdentityId,
      listingType,
      linkStatus: "active",
    },
    select: { listingId: true },
  });

  const sameListing = existingLinks.some((l) => l.listingId === listingId);
  if (sameListing) return "allowed";

  if (existingLinks.length >= 1) {
    // Policy: one active listing per property per type. Second attempt => manual review.
    return "manual_review_required";
  }

  return "allowed";
}

/**
 * Get duplicate check result for admin: list active links for this property + type.
 */
export async function getActiveLinksForPropertyAndType(
  propertyIdentityId: string,
  listingType: ListingType
): Promise<{ listingId: string; linkStatus: string }[]> {
  return prisma.propertyIdentityLink.findMany({
    where: { propertyIdentityId, listingType },
    select: { listingId: true, linkStatus: true },
    orderBy: { createdAt: "desc" },
  });
}
