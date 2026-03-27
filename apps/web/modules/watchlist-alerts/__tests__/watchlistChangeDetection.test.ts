import { describe, expect, it } from "vitest";
import { compareWatchlistSnapshot, detectWatchlistChanges } from "@/src/modules/watchlist-alerts/infrastructure/watchlistChangeDetectionService";

describe("watchlist change detection", () => {
  const base = { listingId: "l1", dealScore: 70, trustScore: 70, fraudScore: 30, confidence: 70, recommendation: "good", price: 50000000, listingStatus: "ACTIVE" };

  it("detects price change", () => {
    const changes = detectWatchlistChanges({ previous: base, current: { ...base, price: 54000000 } });
    expect(changes.some((x) => x.type === "price_changed")).toBe(true);
  });

  it("detects deal score shift", () => {
    const changes = detectWatchlistChanges({ previous: base, current: { ...base, dealScore: 60 } });
    expect(changes.some((x) => x.type === "deal_score_down")).toBe(true);
  });

  it("detects risk escalation", () => {
    const changes = detectWatchlistChanges({ previous: base, current: { ...base, fraudScore: 80 } });
    expect(changes.some((x) => x.type === "fraud_risk_up")).toBe(true);
  });

  it("detects status change", () => {
    const changes = detectWatchlistChanges({ previous: base, current: { ...base, listingStatus: "SOLD" } });
    expect(changes.some((x) => x.type === "listing_status_changed")).toBe(true);
  });

  it("compares requested snapshot fields", () => {
    const compared = compareWatchlistSnapshot(base, {
      ...base,
      dealScore: 71,
      trustScore: 69,
      price: 52000000,
      confidence: 72,
      recommendation: "better",
    });
    expect(compared.hasChanges).toBe(true);
    expect(compared.changedFields).toEqual(
      expect.arrayContaining(["dealScore", "trustScore", "price", "confidence", "recommendation"])
    );
  });

  it("detects recommendation change", () => {
    const changes = detectWatchlistChanges({ previous: base, current: { ...base, recommendation: "updated" } });
    expect(changes.some((x) => x.title === "Recommendation updated")).toBe(true);
  });
});
