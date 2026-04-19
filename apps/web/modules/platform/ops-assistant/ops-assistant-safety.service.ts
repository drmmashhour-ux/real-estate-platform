/**
 * Hard safety rules for ops assistant — no payments, bookings, ranking, or pricing automation.
 */

import type { OpsAssistantActionType, OpsAssistantSuggestion } from "./ops-assistant.types";

const FORBIDDEN_IN_HREF_PATH = [
  "stripe",
  "checkout",
  "/booking",
  "payment",
  "payout",
  "ranking",
  "pricing-engine",
  "dynamic-pricing",
  "lead/unlock",
] as const;

const FORBIDDEN_IN_COPY = ["auto-execute", "autopilot execution"] as const;

export function isAssistantSuggestionSafe(s: OpsAssistantSuggestion): boolean {
  if (s.riskLevel !== "low") return false;
  if (!s.requiresConfirmation) return false;
  const h = (s.href ?? "").toLowerCase();
  for (const x of FORBIDDEN_IN_HREF_PATH) {
    if (h.includes(x)) return false;
  }
  const copy = `${s.title} ${s.description}`.toLowerCase();
  for (const x of FORBIDDEN_IN_COPY) {
    if (copy.includes(x)) return false;
  }
  return true;
}

export function filterToSafeSuggestions(list: OpsAssistantSuggestion[]): OpsAssistantSuggestion[] {
  return list.filter(isAssistantSuggestionSafe);
}

/** Blocks action types that could imply server-side mutation without a dedicated safe flow here. */
export function isAllowedActionType(t: OpsAssistantActionType): boolean {
  return t === "edit_copy" || t === "navigate" || t === "adjust_setting";
}
