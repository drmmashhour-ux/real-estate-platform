import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/application/addToWatchlist", () => ({ addToWatchlist: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { addToWatchlist } from "@/src/modules/watchlist-alerts/application/addToWatchlist";

describe("POST /api/watchlist/add", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ listingId: "l1" }) }));
    expect(res.status).toBe(401);
  });

  it("adds listing", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(addToWatchlist).mockResolvedValue({ created: true } as never);
    const res = await POST(new Request("http://x", { method: "POST", body: JSON.stringify({ listingId: "l1" }) }));
    expect(res.status).toBe(200);
  });
});
