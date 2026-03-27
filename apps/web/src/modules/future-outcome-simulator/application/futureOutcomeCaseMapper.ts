import type { CaseHealthSnapshot } from "@/src/modules/case-command-center/domain/case.types";
import type { FutureOutcomeCaseInput, FutureOutcomeDealSignals } from "@/src/modules/future-outcome-simulator/domain/futureOutcome.types";

export function futureOutcomeCaseInputFromSnapshot(snapshot: CaseHealthSnapshot): FutureOutcomeCaseInput {
  return {
    caseStatus: snapshot.status,
    signatureReadinessStatus: snapshot.signatureReadiness.status,
    blockerLabels: snapshot.blockers.map((b) => b.label),
    warningLabels: snapshot.warnings.map((w) => w.label),
    primaryNextAction: snapshot.primaryNextAction,
    documentPanels: snapshot.documentPanels,
    legalFileHealth: snapshot.legalSummary.fileHealth,
    legalBlockingIssues: snapshot.legalSummary.blockingIssues ?? [],
    knowledgeBlockCount: snapshot.knowledgeRules.blocks.length,
    knowledgeWarningCount: snapshot.knowledgeRules.warnings.length,
  };
}

/** Approximate deal/file signals for confidence downgrades — uses case snapshot fields only. */
export function futureOutcomeDealSignalsFromSnapshot(snapshot: CaseHealthSnapshot): FutureOutcomeDealSignals {
  return {
    trustScore: null,
    completenessPercent: snapshot.score,
    blockerCount: snapshot.blockers.length + snapshot.knowledgeRules.blocks.length,
    contradictionCount: 0,
  };
}
