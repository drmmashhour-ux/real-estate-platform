import type { CommandCenterDigestSeverity } from "@/modules/control-center-v4/company-command-center-v4.types";

export function digestToAuditSeverity(s: CommandCenterDigestSeverity): "info" | "watch" | "warning" | "critical" {
  return s;
}
