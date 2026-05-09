import { describe, expect, it } from "vitest";
import { isHubEnabled, FEATURE_CORE, FEATURE_HOMES, FEATURE_BNHUB, FEATURE_INVEST } from "../features";

describe("Feature Flags", () => {
  it("FEATURE_CORE is always true", () => {
    expect(FEATURE_CORE).toBe(true);
  });

  it("public hubs default ON", () => {
    expect(FEATURE_HOMES).toBe(true);
    expect(FEATURE_BNHUB).toBe(true);
  });

  it("beta hubs default OFF", () => {
    expect(FEATURE_INVEST).toBe(false);
  });

  it("isHubEnabled resolves known flags", () => {
    expect(isHubEnabled("FEATURE_CORE")).toBe(true);
    expect(isHubEnabled("FEATURE_HOMES")).toBe(true);
    expect(isHubEnabled("FEATURE_BNHUB")).toBe(true);
    expect(isHubEnabled("FEATURE_INVEST")).toBe(false);
  });

  it("isHubEnabled returns false for unknown flags", () => {
    expect(isHubEnabled("FEATURE_NONEXISTENT")).toBe(false);
  });
});
