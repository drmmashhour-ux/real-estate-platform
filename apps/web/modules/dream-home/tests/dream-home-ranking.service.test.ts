import { describe, expect, it, vi } from "vitest";

vi.mock("../services/dream-home-playbook.service", () => ({
  getDreamHomePlaybookRecommendations: vi.fn().mockResolvedValue([]),
}));

vi.mock("../services/dream-home-playbook-memory.service", () => ({
  logDreamHomeRankListings: vi.fn().mockResolvedValue(undefined),
  logDreamHomeRecommendPlaybook: vi.fn().mockResolvedValue(undefined),
}));

import { rankDreamHomeListings } from "../services/dream-home-ranking.service";
import type { DreamHomeProfile } from "../types/dream-home.types";

describe("rankDreamHomeListings", () => {
  it("ranks and adds rationale without throwing", async () => {
    const profile: DreamHomeProfile = {
      householdProfile: "H",
      propertyTraits: ["p"],
      neighborhoodTraits: ["n"],
      searchFilters: { minBedrooms: 2 },
      rationale: ["r"],
    };
    const cands = [
      {
        id: "1",
        title: "A quiet home with office",
        city: "M",
        priceCents: 100_000_00,
        bedrooms: 3,
        bathrooms: 2,
        coverImage: null,
        propertyType: "house",
        description: "spacious kitchen yard",
        matchScore: 0.5,
        whyThisFits: ["f"],
      },
    ];
    const { ranked, warnings } = await rankDreamHomeListings(profile, cands);
    expect(ranked.length).toBe(1);
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[0]!.rankRationale[0]).toBeDefined();
    expect(warnings).toBeDefined();
  });
});
