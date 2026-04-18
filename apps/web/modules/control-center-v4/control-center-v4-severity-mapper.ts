/**
 * Bounded severity mapping — conservative; weak signals stay info/watch.
 */
import type { ControlCenterUnifiedStatus } from "@/modules/control-center/ai-control-center.types";
import type { CommandCenterDigestSeverity } from "./company-command-center-v4.types";

export function unifiedStatusToDigestSeverity(status: ControlCenterUnifiedStatus): CommandCenterDigestSeverity {
  if (status === "critical") return "critical";
  if (status === "warning") return "warning";
  if (status === "limited") return "watch";
  if (status === "healthy") return "info";
  return "info";
}

export function bumpSeverity(
  a: CommandCenterDigestSeverity,
  b: CommandCenterDigestSeverity,
): CommandCenterDigestSeverity {
  const order: CommandCenterDigestSeverity[] = ["info", "watch", "warning", "critical"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}
