import { logComplianceTagged } from "@/lib/server/launch-logger";

const PREFIX = "[contract-brain][legal-notice]";

export function logContractBrain(event: string, payload?: Record<string, unknown>): void {
  logComplianceTagged.info(`${PREFIX} ${event}`, payload);
}
