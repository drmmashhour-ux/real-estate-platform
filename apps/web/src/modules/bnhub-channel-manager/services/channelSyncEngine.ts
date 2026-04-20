/**
 * Channel sync orchestration: cron-driven iCal pull, export helpers, conflict hints.
 */
import {
  BookingStatus,
  BnhubChannelConnectionStatus,
  BnhubChannelConnectionType,
  BnhubDayAvailabilityStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { eachNightBetween, utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import { buildICalDocument } from "@/lib/bnhub/ical-utils";
import { importICal } from "./icalSyncService";
import { appendOtaSyncLog } from "./otaSyncLogService";

export async function syncConnection(connectionId: string): Promise<{ ok: boolean; message: string }> {
  const conn = await prisma.bnhubChannelConnection.findUnique({
    where: { id: connectionId },
    include: { mappings: { take: 1 } },
  });
  if (!conn) return { ok: false, message: "Connection not found" };
  if (conn.status === BnhubChannelConnectionStatus.PAUSED) {
    return { ok: false, message: "Connection paused" };
  }
  const mapping = conn.mappings[0];
  if (!mapping) {
    await prisma.bnhubChannelConnection.update({
      where: { id: connectionId },
      data: { status: BnhubChannelConnectionStatus.ERROR, lastError: "No listing mapping" },
    });
    return { ok: false, message: "No listing mapping" };
  }

  if (conn.connectionType !== BnhubChannelConnectionType.ICAL || !conn.icalImportUrl) {
    await prisma.bnhubChannelConnection.update({
      where: { id: connectionId },
      data: { lastSyncAt: new Date(), lastError: null },
    });
    await appendOtaSyncLog({
      connectionId,
      listingId: mapping.listingId,
      syncType: "IMPORT",
      status: "SUCCESS",
      message: "Skipped (no iCal import URL)",
    });
    return { ok: true, message: "No iCal URL" };
  }

  const result = await importICal({
    url: conn.icalImportUrl,
    listingId: mapping.listingId,
    connectionId: conn.id,
    platform: conn.platform,
  });

  if (result.ok) {
    await prisma.bnhubChannelConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        lastError: null,
        status: BnhubChannelConnectionStatus.ACTIVE,
      },
    });
    void import("@/modules/channel-manager/channel-sync.service")
      .then((m) => m.syncAvailability(mapping.listingId))
      .catch(() => {});
    return { ok: true, message: `Imported ${result.eventsImported} events` };
  }

  await prisma.bnhubChannelConnection.update({
    where: { id: connectionId },
    data: {
      lastSyncAt: new Date(),
      lastError: result.error,
      status: BnhubChannelConnectionStatus.ERROR,
    },
  });
  await appendOtaSyncLog({
    connectionId,
    listingId: mapping.listingId,
    syncType: "IMPORT",
    status: "FAILED",
    message: result.error,
  });
  return { ok: false, message: result.error };
}

export async function syncAllConnections(): Promise<{ processed: number; errors: number }> {
  const now = Date.now();
  const connections = await prisma.bnhubChannelConnection.findMany({
    where: {
      status: BnhubChannelConnectionStatus.ACTIVE,
      connectionType: BnhubChannelConnectionType.ICAL,
      icalImportUrl: { not: null },
    },
    include: { mappings: { take: 1 } },
  });

  let processed = 0;
  let errors = 0;

  for (const c of connections) {
    const freq = Math.max(5, c.syncFrequencyMinutes);
    const last = c.lastSyncAt?.getTime() ?? 0;
    if (now - last < freq * 60_000) continue;
    processed += 1;
    const r = await syncConnection(c.id);
    if (!r.ok) errors += 1;
  }

  return { processed, errors };
}

export async function importExternalCalendar(connectionId: string) {
  return syncConnection(connectionId);
}

/** Build iCal string for BNHUB bookings + blocked slots (export to OTAs). */
export async function exportBNHubCalendar(listingId: string): Promise<string> {
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: {
        in: [
          BookingStatus.PENDING,
          BookingStatus.AWAITING_HOST_APPROVAL,
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
        ],
      },
    },
    select: { id: true, checkIn: true, checkOut: true, guest: { select: { name: true } } },
    orderBy: { checkIn: "asc" },
  });

  const blocked = await prisma.availabilitySlot.findMany({
    where: {
      listingId,
      bookedByBookingId: null,
      dayStatus: { in: ["BLOCKED", "BOOKED"] },
    },
    select: { date: true, dayStatus: true },
    orderBy: { date: "asc" },
  });

  const vevents: { uid: string; summary: string; dtStart: Date; dtEndExclusive: Date }[] = [];

  for (const b of bookings) {
    const start = utcDayStart(b.checkIn);
    const endEx = utcDayStart(b.checkOut);
    vevents.push({
      uid: `bnhub-booking-${b.id}@bnhub`,
      summary: `Booked (BNHUB)${b.guest?.name ? ` — ${b.guest.name}` : ""}`,
      dtStart: start,
      dtEndExclusive: endEx,
    });
  }

  for (const s of blocked) {
    const d = utcDayStart(s.date);
    const endEx = new Date(d.getTime() + 86400000);
    vevents.push({
      uid: `bnhub-slot-${d.toISOString().slice(0, 10)}-${s.dayStatus}@bnhub`,
      summary: s.dayStatus === "BLOCKED" ? "Blocked (BNHUB)" : "External / blocked (BNHUB)",
      dtStart: d,
      dtEndExclusive: endEx,
    });
  }

  return buildICalDocument(vevents);
}

export type ConflictRow = { date: string; reason: string };

/** Dates where a confirmed BNHUB booking overlaps external channel event (informational). */
export async function detectConflicts(listingId: string): Promise<ConflictRow[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.PENDING] },
    },
    select: { checkIn: true, checkOut: true },
  });

  const externals = await prisma.bnhubChannelCalendarEvent.findMany({
    where: { listingId, source: "EXTERNAL" },
    select: { startDate: true, endDate: true, guestName: true },
  });

  const conflictDates = new Set<string>();

  for (const b of bookings) {
    const bnNights = new Set(
      eachNightBetween(b.checkIn, b.checkOut).map((d) => utcDayStart(d).toISOString().slice(0, 10))
    );
    for (const ex of externals) {
      const exStart = utcDayStart(ex.startDate);
      const exEnd = utcDayStart(new Date(ex.endDate.getTime() + 86400000));
      const exNights = eachNightBetween(exStart, exEnd);
      for (const n of exNights) {
        const key = utcDayStart(n).toISOString().slice(0, 10);
        if (bnNights.has(key)) conflictDates.add(key);
      }
    }
  }

  return [...conflictDates].sort().map((date) => ({
    date,
    reason: "BNHUB reservation and external calendar both occupy this night",
  }));
}

/**
 * Placeholder: production would merge rules (priority BNHUB vs OTA) and notify host.
 */
export async function resolveConflicts(
  listingId: string,
  strategy: "prefer_bnhub" | "prefer_external"
): Promise<{ ok: boolean; message: string }> {
  const map = await prisma.bnhubChannelListingMapping.findFirst({
    where: { listingId },
    select: { channelConnectionId: true },
  });
  if (map) {
    await appendOtaSyncLog({
      connectionId: map.channelConnectionId,
      listingId,
      syncType: "IMPORT",
      status: "SUCCESS",
      message: `resolveConflicts(${strategy}) — manual review recommended`,
      payload: { listingId, strategy, conflicts: await detectConflicts(listingId) },
    });
  }
  return {
    ok: true,
    message: "Conflict resolution is manual in MVP; review calendar and adjust OTAs or BNHUB.",
  };
}
