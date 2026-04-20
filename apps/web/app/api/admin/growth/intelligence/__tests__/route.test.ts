import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/modules/analytics/services/require-admin", () => ({
  requireAdminUser: vi.fn(),
}));

vi.mock("@/modules/growth-intelligence/growth-admin-payload.service", () => ({
  getGrowthIntelligencePayload: vi.fn(),
}));

import { GET } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { getGrowthIntelligencePayload } from "@/modules/growth-intelligence/growth-admin-payload.service";

describe("GET /api/admin/growth/intelligence", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(requireAdminUser).mockReset();
    vi.mocked(getGrowthIntelligencePayload).mockReset();
  });

  it("returns 401 when anonymous", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/admin/growth/intelligence"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when not admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(requireAdminUser).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/admin/growth/intelligence"));
    expect(res.status).toBe(403);
  });

  it("returns safe disabled shape when payload disabled", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(requireAdminUser).mockResolvedValue({ userId: "admin", role: "ADMIN" });
    vi.mocked(getGrowthIntelligencePayload).mockResolvedValue({ enabled: false });
    const res = await GET(new NextRequest("http://localhost/api/admin/growth/intelligence"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { disabled?: boolean; signals?: unknown[] };
    expect(body.disabled).toBe(true);
    expect(Array.isArray(body.signals)).toBe(true);
  });

  it("returns aggregated bundle when enabled", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(requireAdminUser).mockResolvedValue({ userId: "admin", role: "ADMIN" });
    vi.mocked(getGrowthIntelligencePayload).mockResolvedValue({
      enabled: true,
      summary: {
        snapshotId: "s",
        collectedAt: "2026-04-01T12:00:00.000Z",
        signalCountsByType: {},
        opportunityCountsByType: {},
        topOpportunityIds: [],
        availabilityNotes: [],
      },
      signals: [],
      opportunities: [],
      priorities: [],
      regionOpportunities: [],
      funnel: { worstListings: [], notes: [] },
      trustLeverage: { highTrustLowExposureCount: 0, notes: [] },
      trends: {
        trendSignalCount: 0,
        stalledFunnelHints: 0,
        repeatDropoffHints: 0,
        timelineWindowsCompared: [],
        notes: [],
      },
      timelineSignals: [],
      availabilityNotes: [],
      snapshotId: "s",
      collectedAt: "2026-04-01T12:00:00.000Z",
      flags: { growthIntelligenceV1: true, growthBriefsV1: false, growthOpportunitiesV1: false },
    });
    const res = await GET(new NextRequest("http://localhost/api/admin/growth/intelligence"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { summary: unknown; flags: unknown };
    expect(body.summary).toBeTruthy();
    expect(body.flags).toBeTruthy();
  });
});
