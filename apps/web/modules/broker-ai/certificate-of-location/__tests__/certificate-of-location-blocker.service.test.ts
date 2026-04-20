import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/feature-flags", () => ({
  brokerAiFlags: {
    brokerAiCertificateBlockerV1: true,
  },
}));

describe("getCertificateOfLocationBlockerImpact", () => {
  it("marks publish when missing and blocker flag on", async () => {
    const { getCertificateOfLocationBlockerImpact } = await import("../certificate-of-location-blocker.service");
    const { evaluateCertificateOfLocation } = await import("../certificate-of-location-evaluator.service");
    const sum = evaluateCertificateOfLocation({ listingId: "z" });
    const impact = getCertificateOfLocationBlockerImpact(sum);
    expect(impact.affectsPublish).toBe(true);
    expect(impact.reasons.length).toBeGreaterThan(0);
  });
});
