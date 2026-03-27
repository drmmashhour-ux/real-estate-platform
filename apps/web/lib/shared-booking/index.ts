import { prisma } from "@/lib/db";

export async function getSharedBookings() {
  return prisma.sharedBooking.findMany({
    orderBy: { listingId: "asc" },
  });
}

export async function getSharedBookingById(id: string) {
  return prisma.sharedBooking.findUnique({
    where: { id },
  });
}

export async function bookSpot(id: string) {
  const row = await prisma.sharedBooking.findUnique({ where: { id } });
  if (!row) return null;
  if (row.bookedSpots >= row.totalSpots) return null;
  return prisma.sharedBooking.update({
    where: { id },
    data: { bookedSpots: row.bookedSpots + 1 },
  });
}
