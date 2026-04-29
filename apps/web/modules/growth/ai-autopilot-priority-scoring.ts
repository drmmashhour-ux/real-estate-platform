/**
 * Pure priority scoring for autopilot/influence surfaces — avoids pulling unified-learning/SQL adapters into client bundles.
 */
import type { AiAutopilotImpact, AiAutopilotSignalStrength } from "./ai-autopilot.types";
import { applyLearningToAutopilotPriorityScore } from "./growth-learning-integration.service";

function impactWeight(impact: AiAutopilotImpact): number {
  if (impact === "high") return 3;
  if (impact === "medium") return 2;
  return 1;
}

function signalWeight(strength: AiAutopilotSignalStrength): number {
  if (strength === "strong") return 1;
  if (strength === "medium") return 0.62;
  return 0.35;
}

/**
 * priorityScore = f(impact, confidence, signalStrength) → 0–100.
 * Conservative blend — not a business KPI.
 */
export function computePriorityScore(
  impact: AiAutopilotImpact,
  confidence: number,
  signalStrength: AiAutopilotSignalStrength,
): number {
  const iw = impactWeight(impact) / 3;
  const sw = signalWeight(signalStrength);
  const raw = iw * 38 + Math.min(1, Math.max(0, confidence)) * 40 + sw * 22;
  const base = Math.min(100, Math.max(0, Math.round(raw)));
  return applyLearningToAutopilotPriorityScore(base, impact);
}
