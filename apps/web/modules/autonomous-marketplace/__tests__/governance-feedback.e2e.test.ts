/**
 * Route-level integration: admin governance-feedback GET + in-memory repo.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    engineFlags: { ...a.engineFlags, autonomousMarketplaceV1: true },
  };
});

vi.mock("@/modules/autonomous-marketplace/config/autonomy.config", async (importOriginal) => {
  const m = await importOriginal<typeof import("@/modules/autonomous-marketplace/config/autonomy.config")>();
  return {
    ...m,
    autonomyConfig: { ...m.autonomyConfig, enabled: true },
  };
});

import { GET } from "@/app/api/admin/autonomy/governance-feedback/route";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  clearGovernanceFeedbackMemoryForTests,
  persistGovernanceFeedbackRecord,
} from "@/modules/autonomous-marketplace/feedback/governance-feedback.repository";
import type {
  GovernanceFeedbackInput,
  GovernanceFeedbackResult,
} from "@/modules/autonomous-marketplace/feedback/governance-feedback.types";

function stubInput(): GovernanceFeedbackInput {
  return {
    prediction: {
      governanceDisposition: "AUTO_EXECUTE",
      blocked: false,
      requiresHumanApproval: false,
      allowExecution: true,
      legalRiskScore: 10,
      legalRiskLevel: "LOW",
      fraudRiskScore: 10,
      fraudRiskLevel: "LOW",
      combinedRiskScore: 10,
      combinedRiskLevel: "LOW",
    },
    truthEvents: [],
  };
}

function stubResult(partial: Partial<GovernanceFeedbackResult>): GovernanceFeedbackResult {
  return {
    label: "GOOD_EXECUTION",
    confidence: "MEDIUM",
    falsePositive: false,
    falseNegative: false,
    protectedRevenueEstimate: 0,
    leakedRevenueEstimate: 0,
    reasons: [],
    recommendedActions: [],
    ...partial,
  };
}

describe("GET /api/admin/autonomy/governance-feedback (e2e)", () => {
  beforeEach(async () => {
    clearGovernanceFeedbackMemoryForTests();
    vi.mocked(requireAdminSession).mockReset();
    vi.mocked(requireAdminSession).mockResolvedValue({ ok: true, userId: "admin-test" });
  });

  it("returns ok shape with zeros when repo is empty", async () => {
    const req = new NextRequest("http://localhost/api/admin/autonomy/governance-feedback");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.performanceSummary.totalCases).toBe(0);
    expect(json.performanceSummary.falsePositiveRate).toBe(0);
    expect(json.performanceSummary.falseNegativeRate).toBe(0);
    expect(Array.isArray(json.thresholdRecommendations)).toBe(true);
    expect(json.adminSummary).toMatchObject({
      totalCases: 0,
      governanceQualityPosture: expect.stringMatching(/^(strong|mixed|needs_attention)$/),
    });
    expect(json.investorSummary.narrativeSummary).toContain("Composite feedback");
  });

  it("respects limit and aggregates persisted feedback rows", async () => {
    await persistGovernanceFeedbackRecord({
      input: stubInput(),
      result: stubResult({
        label: "GOOD_BLOCK",
        protectedRevenueEstimate: 100,
      }),
    });
    await persistGovernanceFeedbackRecord({
      input: stubInput(),
      result: stubResult({
        label: "BAD_APPROVAL",
        falseNegative: true,
        leakedRevenueEstimate: 40,
      }),
    });

    const req = new NextRequest("http://localhost/api/admin/autonomy/governance-feedback?limit=10");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.performanceSummary.totalCases).toBe(2);
    expect(json.performanceSummary.goodBlocks).toBe(1);
    expect(json.performanceSummary.badApprovals).toBe(1);
    expect(json.performanceSummary.protectedRevenueEstimate).toBe(100);
    expect(json.performanceSummary.leakedRevenueEstimate).toBe(40);
    expect(json.adminSummary.totalCases).toBe(2);
    expect(json.adminSummary.protectedRevenueEstimate).toBe(100);
    expect(json.adminSummary.leakedRevenueEstimate).toBe(40);
  });

  it("returns auth error when admin session fails", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({
      ok: false,
      error: "Unauthorized",
      status: 401,
    });
    const req = new NextRequest("http://localhost/api/admin/autonomy/governance-feedback");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toBeDefined();
  });
});
