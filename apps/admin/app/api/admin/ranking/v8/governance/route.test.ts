import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    rankingV8ShadowFlags: {
      ...a.rankingV8ShadowFlags,
      rankingV8GovernanceDashboardV1: false,
    },
  };
});

import { GET } from "./route";
import { requireAdminSession } from "@/lib/admin/require-admin";

describe("GET /api/admin/ranking/v8/governance", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSession).mockReset();
  });

  it("returns 404 when governance dashboard flag is off", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({ ok: true, userId: "test-admin" });
    const req = new NextRequest("http://localhost/api/admin/ranking/v8/governance");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
