import type { MemoryPlaybook } from "@prisma/client";
import { prisma } from "@/lib/db";
import { playbookTelemetry } from "../playbook-memory.telemetry";
import { playbookLog } from "../playbook-memory.logger";
import * as repo from "../repository/playbook-memory.repository";
import { recalculatePlaybookStats } from "./playbook-memory-learning.service";

/** Promotion thresholds (V1 deterministic rules). */
const MIN_EXECUTIONS_PROMOTE = 20;
const MIN_SUCCESS_RATE = 0.58;
const MIN_CONFIDENCE = 0.65;

export async function promoteVersionIfEligible(playbookId: string): Promise<boolean> {
  const pb = await repo.getMemoryPlaybookById(playbookId);
  if (!pb) return false;

  await recalculatePlaybookStats(playbookId);
  const refreshed = await repo.getMemoryPlaybookById(playbookId);
  if (!refreshed) return false;

  const executions = refreshed.totalExecutions;
  const sr =
    executions > 0 ? refreshed.successfulExecutions / Math.max(1, executions) : 0;
  const confidence =
    Math.min(1, Math.log10(1 + executions) / 2) * Math.min(1, 14 / 30);

  if (
    executions >= MIN_EXECUTIONS_PROMOTE &&
    sr >= MIN_SUCCESS_RATE &&
    confidence >= MIN_CONFIDENCE &&
    refreshed.status === "ACTIVE"
  ) {
    const activeVersion = refreshed.versions.find((v) => v.isActive);
    if (activeVersion) {
      await repo.updateMemoryPlaybook(playbookId, {
        lastPromotedAt: new Date(),
      });
      await repo.createLifecycleEvent({
        playbook: { connect: { id: playbookId } },
        playbookVersionId: activeVersion.id,
        eventType: "promote_eligible",
        reason: "thresholds_met_v1",
        payload: { executions, successRate: sr, confidence },
      });
      playbookTelemetry.promotedCount += 1;
      playbookLog.info("promoteVersionIfEligible marked", { playbookId });
      return true;
    }
  }
  return false;
}

export async function demoteIfUnderperforming(playbookId: string): Promise<boolean> {
  const pb = await repo.getMemoryPlaybookById(playbookId);
  if (!pb) return false;

  await recalculatePlaybookStats(playbookId);
  const refreshed = (await repo.getMemoryPlaybookById(playbookId)) as MemoryPlaybook & {
    totalExecutions: number;
    successfulExecutions: number;
  };

  const executions = refreshed.totalExecutions;
  const sr =
    executions > 0 ? refreshed.successfulExecutions / Math.max(1, executions) : 1;

  if (executions >= 10 && sr < 0.45) {
    await repo.updateMemoryPlaybook(playbookId, {
      status: "PAUSED",
      lastDemotedAt: new Date(),
    });
    await repo.createLifecycleEvent({
      playbook: { connect: { id: playbookId } },
      eventType: "demote_underperform",
      reason: "success_rate_below_threshold",
      payload: { executions, successRate: sr },
    });
    playbookTelemetry.demotedCount += 1;
    playbookLog.warn("demoteIfUnderperforming paused playbook", { playbookId });
    return true;
  }
  return false;
}

export async function promotePlaybookVersion(playbookId: string, versionId: string): Promise<void> {
  const v = await prisma.memoryPlaybookVersion.findFirst({
    where: { id: versionId, playbookId },
  });
  if (!v) throw new Error("version_not_found");

  await prisma.$transaction(async (tx) => {
    await tx.memoryPlaybookVersion.updateMany({
      where: { playbookId },
      data: { isActive: false },
    });
    await tx.memoryPlaybookVersion.update({
      where: { id: versionId },
      data: { isActive: true, promotedAt: new Date() },
    });
    await tx.memoryPlaybook.update({
      where: { id: playbookId },
      data: { currentVersionId: versionId, lastPromotedAt: new Date(), status: "ACTIVE" },
    });
    await tx.memoryPlaybookLifecycleEvent.create({
      data: {
        playbookId,
        playbookVersionId: versionId,
        eventType: "promote_version",
        reason: "manual_api",
      },
    });
  });

  playbookTelemetry.promotedCount += 1;
  playbookLog.info("promotePlaybookVersion", { playbookId, versionId });
}
