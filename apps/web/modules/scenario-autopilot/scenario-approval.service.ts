import type { PlatformRole } from "@prisma/client";

import type { ApprovalPayload, EnrichedCandidate, ScenarioAutopilotStatus } from "./scenario-autopilot.types";
import { scenarioAutopilotLog } from "./scenario-autopilot-log";

import { prisma } from "@repo/db";

function parseStatus(s: string): ScenarioAutopilotStatus {
  const allowed: ScenarioAutopilotStatus[] = [
    "GENERATED",
    "READY_FOR_REVIEW",
    "APPROVED",
    "REJECTED",
    "EXECUTING",
    "EXECUTED",
    "FAILED",
    "REVERSED",
  ];
  return (allowed.includes(s as ScenarioAutopilotStatus) ? s : "GENERATED") as ScenarioAutopilotStatus;
}

export async function approveRun(
  runId: string,
  actorUserId: string,
  _role: PlatformRole,
  _comment?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const run = await prisma.lecipmScenarioAutopilotRun.findFirst({ where: { id: runId, userId: actorUserId } });
  if (!run) return { ok: false, error: "not_found" };
  const st = parseStatus(run.status);
  if (st !== "READY_FOR_REVIEW" && st !== "GENERATED") {
    return { ok: false, error: "invalid_state" };
  }

  const best = (run.candidatesJson as EnrichedCandidate[]).find((c) => c.id === run.bestCandidateId);
  if (best?.requiresHighTierApproval) {
    // In production, check elevated role; here we only log.
    scenarioAutopilotLog.line("approval", "high_tier_approval_recorded", { runId, actorUserId });
  }

  const prev = st;
  await prisma.lecipmScenarioAutopilotRun.update({
    where: { id: runId },
    data: {
      status: "APPROVED",
      approvedByUserId: actorUserId,
      approvedAt: new Date(),
    },
  });
  scenarioAutopilotLog.transition(runId, prev, "APPROVED", actorUserId);
  return { ok: true };
}

export async function rejectRun(
  runId: string,
  actorUserId: string,
  reason: string,
  opts?: { requestRevision?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const run = await prisma.lecipmScenarioAutopilotRun.findFirst({ where: { id: runId, userId: actorUserId } });
  if (!run) return { ok: false, error: "not_found" };
  const st = parseStatus(run.status);
  if (st !== "READY_FOR_REVIEW" && st !== "GENERATED" && st !== "APPROVED") {
    return { ok: false, error: "invalid_state" };
  }

  const fullReason =
    opts?.requestRevision ? `revision_requested: ${reason}` : reason;
  const prev = st;
  await prisma.lecipmScenarioAutopilotRun.update({
    where: { id: runId },
    data: {
      status: "REJECTED",
      rejectedByUserId: actorUserId,
      rejectedAt: new Date(),
      rejectionReason: fullReason,
    },
  });
  scenarioAutopilotLog.line("approval", "rejected", { runId, actorUserId, requestRevision: Boolean(opts?.requestRevision) });
  scenarioAutopilotLog.transition(runId, prev, "REJECTED", actorUserId);
  return { ok: true };
}

export function parseApprovalPayload(json: unknown): ApprovalPayload | null {
  if (!json || typeof json !== "object") return null;
  return json as ApprovalPayload;
}
