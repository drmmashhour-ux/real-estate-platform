import { createHash } from "crypto";
import type { AssistantRecommendation } from "./operator.types";

/** Deterministic id so the same logical recommendation persists across feed runs. */
export function stableRecommendationId(r: Pick<AssistantRecommendation, "source" | "actionType" | "targetId" | "title">): string {
  const raw = [r.source, r.actionType, r.targetId ?? "", r.title].join("|");
  const h = createHash("sha256").update(raw).digest("hex");
  return `opr_${h.slice(0, 28)}`;
}

export function withStableIds(recs: AssistantRecommendation[]): AssistantRecommendation[] {
  return recs.map((r) => ({ ...r, id: stableRecommendationId(r) }));
}
