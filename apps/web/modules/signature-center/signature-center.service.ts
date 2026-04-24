import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  SignatureCenterItem,
  SignatureCenterNotification,
  SignatureCenterRisk,
  SignatureCenterSectionKey,
  SignatureCenterSnapshot,
  SignatureCenterUrgency,
} from "./signature-center.types";

const DISCLAIMER =
  "Advisory queue only — LECIPM does not replace OACIQ publisher systems, brokerage policies, or your professional judgment. You sign and execute; the platform records attestations.";

function moneyCadFromCents(cents: number | null | undefined): number | null {
  if (cents == null || !Number.isFinite(cents)) return null;
  return Math.round(cents) / 100;
}

function riskFromDeal(deal: { riskLevel: string | null }, checklistStatus?: string): SignatureCenterRisk {
  if (checklistStatus === "BLOCKED") return "high";
  const r = (deal.riskLevel ?? "").toLowerCase();
  if (r === "high") return "high";
  if (r === "medium") return "medium";
  return "low";
}

function urgencyFromDue(due: Date | null | undefined): SignatureCenterUrgency {
  if (!due) return "normal";
  const h = (due.getTime() - Date.now()) / 36e5;
  if (h < 48) return "urgent";
  if (h < 168) return "soon";
  return "normal";
}

function complianceForDeal(deal: {
  jurisdiction: string | null;
  dealExecutionType: string | null;
}): string[] {
  const flags = ["Assistive AI disclosure reviewed"];
  if ((deal.jurisdiction ?? "QC").toUpperCase() === "QC") flags.push("Québec (OACIQ) file");
  const t = (deal.dealExecutionType ?? "").toLowerCase();
  if (t.includes("coownership") || t.includes("co_ownership")) flags.push("Co-ownership / divided title diligence");
  if (t === "income_property") flags.push("Investment suitability — verify investor profile");
  return flags;
}

export type SignatureCenterQuery = {
  type?: SignatureCenterSectionKey | "all";
  risk?: SignatureCenterRisk | "all";
  minDealValueCents?: number;
  urgency?: SignatureCenterUrgency | "all";
};

function matchesFilters(item: SignatureCenterItem, q: SignatureCenterQuery): boolean {
  if (q.type && q.type !== "all" && item.section !== q.type) return false;
  if (q.risk && q.risk !== "all" && item.riskLevel !== q.risk) return false;
  if (q.minDealValueCents != null && (item.dealValueCents ?? 0) < q.minDealValueCents) return false;
  if (q.urgency && q.urgency !== "all" && item.urgency !== q.urgency) return false;
  return true;
}

