/**
 * Server helpers for Order D.1: one batched `bookings` read per call, in-memory next/nearest.
 * @see findNextAvailableStart
 * @see findNearestAvailableRanges
 * @see buildMarketplaceConflictSuggestions (used by `POST /api/bookings` 409)
 */
import "server-only";

import {
  mergeBookingYmd,
  scanNearestAvailableRanges,
  scanNextAvailableStart,
  suggestionQueryWindow,
  type MergedYmd,
} from "@/lib/booking/conflictSuggestionScan";
import { getListingsDB } from "@/lib/db/routeSwitch";
import { toDateOnlyFromString } from "@/lib/dates/dateOnly";
import { activeMarketplaceInventoryFilter } from "@/lib/marketplace/booking-hold";
import { nightYmdKeysForStay } from "@/lib/booking/nightYmdsBetween";

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function ymdToUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function dateFromPrismaDate(d: Date): string {
  return toYmd(ymdToUtc(d));
}

async function loadBlockingRangesForWindow(
  listingId: string,
  windowStartYmd: string,
  windowEndYmd: string
): Promise<MergedYmd[]> {
  const id = listingId?.trim();
  if (!id) return [];
  const from = toDateOnlyFromString(windowStartYmd);
  const to = toDateOnlyFromString(windowEndYmd);
  if (from.getTime() > to.getTime()) return [];

  const db = getListingsDB();
  const rows = await db.booking.findMany({
    where: {
      listingId: id,
      ...activeMarketplaceInventoryFilter(),
      startDate: { lte: to },
      endDate: { gte: from },
    },
    select: { startDate: true, endDate: true },
  });

  return mergeBookingYmd(
    rows.map((r) => ({ startYmd: dateFromPrismaDate(new Date(r.startDate)), endYmd: dateFromPrismaDate(new Date(r.endDate)) }))
  );
}

/**
 * **One** `bookings` query, then in-memory `scanNext` + `scanNearest` (Order D.1).
 */
export async function buildMarketplaceConflictSuggestions(
  listingId: string,
  startYmd: string,
  endYmd: string
): Promise<BookingConflictSuggestions> {
  const start = startYmd.slice(0, 10);
  const { fromY, toY } = suggestionQueryWindow(start);
  const merged = await loadBlockingRangesForWindow(listingId, fromY, toY);
  return {
    nextAvailableStart: scanNextAvailableStart(merged, start, endYmd.slice(0, 10)),
    nearestRanges: scanNearestAvailableRanges(merged, start, endYmd.slice(0, 10), 3),
  };
}

/**
 * First calendar day S ≥ `requestedStartYmd` where the stay with the same span as `(requestedStart, requestedEnd)` is free.
 * Two-arg form (spec): `requestedEnd` defaults to `requestedStart` (single-night / same-day span in marketplace YMD form).
 * @see {@link findNearestAvailableRanges} for 2–3 alternative windows.
 */
export async function findNextAvailableStart(
  listingId: string,
  requestedStart: string
): Promise<string | null>;
export async function findNextAvailableStart(
  listingId: string,
  requestedStart: string,
  requestedEndYmd: string
): Promise<string | null>;
export async function findNextAvailableStart(
  listingId: string,
  requestedStart: string,
  requestedEndYmd?: string
): Promise<string | null> {
  const start = requestedStart.slice(0, 10);
  const end = (requestedEndYmd ?? requestedStart).slice(0, 10);
  const { fromY, toY } = suggestionQueryWindow(start);
  const merged = await loadBlockingRangesForWindow(listingId, fromY, toY);
  return scanNextAvailableStart(merged, start, end);
}

/**
 * 2–3 closest free windows to `startYmd` (same length as `start`..`end`), by |offset days| on the start date.
 * Single batched `bookings` query, then in-memory scan.
 */
export async function findNearestAvailableRanges(
  listingId: string,
  startYmd: string,
  endYmd: string,
  maxResults = 3
): Promise<{ startDate: string; endDate: string }[]> {
  const start = startYmd.slice(0, 10);
  const end = endYmd.slice(0, 10);
  if (nightYmdKeysForStay(start, end).length === 0) return [];
  const { fromY, toY } = suggestionQueryWindow(start);
  const merged = await loadBlockingRangesForWindow(listingId, fromY, toY);
  return scanNearestAvailableRanges(merged, start, end, maxResults);
}

/**
 * Suggestion DTO for 409 on marketplace booking create (Order D.1).
 */
export type BookingConflictSuggestions = {
  nextAvailableStart: string | null;
  nearestRanges: { startDate: string; endDate: string }[];
};
