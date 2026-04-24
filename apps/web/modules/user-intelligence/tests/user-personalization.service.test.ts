import { describe, expect, it, vi, beforeEach } from "vitest";

const { findUniqueJ, findUniqueP } = vi.hoisted(() => ({
  findUniqueJ: vi.fn(),
  findUniqueP: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    userPreferenceProfile: { findUnique: findUniqueP },
    userJourneyState: { findUnique: findUniqueJ },
  },
}));

import { buildPersonalizationContext, mergePlaybookContextWithUserIntelligence } from "../services/user-personalization.service";

beforeEach(() => {
  findUniqueJ.mockReset();
  findUniqueP.mockReset();
  findUniqueJ.mockResolvedValue({ currentDomain: "DREAM_HOME", currentStage: "x", latestCity: "laval" });
  findUniqueP.mockResolvedValue({
    confidenceScore: 0.5,
    housingPreferences: { dream_home_location_city: "montreal" } as object,
    designPreferences: null,
    budgetPreferences: { band: "mid" } as object,
  });
});

describe("user-personalization.service", () => {
  it("buildPersonalizationContext is safe with profile", async () => {
    const r = await buildPersonalizationContext("u1", null);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.hasProfile).toBe(true);
      expect(r.data.signals.pref_dream_home_location_city).toBe("montreal");
    }
  });

  it("mergePlaybookContextWithUserIntelligence merges when userId set", async () => {
    const out = await mergePlaybookContextWithUserIntelligence({
      domain: "DREAM_HOME",
      entityType: "test",
      userId: "u1",
      signals: { a: 1 },
    });
    expect(out.signals?.a).toBe(1);
    expect(out.userId).toBe("u1");
  });
});
