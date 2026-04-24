import { describe, expect, it } from "vitest";
import {
  legacyIntakeToQuestionnaire,
  normalizeQuestionnaire,
  toBudgetBand,
  toFamilySizeBand,
} from "../utils/dream-home-normalize";

describe("normalizeQuestionnaire", () => {
  it("strips protected-trait style keys and keeps explicit fields", () => {
    const q = normalizeQuestionnaire({
      familySize: 4,
      privacyPreference: "high",
      nationality: "X",
      ethnicity: "Y",
    });
    expect((q as Record<string, unknown>)["nationality"]).toBeUndefined();
    expect(q.familySize).toBe(4);
    expect(q.privacyPreference).toBe("high");
  });
});

describe("toFamilySizeBand", () => {
  it("maps size to band", () => {
    expect(toFamilySizeBand(2)).toBe("small");
    expect(toFamilySizeBand(4)).toBe("medium");
    expect(toFamilySizeBand(6)).toBe("large");
  });
});

describe("toBudgetBand", () => {
  it("classifies only from numbers", () => {
    expect(toBudgetBand(null, 150_000)).toBe("low");
    expect(toBudgetBand(null, 500_000)).toBe("mid");
  });
});

describe("legacyIntakeToQuestionnaire", () => {
  it("maps guest frequency to level without inferring protected traits", () => {
    const q = legacyIntakeToQuestionnaire({ guestFrequency: 0.6, householdSize: 3, workFromHome: true });
    expect(q.guestsFrequency).toBe("high");
    expect(q.workFromHome).toBe("sometimes");
  });
});
