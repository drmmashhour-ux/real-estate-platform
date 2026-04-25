import { describe, expect, it } from "vitest";
import { requiredConflictConsentUserIds } from "../conflict-deal-compliance.service";
import { CONFLICT_DISCLOSURE_ACK_TEXT } from "../conflict-deal-compliance.constants";

describe("requiredConflictConsentUserIds", () => {
  it("returns both parties when broker is neither buyer nor seller", () => {
    expect(
      requiredConflictConsentUserIds({ brokerId: "brk", buyerId: "b1", sellerId: "s1" }).sort(),
    ).toEqual(["b1", "s1"].sort());
  });

  it("returns only seller when broker is buyer", () => {
    expect(requiredConflictConsentUserIds({ brokerId: "brk", buyerId: "brk", sellerId: "s1" })).toEqual(["s1"]);
  });

  it("returns only buyer when broker is seller", () => {
    expect(requiredConflictConsentUserIds({ brokerId: "brk", buyerId: "b1", sellerId: "brk" })).toEqual(["b1"]);
  });

  it("returns empty when broker is missing", () => {
    expect(requiredConflictConsentUserIds({ brokerId: null, buyerId: "b1", sellerId: "s1" })).toEqual([]);
  });
});

describe("CONFLICT_DISCLOSURE_ACK_TEXT", () => {
  it("matches the mandated checkbox copy", () => {
    expect(CONFLICT_DISCLOSURE_ACK_TEXT).toBe("I acknowledge the broker's interest");
  });
});
