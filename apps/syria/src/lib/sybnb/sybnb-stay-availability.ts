import { prisma } from "@/lib/db";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";

/** Stay bookings that still reserve the calendar (overlap blocks new requests). */
const ACTIVE_STATUSES_BLOCKING_NEW_REQUESTS = ["PENDING", "APPROVED", "CONFIRMED"] as const;

/**
 * Calendar-night keys for a stay interval [checkIn, checkOut) using UTC calendar dates
 * (aligned with `computeSybnbQuote` / `sybnbNightsBetween`).
 */
export function expandStayBookedDateKeys(checkIn: Date, checkOut: Date): string[] {
  const keys: string[] = [];
  const start = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const end = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
  for (let t = start; t < end; t += 86400000) {
    const d = new Date(t);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    keys.push(`${y}-${m}-${day}`);
  }
  return keys;
}

export function stayRangeOverlapsAvailabilityKeys(
  availability: string[] | null | undefined,
  checkIn: Date,
  checkOut: Date,
): boolean {
  const booked = new Set(availability ?? []);
  for (const k of expandStayBookedDateKeys(checkIn, checkOut)) {
    if (booked.has(k)) return true;
  }
  return false;
}

export async function findOverlappingActiveStayBooking(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<{ id: string } | null> {
  return prisma.syriaBooking.findFirst({
    where: {
      propertyId,
      status: { in: [...ACTIVE_STATUSES_BLOCKING_NEW_REQUESTS] },
      AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    select: { id: true },
  });
}

export async function assertStayDatesAvailableForNewRequest(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  availability: string[] | null | undefined,
): Promise<{ ok: true } | { ok: false }> {
  if (stayRangeOverlapsAvailabilityKeys(availability, checkIn, checkOut)) {
    return { ok: false };
  }
  const clash = await findOverlappingActiveStayBooking(propertyId, checkIn, checkOut);
  if (clash) return { ok: false };
  return { ok: true };
}

/**
 * After a stay booking becomes **CONFIRMED** (paid / verified), merge nights into `SyriaProperty.availability`.
 * Idempotent for webhook retries (union of date keys).
 */
export async function mergeStayBookingDatesIntoListingAvailability(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<void> {
  const prop = await prisma.syriaProperty.findUnique({
    where: { id: propertyId },
    select: { category: true, availability: true },
  });
  if (!prop || prop.category !== "stay") return;

  const extra = expandStayBookedDateKeys(checkIn, checkOut);
  if (extra.length === 0) return;

  const merged = [...new Set([...(prop.availability ?? []), ...extra])].sort();
  await prisma.syriaProperty.update({
    where: { id: propertyId },
    data: { availability: merged },
  });

  await revalidateSyriaPaths(`/listing/${propertyId}`);
}
