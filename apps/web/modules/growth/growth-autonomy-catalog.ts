/**
 * Bounded action catalog — maps each entry to exactly one enforcement target for resolution (no new domains).
 */

import type { GrowthEnforcementTarget } from "./growth-policy-enforcement.types";
import type { GrowthAutonomyActionType } from "./growth-autonomy.types";

export type GrowthAutonomyCatalogEntry = {
  id: string;
  actionType: GrowthAutonomyActionType;
  label: string;
  enforcementTarget: GrowthEnforcementTarget;
  /** Deterministic reason this row exists in the catalog. */
  whyInCatalog: string;
};

export const GROWTH_AUTONOMY_CATALOG: GrowthAutonomyCatalogEntry[] = [
  {
    id: "cat-strategy-promo",
    actionType: "suggest_strategy_promotion",
    label: "Review strategy recommendation promotion",
    enforcementTarget: "strategy_recommendation_promotion",
    whyInCatalog: "Strategy priorities may be promoted when governance allows.",
  },
  {
    id: "cat-content",
    actionType: "suggest_content_improvement",
    label: "Review content assist drafts",
    enforcementTarget: "content_assist_generation",
    whyInCatalog: "Content assist outputs are advisory and rewrite-only until you apply.",
  },
  {
    id: "cat-messaging",
    actionType: "suggest_messaging_assist",
    label: "Review messaging assist drafts",
    enforcementTarget: "messaging_assist_generation",
    whyInCatalog: "Messaging drafts stay draft-only unless an existing approved send path is used separately.",
  },
  {
    id: "cat-fusion",
    actionType: "suggest_fusion_review",
    label: "Review fusion bridge signals",
    enforcementTarget: "fusion_autopilot_bridge",
    whyInCatalog: "Fusion bridges summarize cross-layer hints — no external execution.",
  },
  {
    id: "cat-simulation",
    actionType: "suggest_simulation_followup",
    label: "Follow up on growth simulation scenarios",
    enforcementTarget: "simulation_recommendation_promotion",
    whyInCatalog: "Simulation outputs are estimates — promotion is gated by enforcement.",
  },
  {
    id: "cat-prefill",
    actionType: "prefill_operator_action",
    label: "Open growth panels with context",
    enforcementTarget: "panel_render_hint",
    whyInCatalog: "Prefills only navigate or copy — no automated writes.",
  },
  {
    id: "cat-manual-review",
    actionType: "request_manual_review",
    label: "Request manual operator review",
    enforcementTarget: "learning_adjustments",
    whyInCatalog: "Learning adjustments require explicit review when policy demands it.",
  },
];
