import type { ExactValidationIssue, MapFormResult } from "../../mapper.types";

export function validateRh(map: MapFormResult): ExactValidationIssue[] {
  const issues: ExactValidationIssue[] = [];
  const m = map.mappedFields;
  if (m["rh.h3.assumableYesNo"] === true) {
    if (!m["rh.h3.assumableConditions"] || String(m["rh.h3.assumableConditions"]).trim() === "") {
      issues.push({
        severity: "warning",
        code: "rh.assumable_conditions",
        fieldKey: "rh.h3.assumableConditions",
        formKey: "RH",
        message: "Loan indicated assumable — capture conditions for broker review.",
        brokerReviewRequired: true,
      });
    }
  }
  return issues;
}
