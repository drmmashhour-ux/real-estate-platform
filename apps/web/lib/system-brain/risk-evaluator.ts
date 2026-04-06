import type { RiskTier, SensitiveActionCategory } from "./types";

/**
 * Categories that **always** require human approval before any executor runs,
 * regardless of `SAFE_AUTOPILOT` or `FULL_WITH_APPROVAL`.
 *
 * Aligns with policy: payments, refunds, booking/money overrides, legal/dispute, external messaging.
 */
export const ALWAYS_REQUIRES_APPROVAL: ReadonlySet<SensitiveActionCategory> = new Set([
  "payment_capture",
  "refund",
  "booking_confirmation_override",
  "money_affecting_cancellation",
  "manual_payment_settlement",
  "legal_or_dispute_outbound",
  "external_user_messaging",
  "trust_safety_enforcement",
  "pricing_or_fee_change",
  "payout_or_transfer",
]);

/** Low-risk automation candidates (never includes payment/legal/messaging). */
export const SAFE_AUTOPILOT_ALLOWLIST: ReadonlySet<SensitiveActionCategory> = new Set([
  /* Intentionally narrow: add only when product defines safe automations explicitly. */
]);

export function categoryAlwaysRequiresApproval(category: SensitiveActionCategory): boolean {
  return ALWAYS_REQUIRES_APPROVAL.has(category);
}

export function riskTierForCategory(category: SensitiveActionCategory): RiskTier {
  if (ALWAYS_REQUIRES_APPROVAL.has(category)) return "critical";
  if (
    category === "non_monetary_recommendation" ||
    category === "listing_content_update" ||
    category === "listing_media_reorder" ||
    category === "seo_metadata_update" ||
    category === "internal_quality_flag" ||
    category === "safe_notification_template"
  ) {
    return "low";
  }
  return "medium";
}

/** Coarse risk from a human-readable action kind (orchestrator / external agents). */
export function evaluateActionKindRisk(kind: string): RiskTier {
  const k = kind.trim().toLowerCase();
  if (/payment|refund|payout|stripe|ledger|invoice|capture/i.test(k)) return "critical";
  if (/booking.?confirm|cancel|dispute|legal|law|settlement|manual.?pay/i.test(k)) return "high";
  if (/content|seo|image|reorder|description|flag|draft|internal/i.test(k)) return "low";
  if (/message|email|sms|push|notify|host.?contact|guest.?contact/i.test(k)) return "high";
  return "medium";
}
