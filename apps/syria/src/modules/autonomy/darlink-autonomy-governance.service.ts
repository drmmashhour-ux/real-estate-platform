/**
 * Governance modes — deterministic resolution from env + legacy SYRIA_AUTONOMY_MODE.
 */

import type { MarketplaceGovernanceMode } from "./darlink-marketplace-autonomy.types";
import { getDarlinkAutonomyFlags } from "@/lib/platform-flags";
import { getSyriaAutonomyMode } from "@/config/syria-platform.config";

export type ResolveMarketplaceGovernanceResult = {
  mode: MarketplaceGovernanceMode;
  reasons: readonly string[];
};

export function resolveMarketplaceGovernance(): ResolveMarketplaceGovernanceResult {
  try {
    const flags = getDarlinkAutonomyFlags();
    const reasons: string[] = [];

    if (!flags.AUTONOMY_ENABLED) {
      return { mode: "OFF", reasons: ["darlink_autonomy_disabled"] };
    }

    const legacy = getSyriaAutonomyMode();
    if (legacy === "OFF") {
      reasons.push("syria_autonomy_mode_off");
      return { mode: "OFF", reasons };
    }
    if (legacy === "ASSIST") {
      return { mode: "RECOMMEND_ONLY", reasons: ["syria_autonomy_assist_maps_recommend_only"] };
    }
    if (legacy === "SAFE_AUTOPILOT") {
      return { mode: "SAFE_AUTOPILOT", reasons: ["syria_autonomy_safe_autopilot"] };
    }

    if (flags.AUTO_EXECUTE_ENABLED && flags.APPROVALS_ENABLED) {
      return { mode: "FULL_AUTOPILOT_APPROVAL", reasons: ["darlink_auto_execute_with_approvals"] };
    }
    if (flags.AUTO_EXECUTE_ENABLED) {
      return { mode: "SAFE_AUTOPILOT", reasons: ["darlink_auto_execute_without_full_governance"] };
    }

    return { mode: "RECOMMEND_ONLY", reasons: ["default_recommend_only"] };
  } catch {
    return { mode: "OFF", reasons: ["governance_resolve_failed"] };
  }
}
