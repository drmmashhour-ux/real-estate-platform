/**
 * Advisory flags only — no automatic sanctions. Enforcement stays with human review / existing guardrails.
 */
export function deriveComplianceIntelligenceFlags(input: {
  riskLevel: string;
  complaintsRecentWindow: number;
  complaintsPriorWindow: number;
}) {
  const tooManyComplaintsInShortTime =
    input.complaintsPriorWindow >= 1 &&
    input.complaintsRecentWindow > input.complaintsPriorWindow * 2;

  return {
    requireManualReview: input.riskLevel === "critical",
    triggerAuditFlag: tooManyComplaintsInShortTime,
  };
}
