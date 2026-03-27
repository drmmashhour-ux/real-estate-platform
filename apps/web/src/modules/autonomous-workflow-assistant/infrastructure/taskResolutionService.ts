import type { TaskResolutionCheck } from "@/src/modules/autonomous-workflow-assistant/domain/autonomousWorkflow.types";

/** Current legal/validation snapshot used to auto-complete stale pending tasks safely. */
export type ResolutionSnapshot = {
  missingFields: string[];
  blockingIssues: string[];
  contradictions: string[];
  knowledgeRuleBlocks: string[];
};

function issueStillPresent(message: string, current: string[]): boolean {
  const m = message.trim();
  if (!m) return false;
  return current.some((c) => c.includes(m) || m.includes(c.slice(0, Math.min(40, c.length))));
}

export function isResolutionCheckSatisfied(check: TaskResolutionCheck, snapshot: ResolutionSnapshot): boolean {
  switch (check.kind) {
    case "missing_fields":
      return check.keys.every((k) => !snapshot.missingFields.includes(k));
    case "graph_blockers":
      if (snapshot.blockingIssues.length === 0) return true;
      if (check.messages.length === 0) return false;
      return check.messages.every((msg) => !issueStillPresent(msg, snapshot.blockingIssues));
    case "contradictions":
      return snapshot.contradictions.length === 0;
    case "knowledge_blocks":
      return snapshot.knowledgeRuleBlocks.length === 0;
    default:
      return false;
  }
}

export function findPendingTaskIdsToAutoComplete(
  pendingTasks: Array<{ id: string; status: string; payload: unknown }>,
  snapshot: ResolutionSnapshot,
): string[] {
  const ids: string[] = [];
  for (const t of pendingTasks) {
    if (t.status !== "pending") continue;
    const payload = t.payload as { resolutionCheck?: TaskResolutionCheck } | null;
    const rc = payload?.resolutionCheck;
    if (!rc) continue;
    if (isResolutionCheckSatisfied(rc, snapshot)) ids.push(t.id);
  }
  return ids;
}
