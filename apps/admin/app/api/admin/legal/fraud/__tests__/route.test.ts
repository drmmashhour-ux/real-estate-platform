import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
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
      legalFraudEngineV1: true,
    },
  };
});

vi.mock("@/modules/legal/legal-intelligence.service", () => ({
  getLegalIntelligenceSignals: vi.fn().mockResolvedValue([]),
}));

import { GET } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

describe("GET /api/admin/legal/fraud", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("requires admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "USER" });
    const res = await GET(new NextRequest("http://localhost/api/admin/legal/fraud"));
    expect(res.status).toBe(403);
  });

  it("returns JSON without raw document payloads", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" });
    const res = await GET(new NextRequest("http://localhost/api/admin/legal/fraud"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty("indicators");
    expect(JSON.stringify(body)).not.toMatch(/BEGIN PDF|base64,/i);
  });
});
