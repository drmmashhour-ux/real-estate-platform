import { describe, expect, it } from "vitest";
import {
  buildListingComplianceDecision,
  evaluateListingComplianceBundle,
} from "../listing-compliance-decision.service";
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

describe("buildListingComplianceDecision", () => {
  it("allows publish when checklist has no blocking issues", () => {
    const d = buildListingComplianceDecision({ listingId: "lst_1", evaluatorInput: baseInput() });
    expect(d.allowed).toBe(true);
    expect(d.blockingIssues.length).toBe(0);
  });

  it("blocks when property basics are missing", () => {
    const inp = baseInput();
    inp.listing.address = "TBD";
    const d = buildListingComplianceDecision({ listingId: "lst_1", evaluatorInput: inp });
    expect(d.allowed).toBe(false);
    expect(d.reasons.length).toBeGreaterThan(0);
    expect(d.reasons.join(" ").toLowerCase()).not.toContain("fraud");
  });
});

describe("evaluateListingComplianceBundle", () => {
  it("keeps decision scores aligned with checklist readiness", () => {
    const { checklist, decision } = evaluateListingComplianceBundle({
      listingId: "lst_1",
      evaluatorInput: baseInput(),
    });
    expect(checklist).not.toBeNull();
    expect(decision.readinessScore).toBe(checklist!.readinessScore);
  });
});
