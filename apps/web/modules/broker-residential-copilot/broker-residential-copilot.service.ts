import { prisma } from "@/lib/db";
import { residentialCopilotDisclaimer } from "./broker-residential-copilot.explainer";
import type { ResidentialDashboardPayload, ResidentialKpiSnapshot, ResidentialPriorityItem } from "./broker-residential-copilot.types";
import { mergePriorityCap } from "./next-best-action.service";

const ACTIVE = { notIn: ["closed", "cancelled"] as string[] };

export async function getResidentialDashboardPayload(brokerId: string, basePath: string): Promise<ResidentialDashboardPayload> {
  const deals = await prisma.deal.findMany({
    where: { brokerId, status: ACTIVE },
    select: {
      id: true,
      status: true,
      priceCents: true,
      updatedAt: true,
      crmStage: true,
      assignedFormPackageKey: true,
      dealExecutionType: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
  });

  const dealIds = deals.map((d) => d.id);

  const empty = dealIds.length === 0;
  const [docDraft, docReview, sugPending, milestonesDue] = empty
    ? [0, 0, 0, 0]
    : await Promise.all([
        prisma.dealDocument.count({
          where: { dealId: { in: dealIds }, OR: [{ workflowStatus: "draft" }, { workflowStatus: null }] },
        }),
        prisma.dealDocument.count({
          where: { dealId: { in: dealIds }, workflowStatus: "broker_review" },
        }),
        prisma.dealCopilotSuggestion.count({
          where: { dealId: { in: dealIds }, status: "pending" },
        }),
        prisma.dealMilestone.count({
          where: {
            dealId: { in: dealIds },
            status: "pending",
            dueDate: { lte: new Date(Date.now() + 3 * 86400000) },
          },
        }),
      ]);

  const leadHot = await prisma.brokerClient.count({
    where: {
      brokerId,
      status: { in: ["NEGOTIATING", "VIEWING", "QUALIFIED"] },
    },
  });

  const kpis: ResidentialKpiSnapshot = {
    activeDeals: deals.length,
    dealsAwaitingReview: docReview + sugPending,
    documentsDraft: docDraft,
    documentsBrokerReview: docReview,
    urgentDeadlines: milestonesDue,
    highPriorityLeads: leadHot,
    pendingClientFollowups: leadHot,
    copilotPending: sugPending,
  };

  const priorities: ResidentialPriorityItem[] = [];

  for (const d of deals.slice(0, 15)) {
    if (d.status === "inspection" || d.status === "financing") {
      priorities.push({
        id: `deal-${d.id}`,
        rank: 1,
        kind: "deal_attention",
        title: `Deal ${d.status}`,
        summary: `Updated ${d.updatedAt.toISOString().slice(0, 10)} — confirm conditions.`,
        severity: "warning",
        dealId: d.id,
        href: `${basePath}/deals/${d.id}`,
      });
    }
  }

  const pendingDocs = await prisma.dealDocument.findMany({
    where: { dealId: { in: dealIds }, workflowStatus: "broker_review" },
    take: 8,
    select: { id: true, dealId: true, type: true },
  });
  for (const p of pendingDocs) {
    priorities.push({
      id: `doc-${p.id}`,
      rank: 2,
      kind: "document_review",
      title: "Document awaiting broker review",
      summary: p.type,
      severity: "warning",
      dealId: p.dealId,
      href: `${basePath}/deals/${p.dealId}`,
    });
  }

  const pendingSug = await prisma.dealCopilotSuggestion.findMany({
    where: { dealId: { in: dealIds }, status: "pending" },
    take: 8,
    orderBy: { createdAt: "desc" },
    select: { id: true, dealId: true, title: true, severity: true },
  });
  for (const s of pendingSug) {
    priorities.push({
      id: `sug-${s.id}`,
      rank: 2,
      kind: "copilot_pending",
      title: s.title,
      summary: "Copilot suggestion pending review",
      severity: s.severity === "critical" ? "critical" : "warning",
      dealId: s.dealId,
      href: `${basePath}/deals/${s.dealId}`,
    });
  }

  return {
    kpis,
    priorities: mergePriorityCap(priorities, 10),
    generatedAt: new Date().toISOString(),
    disclaimer: residentialCopilotDisclaimer(),
  };
}
