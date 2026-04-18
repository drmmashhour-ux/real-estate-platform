"use server";

import type { Prisma } from "@prisma/client";
import { operatorLayerFlags, operatorV2Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { buildAssistantRecommendationFeed } from "@/modules/operator/assistant-aggregator.service";
import type { AssistantFeedResponse } from "@/modules/operator/assistant-aggregator.service";
import * as externalSyncRepo from "@/modules/operator/operator-external-sync.repository";
import {
  executeApprovedBudgetSync,
  simulateApprovedBudgetSync,
} from "@/modules/operator/operator-v2-execution.service";
import type { ExternalAdProvider } from "@/modules/operator/operator-v2.types";
import * as operatorRepo from "@/modules/operator/operator.repository";

async function requireAdminForApprovals(): Promise<string> {
  if (!operatorLayerFlags.operatorApprovalsV1) {
    throw new Error("Operator approvals are disabled (FEATURE_OPERATOR_APPROVALS_V1).");
  }
  const s = await requireAdminSession();
  if (!s.ok) throw new Error(s.error);
  return s.userId;
}

export async function approveRecommendation(recommendationId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const reviewerUserId = await requireAdminForApprovals();
    const log = await prisma.operatorRecommendationLog.findUnique({ where: { id: recommendationId } });
    if (!log) return { ok: false, error: "Recommendation not found — refresh the feed." };
    await prisma.operatorRecommendationApproval.create({
      data: {
        recommendationId,
        status: "APPROVED",
        reviewerUserId,
        reviewerNote: note ?? undefined,
      },
    });
    await operatorRepo.recordRecommendationOutcome({
      recommendationId,
      approved: true,
      metadata: { reviewerUserId, kind: "approve" },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to approve" };
  }
}

export async function dismissRecommendation(recommendationId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const reviewerUserId = await requireAdminForApprovals();
    const log = await prisma.operatorRecommendationLog.findUnique({ where: { id: recommendationId } });
    if (!log) return { ok: false, error: "Recommendation not found — refresh the feed." };
    await prisma.operatorRecommendationApproval.create({
      data: {
        recommendationId,
        status: "DISMISSED",
        reviewerUserId,
        reviewerNote: note ?? undefined,
      },
    });
    await operatorRepo.recordRecommendationOutcome({
      recommendationId,
      approved: false,
      metadata: { reviewerUserId, kind: "dismiss" },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to dismiss" };
  }
}

/** Marks that the operator performed the action manually in external tools — does not call Stripe, ads APIs, or listing writes. */
export async function markRecommendationExecuted(recommendationId: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const reviewerUserId = await requireAdminForApprovals();
    const log = await prisma.operatorRecommendationLog.findUnique({ where: { id: recommendationId } });
    if (!log) return { ok: false, error: "Recommendation not found — refresh the feed." };
    await prisma.operatorRecommendationApproval.create({
      data: {
        recommendationId,
        status: "EXECUTED",
        reviewerUserId,
        reviewerNote: note ?? undefined,
        metadata: { manualConfirmation: true } as Prisma.InputJsonValue,
      },
    });
    await operatorRepo.recordRecommendationOutcome({
      recommendationId,
      approved: true,
      executed: true,
      success: true,
      metadata: { reviewerUserId, kind: "executed" },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to mark executed" };
  }
}

export async function simulateApprovedBudgetSyncAction(recommendationId: string) {
  try {
    const s = await requireAdminSession();
    if (!s.ok) return { ok: false as const, error: s.error };
    if (!operatorV2Flags.operatorV2BudgetSyncV1) {
      return { ok: false as const, error: "Operator V2 budget sync is disabled." };
    }
    const out = await simulateApprovedBudgetSync(recommendationId);
    return { ok: true as const, result: out };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Simulation failed" };
  }
}

export async function executeApprovedBudgetSyncAction(recommendationId: string) {
  try {
    const s = await requireAdminSession();
    if (!s.ok) return { ok: false as const, error: s.error };
    if (!operatorV2Flags.operatorV2BudgetSyncV1) {
      return { ok: false as const, error: "Operator V2 budget sync is disabled." };
    }
    const out = await executeApprovedBudgetSync(recommendationId);
    return {
      ok: true as const,
      result: out,
      actorUserId: s.userId,
    };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Execute failed" };
  }
}

export async function upsertCampaignProviderMappingAction(input: {
  campaignId: string;
  provider: ExternalAdProvider;
  externalCampaignId: string;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    const s = await requireAdminSession();
    if (!s.ok) return { ok: false as const, error: s.error };
    if (input.provider !== "META" && input.provider !== "GOOGLE") {
      return { ok: false as const, error: "Provider must be META or GOOGLE." };
    }
    const row = await externalSyncRepo.upsertCampaignProviderLink({
      campaignId: input.campaignId,
      provider: input.provider,
      externalCampaignId: input.externalCampaignId,
      status: input.status,
      metadata: input.metadata,
    });
    return { ok: true as const, id: row.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Upsert failed" };
  }
}

export async function listRecommendationFeed(): Promise<AssistantFeedResponse | { error: string }> {
  try {
    if (!operatorLayerFlags.aiAssistantLayerV1) {
      return { error: "AI Assistant layer is disabled." };
    }
    await requireAuthenticatedUser();
    return await buildAssistantRecommendationFeed({ persist: false });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to load feed" };
  }
}
