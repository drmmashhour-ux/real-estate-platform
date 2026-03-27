import { describe, expect, it } from "vitest";
import { compareWatchlistSnapshots } from "@/src/modules/watchlist-alerts/application/compareWatchlistSnapshots";

const base = {
  id: "s1",
  userId: "u1",
  listingId: "l1",
  dealScore: 70,
  trustScore: 65,
  fraudScore: 30,
  confidence: 60,
  recommendation: "hold",
  price: 500000,
  listingStatus: "ACTIVE",
  createdAt: new Date(),
};

describe("compareWatchlistSnapshots", () => {
  it("returns no changes when previous missing", () => {
    const out = compareWatchlistSnapshots(null, base);
    expect(out.hasChanges).toBe(false);
    expect(out.changes).toHaveLength(0);
  });

  it("detects price change", () => {
    const out = compareWatchlistSnapshots(base, { ...base, price: 475000 });
    expect(out.changes.some((x) => x.changeType === "price_changed")).toBe(true);
  });

  it("detects score changes", () => {
    const out = compareWatchlistSnapshots(base, { ...base, dealScore: 79, trustScore: 72 });
    expect(out.changes.some((x) => x.changeType === "deal_score_changed")).toBe(true);
    expect(out.changes.some((x) => x.changeType === "trust_score_changed")).toBe(true);
  });

  it("detects recommendation change", () => {
    const out = compareWatchlistSnapshots(base, { ...base, recommendation: "buy" });
    expect(out.changes.some((x) => x.changeType === "recommendation_changed")).toBe(true);
  });

  it("returns unchanged snapshots without changes", () => {
    const out = compareWatchlistSnapshots(base, { ...base });
    expect(out.hasChanges).toBe(false);
    expect(out.changes).toHaveLength(0);
  });
});
