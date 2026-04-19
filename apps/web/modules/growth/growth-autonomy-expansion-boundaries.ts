/**
 * Hard boundaries — expansion never crosses into risky automation domains.
 */

import type { GrowthAutonomyLowRiskActionKey } from "./growth-autonomy-auto.types";

/** Action keys that are valid *parents or targets* for internal-only expansion (subset of enum). */
export const EXPANSION_SAFE_INTERNAL_ACTION_KEYS = new Set<string>([
  "mark_surface_read_internal",
  "create_internal_review_task",
  "create_internal_followup_task",
  "create_internal_content_draft",
  "queue_internal_followup_reminder",
  "navigate_operator_panel_hint",
  "copy_ready_internal_script",
  "prefill_simulation_context",
  "prefill_growth_script",
  "add_internal_priority_tag",
  "mark_target_for_operator_attention",
]);

const FORBIDDEN_SUBSTRINGS = [
  "payment",
  "stripe",
  "booking",
  "checkout",
  "ads_core",
  "campaign_launch",
  "cro_experiment",
  "pricing",
  "listing_publish",
  "external_send",
  "sms",
  "whatsapp",
  "email_send",
];

export function isExpansionTargetWithinSafeClass(actionKey: string): boolean {
  if (!EXPANSION_SAFE_INTERNAL_ACTION_KEYS.has(actionKey)) return false;
  const lower = actionKey.toLowerCase();
  for (const f of FORBIDDEN_SUBSTRINGS) {
    if (lower.includes(f)) return false;
  }
  return true;
}

/** Adjacent expansion keys must remain internal-only and reversible where required by policy. */
export function expansionAdjacencyIsAllowed(parentKey: string, proposedKey: string): boolean {
  if (!isExpansionTargetWithinSafeClass(proposedKey)) return false;
  if (!isExpansionTargetWithinSafeClass(parentKey)) return false;
  return parentKey !== proposedKey;
}
