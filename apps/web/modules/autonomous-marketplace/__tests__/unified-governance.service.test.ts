import { describe, expect, it, vi } from "vitest";

vi.mock("../config/autonomy.config", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../config/autonomy.config")>();
  return {
    autonomyConfig: {
      ...mod.autonomyConfig,
      governanceAutoExecuteEnabled: true,
    },
  };
});

import { evaluateUnifiedGovernance } from "../governance/unified-governance.service";

describe("evaluateUnifiedGovernance", () => {
  it("Syria adapter disabled blocks in preview", async () => {
    const r = await evaluateUnifiedGovernance({
      mode: "preview",
      regionCode: "SY",
      listingId: "lst",
      featureFlags: { syriaAdapterDisabled: true },
      signals: [],
      metadata: { listingSource: "syria" },
    });
    expect(r.disposition).toBe("BLOCKED_FOR_REGION");
    expect(r.blocked).toBe(true);
  });

  it("Syria adapter disabled rejects execution", async () => {
    const r = await evaluateUnifiedGovernance({
      mode: "execution",
      regionCode: "SY",
      listingId: "lst",
      featureFlags: { syriaAdapterDisabled: true },
      signals: [],
      metadata: { listingSource: "syria" },
    });
    expect(r.disposition).toBe("REJECTED");
    expect(r.blocked).toBe(true);
  });

  it("fraud stress can reject execution when fraud blocks", async () => {
    const exec = await evaluateUnifiedGovernance({
      mode: "execution",
      regionCode: "US",
      fraudFlag: true,
      signals: [{ type: "chargeback_spike", severity: "critical" }],
      revenueFacts: { grossBookingValue30d: 50000, chargebacks30d: 8000 },
    });
    expect(exec.disposition).toBe("REJECTED");
    expect(exec.fraudRisk.requiresBlock || exec.legalRisk.requiresBlock).toBe(true);
  });

  it("mild payout anomaly yields caution preview / dry run", async () => {
    const stressSignals = [
      { type: "payout_anomaly", severity: "warning" as const },
      { type: "auxiliary_signal_a", severity: "warning" as const },
      { type: "auxiliary_signal_b", severity: "warning" as const },
    ];
    const prev = await evaluateUnifiedGovernance({
      mode: "preview",
      regionCode: "US",
      signals: stressSignals,
      revenueFacts: { grossBookingValue30d: 50000, refunds30d: 1000 },
    });
    expect(prev.combinedRisk.score).toBeGreaterThanOrEqual(25);
    expect(["CAUTION_PREVIEW", "REQUIRES_LOCAL_APPROVAL"]).toContain(prev.disposition);

    const exec = await evaluateUnifiedGovernance({
      mode: "execution",
      regionCode: "US",
      signals: stressSignals,
      revenueFacts: { grossBookingValue30d: 50000, refunds30d: 1000 },
    });
    expect(["DRY_RUN", "REQUIRE_APPROVAL"]).toContain(exec.disposition);
  });

  it("medium combined risk maps to caution / dry run", async () => {
    const prev = await evaluateUnifiedGovernance({
      mode: "preview",
      regionCode: "US",
      fraudFlag: false,
      signals: [
        { type: "synthetic_action_risk_high", severity: "warning" },
        { type: "refund_spike", severity: "warning" },
      ],
      revenueFacts: {
        grossBookingValue30d: 100000,
        refunds30d: 12000,
        chargebacks30d: 2500,
      },
    });
    expect(prev.combinedRisk.score).toBeGreaterThanOrEqual(25);
    expect(prev.combinedRisk.score).toBeLessThan(75);
    expect(["CAUTION_PREVIEW", "REQUIRES_LOCAL_APPROVAL"]).toContain(prev.disposition);

    const exec = await evaluateUnifiedGovernance({
      mode: "execution",
      regionCode: "US",
      fraudFlag: false,
      signals: [
        { type: "synthetic_action_risk_high", severity: "warning" },
        { type: "refund_spike", severity: "warning" },
      ],
      revenueFacts: {
        grossBookingValue30d: 100000,
        refunds30d: 12000,
        chargebacks30d: 2500,
      },
    });
    expect(["DRY_RUN", "REQUIRE_APPROVAL"]).toContain(exec.disposition);
  });

  it("low risk allows preview / recommend only", async () => {
    const prev = await evaluateUnifiedGovernance({
      mode: "preview",
      regionCode: "US",
      signals: [],
    });
    expect(prev.disposition).toBe("ALLOW_PREVIEW");

    const exec = await evaluateUnifiedGovernance({
      mode: "execution",
      regionCode: "US",
      signals: [],
      featureFlags: { AUTONOMY_GOVERNANCE_AUTO_EXECUTE: true },
    });
    expect(exec.disposition).toBe("AUTO_EXECUTE");
    expect(exec.allowExecution).toBe(true);
  });

  it("AUTO_EXECUTE requires flag and constraints (Syria never auto)", async () => {
    const sy = await evaluateUnifiedGovernance({
      mode: "execution",
      regionCode: "SY",
      signals: [],
      metadata: { listingSource: "syria" },
      featureFlags: {
        syriaAdapterDisabled: false,
        AUTONOMY_GOVERNANCE_AUTO_EXECUTE: true,
      },
    });
    expect(sy.disposition).not.toBe("AUTO_EXECUTE");
  });

  it("safe fallback when hybrid ML adapter throws", async () => {
    vi.resetModules();
    vi.doMock("../governance/hybrid-risk-adapter.service", () => ({
      getHybridMlRiskScore: vi.fn(async () => {
        throw new Error("simulated ml failure");
      }),
    }));
    const { evaluateUnifiedGovernance: ev } = await import("../governance/unified-governance.service");
    const r = await ev({ mode: "execution", regionCode: "US" });
    expect(r.trace.some((t) => t.ruleId === "fallback")).toBe(true);
    expect(r.disposition).toBe("DRY_RUN");
  });
});
