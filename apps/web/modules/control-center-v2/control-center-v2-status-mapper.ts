/**
 * Normalizes subsystem hints into stable UI rollout postures — conservative; missing data → limited/unavailable.
 */
import type { RolloutPostureUi } from "./company-command-center-v2.types";
import type { ControlCenterUnifiedStatus } from "@/modules/control-center/ai-control-center.types";

export function mapHealthToRolloutPosture(
  status: ControlCenterUnifiedStatus,
  opts: {
    shadowFlag?: boolean;
    influenceFlag?: boolean;
    primaryFlag?: boolean;
    blockedHint?: boolean;
  },
): RolloutPostureUi {
  if (opts.blockedHint) return "blocked";
  if (status === "disabled") return "disabled";
  if (status === "unavailable") return "unavailable";
  if (opts.primaryFlag) return "primary";
  if (opts.influenceFlag) return "influence";
  if (opts.shadowFlag) return "shadow";
  if (status === "limited" || status === "warning") return "limited";
  return "limited";
}

export function postureLabel(p: RolloutPostureUi): string {
  const m: Record<RolloutPostureUi, string> = {
    disabled: "Disabled",
    shadow: "Shadow",
    influence: "Influence",
    primary: "Primary",
    limited: "Limited",
    blocked: "Blocked",
    unavailable: "Unavailable",
  };
  return m[p];
}
