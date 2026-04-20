import { describe, expect, it } from "vitest";
import { validateCertificateConsistency } from "../certificate-of-location-consistency.service";
import type { CertificateOfLocationContext } from "../certificate-of-location.types";

describe("validateCertificateConsistency", () => {
  it("returns null matches when insufficient data", () => {
    const ctx: CertificateOfLocationContext = { listingId: "l" };
    const r = validateCertificateConsistency({}, ctx);
    expect(r.addressMatchesListing).toBeNull();
    expect(r.lotMatchesListing).toBeNull();
    expect(r.mismatches).toHaveLength(0);
  });

  it("detects address mismatch deterministically", () => {
    const ctx: CertificateOfLocationContext = {
      listingId: "l",
      listingAddress: "999 Rue Example",
      listingCity: "Montreal",
    };
    const r = validateCertificateConsistency(
      { address: "404 Wellington Sud", municipality: "Sherbrooke" },
      ctx,
    );
    expect(r.addressMatchesListing).toBe(false);
    expect(r.mismatches.some((m) => m.includes("address"))).toBe(true);
  });

  it("never throws", () => {
    const r = validateCertificateConsistency({ lotNumber: "x" } as never, {} as never);
    expect(r.mismatches).toBeDefined();
  });
});
