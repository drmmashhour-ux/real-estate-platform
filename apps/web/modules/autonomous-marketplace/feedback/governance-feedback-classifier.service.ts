/**
 * Deterministic outcome classifier — advisory only; never mutates governance thresholds.
 */
import type {
  GovernanceFeedbackInput,
  GovernanceFeedbackResult,
  GovernanceGroundTruthEvent,
} from "./governance-feedback.types";

function hasEvent(
  events: GovernanceGroundTruthEvent[],
  type: GovernanceGroundTruthEvent["type"],
): boolean {
  return events.some((event) => event.type === type);
}

function sumAmounts(
  events: GovernanceGroundTruthEvent[],
  types: GovernanceGroundTruthEvent["type"][],
): number {
  return events
    .filter((event) => types.includes(event.type))
    .reduce((sum, event) => sum + (typeof event.amount === "number" ? event.amount : 0), 0);
}

export function classifyGovernanceOutcome(input: GovernanceFeedbackInput): GovernanceFeedbackResult {
  try {
    const reasons: string[] = [];
    const recommendedActions: string[] = [];

    const blocked = input.prediction.blocked;
    const requiresApproval = input.prediction.requiresHumanApproval;
    const allowExecution = input.prediction.allowExecution;

    const fraudConfirmed = hasEvent(input.truthEvents, "fraud_confirmed");
    const fraudCleared = hasEvent(input.truthEvents, "fraud_cleared");
    const approvalGranted = hasEvent(input.truthEvents, "manual_approval_granted");
    const approvalRejected = hasEvent(input.truthEvents, "manual_approval_rejected");
    const executionSucceeded = hasEvent(input.truthEvents, "execution_succeeded");
    const executionFailed = hasEvent(input.truthEvents, "execution_failed");

    const harmfulEvents = [
      hasEvent(input.truthEvents, "chargeback"),
      hasEvent(input.truthEvents, "refund"),
      hasEvent(input.truthEvents, "payout_reversal"),
      fraudConfirmed,
      hasEvent(input.truthEvents, "trust_escalation_opened"),
      hasEvent(input.truthEvents, "listing_removed"),
    ].some(Boolean);

    const negativeRevenue = sumAmounts(input.truthEvents, ["refund", "chargeback", "payout_reversal"]);

    if (blocked) {
      if (harmfulEvents || fraudConfirmed || approvalRejected) {
        reasons.push("Blocked decision aligned with harmful or high-risk outcome.");
        return {
          label: "GOOD_BLOCK",
          confidence: harmfulEvents ? "HIGH" : "MEDIUM",
          falsePositive: false,
          falseNegative: false,
          protectedRevenueEstimate: Math.max(input.prediction.revenueImpactEstimate ?? 0, negativeRevenue),
          leakedRevenueEstimate: 0,
          reasons,
          recommendedActions,
        };
      }

      if (fraudCleared || executionSucceeded) {
        reasons.push("Blocked decision appears overly conservative given favorable outcome.");
        recommendedActions.push("Review block thresholds for similar cases.");
        return {
          label: "BAD_BLOCK",
          confidence: "MEDIUM",
          falsePositive: true,
          falseNegative: false,
          protectedRevenueEstimate: 0,
          leakedRevenueEstimate: 0,
          reasons,
          recommendedActions,
        };
      }

      reasons.push("Blocked decision lacks enough post-decision evidence.");
      return {
        label: "INSUFFICIENT_DATA",
        confidence: "LOW",
        falsePositive: false,
        falseNegative: false,
        protectedRevenueEstimate: 0,
        leakedRevenueEstimate: 0,
        reasons,
        recommendedActions,
      };
    }

    if (requiresApproval) {
      if (approvalRejected && harmfulEvents) {
        reasons.push("Approval boundary correctly escalated a harmful case.");
        return {
          label: "GOOD_APPROVAL",
          confidence: "HIGH",
          falsePositive: false,
          falseNegative: false,
          protectedRevenueEstimate: Math.max(input.prediction.revenueImpactEstimate ?? 0, negativeRevenue),
          leakedRevenueEstimate: 0,
          reasons,
          recommendedActions,
        };
      }

      if (approvalGranted && executionSucceeded && !harmfulEvents && !fraudConfirmed) {
        reasons.push("Approval boundary added oversight and execution succeeded safely.");
        return {
          label: "GOOD_APPROVAL",
          confidence: "MEDIUM",
          falsePositive: false,
          falseNegative: false,
          protectedRevenueEstimate: 0,
          leakedRevenueEstimate: 0,
          reasons,
          recommendedActions,
        };
      }

      if (approvalGranted && harmfulEvents) {
        reasons.push("Approved case later showed harmful signals.");
        recommendedActions.push("Review approval criteria and post-approval safeguards.");
        return {
          label: "BAD_APPROVAL",
          confidence: "HIGH",
          falsePositive: false,
          falseNegative: true,
          protectedRevenueEstimate: 0,
          leakedRevenueEstimate: negativeRevenue,
          reasons,
          recommendedActions,
        };
      }

      reasons.push("Approval path lacks enough post-decision evidence.");
      return {
        label: "INSUFFICIENT_DATA",
        confidence: "LOW",
        falsePositive: false,
        falseNegative: false,
        protectedRevenueEstimate: 0,
        leakedRevenueEstimate: 0,
        reasons,
        recommendedActions,
      };
    }

    if (allowExecution) {
      if (executionSucceeded && !harmfulEvents && !fraudConfirmed) {
        reasons.push("Execution succeeded without harmful downstream signals.");
        return {
          label: "GOOD_EXECUTION",
          confidence: "HIGH",
          falsePositive: false,
          falseNegative: false,
          protectedRevenueEstimate: 0,
          leakedRevenueEstimate: 0,
          reasons,
          recommendedActions,
        };
      }

      const harmfulOrFraudTruth = harmfulEvents || fraudConfirmed;
      const executionLifecycleObserved = executionSucceeded || executionFailed;

      if (harmfulOrFraudTruth && executionLifecycleObserved) {
        reasons.push("Allowed execution produced harmful or failed outcome.");
        recommendedActions.push("Tighten execution thresholds for similar cases.");
        return {
          label: "BAD_EXECUTION",
          confidence: "HIGH",
          falsePositive: false,
          falseNegative: true,
          protectedRevenueEstimate: 0,
          leakedRevenueEstimate: negativeRevenue,
          reasons,
          recommendedActions,
        };
      }

      if (harmfulOrFraudTruth && !executionLifecycleObserved) {
        reasons.push("Harmful downstream signals without recorded execution lifecycle — risk likely underestimated upstream.");
        recommendedActions.push("Review low-risk thresholds and signal coverage before execution.");
        return {
          label: "MISSED_RISK",
          confidence: "HIGH",
          falsePositive: false,
          falseNegative: true,
          protectedRevenueEstimate: 0,
          leakedRevenueEstimate: negativeRevenue,
          reasons,
          recommendedActions,
        };
      }

      if (executionFailed) {
        reasons.push("Allowed execution failed without downstream harm signals.");
        recommendedActions.push("Review execution reliability for similar cases.");
        return {
          label: "BAD_EXECUTION",
          confidence: "MEDIUM",
          falsePositive: false,
          falseNegative: true,
          protectedRevenueEstimate: 0,
          leakedRevenueEstimate: 0,
          reasons,
          recommendedActions,
        };
      }
    }

    if (!blocked && !requiresApproval && harmfulEvents) {
      reasons.push("Risk was missed by governance despite downstream harmful outcome.");
      recommendedActions.push("Review low-risk thresholds and missing signal coverage.");
      return {
        label: "MISSED_RISK",
        confidence: "HIGH",
        falsePositive: false,
        falseNegative: true,
        protectedRevenueEstimate: 0,
        leakedRevenueEstimate: negativeRevenue,
        reasons,
        recommendedActions,
      };
    }

    reasons.push("Not enough evidence to classify outcome confidently.");
    return {
      label: "INSUFFICIENT_DATA",
      confidence: "LOW",
      falsePositive: false,
      falseNegative: false,
      protectedRevenueEstimate: 0,
      leakedRevenueEstimate: 0,
      reasons,
      recommendedActions,
    };
  } catch {
    return {
      label: "INSUFFICIENT_DATA",
      confidence: "LOW",
      falsePositive: false,
      falseNegative: false,
      protectedRevenueEstimate: 0,
      leakedRevenueEstimate: 0,
      reasons: ["Classifier fallback triggered."],
      recommendedActions: [],
    };
  }
}
