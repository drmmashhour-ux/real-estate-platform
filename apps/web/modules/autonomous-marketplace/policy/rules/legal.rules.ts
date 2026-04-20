/**
 * Legal Hub compliance as **policy rules** — delegates to `evaluateLegalGate` (single source of truth).
 * See `LEGAL_ENFORCEMENT_RULES` in `modules/legal/legal-enforcement-rules.ts` for requirement matrix.
 *
 * Sub-rule tags (REQUIRE_*) are metadata for audit / admin — not separate evaluators (avoids duplicate gate calls).
 */

import { legalHubFlags } from "@/config/feature-flags";
import { ALL_LEGAL_GATE_ACTIONS } from "@/modules/legal/legal-enforcement-rules";
import { evaluateLegalGate } from "@/modules/legal/legal-gate.service";
import { legalEnforcementDisabled } from "@/modules/legal/legal-enforcement";
import type { LegalGateAction, LegalGateContext } from "@/modules/legal/legal-readiness.types";
import type { PolicyRuleEvaluation } from "../../types/domain.types";
import type { PolicyContext } from "../policy-context";

export const LEGAL_POLICY_DOMAIN = "legal" as const;

export const legalHubComplianceRuleCode = "legal_hub_compliance";

/** Sub-rule tags for audit / UI (which business concern failed) — best-effort from enforcement rows. */
export type LegalSubRuleTag =
  | "REQUIRE_SELLER_DISCLOSURE"
  | "REQUIRE_ID_VERIFICATION"
  | "REQUIRE_PRIVACY_CONSENT"
  | "REQUIRE_LEASE_DOC"
  | "REQUIRE_HOST_COMPLIANCE"
  | "REQUIRE_BROKER_MANDATE"
  | "REQUIRE_CRITICAL_RISK_CLEARANCE";

function subRuleTagForKey(key: string, gateAction: LegalGateAction): LegalSubRuleTag {
  if (key.startsWith("risk:")) return "REQUIRE_CRITICAL_RISK_CLEARANCE";
  if (key.includes("seller_disclosure") || (gateAction === "publish_listing" && key.includes("accuracy_ack")))
    return "REQUIRE_SELLER_DISCLOSURE";
  if (key.includes("identity") || key.includes("submit_id") || key.includes("identity_ready"))
    return "REQUIRE_ID_VERIFICATION";
  if (key.includes("privacy") || key.includes("privacy_policy")) return "REQUIRE_PRIVACY_CONSENT";
  if (key.includes("host_terms") || key.includes("short_term_rental") || key.includes("identity_host"))
    return "REQUIRE_HOST_COMPLIANCE";
  if (key.includes("lease") || key.includes("landlord") || key.includes("long_term")) return "REQUIRE_LEASE_DOC";
  if (key.includes("broker_mandate") || key.includes("license") || key.includes("broker_agreement"))
    return "REQUIRE_BROKER_MANDATE";
  return "REQUIRE_SELLER_DISCLOSURE";
}

function resolveLegalGateAction(ctx: PolicyContext): LegalGateAction | null {
  const raw = ctx.action.metadata?.legalGateAction;
  if (typeof raw === "string" && (ALL_LEGAL_GATE_ACTIONS as readonly string[]).includes(raw)) {
    return raw as LegalGateAction;
  }
  return null;
}

function toGateContext(ctx: PolicyContext): LegalGateContext | null {
  if (!ctx.legalSummary) return null;
  return {
    actorType: ctx.legalSummary.actorType,
    workflows: ctx.legalSummary.workflows,
    risks: ctx.legalSummary.risks,
  };
}

/**
 * Single policy evaluation for Legal Hub — calls `evaluateLegalGate` once.
 * When no gate action in metadata or no legal summary, passes (safe degradation).
 */
export function evaluateLegalHubCompliancePolicy(ctx: PolicyContext): PolicyRuleEvaluation {
  if (!legalHubFlags.legalEnforcementV1 || legalEnforcementDisabled()) {
    return { ruleCode: legalHubComplianceRuleCode, result: "passed" };
  }

  const gateAction = resolveLegalGateAction(ctx);
  if (!gateAction) {
    return { ruleCode: legalHubComplianceRuleCode, result: "passed" };
  }

  const gctx = toGateContext(ctx);
  if (!gctx) {
    return {
      ruleCode: legalHubComplianceRuleCode,
      result: "passed",
      reason: "Legal Hub data not loaded for this policy context — compliance check skipped.",
    };
  }

  const gate = evaluateLegalGate(gateAction, gctx);
  const subRuleTags = gate.blockingRequirements.map((k) => subRuleTagForKey(k, gateAction));

  if (!gate.allowed) {
    return {
      ruleCode: legalHubComplianceRuleCode,
      result: "blocked",
      dispositionHint: "BLOCK",
      reason:
        gate.reasons[0] ??
        "Legal compliance policy: required workflow items must be satisfied (platform checklist — not legal advice).",
      metadata: {
        domain: LEGAL_POLICY_DOMAIN,
        severity: "critical" as const,
        blocking: true,
        blockingRequirements: gate.blockingRequirements,
        messages: gate.reasons,
        legalGateAction: gateAction,
        legalSubRuleTags: [...new Set(subRuleTags)],
      },
    };
  }

  if (gate.mode === "soft" && gate.reasons.length > 0) {
    return {
      ruleCode: legalHubComplianceRuleCode,
      result: "warning",
      dispositionHint: "ALLOW_WITH_APPROVAL",
      reason: gate.reasons[0] ?? "Legal compliance advisory — review checklist items.",
      metadata: {
        domain: LEGAL_POLICY_DOMAIN,
        severity: "warning" as const,
        blocking: false,
        messages: gate.reasons,
        legalGateAction: gateAction,
      },
    };
  }

  return { ruleCode: legalHubComplianceRuleCode, result: "passed" };
}

/** HTTP / focused evaluation — legal rules only (see policy-engine). */
export const legalCompliancePolicyEvaluators: Array<(ctx: PolicyContext) => PolicyRuleEvaluation> = [
  evaluateLegalHubCompliancePolicy,
];
