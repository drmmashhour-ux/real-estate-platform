import { prisma } from "@/lib/db";
import { logCompanyAiAudit } from "./company-ai-audit.service";
import { detectCompanyPatterns } from "./company-pattern-detection.engine";
import type { CompanyMetricsSnapshot } from "./company-outcome-aggregator.service";

export type WeeklyReflectionReport = {
  kind: "weekly";
  improved: string[];
  worsened: string[];
  changed: string[];
  nextTests: string[];
  generatedAt: string;
};

export type MonthlyAdaptationReport = {
  kind: "monthly";
  strongestPatterns: { id: string; statement: string; confidence: number }[];
  failedPatterns: string[];
  recommendedShifts: string[];
  nextCyclePriorities: string[];
  generatedAt: string;
};

export async function generateWeeklyReflectionReport(): Promise<WeeklyReflectionReport> {
  const win = await prisma.companyOutcomeWindow.findFirst({
    where: { periodType: "WEEKLY" },
    orderBy: { periodEnd: "desc" },
  });
  const metrics = (win?.metricsJson ?? null) as CompanyMetricsSnapshot | null;
  const patterns = detectCompanyPatterns(metrics);

  const improved: string[] = [];
  const worsened: string[] = [];
  const changed: string[] = [];
  if (metrics) {
    if (metrics.deals.closeRate >= 0.2) improved.push("Deal close rate healthy for the weekly window.");
    if (metrics.deals.closeRate < 0.12) worsened.push("Deal close rate dipped — inspect stalled negotiations.");
    if (metrics.bookings.conversionToConfirmed >= 0.45) improved.push("BNHub confirmation conversion solid.");
    if (metrics.bookings.conversionToConfirmed < 0.28) worsened.push("Booking confirmation conversion weakened.");
    changed.push(`Recorded ${metrics.deals.created} new deals and ${metrics.bookings.created} new bookings in window.`);
  }

  const nextTests = [
    "A/B host reminder cadence for BNHub pending approvals.",
    "Segment-level close-rate review for top 3 cities.",
    "Investor memo → IC pack pairing SLA experiment.",
  ].slice(0, 4);

  const report: WeeklyReflectionReport = {
    kind: "weekly",
    improved,
    worsened,
    changed,
    nextTests,
    generatedAt: new Date().toISOString(),
  };

  await logCompanyAiAudit({
    action: "report_generated",
    payload: { kind: report.kind, patternCount: patterns.length },
  });

  return report;
}

export async function generateMonthlyAdaptationReport(): Promise<MonthlyAdaptationReport> {
  const win = await prisma.companyOutcomeWindow.findFirst({
    where: { periodType: "MONTHLY" },
    orderBy: { periodEnd: "desc" },
  });
  const metrics = (win?.metricsJson ?? null) as CompanyMetricsSnapshot | null;
  const patterns = detectCompanyPatterns(metrics);

  const rejected = await prisma.companyAdaptationEvent.findMany({
    where: { status: "REJECTED", createdAt: { gte: new Date(Date.now() - 35 * 864e5) } },
    take: 20,
    select: { rationaleJson: true, adaptationType: true },
  });

  const report: MonthlyAdaptationReport = {
    kind: "monthly",
    strongestPatterns: patterns.slice(0, 6).map((p) => ({
      id: p.id,
      statement: p.statement,
      confidence: p.confidence,
    })),
    failedPatterns: rejected.map(
      (r) => `${r.adaptationType}:${(r.rationaleJson as { why?: string })?.why ?? "rejected"}`,
    ),
    recommendedShifts: patterns.slice(0, 4).map((p) => p.suggestedAdaptation.summary),
    nextCyclePriorities: [
      "Approve or reject queued company adaptations with documented rationale.",
      "Tie rolled-out weights to portfolio + ranking services via feature flags.",
      "Review compliance queue pressure vs execution throughput.",
    ],
    generatedAt: new Date().toISOString(),
  };

  await logCompanyAiAudit({
    action: "report_generated",
    payload: { kind: report.kind, strongest: report.strongestPatterns.length },
  });

  return report;
}

export async function loadRecentAdaptationSummary(days = 90) {
  const since = new Date(Date.now() - days * 864e5);
  const rows = await prisma.companyAdaptationEvent.findMany({
    where: { createdAt: { gte: since }, status: { in: ["ROLLED_OUT", "APPROVED", "PROPOSED", "REJECTED"] } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return rows;
}
