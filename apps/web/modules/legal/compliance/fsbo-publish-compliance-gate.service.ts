/**
 * Shared FSBO publish compliance gate — used by checkout + Stripe webhook (deterministic).
 */

import { complianceFlags } from "@/config/feature-flags";
import {
  evaluateListingPublishComplianceDecision,
  loadQuebecComplianceEvaluatorInput,
  shouldApplyQuebecComplianceForListing,
} from "./listing-publish-compliance.service";
import { evaluateListingPrepublishBlock } from "./prepublish-auto-block.service";

export type FsboComplianceGateOutcome =
  | { blocked: false }
  | {
      blocked: true;
      readinessScore: number;
      legalRiskScore: number;
      blockingIssues: string[];
      reasons: string[];
      reviewRequired: boolean;
    };

/**
 * Returns whether Stripe activation / publish pipeline should skip listing activation for compliance.
 */
export async function evaluateFsboActivationComplianceGate(listingId: string): Promise<FsboComplianceGateOutcome> {
  try {
    const publishGateEnabled =
      complianceFlags.quebecComplianceV1 === true &&
      (complianceFlags.complianceAutoBlockV1 === true || complianceFlags.listingPrepublishAutoBlockV1 === true);

    if (!publishGateEnabled) return { blocked: false };

    const inp = await loadQuebecComplianceEvaluatorInput(listingId);
    const applies =
      inp !== null &&
      shouldApplyQuebecComplianceForListing({ country: inp.listing.country ?? "", region: inp.listing.region ?? "" });

    if (!applies) return { blocked: false };

    const usePhase8Evaluator =
      complianceFlags.quebecListingComplianceV1 === true ||
      complianceFlags.listingPrepublishAutoBlockV1 === true ||
      complianceFlags.propertyLegalRiskScoreV1 === true;

    if (usePhase8Evaluator) {
      const ev = evaluateListingPrepublishBlock({ listingId, evaluatorInput: inp });
      if (!ev.allowed) {
        return {
          blocked: true,
          readinessScore: ev.readinessScore,
          legalRiskScore: ev.legalRiskScore,
          blockingIssues: ev.blockingIssues,
          reasons: ev.userSafeReasons,
          reviewRequired: ev.reviewRequired,
        };
      }
      return { blocked: false };
    }

    const qc = await evaluateListingPublishComplianceDecision(listingId);
    if (qc.apply && !qc.decision.allowed) {
      return {
        blocked: true,
        readinessScore: qc.decision.readinessScore,
        legalRiskScore: Math.max(0, 100 - qc.decision.readinessScore),
        blockingIssues: qc.decision.blockingIssues,
        reasons: qc.decision.reasons,
        reviewRequired: true,
      };
    }

    return { blocked: false };
  } catch {
    return {
      blocked: true,
      readinessScore: 0,
      legalRiskScore: 100,
      blockingIssues: ["qc_gate_fallback"],
      reasons: ["Additional verification is required before publishing."],
      reviewRequired: true,
    };
  }
}
