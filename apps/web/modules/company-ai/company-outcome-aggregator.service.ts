import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCompanyAiAudit } from "./company-ai-audit.service";
import type { CompanyOutcomePeriodType } from "@prisma/client";

export type CompanyMetricsSnapshot = {
  window: { periodStart: string; periodEnd: string; periodType: CompanyOutcomePeriodType };
  deals: {
    created: number;
    closed: number;
    cancelled: number;
    closeRate: number;
    sample: number;
  };
  bookings: {
    created: number;
    confirmedOrCompleted: number;
    declinedOrCancelled: number;
    conversionToConfirmed: number;
    revenueCompletedCents: number;
    sample: number;
  };
  listings: { crmCreated: number; fsboCreated: number };
  investors: { memoRows: number; icPackRows: number };
  compliance: { openAlerts: number };
  notes: string[];
};

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function periodRange(periodType: CompanyOutcomePeriodType, end: Date): { start: Date; end: Date } {
  const endDay = startOfUtcDay(end);
  if (periodType === "WEEKLY") {
    return { start: addDays(endDay, -7), end: endDay };
  }
  if (periodType === "MONTHLY") {
    return { start: addDays(endDay, -30), end: endDay };
  }
  return { start: addDays(endDay, -90), end: endDay };
}

async function aggregateMetrics(periodType: CompanyOutcomePeriodType, end: Date): Promise<CompanyMetricsSnapshot> {
  const { start, end: periodEnd } = periodRange(periodType, end);
  const notes: string[] = [];

  const [dealsCreated, dealsClosed, dealsCancelled, bookingsCreated, bookingsConfirmed, bookingsDone, listingsCrm, listingsFsbo, memos, packs, alerts] =
    await Promise.all([
      prisma.deal.count({ where: { createdAt: { gte: start, lte: periodEnd } } }),
      prisma.deal.count({ where: { status: "closed", updatedAt: { gte: start, lte: periodEnd } } }),
      prisma.deal.count({
        where: {
          status: "cancelled",
          updatedAt: { gte: start, lte: periodEnd },
        },
      }),
      prisma.booking.count({ where: { createdAt: { gte: start, lte: periodEnd } } }),
      prisma.booking.count({
        where: {
          createdAt: { gte: start, lte: periodEnd },
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: { gte: start, lte: periodEnd },
          status: BookingStatus.COMPLETED,
        },
        select: { totalCents: true },
      }),
      prisma.listing.count({ where: { createdAt: { gte: start, lte: periodEnd } } }),
      prisma.fsboListing.count({ where: { createdAt: { gte: start, lte: periodEnd } } }),
      prisma.investorMemo.count({ where: { createdAt: { gte: start, lte: periodEnd } } }),
      prisma.investorIcPack.count({ where: { createdAt: { gte: start, lte: periodEnd } } }),
      prisma.complianceEscalation.count({
        where: { status: { not: "resolved" } },
      }),
    ]);

  const bookingsTerminal = await prisma.booking.count({
    where: {
      createdAt: { gte: start, lte: periodEnd },
      status: {
        in: [
          BookingStatus.DECLINED,
          BookingStatus.CANCELLED,
          BookingStatus.CANCELLED_BY_GUEST,
          BookingStatus.CANCELLED_BY_HOST,
          BookingStatus.EXPIRED,
        ],
      },
    },
  });

  const dealSample = dealsCreated;
  const closeRate = dealSample > 0 ? dealsClosed / dealSample : 0;
  const bookingSample = bookingsCreated;
  const conversionToConfirmed = bookingSample > 0 ? bookingsConfirmed / bookingSample : 0;
  const revenueCompletedCents = bookingsDone.reduce((s, b) => s + b.totalCents, 0);

  return {
    window: { periodStart: start.toISOString(), periodEnd: periodEnd.toISOString(), periodType },
    deals: {
      created: dealsCreated,
      closed: dealsClosed,
      cancelled: dealsCancelled,
      closeRate,
      sample: dealSample,
    },
    bookings: {
      created: bookingsCreated,
      confirmedOrCompleted: bookingsConfirmed,
      declinedOrCancelled: bookingsTerminal,
      conversionToConfirmed,
      revenueCompletedCents,
      sample: bookingSample,
    },
    listings: { crmCreated: listingsCrm, fsboCreated: listingsFsbo },
    investors: { memoRows: memos, icPackRows: packs },
    compliance: { openAlerts: alerts },
    notes,
  };
}

function concludeFromMetrics(m: CompanyMetricsSnapshot): Record<string, unknown> {
  const conclusions: Record<string, unknown> = {
    headline: [] as string[],
    riskFlags: [] as string[],
  };
  const headlines = conclusions.headline as string[];
  const risks = conclusions.riskFlags as string[];

  if (m.deals.sample >= 5 && m.deals.closeRate < 0.15) {
    headlines.push("Deal close rate is low relative to new deal volume — review pipeline friction.");
  }
  if (m.bookings.sample >= 8 && m.bookings.conversionToConfirmed < 0.35) {
    headlines.push("BNHub booking confirmation rate is soft — host approval or checkout friction may dominate.");
  }
  if (m.compliance.openAlerts > 20) {
    risks.push("Elevated open compliance escalations — execution queues may slow.");
  }
  if (m.investors.memoRows > 0 && m.investors.icPackRows === 0) {
    headlines.push("Investor memos generated without matching IC packs — packaging consistency opportunity.");
  }
  if (headlines.length === 0) {
    headlines.push("No strong negative signals in aggregate platform metrics for this window.");
  }
  return conclusions;
}

/** Persists rolling outcome windows (7d / 30d / 90d) for the given anchor date. */
export async function generateOutcomeWindowsForAnchor(end: Date = new Date()): Promise<void> {
  const types: CompanyOutcomePeriodType[] = ["WEEKLY", "MONTHLY", "QUARTERLY"];
  for (const periodType of types) {
    const metrics = await aggregateMetrics(periodType, end);
    const conclusions = concludeFromMetrics(metrics);
    const { start, end: periodEnd } = periodRange(periodType, end);

    await prisma.companyOutcomeWindow.create({
      data: {
        periodType,
        periodStart: start,
        periodEnd,
        metricsJson: metrics as unknown as Record<string, unknown>,
        conclusionsJson: conclusions,
      },
    });

    await logCompanyAiAudit({
      action: "outcome_window_generated",
      payload: { periodType, periodStart: start.toISOString(), periodEnd: periodEnd.toISOString() },
    });
  }
}

/** Returns latest persisted windows per period type (most recent periodEnd). */
export async function loadLatestOutcomeWindows(): Promise<
  Partial<Record<CompanyOutcomePeriodType, { id: string; metricsJson: unknown; conclusionsJson: unknown; periodEnd: Date }>>
> {
  const types: CompanyOutcomePeriodType[] = ["WEEKLY", "MONTHLY", "QUARTERLY"];
  const out: Partial<
    Record<CompanyOutcomePeriodType, { id: string; metricsJson: unknown; conclusionsJson: unknown; periodEnd: Date }>
  > = {};
  for (const t of types) {
    const row = await prisma.companyOutcomeWindow.findFirst({
      where: { periodType: t },
      orderBy: { periodEnd: "desc" },
    });
    if (row) {
      out[t] = {
        id: row.id,
        metricsJson: row.metricsJson,
        conclusionsJson: row.conclusionsJson,
        periodEnd: row.periodEnd,
      };
    }
  }
  return out;
}
