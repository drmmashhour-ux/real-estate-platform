import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/infrastructure/watchlistRepository", () => ({ listWatchlistItems: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/application/captureWatchlistSnapshot", () => ({ captureWatchlistSnapshot: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/infrastructure/watchlistAlertService", () => ({ createAlertsFromComparison: vi.fn() }));

import { listWatchlistItems } from "@/src/modules/watchlist-alerts/infrastructure/watchlistRepository";
import { captureWatchlistSnapshot } from "@/src/modules/watchlist-alerts/application/captureWatchlistSnapshot";
import { createAlertsFromComparison } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertService";
import { generateWatchlistAlerts } from "@/src/modules/watchlist-alerts/application/generateWatchlistAlerts";

describe("generateWatchlistAlerts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates alerts from snapshot comparison", async () => {
    vi.mocked(listWatchlistItems).mockResolvedValue({ watchlist: { id: "w1" }, items: [{ listingId: "l1" }] } as never);
    vi.mocked(captureWatchlistSnapshot).mockResolvedValue({ comparison: { hasChanges: true, changes: [{ changeType: "price_changed", previousValue: 100, currentValue: 90 }] } } as never);
    vi.mocked(createAlertsFromComparison).mockResolvedValue([{ id: "a1" }] as never);

    const out = await generateWatchlistAlerts({ userId: "u1" });
    expect(out.generatedAlerts).toBe(1);
  });

  it("returns zero when unchanged", async () => {
    vi.mocked(listWatchlistItems).mockResolvedValue({ watchlist: { id: "w1" }, items: [{ listingId: "l1" }] } as never);
    vi.mocked(captureWatchlistSnapshot).mockResolvedValue({ comparison: { hasChanges: false, changes: [] } } as never);

    const out = await generateWatchlistAlerts({ userId: "u1" });
    expect(out.generatedAlerts).toBe(0);
  });
});
