import { describe, expect, it } from "vitest";
import { validateListingAdvertisingCompliance } from "@/lib/compliance/oaciq/representation-advertising/engine";
import type { ListingAdvertisingComplianceContext } from "@/lib/compliance/oaciq/representation-advertising/types";
import { DEFAULT_PUBLISH_RULE_SUBSET } from "@/lib/compliance/oaciq/representation-advertising/rules";

const baseBroker = {
  holdsValidBrokerageLicense: true,
  licensedNameDisplayedInCreative: true,
  licenceDesignationPresent: true,
  hasSignedBrokerageContractForThisMandate: true,
  isSolicitingAnotherBrokersExclusive: false,
  offersReferralGiftOrCommissionKickback: false,
  isAgencyOperation: false,
  agencyHasDocumentedSupervision: true,
};

function ctx(partial: Partial<ListingAdvertisingComplianceContext>): ListingAdvertisingComplianceContext {
  const { broker: brokerPartial, ...rest } = partial;
  return {
    intendedForPublicAdvertising: true,
    marketingText: "",
    isComingSoonOrTeaser: false,
    isSoldOrCompleted: false,
    publicAdShowsNumericPriceWhenSold: false,
    displaysSoldLabel: true,
    broker: { ...baseBroker, ...brokerPartial },
    ...rest,
  };
}

describe("runRepresentationAdvertisingEngine", () => {
  it("flags missing licence on publish", () => {
    const out = validateListingAdvertisingCompliance(
      ctx({ broker: { holdsValidBrokerageLicense: false } }),
      DEFAULT_PUBLISH_RULE_SUBSET,
    );
    expect(out.compliant).toBe(false);
    expect(out.triggered_rule_ids).toContain("license_required_for_advertising");
    expect(out.blockPublish).toBe(true);
  });

  it("flags missing mandate contract", () => {
    const out = validateListingAdvertisingCompliance(
      ctx({ broker: { hasSignedBrokerageContractForThisMandate: false } }),
      DEFAULT_PUBLISH_RULE_SUBSET,
    );
    expect(out.violations.some((v) => v.rule === "contract_required_before_ad")).toBe(true);
    expect(out.blockPublish).toBe(true);
  });

  it("detects performance guarantee language", () => {
    const out = validateListingAdvertisingCompliance(
      ctx({ marketingText: "We guarantee the sale in 30 days." }),
      DEFAULT_PUBLISH_RULE_SUBSET,
    );
    expect(out.violations.some((v) => v.rule === "no_performance_guarantee")).toBe(true);
  });

  it("passes clean residential publish context", () => {
    const out = validateListingAdvertisingCompliance(ctx({ marketingText: "Bright condo in QC." }), DEFAULT_PUBLISH_RULE_SUBSET);
    expect(out.compliant).toBe(true);
    expect(out.risk_score).toBe(0);
  });
});
