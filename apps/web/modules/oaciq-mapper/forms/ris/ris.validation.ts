import type { ExactValidationIssue, MapFormResult } from "../../mapper.types";

export function validateRis(map: MapFormResult): ExactValidationIssue[] {
  const issues: ExactValidationIssue[] = [];
  const m = map.mappedFields;
  if (m["ris.s3.outstandingChargesYesNo"] === true) {
    if (!m["ris.s3.outstandingChargesAmount"] && !m["ris.s3.outstandingChargesRate"]) {
      issues.push({
        severity: "warning",
        code: "ris.charges_detail",
        fieldKey: "ris.s3.outstandingChargesAmount",
        formKey: "RIS",
        message: "Outstanding charges indicated — amount and rate should be reviewed.",
        brokerReviewRequired: true,
      });
    }
  }
  return issues;
}
