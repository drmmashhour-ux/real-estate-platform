import { describe, expect, it } from "vitest";
import { evaluateCertificateOfLocation } from "../certificate-of-location-evaluator.service";
import type { CertificateOfLocationContext } from "../certificate-of-location.types";

describe("evaluateCertificateOfLocation", () => {
  it("marks missing when no compliance record", () => {
    const ctx: CertificateOfLocationContext = { listingId: "a" };
    const s = evaluateCertificateOfLocation(ctx);
    expect(s.status).toBe("missing");
    expect(s.readinessLevel).toBe("not_ready");
    expect(s.blockingIssues.length).toBeGreaterThan(0);
  });

  it("sees uploaded compliance with col type and needs date for review", () => {
    const ctx: CertificateOfLocationContext = {
      listingId: "b",
      parsedRecordData: {
        certificateType: "certificate_of_location",
      },
      legalRecords: [
        {
          recordType: "compliance_document",
          status: "parsed",
          parsedData: { certificateType: "certificate_of_location", issueDate: "2026-01-01" },
          validation: {
            version: 1,
            validation: { isValid: true, missingFields: [], inconsistentFields: [], warnings: [] },
            rules: [],
          },
        },
      ],
      validationSummary: {
        version: 1,
        validation: { isValid: true, missingFields: [], inconsistentFields: [], warnings: [] },
        rules: [],
      },
    };
    const s = evaluateCertificateOfLocation(ctx);
    expect(["appears_current", "parsed"]).toContain(s.status);
    expect(s.checklistResults.length).toBeGreaterThan(5);
  });

  it("flags outdated when changedSinceCertificate", () => {
    const ctx: CertificateOfLocationContext = {
      listingId: "c",
      changedSinceCertificate: true,
      legalRecords: [
        {
          recordType: "compliance_document",
          status: "validated",
          parsedData: {
            certificateType: "certificate_of_location",
            issueDate: "2025-01-01",
          },
        },
      ],
      parsedRecordData: { certificateType: "certificate_of_location", issueDate: "2025-01-01" },
    };
    const s = evaluateCertificateOfLocation(ctx);
    expect(s.status).toBe("may_be_outdated");
    expect(s.warnings.some((w) => w.includes("Property changes"))).toBe(true);
  });
});
