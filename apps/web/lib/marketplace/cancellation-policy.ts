/**
 * Order 59.1 — guest-facing refund rules (predictable, policy-driven).
 * Amounts are **cents** (Stripe minor units) on `refundableAmount`.
 */

export type CancellationPolicyType = "flexible" | "moderate" | "strict";

export type CancellationPolicyResult = {
  type: CancellationPolicyType;
  /** Refund to issue in **cents** (floor of `totalPaid * refundPercent/100`). */
  refundableAmount: number;
  /** 0–100 */
  refundPercent: number;
  reason: string;
};

/** `booking`-shaped input plus the paid total from ledger/Stripe. */
export type CancellationPolicyBookingInput = {
  startDate: Date;
  endDate: Date;
  status: string;
  /** Gross charged to the guest for this stay (from `MarketplacePaymentLedger` or equivalent). */
  totalPaidCents: number;
  /**
   * Optional override. When omitted, `MARKETPLACE_DEFAULT_CANCELLATION_POLICY` (flexible|moderate|strict) is used, defaulting to **flexible**.
   */
  policyType?: CancellationPolicyType;
};

const MS_PER_HOUR = 1000 * 60 * 60;

function defaultPolicyType(): CancellationPolicyType {
  const v = process.env.MARKETPLACE_DEFAULT_CANCELLATION_POLICY?.trim().toLowerCase();
  if (v === "moderate" || v === "strict" || v === "flexible") return v;
  return "flexible";
}

/**
 * Local calendar start-of-day for a Prisma `@db.Date` (UTC midnight) — compare in the same space as "check-in day".
 */
function startOfCheckInDay(startDate: Date): Date {
  return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
}

/**
 * Whole hours from `at` to check-in start (can be negative if `at` is after start).
 */
function hoursUntilCheckInFrom(startDate: Date, at: Date): number {
  const checkIn = startOfCheckInDay(startDate);
  return (checkIn.getTime() - at.getTime()) / MS_PER_HOUR;
}

/**
 * `true` if the stay window has no remaining nights to honour (check-out has passed for `endDate` exclusive).
 */
export function isMarketplaceStayCompletedOrPast(booking: { endDate: Date }, at: Date = new Date()): boolean {
  const end = startOfCheckInDay(booking.endDate);
  const today = startOfCheckInDay(at);
  return today.getTime() >= end.getTime();
}

/**
 * Per-order rules (examples):
 * - **flexible** — &gt;24h before start → 100%, else 50%
 * - **moderate** — &gt;7d → 100%, &gt;24h → 50%, else 0%
 * - **strict** — &gt;7d → 50%, else 0%
 */
export function refundPercentForPolicy(
  type: CancellationPolicyType,
  hoursUntilCheckIn: number
): { percent: number; reason: string } {
  if (type === "flexible") {
    if (hoursUntilCheckIn > 24) {
      return { percent: 100, reason: "Flexible policy: more than 24 hours before check-in — full refund." };
    }
    if (hoursUntilCheckIn > 0) {
      return { percent: 50, reason: "Flexible policy: within 24 hours of check-in — 50% refund." };
    }
    return { percent: 0, reason: "Flexible policy: check-in has passed — no refund." };
  }
  if (type === "moderate") {
    if (hoursUntilCheckIn > 7 * 24) {
      return { percent: 100, reason: "Moderate policy: more than 7 days before check-in — full refund." };
    }
    if (hoursUntilCheckIn > 24) {
      return { percent: 50, reason: "Moderate policy: 7 days or less, more than 24h before check-in — 50% refund." };
    }
    if (hoursUntilCheckIn > 0) {
      return { percent: 0, reason: "Moderate policy: 24 hours or less before check-in — no refund." };
    }
    return { percent: 0, reason: "Moderate policy: check-in has passed — no refund." };
  }
  // strict
  if (hoursUntilCheckIn > 7 * 24) {
    return { percent: 50, reason: "Strict policy: more than 7 days before check-in — 50% refund." };
  }
  if (hoursUntilCheckIn > 0) {
    return { percent: 0, reason: "Strict policy: 7 days or less before check-in — no refund." };
  }
  return { percent: 0, reason: "Strict policy: check-in has passed — no refund." };
}

/**
 * Compute refund eligibility for a marketplace `Booking` + paid total.
 * Non-positive `totalPaidCents` → 0% with explanatory reason.
 */
export function getCancellationPolicy(
  booking: CancellationPolicyBookingInput,
  at: Date = new Date()
): CancellationPolicyResult {
  const type = booking.policyType ?? defaultPolicyType();
  const total = Math.max(0, Math.floor(Number(booking.totalPaidCents) || 0));
  if (total <= 0) {
    return {
      type,
      refundableAmount: 0,
      refundPercent: 0,
      reason: "No successful payment recorded for this booking — nothing to refund.",
    };
  }

  if (["pending", "expired"].includes(booking.status)) {
    return {
      type,
      refundableAmount: 0,
      refundPercent: 0,
      reason: "Booking is not a paid, confirmed stay — no refund to process.",
    };
  }

  const hours = hoursUntilCheckInFrom(booking.startDate, at);
  const { percent, reason } = refundPercentForPolicy(type, hours);
  const refundableAmount = Math.floor((total * percent) / 100);

  return {
    type,
    refundPercent: percent,
    refundableAmount,
    reason,
  };
}
