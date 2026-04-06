export function normalizeBookingStatus(raw: string | null | undefined): string {
  return (raw ?? "pending").trim().toLowerCase();
}

export function isBookingPaidLike(status: string): boolean {
  const s = normalizeBookingStatus(status);
  return s === "paid" || s === "completed" || s === "confirmed";
}

export function isBookingCanceled(status: string): boolean {
  const s = normalizeBookingStatus(status);
  return s === "canceled" || s === "cancelled";
}

export function canBookingPay(status: string): boolean {
  const s = normalizeBookingStatus(status);
  return s === "pending" || s === "processing";
}

/** Short label for badges */
export function bookingStatusBadgeLabel(status: string): string {
  const s = normalizeBookingStatus(status);
  const map: Record<string, string> = {
    pending: "Awaiting payment",
    processing: "Payment in progress",
    paid: "Paid",
    confirmed: "Paid · confirmed",
    completed: "Completed",
    canceled: "Canceled",
    cancelled: "Canceled",
    disputed: "Disputed",
    awaiting_host_approval: "Awaiting host",
    declined: "Declined",
    cancelled_by_guest: "Cancelled",
    cancelled_by_host: "Cancelled by host",
  };
  return map[s] ?? status;
}
