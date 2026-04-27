import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/tracker", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/ab/learn", () => ({
  getWeight: vi.fn().mockResolvedValue(1),
  getLearningWeight: vi.fn().mockResolvedValue(1),
}));
import {
  buildUserProfile,
  effectivePreferenceWeight,
  isAllowedPreferenceKey,
} from "@/lib/ai/preferenceProfile";
import { applyPersonalization, rankListingsWithPersonalization } from "@/lib/ai/searchPersonalized";
import type { UserPrefRow } from "@/lib/ai/preferences";

const day = (d: number) => new Date(Date.UTC(2026, 0, d));

describe("effectivePreferenceWeight", () => {
  it("decays older rows", () => {
    const recent = effectivePreferenceWeight(10, day(20), 0.1);
    const old = effectivePreferenceWeight(10, day(1), 0.1);
    expect(recent).toBeGreaterThan(old);
  });
});

describe("buildUserProfile", () => {
  it("takes top cities by effective weight", () => {
    const prefs: UserPrefRow[] = [
      { key: "city", value: "montreal", weight: 10, updatedAt: day(15) },
      { key: "city", value: "laval", weight: 2, updatedAt: day(15) },
      { key: "city", value: "quebec", weight: 1, updatedAt: day(15) },
      { key: "foo", value: "bar", weight: 99, updatedAt: day(15) },
    ];
    const b = buildUserProfile(prefs, 2);
    expect(b.topCities).toEqual(["montreal", "laval"]);
    expect(b.prefCount).toBe(3);
  });
});

describe("isAllowedPreferenceKey", () => {
  it("rejects unknown keys", () => {
    expect(isAllowedPreferenceKey("city")).toBe(true);
    expect(isAllowedPreferenceKey("random_tag")).toBe(false);
  });
});

describe("applyPersonalization", () => {
  it("scales down when personalScale < 1", () => {
    const prefs: UserPrefRow[] = [
      { key: "city", value: "montreal", weight: 2, updatedAt: day(15) },
    ];
    const high = applyPersonalization(
      { city: "Montreal", title: "x" },
      prefs,
      1
    );
    const low = applyPersonalization(
      { city: "Montreal", title: "x" },
      prefs,
      0.33
    );
    expect(high.boost).toBeGreaterThan(0);
    expect(low.boost).toBeLessThan(high.boost);
  });
});

describe("rankListingsWithPersonalization (stable order)", () => {
  it("uses id tiebreak when scores equal", () => {
    const prefs: UserPrefRow[] = [
      { key: "city", value: "montreal", weight: 1, updatedAt: day(10) },
    ];
    const listings = [
      { id: "b", city: "Montreal", title: "a", marketPrice: 100, price: 100, views: 0, bookingsLast30d: 0 },
      { id: "a", city: "Montreal", title: "a", marketPrice: 100, price: 100, views: 0, bookingsLast30d: 0 },
    ];
    const { rows } = rankListingsWithPersonalization("x", listings, {
      searchBoost: 1,
      prefs,
      personalScale: 1,
    });
    const ids = rows.map((r) => r.id);
    expect(ids).toEqual(["a", "b"]);
  });
});
