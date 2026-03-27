import type { AiOperatorAlert, AlertSeverity, AlertType } from "../models/alerts.js";

const alerts: AiOperatorAlert[] = [];
let idCounter = 0;

function nextId(): string {
  return `alt_${Date.now()}_${++idCounter}`;
}

export function createAlert(alert: Omit<AiOperatorAlert, "id" | "createdAt" | "status">): AiOperatorAlert {
  const record: AiOperatorAlert = {
    ...alert,
    id: nextId(),
    status: "open",
    createdAt: new Date().toISOString(),
  };
  alerts.push(record);
  return record;
}

export function getAlerts(options: {
  alertType?: AlertType;
  severity?: AlertSeverity;
  status?: AiOperatorAlert["status"];
  entityType?: string;
  limit?: number;
  offset?: number;
}): AiOperatorAlert[] {
  let out = [...alerts];
  if (options.alertType) out = out.filter((a) => a.alertType === options.alertType);
  if (options.severity) out = out.filter((a) => a.severity === options.severity);
  if (options.status) out = out.filter((a) => a.status === options.status);
  if (options.entityType) out = out.filter((a) => a.entityType === options.entityType);
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return out.slice(offset, offset + limit);
}

export function updateAlertStatus(
  id: string,
  status: AiOperatorAlert["status"]
): AiOperatorAlert | null {
  const a = alerts.find((x) => x.id === id);
  if (!a) return null;
  a.status = status;
  return a;
}
