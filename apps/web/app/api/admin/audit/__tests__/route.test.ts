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
    adminOpsFlags: { adminAuditPanelV1: true },
  };
});

vi.mock("@/modules/audit/audit-panel.service", () => ({
  buildListingAuditPanel: vi.fn().mockResolvedValue({
    scopeType: "listing",
    listingId: "L1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    statusSummary: "ok",
    timeline: [],
    legalSummary: null,
    riskAnomalySummary: "x",
    reasonTrail: [],
    previewReasoningSummary: null,
    notes: [],
  }),
}));

import { GET } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

describe("GET /api/admin/audit", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("requires admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "USER" });
    const res = await GET(new NextRequest("http://localhost/api/admin/audit?scopeType=listing&listingId=L1"));
    expect(res.status).toBe(403);
  });

  it("returns listing panel when scoped", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" });
    const res = await GET(new NextRequest("http://localhost/api/admin/audit?scopeType=listing&listingId=L1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.panel).toBeTruthy();
  });
});
