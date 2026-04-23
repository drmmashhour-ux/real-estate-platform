import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    fsboListingDocument: { findMany: vi.fn() },
    sellerSupportingDocument: { findMany: vi.fn() },
  },
}));

vi.mock("@/config/feature-flags", async (imp) => {
  const m = await imp<typeof import("@/config/feature-flags")>();
  return {
    ...m,
    legalIntelligenceFlags: {
      legalIntelligenceV1: false,
      legalReviewPriorityV1: true,
      legalAnomalyDetectionV1: false,
    },
  };
});

vi.mock("@/modules/legal/legal-review-queue.loader", () => ({
  loadLegalReviewQueueItems: vi.fn().mockResolvedValue([]),
}));

import { GET } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

describe("GET /api/admin/legal/review-priority", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("requires admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "USER" });
    const res = await GET(new NextRequest("http://localhost/api/admin/legal/review-priority"));
    expect(res.status).toBe(403);
  });

  it("returns queue shape when admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" });
    const res = await GET(new NextRequest("http://localhost/api/admin/legal/review-priority"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body.queue)).toBe(true);
    expect(Array.isArray(body.prioritized)).toBe(true);
  });
});
