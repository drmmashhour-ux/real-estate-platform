import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { engineFlags } from "@/config/feature-flags";

export type FeaturedListingKind = "fsbo" | "bnhub";

/**
 * Admin / internal: grant a featured window. FSBO updates `featuredUntil` for ranking blend;
 * BNHub records audit only until listing-level featured window is unified with `BnhubPromotionOrder`.
 */
export async function activateFeaturedPlacement(input: {
  listingKind: FeaturedListingKind;
  listingId: string;
  durationDays: number;
  priority?: number;
  source: string;
  activatedByUserId: string | null;
}): Promise<
  | { ok: true; endAt: string; mode: "fsbo" | "bnhub_audit" }
  | { ok: false; error: string }
> {
  if (!engineFlags.featuredListingsV1) {
    return { ok: false, error: "FEATURE_FEATURED_LISTINGS_V1 disabled" };
  }
  const days = Math.min(365, Math.max(1, Math.floor(input.durationDays)));
  const startAt = new Date();
  const endAt = new Date(startAt.getTime() + days * 86400000);
  const priority = input.priority ?? 0;

  if (input.listingKind === "fsbo") {
    const row = await prisma.fsboListing.findUnique({
      where: { id: input.listingId },
      select: { id: true, ownerId: true, status: true, moderationStatus: true },
    });
    if (!row) return { ok: false, error: "Listing not found" };
    if (row.status !== "ACTIVE" || row.moderationStatus !== "APPROVED") {
      return { ok: false, error: "Listing must be active and approved" };
    }

    await prisma.$transaction([
      prisma.featuredListing.updateMany({
        where: {
          listingKind: "fsbo",
          listingId: input.listingId,
          status: "active",
          endAt: { gt: new Date() },
        },
        data: { status: "expired" },
      }),
      prisma.fsboListing.update({
        where: { id: input.listingId },
        data: { featuredUntil: endAt },
      }),
      prisma.featuredListing.create({
        data: {
          listingKind: "fsbo",
          listingId: input.listingId,
          ownerUserId: row.ownerId,
          startAt,
          endAt,
          priority,
          status: "active",
          source: input.source,
          activatedById: input.activatedByUserId,
        },
      }),
    ]);

    return { ok: true, endAt: endAt.toISOString(), mode: "fsbo" };
  }

  const st = await prisma.shortTermListing.findUnique({
    where: { id: input.listingId },
    select: { id: true, listingStatus: true },
  });
  if (!st) return { ok: false, error: "Listing not found" };
  if (st.listingStatus !== ListingStatus.PUBLISHED && st.listingStatus !== ListingStatus.APPROVED) {
    return { ok: false, error: "BNHub listing must be published or approved" };
  }

  await prisma.featuredListing.create({
    data: {
      listingKind: "bnhub",
      listingId: input.listingId,
      startAt,
      endAt,
      priority,
      status: "active",
      source: input.source,
      activatedById: input.activatedByUserId,
    },
  });

  return { ok: true, endAt: endAt.toISOString(), mode: "bnhub_audit" };
}
