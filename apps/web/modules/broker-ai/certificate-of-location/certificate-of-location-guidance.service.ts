/**
 * Deterministic next-step phrases — platform workflow guidance only.
 */

import type { CertificateOfLocationSummary } from "./certificate-of-location.types";

const STEP_UPLOAD = "Upload the certificate of location or attach it through the seller certificate slot when available.";
const STEP_VERIFY_TYPE = "Verify the document type metadata matches a certificate of location.";
const STEP_REVIEW_CHANGES = "Review whether changes were made since issuance — manual review recommended if uncertain.";
const STEP_BROKER_REVIEW = "Request broker or manual review before relying on this document in offers.";
const STEP_PROPERTY_MATCH = "Confirm property details shown on the listing align with the certificate metadata available.";
const STEP_VALIDATION = "Resolve validation signals flagged for the certificate record — additional verification required.";

export function buildCertificateOfLocationNextSteps(summary: CertificateOfLocationSummary): string[] {
  try {
    const steps: string[] = [];

    if (summary.status === "missing") {
      steps.push(STEP_UPLOAD);
    }

    const typeWeak = summary.checklistResults.some(
      (r) => r.itemId === "document_type_matches_certificate_of_location" && !r.passed,
    );
    if (typeWeak || summary.status === "uploaded") {
      steps.push(STEP_VERIFY_TYPE);
    }

    const validationBlocking = summary.blockingIssues.some((b) => b.includes("Validation"));
    if (validationBlocking || summary.status === "needs_review") {
      steps.push(STEP_VALIDATION);
    }

    if (
      summary.status === "may_be_outdated" ||
      summary.warnings.some((w) => w.toLowerCase().includes("property changes"))
    ) {
      steps.push(STEP_REVIEW_CHANGES);
    }

    if (
      summary.readinessLevel === "review_required" ||
      summary.warnings.some((w) => w.toLowerCase().includes("manual review"))
    ) {
      steps.push(STEP_BROKER_REVIEW);
    }

    steps.push(STEP_PROPERTY_MATCH);

    const uniq: string[] = [];
    for (const s of steps) {
      if (!uniq.includes(s)) uniq.push(s);
      if (uniq.length >= 5) break;
    }

    return uniq.slice(0, 5);
  } catch {
    return ["Manual review recommended for certificate-of-location readiness."];
  }
}
