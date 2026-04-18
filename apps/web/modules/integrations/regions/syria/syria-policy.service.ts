/**
 * Syria preview policy — signal-driven approval hints only (read-only; no Québec rules).
 */
import type { SyriaSignal } from "./syria-signal.types";

export type SyriaPreviewPolicyDecision = "requires_local_approval" | "caution_preview" | "allow_preview";

export type SyriaPreviewPolicyResult = {
  decision: SyriaPreviewPolicyDecision;
  rationale: string;
};

export function evaluateSyriaPreviewPolicyFromSignals(signals: SyriaSignal[]): SyriaPreviewPolicyResult {
  let hasCritical = false;
  let hasWarning = false;
  for (const s of signals) {
    if (s.severity === "critical") hasCritical = true;
    else if (s.severity === "warning") hasWarning = true;
  }

  if (hasCritical) {
    return {
      decision: "requires_local_approval",
      rationale: "At least one critical signal is present; local approval is required before relying on this preview.",
    };
  }
  if (hasWarning) {
    return {
      decision: "caution_preview",
      rationale: "Warning-level signals are present; treat preview output as cautious guidance only.",
    };
  }
  return {
    decision: "allow_preview",
    rationale: "No warning or critical signals; preview may proceed under normal read-only constraints.",
  };
}
