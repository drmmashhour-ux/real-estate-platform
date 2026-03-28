import { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { LECIPM_EXCLUSIVE_TAG } from "./constants";

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

/**
 * Mark a published stay as LECIPM exclusive (supply control / merchandising).
 */
export async function tagListingExclusive(listingId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, experienceTags: true, listingStatus: true },
  });
  if (!listing) return { ok: false, error: "Listing not found" };
  if (listing.listingStatus !== ListingStatus.PUBLISHED) {
    return { ok: false, error: "Only published stays can be tagged exclusive" };
  }
  const tags = new Set(asStringArray(listing.experienceTags));
  tags.add(LECIPM_EXCLUSIVE_TAG);
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { experienceTags: [...tags] as unknown as object },
  });
  return { ok: true };
}

export async function clearListingExclusiveTag(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { experienceTags: true },
  });
  if (!listing) return;
  const tags = asStringArray(listing.experienceTags).filter((t) => t !== LECIPM_EXCLUSIVE_TAG);
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { experienceTags: tags as Prisma.InputJsonValue },
  });
}

export function listingHasExclusiveTag(experienceTags: unknown): boolean {
  return asStringArray(experienceTags).includes(LECIPM_EXCLUSIVE_TAG);
}

export async function countExclusivePublishedStays(): Promise<number> {
  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    select: { experienceTags: true },
  });
  return rows.filter((r) => listingHasExclusiveTag(r.experienceTags)).length;
}
