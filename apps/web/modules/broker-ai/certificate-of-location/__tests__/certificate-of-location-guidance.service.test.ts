import { describe, expect, it } from "vitest";
import { buildCertificateOfLocationNextSteps } from "../certificate-of-location-guidance.service";
import type { CertificateOfLocationSummary } from "../certificate-of-location.types";

describe("buildCertificateOfLocationNextSteps", () => {
  it("returns at most five deterministic strings", () => {
    const summary: CertificateOfLocationSummary = {
      listingId: "x",
      status: "missing",
      readinessLevel: "not_ready",
      riskLevel: "high",
      checklistResults: [],
      blockingIssues: [],
      warnings: [],
      nextSteps: [],
      availabilityNotes: [],
    };
    const steps = buildCertificateOfLocationNextSteps(summary);
    expect(steps.length).toBeLessThanOrEqual(5);
    expect(steps.every((s) => typeof s === "string")).toBe(true);
  });
});
