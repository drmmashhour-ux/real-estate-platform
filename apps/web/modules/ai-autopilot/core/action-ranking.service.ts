import type { ProposedAction, RankBucket, RankedAction } from "../ai-autopilot.types";
import { explainAction } from "../ai-autopilot.explainer";
import { profitPriorityScore } from "./profit-priority.service";

function bucketFor(action: ProposedAction): RankBucket {
  if (action.riskLevel === "CRITICAL" || action.riskLevel === "HIGH") return "observe_only";
  if (action.severity === "high" || action.severity === "critical") return "do_today";
  if (action.severity === "medium") return "do_this_week";
  return "do_now";
}

export function rankProposedActions(actions: ProposedAction[]): RankedAction[] {
  const ranked: RankedAction[] = actions.map((a) => {
    const bucket = bucketFor(a);
    const explainSummary = explainAction(a).summary;
    return {
      ...a,
      bucket,
      score: 0,
      explainSummary,
      confidence: typeof a.reasons.confidence === "number" ? (a.reasons.confidence as number) : 0.7,
    };
  });

  for (const r of ranked) {
    r.score = profitPriorityScore(r);
  }

  return ranked.sort((a, b) => {
    const s = b.score - a.score;
    if (s !== 0) return s;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });
}
