import type { AutonomousDomain } from "./autonomous-growth.types";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type CreateAutonomousRunInput = {
  status: string;
  domains: AutonomousDomain[];
  recommendationCount: number;
  decisionCount: number;
  executableCount: number;
  blockedCount: number;
  approvalRequiredCount: number;
  notes?: string[];
  metadata?: Record<string, unknown> | null;
};

export type AutonomousRunEventRow = {
  stage: string;
  recommendationId?: string | null;
  actionType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
};

export type AutonomousPolicyStateRow = {
  policyKey: string;
  isEnabled: boolean;
  metadata?: Record<string, unknown> | null;
};

export async function createAutonomousRun(input: CreateAutonomousRunInput) {
  return prisma.autonomousGrowthRun.create({
    data: {
      status: input.status,
      domains: input.domains as unknown as Prisma.InputJsonValue,
      recommendationCount: input.recommendationCount,
      decisionCount: input.decisionCount,
      executableCount: input.executableCount,
      blockedCount: input.blockedCount,
      approvalRequiredCount: input.approvalRequiredCount,
      notes: (input.notes ?? []) as unknown as Prisma.InputJsonValue,
      metadata: input.metadata === undefined ? undefined : (input.metadata as Prisma.InputJsonValue),
    },
  });
}

export async function updateAutonomousRunStatus(
  id: string,
  status: string,
  metadata?: Record<string, unknown> | null,
) {
  return prisma.autonomousGrowthRun.update({
    where: { id },
    data: {
      status,
      ...(metadata !== undefined ?
        {
          metadata: metadata as Prisma.InputJsonValue,
        }
      : {}),
    },
  });
}

export async function appendAutonomousRunEvents(runId: string, rows: AutonomousRunEventRow[]) {
  if (rows.length === 0) return { count: 0 };
  const result = await prisma.autonomousGrowthRunEvent.createMany({
    data: rows.map((r) => ({
      runId,
      stage: r.stage,
      recommendationId: r.recommendationId ?? null,
      actionType: r.actionType ?? null,
      entityType: r.entityType ?? null,
      entityId: r.entityId ?? null,
      message: r.message,
      metadata: r.metadata === undefined ? undefined : (r.metadata as Prisma.InputJsonValue),
    })),
  });
  return result;
}

export async function getAutonomousRunById(id: string) {
  const row = await prisma.autonomousGrowthRun.findUnique({ where: { id } });
  if (!row) {
    throw new Error(`AutonomousGrowthRun not found: ${id}`);
  }
  return row;
}

export async function listRecentAutonomousRuns(limit = 20) {
  const take = Math.min(Math.max(1, limit), 100);
  return prisma.autonomousGrowthRun.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listAutonomousRunEvents(runId: string, limit = 200) {
  const take = Math.min(Math.max(1, limit), 500);
  return prisma.autonomousGrowthRunEvent.findMany({
    where: { runId },
    orderBy: { createdAt: "asc" },
    take,
  });
}

export async function upsertAutonomousPolicyStates(rows: AutonomousPolicyStateRow[]) {
  if (rows.length === 0) return [];
  const out = [];
  for (const r of rows) {
    const row = await prisma.autonomousGrowthPolicyState.upsert({
      where: { policyKey: r.policyKey },
      create: {
        policyKey: r.policyKey,
        isEnabled: r.isEnabled,
        metadata: r.metadata === undefined ? undefined : (r.metadata as Prisma.InputJsonValue),
      },
      update: {
        isEnabled: r.isEnabled,
        ...(r.metadata !== undefined ? { metadata: r.metadata as Prisma.InputJsonValue } : {}),
      },
    });
    out.push(row);
  }
  return out;
}

export async function getAutonomousPolicyStates() {
  return prisma.autonomousGrowthPolicyState.findMany({
    orderBy: { policyKey: "asc" },
  });
}
