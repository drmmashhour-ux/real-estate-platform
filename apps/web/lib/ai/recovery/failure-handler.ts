import { recordAiHealthEvent } from "../observability/health";
import { circuitRecordFailure } from "./circuit-breaker";

export async function handleAutonomyFailure(domain: string, err: unknown, correlationId?: string) {
  const message = err instanceof Error ? err.message : String(err);
  await recordAiHealthEvent({
    level: "warn",
    source: domain,
    message,
    correlationId,
    payload: { domain },
  });
  circuitRecordFailure(domain);
}
