import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ProposedAction } from "../ai-autopilot.types";

const buildLive = vi.fn(async (): Promise<ProposedAction[]> => []);
const scheduleFromPromise = vi.fn();
const scheduleFromResults = vi.fn();
const buildShadow = vi.fn(async (): Promise<ProposedAction[]> => []);
const buildV8Primary = vi.fn(async (): Promise<ProposedAction[]> => []);

vi.mock("@/config/feature-flags", () => ({
  adsAiAutomationFlags: {
    adsAutopilotV8RolloutV1: false,
    adsAutopilotShadowModeV1: false,
    adsAutopilotV8InfluenceV1: false,
    adsAutopilotV8PrimaryV1: false,
  },
}));

vi.mock("./ads-automation-loop.autopilot.adapter.helpers", () => ({
  buildProposedActionsAdsAutomationLoop: () => buildLive(),
}));

vi.mock("./ads-automation-loop.autopilot.adapter.shadow", () => ({
  buildShadowProposedActionsAdsAutomationLoop: () => buildShadow(),
  buildV8PrimaryProposedActionsAdsAutomationLoop: () => buildV8Primary(),
  compareAdsAutopilotProposalSets: vi.fn(() => ({
    onlyInLive: [],
    onlyInShadow: [],
    confidencePairs: [],
    aligned: true,
  })),
  scheduleAdsAutopilotShadowObservation: (input: { userId: string; livePromise: Promise<ProposedAction[]> }) => {
    scheduleFromPromise(input);
  },
  scheduleAdsAutopilotShadowObservationFromResults: (input: unknown) => {
    scheduleFromResults(input);
  },
}));

vi.mock("./ads-v8-influence-overlay.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./ads-v8-influence-overlay.service")>();
  return {
    ...actual,
    applyAdsV8InfluenceOverlay: vi.fn((input: { liveActions: ProposedAction[] }) => ({
      influencedActions: input.liveActions,
      metadata: {
        applied: false,
        adjustments: [] as { key: string; kind: string; detail: string }[],
        skipped: true,
        reason: "test_default_skip",
      },
    })),
  };
});

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

import { adsAiAutomationFlags } from "@/config/feature-flags";
import { applyAdsV8InfluenceOverlay } from "./ads-v8-influence-overlay.service";
import { proposalsAdsAutomationLoop } from "./ads-automation-loop.autopilot.adapter";
import { resetAdsAutopilotV8MonitoringForTests } from "./ads-automation-loop.autopilot.adapter.monitoring";

