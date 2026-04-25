import { generateCapitalAllocationRecommendations } from "@/modules/investor-intelligence/capital-allocation.engine";
import { corporateStrategyLog } from "./corporate-strategy-logger";
import type { BudgetStrategy, BudgetLineAction, BudgetStrategyLine, StrategyTriage } from "./corporate-strategy.types";

const ADV =
  "Advisory reallocation of marketing/sales focus — not a commitment to fund any line; not a forecast of profit. Confirm with finance.";

function toAction(t: string, key: string): { action: BudgetLineAction; pr: StrategyTriage } {
  if (t === "INCREASE") return { action: "increase", pr: "medium" };
  if (t === "REDUCE") return { action: "reduce", pr: "medium" };
  if (t === "EXPERIMENT") return { action: "experiment", pr: "low" };
  if (t === "MAINTAIN" && key === "global") return { action: "maintain", pr: "low" };
  return { action: "maintain", pr: "low" };
}

function scopeMap(st: string): "segment" | "market" | "channel" | "product" {
  if (st === "SEGMENT") return "segment";
  if (st === "MARKET" || st === "BROKER") return "market";
  if (st === "CHANNEL") return "channel";
  if (st === "PRODUCT") return "product";
  return "product";
}

/**
 * Budget narrative from existing capital/ROI module outputs — re-labeled, no new financial facts.
 */
export async function generateBudgetStrategy(): Promise<BudgetStrategy> {
  const dataSources: string[] = [
    "capital allocation engine (INCREASE/REDUCE/MAINTAIN/EXPERIMENT)",
    "traces: same RoiPerformanceAggregate / deal heuristics as investor capital module",
  ];
  const out: BudgetStrategy = { disclaimer: ADV, dataSources, lines: [] };
  try {
    const recs = await generateCapitalAllocationRecommendations();
    for (const r of recs) {
      const { action, pr } = toAction(r.recommendationType, r.scopeKey);
      const line: BudgetStrategyLine = {
        label: `${r.scopeType}:${r.scopeKey}`.slice(0, 120),
        scope: scopeMap(r.scopeType),
        scopeKey: r.scopeKey,
        action,
        priority: (r.confidence === "high" ? "high" : pr) as StrategyTriage,
        rationale: [...(r.rationale ?? []), `Expected (qualitative): ${r.expectedImpact?.summary ?? "see trace"}.`],
        dataTrace: `recommendationKey=${r.recommendationKey} capitalConf=${r.confidence}`,
      };
      out.lines.push(line);
    }
    corporateStrategyLog.budget({ lines: out.lines.length });
  } catch (e) {
    corporateStrategyLog.warn("generateBudgetStrategy", { err: e instanceof Error ? e.message : String(e) });
  }
  if (out.lines.length === 0) {
    out.lines.push({
      label: "diversified-hold",
      scope: "market",
      scopeKey: "n/a",
      action: "maintain",
      priority: "low",
      rationale: ["No capital recommendations returned; avoid sharp budget moves without fresh outcomes."],
      dataTrace: "empty capital_alloc output",
    });
  }
  return out;
}
