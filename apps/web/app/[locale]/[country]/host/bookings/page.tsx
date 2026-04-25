import { getGuestId } from "@/lib/auth/session";
import { HostBookingsPage } from "@/components/host/HostBookingsPage";
import { getHostBookings } from "@/lib/host/bookings-data";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export default async function HostBookingsRoute() {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const [bookings, listings] = await Promise.all([
    getHostBookings(hostId, { tab: "all" }),
    prisma.shortTermListing.findMany({
      where: { ownerId: hostId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return <HostBookingsPage bookings={bookings} listings={listings} />;
}
