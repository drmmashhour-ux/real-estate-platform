import type { PlatformAutopilotRiskClass } from "@prisma/client";

const DEFAULT: PlatformAutopilotRiskClass = "MEDIUM";

/** Conservative defaults — expand per actionType over time. */
export function mapActionTypeToRisk(actionType: string): PlatformAutopilotRiskClass {
  const low = new Set([
    "internal_reminder",
    "draft_copy",
    "draft_blog",
    "draft_campaign",
    "score_snapshot",
    "review_queue_item",
    "review_growth_reports",
    "growth_budget_increase_candidate",
    "growth_pause_low_conversion",
    "growth_new_creative_suggestions",
    "growth_keyword_expansion",
    "ads_strategy_review_launch",
    "ads_strategy_apply_scale_rules",
    "ads_strategy_rewrite_headline",
    "ads_strategy_test_audience",
    "ads_strategy_first_100_playbook",
  ]);
  const high = new Set([
    "publish_public_content",
    "stripe_charge",
    "stripe_refund",
    "fraud_hard_block",
    "legal_contract_send",
  ]);
  const critical = new Set(["delete_listing", "payment_state_change", "wallet_transfer"]);
  if (critical.has(actionType)) return "CRITICAL";
  if (high.has(actionType)) return "HIGH";
  if (low.has(actionType)) return "LOW";
  return DEFAULT;
}
