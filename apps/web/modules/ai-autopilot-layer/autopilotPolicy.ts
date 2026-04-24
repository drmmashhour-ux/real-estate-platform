/**
 * Policy: which action keys are allowed per autopilot mode. Forbidden keys never execute.
 */

import type { AutopilotLayerMode } from "./types";

/** Actions that must never be automated (legal / financial / notice integrity). */
export const FORBIDDEN_ACTION_KEYS = new Set<string>([
  "sign_contract",
  "submit_offer",
  "send_legal_notice",
  "charge_payment_without_checkout",
  "acknowledge_notice",
  "waive_legal_right",
  "remove_compliance_notice",
  "modify_signed_document",
  "hide_risk",
]);

const ASSIST_KEYS = new Set<string>([
  "suggest_draft",
  "suggest_clause",
  "suggest_notice",
  "suggest_broker_review",
  "suggest_price_review",
  "suggest_missing_field",
  "suggest_missing_document",
  "suggest_admin_review",
]);

const SAFE_AUTOPILOT_KEYS = new Set<string>([
  ...ASSIST_KEYS,
  "prepare_draft",
  "run_ai_review",
  "create_suggestions",
  "prepare_broker_package",
  "prepare_pdf_preview",
]);

const FULL_APPROVAL_KEYS = new Set<string>([
  ...SAFE_AUTOPILOT_KEYS,
  "prepare_offer_package",
  "prepare_signature_package",
  "prepare_broker_assignment",
  "prepare_payment_checkout",
]);

/** Preparation-only actions that may complete without human approve in SAFE_/FULL modes (still no send/sign/charge). */
export const AUTO_PREPARE_ACTION_KEYS = new Set<string>([
  "prepare_draft",
  "run_ai_review",
  "create_suggestions",
  "prepare_broker_package",
  "prepare_pdf_preview",
]);

export function isForbiddenActionKey(actionKey: string): boolean {
  return FORBIDDEN_ACTION_KEYS.has(actionKey);
}

export function isActionAllowedForMode(actionKey: string, mode: AutopilotLayerMode): boolean {
  if (mode === "OFF") return false;
  if (isForbiddenActionKey(actionKey)) return false;
  if (mode === "ASSIST") return ASSIST_KEYS.has(actionKey);
  if (mode === "SAFE_AUTOPILOT") return SAFE_AUTOPILOT_KEYS.has(actionKey);
  return FULL_APPROVAL_KEYS.has(actionKey);
}

export function requiresHumanApprovalForExecute(actionKey: string, mode: AutopilotLayerMode): boolean {
  if (mode === "OFF" || mode === "ASSIST") return true;
  if (isForbiddenActionKey(actionKey)) return true;
  if (AUTO_PREPARE_ACTION_KEYS.has(actionKey)) return false;
  return true;
}
