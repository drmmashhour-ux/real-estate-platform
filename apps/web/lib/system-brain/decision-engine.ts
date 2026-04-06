import type { BrainFailureSignal } from "./failure-signals";
import type { BrainDecision, BrainRecommendedAction, RiskTier } from "./types";

/**
 * Maps automated test / ops signals to **recommended** next steps.
 * Does not execute fixes — pairs with `action-router` for any side-effect.
 */
export function decideFromFailureSignal(failureType: BrainFailureSignal): BrainDecision {
  const table: Record<
    BrainFailureSignal,
    { action: BrainRecommendedAction; risk: RiskTier; rationale: string; automationEligible: boolean }
  > = {
    ui_localization: {
      action: "suggest_fix",
      risk: "medium",
      rationale: "Locale or copy pipeline issue — safe to suggest bundle/key fixes.",
      automationEligible: true,
    },
    rtl_layout: {
      action: "suggest_fix",
      risk: "medium",
      rationale: "RTL / dir / CSS logical properties — suggest fix, verify visually.",
      automationEligible: true,
    },
    api_error: {
      action: "escalate_to_engineering",
      risk: "medium",
      rationale: "HTTP/API failure — inspect route, validation, and upstream errors.",
      automationEligible: false,
    },
    booking_transition: {
      action: "require_admin_review",
      risk: "high",
      rationale: "Booking state machine — may affect guest/host expectations; human review.",
      automationEligible: false,
    },
    stripe_checkout: {
      action: "require_admin_review",
      risk: "high",
      rationale: "Stripe checkout path — verify keys, quotes, Connect metadata.",
      automationEligible: false,
    },
    stripe_webhook: {
      action: "require_admin_review",
      risk: "critical",
      rationale: "Webhook / payment convergence — high financial risk; no silent auto-fix.",
      automationEligible: false,
    },
    manual_payment: {
      action: "require_admin_review",
      risk: "high",
      rationale: "Manual settlement (e.g. Syria) — ops must confirm market + actor rules.",
      automationEligible: false,
    },
    permission_error: {
      action: "escalate_to_engineering",
      risk: "medium",
      rationale: "AuthZ mismatch — check role guards and session surface.",
      automationEligible: false,
    },
    missing_translation: {
      action: "suggest_fix",
      risk: "low",
      rationale: "i18n keys — safe suggestion path.",
      automationEligible: true,
    },
    market_resolution: {
      action: "require_admin_review",
      risk: "high",
      rationale: "Market / CTA / payment mode — verify platform_market_launch_settings.",
      automationEligible: false,
    },
    ai_locale_mismatch: {
      action: "suggest_fix",
      risk: "medium",
      rationale: "AI output vs UI locale — adjust server translate / user locale hooks.",
      automationEligible: true,
    },
    notification_error: {
      action: "require_admin_review",
      risk: "medium",
      rationale: "Notification pipeline — check templates, provider, locale.",
      automationEligible: false,
    },
    db_consistency: {
      action: "escalate_to_engineering",
      risk: "critical",
      rationale: "Data inconsistency — stop automation; investigate migrations and transactions.",
      automationEligible: false,
    },
    infra_blocked: {
      action: "monitor_only",
      risk: "low",
      rationale: "Environment / connectivity — not a product logic defect.",
      automationEligible: false,
    },
    unknown: {
      action: "escalate_to_engineering",
      risk: "medium",
      rationale: "Unclassified — triage manually before any auto action.",
      automationEligible: false,
    },
  };

  const row = table[failureType];
  return {
    action: row.action,
    risk: row.risk,
    rationale: row.rationale,
    automationEligible: row.automationEligible,
  };
}

export interface MarketplaceHealthInput {
  /** 0–1 ratio of failed or abandoned booking attempts vs starts in window. */
  bookingFailureRate: number;
  /** e.g. 3 = errors triple vs baseline */
  errorSpikeRatio?: number;
}

/** Level 4/5 brain hook — metrics-driven ops signals (does not page anyone by itself). */
export function decideFromMarketplaceMetrics(input: MarketplaceHealthInput): BrainDecision {
  if (input.bookingFailureRate > 0.2) {
    return {
      action: "alert_admin",
      risk: "high",
      rationale: "Booking failure rate exceeded 20% in the sampled window.",
      automationEligible: false,
    };
  }
  if ((input.errorSpikeRatio ?? 1) >= 3) {
    return {
      action: "alert_admin",
      risk: "high",
      rationale: "Error volume spiked vs baseline — inspect monitoring and ErrorEvent stream.",
      automationEligible: false,
    };
  }
  return {
    action: "monitor_only",
    risk: "low",
    rationale: "Marketplace health within nominal thresholds.",
    automationEligible: false,
  };
}

/** @deprecated Use `decideFromFailureSignal` — alias for E2E `E2EFailureType` call sites. */
export function decideFromFailureType(failureType: BrainFailureSignal): BrainDecision {
  return decideFromFailureSignal(failureType);
}
