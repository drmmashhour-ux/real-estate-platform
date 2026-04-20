import { describe, expect, it } from "vitest";
import { buildCertificateExplainability } from "../certificate-of-location-explainability.service";
import type { CertificateOfLocationSummary } from "../certificate-of-location.types";

describe("buildCertificateExplainability", () => {
  it("surfaces missing document reason", () => {
    const s: CertificateOfLocationSummary = {
      listingId: "l",
      status: "missing",
      readinessLevel: "not_ready",
      riskLevel: "high",
      checklistResults: [],
      blockingIssues: [],
      warnings: [],
      nextSteps: [],
      availabilityNotes: [],
    };
    const e = buildCertificateExplainability(s);
    expect(e.reasons.some((r) => r.includes("No certificate"))).toBe(true);
    expect(e.contributingSignals).toContain("status:missing");
  });

  it("never throws", () => {
    const e = buildCertificateExplainability({} as CertificateOfLocationSummary);
    expect(e.reasons.length).toBeGreaterThan(0);
  });
});
