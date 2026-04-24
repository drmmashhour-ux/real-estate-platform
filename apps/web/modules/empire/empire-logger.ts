import { logInfo } from "@/lib/logger";

const TAG = "[empire]";

export type EmpireLogEvent = 
  | "entity_created"
  | "ownership_updated"
  | "capital_summary_generated"
  | "strategic_allocation_recommended"
  | "governance_alert_generated";

export function logEmpire(event: EmpireLogEvent, payload: Record<string, unknown> = {}) {
  logInfo(`${TAG} ${event}`, payload);
}
