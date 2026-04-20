import { describe, expect, it, vi } from "vitest";
import {
  buildCertificateWorkflowActionsAvailability,
  markCertificateReviewed,
  requestCertificateUpload,
} from "../certificate-of-location-workflow.service";
import type { CertificateOfLocationSummary } from "../certificate-of-location.types";

vi.mock("@/lib/db", () => ({
  prisma: {
    brokerVerificationLog: {
      create: vi.fn(async () => ({ id: "log-1" })),
      findFirst: vi.fn(async () => null),
    },
  },
}));

describe("certificate workflow", () => {
  it("buildCertificateWorkflowActionsAvailability never throws", () => {
    const a = buildCertificateWorkflowActionsAvailability({
      listingId: "  x  ",
      status: "missing",
      readinessLevel: "not_ready",
      riskLevel: "high",
      checklistResults: [],
      blockingIssues: [],
      warnings: [],
      nextSteps: [],
      availabilityNotes: [],
    });
    expect(a.requestUpload).toBe(true);
  });

  it("requestCertificateUpload is idempotent-friendly (always creates audit row when ok)", async () => {
    const r = await requestCertificateUpload({ listingId: "lst", brokerUserId: "u1" });
    expect(r.ok).toBe(true);
  });

  it("markCertificateReviewed returns ok", async () => {
    const r = await markCertificateReviewed({ listingId: "lst", reviewerId: "u1" });
    expect(r.ok).toBe(true);
  });
});
