/** High-risk families — always require human approval before side effects. */
export function actionRequiresApproval(actionType: string): boolean {
  const highRisk = new Set([
    "suggest_price_adjustment",
    "flag_for_review",
    "suggest_title_improvement",
    "suggest_description_improvement",
    "suggest_add_photos",
    "suggest_add_amenities",
    "suggest_verification_completion",
  ]);
  return highRisk.has(actionType);
}
