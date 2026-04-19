/**
 * Conservative eligibility for the single adjacent internal trial — explainable outcomes only.
 */

import type { GrowthAutonomyMode, GrowthAutonomyRolloutStage } from "./growth-autonomy.types";
import { evaluateGrowthAutonomyAuditHealth } from "./growth-autonomy-audit-health.service";
import {
  ADJACENT_INTERNAL_TRIAL_ACTION_ID,
  ADJACENT_INTERNAL_TRIAL_LABEL,
  ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
} from "./growth-autonomy-trial-boundaries";
import type {
  GrowthAutonomyTrialCandidateAction,
  GrowthAutonomyTrialEligibilityOutcome,
  GrowthAutonomyTrialExplanation,
} from "./growth-autonomy-trial.types";
import type { GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";
import { getEnforcementForTarget } from "./growth-policy-enforcement-query.service";

const SPARSE_WARN_THRESHOLD = 4;

function buildExplanation(partial: GrowthAutonomyTrialExplanation): GrowthAutonomyTrialExplanation {
  return partial;
}

function buildCandidate(args: {
  enfMode: GrowthAutonomyTrialCandidateAction["enforcementResult"]["mode"];
  enfRationale: string;
  confidence: number;
  evidenceQualityScore: number;
}): GrowthAutonomyTrialCandidateAction {
  return {
    id: ADJACENT_INTERNAL_TRIAL_ACTION_ID,
    target: "panel_render_hint",
    actionType: ADJACENT_INTERNAL_TRIAL_ACTION_TYPE,
    category: "adjacent_internal_trial",
    explanation: ADJACENT_INTERNAL_TRIAL_LABEL,
    confidence: args.confidence,
    enforcementResult: { mode: args.enfMode, rationale: args.enfRationale },
    allowedReason:
      "Adjacent to bounded panel_render_hint advisory — draft-only internal artifact; operators retain undo.",
    disallowedReason: null,
    reversibility: "Rollback archives the draft marker and clears operator-visible trial state.",
    baselineAllowlisted: false,
    trialBased: true,
    evidenceQualityScore: args.evidenceQualityScore,
  };
}

export async function evaluateAdjacentInternalTrialEligibility(args: {
  enforcementSnapshot: GrowthPolicyEnforcementSnapshot | null;
  enforcementInputPartial: boolean;
  missingDataWarnings: string[];
  autonomyMode: GrowthAutonomyMode;
  rolloutStage: GrowthAutonomyRolloutStage;
  trialFeatureOn: boolean;
  killSwitch: boolean;
  trialFreeze: boolean;
  expansionFreeze: boolean;
  trialAlreadyActiveOrApproved: boolean;
}): Promise<{
  outcome: GrowthAutonomyTrialEligibilityOutcome;
  explanation: GrowthAutonomyTrialExplanation;
  selectedCandidate: GrowthAutonomyTrialCandidateAction | null;
  holdCandidates: GrowthAutonomyTrialCandidateAction[];
}> {
  const emptyHold: GrowthAutonomyTrialCandidateAction[] = [];

  if (!args.trialFeatureOn) {
    return {
      outcome: "not_eligible",
      explanation: buildExplanation({
        whyEligibleOrNot: "Internal trial layer flag is off (FEATURE_GROWTH_AUTONOMY_TRIAL_V1).",
        evidenceSummary: "—",
        auditHealthSummary: "—",
        policyGateSummary: "—",
      }),
      selectedCandidate: null,
      holdCandidates: emptyHold,
    };
  }

  if (args.killSwitch) {
    return {
      outcome: "not_eligible",
      explanation: buildExplanation({
        whyEligibleOrNot: "Kill switch active — no trial evaluation.",
        evidenceSummary: "—",
        auditHealthSummary: "—",
        policyGateSummary: "—",
      }),
      selectedCandidate: null,
      holdCandidates: emptyHold,
    };
  }

  if (args.autonomyMode !== "SAFE_AUTOPILOT") {
    return {
      outcome: "not_eligible",
      explanation: buildExplanation({
        whyEligibleOrNot: "Adjacent internal trial requires autonomy mode SAFE_AUTOPILOT (assist stays suggestion-only).",
        evidenceSummary: "—",
        auditHealthSummary: "—",
        policyGateSummary: "—",
      }),
      selectedCandidate: null,
      holdCandidates: emptyHold,
    };
  }

  if (args.rolloutStage !== "internal") {
    return {
      outcome: "not_eligible",
      explanation: buildExplanation({
        whyEligibleOrNot:
          "Trial activation is allowed only when FEATURE_GROWTH_AUTONOMY_ROLLOUT=internal for this phase.",
        evidenceSummary: "—",
        auditHealthSummary: "—",
        policyGateSummary: `Current rollout: ${args.rolloutStage}`,
      }),
      selectedCandidate: null,
      holdCandidates: emptyHold,
    };
  }

  const audit = await evaluateGrowthAutonomyAuditHealth({
    since: new Date(Date.now() - 30 * 86400000),
  });

  const auditSummary = audit.healthy
    ? `Healthy (${audit.rowCountWindow} audit rows, ${audit.distinctActionKeys} keys).`
    : `Unhealthy: ${audit.reasons.join(" ")}`;

  if (!args.enforcementSnapshot) {
    return {
      outcome: "insufficient_data",
      explanation: buildExplanation({
        whyEligibleOrNot: "Policy enforcement snapshot unavailable — cannot anchor trial gates.",
        evidenceSummary: "No enforcement snapshot.",
        auditHealthSummary: auditSummary,
        policyGateSummary: "snapshot=null",
      }),
      selectedCandidate: null,
      holdCandidates: emptyHold,
    };
  }

  const enf = getEnforcementForTarget("panel_render_hint", args.enforcementSnapshot);
  const policySummary = `${enf.mode}: ${enf.rationale}`;

  if (enf.mode === "block" || enf.mode === "freeze") {
    const cand = buildCandidate({
      enfMode: enf.mode,
      enfRationale: enf.rationale,
      confidence: 0.15,
      evidenceQualityScore: 0,
    });
    return {
      outcome: "not_eligible",
      explanation: buildExplanation({
        whyEligibleOrNot: `Policy blocks adjacent trial while panel_render_hint is ${enf.mode}.`,
        evidenceSummary: "Enforcement gate failed.",
        auditHealthSummary: auditSummary,
        policyGateSummary: policySummary,
      }),
      selectedCandidate: cand,
      holdCandidates: emptyHold,
    };
  }

  if (args.missingDataWarnings.length >= SPARSE_WARN_THRESHOLD) {
    return {
      outcome: "insufficient_data",
      explanation: buildExplanation({
        whyEligibleOrNot: "Too many missing-data warnings — trial would be unreliable.",
        evidenceSummary: `missingDataWarnings count=${args.missingDataWarnings.length}`,
        auditHealthSummary: auditSummary,
        policyGateSummary: policySummary,
      }),
      selectedCandidate: null,
      holdCandidates: emptyHold,
    };
  }

  if (!audit.healthy) {
    return {
      outcome: "insufficient_data",
      explanation: buildExplanation({
        whyEligibleOrNot: "Audit health gate failed — conservative hold.",
        evidenceSummary: audit.reasons.join("; ") || "audit_unhealthy",
        auditHealthSummary: auditSummary,
        policyGateSummary: policySummary,
      }),
      selectedCandidate: null,
      holdCandidates: emptyHold,
    };
  }

  const evidenceQuality =
    args.enforcementInputPartial ? 0.62 : audit.healthy ? 0.88 : 0.55;

  const cand = buildCandidate({
    enfMode: enf.mode,
    enfRationale: enf.rationale,
    confidence: args.enforcementInputPartial ? 0.58 : 0.81,
    evidenceQualityScore: evidenceQuality,
  });

  if (args.trialFreeze) {
    return {
      outcome: "hold",
      explanation: buildExplanation({
        whyEligibleOrNot:
          "Trial freeze flag on (FEATURE_GROWTH_AUTONOMY_TRIAL_FREEZE) — no new approvals or activations.",
        evidenceSummary: "freeze_active",
        auditHealthSummary: auditSummary,
        policyGateSummary: policySummary,
      }),
      selectedCandidate: cand,
      holdCandidates: emptyHold,
    };
  }

  if (args.expansionFreeze) {
    return {
      outcome: "hold",
      explanation: buildExplanation({
        whyEligibleOrNot:
          "Expansion freeze is on — adjacent trial activation is held to avoid parallel expansion experiments.",
        evidenceSummary: "expansion_freeze",
        auditHealthSummary: auditSummary,
        policyGateSummary: policySummary,
      }),
      selectedCandidate: cand,
      holdCandidates: emptyHold,
    };
  }

  if (args.trialAlreadyActiveOrApproved) {
    return {
      outcome: "hold",
      explanation: buildExplanation({
        whyEligibleOrNot: "Only one internal trial may be active or pending in this phase.",
        evidenceSummary: "slot_occupied",
        auditHealthSummary: auditSummary,
        policyGateSummary: policySummary,
      }),
      selectedCandidate: cand,
      holdCandidates: emptyHold,
    };
  }

  /** Rollback suggestion when audit integrity borderline but not blocking */
  if (args.enforcementInputPartial && args.missingDataWarnings.length >= 2) {
    return {
      outcome: "rollback_candidate",
      explanation: buildExplanation({
        whyEligibleOrNot:
          "Partial inputs plus multiple warnings — treat as rollback candidate if a trial were active.",
        evidenceSummary: "partial+sparse",
        auditHealthSummary: auditSummary,
        policyGateSummary: policySummary,
      }),
      selectedCandidate: cand,
      holdCandidates: emptyHold,
    };
  }

  return {
    outcome: "eligible_for_internal_trial",
    explanation: buildExplanation({
      whyEligibleOrNot:
        "Adjacent internal-only draft note variant passes policy, audit health, and rollout gates.",
      evidenceSummary: `Evidence quality score ~${evidenceQuality.toFixed(2)} (bounded heuristic).`,
      auditHealthSummary: auditSummary,
      policyGateSummary: policySummary,
    }),
    selectedCandidate: cand,
    holdCandidates: emptyHold,
  };
}
