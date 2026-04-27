import "server-only";

import { getListingsDB } from "@/lib/db/routeSwitch";

const db = () => getListingsDB();

/**
 * All-time (or filterable) marketplace aggregates for investor / admin dashboards.
 * Order 65 — uses per-booking `subtotalCents`, `feeCents`, `finalCents`, `nights` when set;
 * older rows with nulls are skipped for those sums (backfill from ledger if needed).
 */
export type MarketplaceInvestorMetrics = {
  /** Count of confirmed rows included in money aggregates (have `finalCents` / legacy ledger path). */
  paidBookingCount: number;
  /** SUM(finalCents) — gross amount charged to guests (incl. platform fee), minor units. */
  gmvCents: number;
  /** SUM(feeCents) — platform take before refund allocation. */
  platformFeeCents: number;
  /** SUM(nights) where nights set. */
  nightsBooked: number;
  /** SUM(refundedAmountCents) — total refunds from Stripe, minor units. */
  totalRefundedCents: number;
  /** Fee adjusted down proportionally to refunds: fee − (refund/final)*fee (per booking, floored at 0). */
  netPlatformFeeCents: number;
  /** GMV / paidBookingCount (major units as float, optional). */
  averageBookingValueCents: number | null;
  /** Notes on incomplete data. */
  caveats: string[];
};

/**
 * @param from Optional inclusive lower bound on `startDate` (e.g. MTD)
 * @param to Optional exclusive upper for `endDate` filter — kept simple: filter `startDate` in [from, to] if both set
 */
export async function getMarketplaceInvestorMetricsSnapshot(opts?: {
  from?: Date;
  to?: Date;
}): Promise<MarketplaceInvestorMetrics> {
  const from = opts?.from;
  const to = opts?.to;

  const where =
    from && to
      ? { status: "confirmed" as const, startDate: { gte: from, lte: to } }
      : from
        ? { status: "confirmed" as const, startDate: { gte: from } }
        : to
          ? { status: "confirmed" as const, startDate: { lte: to } }
          : { status: "confirmed" as const };

  const rows = await db().booking.findMany({
    where,
    select: {
      subtotalCents: true,
      feeCents: true,
      finalCents: true,
      nights: true,
      refundedAmountCents: true,
    },
  });

  const caveats: string[] = [];
  let gmvCents = 0;
  let platformFeeCents = 0;
  let nightsBooked = 0;
  let totalRefundedCents = 0;
  let netPlatformFeeCents = 0;
  let countWithPrice = 0;

  for (const r of rows) {
    const final = r.finalCents;
    if (final == null || final <= 0) {
      continue;
    }
    countWithPrice += 1;
    gmvCents += final;
    const fee = r.feeCents ?? 0;
    platformFeeCents += fee;
    if (r.nights != null && r.nights > 0) {
      nightsBooked += r.nights;
    }
    const ref = r.refundedAmountCents ?? 0;
    totalRefundedCents += ref;
    if (ref > 0 && final > 0) {
      const ratio = Math.min(1, ref / final);
      netPlatformFeeCents += Math.max(0, Math.round(fee * (1 - ratio)));
    } else {
      netPlatformFeeCents += fee;
    }
  }

  if (rows.length > 0 && countWithPrice < rows.length) {
    caveats.push("Some confirmed bookings are missing `finalCents` (pre–Order 65) — not included in GMV.");
  }
  caveats.push("Occupancy rate is listing-specific; not computed in this snapshot.");

  const averageBookingValueCents = countWithPrice > 0 ? Math.round(gmvCents / countWithPrice) : null;

  return {
    paidBookingCount: countWithPrice,
    gmvCents,
    platformFeeCents,
    nightsBooked,
    totalRefundedCents,
    netPlatformFeeCents,
    averageBookingValueCents,
    caveats,
  };
}
