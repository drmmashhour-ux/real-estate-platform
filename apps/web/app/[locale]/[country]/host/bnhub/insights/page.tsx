import { redirect } from "next/navigation";
import { BnhubHostInsightsClient } from "@/components/bnhub/host/BnhubHostInsightsClient";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";

export default async function BnhubHostInsightsPage({ params }: { params: Promise<{ locale: string; country: string }> }) {
  const { locale, country } = await params;
  const userId = await getGuestId();
  if (!userId) {
    redirect(`/${locale}/${country}/auth/login?next=/${locale}/${country}/host/bnhub/insights`);
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

  const basePath = `/${locale}/${country}`;

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <BnhubHostInsightsClient listings={listings} basePath={basePath} />
    </div>
  );
}
