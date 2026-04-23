import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { requireWorkspacePermission } from "@/modules/enterprise/infrastructure/requireWorkspacePermission";
import {
  workspaceAiActionWhere,
  workspaceDealWhere,
  workspaceDocumentWhere,
  workspaceLeadWhere,
} from "@/modules/enterprise/domain/workspaceDataScope";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

type DealPipelineColumn = "new" | "in_progress" | "negotiation" | "closing" | "completed";

function dealStatusToPipelineColumn(status: string): DealPipelineColumn {
  switch (status) {
    case "initiated":
      return "new";
    case "offer_submitted":
    case "inspection":
    case "financing":
      return "in_progress";
    case "accepted":
      return "negotiation";
    case "closing_scheduled":
      return "closing";
    case "closed":
      return "completed";
    default:
      return "in_progress";
  }
}

/** GET /api/workspaces/[id]/team-dashboard — scoped deals, leads, docs, activity (RBAC). */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const userId = await getGuestId();
  const { id: workspaceId } = await ctx.params;
  const auth = await requireWorkspacePermission(prisma, {
    userId,
    workspaceId,
    permission: "view_internal_analytics",
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const dealWhere = workspaceDealWhere(workspaceId, auth.role, auth.userId);
  const leadWhere = workspaceLeadWhere(workspaceId, auth.role, auth.userId);
  const docWhere = workspaceDocumentWhere(workspaceId, auth.role, auth.userId);
  const actionWhere = workspaceAiActionWhere(workspaceId, auth.role, auth.userId);

  const [deals, leads, documents, recentActions, auditLogs, milestoneAgg] = await Promise.all([
    prisma.deal.findMany({
      where: dealWhere,
      select: {
        id: true,
        dealCode: true,
        status: true,
        crmStage: true,
        priceCents: true,
        brokerId: true,
        possibleBypassFlag: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { documents: true, milestones: true } },
        milestones: { select: { status: true, name: true }, take: 20 },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.lead.findMany({
      where: leadWhere,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        pipelineStatus: true,
        introducedByBrokerId: true,
        createdAt: true,
        firstContactAt: true,
        lastContactedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.documentFile.findMany({
      where: docWhere,
      select: { id: true, status: true, category: true, createdAt: true, uploadedById: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.lecipmAiOperatorAction.findMany({
      where: actionWhere,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        userId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.workspaceAuditLog.findMany({
      where: { workspaceId },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.dealMilestone.groupBy({
      by: ["status"],
      where: { deal: dealWhere },
      _count: true,
    }),
  ]);

  const activeDeals = deals.filter((d) => d.status !== "closed" && d.status !== "cancelled");
  const riskAlerts: { kind: string; dealId?: string; message: string }[] = [];
  for (const d of deals) {
    if (d.possibleBypassFlag) {
      riskAlerts.push({ kind: "compliance", dealId: d.id, message: "Deal flagged for possible bypass review." });
    }
    if (d.status !== "closed" && d.status !== "cancelled" && d._count.documents === 0) {
      riskAlerts.push({ kind: "documents", dealId: d.id, message: "No deal documents attached yet." });
    }
    const pendingM = d.milestones.filter((m) => m.status !== "completed").length;
    if (d.status === "closing_scheduled" && pendingM > 0) {
      riskAlerts.push({ kind: "milestones", dealId: d.id, message: "Closing scheduled with incomplete milestones." });
    }
  }

  const pipeline: Record<DealPipelineColumn, typeof deals> = {
    new: [],
    in_progress: [],
    negotiation: [],
    closing: [],
    completed: [],
  };
  for (const d of deals) {
    if (d.status === "cancelled") continue;
    const col = dealStatusToPipelineColumn(d.status);
    pipeline[col].push(d);
  }

  const brokerIds = [...new Set(deals.map((d) => d.brokerId).filter(Boolean))] as string[];
  const brokers =
    brokerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: brokerIds } },
          select: { id: true, email: true, name: true },
        })
      : [];
  const brokerMap = Object.fromEntries(brokers.map((b) => [b.id, b]));

  const brokerStats: Record<
    string,
    { userId: string; dealsTotal: number; dealsClosed: number; conversionRate: number; docUploads: number }
  > = {};
  for (const bid of brokerIds) {
    const mine = deals.filter((d) => d.brokerId === bid);
    const closed = mine.filter((d) => d.status === "closed");
    brokerStats[bid] = {
      userId: bid,
      dealsTotal: mine.length,
      dealsClosed: closed.length,
      conversionRate: mine.length ? closed.length / mine.length : 0,
      docUploads: documents.filter((f) => f.uploadedById === bid).length,
    };
  }

  const leadResponseSamples = leads
    .filter((l) => l.firstContactAt && l.introducedByBrokerId)
    .slice(0, 50);
  let avgResponseHours: number | null = null;
  if (leadResponseSamples.length > 0) {
    const deltas = leadResponseSamples.map((l) => {
      const a = l.firstContactAt!.getTime() - l.createdAt.getTime();
      return a / 3600000;
    });
    avgResponseHours = deltas.reduce((s, x) => s + x, 0) / deltas.length;
  }

  const incompleteMilestones = milestoneAgg.find((g) => g.status === "pending")?._count ?? 0;

  return NextResponse.json({
    scopedAs: auth.role,
    deals: activeDeals.map((d) => ({
      id: d.id,
      dealCode: d.dealCode,
      status: d.status,
      crmStage: d.crmStage,
      priceCents: d.priceCents,
      brokerId: d.brokerId,
      brokerLabel: d.brokerId ? brokerMap[d.brokerId]?.name || brokerMap[d.brokerId]?.email || d.brokerId : null,
      documentCount: d._count.documents,
      updatedAt: d.updatedAt.toISOString(),
    })),
    pipelineColumns: {
      new: pipeline.new.map((d) => ({ id: d.id, dealCode: d.dealCode, status: d.status, brokerId: d.brokerId })),
      in_progress: pipeline.in_progress.map((d) => ({
        id: d.id,
        dealCode: d.dealCode,
        status: d.status,
        brokerId: d.brokerId,
      })),
      negotiation: pipeline.negotiation.map((d) => ({
        id: d.id,
        dealCode: d.dealCode,
        status: d.status,
        brokerId: d.brokerId,
      })),
      closing: pipeline.closing.map((d) => ({
        id: d.id,
        dealCode: d.dealCode,
        status: d.status,
        brokerId: d.brokerId,
      })),
      completed: pipeline.completed.map((d) => ({
        id: d.id,
        dealCode: d.dealCode,
        status: d.status,
        brokerId: d.brokerId,
      })),
    },
    riskAlerts,
    recentActivity: auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      createdAt: l.createdAt.toISOString(),
      actor: l.actor,
    })),
    brokerPerformance: Object.values(brokerStats).map((s) => ({
      ...s,
      label: brokerMap[s.userId]?.name || brokerMap[s.userId]?.email || s.userId,
      activityLevel: s.dealsTotal + s.docUploads,
      avgResponseHours,
    })),
    compliance: {
      dealsMissingDocuments: deals.filter((d) => d._count.documents === 0 && d.status !== "cancelled").length,
      incompleteMilestones,
      legalFlags: deals.filter((d) => d.possibleBypassFlag).length,
    },
    aiOperatorRecent: recentActions.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      status: a.status,
      userId: a.userId,
      createdAt: a.createdAt.toISOString(),
    })),
    leadCount: leads.length,
  });
}
