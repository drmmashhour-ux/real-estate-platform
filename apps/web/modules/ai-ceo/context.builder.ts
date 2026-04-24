/**
 * BNHub / LECIPM strategic context — aggregates **internal** DB metrics only (no external APIs).
 */
import { prisma } from "@/lib/db";
import { gatherMarketSignals } from "@/modules/ceo-ai/ceo-market-signals.service";
import { buildCeoContext } from "@/modules/ai-ceo/ai-ceo.engine";
import type { AiCeoStrategicContext } from "@/modules/ai-ceo/ai-ceo.types";

function monthOverMonthMrr(rows: { mrr: unknown; snapshotDate: Date }[]): {
  latest: number | null;
  previous: number | null;
  mom: number | null;
  dates: string[];
} {
  if (rows.length < 2) {
    return {
      latest: rows[0] ? Number(rows[0].mrr) : null,
      previous: null,
      mom: null,
      dates: rows.map((r) => r.snapshotDate.toISOString()),
    };
  }
  const latest = Number(rows[0]!.mrr);
  const previous = Number(rows[1]!.mrr);
  const mom =
    Number.isFinite(latest) && Number.isFinite(previous) && previous > 1e-9 ?
      (latest - previous) / previous
    : null;
  return {
    latest: Number.isFinite(latest) ? latest : null,
    previous: Number.isFinite(previous) ? previous : null,
    mom,
    dates: rows.map((r) => r.snapshotDate.toISOString()),
  };
}

/**
 * Full strategic context for BNHub + LECIPM advisory layers.
 */
export async function buildStrategicContext(): Promise<AiCeoStrategicContext> {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [
    base,
    signals,
    revenueRows,
    bnhubHosts,
    bookings30d,
    seniorLeads30d,
    seniorClosed30d,
    residencesApprox,
    gtmEvents30d,
    listingViews30d,
  ] = await Promise.all([
    buildCeoContext(),
    gatherMarketSignals().catch(() => null),
    prisma.revenueSnapshot
      .findMany({
        orderBy: { snapshotDate: "desc" },
        take: 3,
        select: { mrr: true, snapshotDate: true },
      })
      .catch(() => []),
    prisma.bnhubHost.count().catch(() => null),
    prisma.booking.count({ where: { createdAt: { gte: since30 } } }).catch(() => null),
    prisma.seniorLead.count({ where: { createdAt: { gte: since30 } } }).catch(() => null),
    prisma.seniorLead
      .count({ where: { createdAt: { gte: since30 }, status: "CLOSED" } })
      .catch(() => null),
    prisma.seniorResidence.count().catch(() => null),
    prisma.seniorLivingGtmExecutionEvent.count({ where: { occurredAt: { gte: since30 } } }).catch(() => null),
    prisma.bnhubClientListingViewEvent.count({ where: { createdAt: { gte: since30 } } }).catch(() => null),
  ]);

  const rev = monthOverMonthMrr(revenueRows);

  return {
    ...base,
    lecipm: {
      seniorLeads30d,
      seniorClosed30d,
      brokerAccountsApprox: signals?.brokerAccountsApprox ?? null,
      operatorOnboardedLast90d: signals?.operatorOnboardedLast90d ?? null,
      demandIndex: signals?.demandIndex ?? null,
      churnInactiveBrokersApprox: signals?.churnInactiveBrokersApprox ?? null,
      inactiveOperatorsApprox: signals?.inactiveOperatorsApprox ?? null,
      gtmEvents30d,
      note: "LECIPM signals from `gatherMarketSignals`, senior leads, GTM events — all platform DB.",
    },
    bnhub: {
      registeredHosts: bnhubHosts,
      bookingsCreated30d: bookings30d,
      listingViews30d,
      note: "BNHub proxies: host registry, `booking` creations 30d, listing view events 30d.",
    },
    revenueInternal: {
      mrrLatest: rev.latest,
      mrrPrevious: rev.previous,
      monthOverMonth: rev.mom,
      snapshotDates: rev.dates,
      note: "MRR from `revenueSnapshot` table only; MoM is latest vs prior row.",
    },
    marketplace: {
      ...base.marketplace,
      seniorResidencesApprox: residencesApprox,
      note:
        base.marketplace?.note ??
        "Residence count is inventory scale proxy; not a demand guarantee.",
    },
  };
}
