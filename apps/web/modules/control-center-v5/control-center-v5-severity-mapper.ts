import type { ExecutiveOverallStatus } from "@/modules/control-center/ai-control-center.types";
import type { CommandCenterDigestSeverity } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { CommandCenterIncidentSeverity } from "./company-command-center-v5.types";

const INC_ORDER: CommandCenterIncidentSeverity[] = ["low", "medium", "high", "critical"];

export function executiveToIncidentSeverity(s: ExecutiveOverallStatus): CommandCenterIncidentSeverity {
  if (s === "critical") return "critical";
  if (s === "warning") return "high";
  if (s === "limited") return "medium";
  return "low";
}

function digestToRank(d: CommandCenterDigestSeverity | null): number {
  if (!d) return 0;
  const m: Record<CommandCenterDigestSeverity, number> = {
    info: 0,
    watch: 1,
    warning: 2,
    critical: 3,
  };
  return m[d];
}

export function maxDigestToIncident(
  exec: ExecutiveOverallStatus,
  digestMax: CommandCenterDigestSeverity | null,
): CommandCenterIncidentSeverity {
  const er = INC_ORDER.indexOf(executiveToIncidentSeverity(exec));
  const dr = digestToRank(digestMax);
  const mx = Math.max(er, dr);
  return INC_ORDER[Math.min(mx, INC_ORDER.length - 1)];
}
