import type { HostBookingListRow } from "@/lib/host/bookings-data";

const CANCELED = new Set([
  "CANCELLED",
  "CANCELLED_BY_GUEST",
  "CANCELLED_BY_HOST",
  "DECLINED",
  "EXPIRED",
]);

export type HostBookingsTab = "upcoming" | "ongoing" | "past" | "canceled";

function dt(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

export function filterBookingsByTab(rows: HostBookingListRow[], tab: HostBookingsTab, now = new Date()) {
  return rows.filter((b) => {
    const checkIn = dt(b.checkIn as unknown as Date | string);
    const checkOut = dt(b.checkOut as unknown as Date | string);
    if (tab === "canceled") return CANCELED.has(b.bookingStatus);
    if (CANCELED.has(b.bookingStatus)) return false;
    if (tab === "upcoming") return checkIn >= now;
    if (tab === "ongoing") return checkIn <= now && checkOut >= now;
    if (tab === "past") return checkOut < now;
    return true;
  });
}
