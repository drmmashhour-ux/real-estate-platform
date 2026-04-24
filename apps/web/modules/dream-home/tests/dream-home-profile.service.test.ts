import { describe, expect, it, vi } from "vitest";

vi.mock("../services/dream-home-playbook-memory.service", () => ({
  logDreamHomeProfileGenerated: vi.fn().mockResolvedValue(undefined),
}));

import { buildDreamHomeProfile, generateProfile } from "../services/dream-home-profile.service";

describe("buildDreamHomeProfile", () => {
  it("returns structured profile without throwing (deterministic path)", async () => {
    const { profile, source } = await buildDreamHomeProfile({
      familySize: 3,
      city: "montreal",
      budgetMax: 600_000,
      workFromHome: "sometimes",
    });
    expect(source).toBe("deterministic");
    expect(profile.householdProfile.length).toBeGreaterThan(0);
    expect(Array.isArray(profile.rationale)).toBe(true);
    expect(profile.searchFilters.city).toBe("montreal");
  });
});

describe("generateProfile", () => {
  it("uses min 3 bedrooms when family size is 4+ (explicit rule)", () => {
    const p = generateProfile({ familySize: 4, city: "montreal" });
    expect(p.searchFilters.minBedrooms).toBeGreaterThanOrEqual(3);
  });
});
