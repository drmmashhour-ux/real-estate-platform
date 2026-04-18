import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";
import { engineFlags } from "@/config/feature-flags";
import { logAutopilotRun } from "@/src/modules/autopilot/autopilot.logger";
import { getLecipmCoreAutopilotMode } from "@/src/modules/autopilot/autopilot.env";
import { proposedActionsFromListingHits } from "@/src/modules/autopilot/actions/listing.actions";
import { proposeRevenueEngineAutopilotActions } from "@/src/modules/revenue/revenue-autopilot.bridge";
import { proposeTrustFraudAutopilotActions } from "@/src/modules/trust/trust-autopilot.bridge";
import { actionRequiresApproval } from "@/src/modules/autopilot/policies/approval.policy";
import { canAutoExecuteInMode } from "@/src/modules/autopilot/policies/execution.policy";
import { evaluateFsboListingRules } from "@/src/modules/autopilot/rules/listing.rules";
import type { LecipmCoreAutopilotEventPayload } from "@/src/modules/autopilot/types";

async function upsertGrowthCandidate(params: {
  type: string;
  targetId: string;
  score: number;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  if (!engineFlags.growthAutopilotV1) return false;
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const existing = await prisma.growthOpportunityCandidate.findFirst({
    where: {
      type: params.type,
      targetType: "fsbo_listing",
      targetId: params.targetId,
      createdAt: { gte: since },
    },
  });
  if (existing) return false;
  await prisma.growthOpportunityCandidate.create({
    data: {
      type: params.type,
      targetType: "fsbo_listing",
      targetId: params.targetId,
      score: params.score,
      reason: params.reason,
      metadataJson: { source: "lecipm_core_autopilot_v1", ...params.metadata },
      status: "pending",
    },
  });
  return true;
}

async function tryExecuteSafeLowRisk(
  mode: ReturnType<typeof getLecipmCoreAutopilotMode>,
  action: { id: string; type: string; targetId: string; riskLevel: string }
): Promise<{ ok: boolean; reason?: string }> {
  const rl = action.riskLevel === "low" || action.riskLevel === "medium" || action.riskLevel === "high"
    ? action.riskLevel
    : "high";
  if (!canAutoExecuteInMode(mode, action.type, rl)) {
    return { ok: false, reason: "mode_or_policy" };
  }
  if (action.type === "mark_growth_candidate") {
    const created = await upsertGrowthCandidate({
      type: "listing_growth_candidate",
      targetId: action.targetId,
      score: 40,
      reason: "Tagged by core autopilot (metadata only).",
    });
    if (created) {
      await prisma.lecipmCoreAutopilotAction.update({
        where: { id: action.id },
        data: { status: "executed", executedAt: new Date() },
      });
      return { ok: true };
    }
    await prisma.lecipmCoreAutopilotAction.update({
      where: { id: action.id },
      data: { status: "skipped", executedAt: null },
    });
    return { ok: false, reason: "deduped_or_flag" };
  }
  if (action.type === "mark_featured_candidate") {
    const created = await upsertGrowthCandidate({
      type: "featured_search_boost_candidate",
      targetId: action.targetId,
      score: 55,
      reason: "Featured / boost candidate from listing signals (no auto-publish).",
    });
    if (created) {
      await prisma.lecipmCoreAutopilotAction.update({
        where: { id: action.id },
        data: { status: "executed", executedAt: new Date() },
      });
      return { ok: true };
    }
    await prisma.lecipmCoreAutopilotAction.update({
      where: { id: action.id },
      data: { status: "skipped", executedAt: null },
    });
    return { ok: false, reason: "deduped_or_flag" };
  }
  return { ok: false, reason: "unknown_action" };
}

/**
 * Main entry: evaluate rules, persist actions, optionally execute only whitelisted low-risk ops.
 */
export async function runLecipmCoreAutopilotEvent(
  payload: LecipmCoreAutopilotEventPayload
): Promise<{
  ok: boolean;
  skipped?: boolean;
  runId?: string;
  actionsCreated?: number;
  actionsExecuted?: number;
  reason?: string;
}> {
  const mode = getLecipmCoreAutopilotMode();
  if (mode === "OFF" || !engineFlags.listingAutopilotV1) {
    return { ok: true, skipped: true, reason: "off_or_flag" };
  }

  const targetType = payload.targetType ?? "fsbo_listing";
  const targetId = payload.targetId?.trim() ?? "";

  const run = await prisma.lecipmCoreAutopilotRun.create({
    data: {
      eventType: payload.eventType,
      targetType: targetType || null,
      targetId: targetId || null,
      mode,
      summaryJson: asInputJsonValue({ engine: "lecipm_core_autopilot_v1", metadata: payload.metadata ?? {} }),
    },
  });

  const skippedReasons: string[] = [];
  let rulesEvaluated = 0;
  let actionsCreated = 0;
  let actionsExecuted = 0;

  if (targetType === "fsbo_listing" && targetId) {
    const row = await prisma.fsboListing.findUnique({
      where: { id: targetId },
      include: {
        _count: { select: { buyerListingViews: true, buyerSavedListings: true, leads: true } },
      },
    });
    if (!row) {
      skippedReasons.push("listing_not_found");
      await prisma.lecipmCoreAutopilotRun.update({
        where: { id: run.id },
        data: { summaryJson: asInputJsonValue({ skipped: skippedReasons }) },
      });
      logAutopilotRun({
        event: payload.eventType,
        runId: run.id,
        rulesEvaluated: 0,
        actionsProduced: 0,
        actionsExecuted: 0,
        skippedReasons,
        approvalRequired: 0,
      });
      return { ok: true, runId: run.id, actionsCreated: 0, actionsExecuted: 0 };
    }

    const input = {
      id: row.id,
      title: row.title,
      description: row.description,
      images: row.images,
      city: row.city,
      propertyType: row.propertyType,
      priceCents: row.priceCents,
      trustScore: row.trustScore,
      riskScore: row.riskScore,
      status: row.status,
      updatedAt: row.updatedAt,
      viewCount: row._count.buyerListingViews,
      saveCount: row._count.buyerSavedListings,
      leadCount: row._count.leads,
    };

    const hits = evaluateFsboListingRules(input, payload.eventType);
    rulesEvaluated = hits.length;
    for (const h of hits) {
      await prisma.lecipmCoreAutopilotRuleLog.create({
        data: {
          runId: run.id,
          ruleKey: h.ruleKey,
          matched: true,
          detailJson: asInputJsonValue(h.detail ?? {}),
        },
      });
    }

    const revenueActions = await proposeRevenueEngineAutopilotActions(targetId);
    const baseProposed = proposedActionsFromListingHits(hits, targetId);
    const trustActions = await proposeTrustFraudAutopilotActions(targetId, hits);
    const proposed = [...baseProposed, ...revenueActions, ...trustActions];
    let approvalRequired = 0;

    for (const p of proposed) {
      const requires = actionRequiresApproval(p.type) || mode === "FULL_AUTOPILOT_APPROVAL";
      if (requires) approvalRequired++;

      const created = await prisma.lecipmCoreAutopilotAction.create({
        data: {
          runId: run.id,
          type: p.type,
          domain: p.domain,
          severity: p.severity,
          riskLevel: p.riskLevel,
          targetType: "fsbo_listing",
          targetId,
          title: p.title,
          description: p.description,
          payloadJson: asInputJsonValue(p.payload),
          status: "pending",
          requiresApproval: requires,
        },
      });
      actionsCreated++;

      if (!requires) {
        const ex = await tryExecuteSafeLowRisk(mode, {
          id: created.id,
          type: p.type,
          targetId,
          riskLevel: p.riskLevel,
        });
        if (ex.ok) actionsExecuted++;
        else if (ex.reason) skippedReasons.push(`${p.type}:${ex.reason}`);
      }
    }

    await prisma.lecipmCoreAutopilotRun.update({
      where: { id: run.id },
      data: {
        summaryJson: asInputJsonValue({
          rulesEvaluated,
          actionsCreated,
          actionsExecuted,
          skippedReasons,
          approvalRequired,
        }),
      },
    });

    logAutopilotRun({
      event: payload.eventType,
      runId: run.id,
      rulesEvaluated,
      actionsProduced: actionsCreated,
      actionsExecuted,
      skippedReasons,
      approvalRequired,
    });

    return { ok: true, runId: run.id, actionsCreated, actionsExecuted };
  }

  skippedReasons.push("unsupported_target");
  await prisma.lecipmCoreAutopilotRun.update({
    where: { id: run.id },
    data: { summaryJson: asInputJsonValue({ skipped: skippedReasons }) },
  });
  logAutopilotRun({
    event: payload.eventType,
    runId: run.id,
    rulesEvaluated: 0,
    actionsProduced: 0,
    actionsExecuted: 0,
    skippedReasons,
    approvalRequired: 0,
  });
  return { ok: true, runId: run.id, actionsCreated: 0, actionsExecuted: 0 };
}

/** Batch helper for cron: sample active FSBO listings and emit evaluation events. */
export async function runFsboListingAutopilotSampleScan(limit = 40): Promise<{ processed: number }> {
  const mode = getLecipmCoreAutopilotMode();
  if (mode === "OFF" || !engineFlags.listingAutopilotV1) return { processed: 0 };

  const rows = await prisma.fsboListing.findMany({
    where: { status: "ACTIVE", moderationStatus: "APPROVED" },
    orderBy: { updatedAt: "asc" },
    take: Math.min(200, limit),
    select: { id: true },
  });

  let processed = 0;
  for (const r of rows) {
    await runLecipmCoreAutopilotEvent({
      eventType: "listing_updated",
      targetType: "fsbo_listing",
      targetId: r.id,
      metadata: { batch: "sample_scan" },
    });
    processed++;
  }
  return { processed };
}
