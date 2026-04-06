/**
 * System brain — orchestration types (decisions are advisory; execution stays behind human gates).
 */

export type RiskTier = "low" | "medium" | "high" | "critical";

/** What the brain recommends doing with a signal (not automatic execution). */
export type BrainRecommendedAction =
  | "noop"
  | "suggest_fix"
  | "escalate_to_engineering"
  | "require_admin_review"
  | "require_host_review"
  | "monitor_only"
  | "block_automation"
  | "alert_admin";

export interface BrainDecision {
  action: BrainRecommendedAction;
  risk: RiskTier;
  /** Human-readable rationale for logs / admin UI. */
  rationale: string;
  /** Tie-in to autonomy: whether an executor should even consider auto-running. */
  automationEligible: boolean;
}

/** Domains that must never auto-execute without explicit human approval (payments, legal, outbound comms). */
export type SensitiveActionCategory =
  | "payment_capture"
  | "refund"
  | "booking_confirmation_override"
  | "money_affecting_cancellation"
  | "manual_payment_settlement"
  | "legal_or_dispute_outbound"
  | "external_user_messaging"
  | "trust_safety_enforcement"
  | "pricing_or_fee_change"
  | "payout_or_transfer"
  /** Recommendations / ranking hints with no ledger or outbound side-effect (SAFE_AUTOPILOT may auto-ingest logs only). */
  | "non_monetary_recommendation"
  /** Level 3 safe autopilot — copy/media/SEO that does not change price or messaging users without template safety review. */
  | "listing_content_update"
  | "listing_media_reorder"
  | "seo_metadata_update"
  | "internal_quality_flag"
  | "safe_notification_template";

/** Result of routing an attempted side-effect through the control layer. */
export type RoutedExecution =
  | { kind: "blocked"; reason: string }
  | { kind: "suggest_only"; reason: string }
  | { kind: "auto_safe_allowed"; reason: string }
  | { kind: "requires_approval"; reason: string };
