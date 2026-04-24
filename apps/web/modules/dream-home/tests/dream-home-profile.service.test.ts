import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/openai", () => ({
  isOpenAiConfigured: () => false,
  openai: null,
}));

vi.mock("../services/dream-home-playbook-memory.service", () => ({
  logDreamHomeProfileGenerated: vi.fn().mockResolvedValue(undefined),
}));

import { buildDreamHomeProfile } from "../services/dream-home-profile.service";

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
