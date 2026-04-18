import { beforeEach, describe, expect, it, vi } from "vitest";

const flags = vi.hoisted(() => ({
  companyMode: false,
  strategy: true,
  execution: false,
  content: false,
  killSwitch: false,
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const a = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...a,
    autonomousCompanyFlags: {
      get autonomousCompanyModeV1() {
        return flags.companyMode;
      },
      get autonomousStrategyV1() {
        return flags.strategy;
      },
      get autonomousExecutionV1() {
        return flags.execution;
      },
      get autonomousContentV1() {
        return flags.content;
      },
    },
    getAutonomousCompanyModeTier: (): "off" | "shadow" | "assist" | "safe_autopilot" => "shadow",
    isAutonomousCompanyKillSwitch: () => flags.killSwitch,
  };
});

vi.mock("@/modules/fusion/fusion-system.primary-surface", () => ({
  buildFusionPrimarySurface: vi.fn().mockResolvedValue({
    snapshot: {
      scores: { agreementScore: 0.8 },
      conflicts: [{ id: "c1" }],
    },
    observability: { sourceCoverageSummary: "2/4" },
  }),
}));

vi.mock("@/services/growth/cro-v8-optimization-bridge", () => ({
  runCroV8OptimizationBundle: vi.fn().mockResolvedValue({ healthScore: 72 }),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

import { runAutonomousCompanyCycle, resetAutonomousCompanySessionForTests } from "./autonomous-company.service";

describe("autonomous-company.service", () => {
  beforeEach(() => {
    resetAutonomousCompanySessionForTests();
    flags.companyMode = false;
    flags.strategy = true;
    flags.execution = false;
    flags.content = false;
    flags.killSwitch = false;
  });

  it("returns null when master flag off", async () => {
    const r = await runAutonomousCompanyCycle({ environment: "development" });
    expect(r).toBeNull();
  });

  it("runs a cycle when master flag on", async () => {
    flags.companyMode = true;
    const r = await runAutonomousCompanyCycle({ environment: "development" });
    expect(r).not.toBeNull();
    expect(r!.opportunities).not.toBeNull();
    expect(r!.decisions).not.toBeNull();
    expect(r!.observability.cyclesSession).toBe(1);
  });

  it("returns kill-switch shell without heavy phases", async () => {
    flags.companyMode = true;
    flags.killSwitch = true;
    const r = await runAutonomousCompanyCycle({ environment: "development" });
    expect(r!.mode).toBe("off");
    expect(r!.opportunities?.ranked.length).toBe(0);
  });
});
