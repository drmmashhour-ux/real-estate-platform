import { getGuestId } from "@/lib/auth/session";
import { HostCalendarPage } from "@/components/host/HostCalendarPage";
import { getHostCalendarEvents } from "@/lib/host";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

type SearchParams = { listing?: string };

export default async function HostCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const hostId = await getGuestId();
  if (!hostId) return null;

  const sp = await searchParams;
  const listingId = typeof sp.listing === "string" ? sp.listing : undefined;

  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 3, 0, 23, 59, 59, 999));

  const [listings, { bookings, blocked, channelEvents }] = await Promise.all([
    prisma.shortTermListing.findMany({
      where: { ownerId: hostId },
      orderBy: { title: "asc" },
      select: { id: true, title: true, calendarColor: true },
    }),
    getHostCalendarEvents(hostId, { listingId, from, to }),
  ]);

  const bookingsSerialized = bookings.map((b) => ({
    ...b,
    start: b.start.toISOString(),
    end: b.end.toISOString(),
  }));

  const channelSerialized = channelEvents.map((c) => ({
    ...c,
    start: c.start.toISOString(),
    endExclusive: c.endExclusive.toISOString(),
  }));

  return (
    <HostCalendarPage
      listings={listings}
      bookings={bookingsSerialized}
      blocked={blocked}
      channelEvents={channelSerialized}
      initialListingId={listingId}
    />
  );
}
