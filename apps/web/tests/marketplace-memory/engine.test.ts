import { describe, expect, it } from "vitest";
import { computeSummariesFromEvents } from "@/lib/marketplace-memory/memory-aggregation.engine";
import { recencyWeight } from "@/lib/marketplace-memory/decay";
import {
  buildMemoryRankHintFromSignals,
  memoryListingAffinity01,
  preferredCityFromMemorySignals,
} from "@/lib/marketplace-memory/memory-ranking-hint";
import { rankListings } from "@/lib/ai/bnhub-search";

describe("marketplace memory engine", () => {
  it("weights recent events higher than older ones", () => {
    const now = new Date("2026-04-23T12:00:00Z");
    const old = new Date("2026-01-01T12:00:00Z");
    expect(recencyWeight(now, now, 45)).toBeGreaterThan(recencyWeight(old, now, 45));
  });

  it("aggregates locations, types, and budget from weighted metadata", () => {
    const now = new Date("2026-04-23T12:00:00Z");
    const out = computeSummariesFromEvents(
      [
        {
          eventType: "VIEW",
          metadataJson: { city: "Laval", propertyType: "Condo", priceMin: 400_000, priceMax: 600_000 },
          createdAt: now,
        },
        {
          eventType: "VIEW",
          metadataJson: { city: "Laval", propertyType: "Condo" },
          createdAt: now,
        },
      ],
      45,
      now,
    );
    expect(out.preferenceSummary.topLocations?.[0]?.location).toContain("Laval");
    expect(out.preferenceSummary.topPropertyTypes?.[0]?.propertyType).toBe("Condo");
    expect(out.preferenceSummary.budgetRange?.min).toBe(400_000);
    expect(out.preferenceSummary.budgetRange?.max).toBe(600_000);
    expect(out.intentSummary.urgencyScore).toBeGreaterThan(0);
  });

  it("builds rank hints and listing affinity from engine signals", () => {
    const signals = {
      personalizationEnabled: true,
      preferenceSummary: {
        topLocations: [{ location: "Laval, QC", score: 12 }],
        topPropertyTypes: [{ propertyType: "Condo", score: 8 }],
      },
      sessionIntent: { city: "Montreal" },
    };
    expect(preferredCityFromMemorySignals(signals)).toBe("Montreal");
    const hint = buildMemoryRankHintFromSignals(signals);
    expect(hint).not.toBeNull();
    const aff = memoryListingAffinity01(
      { city: "Montreal", region: "QC", propertyType: "Condo" },
      hint!,
    );
    expect(aff).toBeGreaterThan(0);
  });

  it("rankListings applies a bounded memory nudge on display score", () => {
    const listings = [
      {
        id: "a",
        city: "Montreal",
        region: "QC",
        nightPriceCents: 10_000,
        beds: 2,
        propertyType: "Condo",
        listingStatus: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "b",
        city: "Quebec City",
        region: "QC",
        nightPriceCents: 10_000,
        beds: 2,
        propertyType: "House",
        listingStatus: "PUBLISHED",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const base = rankListings(listings, {}, undefined);
    const withMem = rankListings(listings, {}, {
      memoryRankHint: {
        topLocations: [],
        topPropertyTypes: [{ propertyType: "Condo", score: 50 }],
        sessionCity: "Montreal",
      },
    });
    const scoreA = withMem.find((x) => x.id === "a")?._aiScore ?? 0;
    const scoreB = withMem.find((x) => x.id === "b")?._aiScore ?? 0;
    const baseGap = (base.find((x) => x.id === "a")?._aiScore ?? 0) - (base.find((x) => x.id === "b")?._aiScore ?? 0);
    const memGap = scoreA - scoreB;
    expect(memGap).toBeGreaterThanOrEqual(baseGap);
  });
});
