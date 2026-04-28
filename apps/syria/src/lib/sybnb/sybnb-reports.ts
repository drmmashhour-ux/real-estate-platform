import { prisma } from "@/lib/db";
import { sybnbConfig } from "@/config/sybnb.config";

/**
 * Unreviewed SYBNB `ListingReport` rows for a listing; used to block new bookings past the threshold.
 */
export async function countUnreviewedSybnbReportsForProperty(propertyId: string): Promise<number> {
  return prisma.listingReport.count({
    where: { listingId: propertyId, reviewed: false },
  });
}

export function sybnbOpenReportsBlockNewBookings(count: number): boolean {
  return count >= sybnbConfig.maxUnreviewedReportsBlockBookings;
}
