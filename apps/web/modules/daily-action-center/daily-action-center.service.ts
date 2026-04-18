import type { DealExecutionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { listBrokerCrmLeads } from "@/lib/broker-crm/list-leads";
import type { DailyAction, DailyActionFeed, DailyActionType } from "./daily-action-center.types";
import { assignUrgency } from "./daily-action-priority.service";
import { bundleDailyActions } from "./daily-action-bundler.service";

const RESIDENTIAL_EXECUTION: DealExecutionType[] = [
  "residential_sale",
  "divided_coownership_sale",
  "undivided_coownership_sale",
  "residential_lease",
  "sale_brokerage",
  "purchase_brokerage",
  "amendment",
  "counter_proposal",
];

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSnoozed(actionId: string, snoozed: { id: string; until: string }[]): boolean {
  const row = snoozed.find((s) => s.id === actionId);
  if (!row) return false;
  const u = Date.parse(row.until);
  return Number.isFinite(u) && u > Date.now();
}

export async function gatherDailyActionsForBroker(opts: {
  brokerUserId: string;
  isAdmin: boolean;
  snoozed?: { id: string; until: string }[];
}): Promise<DailyActionFeed> {
  const snoozed = opts.snoozed ?? [];
  const brokerId = opts.brokerUserId;
  const now = new Date();
  const eod = endOfToday();
  const sod = startOfToday();

  const dealWhere: Prisma.DealWhereInput = {
    brokerId,
    status: { not: "cancelled" },
    OR: [{ dealExecutionType: { in: RESIDENTIAL_EXECUTION } }, { dealExecutionType: null }],
  };

  const deals = await prisma.deal.findMany({
    where: dealWhere,
    select: { id: true, dealCode: true, status: true, crmStage: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 60,
  });
  const dealIds = deals.map((d) => d.id);
  const dealLabel = (id: string) => deals.find((d) => d.id === id)?.dealCode ?? id.slice(0, 8);

  const actions: DailyAction[] = [];

  const [tasks, drafts, leadsDue, leadsHigh] = await Promise.all([
    prisma.lecipmBrokerTask.findMany({
      where: { brokerId, status: "open" },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 40,
      include: { deal: { select: { id: true, dealCode: true } } },
    }),
    prisma.lecipmCommunicationDraft.findMany({
      where: { brokerId, status: "pending_approval" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { deal: { select: { id: true, dealCode: true } } },
    }),
    listBrokerCrmLeads({ brokerUserId: brokerId, isAdmin: opts.isAdmin, filter: "followup_due", take: 25 }),
    listBrokerCrmLeads({ brokerUserId: brokerId, isAdmin: opts.isAdmin, filter: "high", take: 15 }),
  ]);

  for (const t of tasks) {
    const due = t.dueAt;
    const overdue = due ? due < now : false;
    const urgency = assignUrgency({
      dueAt: due,
      hasDeadlineToday: due ? due >= sod && due <= eod : false,
      isOverdue: overdue,
      typePriority: t.priority === "urgent" ? "critical" : t.priority === "high" ? "high" : "normal",
    });
    const id = `dac:task:${t.id}`;
    const a: DailyAction = {
      id,
      type: "broker_task",
      title: t.title,
      summary: t.dealId ? `Deal ${dealLabel(t.dealId)}` : "Broker task",
      urgency,
      linkedEntityType: "lecipm_broker_task",
      linkedEntityId: t.id,
      dealId: t.dealId,
      dueAt: due?.toISOString() ?? null,
      recommendedAction: "Mark done or reschedule from CRM / deal workspace.",
      riskIfIgnored: overdue ? "Follow-up may slip vs client expectations." : null,
      approvalRequired: false,
    };
    if (!isSnoozed(id, snoozed)) actions.push(a);
  }

  for (const d of drafts) {
    const urgency = assignUrgency({
      dueAt: null,
      hasDeadlineToday: false,
      isOverdue: false,
      typePriority: "high",
    });
    const id = `dac:draft:${d.id}`;
    const a: DailyAction = {
      id,
      type: "communication_draft",
      title: `Approve ${d.channel} draft`,
      summary: (d.subject ?? "Message draft").slice(0, 120),
      urgency,
      linkedEntityType: "lecipm_communication_draft",
      linkedEntityId: d.id,
      dealId: d.dealId,
      dueAt: null,
      recommendedAction: "Review wording — sending still requires the comms workflow.",
      riskIfIgnored: null,
      approvalRequired: true,
    };
    if (!isSnoozed(id, snoozed)) actions.push(a);
  }

  const leadIds = new Set<string>();
  const mergeLead = (row: (typeof leadsDue)[0]) => {
    if (leadIds.has(row.id)) return;
    leadIds.add(row.id);
    const due = row.nextFollowUpAt ? new Date(row.nextFollowUpAt) : null;
    const urgency = assignUrgency({
      dueAt: due,
      hasDeadlineToday: due ? due <= eod && due >= sod : false,
      isOverdue: due ? due < sod : false,
      typePriority: row.priorityLabel === "high" ? "high" : "normal",
    });
    const id = `dac:lead:${row.id}`;
    const a: DailyAction = {
      id,
      type: "crm_lead_followup",
      title: `CRM: ${row.displayName}`,
      summary: row.listing?.title ? `Listing: ${row.listing.title}` : "Pipeline follow-up",
      urgency,
      linkedEntityType: "lecipm_broker_crm_lead",
      linkedEntityId: row.id,
      dealId: null,
      dueAt: row.nextFollowUpAt,
      recommendedAction: "Log outcome after contact — moves next reminder safely.",
      riskIfIgnored: null,
      approvalRequired: false,
    };
    if (!isSnoozed(id, snoozed)) actions.push(a);
  };
  for (const l of leadsDue) mergeLead(l);
  for (const l of leadsHigh) mergeLead(l);

  if (dealIds.length > 0) {
    const [conditions, suggestions, requests, signatures, banks, compliance] = await Promise.all([
      prisma.dealClosingCondition.findMany({
        where: {
          dealId: { in: dealIds },
          fulfilledAt: null,
          deadline: { not: null },
        },
        take: 40,
      }),
      prisma.negotiationSuggestion.findMany({
        where: { dealId: { in: dealIds }, status: "pending_review" },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.dealRequest.findMany({
        where: {
          dealId: { in: dealIds },
          status: { in: ["AWAITING_RESPONSE", "OVERDUE", "BLOCKED", "PARTIALLY_FULFILLED"] },
        },
        include: { items: true },
        take: 30,
      }),
      prisma.signatureSession.findMany({
        where: {
          dealId: { in: dealIds },
          status: { in: ["sent", "in_progress", "pending_send"] },
        },
        take: 20,
      }),
      prisma.dealBankCoordination.findMany({
        where: {
          dealId: { in: dealIds },
          financingStatus: {
            in: ["APPLICATION_IN_PROGRESS", "ADDITIONAL_INFO_NEEDED", "UNDERTAKING_PENDING"],
          },
        },
      }),
      prisma.complianceCase.findMany({
        where: {
          dealId: { in: dealIds },
          assignedReviewerId: brokerId,
          status: { in: ["open", "under_review", "action_required"] },
        },
        take: 20,
      }),
    ]);

    for (const c of conditions) {
      const dl = c.deadline!;
      const urgency = assignUrgency({
        dueAt: dl,
        hasDeadlineToday: dl >= sod && dl <= eod,
        isOverdue: dl < now,
        typePriority: dl < now ? "critical" : "high",
      });
      const id = `dac:deal:${c.dealId}:cond:${c.id}`;
      const a: DailyAction = {
        id,
        type: "urgent_deadline",
        title: `Condition: ${c.conditionType}`,
        summary: `Deal ${dealLabel(c.dealId)} — closing condition pending`,
        urgency,
        linkedEntityType: "deal_closing_condition",
        linkedEntityId: c.id,
        dealId: c.dealId,
        dueAt: dl.toISOString(),
        recommendedAction: "Confirm status in execution workspace before marking fulfilled.",
        riskIfIgnored: "Closing timeline risk if condition is material.",
        approvalRequired: true,
      };
      if (!isSnoozed(id, snoozed)) actions.push(a);
    }

    for (const s of suggestions) {
      const urgency = assignUrgency({
        dueAt: null,
        hasDeadlineToday: false,
        isOverdue: false,
        typePriority: "high",
      });
      const id = `dac:deal:${s.dealId}:neg:${s.id}`;
      const a: DailyAction = {
        id,
        type: "negotiation_review",
        title: s.title,
        summary: s.summary.slice(0, 160),
        urgency,
        linkedEntityType: "negotiation_suggestion",
        linkedEntityId: s.id,
        dealId: s.dealId,
        dueAt: null,
        recommendedAction: "Review scenario on desktop — mobile approval only flags readiness.",
        riskIfIgnored: null,
        approvalRequired: true,
      };
      if (!isSnoozed(id, snoozed)) actions.push(a);
    }

    for (const r of requests) {
      const due = r.dueAt;
      const urgency = assignUrgency({
        dueAt: due,
        hasDeadlineToday: due ? due >= sod && due <= eod : r.status === "OVERDUE",
        isOverdue: r.status === "OVERDUE" || (due ? due < now : false),
        typePriority: r.status === "BLOCKED" ? "critical" : "high",
      });
      const id = `dac:deal:${r.dealId}:req:${r.id}`;
      const a: DailyAction = {
        id,
        type: "missing_document_followup",
        title: r.title,
        summary: (r.summary ?? r.requestCategory).toString().slice(0, 160),
        urgency,
        linkedEntityType: "deal_request",
        linkedEntityId: r.id,
        dealId: r.dealId,
        dueAt: due?.toISOString() ?? null,
        recommendedAction: "Coordinate document request — autopilot items may need broker validation.",
        riskIfIgnored: null,
        approvalRequired: false,
      };
      if (!isSnoozed(id, snoozed)) actions.push(a);

      for (const it of r.items) {
        if (it.status !== "PENDING") continue;
        const idIt = `dac:deal:${r.dealId}:item:${it.id}`;
        const u = assignUrgency({
          dueAt: due,
          hasDeadlineToday: due ? due >= sod && due <= eod : false,
          isOverdue: due ? due < now : false,
          typePriority: "normal",
        });
        const a2: DailyAction = {
          id: idIt,
          type: "missing_document_followup",
          title: `Doc item: ${it.itemLabel}`,
          summary: `Request “${r.title}”`,
          urgency: u,
          linkedEntityType: "deal_request_item",
          linkedEntityId: it.id,
          dealId: r.dealId,
          dueAt: due?.toISOString() ?? null,
          recommendedAction: "Mark received only after you verify the document.",
          riskIfIgnored: null,
          approvalRequired: false,
        };
        if (!isSnoozed(idIt, snoozed)) actions.push(a2);
      }
    }

    for (const sig of signatures) {
      const urgency = assignUrgency({
        dueAt: null,
        hasDeadlineToday: false,
        isOverdue: false,
        typePriority: "high",
      });
      const id = `dac:deal:${sig.dealId}:sig:${sig.id}`;
      const a: DailyAction = {
        id,
        type: "signature_pending",
        title: "Signature session in progress",
        summary: `Deal ${dealLabel(sig.dealId)} — ${sig.status}`,
        urgency,
        linkedEntityType: "signature_session",
        linkedEntityId: sig.id,
        dealId: sig.dealId,
        dueAt: null,
        recommendedAction: "Open signing dashboard to track counterparties.",
        riskIfIgnored: null,
        approvalRequired: false,
      };
      if (!isSnoozed(id, snoozed)) actions.push(a);
    }

    for (const b of banks) {
      const urgency = assignUrgency({
        dueAt: null,
        hasDeadlineToday: false,
        isOverdue: false,
        typePriority: "high",
      });
      const id = `dac:deal:${b.dealId}:bank`;
      const a: DailyAction = {
        id,
        type: "financing_followup",
        title: "Financing coordination",
        summary: b.institutionName ? `Lender: ${b.institutionName}` : `Status: ${b.financingStatus}`,
        urgency,
        linkedEntityType: "deal_bank_coordination",
        linkedEntityId: b.id,
        dealId: b.dealId,
        dueAt: null,
        recommendedAction: "Follow up with lender / client — update desktop notes.",
        riskIfIgnored: null,
        approvalRequired: false,
      };
      if (!isSnoozed(id, snoozed)) actions.push(a);
    }

    for (const cc of compliance) {
      const urgency = assignUrgency({
        dueAt: null,
        hasDeadlineToday: false,
        isOverdue: false,
        typePriority: cc.severity === "critical" ? "critical" : "high",
      });
      const id = `dac:compliance:${cc.id}`;
      const a: DailyAction = {
        id,
        type: "compliance_review",
        title: `Compliance: ${cc.caseType}`,
        summary: cc.summary.slice(0, 160),
        urgency,
        linkedEntityType: "compliance_case",
        linkedEntityId: cc.id,
        dealId: cc.dealId,
        dueAt: null,
        recommendedAction: "Review findings in compliance workspace.",
        riskIfIgnored: null,
        approvalRequired: true,
      };
      if (!isSnoozed(id, snoozed)) actions.push(a);
    }
  }

  // Closing risk: deals stuck in financing / inspection with old updates
  for (const d of deals) {
    if (!["financing", "inspection", "offer_submitted"].includes(d.status)) continue;
    const days = (now.getTime() - d.updatedAt.getTime()) / 86400000;
    if (days < 10) continue;
    const id = `dac:deal:${d.id}:stale`;
    const urgency = assignUrgency({
      dueAt: null,
      hasDeadlineToday: false,
      isOverdue: false,
      typePriority: "normal",
    });
    const a: DailyAction = {
      id,
      type: "closing_blocker",
      title: `Deal ${d.dealCode ?? d.id.slice(0, 8)} — aging stage`,
      summary: `Status ${d.status} · last update ${Math.floor(days)}d ago`,
      urgency,
      linkedEntityType: "deal",
      linkedEntityId: d.id,
      dealId: d.id,
      dueAt: null,
      recommendedAction: "Reconcile blockers in deal workspace — no auto-escalation sent.",
      riskIfIgnored: "Pipeline drag if unattended.",
      approvalRequired: false,
    };
    if (!isSnoozed(id, snoozed)) actions.push(a);
  }

  return bundleDailyActions(actions);
}
