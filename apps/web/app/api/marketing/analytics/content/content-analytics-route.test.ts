import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { GET } from "./[id]/route";

vi.mock("@/app/api/ai/admin-guard", () => ({
  requireAdminSurfaceApi: vi.fn(),
}));

vi.mock("@/lib/marketing/marketing-content-service", () => ({
  getContent: vi.fn(),
}));

vi.mock("@/lib/marketing-analytics/aggregate-metrics", () => ({
  getContentPerformanceSummary: vi.fn(),
  getPerformanceBand: vi.fn(),
}));

vi.mock("@/lib/marketing-analytics/compare-variants", () => ({
  compareVariants: vi.fn(),
}));

vi.mock("@/lib/marketing-analytics/suggest-improvements", () => ({
  suggestImprovements: vi.fn(() => ["tip"]),
}));

import { requireAdminSurfaceApi } from "@/app/api/ai/admin-guard";
import { getContent } from "@/lib/marketing/marketing-content-service";
import { getContentPerformanceSummary, getPerformanceBand } from "@/lib/marketing-analytics/aggregate-metrics";
import { compareVariants } from "@/lib/marketing-analytics/compare-variants";

describe("GET /api/marketing/analytics/content/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSurfaceApi).mockResolvedValue(null);
    vi.mocked(getContent).mockResolvedValue({
      id: "c1",
      type: "SOCIAL_POST",
      isVariant: false,
      parentContentId: null,
      childVariants: [],
      emailBody: null,
      content: "hello",
    } as never);
    vi.mocked(getContentPerformanceSummary).mockResolvedValue({
      contentId: "c1",
      totalViews: 10,
      totalClicks: 2,
      totalConversions: 0,
      totalOpens: 0,
      snapshotCount: 1,
      ctr: 0.2,
      ctrPercent: 20,
      conversionRate: null,
      conversionPercent: null,
      openRate: null,
      openRatePercent: null,
    });
    vi.mocked(getPerformanceBand).mockResolvedValue("average");
    vi.mocked(compareVariants).mockResolvedValue(null);
  });

  it("returns summary", async () => {
    const res = await GET(new Request("http://localhost/x") as NextRequest, {
      params: Promise.resolve({ id: "c1" }),
    });
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok?: boolean; summary?: { totalViews: number } };
    expect(j.ok).toBe(true);
    expect(j.summary?.totalViews).toBe(10);
  });
});
