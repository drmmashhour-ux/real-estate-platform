import { describe, expect, it } from "vitest";
import { getDomainModule } from "../shared/domain-registry";
import { resolveRewardForDomain } from "@/modules/playbook-memory/utils/playbook-memory-bandit";

describe("playbookDomainRegistry", () => {
  it("resolves known modules", () => {
    expect(getDomainModule("GROWTH")?.domain).toBe("GROWTH");
    expect(getDomainModule("listings")?.domain).toBe("LISTINGS");
    expect(getDomainModule("DREAM_HOME")?.domain).toBe("DREAM_HOME");
    expect(getDomainModule("LEADS")?.domain).toBe("LEADS");
  });

  it("returns null for unknown domains (generic engine path)", () => {
    expect(getDomainModule("")).toBeNull();
  });
});

describe("resolveRewardForDomain", () => {
  it("falls back to generic when domain module returns null", () => {
    const r = resolveRewardForDomain("GROWTH", { realizedValue: 10, realizedRevenue: null, realizedConversion: null });
    expect(r).toBeGreaterThan(0);
  });

  it("uses PRICING generic path (no module)", () => {
    const r = resolveRewardForDomain("PRICING", { realizedRevenue: 100 });
    expect(r).toBeGreaterThan(0);
  });
});
