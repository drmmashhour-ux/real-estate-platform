import type { ExactValidationIssue, MapFormResult } from "../../mapper.types";

export function validateDs(map: MapFormResult): ExactValidationIssue[] {
  const issues: ExactValidationIssue[] = [];

  for (const [yesKey, detailKey] of [
    ["ds.d3.land.yesNo", "ds.d3.land.detail"],
    ["ds.d4.water.yesNo", "ds.d4.water.detail"],
    ["ds.d5.basement.yesNo", "ds.d5.basement.detail"],
    ["ds.d6.pests.yesNo", "ds.d6.pests.detail"],
  ] as const) {
    const y = map.mappedFields[yesKey];
    const d = map.mappedFields[detailKey];
    if (y === true && (!d || String(d).trim() === "")) {
      issues.push({
        severity: "warning",
        code: "ds.yesno_detail",
        fieldKey: detailKey,
        sectionKey: yesKey.split(".").slice(0, 2).join("."),
        formKey: "DS",
        message: "Issue indicated yes — add detail notes for broker review.",
        brokerReviewRequired: true,
      });
    }
  }

  return issues;
}
