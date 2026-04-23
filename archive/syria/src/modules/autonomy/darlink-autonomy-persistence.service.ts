/**
 * Syria-local persistence for autonomy runs, approvals, audit, action records — never throws.
 */

import type { SyriaMarketplaceActionOutcome, SyriaMarketplaceAutonomyRunStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { DarlinkAutonomyAuditEvent } from "./darlink-autonomy-audit.types";

export async function persistAutonomyAuditEvent(params: {
  runId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
  actorUserId?: string | null;
}): Promise<void> {
  try {
    await prisma.syriaMarketplaceAutonomyAuditLog.create({
      data: {
        runId: params.runId ?? undefined,
        eventType: params.eventType,
        payloadJson: (params.payload ?? {}) as object,
        actorUserId: params.actorUserId ?? undefined,
      },
    });
  } catch {
    /* persistence must not throw */
  }
}

export async function createAutonomyRunRecord(params: {
  dryRun: boolean;
  autonomyModeLabel: string;
  governanceModeLabel: string;
  entityScope: string;
  entityId?: string | null;
}): Promise<string | null> {
  try {
    const row = await prisma.syriaMarketplaceAutonomyRun.create({
      data: {
        dryRun: params.dryRun,
        autonomyModeLabel: params.autonomyModeLabel,
        governanceModeLabel: params.governanceModeLabel,
        entityScope: params.entityScope,
        entityId: params.entityId ?? undefined,
        status: "RUNNING",
      },
    });
    await persistAutonomyAuditEvent({
      runId: row.id,
      eventType: DarlinkAutonomyAuditEvent.RUN_STARTED,
      payload: { dryRun: params.dryRun, entityScope: params.entityScope },
    });
    return row.id;
  } catch {
    return null;
  }
}

export async function finalizeAutonomyRunRecord(params: {
  runId: string;
  status: SyriaMarketplaceAutonomyRunStatus;
  signalsCount: number;
  opportunitiesCount: number;
  proposalsCount: number;
  executedCount: number;
  blockedCount: number;
  summary?: Record<string, unknown>;
  errorNotes?: string | null;
}): Promise<void> {
  try {
    await prisma.syriaMarketplaceAutonomyRun.update({
      where: { id: params.runId },
      data: {
        finishedAt: new Date(),
        status: params.status,
        signalsCount: params.signalsCount,
        opportunitiesCount: params.opportunitiesCount,
        proposalsCount: params.proposalsCount,
        executedCount: params.executedCount,
        blockedCount: params.blockedCount,
        summaryJson: params.summary ? (params.summary as object) : undefined,
        errorNotes: params.errorNotes ?? undefined,
      },
    });
  } catch {
    /* no throw */
  }
}

export async function recordAutonomyActionOutcome(params: {
  runId?: string | null;
  approvalId?: string | null;
  actionType: string;
  targetEntityId?: string | null;
  dryRun: boolean;
  outcome: SyriaMarketplaceActionOutcome;
  detail?: Record<string, unknown>;
  rollbackOfId?: string | null;
}): Promise<string | null> {
  try {
    const row = await prisma.syriaMarketplaceAutonomyActionRecord.create({
      data: {
        runId: params.runId ?? undefined,
        approvalId: params.approvalId ?? undefined,
        actionType: params.actionType,
        targetEntityId: params.targetEntityId ?? undefined,
        dryRun: params.dryRun,
        outcome: params.outcome,
        detailJson: params.detail ? (params.detail as object) : undefined,
        rollbackOfId: params.rollbackOfId ?? undefined,
      },
    });
    return row.id;
  } catch {
    return null;
  }
}
