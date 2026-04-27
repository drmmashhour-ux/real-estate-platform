import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ui/auditHeuristics", () => ({
  runUIAudit: vi.fn(),
}));
vi.mock("@/lib/growth/earlyUserSignals", () => ({
  getEarlyUserSignals: vi.fn(),
}));
vi.mock("@/lib/growth/acquisitionInsights", () => ({
  getAcquisitionInsights: vi.fn(),
}));

describe("isLaunchReady (Order 52.1)", () => {

  it("ready when score≥80, early>10, and signups exist", async () => {
    const { runUIAudit } = await import("@/lib/ui/auditHeuristics");
    const { getEarlyUserSignals } = await import("@/lib/growth/earlyUserSignals");
    const { getAcquisitionInsights } = await import("@/lib/growth/acquisitionInsights");
    const { isLaunchReady } = await import("@/lib/launch/readiness");

    vi.mocked(runUIAudit).mockResolvedValue({ score: 90, passed: [], failed: [] });
    vi.mocked(getEarlyUserSignals).mockResolvedValue({
      count: 12,
      remaining: 88,
      isEarlyPhase: true,
      message: "x",
    });
    vi.mocked(getAcquisitionInsights).mockResolvedValue({
      channels: [],
      topChannel: "tiktok",
      totalUsers: 2,
      attributedUsers: 1,
      notes: [],
    } as never);

    const r = await isLaunchReady();
    expect(r.ready).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it("not ready if UI below 80", async () => {
    const { runUIAudit } = await import("@/lib/ui/auditHeuristics");
    const { getEarlyUserSignals } = await import("@/lib/growth/earlyUserSignals");
    const { getAcquisitionInsights } = await import("@/lib/growth/acquisitionInsights");
    const { isLaunchReady } = await import("@/lib/launch/readiness");

    vi.mocked(runUIAudit).mockResolvedValue({ score: 40, passed: [], failed: [] });
    vi.mocked(getEarlyUserSignals).mockResolvedValue({
      count: 20,
      remaining: 80,
      isEarlyPhase: true,
      message: "",
    });
    vi.mocked(getAcquisitionInsights).mockResolvedValue({
      channels: [],
      topChannel: null,
      totalUsers: 5,
      attributedUsers: 0,
      notes: [],
    } as never);

    const r = await isLaunchReady();
    expect(r.ready).toBe(false);
    expect(r.reasons.some((x) => x.includes("80"))).toBe(true);
  });
});
