import { describe, expect, it } from "vitest";
import { canBrokerOrAdminAccessLead } from "./can-access-lead";

describe("canBrokerOrAdminAccessLead", () => {
  const foreignLead = {
    introducedByBrokerId: "broker-a",
    lastFollowUpByBrokerId: null as string | null,
    leadSource: "organic" as string | null,
  };

  it("allows admin regardless of assignment", () => {
    expect(canBrokerOrAdminAccessLead("ADMIN", "any", foreignLead)).toBe(true);
  });

  it("denies broker who did not introduce or follow up (non-shared source)", () => {
    expect(canBrokerOrAdminAccessLead("BROKER", "broker-b", foreignLead)).toBe(false);
  });

  it("allows introducing broker", () => {
    expect(canBrokerOrAdminAccessLead("BROKER", "broker-a", foreignLead)).toBe(true);
  });

  it("allows last follow-up broker", () => {
    const lead = { ...foreignLead, introducedByBrokerId: null, lastFollowUpByBrokerId: "broker-c" };
    expect(canBrokerOrAdminAccessLead("BROKER", "broker-c", lead)).toBe(true);
  });

  it("allows shared evaluation / consultation leads for any broker", () => {
    const evalLead = { ...foreignLead, leadSource: "evaluation_lead" };
    expect(canBrokerOrAdminAccessLead("BROKER", "broker-b", evalLead)).toBe(true);
    const consult = { ...foreignLead, leadSource: "broker_consultation" };
    expect(canBrokerOrAdminAccessLead("BROKER", "broker-b", consult)).toBe(true);
  });

  it("denies non-broker non-admin", () => {
    expect(canBrokerOrAdminAccessLead("USER", "u1", foreignLead)).toBe(false);
  });
});
