import type { FutureOutcomeInput, FutureOutcomeResult } from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";
import {
  buildPossibleRisks,
  buildRequiredActions,
  buildRequiredDocuments,
  buildTimelineSteps,
} from "@/src/modules/future-outcome-simulator/infrastructure/futureOutcomeEngine";
import {
  buildReadinessImpactCopy,
  mergeConfidence,
} from "@/src/modules/future-outcome-simulator/infrastructure/futureOutcomePolicyService";
import { FUTURE_OUTCOME_ADVISORY_DISCLAIMER } from "@/src/modules/future-outcome-simulator/policies/futureOutcomeSafety";

/**
 * Deterministic, advisory projection — no LLM. Ground inputs in real simulator output + optional case snapshot.
 */
export function simulateFutureOutcome(input: FutureOutcomeInput): FutureOutcomeResult {
  const { scenarioInput, simulationResult, caseState, dealSignals } = input;

  const timelineSteps = buildTimelineSteps(scenarioInput, simulationResult, caseState ?? null);
  const possibleRisks = buildPossibleRisks(scenarioInput, simulationResult, caseState ?? null);
  const requiredActions = buildRequiredActions(scenarioInput, caseState ?? null);
  const requiredDocuments = buildRequiredDocuments(scenarioInput, caseState ?? null);
  const readinessImpact = buildReadinessImpactCopy({ result: simulationResult, caseState });

  const conf = mergeConfidence({
    simulationConfidence: simulationResult.confidence,
    caseState: caseState ?? null,
    dealSignals: dealSignals ?? null,
  });

  const warnings = [...conf.warnings];
  if (simulationResult.keyWarnings.length) {
    warnings.push("Scenario warnings from the offer model are included under risks — they are illustrative, not legal advice.");
  }

  return {
    timelineSteps,
    possibleRisks,
    requiredActions,
    requiredDocuments,
    readinessImpact: {
      summary: readinessImpact.summary,
      bandLabel: readinessImpact.bandLabel,
      caseAlignmentNote: readinessImpact.caseAlignmentNote,
    },
    confidenceLevel: conf.level,
    simulationConfidence: conf.simulationConfidence,
    warnings,
    advisoryDisclaimer: FUTURE_OUTCOME_ADVISORY_DISCLAIMER,
  };
}
