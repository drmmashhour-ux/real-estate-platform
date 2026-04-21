import { prisma } from "@/lib/db";
import type { AutonomousActionCandidate, QueueStatus, RouteResult } from "@/modules/autonomy/autonomy.types";
import { autonomyLog } from "@/modules/autonomy/autonomy-log";
import { dispatchSafeExecution } from "@/modules/autonomy/execution-dispatcher";
import {
  evaluateCandidateAgainstPolicy,
  getApplicableAutonomyPolicy,
  type ApplicablePolicy,
} from "@/modules/autonomy/autonomy-policy.service";

function domainToEntityType(domain: string): string {
  switch (domain) {
    case "DEAL":
      return "deal";
    case "LEAD":
      return "lead";
    case "LISTING":
      return "listing";
    default:
      return "generic";
  }

}

function pickEntityId(c: AutonomousActionCandidate): { entityId?: string; dealId?: string; leadId?: string; listingId?: string } {
  const r = c.relatedEntityIds;
  return {
    entityId: r.dealId ?? r.leadId ?? r.listingId,
    dealId: r.dealId,
    leadId: r.leadId,
    listingId: r.listingId,
  };
}

export async function routeAutonomousAction(
  candidate: AutonomousActionCandidate,
  opts?: { brokerId?: string | null; policy?: ApplicablePolicy; dryRun?: boolean }
): Promise<RouteResult> {
  try {
    const policy = opts?.policy ?? (await getApplicableAutonomyPolicy({ brokerId: opts?.brokerId ?? null }));
    const ev = evaluateCandidateAgainstPolicy(candidate, policy);

    if (ev.blocked || !ev.allowed) {
      autonomyLog.actionBlocked({ candidateId: candidate.id, reasons: ev.blockedReasons });
      const row = await prisma.autonomousActionQueue.create({
        data: {
          domain: candidate.domain,
          actionType: candidate.actionType,
          entityType: domainToEntityType(candidate.domain),
          ...pickEntityId(candidate),
          brokerId: opts?.brokerId ?? undefined,
          candidateJson: candidate as unknown as object,
          riskLevel: candidate.riskLevel,
          autonomyMode: policy.mode,
          status: "BLOCKED",
          requiresApproval: true,
          blockedReasonsJson: ev.blockedReasons,
          sourceAgentType: candidate.sourceAgent,
          sourceStrategyKey: candidate.sourceStrategyKey ?? undefined,
          rationale: candidate.rationale,
        },
      });
      autonomyLog.actionQueued({ actionQueueId: row.id, status: "BLOCKED" });
      return {
        queued: true,
        status: "BLOCKED",
        rationale: ev.blockedReasons.join("; ") || "blocked_by_policy",
        actionQueueId: row.id,
        blockedReasons: ev.blockedReasons,
      };
    }

    if (opts?.dryRun) {
      autonomyLog.actionRouted({ candidateId: candidate.id, dryRun: true });
      return { queued: false, status: "SKIPPED", rationale: "dry_run_no_persistence" };
    }

    if (ev.requiresApproval) {
      const row = await prisma.autonomousActionQueue.create({
        data: {
          domain: candidate.domain,
          actionType: candidate.actionType,
          entityType: domainToEntityType(candidate.domain),
          ...pickEntityId(candidate),
          brokerId: opts?.brokerId ?? undefined,
          candidateJson: candidate as unknown as object,
          riskLevel: candidate.riskLevel,
          autonomyMode: policy.mode,
          status: "QUEUED",
          requiresApproval: true,
          sourceAgentType: candidate.sourceAgent,
          sourceStrategyKey: candidate.sourceStrategyKey ?? undefined,
          rationale: candidate.rationale,
        },
      });
      autonomyLog.actionQueued({ actionQueueId: row.id, status: "QUEUED" });
      return {
        queued: true,
        status: "QUEUED",
        rationale: "approval_required",
        actionQueueId: row.id,
      };
    }

    const row = await prisma.autonomousActionQueue.create({
      data: {
        domain: candidate.domain,
        actionType: candidate.actionType,
        entityType: domainToEntityType(candidate.domain),
        ...pickEntityId(candidate),
        brokerId: opts?.brokerId ?? undefined,
        candidateJson: candidate as unknown as object,
        riskLevel: candidate.riskLevel,
        autonomyMode: policy.mode,
        status: "QUEUED",
        requiresApproval: false,
        sourceAgentType: candidate.sourceAgent,
        sourceStrategyKey: candidate.sourceStrategyKey ?? undefined,
        rationale: candidate.rationale,
      },
    });

    const exec = await dispatchSafeExecution(candidate);
    await prisma.autonomousExecutionEvent.create({
      data: {
        actionQueueId: row.id,
        executionStatus: exec.ok ? "SUCCESS" : "FAILED",
        resultJson: exec as unknown as object,
      },
    });

    await prisma.autonomousActionQueue.update({
      where: { id: row.id },
      data: {
        status: exec.ok ? ("EXECUTED" as QueueStatus) : ("BLOCKED" as QueueStatus),
        executedAt: new Date(),
      },
    });

    autonomyLog.actionExecuted({ actionQueueId: row.id, ok: exec.ok, adapter: exec.adapter });
    return {
      queued: true,
      status: exec.ok ? "EXECUTED" : "BLOCKED",
      rationale: exec.message,
      actionQueueId: row.id,
    };
  } catch (e) {
    autonomyLog.actionBlocked({ error: e instanceof Error ? e.message : "unknown" });
    return {
      queued: false,
      status: "BLOCKED",
      rationale: "router_error_caught",
      blockedReasons: ["internal_error"],
    };
  }
}
