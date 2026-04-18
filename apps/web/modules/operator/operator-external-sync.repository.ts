import { prisma } from "@/lib/db";
import type { ExternalAdProvider, ExternalSyncResult } from "./operator-v2.types";

export type UpsertCampaignProviderLinkInput = {
  campaignId: string;
  provider: ExternalAdProvider | string;
  externalCampaignId: string;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type SaveBudgetExecutionSnapshotInput = {
  campaignId: string;
  provider: string;
  currentBudget: number;
  proposedBudget: number;
  cappedBudget?: number | null;
  currency: string;
  confidenceScore: number;
  profitStatus?: string | null;
  approvalStatus: string;
  executionMode: string;
  metadata?: Record<string, unknown> | null;
};

export type LogExternalSyncInput = {
  recommendationId?: string | null;
  actionType: string;
  provider: string;
  targetId?: string | null;
  externalTargetId?: string | null;
  dryRun: boolean;
  success: boolean;
  message: string;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  warnings?: string[] | null;
};

function stripSecrets(obj: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!obj || typeof obj !== "object") return null;
  const out: Record<string, unknown> = {};
  const secretKeys = /token|secret|password|authorization|api[_-]?key|credential/i;
  for (const [k, v] of Object.entries(obj)) {
    if (secretKeys.test(k)) continue;
    out[k] = v;
  }
  return out;
}

export async function upsertCampaignProviderLink(input: UpsertCampaignProviderLinkInput) {
  return prisma.operatorCampaignProviderLink.upsert({
    where: {
      campaignId_provider: {
        campaignId: input.campaignId,
        provider: String(input.provider),
      },
    },
    create: {
      campaignId: input.campaignId,
      provider: String(input.provider),
      externalCampaignId: input.externalCampaignId,
      status: input.status ?? null,
      metadata: input.metadata === undefined ? undefined : (input.metadata as object),
    },
    update: {
      externalCampaignId: input.externalCampaignId,
      status: input.status !== undefined ? input.status : undefined,
      metadata: input.metadata === undefined ? undefined : (input.metadata as object),
    },
  });
}

export async function getCampaignProviderLink(campaignId: string, provider: string) {
  return prisma.operatorCampaignProviderLink.findUnique({
    where: { campaignId_provider: { campaignId, provider } },
  });
}

export async function saveBudgetExecutionSnapshot(input: SaveBudgetExecutionSnapshotInput) {
  return prisma.operatorBudgetExecutionSnapshot.create({
    data: {
      campaignId: input.campaignId,
      provider: input.provider,
      currentBudget: input.currentBudget,
      proposedBudget: input.proposedBudget,
      cappedBudget: input.cappedBudget ?? null,
      currency: input.currency,
      confidenceScore: input.confidenceScore,
      profitStatus: input.profitStatus ?? null,
      approvalStatus: input.approvalStatus,
      executionMode: input.executionMode,
      metadata: input.metadata === undefined ? undefined : (input.metadata as object),
    },
  });
}

export async function logExternalSync(input: LogExternalSyncInput) {
  return prisma.operatorExternalSyncLog.create({
    data: {
      recommendationId: input.recommendationId ?? null,
      actionType: input.actionType,
      provider: input.provider,
      targetId: input.targetId ?? null,
      externalTargetId: input.externalTargetId ?? null,
      dryRun: input.dryRun,
      success: input.success,
      message: input.message,
      requestPayload: stripSecrets(input.requestPayload ?? undefined) as object | undefined,
      responsePayload: stripSecrets(input.responsePayload ?? undefined) as object | undefined,
      warnings: input.warnings?.length ? (input.warnings as unknown as object) : undefined,
    },
  });
}

export async function listRecentExternalSyncLogs(limit = 50) {
  return prisma.operatorExternalSyncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
}

export async function getExternalSyncLogById(id: string) {
  return prisma.operatorExternalSyncLog.findUnique({ where: { id } });
}

export async function listCampaignProviderLinks() {
  return prisma.operatorCampaignProviderLink.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export type LatestSyncSummary = {
  message: string;
  dryRun: boolean;
  success: boolean;
  createdAt: string;
  provider: string;
};

/** Latest log per recommendation id (for dashboard UI). */
export async function getLatestSyncLogsForRecommendations(
  recommendationIds: string[],
): Promise<Record<string, LatestSyncSummary>> {
  if (recommendationIds.length === 0) return {};
  const rows = await prisma.operatorExternalSyncLog.findMany({
    where: { recommendationId: { in: [...new Set(recommendationIds)] } },
    orderBy: { createdAt: "desc" },
  });
  const out: Record<string, LatestSyncSummary> = {};
  for (const r of rows) {
    const rid = r.recommendationId;
    if (!rid || out[rid]) continue;
    out[rid] = {
      message: r.message,
      dryRun: r.dryRun,
      success: r.success,
      createdAt: r.createdAt.toISOString(),
      provider: r.provider,
    };
  }
  return out;
}

export function externalSyncResultToLogPayload(result: ExternalSyncResult): Record<string, unknown> {
  return {
    success: result.success,
    provider: result.provider,
    action: result.action,
    externalCampaignId: result.externalCampaignId,
    targetId: result.targetId,
    dryRun: result.dryRun,
    message: result.message,
    warnings: result.warnings,
    createdAt: result.createdAt,
  };
}
