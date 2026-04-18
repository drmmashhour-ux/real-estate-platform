/**
 * Whitelist + guards for AI Autopilot controlled execution (V8 safe).
 * No payments, bookings, ranking, ads spend, or legal mutations.
 */

import { aiAutopilotLeadsExecutionFlags } from "@/config/feature-flags";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import { getAutopilotActionStatus } from "./ai-autopilot-approval.service";
import type { AiSafeExecutableActionType } from "./ai-autopilot.types";

/** Gated advisory→real path: updates only `Lead` ai* fields via leads execution service. */
export function isLeadsPipelineAutopilotAction(action: AiAutopilotAction): boolean {
  return (
    aiAutopilotLeadsExecutionFlags.leadsExecutionV1 &&
    action.id.startsWith("ap-leads-") &&
    action.source === "leads"
  );
}

/** Explicitly allowed real-execution kinds only. */
export const allowedActionTypes: readonly AiSafeExecutableActionType[] = [
  "lead_timeline_handled",
  "lead_timeline_followup",
  "lead_launch_sales_contacted",
] as const;

/** Max DB-touching operations per single run (bounded). */
export const maxActionsPerRun = 5;

export const requiresApproval = true as const;
export const reversibleOnly = true as const;

/** Domains that must never receive autopilot execution (policy block). */
export const blockedDomains = [
  "payments",
  "bookings",
  "ranking",
  "ads_spend",
  "legal",
  "stripe",
  "checkout",
] as const;

export type BlockedDomain = (typeof blockedDomains)[number];

function domainBlocked(domain: string | undefined): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase();
  return (blockedDomains as readonly string[]).some((b) => d.includes(b));
}

export function isSafeExecutableAutopilotAction(
  action: AiAutopilotAction,
  opts?: { requireApproved?: boolean },
): { ok: boolean; reason?: string } {
  const requireApproved = opts?.requireApproved !== false;

  if (requireApproved && requiresApproval) {
    const st = getAutopilotActionStatus(action.id);
    if (st !== "approved") {
      return { ok: false, reason: "not_approved" };
    }
  }

  if (isLeadsPipelineAutopilotAction(action)) {
    return { ok: true };
  }

  if (!action.actionType) {
    return { ok: false, reason: "missing_action_type" };
  }

  if (!allowedActionTypes.includes(action.actionType as AiSafeExecutableActionType)) {
    return { ok: false, reason: "action_type_not_whitelisted" };
  }

  if (domainBlocked(action.domain)) {
    return { ok: false, reason: "blocked_domain" };
  }

  if (
    (action.actionType === "lead_timeline_handled" ||
      action.actionType === "lead_timeline_followup" ||
      action.actionType === "lead_launch_sales_contacted") &&
    !action.domain
  ) {
    return { ok: false, reason: "missing_domain" };
  }

  const needsTarget =
    action.actionType === "lead_timeline_handled" ||
    action.actionType === "lead_timeline_followup" ||
    action.actionType === "lead_launch_sales_contacted";

  if (needsTarget && (!action.targetId || !action.targetType)) {
    return { ok: false, reason: "missing_target" };
  }

  if (reversibleOnly && action.reversible === false) {
    return { ok: false, reason: "not_reversible" };
  }

  return { ok: true };
}
