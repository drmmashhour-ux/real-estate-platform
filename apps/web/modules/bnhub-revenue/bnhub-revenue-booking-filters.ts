import { BookingStatus } from "@prisma/client";

/**
 * Excludes non-stay / cancelled bookings from BNHub gross revenue KPIs (same basket for occupancy denom).
 */
export const BNHUB_REVENUE_EXCLUDED_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLED_BY_GUEST,
  BookingStatus.CANCELLED_BY_HOST,
  BookingStatus.CANCELLED,
  BookingStatus.DECLINED,
  BookingStatus.EXPIRED,
];

export function bookingCountsTowardBnhubRevenue(status: BookingStatus): boolean {
  return !BNHUB_REVENUE_EXCLUDED_BOOKING_STATUSES.includes(status);
}
