import { getDomainMatrixRow } from "@/modules/autopilot-governance/autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";
import type { LecipmAutopilotDomainId } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";

export type QuickOperatingMode = "ASSIST" | "SAFE" | "FULL";

export type RollupAutonomyStatus = "ON" | "LIMITED" | "OFF";

/**
 * Maps UI quick mode to a concrete persisted mode per matrix row (respects allowedModes).
 */
export function modeForQuickSwitch(
  quick: QuickOperatingMode,
  domain: LecipmAutopilotDomainId,
  fallback: FullAutopilotMode
): FullAutopilotMode {
  const row = getDomainMatrixRow(domain);
  if (!row) return fallback;
  const allowed = new Set(row.allowedModes);

  const pick = (m: FullAutopilotMode): FullAutopilotMode => (allowed.has(m) ? m : fallback);

  if (quick === "ASSIST") {
    return pick("ASSIST");
  }
  if (quick === "SAFE") {
    if (allowed.has("SAFE_AUTOPILOT")) return "SAFE_AUTOPILOT";
    if (allowed.has("ASSIST")) return "ASSIST";
    return pick("OFF");
  }
  // FULL — capped autonomy: bounded where policy allows; otherwise approval-gated full lane.
  if (row.riskLevel === "LOW" && allowed.has("FULL_AUTOPILOT_BOUNDED")) {
    return "FULL_AUTOPILOT_BOUNDED";
  }
  if (allowed.has("FULL_AUTOPILOT_APPROVAL")) {
    return "FULL_AUTOPILOT_APPROVAL";
  }
  if (allowed.has("SAFE_AUTOPILOT")) {
    return "SAFE_AUTOPILOT";
  }
  return pick("ASSIST");
}

export function deriveRollupAutonomyStatus(params: {
  globalPaused: boolean;
  /** Effective modes for each technical domain (same order as matrix size). */
  effectiveModes: FullAutopilotMode[];
  killSwitchOffFraction: number;
}): RollupAutonomyStatus {
  if (params.globalPaused) return "OFF";

  const { effectiveModes } = params;
  if (effectiveModes.length === 0) return "LIMITED";

  const allOff = effectiveModes.every((m) => m === "OFF");
  if (allOff) return "OFF";

  const autopilotLike = effectiveModes.filter(
    (m) => m === "SAFE_AUTOPILOT" || m === "FULL_AUTOPILOT_APPROVAL" || m === "FULL_AUTOPILOT_BOUNDED"
  ).length;

  const onLike = effectiveModes.filter((m) => m !== "OFF").length;
  const strongFraction = autopilotLike / Math.max(onLike, 1);

  if (strongFraction >= 0.45 && params.killSwitchOffFraction < 0.35) return "ON";
  return "LIMITED";
}

const ACTION_LABELS: Array<{ match: (s: string) => boolean; label: string }> = [
  { match: (s) => s.includes("follow") || s.includes("sequence"), label: "Follow-up sent" },
  { match: (s) => s.includes("book") || s.includes("slot"), label: "Booking created" },
  { match: (s) => s.includes("rout") || s.includes("lead"), label: "Lead routed" },
  { match: (s) => s.includes("schedul") || s.includes("calendar") || s.includes("publish"), label: "Content scheduled" },
  { match: (s) => s.includes("optim") || s.includes("proposal"), label: "Optimization proposed" },
];

export function friendlyAutonomyActionLabel(actionType: string): string {
  const lower = actionType.toLowerCase();
  for (const row of ACTION_LABELS) {
    if (row.match(lower)) return row.label;
  }
  return actionType.replace(/_/g, " ");
}

/** Control strip on the Domain Matrix (OFF / ASSIST / SAFE / FULL). */
export type DomainMatrixUiSlot = "OFF" | "ASSIST" | "SAFE" | "FULL";

export function persistedModeForUiSlot(
  slot: DomainMatrixUiSlot,
  domain: LecipmAutopilotDomainId,
  fallback: FullAutopilotMode
): FullAutopilotMode {
  const row = getDomainMatrixRow(domain);
  if (!row) return fallback;
  const allowed = new Set(row.allowedModes);

  if (slot === "OFF") {
    if (allowed.has("OFF")) return "OFF";
    if (allowed.has("ASSIST")) return "ASSIST";
    return fallback;
  }
  if (slot === "ASSIST") {
    return allowed.has("ASSIST") ? "ASSIST" : fallback;
  }
  if (slot === "SAFE") {
    if (allowed.has("SAFE_AUTOPILOT")) return "SAFE_AUTOPILOT";
    if (allowed.has("ASSIST")) return "ASSIST";
    return fallback;
  }
  return modeForQuickSwitch("FULL", domain, fallback);
}

export function outcomePhrase(decisionOutcome: string): string {
  switch (decisionOutcome) {
    case "ALLOW_AUTOMATIC":
      return "Executed automatically";
    case "REQUIRE_APPROVAL":
      return "Queued for approval";
    case "BLOCK":
      return "Blocked by policy";
    default:
      return decisionOutcome;
  }
}
