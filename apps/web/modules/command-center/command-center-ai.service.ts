import type { PlatformRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

import { buildUnifiedCommandContext } from "./command-center-aggregator.service";
import { buildCommandAlerts } from "./command-center-alert.engine";
import { recordCommandCenterAudit } from "./command-center-ai-audit.service";
import type { CommandCenterAiPayload } from "./command-center-ai.types";
import { buildCommandPriorities } from "./command-center-priority.engine";
import { buildCommandRecommendations } from "./command-center-recommendation.engine";

function buildSummaryJson(payload: CommandCenterAiPayload): Prisma.InputJsonValue {
  const { executive } = payload.context.legacy.summary;
  return {
    generatedAt: payload.context.generatedAt,
    kpis: {
      revenueDisplay: executive.revenueDisplay,
      activeDeals: executive.activeDeals,
      trustScore: executive.trustScore,
      automationDisplay: executive.automationDisplay,
    },
    counts: {
      signatureQueue: payload.context.signatureQueue.length,
      alerts: payload.alerts.length,
      recommendations: payload.recommendations.length,
      conflictDeals: payload.context.conflictDeals,
      openInvoices: payload.context.finance.invoicesOpen,
      overdueInvoices: payload.context.finance.invoicesOverdue,
    },
  };
}

export async function buildCommandCenterAiPayload(userId: string, role: PlatformRole): Promise<CommandCenterAiPayload> {
  const context = await buildUnifiedCommandContext(userId, role);
  const priorities = buildCommandPriorities(context);
  const alerts = buildCommandAlerts(context);
  const recommendations = buildCommandRecommendations(context, priorities);
  return {
    context,
    priorities,
    alerts,
    recommendations,
    snapshot: null,
  };
}

export async function persistCommandCenterSnapshot(userId: string, role: PlatformRole): Promise<CommandCenterAiPayload> {
  const payload = await buildCommandCenterAiPayload(userId, role);
  const risksJson = payload.alerts.filter((a) => a.type === "RISK" || a.type === "COMPLIANCE") as unknown as Prisma.InputJsonValue;

  const snapshot = await prisma.commandCenterSnapshot.create({
    data: {
      ownerUserId: userId,
      summaryJson: buildSummaryJson(payload),
      prioritiesJson: payload.priorities as unknown as Prisma.InputJsonValue,
      risksJson,
      approvalsJson: {
        signatureQueue: payload.context.signatureQueue,
        grouped: {
          offers: payload.context.signatureQueue.filter((s) => s.kind === "offer"),
          contracts: payload.context.signatureQueue.filter((s) => s.kind === "contract"),
          investorPackets: payload.context.signatureQueue.filter((s) => s.kind === "investor_packet"),
          closingSteps: payload.context.signatureQueue.filter((s) => s.kind === "closing_step"),
          actionPipeline: payload.context.signatureQueue.filter((s) => s.kind === "action_pipeline"),
        },
      } as Prisma.InputJsonValue,
      executionJson: payload.context.execution as unknown as Prisma.InputJsonValue,
      financeJson: payload.context.finance as unknown as Prisma.InputJsonValue,
      investmentJson: {
        investors: payload.context.investors,
        hotOpportunities: payload.context.hotOpportunities,
      } as Prisma.InputJsonValue,
      closingJson: {
        closings: payload.context.closings,
        deals: payload.context.deals,
      } as Prisma.InputJsonValue,
    },
  });

  if (payload.alerts.length > 0) {
    await prisma.commandCenterAlert.createMany({
      data: payload.alerts.map((a) => ({
        snapshotId: snapshot.id,
        type: a.type,
        severity: a.severity,
        entityType: a.entityType,
        entityId: a.entityId,
        title: a.title,
        description: a.description,
        actionLabel: a.actionLabel ?? null,
        actionUrl: a.actionUrl ?? null,
      })),
    });
  }

  if (payload.recommendations.length > 0) {
    await prisma.commandCenterRecommendation.createMany({
      data: payload.recommendations.map((r) => ({
        snapshotId: snapshot.id,
        category: r.category,
        entityType: r.entityType,
        entityId: r.entityId,
        score: r.score,
        reasoningJson: r.reasoningJson as Prisma.InputJsonValue,
      })),
    });
  }

  await recordCommandCenterAudit({
    actorUserId: userId,
    event: "snapshot_generated",
    payload: { snapshotId: snapshot.id, alertCount: payload.alerts.length, recommendationCount: payload.recommendations.length },
  });
  await recordCommandCenterAudit({
    actorUserId: userId,
    event: "alert_created",
    payload: { snapshotId: snapshot.id, count: payload.alerts.length },
  });
  await recordCommandCenterAudit({
    actorUserId: userId,
    event: "recommendation_generated",
    payload: { snapshotId: snapshot.id, count: payload.recommendations.length },
  });

  return {
    ...payload,
    snapshot: { id: snapshot.id, generatedAt: snapshot.generatedAt.toISOString() },
  };
}

export async function getLatestCommandCenterSnapshotMeta(userId: string): Promise<{ id: string; generatedAt: string } | null> {
  const row = await prisma.commandCenterSnapshot.findFirst({
    where: { ownerUserId: userId },
    orderBy: { generatedAt: "desc" },
    select: { id: true, generatedAt: true },
  });
  if (!row) return null;
  return { id: row.id, generatedAt: row.generatedAt.toISOString() };
}
