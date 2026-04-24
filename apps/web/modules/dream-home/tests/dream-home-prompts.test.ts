import { describe, expect, it } from "vitest";
import { buildDreamHomeProfileSystemPrompt, validateDreamHomeProfileShape } from "../utils/dream-home-prompts";

describe("buildDreamHomeProfileSystemPrompt", () => {
  it("mentions no protected-trait inference", () => {
    const p = buildDreamHomeProfileSystemPrompt();
    expect(p.toLowerCase()).toMatch(/stereotype|protected|nationality/);
  });
});

describe("validateDreamHomeProfileShape", () => {
  it("accepts minimal valid shape", () => {
    const r = validateDreamHomeProfileShape({
      householdProfile: "Test household",
      propertyTraits: ["a"],
      neighborhoodTraits: ["b"],
      searchFilters: {},
      rationale: ["r"],
    });
    expect(r).not.toBeNull();
    expect(r!.householdProfile).toBe("Test household");
  });

  it("rejects empty household", () => {
    expect(validateDreamHomeProfileShape({ householdProfile: "  " })).toBeNull();
  });
});
