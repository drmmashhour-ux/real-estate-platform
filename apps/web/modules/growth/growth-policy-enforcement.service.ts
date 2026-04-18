/**
 * Policy enforcement snapshot — maps governance policy + signals to enforceable targets (advisory scope only).
 */

import {
  aiGrowthAutopilotSafeFlags,
  growthGovernanceFlags,
  growthGovernancePolicyFlags,
  growthLearningFlags,
  growthPolicyEnforcementFlags,
} from "@/config/feature-flags";
import { evaluateGrowthGovernance } from "./growth-governance.service";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";
import { buildGrowthGovernancePolicySnapshot } from "./growth-governance-policy.service";
import type { GrowthGovernancePolicySnapshot } from "./growth-governance-policy.types";
import type { GrowthPolicyDomain, GrowthPolicyMode } from "./growth-governance-policy.types";
import {
  logGrowthPolicyEnforcementBuildStarted,
  recordGrowthPolicyEnforcementBuild,
} from "./growth-policy-enforcement-monitoring.service";
import type {
  GrowthEnforcementMode,
  GrowthEnforcementTarget,
  GrowthPolicyInputCompleteness,
  GrowthPolicyEnforcementRule,
  GrowthPolicyEnforcementSnapshot,
} from "./growth-policy-enforcement.types";

function ts(): string {
  return new Date().toISOString();
}

function policyModeForDomain(
  policySnapshot: GrowthGovernancePolicySnapshot | null,
  domain: GrowthPolicyDomain,
): GrowthPolicyMode | undefined {
  return policySnapshot?.rules.find((r) => r.domain === domain)?.mode;
}

function toEnforcementMode(pm: GrowthPolicyMode | undefined, fallback: GrowthEnforcementMode): GrowthEnforcementMode {
  if (!pm) return fallback;
  switch (pm) {
    case "allowed":
      return "allow";
    case "advisory_only":
      return "advisory_only";
    case "approval_required":
      return "approval_required";
    case "blocked":
      return "block";
    case "frozen":
      return "freeze";
    default:
      return fallback;
  }
}

function rule(
  id: string,
  target: GrowthEnforcementTarget,
  mode: GrowthEnforcementMode,
  rationale: string,
  source: GrowthPolicyEnforcementRule["source"],
): GrowthPolicyEnforcementRule {
  return { id, target, mode, rationale, source, createdAt: ts() };
}

export type AssembleGrowthPolicyEnforcementInput = {
  policySnapshot: GrowthGovernancePolicySnapshot | null;
  governance: GrowthGovernanceDecision | null;
  learningControl: GrowthLearningControlDecision | null;
  autopilotExecutionEnabled: boolean;
  missingDataWarnings: string[];
};

/**
 * Pure assembly — used by tests and async builder.
 */
