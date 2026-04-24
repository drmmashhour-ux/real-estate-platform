/**
 * Host autopilot guardrails — deterministic, auditable (financial/irreversible paths stay manual).
 */
import { isFinancialOrIrreversibleActionKey, requiresApprovalForActionKey } from "@/lib/ai/autopilot/safety";
import type { HostAutopilotConfig, HostAutopilotMode } from "@/lib/ai/autopilot/host-config";

/** Relative nightly price change above this is never auto-applied (suggest / approval only). */
export const MAX_SAFE_AUTOPILOT_PRICE_DELTA_PERCENT = 7;

/** Hard cap — beyond this always requires explicit approval even if mode is SAFE_AUTOPILOT. */
export const MAX_APPROVED_PRICE_DELTA_PERCENT = 15;

/** Evaluate endpoint: max calls per host per hour (fallback to manual if exceeded). */
export const AUTOPILOT_EVALUATE_RATE_LIMIT_PER_HOUR = 30;

export type AutopilotRuleOutcome = {
  allowed: boolean;
  reason: string;
};

export function ruleNeverAutoAcceptBookings(): AutopilotRuleOutcome {
  return {
    allowed: false,
    reason:
      "Bookings are never auto-accepted by autopilot. You always confirm or decline in the booking workflow.",
  };
}

export function ruleNoDrasticPricing(previousCents: number, proposedCents: number): AutopilotRuleOutcome {
  if (!(previousCents > 0) || !(proposedCents > 0)) {
    return { allowed: true, reason: "Insufficient baseline price to compare — treat as advisory only." };
  }
  const pct = Math.abs(proposedCents - previousCents) / previousCents;
  if (pct > MAX_APPROVED_PRICE_DELTA_PERCENT / 100) {
    return {
      allowed: false,
      reason: `Change (~${(pct * 100).toFixed(1)}%) exceeds the ${MAX_APPROVED_PRICE_DELTA_PERCENT}% safety ceiling — requires your edit or approval.`,
    };
  }
  if (pct > MAX_SAFE_AUTOPILOT_PRICE_DELTA_PERCENT / 100) {
    return {
      allowed: false,
      reason: `Change (~${(pct * 100).toFixed(1)}%) is too large for safe autopilot — suggestion or approval queue only.`,
    };
  }
  return { allowed: true, reason: "Within normal adjustment band for advisory or safe paths." };
}

export function ruleRespectsHostPreferences(
  cfg: HostAutopilotConfig,
  capability: keyof HostAutopilotConfig["preferences"]
): AutopilotRuleOutcome {
  if (!cfg.autopilotEnabled || cfg.autopilotMode === "OFF") {
    return { allowed: false, reason: "Autopilot is off — enable it to use this capability." };
  }
  if (!cfg.preferences[capability]) {
    return { allowed: false, reason: `Host preference "${capability}" is disabled.` };
  }
  return { allowed: true, reason: "Host has enabled this capability." };
}

export function ruleDestructiveActionKey(actionKey: string): AutopilotRuleOutcome {
  if (isFinancialOrIrreversibleActionKey(actionKey)) {
    return {
      allowed: false,
      reason: "Financial or legally sensitive actions cannot run from autopilot.",
    };
  }
  return { allowed: true, reason: "Action key is not in the blocked financial/legal set." };
}

export function executionPathForPricing(mode: HostAutopilotMode): "blocked" | "suggest_only" | "needs_approval" {
  if (mode === "OFF") return "blocked";
  if (mode === "ASSIST" || mode === "SAFE_AUTOPILOT") return "suggest_only";
  return "needs_approval";
}

export function executionPathForListingCopy(mode: HostAutopilotMode): "blocked" | "suggest_only" | "auto_safe" | "needs_approval" {
  if (mode === "OFF") return "blocked";
  if (mode === "ASSIST") return "suggest_only";
  if (mode === "SAFE_AUTOPILOT") return "auto_safe";
  return "needs_approval";
}

export { requiresApprovalForActionKey, isFinancialOrIrreversibleActionKey };
