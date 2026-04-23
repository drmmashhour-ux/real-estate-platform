import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/config/feature-flags", () => ({
  brokerAiFlags: {
    brokerAiCertificateOfLocationV1: true,
    brokerAiCertificateBlockerV1: false,
    brokerAiCertificateOfLocationV2: true,
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(async () => "user-1"),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => ({ role: "ADMIN" })),
    },
    fsboListing: {
      findFirst: vi.fn(async () => ({ id: "lst-1" })),
    },
  },
}));

vi.mock("@/modules/broker-ai/certificate-of-location/certificate-of-location-access.service", () => ({
  assertCertificateOfLocationListingAccess: vi.fn(async () => ({ ok: true, listingId: "lst-1" })),
}));

vi.mock("@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service", () => ({
  loadCertificateOfLocationPresentation: vi.fn(async () => ({
    summary: {
      listingId: "lst-1",
      status: "missing",
      readinessLevel: "not_ready",
      riskLevel: "high",
      checklistResults: [],
      blockingIssues: [],
      warnings: [],
      nextSteps: [],
      availabilityNotes: [],
    },
    viewModel: {
      headline: "Certificate of location readiness",
      statusBadge: { label: "missing", tone: "danger" },
      readinessBadge: { label: "not_ready", tone: "danger" },
      riskBadge: { label: "high", tone: "danger" },
      checklistRows: [],
      blockingIssues: [],
      warnings: [],
      nextSteps: [],
      disclaimer: [],
      workflowActionsAvailable: { requestUpload: true, markReviewed: false, sendToAdmin: false },
    },
  })),
}));

vi.mock("@/modules/broker-ai/certificate-of-location/certificate-of-location-blocker.service", () => ({
  getCertificateOfLocationBlockerImpact: vi.fn(() => ({
    affectsPublish: true,
    affectsOfferReadiness: false,
    affectsBrokerReview: true,
    reasons: ["a"],
  })),
}));

describe("GET /api/broker-ai/certificate-of-location", () => {
  it("returns summary and viewModel shape", async () => {
    const { GET } = await import("../route");
    const req = new NextRequest("http://localhost/api/broker-ai/certificate-of-location?listingId=lst-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      summary: { listingId: string };
      viewModel: { headline: string };
      blockerImpact: { reasons: string[] };
      freshness: string;
    };
    expect(body.summary.listingId).toBe("lst-1");
    expect(body.viewModel.headline).toBeTruthy();
    expect(body.freshness).toBeTruthy();
    expect(Array.isArray(body.blockerImpact.reasons)).toBe(true);
    const bodyFull = body as {
      flags?: { brokerAiCertificateOfLocationV2?: boolean };
      workflowActionsAvailable?: unknown;
      explainability?: unknown;
    };
    expect(bodyFull.flags?.brokerAiCertificateOfLocationV2).toBe(true);
    expect(bodyFull.workflowActionsAvailable).toBeDefined();
  });
});
