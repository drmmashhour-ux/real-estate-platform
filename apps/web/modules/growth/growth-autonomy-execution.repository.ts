/**
 * Persistence for low-risk autonomy executions — audit + undo only.
 */

import { prisma } from "@/lib/db";

export async function createGrowthAutonomyLowRiskExecutionRow(args: {
  operatorUserId: string | null;
  catalogEntryId: string;
  lowRiskActionKey: string;
  dispositionLabel: string;
  explanation: string;
  operatorVisibleResult: string;
  undoAvailable: boolean;
  payload: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const row = await prisma.growthAutonomyLowRiskExecution.create({
      data: {
        operatorUserId: args.operatorUserId,
        catalogEntryId: args.catalogEntryId,
        lowRiskActionKey: args.lowRiskActionKey,
        dispositionLabel: args.dispositionLabel,
        explanation: args.explanation,
        operatorVisibleResult: args.operatorVisibleResult,
        undoAvailable: args.undoAvailable,
        payload: args.payload,
      },
    });
    return row.id;
  } catch {
    return null;
  }
}

export async function findRecentExecutionForDedupe(args: {
  operatorUserId: string;
  catalogEntryId: string;
  since: Date;
}): Promise<{ id: string } | null> {
  try {
    const row = await prisma.growthAutonomyLowRiskExecution.findFirst({
      where: {
        operatorUserId: args.operatorUserId,
        catalogEntryId: args.catalogEntryId,
        reversedAt: null,
        createdAt: { gte: args.since },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    return row;
  } catch {
    return null;
  }
}

export async function reverseGrowthAutonomyLowRiskExecution(args: {
  auditId: string;
  operatorUserId: string;
}): Promise<boolean> {
  try {
    const r = await prisma.growthAutonomyLowRiskExecution.updateMany({
      where: {
        id: args.auditId,
        operatorUserId: args.operatorUserId,
        reversedAt: null,
        undoAvailable: true,
      },
      data: { reversedAt: new Date() },
    });
    return r.count > 0;
  } catch {
    return false;
  }
}

export async function listRecentGrowthAutonomyLowRiskExecutions(args: {
  operatorUserId: string;
  limit: number;
}): Promise<
  Array<{
    id: string;
    createdAt: Date;
    catalogEntryId: string;
    lowRiskActionKey: string;
    explanation: string;
    operatorVisibleResult: string;
    undoAvailable: boolean;
    reversedAt: Date | null;
  }>
> {
  try {
    return await prisma.growthAutonomyLowRiskExecution.findMany({
      where: { operatorUserId: args.operatorUserId },
      orderBy: { createdAt: "desc" },
      take: args.limit,
      select: {
        id: true,
        createdAt: true,
        catalogEntryId: true,
        lowRiskActionKey: true,
        explanation: true,
        operatorVisibleResult: true,
        undoAvailable: true,
        reversedAt: true,
      },
    });
  } catch {
    return [];
  }
}
