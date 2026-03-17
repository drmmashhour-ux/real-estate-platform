import { describe, it, expect } from "vitest";
import { normalizeLegalName, normalizeOrganizationName } from "../normalize";

describe("identity-network normalize", () => {
  describe("normalizeLegalName", () => {
    it("returns empty for null/undefined", () => {
      expect(normalizeLegalName(null)).toBe("");
      expect(normalizeLegalName(undefined)).toBe("");
    });
    it("trims and collapses spaces", () => {
      expect(normalizeLegalName("  Jean   Dupont  ")).toBe("jean dupont");
    });
    it("lowercases", () => {
      expect(normalizeLegalName("Jean Dupont")).toBe("jean dupont");
    });
    it("removes common punctuation", () => {
      expect(normalizeLegalName("Dupont, Jean.")).toBe("dupont jean");
    });
  });

  describe("normalizeOrganizationName", () => {
    it("behaves like legal name", () => {
      expect(normalizeOrganizationName("Acme Realty Inc.")).toBe("acme realty inc");
    });
  });
});
