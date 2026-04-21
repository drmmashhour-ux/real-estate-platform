import { describe, expect, it } from "vitest";
import { evaluatePlaybookEligibility } from "../services/playbook-memory-policy-gate.service";

describe("playbook-memory-policy-gate", () => {
  it("blocks paused playbook", () => {
    const r = evaluatePlaybookEligibility({
      playbook: {
        status: "PAUSED",
        executionMode: "RECOMMEND_ONLY",
        domain: "PRICING",
      },
      context: { domain: "PRICING", entityType: "listing" },
    });
    expect(r.allowed).toBe(false);
    expect(r.blockedReasons.some((x) => x.toLowerCase().includes("paused"))).toBe(true);
  });

  it("blocks critical policy snapshot", () => {
    const r = evaluatePlaybookEligibility({
      playbook: {
        status: "ACTIVE",
        executionMode: "SAFE_AUTOPILOT",
        domain: "PRICING",
      },
      context: { domain: "PRICING", entityType: "listing" },
      policySnapshot: { severity: "critical" },
    });
    expect(r.allowed).toBe(false);
  });

  it("allows clean active playbook", () => {
    const r = evaluatePlaybookEligibility({
      playbook: {
        status: "ACTIVE",
        executionMode: "RECOMMEND_ONLY",
        domain: "PRICING",
      },
      context: { domain: "PRICING", entityType: "listing" },
    });
    expect(r.allowed).toBe(true);
  });
});
