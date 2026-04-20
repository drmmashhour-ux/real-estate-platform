import { describe, expect, it } from "vitest";

import { MERGED_COOWNERSHIP_CHECKLIST } from "../coownership-merged-definitions";
import {
  detectInsuranceDocumentationGap,
  listingRequiresCoownershipChecklist,
} from "../coownershipCompliance.service";

describe("merged co-ownership compliance", () => {
  it("has 30 merged definitions", () => {
    expect(MERGED_COOWNERSHIP_CHECKLIST.length).toBe(30);
  });

  it("detects condo / co-ownership applicability", () => {
    expect(listingRequiresCoownershipChecklist({ listingType: "CONDO", isCoOwnership: false })).toBe(true);
    expect(listingRequiresCoownershipChecklist({ listingType: "HOUSE", isCoOwnership: true })).toBe(true);
    expect(listingRequiresCoownershipChecklist({ listingType: "HOUSE", isCoOwnership: false })).toBe(false);
  });

  it("detects insurance documentation gap from trigger keys", () => {
    const gap = detectInsuranceDocumentationGap([
      { key: "coowner_insurance_verified", status: "PENDING" },
      { key: "syndicate_property_insurance_verified", status: "COMPLETED" },
      { key: "syndicate_third_party_liability_verified", status: "COMPLETED" },
    ]);
    expect(gap).toBe(true);
  });
});
