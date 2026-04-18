import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProposedAction } from "../ai-autopilot.types";
import {
  validateV8PrimaryProposals,
  shouldFallbackV8PrimaryOnQuality,
  buildAdsAutopilotProposalsWithV8Routing,
} from "./ads-automation-loop.autopilot.adapter.v8-primary-routing";
import { buildAdsAutopilotComparisonMetrics } from "./ads-automation-loop.autopilot.adapter.influence";
import {
  getAdsAutopilotV8MonitoringSnapshot,
  resetAdsAutopilotV8MonitoringForTests,
} from "./ads-automation-loop.autopilot.adapter.monitoring";

const buildLegacy = vi.fn(async (): Promise<ProposedAction[]> => []);
const buildV8 = vi.fn(async (): Promise<ProposedAction[]> => []);
const scheduleFromResults = vi.fn();

const { adsAutopilotShadowModeV1 } = vi.hoisted(() => ({
  adsAutopilotShadowModeV1: { current: false as boolean },
}));

vi.mock("@/config/feature-flags", () => ({
  adsAiAutomationFlags: {
    get adsAutopilotShadowModeV1() {
      return adsAutopilotShadowModeV1.current;
    },
  },
}));

vi.mock("./ads-automation-loop.autopilot.adapter.helpers", () => ({
  buildProposedActionsAdsAutomationLoop: () => buildLegacy(),
}));

vi.mock("./ads-automation-loop.autopilot.adapter.shadow", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./ads-automation-loop.autopilot.adapter.shadow")>();
  return {
    ...mod,
    buildV8PrimaryProposedActionsAdsAutomationLoop: () => buildV8(),
    scheduleAdsAutopilotShadowObservationFromResults: (input: unknown) => scheduleFromResults(input),
  };
});

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

describe("validateV8PrimaryProposals", () => {
  it("rejects non-array and oversized arrays", () => {
    expect(validateV8PrimaryProposals(null).ok).toBe(false);
    expect(validateV8PrimaryProposals(Array.from({ length: 281 }, () => ({}))).ok).toBe(false);
  });

  it("requires actionType and entityType", () => {
    expect(validateV8PrimaryProposals([{ actionType: "", entityType: "x" }]).ok).toBe(false);
    expect(
      validateV8PrimaryProposals([
        { actionType: "a", entityType: "listing", entityId: "1", reasons: { confidence: NaN } },
      ]).ok,
    ).toBe(false);
  });

  it("accepts a minimal valid row", () => {
    expect(
      validateV8PrimaryProposals([
        { actionType: "boost", entityType: "campaign", reasons: { confidence: 0.5 } },
      ]).ok,
    ).toBe(true);
  });
});

describe("shouldFallbackV8PrimaryOnQuality", () => {
  it("flags low overlap with large drift", () => {
    const m = buildAdsAutopilotComparisonMetrics([], [], {
      onlyInLive: Array.from({ length: 11 }, (_, i) => `k${i}`),
      onlyInShadow: Array.from({ length: 11 }, (_, i) => `s${i}`),
      confidencePairs: [],
      aligned: false,
    });
    const r = shouldFallbackV8PrimaryOnQuality(m);
    expect(r.fallback).toBe(true);
    expect(r.reason).toBe("quality_guard_low_overlap_large_drifts");
  });
});

describe("buildAdsAutopilotProposalsWithV8Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAdsAutopilotV8MonitoringForTests();
    adsAutopilotShadowModeV1.current = false;
    buildLegacy.mockResolvedValue([]);
    buildV8.mockResolvedValue([]);
  });

  const valid = (id: string): ProposedAction =>
    ({
      actionType: "t",
      entityType: "listing",
      entityId: id,
      reasons: { confidence: 0.5 },
    }) as ProposedAction;

  it("returns V8 when valid and quality passes", async () => {
    const v8Out = [valid("a")];
    const leg = [valid("a")];
    buildV8.mockResolvedValue(v8Out);
    buildLegacy.mockResolvedValue(leg);
    const out = await buildAdsAutopilotProposalsWithV8Routing("u1");
    expect(out).toBe(v8Out);
  });

  it("falls back to legacy when V8 throws", async () => {
    const leg = [valid("x")];
    buildLegacy.mockResolvedValue(leg);
    buildV8.mockRejectedValue(new Error("boom"));
    const out = await buildAdsAutopilotProposalsWithV8Routing("u2");
    expect(out).toBe(leg);
  });

  it("falls back when V8 structurally invalid", async () => {
    const leg = [valid("x")];
    buildLegacy.mockResolvedValue(leg);
    buildV8.mockResolvedValue([{ actionType: "x" }] as ProposedAction[]);
    const out = await buildAdsAutopilotProposalsWithV8Routing("u3");
    expect(out).toBe(leg);
  });

  it("falls back when V8 empty but legacy has items", async () => {
    buildV8.mockResolvedValue([]);
    buildLegacy.mockResolvedValue([valid("only-legacy")]);
    const out = await buildAdsAutopilotProposalsWithV8Routing("u4");
    expect(out).toEqual([valid("only-legacy")]);
  });

  it("falls back on quality guardrails (divergent sets)", async () => {
    const live = Array.from({ length: 11 }, (_, i) => valid(`L${i}`));
    const shadow = Array.from({ length: 11 }, (_, i) => valid(`S${i}`));
    buildLegacy.mockResolvedValue(live);
    buildV8.mockResolvedValue(shadow);
    const out = await buildAdsAutopilotProposalsWithV8Routing("u5");
    expect(out).toBe(live);
  });

  it("schedules shadow observation when shadow mode on and primary succeeds", async () => {
    adsAutopilotShadowModeV1.current = true;
    const v8Out = [valid("a")];
    const leg = [valid("a")];
    buildV8.mockResolvedValue(v8Out);
    buildLegacy.mockResolvedValue(leg);
    await buildAdsAutopilotProposalsWithV8Routing("u6");
    expect(scheduleFromResults).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u6", live: leg, shadow: v8Out }),
    );
  });

  it("records monitoring on success and fallback", async () => {
    buildV8.mockResolvedValue([valid("a")]);
    buildLegacy.mockResolvedValue([valid("a")]);
    await buildAdsAutopilotProposalsWithV8Routing("ok");
    expect(getAdsAutopilotV8MonitoringSnapshot().v8PrimarySuccessCount).toBe(1);

    resetAdsAutopilotV8MonitoringForTests();
    buildV8.mockRejectedValue(new Error("x"));
    buildLegacy.mockResolvedValue([valid("b")]);
    await buildAdsAutopilotProposalsWithV8Routing("fb");
    expect(getAdsAutopilotV8MonitoringSnapshot().v8PrimaryFallbackCount).toBe(1);
  });
});
