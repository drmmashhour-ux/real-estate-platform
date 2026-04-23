import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { previewForListingMock } = vi.hoisted(() => ({
  previewForListingMock: vi.fn().mockResolvedValue({
    listingId: "L1",
    autonomyMode: "OFF",
    metrics: null,
    signals: [],
    opportunities: [],
    proposedActions: [],
    policyDecisions: [],
    opportunityEvaluations: [],
    executionResult: { status: "DRY_RUN", startedAt: "t", finishedAt: "t", detail: "d", metadata: {} },
    riskBuckets: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/config/feature-flags", () => ({
  engineFlags: {
    autonomousMarketplaceV1: true,
    autonomyRealPreviewV1: false,
    autonomyPreviewExplainabilityV1: false,
    syriaRegionAdapterV1: true,
    regionListingKeyV1: true,
    syriaPreviewV1: true,
  },
}));

vi.mock("@/modules/autonomous-marketplace/execution/autonomous-marketplace.engine", () => ({
  autonomousMarketplaceEngine: {
    previewForListing: previewForListingMock,
  },
}));

import { GET } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

describe("GET /api/admin/autonomy/preview", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
    previewForListingMock.mockClear();
  });

  it("requires admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("x");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "USER" });
    const res = await GET(new NextRequest("http://localhost/api/admin/autonomy/preview?listingId=L1"));
    expect(res.status).toBe(403);
  });

  it("returns preview envelope", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" });
    const res = await GET(new NextRequest("http://localhost/api/admin/autonomy/preview?listingId=L1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.preview).toBeTruthy();
    expect(Array.isArray(body.ambiguityWarnings)).toBe(true);
    expect((body.ambiguityWarnings as string[]).length).toBeGreaterThan(0);
  });

  it("passes explicit Syria source to engine", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" });
    await GET(new NextRequest("http://localhost/api/admin/autonomy/preview?listingId=S1&source=syria"));
    expect(previewForListingMock).toHaveBeenCalledWith({
      listingId: "S1",
      source: "syria",
      regionCode: "sy",
    });
  });

  it("parses regionListingKey for Syria into explicit input", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" });
    await GET(
      new NextRequest(
        "http://localhost/api/admin/autonomy/preview?regionListingKey=" + encodeURIComponent("sy:syria:ABC"),
      ),
    );
    expect(previewForListingMock).toHaveBeenCalledWith({
      listingId: "ABC",
      source: "syria",
      regionCode: "sy",
    });
  });
});
