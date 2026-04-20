/**
 * Region-safe execution capability — deterministic gates for live controlled execution.
 * Preview/read-only paths are unaffected (handled elsewhere).
 */
import { isRegionCapabilityEnabled } from "@lecipm/platform-core";
import { engineFlags } from "@/config/feature-flags";
import type { ControlledExecutionReason } from "./controlled-execution.types";
import {
  resolveRegionExecutionProfile,
  type RegionExecutionProfile,
} from "../regions/region-execution-capability.service";

export type RegionSafeExecutionParams = {
  regionCode: string;
  /** Listing source when known (e.g. syria). */
  source?: string;
  actionType: string;
};

export type RegionSafeExecutionResult = {
  /** True only when region profile is `full` and capability checks pass. */
  allowed: boolean;
  reasons: ControlledExecutionReason[];
  notes: readonly string[];
  profile: RegionExecutionProfile;
};

function normalizeRegion(rc: string): string {
  const t = typeof rc === "string" ? rc.trim().toLowerCase() : "";
  if (t === "syria") return "sy";
  return t || "unknown";
}

/**
 * Whether live controlled execution may proceed for this region + source.
 * Unsupported regions → blocked; Syria remains preview-only unless explicitly enabled.
 */
export function canRegionExecuteAction(params: RegionSafeExecutionParams): RegionSafeExecutionResult {
  const reasons: ControlledExecutionReason[] = [];
  const notes: string[] = [];
  const rc = normalizeRegion(params.regionCode);
  const profileBase = resolveRegionExecutionProfile(rc);

  const isSyria = rc === "sy" || params.source === "syria";
  if (isSyria && !engineFlags.syriaLiveExecutionV1) {
    reasons.push("region_capability_block");
    notes.push("syria_live_execution_disabled_until_explicit_flag");
    return {
      allowed: false,
      reasons,
      notes,
      profile: {
        executionMode: "blocked",
        notes: [...profileBase.notes, ...notes],
      },
    };
  }

  const regionAwareOn = engineFlags.regionAwareExecutionV1 === true || engineFlags.regionAwareAutonomyV1 === true;

  if (!regionAwareOn) {
    notes.push("region_aware_execution_flags_off_using_legacy_profile");
    const allowed = profileBase.executionMode === "full";
    if (!allowed && profileBase.executionMode === "blocked") reasons.push("region_capability_block");
    if (!allowed && profileBase.executionMode === "recommend_only") reasons.push("region_recommend_only");
    return { allowed, reasons, notes, profile: profileBase };
  }

  try {
    if (!isRegionCapabilityEnabled(rc, "controlledExecution")) {
      reasons.push("region_capability_block");
      notes.push("controlled_execution_capability_false_for_region");
      return {
        allowed: false,
        reasons,
        notes,
        profile: {
          executionMode: "blocked",
          notes: [...profileBase.notes, ...notes],
        },
      };
    }
  } catch {
    notes.push("region_capability_registry_unavailable");
    reasons.push("region_capability_block");
    return {
      allowed: false,
      reasons,
      notes,
      profile: {
        executionMode: "blocked",
        notes: [...profileBase.notes, ...notes],
      },
    };
  }

  if (profileBase.executionMode === "blocked") {
    reasons.push("region_capability_block");
    return { allowed: false, reasons, notes, profile: profileBase };
  }

  if (profileBase.executionMode === "recommend_only") {
    reasons.push("region_recommend_only");
    return { allowed: false, reasons, notes, profile: profileBase };
  }

  return { allowed: true, reasons: [], notes, profile: profileBase };
}

export function getRegionExecutionAvailabilityNote(params: RegionSafeExecutionParams): string {
  const r = canRegionExecuteAction(params);
  if (r.allowed) return "Region allows controlled internal-safe execution when upstream gates pass.";
  if (r.reasons.includes("region_capability_block")) {
    return "Live execution is blocked for this region or capability posture — preview and intelligence remain available.";
  }
  if (r.reasons.includes("region_recommend_only")) {
    return "Region is restricted to recommendations / preview — no autonomous execution.";
  }
  return "Region execution availability could not be confirmed — defaulting to conservative posture.";
}
