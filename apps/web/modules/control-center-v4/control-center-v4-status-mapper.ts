/**
 * Labels for delta / shift display — explicit, no inference of hidden state.
 */
import type { ControlCenterUnifiedStatus } from "@/modules/control-center/ai-control-center.types";

export function statusRank(s: ControlCenterUnifiedStatus): number {
  const m: Record<ControlCenterUnifiedStatus, number> = {
    healthy: 0,
    limited: 1,
    disabled: 1,
    warning: 2,
    critical: 3,
    unavailable: -1,
  };
  return m[s] ?? -1;
}

export function compareStatusRisk(prev: ControlCenterUnifiedStatus, curr: ControlCenterUnifiedStatus): "up" | "down" | "flat" {
  const a = statusRank(prev);
  const b = statusRank(curr);
  if (a < 0 || b < 0) return "flat";
  if (b > a) return "up";
  if (b < a) return "down";
  return "flat";
}
