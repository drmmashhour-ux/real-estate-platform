import { commandCenterFlags } from "@/config/feature-flags";

export function assertCommandCenterEnabled(feature: "command" | "executive" | "mi"): { ok: true } | { ok: false; code: string } {
  if (feature === "executive" && !commandCenterFlags.executiveDashboardV1) {
    return { ok: false, code: "executive_dashboard_disabled" };
  }
  if (feature === "mi" && !commandCenterFlags.marketIntelligenceDashboardV1) {
    return { ok: false, code: "market_intelligence_disabled" };
  }
  if (feature === "command" && !commandCenterFlags.commandCenterV1) {
    return { ok: false, code: "command_center_disabled" };
  }
  return { ok: true };
}
