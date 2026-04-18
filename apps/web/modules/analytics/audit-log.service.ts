/**
 * Unified audit facade — delegates to growth funnel storage today; swap implementation without changing call sites.
 */
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";

export async function recordAuditEvent(input: {
  actorUserId?: string | null;
  action: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await logGrowthEngineAudit(input);
}
