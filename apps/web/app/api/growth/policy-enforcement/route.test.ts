import { describe, it, expect, vi, beforeEach } from "vitest";

const policyEnforcementFlags = vi.hoisted(() => ({ v1: false, panel: true }));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    growthPolicyEnforcementFlags: {
      get growthPolicyEnforcementV1() {
        return policyEnforcementFlags.v1;
      },
      get growthPolicyEnforcementPanelV1() {
        return policyEnforcementFlags.panel;
      },
    },
  };
});

vi.mock("@/modules/growth-machine/growth-api-context", () => ({
  requireGrowthMachineActor: vi.fn(() => Promise.resolve({ ok: true as const, userId: "u1", role: "ADMIN" })),
}));

const buildSnapshot = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      rules: [],
      blockedTargets: [],
      frozenTargets: [],
      approvalRequiredTargets: [],
      notes: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      inputCompleteness: "complete" as const,
      missingDataWarnings: [] as string[],
    }),
  ),
);

vi.mock("@/modules/growth/growth-policy-enforcement.service", () => ({
  buildGrowthPolicyEnforcementSnapshot: buildSnapshot,
}));

vi.mock("@/modules/growth/growth-policy-enforcement-monitoring.service", () => ({
  getGrowthPolicyEnforcementMonitoringSnapshot: vi.fn(() => ({
    enforcementBuilds: 2,
    blockedTargetsCount: 0,
    frozenTargetsCount: 1,
    approvalRequiredTargetsCount: 0,
    advisoryOnlyTargetsCount: 3,
    gatedUiActionsCount: 2,
    missingDataWarnings: 1,
  })),
}));

describe("GET /api/growth/policy-enforcement", () => {
  beforeEach(() => {
    policyEnforcementFlags.v1 = false;
    policyEnforcementFlags.panel = true;
    buildSnapshot.mockImplementation(() =>
      Promise.resolve({
        rules: [],
        blockedTargets: [],
        frozenTargets: [],
        approvalRequiredTargets: [],
        notes: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        inputCompleteness: "complete",
        missingDataWarnings: [],
      }),
    );
  });

  it("returns 200 structured body when enforcement flag is off (not 403)", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/growth/policy-enforcement"));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { enforcementLayerEnabled: boolean; snapshot: null; operatorMessage: string };
    expect(j.enforcementLayerEnabled).toBe(false);
    expect(j.snapshot).toBeNull();
    expect(j.operatorMessage.length).toBeGreaterThan(10);
    expect(buildSnapshot).not.toHaveBeenCalled();
  });

  it("returns snapshot when enforcement flag is on", async () => {
    policyEnforcementFlags.v1 = true;
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/growth/policy-enforcement"));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { enforcementLayerEnabled: boolean; snapshot: { createdAt: string } };
    expect(j.enforcementLayerEnabled).toBe(true);
    expect(j.snapshot.createdAt).toBeDefined();
    expect(buildSnapshot).toHaveBeenCalled();
  });

  it("includes operational monitoring when growthPolicyDebug=1", async () => {
    policyEnforcementFlags.v1 = true;
    buildSnapshot.mockResolvedValue({
      rules: [],
      blockedTargets: [],
      frozenTargets: [],
      approvalRequiredTargets: [],
      notes: ["n1"],
      createdAt: "2026-01-01T00:00:00.000Z",
      inputCompleteness: "partial",
      missingDataWarnings: ["x"],
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/growth/policy-enforcement?growthPolicyDebug=1"));
    const j = (await res.json()) as {
      operationalMonitoring?: { enforcementBuilds: number };
      debug?: { warningsCount: number };
    };
    expect(j.operationalMonitoring?.enforcementBuilds).toBe(2);
    expect(j.debug?.warningsCount).toBe(1);
  });

  it("named panel flag is echoed when layer is disabled", async () => {
    policyEnforcementFlags.panel = false;
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/growth/policy-enforcement"));
    const j = (await res.json()) as { enforcementPanelFlagEnabled: boolean };
    expect(j.enforcementPanelFlagEnabled).toBe(false);
  });
});
