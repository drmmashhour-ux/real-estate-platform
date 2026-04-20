import { describe, expect, it, vi } from "vitest";
import { evaluateCertificateOfLocation } from "../certificate-of-location-evaluator.service";
import type { CertificateOfLocationContext } from "../certificate-of-location.types";

vi.mock("@/config/feature-flags", () => ({
  brokerAiFlags: {
    brokerAiCertificateOfLocationV1: true,
    brokerAiCertificateOfLocationV2: true,
    brokerAiCertificateBlockerV1: false,
  },
}));

describe("evaluateCertificateOfLocation V2 fields", () => {
  it("includes explainability and consistency when structured data differs from listing", () => {
    const ctx: CertificateOfLocationContext = {
      listingId: "v2-1",
      listingAddress: "100 Maple Avenue",
      listingCity: "Laval",
      listingCadastre: "1234567",
      legalRecords: [
        {
          recordType: "compliance_document",
          status: "validated",
          parsedData: {
            certificateType: "certificate_of_location",
            issueDate: "2024-01-01",
            address: "999 Oak Street",
            lotNumber: "7654321",
          },
        },
      ],
      parsedRecordData: {
        certificateType: "certificate_of_location",
        issueDate: "2024-01-01",
        address: "999 Oak Street",
        lotNumber: "7654321",
      },
    };
    const s = evaluateCertificateOfLocation(ctx);
    expect(s.consistencySignals?.mismatches.length).toBeGreaterThan(0);
    expect(s.explainability?.reasons.length).toBeGreaterThan(0);
    expect(s.timelineSignals?.hasIssueDate).toBe(true);
  });

  it("never throws", () => {
    const s = evaluateCertificateOfLocation({ listingId: "" } as CertificateOfLocationContext);
    expect(s.listingId).toBe("");
  });
});
