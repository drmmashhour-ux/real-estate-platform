import type { PlatformRole } from "@prisma/client";
import { TenantInvoiceStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { loadCommandCenterPagePayload } from "./command-center-page.service";
import { isExecutiveCommandCenter } from "./command-center.types";
import type {
  ClosingCommandRow,
  DealCommandRow,
  ExecutionVisibilityItem,
  FinanceCommandSummary,
  InvestorCommandRow,
  SignatureQueueItem,
  UnifiedCommandContext,
} from "./command-center-ai.types";

function dealScope(userId: string, role: PlatformRole) {
  if (isExecutiveCommandCenter(role)) return {};
  return { brokerId: userId };
}

function dealHref(dealId: string): string {
  return `/dashboard/broker/deals#deal-${dealId}`;
}

/**
 * Aggregates legacy Command Center payload + broker execution, approvals, closings, finance, and investor pipeline.
 * Visibility only — does not mutate deals, offers, or invoices.
 */
export async function buildUnifiedCommandContext(userId: string, role: PlatformRole): Promise<UnifiedCommandContext> {
  const dw = dealScope(userId, role);
  const legacy = await loadCommandCenterPagePayload(userId, role);

  const [
    dealsRich,
    pendingBrokerApprovals,
    readyPipelines,
    pipelineDeals,
    invoices,
    conflictCount,
    draftOffers,
    executedPipelines,
    failedPipelines,
  ] = await Promise.all([
    prisma.deal.findMany({
      where: {
        ...dw,
        NOT: { status: { in: ["cancelled", "closed"] } },
      },
      take: 28,
      orderBy: { updatedAt: "desc" },
      include: {
        dealScores: { orderBy: { createdAt: "desc" }, take: 1 },
        closeProbabilities: { orderBy: { createdAt: "desc" }, take: 1 },
        lecipmDealClosing: true,
        brokerApprovals: { where: { status: "PENDING" }, take: 5 },
        lecipmClosingChecklistItems: {
          where: { status: { in: ["OPEN", "BLOCKED", "IN_PROGRESS"] } },
          take: 8,
        },
        lecipmClosingSignatures: {
          where: { status: "PENDING", required: true },
          take: 6,
        },
        actionPipelines: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { brokerSignature: true },
        },
      },
    }),
    prisma.brokerApproval.findMany({
      where: {
        status: "PENDING",
        ...(isExecutiveCommandCenter(role) ? {} : { deal: { brokerId: userId } }),
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { deal: { select: { id: true, dealCode: true } } },
    }),
    prisma.actionPipeline.findMany({
      where: {
        status: "READY_FOR_SIGNATURE",
        brokerSignature: { is: null },
        ...(isExecutiveCommandCenter(role) ? {} : { deal: { brokerId: userId } }),
      },
      take: 15,
      orderBy: { createdAt: "desc" },
      include: { deal: { select: { id: true, dealCode: true } } },
    }),
    isExecutiveCommandCenter(role)
      ? prisma.lecipmPipelineDeal.findMany({
          take: 10,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            pipelineStage: true,
            decisionStatus: true,
            listingId: true,
          },
        })
      : prisma.lecipmPipelineDeal.findMany({
          where: { brokerId: userId },
          take: 10,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            title: true,
            pipelineStage: true,
            decisionStatus: true,
            listingId: true,
          },
        }),
    prisma.tenantInvoice.findMany({
      where: {
        createdById: userId,
        status: { in: [TenantInvoiceStatus.DRAFT, TenantInvoiceStatus.ISSUED, TenantInvoiceStatus.PARTIALLY_PAID, TenantInvoiceStatus.OVERDUE] },
      },
      take: 12,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.deal.count({
      where: {
        ...dw,
        status: "CONFLICT_REQUIRES_DISCLOSURE",
      },
    }),
    prisma.offerDocument.findMany({
      where: {
        createdById: userId,
        status: { in: ["draft", "sent"] },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.actionPipeline.findMany({
      where: {
        status: "EXECUTED",
        ...(isExecutiveCommandCenter(role) ? {} : { deal: { brokerId: userId } }),
        updatedAt: { gte: new Date(Date.now() - 14 * 864e5) },
      },
      take: 12,
      orderBy: { updatedAt: "desc" },
      select: { id: true, type: true, status: true, dealId: true, aiGenerated: true },
    }),
    prisma.actionPipeline.findMany({
      where: {
        status: "DRAFT",
        aiGenerated: true,
        ...(isExecutiveCommandCenter(role) ? {} : { deal: { brokerId: userId } }),
        updatedAt: { gte: new Date(Date.now() - 14 * 864e5) },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
      select: { id: true, type: true, status: true, dealId: true },
    }),
  ]);

  const signatureQueue: SignatureQueueItem[] = [];

  for (const o of draftOffers) {
    signatureQueue.push({
      kind: "offer",
      id: o.id,
      title: `${o.type} · ${o.status}`,
      dealId: null,
      href: "/dashboard/broker/contracts",
      severity: o.status === "sent" ? "HIGH" : "MEDIUM",
    });
  }

  for (const a of pendingBrokerApprovals) {
    signatureQueue.push({
      kind: "contract",
      id: a.id,
      title: `Broker approval · ${a.actionKey} · ${a.deal.dealCode ?? a.deal.id.slice(0, 8)}`,
      dealId: a.dealId,
      href: "/dashboard/broker/forms/review",
      severity: "HIGH",
    });
  }

  for (const p of readyPipelines) {
    signatureQueue.push({
      kind: "action_pipeline",
      id: p.id,
      title: `AI action ready for signature · ${p.type}`,
      dealId: p.dealId,
      href: "/dashboard/signature-center",
      severity: "CRITICAL",
    });
  }

  for (const d of dealsRich) {
    for (const s of d.lecipmClosingSignatures) {
      signatureQueue.push({
        kind: "closing_step",
        id: s.id,
        title: `Closing signature pending · ${s.signerRole}`,
        dealId: d.id,
        href: "/dashboard/signature-center",
        severity: "HIGH",
      });
    }
  }

  const deals: DealCommandRow[] = dealsRich.map((d) => {
    const score = d.dealScores[0];
    const prob = d.closeProbabilities[0];
    const blockers = d.lecipmClosingChecklistItems.filter((c) => c.status === "BLOCKED");
    const open = d.lecipmClosingChecklistItems.filter((c) => c.status !== "COMPLETE");
    const pendSig = d.lecipmClosingSignatures.filter((s) => s.status === "PENDING").length;
    const pendAppr = d.brokerApprovals.length;
    const readyPipe = d.actionPipelines.filter((x) => x.status === "READY_FOR_SIGNATURE" && !x.brokerSignature).length;

    let blocker: string | null = null;
    if (d.status === "CONFLICT_REQUIRES_DISCLOSURE") blocker = "Conflict disclosure unresolved";
    else if (blockers.length) blocker = `Checklist blocked: ${blockers[0]?.title ?? "item"}`;
    else if (pendSig) blocker = `${pendSig} closing signature(s) pending`;
    else if (pendAppr) blocker = "Broker approval pending";
    else if (readyPipe) blocker = "Autopilot action awaiting signature";

    let nextStep = "Advance CRM stage / follow up with parties";
    let nextOwner: string | null = "Broker of record";
    if (pendAppr) nextStep = "Complete broker approval + acknowledgement";
    if (readyPipe) nextStep = "Review and sign queued AI action";
    if (blockers.length) nextStep = "Unblock closing checklist item";

    return {
      dealId: d.id,
      dealCode: d.dealCode,
      stage: d.status,
      crmStage: d.crmStage,
      priceCents: d.priceCents,
      dealScore: score?.score ?? null,
      dealScoreCategory: score?.category ?? null,
      riskLevel: score?.riskLevel ?? null,
      closeProbability: prob?.probability ?? null,
      closeCategory: prob?.category ?? null,
      blocker,
      nextStep,
      nextOwner,
      needsBrokerSignature: pendSig > 0 || readyPipe > 0 || pendAppr > 0,
      href: dealHref(d.id),
    };
  });

  const closings: ClosingCommandRow[] = dealsRich
    .filter((d) => d.lecipmDealClosing)
    .map((d) => {
      const c = d.lecipmDealClosing!;
      const pendSig = d.lecipmClosingSignatures.filter((s) => s.status === "PENDING").length;
      const open = d.lecipmClosingChecklistItems.filter((x) => x.status !== "COMPLETE").length;
      const blocked = d.lecipmClosingChecklistItems.filter((x) => x.status === "BLOCKED").length;
      return {
        dealId: d.id,
        closingStatus: c.status,
        readiness: c.readinessStatus,
        closingDate: c.closingDate?.toISOString() ?? null,
        pendingSignatures: pendSig,
        openChecklist: open,
        blockedChecklist: blocked,
        href: dealHref(d.id),
      };
    });

  const investors: InvestorCommandRow[] = pipelineDeals.map((p) => ({
    id: p.id,
    title: p.title,
    stage: p.pipelineStage,
    decisionStatus: p.decisionStatus,
    listingId: p.listingId,
    href: "/dashboard/broker/investor",
  }));

  const overdue = invoices.filter((i) => i.status === TenantInvoiceStatus.OVERDUE).length;
  const finance: FinanceCommandSummary = {
    invoicesOpen: invoices.length,
    invoicesOverdue: overdue,
    recentInvoices: invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      status: i.status,
      totalAmount: i.totalAmount,
      dueAt: i.dueAt?.toISOString() ?? null,
      href: "/dashboard/broker/financial/transactions",
    })),
    taxHint:
      overdue > 0
        ? `${overdue} invoice(s) overdue — verify GST/QST treatment before collection escalations.`
        : "Review periodic GST/QST filing calendar in finance hub.",
  };

  const aiHandled: ExecutionVisibilityItem[] = executedPipelines.map((p) => ({
    id: p.id,
    kind: String(p.type),
    status: p.status,
    title: `Executed autopilot action (${p.type})`,
    dealId: p.dealId,
    href: "/dashboard/broker/portfolio/autopilot",
    aiGenerated: p.aiGenerated,
  }));

  const failedOrBlocked: ExecutionVisibilityItem[] = [
    ...failedPipelines.map((p) => ({
      id: p.id,
      kind: String(p.type),
      status: p.status,
      title: `Draft AI action still in prep · ${p.type}`,
      dealId: p.dealId,
      href: "/dashboard/broker/portfolio/autopilot",
      aiGenerated: true,
      retriable: true,
      blockedReason: "Awaiting broker signature or review",
    })),
  ];

  const hotOpportunities: UnifiedCommandContext["hotOpportunities"] = [
    ...legacy.summary.priorityDeals.map((d) => ({
      id: d.id,
      label: d.label,
      href: dealHref(d.id),
      kind: "deal" as const,
    })),
    ...legacy.summary.hotLeads.slice(0, 6).map((l) => ({
      id: l.id,
      label: l.contactLabel,
      href: "/dashboard/lecipm",
      kind: "lead" as const,
    })),
  ];

  return {
    userId,
    role,
    generatedAt: new Date().toISOString(),
    legacy,
    signatureQueue,
    execution: { aiHandled, failedOrBlocked },
    deals,
    closings,
    investors,
    finance,
    hotOpportunities,
    conflictDeals: conflictCount,
  };
}
