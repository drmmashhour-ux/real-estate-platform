import { describe, expect, it } from "vitest";
import {
  computeCaseHealthScore,
  sectionKeyForFieldKey,
} from "@/src/modules/case-command-center/application/getCaseHealthSnapshot";

describe("computeCaseHealthScore", () => {
  it("returns 100 when all clear", () => {
    expect(
      computeCaseHealthScore({
        hasContradiction: false,
        hasMandatoryGap: false,
        signatureNotReady: false,
        incompleteOptionalOnly: false,
      }),
    ).toBe(100);
  });

  it("applies stacked penalties and clamps to 0", () => {
    expect(
      computeCaseHealthScore({
        hasContradiction: true,
        hasMandatoryGap: true,
        signatureNotReady: true,
        incompleteOptionalOnly: true,
      }),
    ).toBe(0);
  });

  it("matches spec weights for single issues", () => {
    expect(
      computeCaseHealthScore({
        hasContradiction: true,
        hasMandatoryGap: false,
        signatureNotReady: false,
        incompleteOptionalOnly: false,
      }),
    ).toBe(60);
    expect(
      computeCaseHealthScore({
        hasContradiction: false,
        hasMandatoryGap: true,
        signatureNotReady: false,
        incompleteOptionalOnly: false,
      }),
    ).toBe(70);
    expect(
      computeCaseHealthScore({
        hasContradiction: false,
        hasMandatoryGap: false,
        signatureNotReady: true,
        incompleteOptionalOnly: false,
      }),
    ).toBe(80);
    expect(
      computeCaseHealthScore({
        hasContradiction: false,
        hasMandatoryGap: false,
        signatureNotReady: false,
        incompleteOptionalOnly: true,
      }),
    ).toBe(85);
  });
});

describe("sectionKeyForFieldKey", () => {
  it("resolves known declaration field to section", () => {
    expect(sectionKeyForFieldKey("property_address")).toBe("property_identity");
  });
});
