import type { AssistantRecommendation, RecommendationConflict } from "./operator.types";
import type { AssistantFeedResponse } from "./assistant-aggregator.service";

function priorityScore(r: AssistantRecommendation, hasConflict: boolean): number {
  let s = 0;
  if (r.confidenceLabel === "HIGH") s += 40;
  else if (r.confidenceLabel === "MEDIUM") s += 22;
  else s += 8;
  if (hasConflict) s += 25;
  if (r.actionType === "SCALE_CAMPAIGN" || r.actionType === "PAUSE_CAMPAIGN") s += 6;
  if (r.actionType === "MONITOR" || r.actionType === "NO_ACTION") s -= 30;
  return s;
}

function conflictTargets(conflicts: RecommendationConflict[]): Set<string | null> {
  return new Set(conflicts.map((c) => c.targetId ?? null));
}

/**
 * Operator UX ordering — informational only; does not execute actions.
 */
export function getOperatorQueue(feed: AssistantFeedResponse): AssistantRecommendation[] {
  const targets = conflictTargets(feed.conflicts);
  const pool = [...feed.topRecommendations, ...feed.blockedRecommendations.map((b) => b.recommendation)];
  const seen = new Set<string>();
  const deduped: AssistantRecommendation[] = [];
  for (const r of pool) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    deduped.push(r);
  }

  return deduped.sort(
    (a, b) =>
      priorityScore(b, targets.has(b.targetId ?? null)) - priorityScore(a, targets.has(a.targetId ?? null)),
  );
}

export function getHighPriorityPendingActions(feed: AssistantFeedResponse): AssistantRecommendation[] {
  return feed.topRecommendations.filter((r) => r.confidenceLabel === "HIGH");
}

export function getBlockedActions(feed: AssistantFeedResponse) {
  return feed.blockedRecommendations;
}

export function getMonitoringRecommendations(feed: AssistantFeedResponse): AssistantRecommendation[] {
  return feed.monitoringOnly;
}
