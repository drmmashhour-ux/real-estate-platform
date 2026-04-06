import { prisma } from "@/lib/db";

/** Returns booking id if the host owns the listing for this booking. */
export async function getHostBookingIfOwned(hostId: string, bookingId: string) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      listing: { ownerId: hostId },
    },
    select: { id: true },
  });
}

export async function getHostListingIds(hostId: string): Promise<string[]> {
  const rows = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
