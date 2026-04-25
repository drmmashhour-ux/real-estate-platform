import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  DataSourceTrace,
  ExecutiveReportView,
  ExecutiveSummarySection,
  RecommendationsSection,
} from "./executive-report.types";

type ReportCore = Omit<ExecutiveReportView, "narrative" | "recommendations">;
import { buildAutonomySection } from "./autonomy-builder.service";
import { buildInvestorSection } from "./investor-builder.service";
import { buildKpiSection } from "./kpi-builder.service";
import { buildPortfolioSection } from "./portfolio-builder.service";
import { buildStrategySection } from "./strategy-builder.service";
import { logExecutiveReportGenerated } from "./executive-report.logging";
import { generateExecutiveNarrative } from "./narrative-engine.service";

function trace(tables: string[], description: string): DataSourceTrace {
  return { tables, description };
}

function buildRecommendations(report: Omit<ExecutiveReportView, "narrative" | "schemaVersion">): RecommendationsSection {
  const items: string[] = [];

  if (report.portfolio.highRiskDeals.length > 0) {
    items.push(
      `Review ${report.portfolio.highRiskDeals.length} flagged higher-risk pipeline row(s) (underwriting labels/recommendations in portfolio section).`
    );
  }
  if (report.kpi.committeeFavorableRate.value != null && report.kpi.committeeFavorableRate.value < 0.5) {
    items.push("Committee favorable ratio is below half in this window — validate decision wording consistency and case mix.");
  }
  if (report.autonomy.blockedOrRejected.value != null && report.autonomy.blockedOrRejected.value > 0) {
    items.push("Reconcile autonomy blocked/rejected/skipped counts against policy configuration and recent mode changes.");
  }
  if (report.investor.capitalStackTotals.dealsWithStack === 0) {
    items.push("Complete or refresh capital stack inputs if board capital view is required.");
  }

  return {
    items,
    trace: trace(
      ["ExecutiveReportView"],
      "Recommendations are rule-based prompts derived only from fields in this report object."
    ),
  };
}

function buildSummary(periodKey: string, kpiRange: { startUtc: string; endUtcExclusive: string }): ExecutiveSummarySection {
  return {
    headline: `Executive data pack — ${periodKey}`,
    periodLabel: periodKey,
    dataFreshnessNote: `KPI window UTC: ${kpiRange.startUtc} to ${kpiRange.endUtcExclusive} (exclusive end). Narrative is template-bound to JSON fields.`,
  };
}

export type GenerateExecutiveReportResult =
  | { ok: true; reportId: string; view: ExecutiveReportView }
  | { ok: false; error: string; reportId?: string };

/**
 * Assembles sections, narrative, persists `ExecutiveReport`. Does not throw.
 */
export async function generateExecutiveReport(periodKey: string): Promise<GenerateExecutiveReportResult> {
  try {
    const [kpi, strategy, portfolio, investor, autonomy] = await Promise.all([
      buildKpiSection(periodKey),
      buildStrategySection(periodKey),
      buildPortfolioSection(),
      buildInvestorSection(periodKey),
      buildAutonomySection(periodKey),
    ]);

    const generatedAtUtc = new Date().toISOString();
    const summary = buildSummary(periodKey, kpi.range);
    const core: ReportCore = {
      schemaVersion: 1,
      periodKey,
      generatedAtUtc,
      summary,
      kpi,
      strategy,
      portfolio,
      investor,
      autonomy,
    };
    const recommendations = buildRecommendations(core);
    const narrative = generateExecutiveNarrative({ ...core, recommendations });
    const view: ExecutiveReportView = { ...core, recommendations, narrative };

    const row = await prisma.executiveReport.create({
      data: {
        periodKey,
        reportJson: view as unknown as Prisma.InputJsonValue,
        summaryText: narrative.summaryText,
        status: "GENERATED",
      },
    });

    logExecutiveReportGenerated({ reportId: row.id, periodKey });
    return { ok: true, reportId: row.id, view };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate_failed";
    try {
      const row = await prisma.executiveReport.create({
        data: {
          periodKey,
          reportJson: { error: msg, periodKey } as unknown as Prisma.InputJsonValue,
          summaryText: `Report generation failed: ${msg}`,
          status: "FAILED",
          errorMessage: msg,
        },
      });
      logExecutiveReportGenerated({ reportId: row.id, periodKey, failed: true });
      return { ok: false, error: msg, reportId: row.id };
    } catch {
      return { ok: false, error: msg };
    }
  }
}
