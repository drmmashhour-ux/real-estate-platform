import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";
import { isTrustGraphDocumentApprovalsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { defaultApprovalStepKinds } from "@/lib/trustgraph/infrastructure/services/approvalRoutingService";
import type { DocumentApprovalSummaryDto } from "@/lib/trustgraph/domain/approvals";

export async function startDocumentApprovalFlowRecord(args: {
  entityType: string;
  entityId: string;
  documentType: string;
  workspaceId: string | null;
  startedBy: string;
}): Promise<{ flowId: string } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphDocumentApprovalsEnabled()) {
    return { skipped: true };
  }

  const cfg = getPhase7EnterpriseConfig();
  const dueHours = cfg.sla.defaultLegalQueueDueHours;
  const dueAt = new Date(Date.now() + dueHours * 60 * 60 * 1000);

  const flow = await prisma.trustgraphDocumentApprovalFlow.create({
    data: {
      entityType: args.entityType,
      entityId: args.entityId,
      documentType: args.documentType,
      currentStatus: "in_progress",
      workspaceId: args.workspaceId ?? undefined,
      startedBy: args.startedBy,
      steps: {
        create: defaultApprovalStepKinds().map((kind, i) => ({
          stepKind: kind,
          status: i === 0 ? "pending" : "waiting",
          dueAt: i === 0 ? dueAt : null,
        })),
      },
    },
    select: { id: true },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_document_approval_started",
    sourceModule: "trustgraph",
    entityType: "DOCUMENT_APPROVAL_FLOW",
    entityId: flow.id,
    payload: {
      entityType: args.entityType,
      entityId: args.entityId,
      documentType: args.documentType,
      workspaceId: args.workspaceId,
    },
  }).catch(() => {});

  return { flowId: flow.id };
}

export async function applyDocumentApprovalActionRecord(args: {
  flowId: string;
  actorId: string;
  actionType: string;
  notes?: string | null;
  payload?: object | null;
  targetUserId?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  if (!isTrustGraphEnabled() || !isTrustGraphDocumentApprovalsEnabled()) {
    return { error: "disabled" };
  }

  const flow = await prisma.trustgraphDocumentApprovalFlow.findUnique({
    where: { id: args.flowId },
    include: { steps: { orderBy: { createdAt: "asc" } } },
  });
  if (!flow) return { error: "not_found" };

  const pendingStep = flow.steps.find((s) => s.status === "pending");
  const stepId = pendingStep?.id ?? null;

  await prisma.trustgraphDocumentApprovalAction.create({
    data: {
      approvalFlowId: args.flowId,
      stepId,
      actorId: args.actorId,
      actionType: args.actionType,
      notes: args.notes ?? undefined,
      payload: (args.payload ?? undefined) as object | undefined,
    },
  });

  let newStatus = flow.currentStatus;
  if (args.actionType === "approve" && pendingStep) {
    await prisma.trustgraphDocumentApprovalStep.update({
      where: { id: pendingStep.id },
      data: { status: "completed" },
    });
    const next = flow.steps.find((s) => s.status === "waiting");
    if (next) {
      await prisma.trustgraphDocumentApprovalStep.update({
        where: { id: next.id },
        data: {
          status: "pending",
          dueAt: new Date(Date.now() + getPhase7EnterpriseConfig().sla.defaultLegalQueueDueHours * 3600000),
        },
      });
      newStatus = "in_progress";
    } else {
      newStatus = "completed";
      await prisma.trustgraphDocumentApprovalFlow.update({
        where: { id: args.flowId },
        data: { resolvedAt: new Date(), currentStatus: "completed" },
      });
    }
  } else if (args.actionType === "reject") {
    newStatus = "rejected";
    await prisma.trustgraphDocumentApprovalFlow.update({
      where: { id: args.flowId },
      data: { currentStatus: "rejected", resolvedAt: new Date() },
    });
  } else if (args.actionType === "request_changes") {
    newStatus = "changes_requested";
    await prisma.trustgraphDocumentApprovalFlow.update({
      where: { id: args.flowId },
      data: { currentStatus: "changes_requested" },
    });
  } else if (args.actionType === "reassign" && args.targetUserId && pendingStep) {
    await prisma.trustgraphDocumentApprovalStep.update({
      where: { id: pendingStep.id },
      data: { assignedTo: args.targetUserId },
    });
  } else if (args.actionType === "escalate") {
    newStatus = "escalated";
    await prisma.trustgraphDocumentApprovalFlow.update({
      where: { id: args.flowId },
      data: { currentStatus: "escalated" },
    });
  }

  if (args.actionType === "approve" && newStatus === "in_progress") {
    await prisma.trustgraphDocumentApprovalFlow.update({
      where: { id: args.flowId },
      data: { currentStatus: "in_progress" },
    });
  }

  void recordPlatformEvent({
    eventType: "trustgraph_document_approval_action",
    sourceModule: "trustgraph",
    entityType: "DOCUMENT_APPROVAL_FLOW",
    entityId: args.flowId,
    payload: { actionType: args.actionType, actorId: args.actorId },
  }).catch(() => {});

  return { ok: true };
}

export async function getDocumentApprovalSummary(flowId: string): Promise<DocumentApprovalSummaryDto | null> {
  const flow = await prisma.trustgraphDocumentApprovalFlow.findUnique({
    where: { id: flowId },
    include: { steps: { orderBy: { createdAt: "asc" } } },
  });
  if (!flow) return null;
  return {
    flowId: flow.id,
    entityType: flow.entityType,
    entityId: flow.entityId,
    documentType: flow.documentType,
    currentStatus: flow.currentStatus,
    workspaceId: flow.workspaceId,
    steps: flow.steps.map((s) => ({
      id: s.id,
      stepKind: s.stepKind,
      status: s.status,
      dueAt: s.dueAt?.toISOString() ?? null,
    })),
  };
}
