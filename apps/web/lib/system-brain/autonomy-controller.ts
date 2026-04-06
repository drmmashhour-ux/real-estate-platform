import type { AutonomyMode } from "./autonomy-modes";
import { routeSideEffect, type SideEffectIntent } from "./action-router";
import type { RoutedExecution } from "./types";
import { shouldAutoExecuteUnderSafeAutopilot, type RuleEngineAction } from "./rule-engine";
import { isForbiddenAutonomousPrimitive } from "./safety-guardrails";

export type ControllerDecision = {
  routed: RoutedExecution;
  ruleEngineAutoOk: boolean;
  blockedByGuardrail: boolean;
};

/**
 * Single entry for executors: combines forbidden primitives, mode routing, and L3 rule engine.
 */
export function evaluateAutonomousStep(
  mode: AutonomyMode,
  intent: SideEffectIntent,
  ruleHint?: RuleEngineAction,
): ControllerDecision {
  if (ruleHint && isForbiddenAutonomousPrimitive(ruleHint.type)) {
    return {
      routed: { kind: "blocked", reason: "Hard guardrail: forbidden autonomous primitive." },
      ruleEngineAutoOk: false,
      blockedByGuardrail: true,
    };
  }

  const routed = routeSideEffect(mode, intent);
  const ruleEngineAutoOk =
    mode === "SAFE_AUTOPILOT" && ruleHint ? shouldAutoExecuteUnderSafeAutopilot(ruleHint) : false;

  return { routed, ruleEngineAutoOk, blockedByGuardrail: false };
}
