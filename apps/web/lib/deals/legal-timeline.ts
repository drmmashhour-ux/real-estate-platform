import { ImmoContactEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logImmoContactEvent } from "@/lib/immo/immo-contact-log";

export const DEAL_LEGAL_STAGE_ORDER = [
  "promise_received",
  "counter_proposal",
  "offer_accepted",
  "conditions_pending",
  "conditions_satisfied",
  "notary_review",
  "closing_scheduled",
  "deed_signed",
  "cancelled",
] as const;

export type DealLegalStage = (typeof DEAL_LEGAL_STAGE_ORDER)[number];

export const DEAL_LEGAL_ACTIONS = [
  "PROMISE_RECEIVED",
  "COUNTER_PROPOSAL_SENT",
  "OFFER_ACCEPTED",
  "CONDITIONS_PENDING",
  "CONDITIONS_SATISFIED",
  "NOTARY_REVIEW_STARTED",
  "CLOSING_SCHEDULED",
  "DEED_SIGNED",
  "CANCEL_TRANSACTION",
] as const;

export type DealLegalAction = (typeof DEAL_LEGAL_ACTIONS)[number];

type AuditEventRow = {
  id: string;
  eventType: string;
  createdAt: Date;
  metadata: unknown;
};

type LegalAttachment = {
  id: string;
  type: string;
  status: string;
  fileUrl: string;
  source: "deal_document" | "offer_document";
};

function stageLabel(stage: DealLegalStage) {
  return stage.replace(/_/g, " ");
}

function actionToStage(action: DealLegalAction): DealLegalStage {
  switch (action) {
    case "PROMISE_RECEIVED":
      return "promise_received";
    case "COUNTER_PROPOSAL_SENT":
      return "counter_proposal";
    case "OFFER_ACCEPTED":
      return "offer_accepted";
    case "CONDITIONS_PENDING":
      return "conditions_pending";
    case "CONDITIONS_SATISFIED":
      return "conditions_satisfied";
    case "NOTARY_REVIEW_STARTED":
      return "notary_review";
    case "CLOSING_SCHEDULED":
      return "closing_scheduled";
    case "DEED_SIGNED":
      return "deed_signed";
    case "CANCEL_TRANSACTION":
      return "cancelled";
  }
}

function actionToDealStatus(action: DealLegalAction): string {
  switch (action) {
    case "PROMISE_RECEIVED":
      return "offer_submitted";
    case "COUNTER_PROPOSAL_SENT":
      return "offer_submitted";
    case "OFFER_ACCEPTED":
      return "accepted";
    case "CONDITIONS_PENDING":
      return "inspection";
    case "CONDITIONS_SATISFIED":
      return "financing";
    case "NOTARY_REVIEW_STARTED":
      return "closing_scheduled";
    case "CLOSING_SCHEDULED":
      return "closing_scheduled";
    case "DEED_SIGNED":
      return "closed";
    case "CANCEL_TRANSACTION":
      return "cancelled";
  }
}

function statusToLegalStage(status: string): DealLegalStage {
  switch (status) {
    case "offer_submitted":
      return "promise_received";
    case "accepted":
      return "offer_accepted";
    case "inspection":
      return "conditions_pending";
    case "financing":
      return "conditions_satisfied";
    case "closing_scheduled":
      return "closing_scheduled";
    case "closed":
      return "deed_signed";
    case "cancelled":
      return "cancelled";
    default:
      return "promise_received";
  }
}

function stageRank(stage: DealLegalStage) {
  return DEAL_LEGAL_STAGE_ORDER.indexOf(stage);
}

function readMetadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function getDealLegalTimeline(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
      broker: { select: { id: true, name: true, email: true } },
      milestones: { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
      lead: {
        select: {
          id: true,
          contactAuditEvents: {
            orderBy: { createdAt: "asc" },
            take: 100,
            where: { eventType: { startsWith: "deal_legal_" } },
          },
          offerDocuments: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              type: true,
              status: true,
              contractId: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
  if (!deal) return null;

  const legalEvents = (deal.lead?.contactAuditEvents ?? []).map((event) => ({
    id: event.id,
    eventType: event.eventType,
    createdAt: event.createdAt,
    metadata: event.metadata,
    stage: (readMetadataString(event.metadata, "stage") as DealLegalStage | null) ?? null,
    note: readMetadataString(event.metadata, "note"),
    documents:
      event.metadata && typeof event.metadata === "object" && Array.isArray((event.metadata as { documents?: unknown[] }).documents)
        ? ((event.metadata as { documents?: unknown[] }).documents ?? []).filter(
            (doc): doc is LegalAttachment =>
              !!doc &&
              typeof doc === "object" &&
              typeof (doc as { id?: unknown }).id === "string" &&
              typeof (doc as { type?: unknown }).type === "string" &&
              typeof (doc as { status?: unknown }).status === "string" &&
              typeof (doc as { fileUrl?: unknown }).fileUrl === "string" &&
              ((doc as { source?: unknown }).source === "deal_document" || (doc as { source?: unknown }).source === "offer_document")
          )
        : [],
  }));

  const currentStage =
    legalEvents.length > 0
      ? (legalEvents[legalEvents.length - 1]?.stage ?? statusToLegalStage(deal.status))
      : statusToLegalStage(deal.status);

  const stages = DEAL_LEGAL_STAGE_ORDER.map((stage) => {
    const rank = stageRank(stage);
    const currentRank = stageRank(currentStage);
    return {
      key: stage,
      label: stageLabel(stage),
      status: rank < currentRank ? "completed" : rank === currentRank ? "current" : "upcoming",
    };
  });

  return {
    dealId: deal.id,
    dealCode: deal.dealCode,
    status: deal.status,
    currentStage,
    stages,
    events: legalEvents,
    milestones: deal.milestones,
    documents: [
      ...deal.documents.map((doc) => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        fileUrl: doc.fileUrl,
        createdAt: doc.createdAt,
        source: "deal_document" as const,
      })),
      ...((deal.lead?.offerDocuments ?? []).map((doc) => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        fileUrl: doc.contractId ? `/contracts/${doc.contractId}` : "#",
        createdAt: doc.createdAt,
        source: "offer_document" as const,
      })) ?? []),
    ],
    parties: {
      buyer: deal.buyer,
      seller: deal.seller,
      broker: deal.broker,
    },
    availableActions: DEAL_LEGAL_ACTIONS.map((action) => ({
      key: action,
      label: action.replace(/_/g, " ").toLowerCase(),
      stage: actionToStage(action),
    })),
  };
}

