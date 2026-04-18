import { growthV3Flags } from "@/config/feature-flags";
import { AUTONOMY, parseAutonomyMode } from "./autonomy.rules";

export type AutonomyGateResult = {
  allow: boolean;
  mode: string;
  explanation: string[];
};

/**
 * Non-destructive gate for queueing growth actions. Never bypasses consent or send layers.
 */
export function autonomyEvaluate(input: { riskScore: number; decisionType: string; channels: string[] }): AutonomyGateResult {
  if (!growthV3Flags.autonomySystemV1) {
    return {
      allow: true,
      mode: "passthrough",
      explanation: [
        "FEATURE_AUTONOMY_SYSTEM_V1 off — growth-brain approval/risk still apply; customer-facing sends remain gated by messaging layers.",
      ],
    };
  }
  const mode = parseAutonomyMode();
  const explanation: string[] = [];
  if (mode === "OFF") {
    return { allow: false, mode, explanation: ["Autonomy mode OFF or kill switch"] };
  }
  if (input.riskScore > AUTONOMY.maxRiskScoreForAutoQueue) {
    explanation.push(`Risk ${input.riskScore} exceeds max ${AUTONOMY.maxRiskScoreForAutoQueue} — review only`);
    return { allow: false, mode, explanation };
  }
  if (mode === "ASSIST") {
    explanation.push("ASSIST: enqueue suggestions/logs only — no autonomous customer-facing sends");
  }
  if (mode === "GUARDED") {
    explanation.push("GUARDED: extra scrutiny on channels " + input.channels.join(","));
  }
  explanation.push(`Decision ${input.decisionType} allowed for internal queue`);
  return { allow: true, mode, explanation };
}
