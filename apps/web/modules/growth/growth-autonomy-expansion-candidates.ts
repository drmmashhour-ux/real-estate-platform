/**
 * Tiny adjacent expansion proposals — evaluated only when evidence + audit health pass; never auto-activated.
 */

import type { GrowthAutonomyExpansionCandidate } from "./growth-autonomy-expansion.types";
import type { GrowthAutonomyLowRiskActionKey } from "./growth-autonomy-auto.types";

/**
 * Each candidate links a parent allowlisted pattern to one narrowly related internal-only pattern.
 * Activation requires manual approval + FEATURE_GROWTH_AUTONOMY_EXPANSION_* gates.
 */
export const GROWTH_AUTONOMY_EXPANSION_CANDIDATES: GrowthAutonomyExpansionCandidate[] = [
  {
    id: "adjacent:review_task_to_attention",
    parentActionKey: "create_internal_review_task",
    proposedActionKey: "mark_target_for_operator_attention",
    label: "Internal attention marker adjacent to stable review-task auto pattern (trial only)",
    adjacencyKind: "group_similar_tasks",
    reversibility: "reversible_internal",
  },
  {
    id: "adjacent:draft_to_attention",
    parentActionKey: "create_internal_content_draft",
    proposedActionKey: "mark_target_for_operator_attention",
    label: "Operator-attention flag after stable internal draft automation (trial only)",
    adjacencyKind: "broader_internal_tag",
    reversibility: "reversible_internal",
  },
  {
    id: "adjacent:simulation_prefill_to_script",
    parentActionKey: "prefill_simulation_context",
    proposedActionKey: "prefill_growth_script",
    label: "Related internal script prefill after stable simulation prefill usage (trial only)",
    adjacencyKind: "related_prefill",
    reversibility: "reversible_internal",
  },
];

export function getExpansionCandidateById(id: string): GrowthAutonomyExpansionCandidate | undefined {
  return GROWTH_AUTONOMY_EXPANSION_CANDIDATES.find((c) => c.id === id);
}

export function candidatesForParent(parentKey: GrowthAutonomyLowRiskActionKey): GrowthAutonomyExpansionCandidate[] {
  return GROWTH_AUTONOMY_EXPANSION_CANDIDATES.filter((c) => c.parentActionKey === parentKey);
}
