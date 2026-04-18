import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PLATFORM_CORE_AUDIT } from "./platform-core.constants";
import type {
  CoreApprovalRecord,
  CoreAuditEvent,
  CoreDecisionLifecycle,
  CoreDecisionRecord,
  CoreDecisionStatus,
  CoreEntityType,
  CoreSystemSource,
  CoreTaskRecord,
  CoreTaskStatus,
} from "./platform-core.types";

const LIFECYCLE_KEY = "lifecycleHistory";

function appendLifecycleToMetadata(
  base: Record<string, unknown>,
  status: string,
  reason?: string | null,
): Record<string, unknown> {
  const raw = base[LIFECYCLE_KEY];
  const prev = Array.isArray(raw)
    ? [...raw].filter((x): x is Record<string, unknown> => x !== null && typeof x === "object" && !Array.isArray(x))
    : [];
  prev.push({
    status,
    changedAt: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  });
  return { ...base, [LIFECYCLE_KEY]: prev };
}

export type CreateDecisionInput = {
  source: CoreSystemSource;
  entityType: CoreEntityType;
  entityId?: string | null;
  title: string;
  summary: string;
  reason: string;
  confidenceScore: number;
  evidenceScore?: number | null;
  status: CoreDecisionStatus;
  actionType: string;
  expectedImpact?: string | null;
  warnings?: string[];
  blockers?: string[];
  metadata?: Record<string, unknown>;
};

export type CreateTaskInput = {
  taskType: string;
  source: CoreSystemSource;
  entityType: CoreEntityType;
  entityId?: string | null;
  payload: Record<string, unknown>;
  status?: CoreTaskStatus;
  metadata?: Record<string, unknown>;
};

export type CreateAuditInput = {
  eventType: string;
  source: CoreSystemSource;
  entityType?: CoreEntityType | null;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
};

export type CreateApprovalInput = {
  decisionId: string;
  status: string;
  reviewerUserId?: string | null;
  reviewerNote?: string | null;
  metadata?: Record<string, unknown>;
};

export type ListDecisionsFilters = {
  status?: CoreDecisionStatus;
  source?: CoreSystemSource;
  limit?: number;
};

export type ListTasksFilters = {
  status?: CoreTaskStatus;
  source?: CoreSystemSource;
  limit?: number;
};

export type ListAuditFilters = {
  eventType?: string;
  source?: CoreSystemSource;
  entityType?: CoreEntityType;
  entityId?: string | null;
  limit?: number;
};

