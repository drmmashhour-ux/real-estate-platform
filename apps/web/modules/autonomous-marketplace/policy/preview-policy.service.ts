/**
 * Read-only preview policy engine — evaluates proposed actions against listing preview rules + deterministic safeguards.
 * No execution, no governance writes; returns empty array on failure (no throws).
 */

import { randomUUID } from "crypto";
import type {
  AutonomyMode,
  ObservationSnapshot,
  Opportunity,
  PolicyDecision,
  PolicyDisposition,
  PolicyRuleEvaluation,
  PolicyViolation,
  PolicyWarning,
  ProposedAction,
} from "../types/domain.types";
import { evaluateListingPreviewPolicyFromContext } from "./policy-engine";
import { buildPolicyContext } from "../execution/policy-context-builder";

export type EvaluateListingPreviewPolicyParams = {
  listingId: string;
  observation: ObservationSnapshot;
  opportunities: Opportunity[];
  proposedActions: ProposedAction[];
  autonomyMode: AutonomyMode;
};

export type PreviewRuleKind = "allow_action" | "caution_action" | "block_action_in_preview";

type PreviewDispositionLabel = "allow" | "caution" | "blocked_in_preview";

function aggregateDisposition(evals: PolicyRuleEvaluation[]): PolicyDisposition {
  const blocked = evals.filter((e) => e.result === "blocked");
  if (blocked.length > 0) {
    const needsApproval = blocked.some((b) => b.dispositionHint === "ALLOW_WITH_APPROVAL");
    if (needsApproval) return "ALLOW_WITH_APPROVAL";
    const dry = blocked.some((b) => b.dispositionHint === "ALLOW_DRY_RUN");
    if (dry) return "ALLOW_DRY_RUN";
    return "BLOCK";
  }
  const warnings = evals.filter((e) => e.result === "warning");
  if (warnings.length > 0) {
    const dry = warnings.some((w) => w.dispositionHint === "ALLOW_DRY_RUN");
    if (dry) return "ALLOW_DRY_RUN";
    return "ALLOW_WITH_APPROVAL";
  }
  return "ALLOW";
}

function rebuildDecisionFromRules(actionId: string, ruleResults: PolicyRuleEvaluation[]): PolicyDecision {
  const disposition = aggregateDisposition(ruleResults);
  const violations: PolicyViolation[] = [];
  const warnings: PolicyWarning[] = [];

  for (const e of ruleResults) {
    if (e.result === "blocked") {
      violations.push({
        code: e.ruleCode,
        message: e.reason ?? "Blocked by policy",
        ruleCode: e.ruleCode,
        metadata: e.metadata,
      });
    } else if (e.result === "warning") {
      warnings.push({
        code: e.ruleCode,
        message: e.reason ?? "Policy warning",
        ruleCode: e.ruleCode,
      });
    }
  }

  return {
    id: `pdc-${randomUUID()}`,
    actionId,
    disposition,
    violations,
    warnings,
    evaluatedAt: new Date().toISOString(),
    ruleResults,
  };
}

function previewAugmentationRules(action: ProposedAction, observation: ObservationSnapshot): PolicyRuleEvaluation[] {
  const extra: PolicyRuleEvaluation[] = [];
  const confidence = typeof action.confidence === "number" ? action.confidence : 1;
  if (confidence < 0.35) {
    extra.push({
      ruleCode: "preview_low_confidence",
      result: "warning",
      reason: "Weak signal — caution in preview.",
    });
  }

  const facts = observation.facts ?? {};
  if (facts.priceCents == null || facts.status == null) {
    extra.push({
      ruleCode: "preview_missing_critical_observation",
      result: "warning",
      reason: "Missing critical observation fields — caution in preview.",
    });
  }

  const modStr = typeof facts.moderationStatus === "string" ? facts.moderationStatus : "";
  if (modStr === "PENDING" || modStr === "REJECTED") {
    extra.push({
      ruleCode: "preview_compliance_readiness",
      result: "blocked",
      reason: "Listing compliance or moderation not ready — blocked in preview.",
    });
  }

  return extra;
}

/** Maps consolidated policy disposition to preview UX disposition (matches prior preview-policy-evaluator). */
export function mapPreviewDispositionLabel(policy: PolicyDecision): PreviewDispositionLabel {
  const d = policy.disposition;
  if (d === "BLOCK") return "blocked_in_preview";
  if (d === "ALLOW_WITH_APPROVAL" || (policy.warnings?.length ?? 0) > 0) return "caution";
  return "allow";
}

function labelToPreviewRuleKind(label: PreviewDispositionLabel): PreviewRuleKind {
  if (label === "blocked_in_preview") return "block_action_in_preview";
  if (label === "caution") return "caution_action";
  return "allow_action";
}

function severityForLabel(label: PreviewDispositionLabel): "info" | "warning" | "critical" {
  if (label === "blocked_in_preview") return "critical";
  if (label === "caution") return "warning";
  return "info";
}

/**
 * For each proposed action: run listing preview policy rules + deterministic preview safeguards; attach preview disposition row.
 */
export async function evaluateListingPreviewPolicy(
  params: EvaluateListingPreviewPolicyParams,
): Promise<PolicyDecision[]> {
  const out: PolicyDecision[] = [];
  try {
    for (const action of params.proposedActions) {
      const policyCtx = await buildPolicyContext({
        action,
        observation: params.observation,
        autonomyMode: params.autonomyMode,
      });
      const base = evaluateListingPreviewPolicyFromContext(policyCtx);
      const extras = previewAugmentationRules(action, params.observation);
      const merged = rebuildDecisionFromRules(action.id, [...base.ruleResults, ...extras]);
      const label = mapPreviewDispositionLabel(merged);
      const previewKind = labelToPreviewRuleKind(label);
      const severity = severityForLabel(label);

      out.push({
        ...merged,
        ruleResults: [
          ...merged.ruleResults,
          {
            ruleCode: "preview_pipeline_disposition",
            result: label === "blocked_in_preview" ? "blocked" : "passed",
            reason: `Preview disposition: ${label}`,
            metadata: {
              previewRuleKind: previewKind,
              previewSeverity: severity,
              listingId: params.listingId,
            },
          },
        ],
      });
    }
    return out;
  } catch {
    return [];
  }
}
