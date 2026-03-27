/**
 * Unit tests for host quality score logic (pure logic only; no DB).
 * Super Host: score >= 4.8, >= 3 reviews, cancellation rate <= 1%.
 * Quality score: avg rating - cancellation penalty (cancellationRate * 2), clamped 0-5.
 */
import { describe, it, expect } from "vitest";

function computeHostQualityFromInputs(params: {
  avgRating: number | null;
  reviewCount: number;
  totalBookings: number;
  cancelledBookings: number;
}) {
  const { avgRating, reviewCount, totalBookings, cancelledBookings } = params;
  const cancellationRate = totalBookings > 0 ? cancelledBookings / totalBookings : 0;
  const qualityScore =
    avgRating != null
      ? Math.max(0, Math.min(5, avgRating - cancellationRate * 2))
      : 0;
  const isSuperHost =
    (avgRating ?? 0) >= 4.8 &&
    reviewCount >= 3 &&
    cancellationRate <= 0.01;
  return { qualityScore, isSuperHost, cancellationRate };
}

describe("Host quality logic", () => {
  it("qualifies as Super Host when rating >= 4.8, >= 3 reviews, low cancellation", () => {
    const r = computeHostQualityFromInputs({
      avgRating: 4.9,
      reviewCount: 5,
      totalBookings: 20,
      cancelledBookings: 0,
    });
    expect(r.isSuperHost).toBe(true);
    expect(r.qualityScore).toBeGreaterThanOrEqual(4.8);
  });

  it("does not qualify as Super Host with high cancellation", () => {
    const r = computeHostQualityFromInputs({
      avgRating: 5,
      reviewCount: 10,
      totalBookings: 10,
      cancelledBookings: 2,
    });
    expect(r.isSuperHost).toBe(false);
    expect(r.cancellationRate).toBe(0.2);
  });

  it("does not qualify with fewer than 3 reviews", () => {
    const r = computeHostQualityFromInputs({
      avgRating: 5,
      reviewCount: 2,
      totalBookings: 5,
      cancelledBookings: 0,
    });
    expect(r.isSuperHost).toBe(false);
  });

  it("quality score is clamped between 0 and 5", () => {
    const r = computeHostQualityFromInputs({
      avgRating: 2,
      reviewCount: 1,
      totalBookings: 10,
      cancelledBookings: 8,
    });
    expect(r.qualityScore).toBeGreaterThanOrEqual(0);
    expect(r.qualityScore).toBeLessThanOrEqual(5);
  });
});
