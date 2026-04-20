import { describe, expect, it } from "vitest";
import { evaluateQuebecCompliance } from "../quebec-compliance-evaluator.service";
import type { QuebecComplianceEvaluatorInput } from "../quebec-compliance-evaluator.service";

function baseInput(): QuebecComplianceEvaluatorInput {
  return {
    primaryDomain: "listing",
    domains: ["listing", "seller"],
    listing: {
      id: "lst_1",
      country: "CA",
      region: "QC",
      priceCents: 350_000_00,
      propertyType: "CONDO",
      address: "123 Rue Example",
      city: "Montréal",
      listingOwnerType: "SELLER",
      listingDealType: "SALE",
      sellerDeclarationJson: {},
      sellerDeclarationCompletedAt: new Date(),
      legalAccuracyAcceptedAt: new Date(),
      ownershipDocStatus: "approved",
      idProofDocStatus: "approved",
      verificationIdentityStage: "VERIFIED",
    },
    legalRecords: [],
    validationAggregate: null,
    ruleResults: [],
    fraudIndicators: [],
    legalIntelCriticalCount: 0,
    legalIntelWarningCount: 0,
    brokerLicenseVerified: false,
    tenantIdPresent: false,
    listingCodePresent: true,
    documentRejectionLoop: false,
  };
}

describe("evaluateQuebecCompliance", () => {
  it("does not throw on minimal QC listing", () => {
    expect(() => evaluateQuebecCompliance(baseInput())).not.toThrow();
  });

  it("reports full readiness when core gates pass", () => {
    const r = evaluateQuebecCompliance(baseInput());
    expect(r.blockingIssues.length).toBe(0);
    expect(r.readinessScore).toBe(100);
  });

  it("reduces readiness when a critical blocking item fails", () => {
    const inp = baseInput();
    inp.listing.priceCents = null;
    const r = evaluateQuebecCompliance(inp);
    expect(r.readinessScore).toBeLessThan(100);
    expect(r.blockingIssues).toContain("qc_listing_property_basic_data_present");
  });

  it("uses safe wording in messages (no accusations)", () => {
    const inp = baseInput();
    inp.listing.priceCents = null;
    const r = evaluateQuebecCompliance(inp);
    const txt = r.results.map((x) => x.message).join(" ").toLowerCase();
    expect(txt).not.toContain("fraud");
    expect(txt).not.toContain("illegal");
  });
});
