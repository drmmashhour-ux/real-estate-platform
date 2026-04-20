import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLATFORM_REGION_CODE,
  REGION_REGISTRY,
  getRegionDefinition,
  resolveRegionFromHost,
  resolveRegionFromPath,
  isRegionCapabilityEnabled,
} from "@lecipm/platform-core";
import { getJurisdictionPolicyPack } from "@/modules/legal/jurisdiction/jurisdiction-policy-pack-registry";
import {
  canRegionUseControlledExecution,
  resolveRegionExecutionProfile,
} from "@/modules/autonomous-marketplace/regions/region-execution-capability.service";

describe("global multi-region foundation", () => {
  it("registry is sorted and contains ca_qc + sy", () => {
    const codes = REGION_REGISTRY.map((r) => r.code);
    expect(codes).toEqual([...codes].sort((a, b) => a.localeCompare(b)));
    expect(codes).toContain("ca_qc");
    expect(codes).toContain("sy");
  });

  it("resolution helpers never throw and default safely", () => {
    expect(resolveRegionFromHost("")).toBe(DEFAULT_PLATFORM_REGION_CODE);
    expect(resolveRegionFromPath("/sy/listings")).toBe("sy");
    expect(resolveRegionFromHost("syria.example.com")).toBe("sy");
  });

  it("getRegionDefinition normalizes aliases", () => {
    expect(getRegionDefinition("qc")?.code).toBe("ca_qc");
    expect(getRegionDefinition("syria")?.code).toBe("sy");
  });

  it("capability checks are deterministic", () => {
    expect(isRegionCapabilityEnabled("ca_qc", "controlledExecution")).toBe(true);
    expect(isRegionCapabilityEnabled("sy", "controlledExecution")).toBe(false);
  });

  it("jurisdiction packs return stable shapes", () => {
    const qc = getJurisdictionPolicyPack("ca_qc");
    const sy = getJurisdictionPolicyPack("sy");
    expect(qc.checklistEnabled).toBe(true);
    expect(sy.checklistEnabled).toBe(false);
  });

  it("region execution profile never throws", () => {
    const p = resolveRegionExecutionProfile("sy");
    expect(["full", "recommend_only", "blocked"]).toContain(p.executionMode);
    expect(canRegionUseControlledExecution("sy")).toBe(false);
  });
});
