import { prisma } from "@/lib/db";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

export async function getGrowthTrackingDashboard(days = 30) {
  const end = addDays(startOfUtcDay(new Date()), 1);
  const start = addDays(end, -Math.max(1, Math.min(180, days)));

  const [
    visits,
    signups,
    analyses,
    leadPurchases,
    paidSubscriptions,
    revenueRows,
    marketing,
  ] = await Promise.all([
    prisma.trafficEvent.count({
      where: { eventType: "page_view", createdAt: { gte: start, lt: end } },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "signup_completed", createdAt: { gte: start, lt: end } },
    }),
    prisma.trafficEvent.count({
      where: {
        OR: [{ eventType: "analysis_event" }, { eventType: "investment_analyze_run" }],
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.trafficEvent.count({
      where: {
        OR: [{ eventType: "lead_purchased" }, { eventType: "lead_unlock" }],
        createdAt: { gte: start, lt: end },
      },
    }),
    prisma.brokerLecipmSubscription.count({
      where: { createdAt: { gte: start, lt: end }, planSlug: { in: ["pro", "platinum"] } },
    }),
    prisma.platformPayment.findMany({
      where: {
        status: "paid",
        createdAt: { gte: start, lt: end },
        paymentType: { in: ["lead_marketplace", "lead_unlock", "subscription"] },
      },
      select: { amountCents: true, paymentType: true },
    }),
    prisma.marketingSettings.findUnique({ where: { id: "default" } }),
  ]);

  const revenueCents = revenueRows.reduce((acc, r) => acc + r.amountCents, 0);
  const adSpendCad = marketing?.manualAdSpendCad ?? 0;
  const adSpendCents = adSpendCad * 100;

  return {
    range: { days, start: start.toISOString(), end: end.toISOString() },
    totals: {
      visits,
      signups,
      analyses,
      leadPurchases,
      paidSubscriptions,
      revenueCents,
      adSpendCents,
    },
    conversion: {
      visitToSignupPct: pct(signups, visits),
      signupToAnalysisPct: pct(analyses, signups),
      analysisToLeadPct: pct(leadPurchases, analyses),
      leadToPurchasePct: pct(leadPurchases + paidSubscriptions, leadPurchases || analyses),
    },
    costs: {
      costPerSignupCents: signups ? Math.round(adSpendCents / signups) : null,
      costPerLeadCents: leadPurchases ? Math.round(adSpendCents / leadPurchases) : null,
    },
    channels: await channelBreakdown(start, end),
  };
}

async function channelBreakdown(start: Date, end: Date) {
  const events = await prisma.trafficEvent.groupBy({
    by: ["source"],
    where: {
      createdAt: { gte: start, lt: end },
      eventType: { in: ["page_view", "signup_completed", "analysis_event", "investment_analyze_run"] },
    },
    _count: { _all: true },
  });
  return events
    .map((e) => ({ source: e.source ?? "direct", count: e._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}
