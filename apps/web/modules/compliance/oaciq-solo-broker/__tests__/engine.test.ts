import { describe, expect, it } from "vitest";

import {
  evaluateBrokerOnlyGate,
  evaluateLicenceAccessGate,
  evaluateVerificationSoftGate,
  isBrokerOnlyAction,
} from "../engine";

describe("oaciq solo-broker engine", () => {
  it("blocks broker-only actions for non-brokers", () => {
    const r = evaluateBrokerOnlyGate({
      action: "draft_offer",
      isLicensedBroker: false,
      actsWithinLicenceScope: true,
    });
    expect(r.decision).toBe("blocked");
    if (r.decision === "blocked") expect(r.reasonCode).toBe("NON_BROKER_BROKER_ONLY_ACTION");
  });

  it("allows broker-only actions for licensed in-scope broker", () => {
    const r = evaluateBrokerOnlyGate({
      action: "negotiate",
      isLicensedBroker: true,
      actsWithinLicenceScope: true,
    });
    expect(r.decision).toBe("allowed");
  });

  it("blocks invalid licence gate", () => {
    const r = evaluateLicenceAccessGate({ licenceRecordValid: false });
    expect(r.decision).toBe("blocked");
  });

  it("recognizes broker-only action ids", () => {
    expect(isBrokerOnlyAction("advise")).toBe(true);
    expect(isBrokerOnlyAction("book_showing")).toBe(false);
  });

  it("warns when verification elements missing", () => {
    const r = evaluateVerificationSoftGate({
      identityVerified: false,
      integrityCleared: true,
      competenceAcknowledged: true,
    });
    expect(r.decision).toBe("warning");
  });
});
