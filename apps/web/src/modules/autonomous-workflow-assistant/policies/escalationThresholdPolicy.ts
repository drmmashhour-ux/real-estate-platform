/** When to recommend escalation (deterministic). */
export function shouldRecommendEscalation(args: { blockingIssueCount: number; contradictionCount: number; criticalGraphIssues: number }) {
  if (args.criticalGraphIssues > 0) return true;
  if (args.blockingIssueCount >= 2) return true;
  if (args.contradictionCount >= 1 && args.blockingIssueCount >= 1) return true;
  return false;
}
