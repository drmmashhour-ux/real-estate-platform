import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    controlCenterFlags: { ...a.controlCenterFlags, companyCommandCenterV3: false },
  };
});

import { GET } from "./route";
import { requireAdminSession } from "@/lib/admin/require-admin";

describe("GET /api/admin/control-center-v3", () => {
  beforeEach(() => {
    vi.mocked(requireAdminSession).mockReset();
  });

  it("returns 404 when V3 flag is off", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({ ok: true, userId: "admin" });
    const req = new NextRequest("http://localhost/api/admin/control-center-v3");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
