export type ComplianceInspectionInput = {
  dsLinked?: boolean;
  /** Signature step completed (broker or platform attestation). */
  signature?: boolean;
  hash?: string | null;
  contractNumber?: string | null;
};

export type ComplianceInspectionResult = {
  result: "pass" | "fail" | "warning";
  issues: string[];
};

/**
 * Deterministic regulator-style gate — does not call AI.
 * `warning`: non-empty issues that are advisory only (unused in strict mode).
 */
export function runInspection(input: ComplianceInspectionInput): ComplianceInspectionResult {
  const issues: string[] = [];

  if (!input.dsLinked) issues.push("MISSING_SELLER_DECLARATION");
  if (!input.signature) issues.push("MISSING_SIGNATURE");
  if (!input.hash?.trim()) issues.push("NO_DOCUMENT_HASH");
  if (!input.contractNumber?.trim()) issues.push("NO_CONTRACT_NUMBER");

  if (issues.length === 0) {
    return { result: "pass", issues: [] };
  }

  return { result: "fail", issues };
}
