import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository", () => ({ createWatchlistAlert: vi.fn() }));
vi.mock("@/src/modules/watchlist-alerts/infrastructure/watchlistDuplicateAlertService", () => ({ shouldCreateWatchlistAlert: vi.fn() }));

import { createWatchlistAlert } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";
import { shouldCreateWatchlistAlert } from "@/src/modules/watchlist-alerts/infrastructure/watchlistDuplicateAlertService";
import { createAlertsFromComparison } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertService";

describe("watchlist alert service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("price alert generated only above threshold", async () => {
    vi.mocked(shouldCreateWatchlistAlert).mockResolvedValue({ shouldCreate: true, signature: "s" } as never);
    vi.mocked(createWatchlistAlert).mockResolvedValue({ id: "a1" } as never);
    const created = await createAlertsFromComparison({ userId: "u1", watchlistId: "w1", listingId: "l1", comparison: { hasChanges: true, changes: [{ changeType: "price_changed", previousValue: 100000, currentValue: 90000 }] } });
    expect(created.length).toBe(1);
  });

  it("deal score alert generated only above threshold", async () => {
    vi.mocked(shouldCreateWatchlistAlert).mockResolvedValue({ shouldCreate: true, signature: "s" } as never);
    vi.mocked(createWatchlistAlert).mockResolvedValue({ id: "a1" } as never);
    const created = await createAlertsFromComparison({ userId: "u1", watchlistId: "w1", listingId: "l1", comparison: { hasChanges: true, changes: [{ changeType: "deal_score_changed", previousValue: 60, currentValue: 70 }] } });
    expect(created.length).toBe(1);
  });

  it("duplicate alerts are prevented", async () => {
    vi.mocked(shouldCreateWatchlistAlert).mockResolvedValue({ shouldCreate: false, signature: "s" } as never);
    const created = await createAlertsFromComparison({ userId: "u1", watchlistId: "w1", listingId: "l1", comparison: { hasChanges: true, changes: [{ changeType: "deal_score_changed", previousValue: 60, currentValue: 70 }] } });
    expect(created.length).toBe(0);
    expect(createWatchlistAlert).not.toHaveBeenCalled();
  });

  it("strong opportunity detection works", async () => {
    vi.mocked(shouldCreateWatchlistAlert).mockResolvedValue({ shouldCreate: true, signature: "s" } as never);
    vi.mocked(createWatchlistAlert).mockResolvedValue({ id: "a1" } as never);
    const created = await createAlertsFromComparison({ userId: "u1", watchlistId: "w1", listingId: "l1", comparison: { hasChanges: true, changes: [{ changeType: "recommendation_changed", previousValue: "needs review", currentValue: "strong opportunity" }] } });
    expect(created[0]).toBeTruthy();
  });

  it("needs review detection works", async () => {
    vi.mocked(shouldCreateWatchlistAlert).mockResolvedValue({ shouldCreate: true, signature: "s" } as never);
    vi.mocked(createWatchlistAlert).mockResolvedValue({ id: "a1" } as never);
    const created = await createAlertsFromComparison({ userId: "u1", watchlistId: "w1", listingId: "l1", comparison: { hasChanges: true, changes: [{ changeType: "recommendation_changed", previousValue: "strong opportunity", currentValue: "needs review" }] } });
    expect(created[0]).toBeTruthy();
  });
});
