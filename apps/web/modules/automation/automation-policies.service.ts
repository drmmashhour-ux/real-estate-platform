import type { ActionClass, AutomationHubId, PolicyContext, RiskTier } from "./automation.types";

/**
 * Central allow/deny for automation **classes** by hub.
 * Governance / kill switches elsewhere override this layer — never bypass.
 */

const STAGE1_HUB_DENY_EXECUTE: Partial<Record<AutomationHubId, ActionClass[]>> = {
  lecipm_crm: ["auto_safe"], // stage 1: even "safe" auto-actions reviewed via feature flags per rollout
  bnhub_host: ["auto_safe"],
  investor: ["auto_safe", "approval_required"],
  admin: [],
  growth: ["auto_safe"],
  messaging: ["approval_required", "auto_safe"],
};

export function defaultRiskForActionClass(ac: ActionClass): RiskTier {
  switch (ac) {
    case "recommendation":
      return "low";
    case "draft":
      return "medium";
    case "approval_required":
      return "medium";
    case "auto_safe":
      return "low";
    default:
      return "medium";
  }
}

/**
 * Returns whether the automation stack may schedule / emit this **class** of behavior.
 * Does not authorize specific writes — callers still enforce RBAC + hub rules.
 */
export function isAutomationClassAllowed(ctx: PolicyContext): boolean {
  const denied = STAGE1_HUB_DENY_EXECUTE[ctx.hub];
  if (denied?.includes(ctx.actionClass)) {
    return false;
  }

  if (ctx.risk === "high" && ctx.actionClass === "auto_safe") {
    return false;
  }

  return true;
}

export function buildDenialReason(ctx: PolicyContext): string {
  return `Policy: hub=${ctx.hub} actionClass=${ctx.actionClass} blocked under stage-1 automation matrix`;
}
