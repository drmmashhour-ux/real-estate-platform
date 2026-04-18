import type { ExactValidationIssue, MapFormResult } from "../../mapper.types";

export function validateIv(map: MapFormResult): ExactValidationIssue[] {
  const issues: ExactValidationIssue[] = [];
  const m = map.mappedFields;
  const docType = m["iv.p1.documentType"];
  const docNum = m["iv.p1.documentNumber"];
  const jurisdiction = m["iv.p1.issuingJurisdiction"];

  if (docType && String(docType).trim() !== "") {
    if (!docNum || String(docNum).trim() === "") {
      issues.push({
        severity: "warning",
        code: "iv.document_bundle",
        fieldKey: "iv.p1.documentNumber",
        formKey: "IV",
        message: "Document type selected — document number should be completed for broker review.",
        brokerReviewRequired: true,
      });
    }
    if (!jurisdiction || String(jurisdiction).trim() === "") {
      issues.push({
        severity: "warning",
        code: "iv.document_bundle",
        fieldKey: "iv.p1.issuingJurisdiction",
        formKey: "IV",
        message: "Issuing jurisdiction should be specified.",
        brokerReviewRequired: true,
      });
    }
  }

  return issues;
}
