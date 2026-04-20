import { describe, expect, it, vi } from "vitest";
import { evaluateListingPrepublishBlock } from "../prepublish-auto-block.service";
import type { QuebecComplianceEvaluatorInput } from "../quebec-compliance-evaluator.service";

vi.mock("@/config/feature-flags", () => ({
  complianceFlags: {
    quebecComplianceV1: true,
    propertyLegalRiskScoreV1: true,
    listingPrepublishAutoBlockV1: true,
    quebecListingComplianceV1: true,
    complianceAutoBlockV1: true,
  },
}));

describe("prepublish-auto-block.service", () => {
  it("blocks when evaluator input is missing", async () => {
    const ev = evaluateListingPrepublishBlock({ listingId: "x", evaluatorInput: null });
    expect(ev.allowed).toBe(false);
    expect(ev.blockingIssues).toContain("qc_load_failed");
  });

  it("does not throw on synthetic failing checklist", () => {
    const inp: QuebecComplianceEvaluatorInput = {
      primaryDomain: "listing",
      domains: ["listing", "seller"],
      listing: {
        id: "fsbo1",
        country: "CA",
        region: "QC",
        priceCents: null,
        propertyType: null,
        address: "TBD",
        city: "TBD",
        listingOwnerType: "SELLER",
        listingDealType: "SALE",
        sellerDeclarationJson: null,
        sellerDeclarationCompletedAt: null,
        legalAccuracyAcceptedAt: null,
        moderationStatus: "APPROVED",
        ownershipDocStatus: "missing",
        idProofDocStatus: "missing",
      },
      legalIntelCriticalCount: 0,
      legalIntelWarningCount: 0,
      brokerLicenseVerified: false,
      tenantIdPresent: false,
      listingCodePresent: false,
      documentRejectionLoop: false,
    };
    const ev = evaluateListingPrepublishBlock({ listingId: "fsbo1", evaluatorInput: inp });
    expect(typeof ev.allowed).toBe("boolean");
    expect(ev.readinessScore).toBeGreaterThanOrEqual(0);
    expect(ev.readinessScore).toBeLessThanOrEqual(100);
  });
});
