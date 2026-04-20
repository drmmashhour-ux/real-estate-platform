/**
 * Region-aware autonomy gates — deterministic; derives from registry + jurisdiction packs.
 */
import { getRegionDefinition, isRegionCapabilityEnabled } from "@lecipm/platform-core";
import { engineFlags } from "@/config/feature-flags";
import { getJurisdictionPolicyPack } from "@/modules/legal/jurisdiction/jurisdiction-policy-pack-registry";

export type RegionExecutionProfile = {
  executionMode: "full" | "recommend_only" | "blocked";
  notes: readonly string[];
};

export function resolveRegionExecutionProfile(regionCode: string): RegionExecutionProfile {
  try {
    if (!engineFlags.regionAwareAutonomyV1) {
      return { executionMode: "full", notes: ["region_aware_autonomy_feature_disabled"] };
    }
    const rc = typeof regionCode === "string" ? regionCode.trim().toLowerCase() : "";
    const normalized = rc === "syria" ? "sy" : rc;
    const def = getRegionDefinition(normalized);
    const pack = getJurisdictionPolicyPack(normalized);
    const baseNotes = [...pack.notes];

    if (!def) {
      return { executionMode: "recommend_only", notes: [...baseNotes, "unknown_region_code"] };
    }

    if (!isRegionCapabilityEnabled(normalized, "controlledExecution")) {
      return {
        executionMode: "recommend_only",
        notes: [...baseNotes, "controlled_execution_capability_off_for_region"],
      };
    }

    if (!pack.checklistEnabled && normalized === "sy") {
      return { executionMode: "recommend_only", notes: [...baseNotes, "syria_autonomy_preview_only_posture"] };
    }

    return { executionMode: "full", notes: baseNotes };
  } catch {
    return { executionMode: "recommend_only", notes: ["region_execution_profile_fallback"] };
  }
}

export function canRegionUseAutonomy(regionCode: string): boolean {
  try {
    return isRegionCapabilityEnabled(regionCode, "autonomousPreview") || isRegionCapabilityEnabled(regionCode, "controlledExecution");
  } catch {
    return false;
  }
}

export function canRegionUseControlledExecution(regionCode: string): boolean {
  try {
    return isRegionCapabilityEnabled(regionCode, "controlledExecution");
  } catch {
    return false;
  }
}

export function canRegionUseLegalComplianceBlock(regionCode: string): boolean {
  try {
    return getJurisdictionPolicyPack(regionCode).checklistEnabled === true;
  } catch {
    return false;
  }
}

export function canRegionUseTrustRanking(regionCode: string): boolean {
  try {
    return getJurisdictionPolicyPack(regionCode).rankingRulesEnabled === true;
  } catch {
    return false;
  }
}
