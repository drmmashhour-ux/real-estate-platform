"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BnhubChannelPlatform } from "@prisma/client";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import BnCalendar, { type BnCalendarEventInput } from "@/components/calendar/BnCalendar";
import type {
  HostCalendarBlockedEvent,
  HostCalendarBookingEventSerialized,
  HostChannelCalendarEventSerialized,
} from "@/lib/host/calendar-data";

const GOLD = "#D4AF37";

type Props = {
  listings: { id: string; title: string; calendarColor?: string | null }[];
  bookings: HostCalendarBookingEventSerialized[];
  blocked: HostCalendarBlockedEvent[];
  channelEvents: HostChannelCalendarEventSerialized[];
  initialListingId?: string;
};

function bookingBadge(status: string, paymentStatus: string | null): string {
  const st = status.toUpperCase();
  if (st.includes("CANCEL") || st === "DECLINED") return "Canceled";
  if (st === "PENDING") return "Pending payment";
  if (paymentStatus === "PENDING") return "Pending payment";
  if (st === "AWAITING_HOST_APPROVAL") return "Awaiting approval";
  if (st === "CONFIRMED" && paymentStatus === "COMPLETED") return "Confirmed";
  if (st === "CONFIRMED") return "Confirmed";
  return status;
}

function bookingBarColors(b: HostCalendarBookingEventSerialized): { bg: string; border: string } {
  const base = b.listingColor?.trim() || GOLD;
  if (b.status.includes("CANCEL") || b.status === "DECLINED") {
    return { bg: "#991b1b", border: "#7f1d1d" };
  }
  if (b.status === "CONFIRMED" && b.paymentStatus === "COMPLETED") {
    return { bg: base, border: base };
  }
  if (b.status === "PENDING" || b.paymentStatus === "PENDING" || b.status === "AWAITING_HOST_APPROVAL") {
    return { bg: "#b45309", border: "#92400e" };
  }
  return { bg: base, border: base };
}

function externalIcsColors(sourceName: string | null | undefined): { bg: string; border: string } {
  const s = (sourceName ?? "").toLowerCase();
  if (s.includes("airbnb")) return { bg: "#FF5A5F", border: "#e11d48" };
  if (s.includes("booking")) return { bg: "#003580", border: "#001a4d" };
  if (s.includes("vrbo")) return { bg: "#7c3aed", border: "#5b21b6" };
  return { bg: "#6B7280", border: "#57534e" };
}

function channelPlatformColors(platform: BnhubChannelPlatform): { bg: string; border: string } {
  switch (platform) {
    case "AIRBNB":
      return { bg: "#FF5A5F", border: "#dc2626" };
    case "BOOKING_COM":
      return { bg: "#003580", border: "#0c4a6e" };
    case "VRBO":
      return { bg: "#a855f7", border: "#7e22ce" };
    case "EXPEDIA":
      return { bg: "#0ea5e9", border: "#0369a1" };
    default:
      return { bg: "#64748b", border: "#475569" };
  }
}

