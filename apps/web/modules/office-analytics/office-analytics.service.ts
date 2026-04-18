import { prisma } from "@/lib/db";
import { brokerageOfficeDisclaimer } from "@/modules/brokerage-office/office-explainer";
import type { OfficeAnalyticsWindow } from "./office-analytics.types";
import { billingMetrics } from "./billing-metrics.service";
import { commissionCaseMetrics } from "./commission-metrics.service";
import { payoutLagDays } from "./payout-metrics.service";

function range(w: OfficeAnalyticsWindow, custom?: { from: string; to: string }) {
  const end = new Date();
  if (w === "custom" && custom) {
    return { start: new Date(custom.from), end: new Date(custom.to) };
  }
  const start = new Date();
  if (w === "today") {
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  const days =
    w === "7d" ? 7 : w === "30d" ? 30 : w === "quarter" ? 90 : w === "year" ? 365 : 30;
  start.setTime(end.getTime() - days * 86400000);
  return { start, end };
}

export async function getOfficeAnalytics(
  officeId: string,
  window: OfficeAnalyticsWindow,
  custom?: { from: string; to: string },
) {
  const { start } = range(window, custom);

  const cases = await prisma.brokerageCommissionCase.findMany({
    where: { officeId, createdAt: { gte: start } },
    select: { grossCommissionCents: true, brokerUserId: true, status: true },
    take: 2000,
  });

  const grossVolume = cases.reduce((s, c) => s + c.grossCommissionCents, 0);
  const byBroker = new Map<string, number>();
  for (const c of cases) {
    byBroker.set(c.brokerUserId, (byBroker.get(c.brokerUserId) ?? 0) + c.grossCommissionCents);
  }

  const [commMetrics, billMetrics, lag] = await Promise.all([
    commissionCaseMetrics(officeId, start),
    billingMetrics(officeId, start),
    payoutLagDays(officeId, start),
  ]);

  return {
    window,
    grossCommissionVolumeCents: grossVolume,
    avgCommissionPerDealCents: cases.length ? Math.floor(grossVolume / cases.length) : 0,
    revenueByBroker: [...byBroker.entries()].map(([brokerUserId, cents]) => ({ brokerUserId, cents })),
    commissionCases: commMetrics,
    billing: billMetrics,
    payoutLagDaysAvg: lag,
    disclaimer: brokerageOfficeDisclaimer(),
    generatedAt: new Date().toISOString(),
  };
}
