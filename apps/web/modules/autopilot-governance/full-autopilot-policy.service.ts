/**
 * Bounded policy evaluation — pure logic unit-tested separately from persistence.
 */
import type { AutopilotDomainMatrixRow } from "./autopilot-domain-matrix.types";
import type { FullAutopilotMode } from "./autopilot-domain-matrix.types";
import type { KillSwitchPosition } from "./autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "./autopilot-domain-matrix.types";
import { AUTOPILOT_POLICY_RULE_IDS } from "./full-autopilot-policy-rule-ids";

export type AutopilotDecisionOutcome = "ALLOW_AUTOMATIC" | "REQUIRE_APPROVAL" | "BLOCK";

export type AutopilotPolicyInput = {
  domain: LecipmAutopilotDomainId;
  actionType: string;
  matrix: AutopilotDomainMatrixRow;
  effectiveMode: FullAutopilotMode;
  killSwitch: KillSwitchPosition;
  globalPaused: boolean;
  /** Optional caller hints (e.g. compliance flags). */
  context?: Record<string, unknown>;
};

export type AutopilotPolicyDecision = {
  outcome: AutopilotDecisionOutcome;
  policyRuleId: string;
  riskLevel: AutopilotDomainMatrixRow["riskLevel"];
  confidence: number;
  reason: string;
};

/** v1 — never automatically execute these categories without explicit human approval paths. */
const V1_BLOCKED_PREFIXES = [
  "pricing.",
  "invest.",
  "investment.",
  "compliance.override",
  "contract.",
  "legal.",
  "mass_campaign.high_risk",
  "wire.",
  "payment.deploy",
];

/** Low-risk actions eligible for SAFE_AUTOPILOT / FULL_AUTOPILOT_BOUNDED automatic execution (bounded). */
const LOW_RISK_AUTO_ACTION_PREFIXES = [
  "marketing.draft.",
  "marketing.calendar_fill",
  "marketing.safe_publish",
  "lead.route",
  "followup.reminder",
  "booking.suggest_slots",
  "booking.confirm_prompt",
  "visit.no_show_reminder",
  "visit.post_followup",
  "assistant.safe_action",
  "deal.priority_refresh",
  "deal.stalled_alert",
  "dashboard.summary",
  "report.safe_generate",
  "growth.signal_refresh",
];

const LIMITED_WHITELIST_PREFIXES = LOW_RISK_AUTO_ACTION_PREFIXES;

function matchesPrefix(actionType: string, prefixes: string[]): boolean {
  const a = actionType.toLowerCase();
  return prefixes.some((p) => a.startsWith(p.toLowerCase()));
}

function isV1Blocked(actionType: string): boolean {
  return matchesPrefix(actionType, V1_BLOCKED_PREFIXES);
}

export function isLowRiskAutoEligibleAction(actionType: string): boolean {
  return matchesPrefix(actionType, LOW_RISK_AUTO_ACTION_PREFIXES);
}

