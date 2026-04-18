import type { AnomalyFlag } from "@/modules/market-intelligence/market-intelligence.types";
import type { CommandCenterAlert } from "./alert.types";

export function anomaliesToAlerts(flags: AnomalyFlag[]): CommandCenterAlert[] {
  const now = new Date().toISOString();
  return flags.map((f, i) => ({
    id: `anom_${i}_${f.code}`,
    severity: f.severity === "high" ? "critical" : f.severity === "medium" ? "warning" : "info",
    title: f.code.replace(/_/g, " "),
    body: f.message,
    source: "anomaly" as const,
    createdAt: now,
  }));
}
