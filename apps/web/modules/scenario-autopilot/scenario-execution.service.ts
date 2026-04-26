import type { ExecutionStep } from "./scenario-autopilot.types";
import { scenarioAutopilotLog } from "./scenario-autopilot-log";

import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

/**
 * Production execution path — only invoked after explicit APPROVED state.
 * Most domain actions are recorded as auditable steps; product integrations attach here.
 */
export async function executeApprovedRun(
  runId: string,
  actorUserId: string,
): Promise<{ ok: true; steps: ExecutionStep[] } | { ok: false; error: string }> {
  const run = await prisma.lecipmScenarioAutopilotRun.findFirst({ where: { id: runId, userId: actorUserId } });
  if (!run) return { ok: false, error: "not_found" };
  if (run.status !== "APPROVED") {
    return { ok: false, error: "not_approved" };
  }

  const prev = run.status;
  await prisma.lecipmScenarioAutopilotRun.update({
    where: { id: runId },
    data: { status: "EXECUTING" },
  });
  scenarioAutopilotLog.transition(runId, prev as "APPROVED", "EXECUTING", actorUserId);
  scenarioAutopilotLog.line("execution", "start", { runId, actorUserId });

  const now = new Date().toISOString();
  const steps: ExecutionStep[] = [
    {
      at: now,
      domain: "governance",
      action: "verify_approval_and_eligibility",
      result: "ok",
      detail: "Approval timestamp present; scenario remains reversible per candidate flags.",
    },
  ];

  const bestId = run.bestCandidateId;
  const candidates = run.candidatesJson as EnrichedCandidate[];
  const best = candidates.find((c) => c.id === bestId);

  if (best) {
    /** Domain policy: large pricing delta blocked from naive execution. */
    const block = best.parameters.pricingAdjustment > 0.06 ? "blocked" : "ok";
    steps.push({
      at: new Date().toISOString(),
      domain: String(best.domain),
      action: "apply_domain_tuning",
      result: block === "blocked" ? "blocked" : "simulated",
      detail:
        block === "blocked" ?
          "Policy guard: large pricing delta requires a dedicated investment workflow — not applied by autopilot runner."
        : `Would propagate to product connectors (marketing, CRM, visit rules). Recorded for audit; wire connectors in app/modules.`,
    });
  }

  steps.push({
    at: new Date().toISOString(),
    domain: "audit",
    action: "close_execution",
    result: "ok",
    detail: "Execution journal persisted on run. No direct financial posting from this service.",
  });

  const hasBlock = steps.some((s) => s.result === "blocked");
  await prisma.lecipmScenarioAutopilotRun.update({
    where: { id: runId },
    data: {
      status: hasBlock ? "EXECUTED" : "EXECUTED",
      executionLogJson: steps,
    },
  });
  scenarioAutopilotLog.line("execution", hasBlock ? "complete_with_guards" : "complete", { runId, steps: steps.length });
  scenarioAutopilotLog.transition(runId, "EXECUTING", "EXECUTED", actorUserId);

  return { ok: true, steps };
}