export async function buildBrokerSignatureCenterSnapshot(
  brokerUserId: string,
  isAdmin: boolean,
  query: SignatureCenterQuery = {},
): Promise<SignatureCenterSnapshot> {
  const dealWhere: Prisma.DealWhereInput = isAdmin ? {} : { brokerId: brokerUserId };

  const brokerDeals = await prisma.deal.findMany({
    where: dealWhere,
    select: {
      id: true,
      dealCode: true,
      priceCents: true,
      status: true,
      dealExecutionType: true,
      riskLevel: true,
      jurisdiction: true,
    },
    take: 500,
  });
  const dealById = Object.fromEntries(brokerDeals.map((d) => [d.id, d]));
  const dealIds = brokerDeals.map((d) => d.id);

  if (dealIds.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      items: [],
      notifications: [],
      disclaimer: DISCLAIMER,
    };
  }

  const [pendingApprovals, openSignatures, docRows, checklistRows, paymentRows] = await Promise.all([
    prisma.brokerApproval.findMany({
      where: { status: "PENDING", dealId: { in: dealIds } },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.signatureSession.findMany({
      where: {
        dealId: { in: dealIds },
        status: { notIn: ["completed", "voided", "declined"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.dealDocument.findMany({
      where: {
        dealId: { in: dealIds },
        OR: [{ workflowStatus: "broker_review" }, { workflowStatus: "draft" }],
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.dealClosingChecklist.findMany({
      where: {
        dealId: { in: dealIds },
        status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 120,
    }),
    prisma.lecipmDealPayment.findMany({
      where: {
        dealId: { in: dealIds },
        status: {
          in: ["requested", "awaiting_payment", "awaiting_confirmation", "release_pending"],
        },
      },
      orderBy: { dueAt: "asc" },
      take: 80,
    }),
  ]);

  const items: SignatureCenterItem[] = [];

  for (const a of pendingApprovals) {
    const deal = dealById[a.dealId];
    if (!deal) continue;
    const risk = riskFromDeal(deal);
    const urgency = urgencyFromDue(null);
    const payload = (a.actionPayload ?? {}) as Record<string, unknown>;
    const summary =
      typeof payload.notes === "string" && payload.notes.trim() ?
        payload.notes.trim().slice(0, 160)
      : `Broker approval · ${a.actionKey.replace(/_/g, " ")}`;
    const base: SignatureCenterItem = {
      itemKey: `approval:${a.id}`,
      section: "deals",
      actionType: `Deal execution · ${a.actionKey}`,
      summary,
      aiReasoning:
        "Queued approval consolidates pipeline, document, and compliance checks. Confirm file consistency with your brokerage file before signing — AI outputs are drafts.",
      financialImpactCad: moneyCadFromCents(deal.priceCents),
      dealValueCents: deal.priceCents,
      riskLevel: risk,
      complianceFlags: complianceForDeal(deal),
      status: "pending_signature",
      urgency,
      dealId: deal.id,
      dealCode: deal.dealCode,
      createdAt: a.createdAt.toISOString(),
      dueAt: null,
      editHref: `/dashboard/deals/${deal.id}/execution`,
      previewHint: "Approval payload and deal execution workspace — upload official instruments outside the platform.",
      investorStructureSummary:
        deal.dealExecutionType === "income_property" ?
          "Income-property execution: confirm capitalization table, operating pro forma, and investor letters match your file."
        : null,
      pricingSummary:
        deal.priceCents ?
          `Deal price (platform snapshot): $${(deal.priceCents / 100).toLocaleString()} CAD — verify against accepted offer.`
        : null,
      metadata: { brokerApprovalId: a.id, beforeSnapshot: a.beforeSnapshot },
    };
    items.push(base);
    if (deal.dealExecutionType === "income_property") {
      items.push({
        ...base,
        itemKey: `approval:${a.id}:investor`,
        section: "investor",
        actionType: "Investor / income property · broker approval",
        aiReasoning:
          "Investment lane: stress-test rent, vacancy, and exit assumptions. ESG or allocation modules may reference this listing — confirm disclosures.",
      });
    }
  }

  for (const s of openSignatures) {
    const deal = dealById[s.dealId];
    if (!deal) continue;
    items.push({
      itemKey: `signature:${s.id}`,
      section: "deals",
      actionType: `Signature envelope · ${s.provider}`,
      summary: `Session ${s.status} — complete broker leg or void obsolete envelopes.`,
      aiReasoning:
        "External or manual signature providers may hold the operative document. Match envelope contents to your brokerage execution copy.",
      financialImpactCad: moneyCadFromCents(deal.priceCents),
      dealValueCents: deal.priceCents,
      riskLevel: riskFromDeal(deal),
      complianceFlags: complianceForDeal(deal),
      status: s.status === "sent" || s.status === "in_progress" ? "signed" : "pending_signature",
      urgency: "soon",
      dealId: deal.id,
      dealCode: deal.dealCode,
      createdAt: s.createdAt.toISOString(),
      dueAt: null,
      editHref: `/dashboard/deals/${deal.id}/execution`,
      previewHint: `Signature session ${s.id} — open provider or closing room to compare PDFs.`,
      investorStructureSummary: null,
      pricingSummary:
        deal.priceCents ?
          `Deal price (snapshot): $${(deal.priceCents / 100).toLocaleString()} CAD.`
        : null,
      metadata: { sessionId: s.id, status: s.status },
    });
  }

  for (const d of docRows) {
    const deal = dealById[d.dealId];
    if (!deal) continue;
    items.push({
      itemKey: `document:${d.id}`,
      section: "documents",
      actionType: `Document · ${d.type}`,
      summary: `${d.workflowStatus ?? "review"} — ${d.templateKey ?? "structured draft"}`,
      aiReasoning:
        "Drafting assistance may pre-fill schedules. Compare every material term to the latest counter-offer and annexes.",
      financialImpactCad: moneyCadFromCents(deal.priceCents),
      dealValueCents: deal.priceCents,
      riskLevel: riskFromDeal(deal),
      complianceFlags: complianceForDeal(deal),
      status: "pending_signature",
      urgency: "normal",
      dealId: deal.id,
      dealCode: deal.dealCode,
      createdAt: d.createdAt.toISOString(),
      dueAt: null,
      editHref: `/dashboard/deals/${deal.id}/execution`,
      previewHint:
        d.structuredData != null ?
          JSON.stringify(d.structuredData).slice(0, 1200) + (JSON.stringify(d.structuredData).length > 1200 ? "…" : "")
        : "No structured preview — open deal workspace documents list.",
      investorStructureSummary: null,
      pricingSummary: null,
      metadata: { documentId: d.id, workflowStatus: d.workflowStatus },
    });
  }

  for (const c of checklistRows) {
    const deal = dealById[c.dealId];
    if (!deal) continue;
    const urg = urgencyFromDue(c.dueDate);
    items.push({
      itemKey: `closing:${c.id}`,
      section: "closing",
      actionType: `Closing checklist · ${c.category}`,
      summary: c.title,
      aiReasoning:
        "Closing steps coordinate trust, notary, and registry timing. Blocked items may indicate financing or title risk.",
      financialImpactCad: moneyCadFromCents(deal.priceCents),
      dealValueCents: deal.priceCents,
      riskLevel: riskFromDeal(deal, c.status),
      complianceFlags: [...complianceForDeal(deal), c.category === "ESG" ? "ESG closing attestation" : "Closing compliance"].filter(
        Boolean,
      ) as string[],
      status: "pending_signature",
      urgency: urg,
      dealId: deal.id,
      dealCode: deal.dealCode,
      createdAt: c.createdAt.toISOString(),
      dueAt: c.dueDate?.toISOString() ?? null,
      editHref: `/dashboard/deals/${deal.id}/execution`,
      previewHint: c.notes ?? "No broker notes on this checklist row.",
      investorStructureSummary: null,
      pricingSummary: null,
      metadata: { checklistId: c.id, checklistStatus: c.status, priority: c.priority },
    });
  }

  for (const p of paymentRows) {
    const deal = dealById[p.dealId];
    if (!deal) continue;
    const urg = urgencyFromDue(p.dueAt);
    items.push({
      itemKey: `payment:${p.id}`,
      section: "financial",
      actionType: `Trust / payment · ${p.paymentKind}`,
      summary: `${p.status} · ${(p.amountCents / 100).toLocaleString()} ${p.currency.toUpperCase()}`,
      aiReasoning:
        "Funds movement affects trust ledgers and closing statements. Confirm instructions with your brokerage trust policy.",
      financialImpactCad: p.amountCents / 100,
      dealValueCents: deal.priceCents,
      riskLevel: p.status === "release_pending" ? "high" : "medium",
      complianceFlags: [...complianceForDeal(deal), "Trust & allocation review"],
      status: "pending_signature",
      urgency: urg,
      dealId: deal.id,
      dealCode: deal.dealCode,
      createdAt: p.createdAt.toISOString(),
      dueAt: p.dueAt?.toISOString() ?? null,
      editHref: `/dashboard/deals/${deal.id}/execution`,
      previewHint: "Open payments hub from deal execution — verify beneficiary and reference numbers externally.",
      investorStructureSummary: null,
      pricingSummary: `Payment leg: ${(p.amountCents / 100).toLocaleString()} ${p.currency.toUpperCase()} (${p.status})`,
      metadata: { paymentId: p.id, paymentKind: p.paymentKind, status: p.status },
    });
  }

  const filtered = items.filter((i) => matchesFilters(i, query));

  const notifications: SignatureCenterNotification[] = [];
  if (pendingApprovals.length > 0) {
    notifications.push({
      id: "new-approvals",
      title: "New actions ready",
      message: `${pendingApprovals.length} broker approval(s) awaiting signature.`,
      severity: "info",
    });
  }
  const urgentClosing = checklistRows.filter((c) => urgencyFromDue(c.dueDate) === "urgent").length;
  if (urgentClosing > 0) {
    notifications.push({
      id: "closing-deadlines",
      title: "Closing deadlines",
      message: `${urgentClosing} checklist item(s) due within 48h.`,
      severity: "critical",
    });
  }
  const urgentPayments = paymentRows.filter((p) => urgencyFromDue(p.dueAt) === "urgent").length;
  if (urgentPayments > 0) {
    notifications.push({
      id: "urgent-funds",
      title: "Urgent funds",
      message: `${urgentPayments} payment instruction(s) nearing due date.`,
      severity: "warning",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    items: filtered,
    notifications,
    disclaimer: DISCLAIMER,
  };
}
