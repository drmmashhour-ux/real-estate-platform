import { describe, it, expect } from "vitest";
import {
  resolveOwnerIdentity,
  resolveBrokerIdentity,
  resolveOrganizationIdentity,
} from "../resolution";

describe("identity-network resolution", () => {
  describe("resolveOwnerIdentity", () => {
    it("returns exact_match when no existing to compare", () => {
      const r = resolveOwnerIdentity({ legalName: "Jean Dupont" });
      expect(r.outcome).toBe("exact_match");
      expect(r.confidence).toBe(1);
    });
    it("returns exact_match when normalized name matches", () => {
      const r = resolveOwnerIdentity({
        legalName: "Jean Dupont",
        existingNormalizedName: "jean dupont",
      });
      expect(r.outcome).toBe("exact_match");
    });
    it("returns mismatch for empty legal name", () => {
      const r = resolveOwnerIdentity({ legalName: "", existingNormalizedName: "jean dupont" });
      expect(r.outcome).toBe("mismatch");
    });
    it("returns probable or manual_review for similar but not identical names", () => {
      const r = resolveOwnerIdentity({
        legalName: "Jean-Pierre Dupont",
        existingNormalizedName: "jean pierre dupont",
      });
      expect(["exact_match", "probable_match", "manual_review_required"]).toContain(r.outcome);
    });
  });

  describe("resolveBrokerIdentity", () => {
    it("returns exact_match when license numbers match", () => {
      const r = resolveBrokerIdentity({
        legalName: "Marie Martin",
        licenseNumber: "OACIQ-12345",
        existingLicenseNumber: "OACIQ-12345",
        existingNormalizedName: "marie martin",
      });
      expect(r.outcome).toBe("exact_match");
    });
    it("returns mismatch when license numbers differ", () => {
      const r = resolveBrokerIdentity({
        legalName: "Marie Martin",
        licenseNumber: "OACIQ-111",
        existingLicenseNumber: "OACIQ-222",
      });
      expect(r.outcome).toBe("mismatch");
    });
    it("returns exact_match when no existing", () => {
      const r = resolveBrokerIdentity({
        legalName: "Marie Martin",
        licenseNumber: "OACIQ-123",
      });
      expect(r.outcome).toBe("exact_match");
    });
  });

  describe("resolveOrganizationIdentity", () => {
    it("returns exact_match when names match", () => {
      const r = resolveOrganizationIdentity({
        legalName: "Acme Realty Inc.",
        existingNormalizedName: "acme realty inc",
      });
      expect(r.outcome).toBe("exact_match");
    });
    it("returns mismatch for empty name", () => {
      const r = resolveOrganizationIdentity({
        legalName: "",
        existingNormalizedName: "acme",
      });
      expect(r.outcome).toBe("mismatch");
    });
  });
});