export async function recordDealLegalAction(args: {
  dealId: string;
  actorUserId: string;
  action: DealLegalAction;
  note?: string | null;
  documentIds?: string[];
}) {
  const deal = await prisma.deal.findUnique({
    where: { id: args.dealId },
    select: {
      id: true,
      listingId: true,
      listingCode: true,
      leadId: true,
      buyerId: true,
      brokerId: true,
      status: true,
    },
  });
  if (!deal) throw new Error("Deal not found");

  const stage = actionToStage(args.action);
  const nextStatus = actionToDealStatus(args.action);
  const milestoneName = stageLabel(stage);
  const documentIds = Array.isArray(args.documentIds) ? args.documentIds.filter((id) => typeof id === "string" && id.trim()) : [];
  const linkedDealDocuments =
    documentIds.length > 0
      ? await prisma.dealDocument.findMany({
          where: {
            dealId: deal.id,
            id: { in: documentIds },
          },
          select: { id: true, type: true, status: true, fileUrl: true },
        })
      : [];
  const linkedOfferDocuments =
    documentIds.length > 0 && deal.leadId
      ? await prisma.offerDocument.findMany({
          where: {
            leadId: deal.leadId,
            id: { in: documentIds },
          },
          select: { id: true, type: true, status: true, contractId: true },
        })
      : [];
  const linkedDocuments: LegalAttachment[] = [
    ...linkedDealDocuments.map((doc) => ({
      id: doc.id,
      type: doc.type,
      status: doc.status,
      fileUrl: doc.fileUrl,
      source: "deal_document" as const,
    })),
    ...linkedOfferDocuments.map((doc) => ({
      id: doc.id,
      type: doc.type,
      status: doc.status,
      fileUrl: doc.contractId ? `/contracts/${doc.contractId}` : "#",
      source: "offer_document" as const,
    })),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: deal.id },
      data: { status: nextStatus },
    });

    const existingMilestone = await tx.dealMilestone.findFirst({
      where: { dealId: deal.id, name: milestoneName },
      select: { id: true, status: true },
    });

    if (existingMilestone) {
      await tx.dealMilestone.update({
        where: { id: existingMilestone.id },
        data: {
          status: args.action === "CANCEL_TRANSACTION" ? "pending" : "completed",
          completedAt: args.action === "CANCEL_TRANSACTION" ? null : new Date(),
        },
      });
    } else {
      await tx.dealMilestone.create({
        data: {
          dealId: deal.id,
          name: milestoneName,
          status: args.action === "CANCEL_TRANSACTION" ? "pending" : "completed",
          completedAt: args.action === "CANCEL_TRANSACTION" ? null : new Date(),
        },
      });
    }

    if (deal.leadId) {
      await tx.leadContactAuditEvent.create({
        data: {
          leadId: deal.leadId,
          actorUserId: args.actorUserId,
          listingId: deal.listingId ?? undefined,
          eventType: `deal_legal_${stage}`,
          metadata: {
            dealId: deal.id,
            action: args.action,
            stage,
            note: args.note ?? null,
            status: nextStatus,
            documents: linkedDocuments,
          },
        },
      });
    }
  });

  await logImmoContactEvent({
    userId: deal.buyerId,
    brokerId: deal.brokerId ?? null,
    listingId: deal.listingId ?? null,
    listingKind: deal.listingCode ? "bnhub" : null,
    contactType: ImmoContactEventType.MESSAGE,
    metadata: {
      eventType: "DEAL_LEGAL_STAGE",
      dealId: deal.id,
      action: args.action,
      stage,
      note: args.note ?? null,
      status: nextStatus,
      documents: linkedDocuments,
    },
    policy: {
      sourceHub: "admin",
      channel: "deal",
      dealId: deal.id,
      leadId: deal.leadId ?? undefined,
      feature: stage,
    },
  });

  return getDealLegalTimeline(deal.id);
}
