import { getPricingImpactSummary } from "@/modules/bnhub-revenue/bnhub-pricing-impact.service";
import { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { getDailyRevenueTrend } from "@/modules/bnhub-revenue/bnhub-revenue-trend.service";
import { generateHostRevenueNarrative } from "@/modules/revenue/narrative/narrative-generator.service";
import type { NarrativeSummary } from "@/modules/revenue/narrative/narrative.types";
import { jsonSafePayload } from "@/modules/revenue/report/pdf-report.service";

function emptyNarrative(reason: string): NarrativeSummary {
  return {
    headline: "Narrative unavailable for this export",
    overview: reason,
    facts: [],
    risks: [],
    opportunities: [],
    closing: "Regenerate after dashboard services recover — metrics above remain from live aggregates when loaded.",
  };
}

/** Shared dashboard → ReportLab JSON for BNHub investor/board PDF (host scoped by User.id). */
export async function buildBnhubInvestorReportPayload(hostUserId: string): Promise<
  | {
      ok: true;
      payload: Record<string, unknown>;
      summary: Awaited<ReturnType<typeof getRevenueDashboardSummary>>;
    }
  | { ok: false; error: string; detail?: string }
> {
  const settled = await Promise.allSettled([
    getRevenueDashboardSummary(hostUserId),
    getDailyRevenueTrend(hostUserId, 30),
    getPricingImpactSummary(hostUserId),
    generateHostRevenueNarrative(hostUserId, { persist: false }),
  ]);

  if (settled[0].status === "rejected" || !settled[0].value) {
    return {
      ok: false,
      error: "Dashboard aggregates unavailable — PDF not generated.",
      detail: settled[0].status === "rejected" ? String(settled[0].reason) : "",
    };
  }

  const summary = settled[0].value;
  const trend = settled[1].status === "fulfilled" ? settled[1].value : [];
  const pricingImpact =
    settled[2].status === "fulfilled"
      ? settled[2].value
      : { appliedCount: 0, avgDelta: 0, latestExecutions: [] as never[] };
  const narrative =
    settled[3].status === "fulfilled"
      ? settled[3].value
      : emptyNarrative(
          settled[3].status === "rejected"
            ? `Rules narrative failed: ${String(settled[3].reason)}`
            : "Rules narrative did not return."
        );

  const warnings: string[] = [];
  if (settled[1].status === "rejected") warnings.push(`Trend omitted: ${String(settled[1].reason)}`);
  if (settled[2].status === "rejected") warnings.push(`Pricing impact omitted: ${String(settled[2].reason)}`);

  const payload = jsonSafePayload({
    generatedAt: new Date().toISOString(),
    meta: {
      source: "BNHub analytics",
      periodNote:
        "Portfolio KPIs: last 30 UTC days (check-in window). Trend: booking creation dates, 30 UTC days.",
      disclaimer:
        "Generated from BNHub analytics — deterministic metrics from platform data; not financial advice.",
      reportLabel: "BNHub Board / Investor Report — data from BNHub analytics (no fabricated KPIs).",
      ...(warnings.length ? { exportWarnings: warnings } : {}),
    },
    summary,
    trend,
    pricingImpact,
    narrative,
  });

  return { ok: true, payload, summary };
}
