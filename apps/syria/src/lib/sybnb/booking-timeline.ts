import type { SybnbBookingStatus, SybnbGuestPaymentState } from "@/generated/prisma";

export type BookingTimelineStepKey = "requested" | "approved" | "payment";

/** Derived timeline row — computed only from booking fields (no stored timeline). */
export type BookingTimelineStep = {
  key: BookingTimelineStepKey;
  /** Step reached / satisfied (green ✓). */
  completed: boolean;
  /** Current bottleneck / highlight (amber). Only one step should be current when visible. */
  current: boolean;
  /** Optional timestamp — only `requested` uses `createdAt` (no synthetic approved-at without DB). */
  date: Date | null;
};

function hostApprovedReached(status: SybnbBookingStatus): boolean {
  return (
    status === "approved" ||
    status === "payment_pending" ||
    status === "paid" ||
    status === "confirmed" ||
    status === "completed" ||
    status === "refunded" ||
    status === "needs_review"
  );
}

function manualPaymentCleared(
  status: SybnbBookingStatus,
  paymentStatus: SybnbGuestPaymentState,
): boolean {
  if (!hostApprovedReached(status)) return false;
  if (paymentStatus === "manual_required") return false;
  return (
    paymentStatus === "paid" ||
    status === "confirmed" ||
    status === "completed" ||
    status === "paid"
  );
}

/** Same predicate as timeline “payment” step `completed` — use for reminders / cron copy. */
export function sybnbBookingPaymentSettled(booking: {
  status: SybnbBookingStatus;
  paymentStatus: SybnbGuestPaymentState;
}): boolean {
  return manualPaymentCleared(booking.status, booking.paymentStatus);
}

/**
 * Vertical SYBNB-1 timeline: request → host approval → manual payment gate.
 * Derived only from `SybnbBooking` — never persisted separately.
 */
export function getBookingTimeline(booking: {
  status: SybnbBookingStatus;
  paymentStatus: SybnbGuestPaymentState;
  createdAt: Date;
}): BookingTimelineStep[] {
  const approvedDone = hostApprovedReached(booking.status);
  const manualDone = manualPaymentCleared(booking.status, booking.paymentStatus);

  const steps: Omit<BookingTimelineStep, "current">[] = [
    {
      key: "requested",
      completed: true,
      date: booking.createdAt,
    },
    {
      key: "approved",
      completed: approvedDone,
      date: null,
    },
    {
      key: "payment",
      completed: manualDone,
      date: null,
    },
  ];

  const firstIncomplete = steps.findIndex((s) => !s.completed);
  const currentIdx = firstIncomplete === -1 ? -1 : firstIncomplete;

  return steps.map((s, i) => ({
    ...s,
    current: currentIdx !== -1 && i === currentIdx,
  }));
}
