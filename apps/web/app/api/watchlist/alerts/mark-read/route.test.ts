import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/application/markAlertRead", () => ({ markAlertRead: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { markAlertRead } from "@/src/modules/watchlist-alerts/application/markAlertRead";

describe("POST /api/watchlist/alerts/mark-read", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ alertId: "a1" }) }));
    expect(res.status).toBe(401);
  });

  it("marks read", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(markAlertRead).mockResolvedValue({ ok: true } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ alertId: "a1" }) }));
    expect(res.status).toBe(200);
  });
});
