import type { AutopilotLevel, ScenarioInput } from "./simulation.types";

function n(v: unknown, fallback: number): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function parseScenarioInput(body: unknown): ScenarioInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const ap = Math.round(clamp(n(b.autopilotLevel, 0), 0, 3));
  return {
    leadVolumeMultiplier: clamp(n(b.leadVolumeMultiplier, 1), 0.5, 2),
    responseSpeedChange: clamp(n(b.responseSpeedChange, 0), -0.5, 0.5),
    pricingAdjustment: clamp(n(b.pricingAdjustment, 0), -0.2, 0.2),
    marketingBoost: clamp(n(b.marketingBoost, 0), 0, 1),
    trustThresholdChange: clamp(n(b.trustThresholdChange, 0), -10, 10),
    autopilotLevel: ap as AutopilotLevel,
    regionKey: typeof b.regionKey === "string" && b.regionKey.length > 0 ? b.regionKey : null,
  };
}
