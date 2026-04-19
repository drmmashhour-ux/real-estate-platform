/**
 * Ops assistant — suggestions and guided steps only. No autopilot; operator confirms all actions.
 */

import type { ApprovalExecutableActionKind, ApprovalPrefillPayload } from "./approval-execution.types";
import type { PlatformImprovementPriority } from "../platform-improvement.types";

export type OpsAssistantExecutablePlan = {
  actionType: ApprovalExecutableActionKind;
  expectedOutcome: string;
  proposedPayload: ApprovalPrefillPayload;
};

export type OpsAssistantActionType = "edit_copy" | "navigate" | "adjust_setting";

export type OpsAssistantTargetSurface =
  | "homepage"
  | "get_leads"
  | "listings"
  | "property"
  | "bnhub"
  | "broker"
  | "growth"
  | "revenue";

export type OpsAssistantRiskLevel = "low";

export type OpsAssistantPrefillData = {
  /** Optional copy the operator can confirm to clipboard or paste elsewhere. */
  text?: string;
  /** Optional single-line label for a setting or flag (informational). */
  label?: string;
  /** Hints for admin UIs — never executed server-side from this module. */
  adminPathHint?: string;
  /** Optional key for operator to look up in env / feature flags (no auto-toggle). */
  configKeyHint?: string;
};

export type OpsAssistantSuggestion = {
  id: string;
  priorityId: string;
  title: string;
  description: string;
  actionType: OpsAssistantActionType;
  targetSurface: OpsAssistantTargetSurface;
  prefillData?: OpsAssistantPrefillData;
  riskLevel: OpsAssistantRiskLevel;
  /** Safety default: every assistant path requires explicit operator confirmation in UI. */
  requiresConfirmation: true;
  /** For navigate / open admin — built without auto-following. */
  href?: string;
  /** Appended to href as search params (e.g. from, priorityId, assistant). */
  queryParams?: Record<string, string>;
  /** When set, FEATURE_OPS_ASSISTANT_APPROVAL_EXECUTION_V1 may offer approval → execute for this suggestion. */
  executable?: OpsAssistantExecutablePlan;
};

export type OpsAssistantActionResult = "success" | "cancelled" | "failed";

export type OpsAssistantPriorityContext = {
  priority: PlatformImprovementPriority;
};

export function isLowRiskSuggestion(s: Pick<OpsAssistantSuggestion, "riskLevel" | "actionType">): boolean {
  if (s.riskLevel !== "low") return false;
  return true;
}
