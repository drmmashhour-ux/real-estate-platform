import type { EnrichedCandidate, RollbackEvent } from "./scenario-autopilot.types";
import { scenarioAutopilotLog } from "./scenario-autopilot-log";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * Marks a run reversed; does not recreate historical config (connectors must implement restore).
 */
export async function rollbackRun(
  runId: string,
  actorUserId: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string; note?: string }> {
  const run = await prisma.lecipmScenarioAutopilotRun.findFirst({ where: { id: runId, userId: actorUserId } });
  if (!run) return { ok: false, error: "not_found" };
  if (run.status !== "EXECUTED") {
    return { ok: false, error: "invalid_state" };
  }

  const best = (run.candidatesJson as EnrichedCandidate[]).find((c) => c.id === run.bestCandidateId);
  if (!best?.reversible) {
    return {
      ok: false,
      error: "not_reversible",
      note: "This scenario was flagged as not safely reversible in all subsystems — manual rollback required.",
    };
  }

  const event: RollbackEvent = {
    at: new Date().toISOString(),
    actorUserId,
    reason,
    reversible: true,
    note: "Flagged as reversed in audit log. Restore prior marketing/CRM/automation state via product admin where available.",
  };

  await prisma.lecipmScenarioAutopilotRun.update({
    where: { id: runId },
    data: {
      status: "REVERSED",
      rollbackJson: event as object,
    },
  });
  scenarioAutopilotLog.line("rollback", "reversed", { runId, actorUserId });
  return { ok: true };
}
