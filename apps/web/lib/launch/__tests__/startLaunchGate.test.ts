import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/flags", () => ({
  flags: { AUTONOMOUS_AGENT: true },
}));
vi.mock("@/lib/launch/readiness", () => ({
  isLaunchReady: vi.fn(),
}));
vi.mock("@/lib/launch/readinessAudit", () => ({
  runLaunchAudit: vi.fn(),
}));
/** Prevent Prisma from module-level `getLegacyDB` in `acquisitionInsights` / `readiness` imports. */
vi.mock("@/lib/growth/acquisitionInsights", () => ({
  getAcquisitionInsights: vi.fn(),
}));
vi.mock("@/lib/growth/earlyUserSignals", () => ({
  getEarlyUserSignals: vi.fn(),
  buildEarlyUserSignalsFromCount: vi.fn(),
}));
vi.mock("@/lib/ui/auditHeuristics", () => ({ runUIAudit: vi.fn() }));
vi.mock("@/lib/db/legacy", () => {
  return {
    getLegacyDB: () => ({
      launchState: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn(),
      },
    }),
  };
});
vi.mock("@/src/services/analytics", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("startLaunch gate (Order 52.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks with not_ready when isLaunchReady is false", async () => {
    const { isLaunchReady } = await import("@/lib/launch/readiness");
    const { runLaunchAudit } = await import("@/lib/launch/readinessAudit");
    const { startLaunch } = await import("@/lib/launch/controller");

    vi.mocked(runLaunchAudit).mockResolvedValue({
      score: 100,
      criticalPass: true,
      items: [],
    });
    vi.mocked(isLaunchReady).mockResolvedValue({
      ready: false,
      reasons: ["x"],
      details: { uiScore: 10, earlyUserCount: 0, hasAcquisitionData: false, nonVisitorSignups: 0 },
    });

    const r = await startLaunch();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("not_ready");
      expect("reasons" in r && r.reasons).toBeDefined();
    }
  });

  it("blocks with not_ready when runLaunchAudit criticalPass is false", async () => {
    const { runLaunchAudit } = await import("@/lib/launch/readinessAudit");
    const { isLaunchReady } = await import("@/lib/launch/readiness");
    const { startLaunch } = await import("@/lib/launch/controller");

    vi.mocked(runLaunchAudit).mockResolvedValue({
      score: 30,
      criticalPass: false,
      items: [
        {
          id: "exclusion_constraint",
          label: "EXCLUDE constraint (no_overlap_booking)",
          status: "fail",
          details: "not found",
        },
      ],
    });
    vi.mocked(isLaunchReady).mockResolvedValue({
      ready: true,
      reasons: [],
      details: { uiScore: 90, earlyUserCount: 20, hasAcquisitionData: true, nonVisitorSignups: 2 },
    });

    const r = await startLaunch();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("not_ready");
      expect("reasons" in r && Array.isArray(r.reasons) && r.reasons.length).toBeGreaterThan(0);
    }
  });

  it("allows launch when critical audit passes and isLaunchReady is true", async () => {
    const { runLaunchAudit } = await import("@/lib/launch/readinessAudit");
    const { isLaunchReady } = await import("@/lib/launch/readiness");
    const { startLaunch } = await import("@/lib/launch/controller");

    vi.mocked(runLaunchAudit).mockResolvedValue({
      score: 100,
      criticalPass: true,
      items: [],
    });
    vi.mocked(isLaunchReady).mockResolvedValue({
      ready: true,
      reasons: [],
      details: { uiScore: 90, earlyUserCount: 20, hasAcquisitionData: true, nonVisitorSignups: 2 },
    });

    const r = await startLaunch();
    expect(r.ok).toBe(true);
  });
});
