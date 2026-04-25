import { PlatformRole } from "@prisma/client";
import { prisma } from "@repo/db";
import { engineFlags } from "@/config/feature-flags";
import { detectOrganizationalBottlenecks } from "./bottleneck.engine";
import { generateBudgetStrategy } from "./budget-strategy.engine";
import { corporateStrategyLog } from "./corporate-strategy-logger";
import type { CorporateStrategyView } from "./corporate-strategy.types";
import { generateHiringStrategy } from "./hiring-strategy.engine";
import { generateProductRoadmapStrategy } from "./product-roadmap.engine";
import { generateQuarterlyPlan } from "./quarterly-plan.engine";
import { analyzeStrategicRisks } from "./risk.engine";

const DISCLAIMER =
  "Advisory, decision-support only. Not a promise of outcomes. Not a substitute for legal, tax, or regulated employment/finance process. Traces: internal aggregates and CRM/brokerage signals as documented per section.";

/**
 * Assembles a board-style strategy snapshot. Persists best-effort when admin + feature flag.
 */
export async function buildCorporateStrategySnapshot(
  periodKey = "90d_rolling_v1",
  ctx?: { writeDb?: boolean; role?: PlatformRole | null }
): Promise<CorporateStrategyView> {
  const writeDb = ctx?.writeDb !== false;
  const role = ctx?.role;
  const dataSources = [
    "Hiring: deal load, broker groupBy, expansion opportunities, ROI",
    "Budget: capital allocation engine",
    "Roadmap: strategy ROI + weak segments",
    "Bottlenecks: deal cycles, broker open counts, win-rate bands",
    "Risks: market concentration, data sparsity",
  ];
  const empty: CorporateStrategyView = {
    periodKey,
    generatedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER,
    dataSources: [],
    summary: { headline: "Unavailable", bullets: [] },
    hiring: { disclaimer: "", dataSources: [], roles: [] },
    budget: { disclaimer: "", dataSources: [], lines: [] },
    roadmap: { disclaimer: "", dataSources: [], prioritize: [], deprioritize: [] },
    bottlenecks: [],
    risks: [],
    quarterly: { disclaimer: "", topPriorities: [], hiringFocus: [], budgetFocus: [], productFocus: [], expansionFocus: [], riskMitigation: [] },
  };
  try {
    const [hiring, budget, roadmap, bottlenecks, risks] = await Promise.all([
      generateHiringStrategy(),
      generateBudgetStrategy(),
      generateProductRoadmapStrategy(),
      detectOrganizationalBottlenecks(),
      analyzeStrategicRisks(),
    ]);
    const quarterly = generateQuarterlyPlan(hiring, budget, roadmap, bottlenecks, risks);
    const bullets: string[] = [
      `Hiring: ${hiring.roles.length} role line(s) — ${hiring.roles[0]?.kind ?? "n/a"}`,
      `Budget: ${budget.lines.length} line(s) (from capital model)`,
      `Bottlenecks: ${bottlenecks.length} item(s)`,
    ];
    if (quarterly.topPriorities[0]) {
      bullets.push(`Q priority: ${quarterly.topPriorities[0].title.slice(0, 100)}`);
    }
    const view: CorporateStrategyView = {
      periodKey,
      generatedAt: new Date().toISOString(),
      disclaimer: DISCLAIMER,
      dataSources,
      summary: {
        headline: "Strategic view from platform signals (advisory, not a commitment)",
        bullets,
      },
      hiring,
      budget,
      roadmap,
      bottlenecks,
      risks,
      quarterly,
    };
    if (writeDb && engineFlags.corporateStrategyV1 && role === PlatformRole.ADMIN) {
      try {
        await prisma.corporateStrategySnapshot.create({
          data: {
            periodKey: view.periodKey,
            summaryJson: view.summary as object,
            hiringStrategyJson: view.hiring as object,
            budgetStrategyJson: view.budget as object,
            roadmapStrategyJson: view.roadmap as object,
            bottlenecksJson: view.bottlenecks as object,
            risksJson: view.risks as object,
          },
        });
      } catch {
        /* */
      }
    }
    return view;
  } catch (e) {
    corporateStrategyLog.warn("buildCorporateStrategySnapshot", { err: e instanceof Error ? e.message : String(e) });
    return { ...empty, dataSources, disclaimer: empty.disclaimer + " Partial failure building snapshot; sections may be empty." };
  }
}
