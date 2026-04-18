import { logError, logWarn } from "@/lib/logger";

export type MonitoringDomain = "payment" | "booking" | "api" | "fraud" | "generic";

export function logMonitoringError(domain: MonitoringDomain, message: string, meta?: Record<string, unknown>) {
  logError(`[monitor:${domain}] ${message}`, meta);
}

export function logMonitoringWarn(domain: MonitoringDomain, message: string, meta?: Record<string, unknown>) {
  logWarn(`[monitor:${domain}] ${message}`, meta);
}