export function assembleGrowthPolicyEnforcementSnapshot(input: AssembleGrowthPolicyEnforcementInput): GrowthPolicyEnforcementSnapshot {
  const ps = input.policySnapshot;
  const gov = input.governance;
  const lc = input.learningControl;

  const apDomain = (d: GrowthPolicyDomain) => toEnforcementMode(policyModeForDomain(ps, d), "advisory_only");

  let learningMode = apDomain("learning");
  if (lc?.state === "freeze_recommended") {
    learningMode = "freeze";
  } else if (lc?.state === "monitor") {
    learningMode = "advisory_only";
  } else if (lc?.state === "reset_recommended") {
    learningMode = "approval_required";
  }

  const rawAutopilot = toEnforcementMode(policyModeForDomain(ps, "autopilot"), "approval_required");

  let autopilotAdvisory: GrowthEnforcementMode = "advisory_only";
  if (rawAutopilot === "block" || rawAutopilot === "freeze") {
    autopilotAdvisory = rawAutopilot;
  } else if (rawAutopilot === "approval_required" || rawAutopilot === "advisory_only") {
    autopilotAdvisory = "advisory_only";
  } else {
    autopilotAdvisory = "allow";
  }

  let autopilotSafe = rawAutopilot;
  if (rawAutopilot === "allow" && !input.autopilotExecutionEnabled) {
    autopilotSafe = "approval_required";
  }

  const fusionMode = apDomain("fusion");
  const contentMode = apDomain("content");
  const messagingMode = apDomain("messaging");

  let simPromo: GrowthEnforcementMode = "allow";
  let stratPromo: GrowthEnforcementMode = "allow";
  if (gov) {
    if (gov.status === "human_review_required" || gov.status === "freeze_recommended") {
      simPromo = gov.status === "freeze_recommended" ? "freeze" : "approval_required";
      stratPromo = simPromo;
    } else if (gov.status === "caution" || gov.status === "watch") {
      simPromo = "advisory_only";
      stratPromo = "advisory_only";
    }
    if (gov.topRisks.filter((r) => r.severity === "high").length >= 2) {
      simPromo = simPromo === "allow" ? "approval_required" : simPromo;
      stratPromo = stratPromo === "allow" ? "approval_required" : stratPromo;
    }
  }

  const panelHint: GrowthEnforcementMode =
    gov?.status === "human_review_required" ? "advisory_only" : "allow";

  const rules: GrowthPolicyEnforcementRule[] = [
    rule("enf-ap-adv", "autopilot_advisory_conversion", autopilotAdvisory, "Mapped from autopilot policy domain.", "policy_snapshot"),
    rule("enf-ap-safe", "autopilot_safe_execution", autopilotSafe, "Mapped from autopilot policy + execution flag.", "policy_snapshot"),
    rule("enf-learn", "learning_adjustments", learningMode, "Learning domain + learning control overlay.", "learning_control"),
    rule("enf-content", "content_assist_generation", contentMode, "Content domain policy.", "policy_snapshot"),
    rule("enf-msg", "messaging_assist_generation", messagingMode, "Messaging domain policy.", "policy_snapshot"),
    rule("enf-fus-ap", "fusion_autopilot_bridge", fusionMode, "Fusion advisory bridges follow fusion domain.", "policy_snapshot"),
    rule("enf-fus-ct", "fusion_content_bridge", fusionMode, "Fusion advisory bridges follow fusion domain.", "policy_snapshot"),
    rule("enf-fus-inf", "fusion_influence_bridge", fusionMode, "Fusion advisory bridges follow fusion domain.", "policy_snapshot"),
    rule("enf-sim", "simulation_recommendation_promotion", simPromo, "Governance posture for promotion gating.", "governance"),
    rule("enf-strat", "strategy_recommendation_promotion", stratPromo, "Governance posture for promotion gating.", "governance"),
    rule("enf-panel", "panel_render_hint", panelHint, "Global governance hint for advisory panels.", "governance"),
  ];

  const blockedTargets = rules.filter((r) => r.mode === "block").map((r) => r.target);
  const frozenTargets = rules.filter((r) => r.mode === "freeze").map((r) => r.target);
  const approvalRequiredTargets = rules.filter((r) => r.mode === "approval_required").map((r) => r.target);

  const notes: string[] = [];
  if (input.missingDataWarnings.length) {
    notes.push(`Partial inputs: ${input.missingDataWarnings.slice(0, 5).join("; ")}`);
  }
  notes.push("Enforcement applies to non-critical advisory/orchestration paths only — not payments, bookings, ads core, or CRO core.");

  const completeness: GrowthPolicyInputCompleteness =
    input.missingDataWarnings.length > 0 ? "partial" : "complete";

  return {
    rules,
    blockedTargets: [...new Set(blockedTargets)],
    frozenTargets: [...new Set(frozenTargets)],
    approvalRequiredTargets: [...new Set(approvalRequiredTargets)],
    notes: notes.slice(0, 8),
    createdAt: ts(),
    inputCompleteness: completeness,
    missingDataWarnings: input.missingDataWarnings.slice(0, 12),
  };
}

export async function buildGrowthPolicyEnforcementSnapshot(): Promise<GrowthPolicyEnforcementSnapshot | null> {
  if (!growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    return null;
  }

  logGrowthPolicyEnforcementBuildStarted();
  const missingDataWarnings: string[] = [];

  let policySnapshot: GrowthGovernancePolicySnapshot | null = null;
  if (growthGovernancePolicyFlags.growthGovernancePolicyV1) {
    try {
      policySnapshot = await buildGrowthGovernancePolicySnapshot();
    } catch {
      missingDataWarnings.push("policy_unavailable");
    }
  }

  let governance: GrowthGovernanceDecision | null = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  }

  let learningControl: GrowthLearningControlDecision | null = null;
  if (growthLearningFlags.growthLearningV1) {
    try {
      const { getGrowthLearningReadOnlyForCadence } = await import("./growth-learning.service");
      const lr = await getGrowthLearningReadOnlyForCadence();
      learningControl = lr?.learningControl ?? null;
    } catch {
      missingDataWarnings.push("learning_control_unavailable");
    }
  }

  const snapshot = assembleGrowthPolicyEnforcementSnapshot({
    policySnapshot,
    governance,
    learningControl,
    autopilotExecutionEnabled: aiGrowthAutopilotSafeFlags.aiAutopilotExecutionV1,
    missingDataWarnings,
  });

  recordGrowthPolicyEnforcementBuild({
    blockedCount: snapshot.blockedTargets.length,
    frozenCount: snapshot.frozenTargets.length,
    approvalCount: snapshot.approvalRequiredTargets.length,
    advisoryOnlyCount: snapshot.rules.filter((r) => r.mode === "advisory_only").length,
    notesCount: snapshot.notes.length,
    missingDataWarningCount: missingDataWarnings.length,
    gatedTargets: snapshot.rules.filter((r) => r.mode !== "allow").map((r) => r.target),
  });

  return snapshot;
}
