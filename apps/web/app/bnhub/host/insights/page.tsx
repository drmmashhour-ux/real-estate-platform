import { redirect } from "next/navigation";
import { BnhubHostInsightsClient } from "@/components/bnhub/host/BnhubHostInsightsClient";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";

/**
 * Non-localized bookmark URL for host insights (pricing, occupancy, listing quality, autopilot copy).
 * Authenticated hosts only; aligns with `/en/ca/host/bnhub/insights`.
 */
export default async function BnhubHostInsightsPage() {
  const userId = await getGuestId();
  if (!userId) {
    redirect("/en/ca/auth/login?next=/bnhub/host/insights");
  }

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: userId, listingStatus: ListingStatus.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    take: 12,
    select: {
      id: true,
      listingCode: true,
      title: true,
      nightPriceCents: true,
      description: true,
      photos: true,
      amenities: true,
      bnhubListingCompletedStays: true,
      bnhubListingReviewCount: true,
      bnhubListingRatingAverage: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <BnhubHostInsightsClient listings={listings} basePath="/en/ca" />
    </div>
  );
}
