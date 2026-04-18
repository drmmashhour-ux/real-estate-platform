export type AlertSeverity = "info" | "warning" | "critical";

export type CommandCenterAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
  source: "anomaly" | "insight" | "rule";
  createdAt: string;
};
