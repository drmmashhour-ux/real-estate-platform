import type { ConflictReviewFlag } from "./esg-document-types";

const CORE_FIELDS = new Set([
  "annualEnergyKwh",
  "annualGasGJ",
  "annualGasM3",
  "certificationType",
  "certificationLevel",
  "yearBuilt",
  "grossFloorAreaSqft",
]);

function materiallyDifferent(a: string, b: string, fieldName: string): boolean {
  const na = parseFloat(a.replace(/,/g, ""));
  const nb = parseFloat(b.replace(/,/g, ""));
  if (CORE_FIELDS.has(fieldName) && Number.isFinite(na) && Number.isFinite(nb) && na > 0 && nb > 0) {
    const ratio = Math.max(na, nb) / Math.min(na, nb);
    return ratio > 1.15;
  }
  if (Number.isFinite(na) && Number.isFinite(nb) && na > 0 && nb > 0) {
    const ratio = Math.max(na, nb) / Math.min(na, nb);
    return ratio > 1.25;
  }
  return a.trim().toLowerCase() !== b.trim().toLowerCase();
}

export function detectValueConflict(input: {
  fieldName: string;
  oldVerification: string | null;
  oldText: string | null;
  newVerification: string;
  newText: string;
}): ConflictReviewFlag | null {
  const { fieldName, oldVerification, oldText, newVerification, newText } = input;
  if (!oldText?.trim() || !newText.trim()) return null;
  if (oldVerification === "VERIFIED" && newVerification === "VERIFIED" && materiallyDifferent(oldText, newText, fieldName)) {
    return {
      severity: CORE_FIELDS.has(fieldName) ? "HIGH" : "MEDIUM",
      fieldName,
      issue: "Verified document evidence disagrees with prior verified value.",
      oldValue: oldText.slice(0, 240),
      newValue: newText.slice(0, 240),
      recommendedAction: "Resolve in review queue before accepting new evidence as canonical.",
    };
  }
  return null;
}

export function detectExpiredCertConflict(profileCertActive: boolean, expiryIsoOrText: string | null): ConflictReviewFlag | null {
  if (!expiryIsoOrText) return null;
  const d = Date.parse(expiryIsoOrText);
  if (!Number.isFinite(d)) return null;
  if (d < Date.now() && profileCertActive) {
    return {
      severity: "MEDIUM",
      fieldName: "certificationExpiryDate",
      issue: "Certificate appears expired while profile still reflects active certification.",
      oldValue: "active",
      newValue: expiryIsoOrText,
      recommendedAction: "Update certification status or upload renewed certificate.",
    };
  }
  return null;
}
