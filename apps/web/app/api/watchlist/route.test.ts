import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/application/getUserWatchlist", () => ({ getUserWatchlist: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { getUserWatchlist } from "@/src/modules/watchlist-alerts/application/getUserWatchlist";

describe("GET /api/watchlist", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns payload", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(getUserWatchlist).mockResolvedValue({ items: [], alerts: [], summary: { savedListings: 0, unreadAlerts: 0, changedToday: 0, strongOpportunityUpdates: 0, watchlistCount: 1 } } as never);
    const res = await GET();
    expect(res.status).toBe(200);
  });
});
