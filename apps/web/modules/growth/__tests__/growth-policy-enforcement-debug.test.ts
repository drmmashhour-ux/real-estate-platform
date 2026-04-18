import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  policyEnforcementApiRequestHasDebug,
  shouldShowGrowthPolicyEnforcementDebugUi,
} from "../growth-policy-enforcement-debug";

describe("growth-policy-enforcement-debug", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GROWTH_POLICY_ENFORCEMENT_DEBUG", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects debug query param on API request", () => {
    expect(policyEnforcementApiRequestHasDebug(new Request("http://x/api?q=1"))).toBe(false);
    expect(policyEnforcementApiRequestHasDebug(new Request("http://x/api?growthPolicyDebug=1"))).toBe(true);
  });

  it("shows debug UI in non-production without query", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(shouldShowGrowthPolicyEnforcementDebugUi(null)).toBe(true);
  });

  it("shows debug UI in production only with env or query", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(shouldShowGrowthPolicyEnforcementDebugUi(null)).toBe(false);
    expect(shouldShowGrowthPolicyEnforcementDebugUi("1")).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_GROWTH_POLICY_ENFORCEMENT_DEBUG", "1");
    expect(shouldShowGrowthPolicyEnforcementDebugUi(null)).toBe(true);
  });
});
