import type { ExactValidationIssue, MapFormResult } from "../../mapper.types";
import type { CanonicalDealShape } from "../../source-paths/canonical-deal-shape";

export function validateCp(map: MapFormResult, canonical: CanonicalDealShape): ExactValidationIssue[] {
  const issues: ExactValidationIssue[] = [];
  const ref = map.mappedFields["cp.p2.principalPpFormNumber"];
  const hasRef =
    (ref !== undefined && ref !== null && String(ref).trim() !== "") ||
    Boolean(canonical.deal.documents.ppFormNumber ?? canonical.deal.meta.principalFormNumber);

  if (!hasRef) {
    issues.push({
      severity: "critical",
      code: "cp.requires_pp_ref",
      fieldKey: "cp.p2.principalPpFormNumber",
      formKey: "CP",
      message: "Counter-proposal should reference the principal PP form number — draft incomplete.",
      brokerReviewRequired: true,
    });
  }

  return issues;
}
