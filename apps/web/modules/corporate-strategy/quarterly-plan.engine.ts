import type { HiringStrategy, BudgetStrategy, ProductRoadmapStrategy, BottleneckInsight, StrategicRisk, QuarterlyPlan } from "./corporate-strategy.types";
import { corporateStrategyLog } from "./corporate-strategy-logger";

const ADV =
  "Narrative synthesis from the same sub-engines. Not a board pack substitute; not targets or OKRs. Review with leadership before sharing.";

/**
 * Five priority slots + four focus areas — from inputs only.
 */
export function generateQuarterlyPlan(
  hi: HiringStrategy,
  b: BudgetStrategy,
  p: ProductRoadmapStrategy,
  bl: BottleneckInsight[],
  risks: StrategicRisk[]
): QuarterlyPlan {
  const raw: QuarterlyPlan["topPriorities"] = [];
  if (b.lines[0]) {
    raw.push({
      rank: raw.length + 1,
      title: `Budget / go-to-market: ${b.lines[0]!.action} — ${b.lines[0]!.label}`,
      rationale: b.lines[0]!.rationale[0] ?? "",
      category: "BUDGET",
    });
  }
  if (hi.roles[0]) {
    const r0 = hi.roles[0]!;
    raw.push({
      rank: raw.length + 1,
      title: `Hiring: ${r0.kind} (${r0.priority} priority)`,
      rationale: r0.rationale[0] ?? "",
      category: "HIRING",
    });
  }
  if (p.prioritize[0]) {
    const t = p.prioritize[0]!;
    raw.push({ rank: raw.length + 1, title: `Product: ${t.title}`, rationale: t.rationale[0] ?? "", category: "PRODUCT" });
  }
  const b0 = bl[0];
  if (b0 && b0.kind !== "other") {
    raw.push({ rank: raw.length + 1, title: `Ops: ${b0.title}`, rationale: b0.rationale, category: "OPS" });
  } else {
    raw.push({
      rank: raw.length + 1,
      title: "Ops: maintain pipeline review cadence",
      rationale: "No sharp automated bottleneck; governance still required.",
      category: "OPS",
    });
  }
  if (risks[0]) {
    const r0 = risks[0]!;
    raw.push({ rank: raw.length + 1, title: `Risk: ${r0.type}`, rationale: r0.rationale, category: "EXPANSION" });
  }
  const top = raw.map((x, i) => ({ ...x, rank: i + 1 })).slice(0, 5);
  const q: QuarterlyPlan = {
    disclaimer: ADV,
    topPriorities: top,
    hiringFocus: hi.roles.map((r) => `${r.kind} (${r.priority}): ${r.rationale[0] ?? ""}`.trim()).slice(0, 4),
    budgetFocus: b.lines.map((l) => `${l.action} ${l.scope} ${l.scopeKey}`.trim()).slice(0, 4),
    productFocus: p.prioritize.map((i) => i.title).slice(0, 4),
    expansionFocus: [
      "Tie any geographic expansion to the expansion & investor intelligence modules; validate capacity from hiring/bottlenecks (advisory).",
    ],
    riskMitigation: risks.map((r) => r.mitigation).slice(0, 4),
  };
  corporateStrategyLog.quarterly({ p: top.length });
  return q;
}
