import { describe, expect, it } from "vitest";
import {
  evaluateCoownershipComplianceRule,
  listingMatchesCoownershipRule,
} from "@/src/modules/autopilot/rules/coownershipCompliance.rule";

describe("coownershipCompliance.rule", () => {
  const condo = { listingType: "CONDO", isCoOwnership: false };
  const house = { listingType: "HOUSE", isCoOwnership: false };

  it("detects CONDO or explicit co-ownership", () => {
    expect(listingMatchesCoownershipRule(condo)).toBe(true);
    expect(listingMatchesCoownershipRule({ ...house, isCoOwnership: true })).toBe(true);
    expect(listingMatchesCoownershipRule(house)).toBe(false);
  });

  it("ASSIST emits recommendation only", () => {
    const d = evaluateCoownershipComplianceRule({
      listing: condo,
      mode: "ASSIST",
      certificateComplete: false,
      insuranceGateComplete: false,
      criticalComplianceComplete: false,
    });
    expect(d).not.toBeNull();
    expect(d?.actions.every((a) => a.type === "RECOMMENDATION")).toBe(true);
  });

  it("SAFE_AUTOPILOT includes checklist ensure + recommendation", () => {
    const d = evaluateCoownershipComplianceRule({
      listing: condo,
      mode: "SAFE_AUTOPILOT",
      certificateComplete: false,
      insuranceGateComplete: false,
      criticalComplianceComplete: false,
    });
    expect(d?.actions.some((a) => a.type === "CHECKLIST_ENSURE")).toBe(true);
    expect(d?.actions.some((a) => a.type === "RECOMMENDATION")).toBe(true);
    expect(d?.actions.some((a) => a.type === "BLOCK_ACTION")).toBe(false);
  });

  it("FULL_AUTOPILOT_APPROVAL adds block when certificate incomplete", () => {
    const d = evaluateCoownershipComplianceRule({
      listing: condo,
      mode: "FULL_AUTOPILOT_APPROVAL",
      certificateComplete: false,
      insuranceGateComplete: true,
      criticalComplianceComplete: false,
    });
    expect(d?.severity).toBe("critical");
    expect(d?.actions.some((a) => a.type === "BLOCK_ACTION")).toBe(true);
  });

  it("FULL_AUTOPILOT_APPROVAL omits block when certificate complete", () => {
    const d = evaluateCoownershipComplianceRule({
      listing: condo,
      mode: "FULL_AUTOPILOT_APPROVAL",
      certificateComplete: true,
      insuranceGateComplete: true,
    });
    expect(d?.severity).toBe("warning");
    expect(d?.actions.some((a) => a.type === "BLOCK_ACTION")).toBe(false);
  });

  it("FULL_AUTOPILOT_APPROVAL does not block on insurance gate when FEATURE_COOWNERSHIP_INSURANCE_ENFORCEMENT is off", () => {
    const d = evaluateCoownershipComplianceRule({
      listing: condo,
      mode: "FULL_AUTOPILOT_APPROVAL",
      certificateComplete: true,
      insuranceGateComplete: false,
    });
    expect(d?.severity).toBe("warning");
    expect(d?.actions.some((a) => a.type === "BLOCK_ACTION")).toBe(false);
  });

  it("ignores non-condo house", () => {
    expect(
      evaluateCoownershipComplianceRule({
        listing: house,
        mode: "SAFE_AUTOPILOT",
        certificateComplete: false,
        insuranceGateComplete: false,
        criticalComplianceComplete: false,
      }),
    ).toBeNull();
  });
});
