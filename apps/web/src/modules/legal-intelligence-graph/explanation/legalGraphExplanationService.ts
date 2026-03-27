import type { LegalGraphSummary } from "@/src/modules/legal-intelligence-graph/domain/legalGraph.types";

export function explainLegalGraphSummary(summary: LegalGraphSummary) {
  return {
    summary: `File health is ${summary.fileHealth}.`,
    whyBlocked: summary.blockingIssues.slice(0, 4),
    conflicts: summary.unresolvedReviewIssues.slice(0, 4),
    signature: summary.signatureReadiness,
    next: summary.nextActions.slice(0, 5),
    note: "Grounded in deterministic graph issues only. Not legal advice.",
  };
}
