import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/application/dismissAlert", () => ({ dismissAlert: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { dismissAlert } from "@/src/modules/watchlist-alerts/application/dismissAlert";

describe("POST /api/watchlist/alerts/dismiss", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ alertId: "a1" }) }));
    expect(res.status).toBe(401);
  });

  it("dismisses", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(dismissAlert).mockResolvedValue({ ok: true } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ alertId: "a1" }) }));
    expect(res.status).toBe(200);
  });
});
