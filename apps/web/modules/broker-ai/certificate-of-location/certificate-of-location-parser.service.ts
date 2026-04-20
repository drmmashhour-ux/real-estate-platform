/**
 * Structured-field extraction only — Legal Hub parsed JSON paths; no OCR inference.
 */

import type { CertificateOfLocationParsedData } from "./certificate-of-location.types";

function takeStr(v: unknown): string | null {
  if (typeof v === "string") {
    const s = v.trim();
    return s === "" ? null : s;
  }
  return null;
}

/** Accepts normalized compliance_document parsedData or raw validation payload. */
export function extractCertificateOfLocationParsedData(record: Record<string, unknown> | null): CertificateOfLocationParsedData {
  try {
    if (!record || typeof record !== "object") {
      return {};
    }
    const src = record as Record<string, unknown>;
    return {
      issueDate:
        takeStr(src.issueDate) ??
        takeStr(src.issue_date) ??
        takeStr(src.dateOfIssue) ??
        takeStr(src.date_issue) ??
        null,
      certificateNumber:
        takeStr(src.certificateNumber) ??
        takeStr(src.certificate_number) ??
        takeStr(src.certNumber) ??
        null,
      lotNumber:
        takeStr(src.lotNumber) ??
        takeStr(src.lot_number) ??
        takeStr(src.parcelId) ??
        takeStr(src.parcel_id) ??
        null,
      address:
        takeStr(src.address) ??
        takeStr(src.propertyAddress) ??
        takeStr(src.property_address) ??
        null,
      municipality:
        takeStr(src.municipality) ??
        takeStr(src.city) ??
        takeStr(src.town) ??
        null,
      surveyorName:
        takeStr(src.surveyorName) ??
        takeStr(src.surveyor_name) ??
        takeStr(src.landSurveyor) ??
        null,
    };
  } catch {
    return {};
  }
}
