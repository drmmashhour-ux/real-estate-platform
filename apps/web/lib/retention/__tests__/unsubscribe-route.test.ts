import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUpdate = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(() => Promise.resolve("user-1")),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

describe("POST /api/retention/unsubscribe (Order 58)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({});
  });

  it("sets both marketing opt-ins false by default", async () => {
    const { POST } = await import("@/app/api/retention/unsubscribe/route");
    const res = await POST(
      new Request("http://localhost/api/retention/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "both" }),
      })
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok: boolean };
    expect(j.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { marketingEmailOptIn: false, marketingSmsOptIn: false },
    });
  });

  it("can opt out email only", async () => {
    const { POST } = await import("@/app/api/retention/unsubscribe/route");
    const res = await POST(
      new Request("http://localhost/api/retention/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ channel: "email" }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { marketingEmailOptIn: false },
    });
  });
});
