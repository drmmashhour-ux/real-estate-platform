/**
 * Legacy simulation-only batch — logs intent, does not mutate DB.
 * Controlled real execution lives in `ai-autopilot-controlled-execution.service.ts` (whitelist).
 */

import { logInfo } from "@/lib/logger";
import { buildAutopilotActions } from "./ai-autopilot.service";
import { getAutopilotActionStatus } from "./ai-autopilot-approval.service";
import { isLeadsPipelineAutopilotAction } from "./ai-autopilot-execution-policy";

export type AutopilotSafeExecutionResult = {
  executed: number;
  skipped: number;
  /** Simulation log lines (safe to show in admin UI). */
  logLines: string[];
};

export function executeApprovedActions(): AutopilotSafeExecutionResult {
  const actions = buildAutopilotActions();
  let executed = 0;
  let skipped = 0;
  const logLines: string[] = [];

  for (const a of actions) {
    const st = getAutopilotActionStatus(a.id);
    if (st !== "approved") {
      skipped += 1;
      logLines.push(`[skip] ${a.id} status=${st}`);
      continue;
    }
    executed += 1;
    if (isLeadsPipelineAutopilotAction(a)) {
      const line = `[simulation] would run leads AI layer (no DB): ${a.id}`;
      logLines.push(line);
      logInfo("[ai-autopilot] safe execution simulation", {
        actionId: a.id,
        source: a.source,
        impact: a.impact,
        mode: "simulation_only",
        leadsLayer: true,
      });
      continue;
    }
    const line = `[simulation] would run approved action: ${a.id} — ${a.title} (source=${a.source}, impact=${a.impact})`;
    logLines.push(line);
    logInfo("[ai-autopilot] safe execution simulation", {
      actionId: a.id,
      source: a.source,
      impact: a.impact,
      mode: "simulation_only",
    });
  }

  return { executed, skipped, logLines };
}
