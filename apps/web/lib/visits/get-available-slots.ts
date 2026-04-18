import { addDays, addMinutes, isAfter, isBefore, max, min } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";
import {
  DEFAULT_VISIT_TIME_ZONE,
  VISIT_DURATION_DEFAULT,
  VISIT_SLOT_STEP_MINUTES,
} from "@/lib/visits/constants";
import { getBrokerAvailabilityRows, getBrokerTimeOffRanges } from "@/lib/visits/get-availability";
import { rangesOverlap } from "@/lib/visits/overlap";
import { clampDurationMinutes } from "@/lib/visits/validators";

const DEFAULT_WEEKDAY_WINDOWS = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
  timeZone: DEFAULT_VISIT_TIME_ZONE,
}));

function utcAtLocalWall(ymd: string, hhmm: string, tz: string): Date {
  const wall = `${ymd} ${hhmm}:00`;
  return fromZonedTime(wall, tz);
}

function minutesBetweenHHMM(start: string, end: string): number {
  const [sh, sm] = start.split(":").map((x) => parseInt(x, 10));
  const [eh, em] = end.split(":").map((x) => parseInt(x, 10));
  return eh * 60 + em - (sh * 60 + sm);
}

export type VisitSlot = { start: string; end: string };

export async function getAvailableVisitSlots(opts: {
  brokerUserId: string;
  from: Date;
  to: Date;
  durationMinutes?: number;
}): Promise<VisitSlot[]> {
  const duration = clampDurationMinutes(opts.durationMinutes ?? VISIT_DURATION_DEFAULT);
  const rangeFrom = opts.from;
  const rangeTo = opts.to;
  if (!isBefore(rangeFrom, rangeTo)) return [];

  const rows = await getBrokerAvailabilityRows(opts.brokerUserId);
  const activeRows = rows.filter((r) => r.isActive);
  const synthetic =
    activeRows.length === 0
      ? DEFAULT_WEEKDAY_WINDOWS
      : activeRows.map((r) => ({
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
          timeZone: r.timeZone || DEFAULT_VISIT_TIME_ZONE,
        }));

  const brokerTz = synthetic[0]?.timeZone ?? DEFAULT_VISIT_TIME_ZONE;

  const timeOff = await getBrokerTimeOffRanges(opts.brokerUserId, rangeFrom, rangeTo);

  const visits = await prisma.lecipmVisit.findMany({
    where: {
      brokerUserId: opts.brokerUserId,
      status: "scheduled",
      AND: [{ endDateTime: { gte: rangeFrom } }, { startDateTime: { lte: rangeTo } }],
    },
    select: { startDateTime: true, endDateTime: true },
  });

  const pending = await prisma.lecipmVisitRequest.findMany({
    where: {
      brokerUserId: opts.brokerUserId,
      status: "pending",
      AND: [{ requestedEnd: { gte: rangeFrom } }, { requestedStart: { lte: rangeTo } }],
    },
    select: { requestedStart: true, requestedEnd: true },
  });

  function isBlocked(start: Date, end: Date): boolean {
    for (const t of timeOff) {
      if (rangesOverlap(start, end, t.startDateTime, t.endDateTime)) return true;
    }
    for (const v of visits) {
      if (rangesOverlap(start, end, v.startDateTime, v.endDateTime)) return true;
    }
    for (const p of pending) {
      if (rangesOverlap(start, end, p.requestedStart, p.requestedEnd)) return true;
    }
    return false;
  }

  const slots: VisitSlot[] = [];

  let dayCursor = new Date(rangeFrom.getTime());
  const endDay = new Date(rangeTo.getTime());

  while (!isAfter(dayCursor, endDay)) {
    const ymd = formatInTimeZone(dayCursor, brokerTz, "yyyy-MM-dd");
    const dow = toZonedTime(dayCursor, brokerTz).getDay();

    for (const win of synthetic) {
      if (win.dayOfWeek !== dow) continue;
      const winTz = win.timeZone || DEFAULT_VISIT_TIME_ZONE;
      if (minutesBetweenHHMM(win.startTime, win.endTime) < duration) continue;

      const windowStart = utcAtLocalWall(ymd, win.startTime, winTz);
      const windowEnd = utcAtLocalWall(ymd, win.endTime, winTz);
      const capEnd = min([windowEnd, rangeTo]);
      const lastStart = addMinutes(capEnd, -duration);

      let cursor = max([windowStart, rangeFrom]);
      while (!isAfter(cursor, lastStart)) {
        const slotEnd = addMinutes(cursor, duration);
        if (isAfter(slotEnd, capEnd)) break;
        if (!isBlocked(cursor, slotEnd)) {
          slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
        }
        cursor = addMinutes(cursor, VISIT_SLOT_STEP_MINUTES);
      }
    }

    dayCursor = addDays(dayCursor, 1);
  }

  return slots;
}
