import { describe, it, expect } from "vitest";
import { normalizeAddress, normalizeMunicipality, normalizeProvince, normalizeCadastreForUid } from "../normalize";

describe("normalizeAddress", () => {
  it("trims and lowercases", () => {
    expect(normalizeAddress("  123 MAIN ST  ")).toBe("123 main st");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeAddress("123   Main   Street").includes("  ")).toBe(false);
  });
});

describe("normalizeMunicipality", () => {
  it("returns empty for null/undefined", () => {
    expect(normalizeMunicipality(null)).toBe("");
    expect(normalizeMunicipality(undefined)).toBe("");
  });
  it("trims and lowercases", () => {
    expect(normalizeMunicipality("  Montreal  ")).toBe("montreal");
  });
});

describe("normalizeProvince", () => {
  it("returns empty for null/undefined", () => {
    expect(normalizeProvince(null)).toBe("");
    expect(normalizeProvince(undefined)).toBe("");
  });
  it("trims and uppercases", () => {
    expect(normalizeProvince("  qc  ")).toBe("QC");
  });
});

describe("normalizeCadastreForUid", () => {
  it("returns empty for null/undefined", () => {
    expect(normalizeCadastreForUid(null)).toBe("");
    expect(normalizeCadastreForUid(undefined)).toBe("");
  });
  it("trims and collapses spaces", () => {
    expect(normalizeCadastreForUid("  16  1/4  ")).toBe("16 1/4");
  });
});
