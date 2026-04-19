/**
 * Strict Phase-1 allowlist — only these catalog entries may ever be considered for server-side auto_low_risk.
 * cat-prefill is client navigation only; not server auto-executed.
 */

import type { GrowthAutonomyLowRiskActionKey } from "./growth-autonomy-auto.types";

export type GrowthAutonomyAllowlistEntry = {
  lowRiskActionKey: GrowthAutonomyLowRiskActionKey;
  reversibility: "reversible_internal" | "none";
};

export const GROWTH_AUTONOMY_AUTO_LOW_RISK_ALLOWLIST: Record<string, GrowthAutonomyAllowlistEntry> = {
  "cat-strategy-promo": { lowRiskActionKey: "create_internal_review_task", reversibility: "reversible_internal" },
  "cat-content": { lowRiskActionKey: "create_internal_content_draft", reversibility: "reversible_internal" },
  "cat-messaging": { lowRiskActionKey: "queue_internal_followup_reminder", reversibility: "reversible_internal" },
  "cat-fusion": { lowRiskActionKey: "add_internal_priority_tag", reversibility: "reversible_internal" },
  "cat-simulation": { lowRiskActionKey: "prefill_simulation_context", reversibility: "reversible_internal" },
  "cat-manual-review": { lowRiskActionKey: "create_internal_followup_task", reversibility: "reversible_internal" },
};

export function getAllowlistedAutoAction(catalogEntryId: string): GrowthAutonomyAllowlistEntry | undefined {
  return GROWTH_AUTONOMY_AUTO_LOW_RISK_ALLOWLIST[catalogEntryId];
}

/** Catalog rows that map to this low-risk action key (for evidence aggregation). */
export function listCatalogIdsForLowRiskActionKey(key: GrowthAutonomyLowRiskActionKey): string[] {
  return Object.entries(GROWTH_AUTONOMY_AUTO_LOW_RISK_ALLOWLIST)
    .filter(([, v]) => v.lowRiskActionKey === key)
    .map(([id]) => id);
}
