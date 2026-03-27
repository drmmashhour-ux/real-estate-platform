import { prisma } from "@/lib/db";
import { getFsboListingTrustSummary } from "@/lib/fsbo/listing-trust-summary";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";

export async function runImproveListingForOwner(args: { listingId: string; ownerId: string }) {
  const listing = await prisma.fsboListing.findFirst({
    where: { id: args.listingId, ownerId: args.ownerId },
    select: {
      id: true,
      title: true,
      city: true,
      trustScore: true,
      status: true,
      moderationStatus: true,
      images: true,
      coverImage: true,
    },
  });
  if (!listing) return { ok: false as const, error: "Listing not found" };

  const issues: string[] = [];
  const imgs = Array.isArray(listing.images) ? listing.images.length : 0;
  if (imgs < 3) issues.push("Add more photos — buyers rely on visual proof.");
  if (!listing.coverImage) issues.push("Set a clear cover image.");
  if (listing.trustScore != null && listing.trustScore < 55) {
    issues.push("Raise trust score via verification and complete documents.");
  }
  if (listing.moderationStatus !== "APPROVED") {
    issues.push(`Moderation status: ${listing.moderationStatus.replace(/_/g, " ")}.`);
  }

  if (isTrustGraphEnabled()) {
    const tg = await getFsboListingTrustSummary(listing.id);
    for (const m of tg?.missingItems?.slice(0, 10) ?? []) {
      issues.push(m.message);
    }
  }

  return {
    ok: true as const,
    listing,
    issues: [...new Set(issues)],
  };
}