function addOneCalendarDayUtc(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

export function HostCalendarClient({
  listings,
  bookings,
  blocked,
  channelEvents,
  initialListingId,
}: Props) {
  const router = useRouter();
  const [listingFilter, setListingFilter] = useState(initialListingId ?? "");
  const [detail, setDetail] = useState<HostCalendarBookingEventSerialized | null>(null);

  const filteredBookings = useMemo(
    () => (listingFilter ? bookings.filter((b) => b.listingId === listingFilter) : bookings),
    [bookings, listingFilter]
  );
  const filteredBlocked = useMemo(
    () => (listingFilter ? blocked.filter((b) => b.listingId === listingFilter) : blocked),
    [blocked, listingFilter]
  );
  const filteredChannel = useMemo(
    () =>
      listingFilter ? channelEvents.filter((c) => c.listingId === listingFilter) : channelEvents,
    [channelEvents, listingFilter]
  );

  const fcEvents: BnCalendarEventInput[] = useMemo(() => {
    const bookEvents: BnCalendarEventInput[] = filteredBookings.map((b) => {
      const { bg, border } = bookingBarColors(b);
      const badge = bookingBadge(b.status, b.paymentStatus);
      return {
        id: b.id,
        title: `${b.listingTitle} · ${b.title} (${badge})`,
        start: b.start,
        end: b.end,
        kind: "booking",
        backgroundColor: bg,
        borderColor: border,
        editable: true,
        extendedProps: {
          eventType: "booking",
          type: "booking",
          listingId: b.listingId,
        },
      };
    });

    const blockedEvents: BnCalendarEventInput[] = filteredBlocked.map((s) => {
      const fromSlot = Boolean(s.fromAvailabilitySlot);
      const colors = fromSlot
        ? { bg: "#3f3f46", border: "#52525b" }
        : externalIcsColors(s.icsSourceName);
      const label = fromSlot ? "Blocked (calendar)" : `External ICS · ${s.icsSourceName ?? "OTA"}`;
      return {
        id: fromSlot ? `blocked-slot-${s.listingId}-${s.date}` : `blocked-ics-${s.listingId}-${s.date}`,
        title: `${s.listingTitle} — ${label}`,
        start: s.date,
        end: addOneCalendarDayUtc(s.date),
        kind: "blocked",
        allDay: true,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        editable: false,
        display: "background",
        extendedProps: {
          eventType: fromSlot ? "blocked_slot" : "external_ics",
          type: fromSlot ? "blocked_slot" : "external",
          listingId: s.listingId,
          sourceName: s.icsSourceName ?? null,
        },
      };
    });

    const channelFc: BnCalendarEventInput[] = filteredChannel.map((c) => {
      const { bg, border } = channelPlatformColors(c.platform);
      return {
        id: `channel-${c.id}`,
        title: `${c.listingTitle} · ${c.summary}`,
        start: c.start,
        end: c.endExclusive,
        kind: "blocked",
        allDay: true,
        backgroundColor: bg,
        borderColor: border,
        editable: false,
        display: "background",
        extendedProps: {
          eventType: "channel",
          listingId: c.listingId,
          platform: c.platform,
        },
      };
    });

    return [...bookEvents, ...blockedEvents, ...channelFc];
  }, [filteredBlocked, filteredBookings, filteredChannel]);

  const handleDateClick = async (dateStr: string) => {
    const listingId = listingFilter.trim();
    if (!listingId) {
      window.alert("Pick a listing in the dropdown to block a night (not “All listings”).");
      return;
    }

    const res = await fetch("/api/host/calendar/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, date: dateStr }),
    });

    if (res.ok) {
      router.refresh();
      return;
    }
    if (res.status === 409) {
      window.alert("That night is already booked or blocked.");
      return;
    }
    window.alert("Could not block that date.");
  };

  const handleEventClick = (info: EventClickArg) => {
    const type = info.event.extendedProps.eventType as string | undefined;
    const id = info.event.id;

    if (type === "booking") {
      const b = bookings.find((x) => x.id === id);
      if (b) setDetail(b);
      return;
    }
    if (type === "external_ics") {
      window.alert(`External ICS block\n${info.event.title}`);
      return;
    }
    if (type === "channel") {
      window.alert(`Channel manager (imported calendar)\n${info.event.title}`);
      return;
    }
    if (type === "blocked_slot") {
      window.alert("Blocked on BNHub calendar (manual or availability rule).");
    }
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const bookingId = info.event.id;
    const newStart = info.event.start;
    const newEnd = info.event.end;
    if (!newStart || !newEnd) {
      info.revert();
      return;
    }

    const res = await fetch(`/api/host/calendar/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn: newStart.toISOString(),
        checkOut: newEnd.toISOString(),
      }),
    });

    if (!res.ok) {
      info.revert();
      if (res.status === 409) window.alert("Those dates conflict with another booking.");
      else window.alert("Could not move this booking.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sources</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: GOLD }} />
            <span>BNHub booking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-gray-500" />
            <span>External block (ICS / other)</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 border-t border-zinc-800 pt-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#FF5A5F]" />
            <span>Airbnb-style ICS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#003580]" />
            <span>Booking.com-style ICS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#7c3aed]" />
            <span>Vrbo-style ICS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-zinc-600" />
            <span>Manual / slot block</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-purple-500" />
            <span>Channel manager feed</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={listingFilter}
          onChange={(e) => setListingFilter(e.target.value)}
          className="mb-0 rounded-xl border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
        >
          <option value="">All listings</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title.slice(0, 40)}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          Mobile: week view · Desktop: month. Pick a listing, click a free day to block. Drag bookings to reschedule.
        </p>
      </div>

      <div className="fc-dark HostCalendar-root rounded-xl border border-zinc-800 bg-zinc-950/40 p-2 [&_.fc]:text-zinc-100 [&_.fc-button]:border-zinc-600 [&_.fc-button]:bg-zinc-900 [&_.fc-col-header-cell]:border-zinc-800 [&_.fc-daygrid-day]:border-zinc-800 [&_.fc-bg-event]:opacity-40">
        <BnCalendar
          events={fcEvents}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onEventDrop={handleEventDrop}
        />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GOLD }} /> Confirmed / listing color
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-600" /> Pending / approval
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-700" /> Canceled
        </span>
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111] p-5 shadow-xl">
            <p className="text-sm font-semibold text-white">{detail.title}</p>
            <p className="mt-1 text-xs text-zinc-500">{detail.listingTitle}</p>
            <p className="mt-3 text-sm text-zinc-300">
              {detail.start.slice(0, 10)} → {detail.end.slice(0, 10)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {detail.status} · {detail.paymentStatus ?? "—"}
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href={`/host/bookings/${detail.id}`}
                className="flex-1 rounded-xl py-2 text-center text-sm font-semibold text-black"
                style={{ backgroundColor: GOLD }}
              >
                Open booking
              </a>
              <button
                type="button"
                className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-300"
                onClick={() => setDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
