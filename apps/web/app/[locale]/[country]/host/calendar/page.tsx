import Link from "next/link";
import { getGuestId } from "@/lib/auth/session";
import { HostCalendarClient } from "@/components/host/HostCalendarClient";
import { getHostCalendarEvents } from "@/lib/host";
import { prisma } from "@/lib/db";

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
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Unified view: BNHub bookings, ICS imports, channel manager feeds, and manual blocks.
          </p>
        </div>
        <Link href="/host/bookings" className="text-sm text-zinc-400 hover:text-zinc-200">
          View all bookings →
        </Link>
      </div>

      <HostCalendarClient
        listings={listings}
        bookings={bookingsSerialized}
        blocked={blocked}
        channelEvents={channelSerialized}
        initialListingId={listingId}
      />
    </div>
  );
}
