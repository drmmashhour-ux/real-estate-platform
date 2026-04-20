import { describe, expect, it } from "vitest";
import { validateHubJourneyDefinitionsInvariant } from "../hub-journey-validation";

describe("validateHubJourneyDefinitionsInvariant", () => {
  it("passes for all hubs with valid steps and routes", () => {
    const r = validateHubJourneyDefinitionsInvariant();
    expect(r.errors, r.errors.join("; ")).toHaveLength(0);
    expect(r.ok).toBe(true);
  });
});
