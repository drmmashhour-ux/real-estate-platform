import type {
  CapitalAllocationConfidence,
  CapitalAllocationScopeType,
  CapitalRecommendationType,
  RoiScopeType,
} from "@prisma/client";
import { investIntelLog } from "./investor-intel-logger";
import type { CapitalAllocationView, RoiInsight } from "./investor-intelligence.types";
import { analyzeRoiPerformance } from "./roi-engine.service";

function confidenceFor(n: number): CapitalAllocationConfidence {
  if (n < 3) return "low";
  if (n < 10) return "medium";
  return "high";
}

/** Map ROI scope to capital record (STRATEGY → PRODUCT for same enum set). */
function toCapScope(t: RoiScopeType): CapitalAllocationScopeType {
  if (t === "STRATEGY") return "PRODUCT";
  return t as CapitalAllocationScopeType;
}

/**
 * Suggested allocation shifts; not execution orders.
 */
export async function generateCapitalAllocationRecommendations(): Promise<CapitalAllocationView[]> {
  const out: CapitalAllocationView[] = [];
  try {
    const ri = await analyzeRoiPerformance({ persist: true, lookbackDays: 150 });
    const withN: { r: RoiInsight; n: number }[] = ri
      .map((r) => ({ r, n: r.wonDeals + r.lostDeals }))
      .filter((x) => x.n > 0);
    if (withN.length === 0) {
      investIntelLog.alloc({ n: 0, note: "no_rows" });
      return [
        {
          recommendationKey: "maintain-diversified",
          scopeType: "MARKET",
          scopeKey: "global",
          recommendationType: "MAINTAIN",
          confidence: "low",
          rationale: ["Insufficient closed-deal sample in the lookback; avoid sharp budget moves from this view alone."],
          expectedImpact: { summary: "Wait for more outcomes before shifting spend.", signals: [] },
        },
      ];
    }
    const sorted = [...withN].sort((a, b) => (b.r.efficiencyScore ?? 0) - (a.r.efficiencyScore ?? 0));
    const strongs = sorted.slice(0, 4);
    const weaks = [...withN]
      .sort((a, b) => (a.r.efficiencyScore ?? 0) - (b.r.efficiencyScore ?? 0))
      .filter((x) => x.n >= 2)
      .slice(0, 3);
    for (const s of strongs) {
      if ((s.r.efficiencyScore ?? 0) < 0.4) break;
      out.push({
        recommendationKey: `inc-${toCapScope(s.r.scopeType)}-${s.r.scopeKey}`.slice(0, 120),
        scopeType: toCapScope(s.r.scopeType),
        scopeKey: s.r.scopeKey,
        recommendationType: "INCREASE",
        confidence: confidenceFor(s.n),
        rationale: [
          "Higher composite efficiency in this scope vs the sample (explanation in ROI trace).",
          "Not a performance guarantee; confirm with local pipeline quality.",
        ],
        expectedImpact: {
          summary: "Hypothesis: similar deal flow may benefit from extra attention in this bucket.",
          signals: [`n=${s.n}`, `eff~${(s.r.efficiencyScore ?? 0).toFixed(2)}`],
        },
      });
    }
    for (const w of weaks) {
      out.push({
        recommendationKey: `red-${toCapScope(w.r.scopeType)}-${w.r.scopeKey}`.slice(0, 120),
        scopeType: toCapScope(w.r.scopeType),
        scopeKey: w.r.scopeKey,
        recommendationType: "REDUCE",
        confidence: "low",
        rationale: [
          "Weaker band in the same lookback; consider pausing scale until signal improves.",
          "Does not assert fault — may be data sparsity.",
        ],
        expectedImpact: { summary: "Risk-of-waste reduction (operational, not legal).", signals: [`n=${w.n}`] },
      });
    }
    out.push({
      recommendationKey: "experiment-channel-rotate",
      scopeType: "CHANNEL",
      scopeKey: "rotate_probe",
      recommendationType: "EXPERIMENT",
      confidence: "medium",
      rationale: ["Small, labeled budget on alternate channels to separate signal from noise."],
      expectedImpact: { summary: "Comparative learning; no implied ROI floor.", signals: [] },
    });
    investIntelLog.alloc({ n: out.length });
    return out;
  } catch (e) {
    investIntelLog.warn("generateCapitalAllocation", { err: e instanceof Error ? e.message : String(e) });
    return [];
  }
}
