import { prisma } from "@repo/db";
import { analyzeRoiPerformance } from "@/modules/investor-intelligence/roi-engine.service";
import { corporateStrategyLog } from "./corporate-strategy-logger";
import type { BottleneckInsight, BottleneckSeverity } from "./corporate-strategy.types";

const mk = (a: Partial<BottleneckInsight> & Pick<BottleneckInsight, "id" | "title" | "rationale" | "dataTrace" | "suggestedResponse" | "kind" | "severity">): BottleneckInsight => ({
  id: a.id,
  kind: a.kind,
  severity: a.severity,
  title: a.title,
  rationale: a.rationale,
  dataTrace: a.dataTrace,
  suggestedResponse: a.suggestedResponse,
});

/**
 * Operational friction signals; not root-cause certainty.
 */
export async function detectOrganizationalBottlenecks(): Promise<BottleneckInsight[]> {
  const out: BottleneckInsight[] = [];
  try {
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const roi = await analyzeRoiPerformance({ persist: false, lookbackDays: 120 });
    for (const r of roi) {
      if ((r.avgDealCycleDays ?? 0) > 60 && (r.wonDeals + r.lostDeals) > 2) {
        out.push(
          mk({
            id: `cyc-${r.scopeType}-${r.scopeKey}`.slice(0, 64),
            kind: "cycle_time",
            severity: (r.avgDealCycleDays! > 120 ? "high" : "medium") as BottleneckSeverity,
            title: "Long deal cycle in scope",
            rationale: `Observed mean cycle ≈${r.avgDealCycleDays}d in ${r.scopeType}/${r.scopeKey}. May reflect process, not individuals.`,
            dataTrace: (r.trace ?? [])[0] ?? "avgDealCycleDays",
            suggestedResponse: "Review stage SLAs, inspection/financing handoffs (operational, not auto-fix).",
          })
        );
      }
    }
    const groups = await prisma.deal
      .groupBy({
        by: ["brokerId"],
        where: { status: { notIn: ["closed", "cancelled"] }, updatedAt: { gte: from } },
        _count: { _all: true },
      })
      .catch(() => [] as { brokerId: string | null; _count: { _all: number } }[]);
    for (const g of groups) {
      if (g.brokerId && g._count._all > 25) {
        out.push(
          mk({
            id: `cap-broker-${g.brokerId}`.slice(0, 64),
            kind: "capacity",
            severity: g._count._all > 45 ? "high" : "medium",
            title: "Open-deal count elevated for one broker (relative to typical bands)",
            rationale: `Non-terminal deal count in window: ${g._count._all}. Suggests capacity or qualification review, not a judgment of performance.`,
            dataTrace: "deal.groupBy(brokerId) 90d open",
            suggestedResponse: "Triage with broker lead; reassign, pause intake, or add support — human decision.",
          })
        );
        break;
      }
    }
    for (const r of roi) {
      const w = r.wonDeals + r.lostDeals;
      if (r.scopeType === "SEGMENT" && w > 2 && (r.wonDeals / Math.max(1, w)) < 0.25) {
        out.push(
          mk({
            id: `conv-seg-${r.scopeKey}`.slice(0, 64),
            kind: "conversion",
            severity: "medium",
            title: "Segment conversion weak in the window",
            rationale: `Won/terminal mix low for ${r.scopeKey}; data may be sparse (advisory).`,
            dataTrace: `won=${r.wonDeals} total=${w}`,
            suggestedResponse: "Audit pipeline hygiene and handoffs before new spend in this band.",
          })
        );
        break;
      }
    }
    if (out.length > 5) {
      out.splice(5, out.length - 5);
    }
    corporateStrategyLog.bottlenecks({ n: out.length });
  } catch (e) {
    corporateStrategyLog.warn("detectOrganizationalBottlenecks", { err: e instanceof Error ? e.message : String(e) });
  }
  if (out.length === 0) {
    return [
      mk({
        id: "no-sharp",
        kind: "other",
        severity: "info",
        title: "No strong bottleneck in automated signals",
        rationale: "The current heuristics did not flag a sharp edge case. Manual review still recommended.",
        dataTrace: "empty/weak triggers",
        suggestedResponse: "Continue standard ops reviews.",
      }),
    ];
  }
  return out;
}
