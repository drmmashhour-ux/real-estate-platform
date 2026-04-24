import { describe, expect, it, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
const upsert = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { userJourneyState: { findUnique, upsert } },
}));

import { getJourneyState, updateJourneyState } from "../services/user-journey.service";

beforeEach(() => {
  findUnique.mockReset();
  upsert.mockReset();
  findUnique.mockResolvedValue(null);
  upsert.mockResolvedValue({
    id: "j1",
    userId: "u1",
    currentIntent: "buy",
    currentDomain: "LISTINGS",
    currentStage: "search",
    currentSearchMode: null,
    latestCity: "montreal",
    latestBudgetBand: "mid",
    latestPropertyIntent: "buy",
    latestHouseholdBand: "medium",
    summaryJson: null,
    lastActivityAt: new Date(),
  });
});

describe("user-journey.service", () => {
  it("getJourneyState returns null when no row", async () => {
    const r = await getJourneyState("u1");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toBeNull();
    }
  });

  it("updateJourneyState upserts", async () => {
    const r = await updateJourneyState({ userId: "u1", currentDomain: "DREAM_HOME" });
    expect(r.ok).toBe(true);
  });
});
