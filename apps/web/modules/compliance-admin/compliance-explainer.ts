export function complianceDisclaimer(): string {
  return (
    "Compliance signals are generated from internal workflow state and heuristics. They are supervisory aids only — " +
    "not legal advice, regulatory findings, or proof of OACIQ compliance. Escalations require human review."
  );
}

export function qaReviewDisclaimer(): string {
  return (
    "QA reviews document operational readiness and consistency checks. Approval here does not replace mandatory " +
    "broker judgment or official publisher workflows."
  );
}
