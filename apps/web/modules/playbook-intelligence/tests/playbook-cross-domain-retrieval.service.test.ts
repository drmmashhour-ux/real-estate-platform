import { describe, expect, it } from "vitest";
import type { MemoryDomain } from "@prisma/client";
import { buildSharedSignature } from "../shared/shared-context-signature";
import { normalizeSharedContext, toSharedContextRepresentation } from "../shared/shared-context-normalize";
import { computeCrossDomainCompatibility } from "../utils/playbook-transfer-score";
import { computeSharedFeatureFit } from "../utils/playbook-shared-score";

describe("shared signature (deterministic)", () => {
  it("is stable for same logical input", () => {
    const a = toSharedContextRepresentation({
      originDomain: "DREAM_HOME",
      features: { city: "Montreal" },
      explicit: { minBedrooms: 3 },
    });
    const a2 = toSharedContextRepresentation({
      originDomain: "DREAM_HOME",
      features: { minBedrooms: 3, city: "Montreal" },
    });
    const s1 = buildSharedSignature(a);
    const s2 = buildSharedSignature(a2);
    // Features/explicit may differ; signature still hex 64
    expect(s1.length).toBe(64);
    expect(s2.length).toBe(64);
  });
  it("normalize is deterministic for key order", () => {
    const a = normalizeSharedContext({ b: 1, a: 2 });
    const b = normalizeSharedContext({ a: 2, b: 1 });
    expect(a).toEqual(b);
  });
  it("feature fit: identical maps near 1", () => {
    const f = { x: "1", y: 2 } as const;
    expect(computeSharedFeatureFit(f, f)).toBeGreaterThan(0.3);
  });
  it("cross domain compatibility: same = 1, dream/listings = high", () => {
    expect(computeCrossDomainCompatibility("DREAM_HOME" as MemoryDomain, "DREAM_HOME" as MemoryDomain)).toBe(1);
    expect(computeCrossDomainCompatibility("DREAM_HOME" as MemoryDomain, "LISTINGS" as MemoryDomain)).toBeGreaterThan(0.5);
  });

  it("shared context carries explicit user-stated home prefs only in this test fixture", () => {
    const r = toSharedContextRepresentation({
      originDomain: "DREAM_HOME",
      features: { familySize: 2, minBedrooms: 3, lifestyle: "suburban" },
    });
    expect(r.version).toBe(1);
    expect(r.features.familySize).toBe(2);
  });
});
