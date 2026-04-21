import type { SerializedEsgAction } from "./esg-action.types";
import type { RetrofitPlannerContext } from "./esg-retrofit.types";
import { inferRetrofitPhase } from "./esg-retrofit-generator";

const PRIORITY_RANK: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/** Higher = more urgent in portfolio / plan ordering. */
export type PrioritizedRetrofitSource = SerializedEsgAction & {
  phase: number;
  urgencyScore: number;
};

export function prioritizeActionsForRetrofit(
  actions: SerializedEsgAction[],
  ctx: RetrofitPlannerContext,
  acquisitionBlockWeight = 14
): PrioritizedRetrofitSource[] {
  const gap = Math.max(0, 72 - (ctx.compositeScore ?? 40));

  const scored = actions.map((a) => {
    const phase = inferRetrofitPhase(a);
    const prio = PRIORITY_RANK[a.priority] ?? 9;
    const blocker =
      a.priority === "CRITICAL" || String(a.reasonCode).includes("BLOCK") ? acquisitionBlockWeight : 0;
    const carbonLift = Math.min(18, ((a.estimatedCarbonImpact ?? 0) / 100) * 18);
    const confidenceGap = Math.min(16, ((100 - (ctx.evidenceConfidence ?? 0)) / 100) * (a.estimatedConfidenceImpact ?? 0));
    const scoreGapBoost = gap * 0.15;

    let costPenalty = 0;
    const cb = a.estimatedCostBand;
    if (cb === "HIGH") costPenalty = 6;
    else if (cb === "MEDIUM") costPenalty = 3;

    const urgencyScore =
      blocker +
      carbonLift +
      confidenceGap +
      scoreGapBoost -
      prio * 4 -
      costPenalty +
      (phase <= 2 ? 4 : 0);

    return { ...a, phase, urgencyScore };
  });

  return scored.sort((x, y) => {
    if (y.urgencyScore !== x.urgencyScore) return y.urgencyScore - x.urgencyScore;
    if (x.phase !== y.phase) return x.phase - y.phase;
    return PRIORITY_RANK[x.priority] - PRIORITY_RANK[y.priority];
  });
}

/** Order retrofit rows within a phase: deferred / gated items last. */
export function sortRetrofitRowsWithinPhase<
  T extends {
    phase: number;
    dependenciesJson: unknown;
    notes: string | null;
  },
>(rows: T[]): T[] {
  const gated = (r: T) => {
    const deps = r.dependenciesJson as { deferred?: boolean } | null | undefined;
    const notes = r.notes ?? "";
    return Boolean(deps?.deferred) || notes.includes("baseline");
  };
  return [...rows].sort((a, b) => {
    const ga = gated(a) ? 1 : 0;
    const gb = gated(b) ? 1 : 0;
    return ga - gb;
  });
}
