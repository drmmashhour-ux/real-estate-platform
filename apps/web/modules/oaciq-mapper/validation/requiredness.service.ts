import type { ExactValidationIssue, MapFormResult } from "../mapper.types";

export function issuesFromRequiredness(map: MapFormResult): ExactValidationIssue[] {
  return map.missingRequiredKeys.map((fieldKey) => ({
    severity: "warning" as const,
    code: "required.missing",
    fieldKey,
    formKey: map.formKey,
    message: `Field marked required in mapper definition is unmapped: ${fieldKey}`,
    brokerReviewRequired: true as const,
  }));
}
