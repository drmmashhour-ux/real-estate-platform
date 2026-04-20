import { describe, expect, it } from "vitest";
import { createMemoryCoownershipStore } from "../coownership-autopilot.store";
import {
  isCoownershipCertificateComplete,
  requiresCoownershipCompliance,
  runCoownershipAutopilot,
} from "../coownership-autopilot.service";

describe("coownership autopilot", () => {
  it("HOUSE does not require compliance", () => {
    expect(
      requiresCoownershipCompliance({
        id: "a",
        propertyType: "SINGLE_FAMILY",
        sellerDeclarationJson: {},
      }),
    ).toBe(false);
  });

  it("CONDO requires compliance", () => {
    expect(
      requiresCoownershipCompliance({
        id: "b",
        propertyType: "CONDO",
        sellerDeclarationJson: { isCondo: true },
      }),
    ).toBe(true);
  });

  it("certificate complete when declaration signals present", () => {
    expect(
      isCoownershipCertificateComplete({
        id: "c",
        propertyType: "CONDO",
        sellerDeclarationJson: {
          isCondo: true,
          condoRulesReviewed: true,
          condoSyndicateDocumentsAvailable: true,
          condoFinancialStatementsAvailable: true,
        },
      }),
    ).toBe(true);
  });

  it("FULL_AUTOPILOT_APPROVAL returns block + reason when cert missing", async () => {
    const store = createMemoryCoownershipStore();
    const r = await runCoownershipAutopilot({
      store,
      listing: {
        id: "d",
        propertyType: "CONDO",
        sellerDeclarationJson: { isCondo: true, condoRulesReviewed: false },
      },
      mode: "FULL_AUTOPILOT_APPROVAL",
      trigger: "listing_updated",
      cycleKey: "t1",
    });
    expect(r.action).toBe("BLOCK_ACTION");
    expect(r.blockReason).toBe("Missing co-ownership certificate");
  });
});