function rowToDecision(r: {
  id: string;
  source: string;
  entityType: string;
  entityId: string | null;
  title: string;
  summary: string;
  reason: string;
  confidenceScore: number;
  evidenceScore: number | null;
  status: string;
  actionType: string;
  expectedImpact: string | null;
  warnings: unknown;
  blockers: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CoreDecisionRecord {
  return {
    id: r.id,
    source: r.source as CoreSystemSource,
    entityType: r.entityType as CoreEntityType,
    entityId: r.entityId,
    title: r.title,
    summary: r.summary,
    reason: r.reason,
    confidenceScore: r.confidenceScore,
    evidenceScore: r.evidenceScore,
    status: r.status as CoreDecisionStatus,
    actionType: r.actionType,
    expectedImpact: r.expectedImpact,
    warnings: Array.isArray(r.warnings) ? (r.warnings as string[]) : undefined,
    blockers: Array.isArray(r.blockers) ? (r.blockers as string[]) : undefined,
    metadata: r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function rowToTask(r: {
  id: string;
  taskType: string;
  source: string;
  entityType: string;
  entityId: string | null;
  payload: unknown;
  status: string;
  attemptCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CoreTaskRecord {
  return {
    id: r.id,
    taskType: r.taskType,
    source: r.source as CoreSystemSource,
    entityType: r.entityType as CoreEntityType,
    entityId: r.entityId,
    payload: typeof r.payload === "object" && r.payload !== null ? (r.payload as Record<string, unknown>) : {},
    status: r.status as CoreTaskStatus,
    attemptCount: r.attemptCount,
    lastError: r.lastError,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function rowToAudit(r: {
  id: string;
  eventType: string;
  source: string;
  entityType: string | null;
  entityId: string | null;
  message: string;
  metadata: unknown;
  createdAt: Date;
}): CoreAuditEvent {
  return {
    id: r.id,
    eventType: r.eventType,
    source: r.source as CoreSystemSource,
    entityType: (r.entityType as CoreEntityType) ?? null,
    entityId: r.entityId,
    message: r.message,
    metadata: r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : undefined,
    createdAt: r.createdAt.toISOString(),
  };
}

function rowToApproval(r: {
  id: string;
  decisionId: string;
  status: string;
  reviewerUserId: string | null;
  reviewerNote: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): CoreApprovalRecord {
  return {
    id: r.id,
    decisionId: r.decisionId,
    status: r.status,
    reviewerUserId: r.reviewerUserId,
    reviewerNote: r.reviewerNote,
    metadata: r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createDecision(input: CreateDecisionInput): Promise<{ id: string }> {
  const row = await prisma.platformCoreDecision.create({
    data: {
      source: input.source,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      title: input.title,
      summary: input.summary,
      reason: input.reason,
      confidenceScore: input.confidenceScore,
      evidenceScore: input.evidenceScore ?? undefined,
      status: input.status,
      actionType: input.actionType,
      expectedImpact: input.expectedImpact ?? undefined,
      warnings: input.warnings ? (input.warnings as Prisma.InputJsonValue) : undefined,
      blockers: input.blockers ? (input.blockers as Prisma.InputJsonValue) : undefined,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
    select: { id: true },
  });
  return row;
}

export async function updateDecisionStatus(
  id: string,
  status: CoreDecisionStatus,
  opts?: {
    metadata?: Record<string, unknown> | null;
    mergeMetadata?: boolean;
    auditEventType?: string;
    auditMessage?: string;
    /** Appended to lifecycle entry alongside status transition. */
    lifecycleReason?: string | null;
  },
): Promise<CoreDecisionRecord> {
  const existing = await prisma.platformCoreDecision.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Platform core decision not found: ${id}`);
  }

  const prevMeta =
    existing.metadata && typeof existing.metadata === "object" ? (existing.metadata as Record<string, unknown>) : {};
  const lifecycleReason = opts?.lifecycleReason ?? opts?.auditMessage ?? null;
  const rawPrevLife = prevMeta[LIFECYCLE_KEY];
  const prevLifecycle = Array.isArray(rawPrevLife)
    ? [...rawPrevLife].filter((x): x is Record<string, unknown> => x !== null && typeof x === "object" && !Array.isArray(x))
    : [];

  let baseForLifecycle: Record<string, unknown>;
  if (opts?.metadata === undefined) {
    baseForLifecycle = { ...prevMeta };
  } else if (opts.mergeMetadata) {
    baseForLifecycle = { ...prevMeta, ...opts.metadata };
  } else {
    baseForLifecycle = { ...opts.metadata, [LIFECYCLE_KEY]: prevLifecycle };
  }

  const nextMeta = appendLifecycleToMetadata(baseForLifecycle, status, lifecycleReason);

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.platformCoreDecision.update({
      where: { id },
      data: {
        status,
        metadata: nextMeta as Prisma.InputJsonValue,
      },
    });

    await tx.platformCoreAuditEvent.create({
      data: {
        eventType: opts?.auditEventType ?? PLATFORM_CORE_AUDIT.DECISION_STATUS,
        source: u.source,
        entityType: u.entityType,
        entityId: u.entityId,
        message:
          opts?.auditMessage ?? `Decision ${id} status → ${status}`,
        metadata: {
          previousStatus: existing.status,
          newStatus: status,
        } as Prisma.InputJsonValue,
      },
    });

    return u;
  });

  return rowToDecision(updated);
}

/** Append a lifecycle checkpoint without changing `CoreDecisionRecord.status` (e.g. scheduler notes). */
export async function appendLifecycleEvent(
  id: string,
  status: string,
  reason?: string | null,
): Promise<CoreDecisionRecord> {
  const existing = await prisma.platformCoreDecision.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Platform core decision not found: ${id}`);
  }
  const prevMeta =
    existing.metadata && typeof existing.metadata === "object" ? (existing.metadata as Record<string, unknown>) : {};
  const nextMeta = appendLifecycleToMetadata({ ...prevMeta }, status, reason ?? undefined);
  const updated = await prisma.platformCoreDecision.update({
    where: { id },
    data: { metadata: nextMeta as Prisma.InputJsonValue },
  });
  return rowToDecision(updated);
}

export async function getDecisionLifecycle(decisionId: string): Promise<CoreDecisionLifecycle | null> {
  const row = await prisma.platformCoreDecision.findUnique({
    where: { id: decisionId },
    select: { id: true, metadata: true },
  });
  if (!row) return null;
  const meta = row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {};
  const raw = meta[LIFECYCLE_KEY];
  const stateHistory = Array.isArray(raw)
    ? (raw as { status: string; changedAt: string; reason?: string }[]).filter(
        (e) => typeof e?.status === "string" && typeof e?.changedAt === "string",
      )
    : [];
  return { decisionId: row.id, stateHistory };
}

export async function listDecisions(filters?: ListDecisionsFilters): Promise<CoreDecisionRecord[]> {
  const limit = Math.min(filters?.limit ?? 80, 200);
  const rows = await prisma.platformCoreDecision.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.source ? { source: filters.source } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(rowToDecision);
}

export async function getDecisionById(id: string): Promise<CoreDecisionRecord | null> {
  const row = await prisma.platformCoreDecision.findUnique({ where: { id } });
  if (!row) return null;
  return rowToDecision(row);
}

/** Deduplicate Ads V4 → Platform Core ingests (same loop key or same entity+action within window). */
export async function findDecisionByAdsIngestDedupeKey(key: string): Promise<CoreDecisionRecord | null> {
  const since = new Date(Date.now() - 72 * 3600 * 1000);
  const rows = await prisma.platformCoreDecision.findMany({
    where: { source: "ADS", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  for (const r of rows) {
    const m = r.metadata && typeof r.metadata === "object" ? (r.metadata as Record<string, unknown>) : {};
    if (m.adsIngestDedupeKey === key) return rowToDecision(r);
  }
  return null;
}

export async function findRecentDuplicateAdsDecision(input: CreateDecisionInput): Promise<CoreDecisionRecord | null> {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const entityClause =
    input.entityId === null || input.entityId === undefined ? { entityId: null } : { entityId: input.entityId };
  const row = await prisma.platformCoreDecision.findFirst({
    where: {
      source: "ADS",
      actionType: input.actionType,
      createdAt: { gte: since },
      ...entityClause,
    },
    orderBy: { createdAt: "desc" },
  });
  return row ? rowToDecision(row) : null;
}

export async function createTask(input: CreateTaskInput): Promise<{ id: string }> {
  const row = await prisma.platformCoreTask.create({
    data: {
      taskType: input.taskType,
      source: input.source,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      payload: input.payload as Prisma.InputJsonValue,
      status: input.status ?? "QUEUED",
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
    select: { id: true },
  });
  return row;
}

export async function updateTaskStatus(
  id: string,
  status: CoreTaskStatus,
  opts?: { lastError?: string | null; metadata?: Record<string, unknown>; incrementAttempt?: boolean },
): Promise<CoreTaskRecord> {
  const existing = await prisma.platformCoreTask.findUnique({ where: { id } });
  if (!existing) {
    throw new Error(`Platform core task not found: ${id}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.platformCoreTask.update({
      where: { id },
      data: {
        status,
        lastError: opts?.lastError === undefined ? undefined : opts.lastError,
        attemptCount: opts?.incrementAttempt ? { increment: 1 } : undefined,
        ...(opts?.metadata ? { metadata: opts.metadata as Prisma.InputJsonValue } : {}),
      },
    });

    await tx.platformCoreAuditEvent.create({
      data: {
        eventType: PLATFORM_CORE_AUDIT.TASK_STATUS,
        source: u.source,
        entityType: u.entityType,
        entityId: u.entityId,
        message: `Task ${id} → ${status}`,
        metadata: { previousStatus: existing.status, newStatus: status } as Prisma.InputJsonValue,
      },
    });

    return u;
  });

  return rowToTask(updated);
}

export async function listTasks(filters?: ListTasksFilters): Promise<CoreTaskRecord[]> {
  const limit = Math.min(filters?.limit ?? 80, 200);
  const rows = await prisma.platformCoreTask.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.source ? { source: filters.source } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(rowToTask);
}

export async function createAuditEvent(input: CreateAuditInput): Promise<{ id: string }> {
  const row = await prisma.platformCoreAuditEvent.create({
    data: {
      eventType: input.eventType,
      source: input.source,
      entityType: input.entityType ?? undefined,
      entityId: input.entityId ?? undefined,
      message: input.message,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
    select: { id: true },
  });
  return row;
}

export async function listAuditEvents(filters?: ListAuditFilters): Promise<CoreAuditEvent[]> {
  const limit = Math.min(filters?.limit ?? 100, 300);
  const rows = await prisma.platformCoreAuditEvent.findMany({
    where: {
      ...(filters?.eventType ? { eventType: filters.eventType } : {}),
      ...(filters?.source ? { source: filters.source } : {}),
      ...(filters?.entityType ? { entityType: filters.entityType } : {}),
      ...(filters?.entityId !== undefined ? { entityId: filters.entityId ?? undefined } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(rowToAudit);
}

export async function createApproval(input: CreateApprovalInput): Promise<{ id: string }> {
  const row = await prisma.platformCoreApproval.create({
    data: {
      decisionId: input.decisionId,
      status: input.status,
      reviewerUserId: input.reviewerUserId ?? undefined,
      reviewerNote: input.reviewerNote ?? undefined,
      metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
    },
    select: { id: true },
  });
  return row;
}

export async function listApprovalsForDecision(decisionId: string): Promise<CoreApprovalRecord[]> {
  const rows = await prisma.platformCoreApproval.findMany({
    where: { decisionId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToApproval);
}
