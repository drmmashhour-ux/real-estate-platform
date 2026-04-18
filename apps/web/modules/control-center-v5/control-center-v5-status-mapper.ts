import type { ControlCenterUnifiedStatus } from "@/modules/control-center/ai-control-center.types";

export function needsAttentionStatus(status: ControlCenterUnifiedStatus): boolean {
  return status === "warning" || status === "critical" || status === "limited";
}
