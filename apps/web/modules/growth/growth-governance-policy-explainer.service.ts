/**
 * Compact policy lines for UI and mission control notes — advisory only.
 */

import type { GrowthGovernancePolicySnapshot, GrowthPolicyDomain } from "./growth-governance-policy.types";
import { formatPolicyModeLabel } from "./growth-governance-policy-query.service";

export function buildGrowthGovernancePolicyNotes(snapshot: GrowthGovernancePolicySnapshot): string[] {
  const out: string[] = [];
  const mode = (d: GrowthPolicyDomain) => snapshot.rules.find((r) => r.domain === d)?.mode;

  if (mode("ads") === "advisory_only") out.push("Ads remain advisory-only (policy view).");
  if (mode("fusion") === "advisory_only") out.push("Fusion is advisory-only (read-only intelligence).");
  const learning = snapshot.rules.find((r) => r.domain === "learning");
  if (learning?.mode === "frozen") out.push("Learning is frozen pending review (learning control).");
  if (mode("messaging") === "approval_required") out.push("Messaging remains draft / approval-first.");
  if (mode("leads") === "approval_required") out.push("Leads automations require approval paths.");
  const ap = snapshot.rules.find((r) => r.domain === "autopilot");
  if (ap) out.push(`Autopilot: ${formatPolicyModeLabel(ap.mode)}.`);

  return out.slice(0, 5);
}
