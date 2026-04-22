import {
  BnhubGrowthEngineRecommendationStatus,
  BnhubGrowthEngineRecommendationType,
  BnhubGrowthEngineRecommendationPriority,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { createNotification } from "@/modules/notifications/services/create-notification";

import { queueGrowthActionForApproval } from "./growth-approval.service";
import { snapshotEntityMetrics } from "./growth-performance.service";
import { recordLearningUpdate } from "./growth-learning.service";
import type { GrowthAutonomyMode, GrowthProposedActionVm } from "./growth-engine.types";
import {
  shouldAutoExecuteSafeActions,
  shouldSuggestOnly,
  requiresApprovalForAllActions,
  engineIsOff,
} from "./growth-autonomy.service";

const BOOST_CAP = 8;
const RANK_BUMP = 3;
const DISCOVERY_BUMP = 2;

export type ExecuteResult = {
  status: "auto_executed" | "queued_approval" | "assist_only" | "skipped" | "failed";
  logId?: string;
  error?: string;
  approvalId?: string;
};

/**
 * Execute a single proposed action with safety gates. Price / major copy never auto-applied.
 */
export async function executeProposedAction(
  action: GrowthProposedActionVm,
  runBatchId: string,
  mode: GrowthAutonomyMode,
  dryRun: boolean,
): Promise<ExecuteResult> {
  const suggest = shouldSuggestOnly(mode);
  const manualAll = requiresApprovalForAllActions(mode);

  try {
    if (action.action === "adjust_price" || action.action === "suggest_content_improvement") {
      const id = await queueGrowthActionForApproval(action, runBatchId);
      await writeActionLog({
        runBatchId,
        action,
        autonomyMode: mode,
        riskTier: "approval_required",
        status: "queued_approval",
        explanation: `${action.explanation} (financial or content impact — queued for admin review).`,
        approvalId: id,
        dryRun,
      });
      return { status: "queued_approval", approvalId: id };
    }

    /** Every execution path requires human approval — no auto mutations. */
    if (manualAll && !dryRun) {
      const id = await queueGrowthActionForApproval(action, runBatchId);
      await writeActionLog({
        runBatchId,
        action,
        autonomyMode: mode,
        riskTier: "approval_required",
        status: "queued_approval",
        explanation: `${action.explanation} — FULL_AUTOPILOT_APPROVAL: queued for admin approval.`,
        approvalId: id,
        dryRun,
      });
      return { status: "queued_approval", approvalId: id };
    }

    if (suggest) {
      await writeActionLog({
        runBatchId,
        action,
        autonomyMode: mode,
        riskTier: "assist_proposal",
        status: "assist_only",
        explanation: `${action.explanation} — ASSIST/OFF: logged proposal only (no mutations).`,
        dryRun,
      });
      return { status: "assist_only" };
    }

    if (!shouldAutoExecuteSafeActions(mode) || dryRun || action.riskTier !== "safe_auto") {
      await writeActionLog({
        runBatchId,
        action,
        autonomyMode: mode,
        riskTier: String(action.riskTier),
        status: "skipped",
        explanation: dryRun ? `Dry-run: ${action.explanation}` : `${action.explanation} (skipped by mode/risk).`,
        dryRun,
      });
      return { status: "skipped" };
    }

    const metricsBefore = await snapshotEntityMetrics(action.entityKind, action.entityId);
    let reversible: Record<string, unknown> | undefined;
    let result: Record<string, unknown> = { ok: true };

    switch (action.action) {
      case "promote_listing":
        reversible = await executePromote(action);
        result = reversible;
        break;
      case "reorder_listing_rank":
        reversible = await executeReorder(action);
        result = reversible;
        break;
      case "highlight_listing":
        reversible = await executeHighlight(action);
        result = reversible;
        break;
      case "trigger_notification":
        await executeOwnerNotification(action);
        result = { notified: true };
        break;
      case "send_user_prompt":
        await executeUserPrompt(action);
        result = { promptSent: true };
        break;
      default:
        await writeActionLog({
          runBatchId,
          action,
          autonomyMode: mode,
          riskTier: "blocked",
          status: "skipped",
          explanation: `Unsupported auto action: ${action.action}`,
          dryRun,
        });
        return { status: "skipped" };
    }

    const logRow = await writeActionLog({
      runBatchId,
      action,
      autonomyMode: mode,
      riskTier: "safe_auto",
      status: "auto_executed",
      explanation: action.explanation,
      reversibleJson: reversible,
      resultJson: result,
      dryRun,
      ownerUserId: action.payload?.ownerUserId as string | undefined,
    });

    await prisma.lecipmGrowthEngineOutcome.create({
      data: {
        actionLogId: logRow.id,
        signalCode: action.signal,
        actionCode: action.action,
        metricBefore: metricsBefore as object,
        metricAfter: result as object,
        deltaJson: {},
        measuredAt: new Date(),
      },
    });

    await recordLearningUpdate({
      signalCode: action.signal,
      actionCode: action.action,
      reward: 0.1,
    });

    return { status: "auto_executed", logId: logRow.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "execute_failed";
    await writeActionLog({
      runBatchId,
      action,
      autonomyMode: mode,
      riskTier: "safe_auto",
      status: "failed",
      explanation: `${action.explanation} — error: ${msg}`,
      dryRun,
    });
    return { status: "failed", error: msg };
  }
}

async function executePromote(action: GrowthProposedActionVm): Promise<Record<string, unknown>> {
  if (action.entityKind === "bnhub_listing" && action.entityId) {
    const row = await prisma.bnhubGrowthEngineRecommendation.create({
      data: {
        listingId: action.entityId,
        recommendationType: BnhubGrowthEngineRecommendationType.BOOST_INTERNAL,
        priority: BnhubGrowthEngineRecommendationPriority.HIGH,
        title: "Autopilot discovery boost",
        description: action.explanation,
        actionPayloadJson: { source: "growth_engine", signal: action.signal } as object,
        status: BnhubGrowthEngineRecommendationStatus.OPEN,
      },
    });
    const prev = await prisma.shortTermListing.findUnique({
      where: { id: action.entityId },
      select: { aiDiscoveryScore: true },
    });
    const next = Math.min(100, (prev?.aiDiscoveryScore ?? 40) + DISCOVERY_BUMP);
    await prisma.shortTermListing.update({
      where: { id: action.entityId },
      data: { aiDiscoveryScore: next },
    });
    return { recommendationId: row.id, prevAiDiscoveryScore: prev?.aiDiscoveryScore ?? null, nextAiDiscoveryScore: next };
  }

  if (action.entityKind === "fsbo_listing" && action.entityId) {
    const prev = await prisma.fsboListing.findUnique({
      where: { id: action.entityId },
      select: { featuredBoostScore: true, ownerId: true },
    });
    const next = Math.min(BOOST_CAP, (prev?.featuredBoostScore ?? 0) + 1);
    await prisma.fsboListing.update({
      where: { id: action.entityId },
      data: { featuredBoostScore: next },
    });
    return { prevFeaturedBoost: prev?.featuredBoostScore ?? 0, nextFeaturedBoost: next, ownerId: prev?.ownerId };
  }

  if (action.entityKind === "city_region" && action.payload?.signalContext && typeof action.payload.signalContext === "object") {
    const region = (action.payload.signalContext as { city?: string }).city;
    return { regionalBoostRequested: true, region: region ?? null, note: "rank applies to matching listings in next reorder pass" };
  }

  return { note: "no_entity_for_promote" };
}

async function executeReorder(action: GrowthProposedActionVm): Promise<Record<string, unknown>> {
  if (action.entityKind === "crm_listing" && action.entityId) {
    const prev = await prisma.listingAnalytics.findUnique({
      where: { kind_listingId: { kind: "CRM", listingId: action.entityId } },
    });
    const nextDemand = Math.min(100, (prev?.demandScore ?? 0) + RANK_BUMP);
    await prisma.listingAnalytics.upsert({
      where: { kind_listingId: { kind: "CRM", listingId: action.entityId } },
      create: {
        kind: "CRM",
        listingId: action.entityId,
        demandScore: nextDemand,
      },
      update: { demandScore: nextDemand },
    });
    return { prevDemandScore: prev?.demandScore ?? 0, nextDemandScore: nextDemand };
  }
  if (action.entityKind === "fsbo_listing" && action.entityId) {
    const prev = await prisma.listingAnalytics.findUnique({
      where: { kind_listingId: { kind: "FSBO", listingId: action.entityId } },
    });
    const nextDemand = Math.min(100, (prev?.demandScore ?? 0) + RANK_BUMP);
    await prisma.listingAnalytics.upsert({
      where: { kind_listingId: { kind: "FSBO", listingId: action.entityId } },
      create: {
        kind: "FSBO",
        listingId: action.entityId,
        demandScore: nextDemand,
      },
      update: { demandScore: nextDemand },
    });
    return { prevDemandScore: prev?.demandScore ?? 0, nextDemandScore: nextDemand };
  }
  return { note: "reorder_skipped_no_analytics_row" };
}

async function executeHighlight(action: GrowthProposedActionVm): Promise<Record<string, unknown>> {
  if (action.entityKind === "fsbo_listing" && action.entityId) {
    const row = await prisma.fsboListing.findUnique({
      where: { id: action.entityId },
      select: { experienceTags: true },
    });
    const raw = row?.experienceTags;
    const tags = Array.isArray(raw) ? raw.map(String) : [];
    const next = [...new Set([...tags.map(String), "growth_engine_highlight"])];
    await prisma.fsboListing.update({
      where: { id: action.entityId },
      data: { experienceTags: next },
    });
    return { prevTags: tags, nextTags: next };
  }
  return { highlight: "metadata_only", signal: action.signal };
}

async function executeOwnerNotification(action: GrowthProposedActionVm): Promise<void> {
  if (action.entityKind === "broker_user" && action.entityId) {
    await createNotification({
      userId: action.entityId,
      type: "CRM",
      title: "Pipeline hygiene — growth engine",
      message:
        action.signal === "low_conversion"
          ? "Lead progression is lagging versus peers — review stalled leads and SLAs."
          : action.explanation,
      skipIfDuplicateUnread: true,
      metadata: { growthEngine: true, signal: action.signal },
    });
    return;
  }

  const ownerId =
    action.entityKind === "fsbo_listing" && action.entityId
      ? (await prisma.fsboListing.findUnique({ where: { id: action.entityId }, select: { ownerId: true } }))?.ownerId
      : action.entityKind === "bnhub_listing" && action.entityId
        ? (await prisma.shortTermListing.findUnique({ where: { id: action.entityId }, select: { ownerId: true } }))?.ownerId
        : undefined;

  if (!ownerId) return;

  await createNotification({
    userId: ownerId,
    type: "SYSTEM",
    title: "Listing performance insight",
    message:
      action.signal === "inactive_listing"
        ? "Your listing looks quiet — refresh photos or pricing to regain momentum (automated insight)."
        : `Growth engine: ${action.explanation}`,
    listingId: action.entityKind === "crm_listing" ? action.entityId ?? undefined : undefined,
    skipIfDuplicateUnread: true,
    metadata: {
      growthEngine: true,
      signal: action.signal,
      explain: action.explanation,
    },
  });
}

async function executeUserPrompt(action: GrowthProposedActionVm): Promise<void> {
  await executeOwnerNotification({
    ...action,
    explanation: `Action requested: ${action.explanation}`,
  });
}

async function writeActionLog(input: {
  runBatchId: string;
  action: GrowthProposedActionVm;
  autonomyMode: GrowthAutonomyMode;
  riskTier: string;
  status: string;
  explanation: string;
  reversibleJson?: Record<string, unknown>;
  resultJson?: Record<string, unknown>;
  approvalId?: string;
  dryRun: boolean;
  ownerUserId?: string | null;
}) {
  if (input.dryRun) {
    return { id: "dry-run" };
  }
  return prisma.lecipmGrowthEngineActionLog.create({
    data: {
      runBatchId: input.runBatchId,
      signalCode: input.action.signal,
      actionCode: input.action.action,
      entityKind: input.action.entityKind,
      entityId: input.action.entityId,
      autonomyMode: input.autonomyMode,
      riskTier: input.riskTier,
      status: input.status,
      explanation: input.explanation,
      contextJson: input.action.payload as object,
      resultJson: input.resultJson as object | undefined,
      reversibleJson: input.reversibleJson as object | undefined,
      approvalId: input.approvalId,
      ownerUserId: input.ownerUserId ?? undefined,
    },
  });
}
