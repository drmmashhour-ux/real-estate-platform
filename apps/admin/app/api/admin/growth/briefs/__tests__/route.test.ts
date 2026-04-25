import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/modules/analytics/services/require-admin", () => ({
  requireAdminUser: vi.fn(),
}));

vi.mock("@/modules/growth-intelligence/growth-repository", () => ({
  listRecentGrowthBriefs: vi.fn(),
}));

vi.mock("@/modules/growth-intelligence/growth-admin-payload.service", () => ({
  getGrowthIntelligencePayload: vi.fn(),
}));

import { GET } from "../route";
import { getGuestId } from "@/lib/auth/session";
import { requireAdminUser } from "@/modules/analytics/services/require-admin";
import { listRecentGrowthBriefs } from "@/modules/growth-intelligence/growth-repository";
import { getGrowthIntelligencePayload } from "@/modules/growth-intelligence/growth-admin-payload.service";

describe("GET /api/admin/growth/briefs", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(requireAdminUser).mockReset();
    vi.mocked(listRecentGrowthBriefs).mockReset();
    vi.mocked(getGrowthIntelligencePayload).mockReset();
  });

  it("blocks non-admin", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(requireAdminUser).mockResolvedValue(null);
    const res = await GET(new NextRequest("http://localhost/api/admin/growth/briefs"));
    expect(res.status).toBe(403);
  });

  it("returns brief containers without raw user records", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin");
    vi.mocked(requireAdminUser).mockResolvedValue({ userId: "admin", role: "ADMIN" });
    vi.mocked(listRecentGrowthBriefs).mockResolvedValue([]);
    vi.mocked(getGrowthIntelligencePayload).mockResolvedValue({ enabled: false });
    const res = await GET(new NextRequest("http://localhost/api/admin/growth/briefs"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { briefs: { persisted: unknown[] }; counts: { persisted: number } };
    expect(Array.isArray(body.briefs.persisted)).toBe(true);
    expect(typeof body.counts.persisted).toBe("number");
  });
});
