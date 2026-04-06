import { describe, it, expect } from "vitest";
import { shouldSaveGeneration } from "../save-generation-flag";

describe("shouldSaveGeneration", () => {
  it("is true when save is true", () => {
    expect(shouldSaveGeneration({ save: true })).toBe(true);
  });
  it("is true when saveDraft is true", () => {
    expect(shouldSaveGeneration({ saveDraft: true })).toBe(true);
  });
  it("is false when neither flag is set", () => {
    expect(shouldSaveGeneration({})).toBe(false);
  });
});
