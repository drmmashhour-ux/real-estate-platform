/**
 * Human-readable reason strings from summary fields — deterministic templates.
 */

import type { CertificateOfLocationExplainability, CertificateOfLocationSummary } from "./certificate-of-location.types";

export function buildCertificateExplainability(summary: CertificateOfLocationSummary): CertificateOfLocationExplainability {
  try {
    const reasons: string[] = [];
    const contributingSignals: string[] = [];

    if (summary.status === "missing") {
      reasons.push("No certificate document uploaded in structured platform records.");
      contributingSignals.push("status:missing");
    }

    if (!summary.timelineSignals?.hasIssueDate && summary.status !== "missing") {
      reasons.push("Certificate issue date is not available in structured fields.");
      contributingSignals.push("timeline:issue_date_missing");
    }

    if (summary.timelineSignals?.flaggedAsPotentiallyOutdated) {
      reasons.push("Certificate may require update — manual review recommended based on age or property-change signals.");
      contributingSignals.push("timeline:potentially_outdated");
    }

    if (summary.consistencySignals?.mismatches?.length) {
      for (const m of summary.consistencySignals.mismatches) {
        if (m.includes("address")) {
          reasons.push("Address mismatch detected between listing and certificate metadata.");
        } else if (m.includes("cadastre") || m.includes("lot")) {
          reasons.push("Lot or cadastre reference mismatch detected between listing and certificate metadata.");
        } else {
          reasons.push("Structured field mismatch detected — additional verification required.");
        }
        contributingSignals.push(`consistency:${m}`);
      }
    }

    if (summary.blockingIssues.length > 0) {
      reasons.push(...summary.blockingIssues.slice(0, 5).map((b) => `Blocking signal: ${b}`));
      contributingSignals.push("checklist:blocking");
    }

    if (summary.warnings.length > 0) {
      for (const w of summary.warnings.slice(0, 4)) {
        if (!reasons.includes(w)) reasons.push(w);
      }
      contributingSignals.push("checklist:warnings");
    }

    if (summary.readinessLevel === "review_required") {
      reasons.push("Manual review recommended before relying on this certificate for offers.");
      contributingSignals.push("readiness:review_required");
    }

    const uniqReasons = [...new Set(reasons)].slice(0, 12);
    const uniqSignals = [...new Set(contributingSignals)].slice(0, 14);

    return {
      reasons: uniqReasons,
      contributingSignals: uniqSignals,
    };
  } catch {
    return {
      reasons: ["Explainability fallback — manual review recommended."],
      contributingSignals: ["explainability:fallback"],
    };
  }
}
