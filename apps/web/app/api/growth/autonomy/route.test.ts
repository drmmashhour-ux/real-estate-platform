import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const autonomyFlags = vi.hoisted(() => ({ v1: true, kill: false }));
const enfFlag = vi.hoisted(() => ({ on: true }));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    growthAutonomyFlags: {
      get growthAutonomyV1() {
        return autonomyFlags.v1;
      },
      get growthAutonomyPanelV1() {
        return true;
      },
      get growthAutonomyKillSwitch() {
        return autonomyFlags.kill;
      },
    },
    growthPolicyEnforcementFlags: {
      ...a.growthPolicyEnforcementFlags,
      get growthPolicyEnforcementV1() {
        return enfFlag.on;
      },
    },
  };
});

type PR = import("@prisma/client").PlatformRole;

const actor = vi.hoisted(() => ({
  userId: "u1",
  role: "ADMIN" as PR,
}));

vi.mock("@/modules/growth-machine/growth-api-context", () => ({
  requireGrowthMachineActor: vi.fn(() =>
    Promise.resolve({ ok: true as const, userId: actor.userId, role: actor.role }),
  ),
}));

vi.mock("@/modules/growth/growth-autonomy.service", () => ({
  buildGrowthAutonomySnapshot: vi.fn(() =>
    Promise.resolve({
      autonomyLayerEnabled: true,
      autonomyMode: "ASSIST",
      rolloutStage: "partial",
      killSwitchActive: false,
      enforcementSnapshotPresent: true,
      enforcementLayerFlagOn: true,
      enforcementInputPartial: false,
      suggestions: [],
      counts: { surfaced: 0, blocked: 0, approvalRequired: 0, hidden: 0, prefilled: 0 },
      operatorNotes: [],
      scopeExclusions: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    }),
  ),
}));

vi.mock("@/modules/growth/growth-autonomy-monitoring.service", () => ({
  getGrowthAutonomyMonitoringSnapshot: vi.fn(() => ({
    snapshotsBuilt: 1,
    suggestionsSurfaced: 0,
    suggestionsBlocked: 0,
    approvalRequiredOutcomes: 0,
    partialSnapshotCases: 0,
    hiddenByMode: 0,
    autonomyApiReads: 2,
    prefillTelemetryEvents: 0,
    validationChecklistCompletions: 0,
    validationTelemetryEvents: 0,
  })),
  recordGrowthAutonomyApiRead: vi.fn(),
}));

const rolloutStage = vi.hoisted(() => ({
  stage: "partial" as "off" | "internal" | "partial" | "full",
}));

vi.mock("@/modules/growth/growth-autonomy-config", () => ({
  parseGrowthAutonomyRolloutFromEnv: vi.fn(() => rolloutStage.stage),
}));

describe("GET /api/growth/autonomy", () => {
  beforeEach(() => {
    autonomyFlags.v1 = true;
    autonomyFlags.kill = false;
    enfFlag.on = true;
    actor.userId = "u1";
    actor.role = "ADMIN" as PR;
    rolloutStage.stage = "partial";
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns snapshot when autonomy is enabled", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/growth/autonomy?locale=en&country=ca"));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { snapshot?: { autonomyMode: string } };
    expect(j.snapshot?.autonomyMode).toBe("ASSIST");
  });

  it("returns disabled payload when autonomy flag off", async () => {
    autonomyFlags.v1 = false;
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/growth/autonomy"));
    const j = (await res.json()) as { autonomyLayerEnabled: boolean; snapshot: null };
    expect(j.autonomyLayerEnabled).toBe(false);
    expect(j.snapshot).toBeNull();
  });

  it("includes rolloutStatus with enforcement availability", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/growth/autonomy"));
    const j = (await res.json()) as { rolloutStatus?: { enforcementAvailable: boolean } };
    expect(j.rolloutStatus?.enforcementAvailable).toBe(true);
  });

  it("blocks internal rollout for non-admin in production without pilot access", async () => {
    vi.stubEnv("NODE_ENV", "production");
    actor.role = "USER" as PR;
    actor.userId = "non-pilot-user";
    rolloutStage.stage = "internal";
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/growth/autonomy"));
    const j = (await res.json()) as { internalGateBlocked?: boolean; rolloutStatus?: { internalGateBlocked: boolean } };
    expect(j.internalGateBlocked).toBe(true);
    expect(j.rolloutStatus?.internalGateBlocked).toBe(true);
  });

});
