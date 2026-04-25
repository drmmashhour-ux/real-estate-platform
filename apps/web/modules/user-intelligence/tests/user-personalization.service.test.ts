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

import type { UserPersonalizationContext } from "../types/user-intelligence.types";
import {
  buildPersonalizationContext,
  mergePlaybookContextWithUserIntelligence,
  personalisationListingNudge,
  resolvePreferredCityHint,
} from "../services/user-personalization.service";

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

  it("resolvePreferredCityHint prefers journey over housing", () => {
    const ctx: UserPersonalizationContext = {
      userId: "u",
      hasProfile: true,
      confidence: 0.5,
      signals: {},
      journey: { latestCity: "Laval", currentDomain: null, currentStage: null },
      housingPreferences: { dream_home_location_city: "montreal" } as Record<string, unknown>,
      designPreferences: null,
      budgetPreferences: null,
      usedWave13Profile: true,
    };
    expect(resolvePreferredCityHint(ctx)).toBe("Laval");
  });

  it("personalisationListingNudge matches stored housing city", () => {
    const ctx: UserPersonalizationContext = {
      userId: "u",
      hasProfile: true,
      confidence: 0.8,
      signals: {},
      housingPreferences: { dream_home_location_city: "montreal" } as Record<string, unknown>,
      designPreferences: null,
      budgetPreferences: null,
      usedWave13Profile: true,
    };
    const n = personalisationListingNudge(0.5, ctx, "Montreal");
    expect(n.reason).toBe("city_match_durable");
    expect(n.score).toBeGreaterThan(0.5);
  });
});
