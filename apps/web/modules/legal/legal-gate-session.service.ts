import { legalHubFlags } from "@/config/feature-flags";
import { buildPolicyContext } from "@/modules/autonomous-marketplace/execution/policy-context-builder";
import {
  buildLegalComplianceProposedAction,
  buildMinimalLegalObservation,
} from "@/modules/autonomous-marketplace/execution/legal-compliance-action";
import { evaluateLegalCompliancePolicyOnly } from "@/modules/autonomous-marketplace/policy/policy-engine";
import type {
  LegalGateAction,
  LegalGateResult,
  LegalReadinessScore,
} from "./legal-readiness.types";
import { legalPolicyDecisionToGateResult } from "./legal-policy-bridge";

/**
 * Loads Legal Hub snapshot via autonomous marketplace policy context builder, then evaluates **legal policy rules only**.
 * Delegates checklist logic to `evaluateLegalGate` inside policy rules — single enforcement path.
 */
export async function evaluateLegalComplianceForUser(params: {
  action: LegalGateAction;
  userId: string | null;
  /** Passed through to Legal Hub context parser (same as `/legal` actor hints). */
  actorHint?: string | null;
  locale: string;
  country: string;
  jurisdictionHint?: string | null;
}): Promise<{ gate: LegalGateResult; readiness: LegalReadinessScore | null }> {
  try {
    const uid = params.userId;
    if (!uid) {
      return {
        gate: {
          allowed: true,
          mode: "none",
          reasons: ["Sign-in required for personalized compliance snapshot."],
          blockingRequirements: [],
        },
        readiness: null,
      };
    }

    const action = buildLegalComplianceProposedAction({
      gateAction: params.action,
      correlationId: uid,
      target: { type: "scan", id: null },
    });
    const observation = buildMinimalLegalObservation(action.target);

    const policyCtx = await buildPolicyContext({
      action,
      observation,
      autonomyMode: "ASSIST",
      legalHub: {
        userId: uid,
        locale: params.locale,
        country: params.country,
        actorHint: params.actorHint ?? undefined,
        jurisdictionHint:
          params.jurisdictionHint ?? (params.country.toLowerCase() === "ca" ? "QC" : null),
      },
    });

    const readiness =
      legalHubFlags.legalReadinessV1 && policyCtx.legalReadinessScore
        ? policyCtx.legalReadinessScore
        : null;

    const decision = evaluateLegalCompliancePolicyOnly(policyCtx);
    const gate = legalPolicyDecisionToGateResult(decision);
    return { gate, readiness };
  } catch {
    return {
      gate: {
        allowed: true,
        mode: "none",
        reasons: ["Compliance pre-check unavailable; no additional platform block applied."],
        blockingRequirements: [],
      },
      readiness: null,
    };
  }
}
