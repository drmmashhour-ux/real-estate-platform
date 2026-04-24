import { prisma } from "@/lib/db";
import { detectCompanyPatterns } from "./company-pattern-detection.engine";
import type { CompanyMetricsSnapshot } from "./company-outcome-aggregator.service";

/** Feeds CEO weekly planning with explicit company-evolution signals (no autonomous execution). */
export async function loadCompanyAiCeoBridgeContext() {
  const [monthly, proposed, rolledOut, topMemory] = await Promise.all([
    prisma.companyOutcomeWindow.findFirst({
      where: { periodType: "MONTHLY" },
      orderBy: { periodEnd: "desc" },
    }),
    prisma.companyAdaptationEvent.findMany({
      where: { status: "PROPOSED" },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.companyAdaptationEvent.findMany({
      where: { status: { in: ["ROLLED_OUT", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.companyStrategyMemory.findMany({
      orderBy: { score: "desc" },
      take: 6,
    }),
  ]);

  const metrics = (monthly?.metricsJson ?? null) as CompanyMetricsSnapshot | null;
  const patterns = detectCompanyPatterns(metrics);

  const deprioritizeSegments: string[] = [];
  if (metrics && metrics.deals.closeRate < 0.12) {
    deprioritizeSegments.push("Low close-rate intake segments until execution latency improves");
  }
  if (metrics && metrics.bookings.conversionToConfirmed < 0.28) {
    deprioritizeSegments.push("Low-conversion BNHub inventory until host SLA experiment completes");
  }

  const doubleDown: string[] = [];
  if (metrics && metrics.deals.closeRate >= 0.22) {
    doubleDown.push("Mirror recent high close-rate deal paths in opportunity ranking hints");
  }
  if (patterns.some((p) => p.id === "investor_packaging_gap")) {
    doubleDown.push("Investor IC pack pairing — compounding institutional quality");
  }

  return {
    patterns: patterns.slice(0, 5),
    proposedAdaptations: proposed,
    rolledOutAdaptations: rolledOut,
    topPlaybook: topMemory,
    deprioritizeSegments,
    doubleDown,
  };
}
