import { prisma } from "@/lib/db";

import type { InvestorLuxuryDashboardModel, RiskLevelLabel } from "../view-models";

import { formatCadCompactFromCents, formatMonthlyFromCents } from "./format-dashboard-currency";

function normalizeRisk(raw: string | null | undefined): RiskLevelLabel {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("high")) return "High";
  if (s.includes("low")) return "Low";
  if (s.includes("med")) return "Medium";
  return "Medium";
}

function occupancyFromFit(fit: number | null | undefined): string {
  if (fit == null || Number.isNaN(fit)) return "—";
  const clamped = Math.max(0, Math.min(100, Math.round(55 + fit * 8)));
  return `${clamped}%`;
}

export async function getInvestorDashboardData(userId: string): Promise<InvestorLuxuryDashboardModel> {
  const scenario = await prisma.portfolioScenario.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        orderBy: { createdAt: "desc" },
        take: 24,
      },
    },
  });

  if (!scenario || scenario.items.length === 0) {
    return {
      stats: {
        portfolioValueDisplay: "$0",
        monthlyRevenueDisplay: "$0",
        roiDisplay: "—",
        revenueAtRiskDisplay: "$0",
        protectedValueDisplay: "$0",
      },
      portfolio: [],
      opportunities: [],
      alerts: ["Create a portfolio scenario to unlock ROI, cash flow, and risk views."],
      hasPortfolioData: false,
    };
  }

  const sumPurchase = scenario.items.reduce((s, i) => s + i.purchasePriceCents, 0);
  const portfolioValueCents = sumPurchase > 0 ? sumPurchase : scenario.totalBudgetCents;
  const sumCash = scenario.items.reduce((s, i) => s + (i.projectedCashFlowCents ?? 0), 0);
  const monthlyCashCents = sumCash > 0 ? sumCash : scenario.projectedMonthlyCashFlowCents;
  const roiPct = scenario.projectedAverageRoiPercent ?? 0;

  const alertsDb = await prisma.investorPortfolioAlert.findMany({
    where: { userId, enabled: true },
    take: 6,
    select: { alertType: true, city: true, targetRoiPercent: true },
  });

  const alerts =
    alertsDb.length > 0
      ? alertsDb.map((a) =>
          a.city
            ? `${a.alertType.replace(/_/g, " ")} — ${a.city}`
            : `${a.alertType.replace(/_/g, " ")}`,
        )
      : [
          scenario.projectedRiskLevel
            ? `Modeled risk posture: ${scenario.projectedRiskLevel}.`
            : "Portfolio alerts will surface here when enabled.",
        ];

  const portfolio = scenario.items.map((it) => ({
    id: it.id,
    name:
      it.city?.trim() ||
      `Listing ${it.listingId.length > 10 ? `${it.listingId.slice(0, 8)}…` : it.listingId}`,
    location: it.city?.trim() || "—",
    revenueDisplay: formatMonthlyFromCents(it.estimatedRentCents ?? it.projectedCashFlowCents),
    occupancyDisplay: occupancyFromFit(it.fitScore ?? undefined),
    roiDisplay:
      it.projectedRoiPercent != null ? `${it.projectedRoiPercent.toFixed(1)}%` : `${roiPct.toFixed(1)}%`,
    risk: normalizeRisk(it.riskLevel ?? scenario.projectedRiskLevel),
  }));

  const opportunities =
    scenario.insightsJson && typeof scenario.insightsJson === "object"
      ? extractOpportunities(scenario.insightsJson)
      : [];

  return {
    stats: {
      portfolioValueDisplay: formatCadCompactFromCents(portfolioValueCents),
      monthlyRevenueDisplay: formatCadCompactFromCents(monthlyCashCents),
      roiDisplay: `${roiPct.toFixed(1)}%`,
      revenueAtRiskDisplay: formatCadCompactFromCents(Math.round(monthlyCashCents * 0.08)),
      protectedValueDisplay: formatCadCompactFromCents(Math.round(portfolioValueCents * 0.001)),
    },
    portfolio,
    opportunities,
    alerts,
    hasPortfolioData: true,
  };
}

function extractOpportunities(json: object): InvestorLuxuryDashboardModel["opportunities"] {
  const raw = json as Record<string, unknown>;
  const zones = raw.opportunityZones ?? raw.zones;
  if (!Array.isArray(zones)) return [];
  return zones.slice(0, 6).map((z, i) => {
    const o = z as Record<string, unknown>;
    return {
      id: `opp-${i}`,
      area: String(o.area ?? o.city ?? "Market"),
      label: String(o.label ?? o.signal ?? "Opportunity"),
      upsideDisplay: o.upsidePct != null ? `+${Number(o.upsidePct).toFixed(1)}%` : "+0%",
    };
  });
}
