import type { AutonomousAction } from "./executor";

/**
 * Policy first (governance), then agent. One `price_update` (prefer agent for BNHub / dynamic price),
 * one `compliance_block` (earliest), merged `listing_improvement` issues.
 */
export function mergeAutonomyActions(
  policyActions: AutonomousAction[],
  agentActions: AutonomousAction[]
): AutonomousAction[] {
  const merged: AutonomousAction[] = [];
  const firstCompliance = [...policyActions, ...agentActions].find(
    (a) => a.type === "compliance_block"
  );
  if (firstCompliance) merged.push({ ...firstCompliance });

  const policyPrice = [...policyActions].reverse().find((a) => a.type === "price_update");
  const agentPrice = [...agentActions].reverse().find((a) => a.type === "price_update");
  const price = agentPrice ?? policyPrice;
  if (price && price.type === "price_update") merged.push({ ...price });

  const allImp = [...policyActions, ...agentActions].filter((a) => a.type === "listing_improvement");
  if (allImp.length > 0) {
    const issues: string[] = [];
    const actions: string[] = [];
    for (const a of allImp) {
      if (a.type === "listing_improvement") {
        issues.push(...a.issues);
        actions.push(...a.actions);
      }
    }
    merged.push({ type: "listing_improvement", issues, actions });
  }

  return merged;
}
