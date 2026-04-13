/**
 * Server-side admin gate: client role cookies are not authoritative; this matches DB role.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { requireAdminSession } from "@/lib/admin/require-admin";

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const { getGuestId } = await import("@/lib/auth/session");
const { prisma } = await import("@/lib/db");

describe("requireAdminSession", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("returns 401 when no session", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const r = await requireAdminSession();
    expect(r).toEqual({ ok: false, status: 401, error: "Sign in required" });
  });

  it("returns 403 when user is not ADMIN (role escalation blocked)", async () => {
    vi.mocked(getGuestId).mockResolvedValue("user-1");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "BUYER" } as never);
    const r = await requireAdminSession();
    expect(r).toEqual({ ok: false, status: 403, error: "Admin only" });
  });

  it("returns ok when role is ADMIN", async () => {
    vi.mocked(getGuestId).mockResolvedValue("admin-1");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" } as never);
    const r = await requireAdminSession();
    expect(r).toEqual({ ok: true, userId: "admin-1" });
  });
});
