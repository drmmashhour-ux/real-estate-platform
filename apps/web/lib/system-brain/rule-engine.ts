import type { RiskTier } from "./types";
import { evaluateActionKindRisk } from "./risk-evaluator";
import { isForbiddenAutonomousPrimitive } from "./safety-guardrails";

export type RuleEngineAction = {
  /** e.g. content_update | reorder_images | pricing_apply | dispute_resolve */
  type: string;
  risk?: RiskTier;
};

/**
 * Level 3 — whether an action may be executed automatically under SAFE_AUTOPILOT.
 * Still requires caller to pass `routeSideEffect` and persist audit logs in product code.
 */
export function shouldAutoExecuteUnderSafeAutopilot(action: RuleEngineAction): boolean {
  const key = action.type.trim().toLowerCase();
  if (isForbiddenAutonomousPrimitive(key)) return false;
  const risk = action.risk ?? evaluateActionKindRisk(action.type);
  if (risk !== "low") return false;

  const lowRiskTypes = new Set([
    "content_update",
    "listing_content_update",
    "reorder_images",
    "internal_flag",
    "internal_quality_flag",
    "seo_metadata_update",
    "seo_page_draft",
    "safe_notification_template",
  ]);
  return lowRiskTypes.has(key);
}
