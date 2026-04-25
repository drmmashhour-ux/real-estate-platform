import Link from "next/link";
import { HostCalendarClient } from "./HostCalendarClient";
import type {
  HostCalendarBlockedEvent,
  HostCalendarBookingEventSerialized,
  HostChannelCalendarEventSerialized,
} from "@/lib/host/calendar-data";

/**
 * Host calendar: monthly view, bookings, blocks, channel feeds; date click to block; booking detail modal.
 */
export function HostCalendarPage({
  listings,
  bookings,
  blocked,
  channelEvents,
  initialListingId,
}: {
  listings: { id: string; title: string; calendarColor?: string | null }[];
  bookings: HostCalendarBookingEventSerialized[];
  blocked: HostCalendarBlockedEvent[];
  channelEvents: HostChannelCalendarEventSerialized[];
  initialListingId?: string;
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Month view: BNHub stays, manual blocks, ICS imports, and channel manager. Pick a listing, click a day to
            block, click a stay for details.
          </p>
        </div>
        <Link href="/host/bookings" className="text-sm text-zinc-400 hover:text-zinc-200">
          All bookings →
        </Link>
      </div>

      <HostCalendarClient
        listings={listings}
        bookings={bookings}
        blocked={blocked}
        channelEvents={channelEvents}
        initialListingId={initialListingId}
      />
    </div>
  );
}