export function evaluateAutopilotPolicy(input: AutopilotPolicyInput): AutopilotPolicyDecision {
  const { matrix, effectiveMode, killSwitch, globalPaused, actionType, domain, context } = input;

  if (context?.forceApproval === true || context?.complianceSensitive === true) {
    return {
      outcome: "REQUIRE_APPROVAL",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.CONTEXT_FORCES_APPROVAL,
      riskLevel: matrix.riskLevel,
      confidence: 0.97,
      reason:
        "Caller marked this candidate as compliance-sensitive or approval-required — queue for human review.",
    };
  }

  if (globalPaused) {
    return {
      outcome: "BLOCK",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.GLOBAL_PAUSE_ALL,
      riskLevel: matrix.riskLevel,
      confidence: 0.99,
      reason: "Global autopilot pause is active — no automatic or queued executes until resumed.",
    };
  }

  if (killSwitch === "OFF") {
    return {
      outcome: "BLOCK",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.DOMAIN_KILL_SWITCH_OFF,
      riskLevel: matrix.riskLevel,
      confidence: 0.99,
      reason: `Kill switch OFF for domain ${domain} — executions are blocked (audit trail preserved elsewhere).`,
    };
  }

  if (killSwitch === "LIMITED" && !matchesPrefix(actionType, LIMITED_WHITELIST_PREFIXES)) {
    return {
      outcome: "BLOCK",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.DOMAIN_KILL_SWITCH_LIMITED_NOT_ALLOWED,
      riskLevel: matrix.riskLevel,
      confidence: 0.95,
      reason: "Kill switch LIMITED — action not on the low-risk whitelist for this domain.",
    };
  }

  if (effectiveMode === "OFF") {
    return {
      outcome: "BLOCK",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.MODE_OFF,
      riskLevel: matrix.riskLevel,
      confidence: 0.98,
      reason: "Domain mode is OFF.",
    };
  }

  if (isV1Blocked(actionType)) {
    return {
      outcome: "REQUIRE_APPROVAL",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.V1_BLOCKED_CATEGORY,
      riskLevel: matrix.riskLevel,
      confidence: 0.92,
      reason:
        "This action category is excluded from automatic execution in v1 — requires explicit approval workflow.",
    };
  }

  const low = isLowRiskAutoEligibleAction(actionType);

  if (effectiveMode === "FULL_AUTOPILOT_APPROVAL" && matrix.riskLevel === "LOW" && low) {
    return {
      outcome: "ALLOW_AUTOMATIC",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.FULL_APPROVAL_LOW_EXEMPT,
      riskLevel: matrix.riskLevel,
      confidence: 0.8,
      reason:
        "Approval-first platform mode still allows bounded low-risk automations on low-risk domains.",
    };
  }

  if (matrix.riskLevel === "CRITICAL" || matrix.riskLevel === "HIGH") {
    if (matrix.requiresApproval || effectiveMode !== "SAFE_AUTOPILOT") {
      return {
        outcome: "REQUIRE_APPROVAL",
        policyRuleId: AUTOPILOT_POLICY_RULE_IDS.HIGH_RISK_REQUIRES_APPROVAL,
        riskLevel: matrix.riskLevel,
        confidence: 0.88,
        reason: "High-risk domain — human approval required before execution.",
      };
    }
  }

  if (effectiveMode === "ASSIST") {
    return {
      outcome: "REQUIRE_APPROVAL",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.ASSIST_REQUIRES_APPROVAL,
      riskLevel: matrix.riskLevel,
      confidence: 0.85,
      reason: "ASSIST mode surfaces recommendations; mutations queue for approval.",
    };
  }

  if (effectiveMode === "FULL_AUTOPILOT_APPROVAL") {
    return {
      outcome: "REQUIRE_APPROVAL",
      policyRuleId: AUTOPILOT_POLICY_RULE_IDS.FULL_APPROVAL_QUEUE,
      riskLevel: matrix.riskLevel,
      confidence: 0.9,
      reason: "Full autopilot with approval gate — all executes pass through the queue unless exempt low-risk policy applies.",
    };
  }

  if ((effectiveMode === "SAFE_AUTOPILOT" || effectiveMode === "FULL_AUTOPILOT_BOUNDED") && low) {
    return {
      outcome: "ALLOW_AUTOMATIC",
      policyRuleId:
        effectiveMode === "FULL_AUTOPILOT_BOUNDED" ?
          AUTOPILOT_POLICY_RULE_IDS.FULL_BOUNDED_LOW_RISK_AUTO
        : AUTOPILOT_POLICY_RULE_IDS.SAFE_AUTOPILOT_LOW_RISK_AUTO,
      riskLevel: matrix.riskLevel,
      confidence: 0.82,
      reason: "Bounded low-risk action eligible for automatic execution under current mode.",
    };
  }

  return {
    outcome: "REQUIRE_APPROVAL",
    policyRuleId: AUTOPILOT_POLICY_RULE_IDS.MODE_DOES_NOT_ALLOW_AUTOMATIC,
    riskLevel: matrix.riskLevel,
    confidence: 0.78,
    reason: "Action is not eligible for automatic execution under current mode — queue for operator approval.",
  };
}

/** Convenience predicate used by integrations. */
export function canAutopilotExecute(decision: AutopilotPolicyDecision): boolean {
  return decision.outcome === "ALLOW_AUTOMATIC";
}
