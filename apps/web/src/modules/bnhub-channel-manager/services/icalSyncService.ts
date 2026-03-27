/**
 * iCal import: fetch, parse, persist events, block BNHub availability.
 */
import {
  BnhubChannelEventKind,
  BnhubChannelEventSource,
  BnhubChannelPlatform,
  BnhubDayAvailabilityStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { eachNightBetween, utcDayStart } from "@/lib/bnhub/availability-day-helpers";
import { parseICalEvents } from "@/lib/bnhub/ical-utils";
import { appendOtaSyncLog } from "./otaSyncLogService";

const MAX_ICS_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 25_000;

export type ImportICalResult =
  | { ok: true; eventsImported: number; nightsBlocked: number }
  | { ok: false; error: string };

export async function importICal(args: {
  url: string;
  listingId: string;
  connectionId: string;
  platform: BnhubChannelPlatform;
}): Promise<ImportICalResult> {
  let body: string;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(args.url, {
      signal: ctrl.signal,
      headers: { Accept: "text/calendar, application/ics, */*" },
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_ICS_BYTES) {
      return { ok: false, error: "Calendar file too large" };
    }
    body = new TextDecoder("utf-8").decode(buf);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fetch failed" };
  }

  const parsed = parseICalEvents(body);
  if (parsed.length === 0) {
    await appendOtaSyncLog({
      connectionId: args.connectionId,
      listingId: args.listingId,
      syncType: "IMPORT",
      status: "FAILED",
      message: "No VEVENT entries found",
      payload: { urlHost: safeHost(args.url) },
    });
    return { ok: false, error: "No events in calendar" };
  }

  let nightsBlocked = 0;

  await prisma.$transaction(async (tx) => {
    await tx.bnhubChannelCalendarEvent.deleteMany({
      where: {
        listingId: args.listingId,
        channelConnectionId: args.connectionId,
        source: BnhubChannelEventSource.EXTERNAL,
      },
    });

    for (const ev of parsed) {
      const start = utcDayStart(ev.dtStart);
      const endEx = utcDayStart(ev.dtEndExclusive);
      if (endEx <= start) continue;

      await tx.bnhubChannelCalendarEvent.create({
        data: {
          listingId: args.listingId,
          channelConnectionId: args.connectionId,
          source: BnhubChannelEventSource.EXTERNAL,
          platform: args.platform,
          externalEventId: ev.uid.slice(0, 500),
          eventType: BnhubChannelEventKind.RESERVATION,
          startDate: start,
          endDate: new Date(endEx.getTime() - 86400000),
          guestName: ev.summary.slice(0, 200) || null,
          metadataJson: { summary: ev.summary, rawStart: ev.rawStart, rawEnd: ev.rawEnd },
        },
      });

      const nights = eachNightBetween(start, endEx);
      for (const date of nights) {
        const d = utcDayStart(date);
        const existing = await tx.availabilitySlot.findUnique({
          where: { listingId_date: { listingId: args.listingId, date: d } },
        });
        if (existing?.bookedByBookingId) {
          continue;
        }
        await tx.availabilitySlot.upsert({
          where: { listingId_date: { listingId: args.listingId, date: d } },
          create: {
            listingId: args.listingId,
            date: d,
            available: false,
            dayStatus: BnhubDayAvailabilityStatus.BOOKED,
            bookedByBookingId: null,
          },
          update: {
            available: false,
            dayStatus: BnhubDayAvailabilityStatus.BOOKED,
            bookedByBookingId: null,
          },
        });
        nightsBlocked += 1;
      }
    }
  });

  await appendOtaSyncLog({
    connectionId: args.connectionId,
    listingId: args.listingId,
    syncType: "IMPORT",
    status: "SUCCESS",
    message: `Imported ${parsed.length} events`,
    payload: { events: parsed.length, nightsBlocked },
  });

  return { ok: true, eventsImported: parsed.length, nightsBlocked };
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
