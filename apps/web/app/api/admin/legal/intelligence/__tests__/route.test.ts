import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    fsboListingDocument: { count: vi.fn() },
    sellerSupportingDocument: { count: vi.fn() },
  },
}));

vi.mock("@/config/feature-flags", async (imp) => {
  const m = await imp<typeof import("@/config/feature-flags")>();
  return {
    ...m,
    legalIntelligenceFlags: {
      legalIntelligenceV1: true,
      legalReviewPriorityV1: false,
      legalAnomalyDetectionV1: true,
    },
  };
});

import { GET } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

describe("GET /api/admin/legal/intelligence", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/admin/legal/intelligence"));
    expect(res.status).toBe(401);
  });

  it("requires admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "USER" });
    const res = await GET(new NextRequest("http://localhost/api/admin/legal/intelligence"));
    expect(res.status).toBe(403);
  });

  it("returns safe JSON without raw file contents", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" });
    vi.mocked(prisma.fsboListingDocument.count).mockResolvedValue(0);
    vi.mocked(prisma.sellerSupportingDocument.count).mockResolvedValue(0);

    const res = await GET(new NextRequest("http://localhost/api/admin/legal/intelligence"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty("flags");
    expect(body).toHaveProperty("freshness");
    expect(JSON.stringify(body)).not.toMatch(/BEGIN PDF|base64,/i);
  });
});
