/**
 * Maps unified control-center statuses to role-level attention labels — conservative.
 */
import type { ControlCenterUnifiedStatus } from "@/modules/control-center/ai-control-center.types";

export type RoleAttentionLevel = "ok" | "watch" | "escalate" | "unknown";

export function mapUnifiedStatusToRoleAttention(status: ControlCenterUnifiedStatus): RoleAttentionLevel {
  if (status === "healthy" || status === "disabled") return "ok";
  if (status === "limited") return "watch";
  if (status === "warning") return "escalate";
  if (status === "critical") return "escalate";
  if (status === "unavailable") return "unknown";
  return "watch";
}

export function attentionLabel(level: RoleAttentionLevel): string {
  const m: Record<RoleAttentionLevel, string> = {
    ok: "Stable",
    watch: "Watch",
    escalate: "Needs attention",
    unknown: "Unknown",
  };
  return m[level];
}
