import type { AutonomyMode } from "./autonomy-modes";
import { categoryAlwaysRequiresApproval } from "./risk-evaluator";
import type { RoutedExecution, SensitiveActionCategory } from "./types";

/**
 * Non-sensitive / internal intents (analytics, draft copy, ranking hints) — may be auto-run only when mode allows.
 * Does **not** include anything that moves money, changes booking truth, or messages users.
 */
export type LowRiskIntent = "low_risk_internal";

export type SideEffectIntent = SensitiveActionCategory | LowRiskIntent;

/**
 * Routes a **proposed** side-effect through autonomy policy.
 * Call sites must still enforce the returned `kind` — this module does not execute anything.
 */
export function routeSideEffect(mode: AutonomyMode, intent: SideEffectIntent): RoutedExecution {
  if (mode === "OFF") {
    return {
      kind: "blocked",
      reason: "Autonomy OFF — no AI-driven or automated actions.",
    };
  }

  if (intent === "low_risk_internal") {
    if (mode === "ASSIST") {
      return { kind: "suggest_only", reason: "ASSIST — present suggestions; do not auto-apply." };
    }
    if (mode === "SAFE_AUTOPILOT" || mode === "FULL_WITH_APPROVAL") {
      return {
        kind: "auto_safe_allowed",
        reason: "Low-risk internal intent permitted under current autonomy mode.",
      };
    }
    return { kind: "suggest_only", reason: "Conservative fallback — suggestions only." };
  }

  if (!categoryAlwaysRequiresApproval(intent)) {
    if (mode === "ASSIST") {
      return { kind: "suggest_only", reason: "ASSIST — no automatic execution of this category." };
    }
    if (mode === "SAFE_AUTOPILOT") {
      return {
        kind: "auto_safe_allowed",
        reason: "Category not in mandatory-approval set; allowed under SAFE_AUTOPILOT.",
      };
    }
    if (mode === "FULL_WITH_APPROVAL") {
      return {
        kind: "requires_approval",
        reason: "FULL_WITH_APPROVAL — non-trivial category still needs explicit approval record.",
      };
    }
  }

  if (mode === "ASSIST") {
    return {
      kind: "suggest_only",
      reason: "ASSIST — sensitive action must be performed by a human; AI may only suggest.",
    };
  }

  return {
    kind: "requires_approval",
    reason:
      "Sensitive category (payments, refunds, booking/money, legal/dispute, outbound messaging, payouts) requires explicit human approval.",
  };
}
