import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository", () => ({ listWatchlistAlerts: vi.fn() }));

import { getGuestId } from "@/lib/auth/session";
import { listWatchlistAlerts } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";

describe("GET /api/watchlist/alerts", () => {
  it("requires auth", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns alerts", async () => {
    vi.mocked(getGuestId).mockResolvedValue("u1");
    vi.mocked(listWatchlistAlerts).mockResolvedValue([] as never);
    const res = await GET();
    expect(res.status).toBe(200);
  });
});
