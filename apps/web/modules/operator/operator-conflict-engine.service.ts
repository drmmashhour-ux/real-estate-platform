import type { AssistantRecommendation } from "./operator.types";
import type { OperatorConflictResolution, OperatorScoredRecommendation } from "./operator-v2.types";

const CRO_LIKE = new Set([
  "TEST_NEW_VARIANT",
  "UPDATE_CTA_PRIORITY",
  "PROMOTE_EXPERIMENT_WINNER",
]);

/**
 * Assign deterministic conflict groups for scored recommendations (same ids as AssistantRecommendation).
 */
export function assignConflictGroups(recs: AssistantRecommendation[]): Map<string, string> {
  const idToGroup = new Map<string, string>();

  const portfolioScales = recs.filter((r) => r.source === "PORTFOLIO" && r.actionType === "SCALE_CAMPAIGN");
  if (portfolioScales.length > 1) {
    const g = "portfolio:competing_scales";
    for (const r of portfolioScales) idToGroup.set(r.id, g);
  }

  const byCampaign = new Map<string, AssistantRecommendation[]>();
  for (const r of recs) {
    if (!r.targetId) continue;
    if (r.actionType === "SCALE_CAMPAIGN" || r.actionType === "PAUSE_CAMPAIGN") {
      if (!byCampaign.has(r.targetId)) byCampaign.set(r.targetId, []);
      byCampaign.get(r.targetId)!.push(r);
    }
  }
  for (const [tid, list] of byCampaign) {
    const hasS = list.some((x) => x.actionType === "SCALE_CAMPAIGN");
    const hasP = list.some((x) => x.actionType === "PAUSE_CAMPAIGN");
    if (hasS && hasP) {
      const g = `campaign:${tid}:scale_vs_pause`;
      for (const r of list) idToGroup.set(r.id, g);
    }
  }

  const byCroTarget = new Map<string, AssistantRecommendation[]>();
  for (const r of recs) {
    if (r.source !== "CRO" && r.source !== "AB_TEST") continue;
    if (!r.targetId || !CRO_LIKE.has(r.actionType)) continue;
    if (!byCroTarget.has(r.targetId)) byCroTarget.set(r.targetId, []);
    byCroTarget.get(r.targetId)!.push(r);
  }
  for (const [tid, list] of byCroTarget) {
    if (list.length > 1) {
      const g = `cro:${tid}:variant_or_promotion`;
      for (const r of list) idToGroup.set(r.id, g);
    }
  }

  const rt = recs.filter((r) => r.source === "RETARGETING" && r.actionType === "UPDATE_RETARGETING_MESSAGE_PRIORITY");
  const byRt = new Map<string, AssistantRecommendation[]>();
  for (const r of rt) {
    const tid = r.targetId ?? "none";
    if (!byRt.has(tid)) byRt.set(tid, []);
    byRt.get(tid)!.push(r);
  }
  for (const [tid, list] of byRt) {
    if (list.length > 1) {
      const g = `retarget:${tid}:message_conflict`;
      for (const r of list) idToGroup.set(r.id, g);
    }
  }

  return idToGroup;
}

export function applyConflictGroups(
  scored: OperatorScoredRecommendation[],
  groups: Map<string, string>,
): OperatorScoredRecommendation[] {
  return scored.map((s) => ({
    ...s,
    conflictGroup: groups.get(s.id) ?? s.conflictGroup ?? null,
  }));
}

/**
 * Lists conflict group keys that have more than one recommendation (informational).
 */
export function detectConflicts(scored: OperatorScoredRecommendation[]): string[] {
  const byG = new Map<string, OperatorScoredRecommendation[]>();
  for (const r of scored) {
    const g = r.conflictGroup;
    if (!g) continue;
    if (!byG.has(g)) byG.set(g, []);
    byG.get(g)!.push(r);
  }
  return [...byG.entries()].filter(([, arr]) => arr.length > 1).map(([g]) => g);
}

export function resolveConflicts(scoredRecommendations: OperatorScoredRecommendation[]): {
  kept: OperatorScoredRecommendation[];
  resolutions: OperatorConflictResolution[];
} {
  const byGroup = new Map<string, OperatorScoredRecommendation[]>();
  for (const r of scoredRecommendations) {
    const g = r.conflictGroup;
    if (!g) continue;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(r);
  }

  const dropped = new Set<string>();
  const resolutions: OperatorConflictResolution[] = [];

  for (const [group, arr] of byGroup) {
    if (arr.length < 2) continue;
    const sorted = [...arr].sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return a.id.localeCompare(b.id);
    });
    const winner = sorted[0]!;
    const droppedIds = sorted.slice(1).map((x) => x.id);
    for (const id of droppedIds) dropped.add(id);
    resolutions.push({
      conflictGroup: group,
      keptRecommendationId: winner.id,
      droppedRecommendationIds: droppedIds,
      reason: `Deterministic tie-break: highest priorityScore (${winner.priorityScore.toFixed(2)}) wins group "${group}".`,
    });
  }

  const kept = scoredRecommendations.filter((r) => !dropped.has(r.id));
  return { kept, resolutions };
}
