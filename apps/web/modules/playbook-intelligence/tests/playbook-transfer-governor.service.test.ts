import { describe, expect, it } from "vitest";
import { evaluateTransferEligibility } from "../services/playbook-transfer-governor.service";

describe("evaluateTransferEligibility", () => {
  it("same-domain: allowed, zero penalty, compatibility 1", () => {
    const r = evaluateTransferEligibility({ source: "LISTINGS", target: "LISTINGS" });
    expect(r.allowed).toBe(true);
    expect(r.transferPenalty).toBe(0);
    expect(r.compatibilityScore).toBe(1);
  });
  it("DREAM_HOME <-> LISTINGS: allowed, positive compatibility", () => {
    const a = evaluateTransferEligibility({ source: "DREAM_HOME", target: "LISTINGS" });
    const b = evaluateTransferEligibility({ source: "LISTINGS", target: "DREAM_HOME" });
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(a.compatibilityScore).toBeGreaterThan(0.5);
  });
  it("GROWTH -> LEADS: allowed", () => {
    const r = evaluateTransferEligibility({ source: "GROWTH", target: "LEADS" });
    expect(r.allowed).toBe(true);
  });
  it("LEADS -> BROKER_ROUTING: allowed", () => {
    const r = evaluateTransferEligibility({ source: "LEADS", target: "BROKER_ROUTING" });
    expect(r.allowed).toBe(true);
  });
  it("messaging to listings: not allowed (no protected-trait logic; domain safety)", () => {
    const r = evaluateTransferEligibility({ source: "MESSAGING", target: "LISTINGS" });
    expect(r.allowed).toBe(false);
  });
});
