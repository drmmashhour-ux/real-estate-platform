import { describe, expect, it } from "vitest";
import { evaluateQuebecListingCompliance } from "../quebec-listing-compliance-evaluator.service";
import type { QuebecComplianceEvaluatorInput } from "../quebec-compliance-evaluator.service";

function minimalInput(): QuebecComplianceEvaluatorInput {
  return {
    primaryDomain: "listing",
    domains: ["listing", "seller"],
    listing: {
      id: "t1",
      country: "CA",
      region: "QC",
      priceCents: 500_000_00,
      propertyType: "CONDO",
      address: "123 Main",
      city: "Montreal",
      listingOwnerType: "SELLER",
      listingDealType: "SALE",
      sellerDeclarationJson: { completed: true },
      sellerDeclarationCompletedAt: new Date(),
      legalAccuracyAcceptedAt: new Date(),
      moderationStatus: "APPROVED",
      ownershipDocStatus: "approved",
      idProofDocStatus: "approved",
      verificationIdentityStage: "VERIFIED",
    },
    legalIntelCriticalCount: 0,
    legalIntelWarningCount: 0,
    brokerLicenseVerified: false,
    tenantIdPresent: false,
    listingCodePresent: false,
    documentRejectionLoop: false,
  };
}

describe("quebec-listing-compliance-evaluator.service", () => {
  it("evaluates without throwing", () => {
    const out = evaluateQuebecListingCompliance({ evaluatorInput: minimalInput() });
    expect(out.readinessScore).toBeGreaterThanOrEqual(0);
    expect(out.readinessScore).toBeLessThanOrEqual(100);
  });
});