describe("proposalsAdsAutomationLoop V8 monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAdsAutopilotV8MonitoringForTests();
    buildLive.mockResolvedValue([]);
    buildShadow.mockResolvedValue([]);
    (adsAiAutomationFlags as { adsAutopilotV8RolloutV1: boolean }).adsAutopilotV8RolloutV1 = false;
    (adsAiAutomationFlags as { adsAutopilotShadowModeV1: boolean }).adsAutopilotShadowModeV1 = false;
    (adsAiAutomationFlags as { adsAutopilotV8InfluenceV1: boolean }).adsAutopilotV8InfluenceV1 = false;
    (adsAiAutomationFlags as { adsAutopilotV8PrimaryV1: boolean }).adsAutopilotV8PrimaryV1 = false;
  });

  it("rollout OFF: legacy path, no shadow schedule, returns live builder result", async () => {
    const live = [{ actionType: "x" } as ProposedAction];
    buildLive.mockResolvedValue(live);
    const out = await proposalsAdsAutomationLoop("u1");
    expect(out).toBe(live);
    expect(scheduleFromPromise).not.toHaveBeenCalled();
    expect(scheduleFromResults).not.toHaveBeenCalled();
  });

  it("rollout ON + shadow OFF: schedules hook (no-op inside) but does not block; returns live", async () => {
    (adsAiAutomationFlags as { adsAutopilotV8RolloutV1: boolean }).adsAutopilotV8RolloutV1 = true;
    const live = [{ actionType: "y" } as ProposedAction];
    buildLive.mockResolvedValue(live);
    const out = await proposalsAdsAutomationLoop("u2");
    expect(out).toBe(live);
    expect(scheduleFromPromise).toHaveBeenCalledTimes(1);
  });

  it("rollout ON + shadow ON: invokes shadow schedule with livePromise", async () => {
    (adsAiAutomationFlags as { adsAutopilotV8RolloutV1: boolean }).adsAutopilotV8RolloutV1 = true;
    (adsAiAutomationFlags as { adsAutopilotShadowModeV1: boolean }).adsAutopilotShadowModeV1 = true;
    buildLive.mockResolvedValue([]);
    await proposalsAdsAutomationLoop("u3");
    expect(scheduleFromPromise).toHaveBeenCalledTimes(1);
  });

  it("rollout ON + shadow ON + influence ON: when overlay skipped, returns live reference from builder", async () => {
    (adsAiAutomationFlags as { adsAutopilotV8RolloutV1: boolean }).adsAutopilotV8RolloutV1 = true;
    (adsAiAutomationFlags as { adsAutopilotShadowModeV1: boolean }).adsAutopilotShadowModeV1 = true;
    (adsAiAutomationFlags as { adsAutopilotV8InfluenceV1: boolean }).adsAutopilotV8InfluenceV1 = true;
    const live = [{ actionType: "live-only" } as ProposedAction];
    buildLive.mockResolvedValue(live);
    buildShadow.mockResolvedValue(live);
    const out = await proposalsAdsAutomationLoop("u4");
    expect(out).toBe(live);
    expect(scheduleFromResults).toHaveBeenCalled();
    expect(scheduleFromPromise).not.toHaveBeenCalled();
  });

  it("rollout ON + primary ON: does not apply Phase C influence (avoids double-processing)", async () => {
    (adsAiAutomationFlags as { adsAutopilotV8RolloutV1: boolean }).adsAutopilotV8RolloutV1 = true;
    (adsAiAutomationFlags as { adsAutopilotShadowModeV1: boolean }).adsAutopilotShadowModeV1 = true;
    (adsAiAutomationFlags as { adsAutopilotV8InfluenceV1: boolean }).adsAutopilotV8InfluenceV1 = true;
    (adsAiAutomationFlags as { adsAutopilotV8PrimaryV1: boolean }).adsAutopilotV8PrimaryV1 = true;
    const row = {
      actionType: "a",
      entityType: "listing",
      entityId: "1",
      reasons: { confidence: 0.5 },
    } as ProposedAction;
    buildLive.mockResolvedValue([row]);
    buildV8Primary.mockResolvedValue([row]);
    buildShadow.mockResolvedValue([row]);
    await proposalsAdsAutomationLoop("u-primary");
    expect(vi.mocked(applyAdsV8InfluenceOverlay)).not.toHaveBeenCalled();
  });

  it("rollout ON + primary OFF + shadow + influence: Phase C overlay is invoked", async () => {
    (adsAiAutomationFlags as { adsAutopilotV8RolloutV1: boolean }).adsAutopilotV8RolloutV1 = true;
    (adsAiAutomationFlags as { adsAutopilotShadowModeV1: boolean }).adsAutopilotShadowModeV1 = true;
    (adsAiAutomationFlags as { adsAutopilotV8InfluenceV1: boolean }).adsAutopilotV8InfluenceV1 = true;
    (adsAiAutomationFlags as { adsAutopilotV8PrimaryV1: boolean }).adsAutopilotV8PrimaryV1 = false;
    const live = [{ actionType: "live-only", entityType: "listing", entityId: "x" } as ProposedAction];
    buildLive.mockResolvedValue(live);
    buildShadow.mockResolvedValue(live);
    await proposalsAdsAutomationLoop("u-phase-c");
    expect(vi.mocked(applyAdsV8InfluenceOverlay)).toHaveBeenCalled();
  });
});
