import { nightYmdKeysForStay } from "@/lib/booking/nightYmdsBetween";

/**
 * Whether `ymd` is an occupied **night** in the stay `[start, end)` (checkout excluded),
 * same keys as `POST /api/bookings` + {@link nightYmdKeysForStay}. Order D.1 “failed attempt” highlight.
 */
export function ymdInRejectedStayNights(ymd: string, startY: string, endY: string): boolean {
  return nightYmdKeysForStay(startY, endY).includes(ymd.slice(0, 10));
}
