import { ImpactBand, SimulationConfidence } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.enums";
import type { OfferSimulationResult } from "@/src/modules/offer-strategy-simulator/domain/offerStrategy.types";
import type {
  FutureOutcomeCaseInput,
  FutureOutcomeConfidenceLevel,
  FutureOutcomeDealSignals,
} from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";
import { FUTURE_OUTCOME_UNCERTAINTY_LOW_DATA } from "@/src/modules/future-outcome-simulator/policies/futureOutcomeSafety";

function bandLabel(band: ImpactBand): string {
  switch (band) {
    case ImpactBand.Favorable:
      return "Favorable (model)";
    case ImpactBand.Neutral:
      return "Neutral (model)";
    case ImpactBand.Caution:
      return "Needs attention (model)";
    case ImpactBand.Elevated:
      return "Elevated risk (model)";
    default:
      return "Mixed (model)";
  }
}

export function buildReadinessImpactCopy(args: {
  result: OfferSimulationResult;
  caseState: FutureOutcomeCaseInput | null | undefined;
}): {
  summary: string;
  bandLabel: string;
  caseAlignmentNote: string;
} {
  const { result, caseState } = args;
  const bandLabelStr = bandLabel(result.readinessImpact.band);
  let caseAlignmentNote =
    "Case file alignment is unknown — add case context for a tighter readiness note.";
  if (caseState) {
    if (caseState.caseStatus === "critical" || caseState.documentPanels.sellerDeclaration === "blocked") {
      caseAlignmentNote =
        "Seller-side file items are still open — closing readiness usually waits until mandatory disclosures and review milestones are cleared.";
    } else if (caseState.signatureReadinessStatus === "ready" && caseState.caseStatus === "ready") {
      caseAlignmentNote =
        "Case checklist looks advanced in this snapshot — offer conditions still control what must happen before a firm deal.";
    } else if (caseState.signatureReadinessStatus === "not_ready") {
      caseAlignmentNote =
        "Signature readiness is not complete on file — expect extra steps before a binding closing timeline.";
    } else {
      caseAlignmentNote =
        "Case is partially advanced — match these timeline steps to what your broker confirms on the ground.";
    }
  }
  return {
    summary: result.readinessImpact.summary,
    bandLabel: bandLabelStr,
    caseAlignmentNote,
  };
}

export function mergeConfidence(args: {
  simulationConfidence: SimulationConfidence;
  caseState: FutureOutcomeCaseInput | null | undefined;
  dealSignals: FutureOutcomeDealSignals | null | undefined;
}): { level: FutureOutcomeConfidenceLevel; simulationConfidence: SimulationConfidence; warnings: string[] } {
  const warnings: string[] = [];
  let level: FutureOutcomeConfidenceLevel =
    args.simulationConfidence === SimulationConfidence.High
      ? "high"
      : args.simulationConfidence === SimulationConfidence.Medium
        ? "medium"
        : "low";

  const ds = args.dealSignals;
  if (ds) {
    if (ds.blockerCount > 0 || ds.contradictionCount > 0) {
      if (level === "high") level = "medium";
      else if (level === "medium") level = "low";
      warnings.push("Listing file shows open validation or contradiction items — timeline detail stays generic until cleared.");
    }
    if (ds.completenessPercent < 70) {
      if (level === "high") level = "medium";
      warnings.push(FUTURE_OUTCOME_UNCERTAINTY_LOW_DATA);
    }
    if (ds.trustScore != null && ds.trustScore < 40) {
      warnings.push("Trust signals on the listing are weak in this model — keep extra diligence on counterparties and documents.");
    }
  }

  const cs = args.caseState;
  if (cs) {
    if (cs.legalFileHealth === "critical" || cs.legalFileHealth === "blocked") {
      if (level === "high") level = "medium";
      warnings.push("Legal graph reports blockers — real sequencing may pause until those items are resolved.");
    }
    if (cs.blockerLabels.length > 0) {
      if (level === "high") level = "medium";
    }
    if (cs.knowledgeBlockCount > 0) {
      warnings.push("Mandatory disclosure rules are not fully satisfied on file — closing steps may require seller updates first.");
    }
  }

  return { level, simulationConfidence: args.simulationConfidence, warnings };
}
