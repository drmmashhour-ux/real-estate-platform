import { describe, expect, it, vi } from "vitest";
import { GET } from "../revenue/route";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn().mockResolvedValue({ ok: false, status: 403, error: "Admin only" }),
}));

describe("GET /api/internal/revenue", () => {
  it("returns 403 when not admin", async () => {
    const res = await GET();
    expect(res.status).toBe(403);
  });
});
