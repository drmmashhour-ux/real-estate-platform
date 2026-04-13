import { describe, expect, it, vi, beforeEach } from "vitest";
import { requireApiSession } from "@/lib/auth/require-api-session";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

const { getGuestId } = await import("@/lib/auth/session");

describe("requireApiSession", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
  });

  it("returns 401 response when no session", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const r = await requireApiSession();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.response.status).toBe(401);
      const body = await r.response.json();
      expect(body.error).toMatch(/sign in/i);
    }
  });

  it("returns userId when session exists", async () => {
    vi.mocked(getGuestId).mockResolvedValue("user-1");
    const r = await requireApiSession();
    expect(r).toEqual({ ok: true, userId: "user-1" });
  });
});
