/**
 * Deterministic Syria region capability gates — preview-only phase; no autonomy execution from web.
 * No throws; safe for admin surfaces and API envelopes.
 */

// Darlink (Syria) operates as an independent product lane.
// Execution is handled only inside apps/syria and is not triggered from apps/web.

export type SyriaTrustOverlayCapability = "off" | "limited_summary";

export function canSyriaUsePreview(): boolean {
  return true;
}

export function canSyriaUseAutonomy(): boolean {
  return false;
}

export function canSyriaUseControlledExecution(): boolean {
  return false;
}

export function canSyriaUseQuebecCompliance(): boolean {
  return false;
}

export function canSyriaUseTrustOverlay(): SyriaTrustOverlayCapability {
  return "limited_summary";
}

export type SyriaCapabilitySnapshot = {
  preview: boolean;
  autonomyExecution: boolean;
  controlledExecution: boolean;
  quebecCompliance: boolean;
  trustOverlay: SyriaTrustOverlayCapability;
};

export function getSyriaCapabilitySnapshot(): SyriaCapabilitySnapshot {
  return {
    preview: canSyriaUsePreview(),
    autonomyExecution: canSyriaUseAutonomy(),
    controlledExecution: canSyriaUseControlledExecution(),
    quebecCompliance: canSyriaUseQuebecCompliance(),
    trustOverlay: canSyriaUseTrustOverlay(),
  };
}

/** Stable labels for dashboards / unified intelligence envelopes (deterministic ordering). */
export function getSyriaCapabilityNotes(): readonly string[] {
  const snap = getSyriaCapabilitySnapshot();
  const notes: string[] = [];
  if (snap.preview) notes.push("syria_preview_supported_read_only");
  else notes.push("syria_preview_unavailable");
  if (!snap.autonomyExecution) notes.push("execution_unavailable_for_syria_region");
  if (!snap.controlledExecution) notes.push("controlled_execution_unavailable_for_syria_region");
  if (!snap.quebecCompliance) notes.push("quebec_compliance_not_applied_to_syria_region");
  if (snap.trustOverlay === "limited_summary") notes.push("trust_overlay_syria_limited_summary_only");
  return notes;
}
