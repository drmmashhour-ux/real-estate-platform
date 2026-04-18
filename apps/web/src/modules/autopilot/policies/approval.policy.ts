/**
 * Whether an action should stay in a human/owner approval queue before side effects.
 * Only internal candidate tags may skip approval; everything else stays review-first.
 * Execution policy (`execution.policy.ts`) still gates SAFE_AUTOPILOT auto-apply to a tiny allowlist.
 */
export function actionRequiresApproval(actionType: string): boolean {
  const noApproval = new Set(["mark_growth_candidate", "mark_featured_candidate"]);
  if (noApproval.has(actionType)) return false;
  if (actionType === "queue_trust_safety_review") return true;
  return true;
}
