import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: { fsboListing: { findMany: vi.fn().mockResolvedValue([]) } },
}));

vi.mock("@/lib/geo/city-search", () => ({ fsboCityWhereFromParam: () => ({ city: { contains: "x" } }) }));

vi.mock("../services/dream-home-playbook-memory.service", () => ({
  logDreamHomeMemory: vi.fn().mockResolvedValue(undefined),
}));

import { matchDreamHomeListings } from "../services/dream-home-match.service";
import type { DreamHomeProfile } from "../types/dream-home.types";

describe("matchDreamHomeListings", () => {
  it("returns safe result when no rows", async () => {
    const p: DreamHomeProfile = {
      householdProfile: "H",
      propertyTraits: ["p"],
      neighborhoodTraits: ["n"],
      searchFilters: { city: "montreal", minBedrooms: 2, budgetMax: 900_000 },
      rationale: ["r"],
    };
    const r = await matchDreamHomeListings(p, "deterministic");
    expect(r.listings).toEqual([]);
  });
});
