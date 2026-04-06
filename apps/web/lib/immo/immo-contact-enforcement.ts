import { ImmoContactEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logImmoContactEvent } from "@/lib/immo/immo-contact-log";

export const IMMO_ADMIN_ACTIONS = [
  "HOLD_CONTACT",
  "RELEASE_CONTACT_HOLD",
  "BLOCK_BUYER",
  "UNBLOCK_BUYER",
  "RESTRICT_BROKER",
  "RESTORE_BROKER",
  "ARCHIVE_THREAD",
  "ESCALATE_LEGAL_REVIEW",
] as const;

export type ImmoAdminActionType = (typeof IMMO_ADMIN_ACTIONS)[number];

type EnforcementMetadata = {
  eventType?: unknown;
  actionType?: unknown;
  reasonCode?: unknown;
  note?: unknown;
  leadId?: unknown;
  conversationId?: unknown;
};

type RestrictionState = {
  blocked: boolean;
  code: string | null;
  message: string | null;
  actionType: ImmoAdminActionType | null;
};

function readMeta(value: unknown): EnforcementMetadata {
  return value && typeof value === "object" ? (value as EnforcementMetadata) : {};
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isAdminEnforcement(meta: EnforcementMetadata): boolean {
  return readString(meta.eventType) === "ADMIN_ENFORCEMENT";
}

function restrictionFromAction(actionType: ImmoAdminActionType | null, reasonCode: string | null, note: string | null): RestrictionState {
  switch (actionType) {
    case "HOLD_CONTACT":
      return {
        blocked: true,
        code: reasonCode,
        actionType,
        message: note || "Contact is on hold pending admin review.",
      };
    case "BLOCK_BUYER":
      return {
        blocked: true,
        code: reasonCode,
        actionType,
        message: note || "Buyer is blocked from monitored contact.",
      };
    case "RESTRICT_BROKER":
      return {
        blocked: true,
        code: reasonCode,
        actionType,
        message: note || "Broker is restricted from monitored contact.",
      };
    case "ESCALATE_LEGAL_REVIEW":
      return {
        blocked: true,
        code: reasonCode,
        actionType,
        message: note || "Contact is blocked until legal review is completed.",
      };
    default:
      return { blocked: false, code: null, message: null, actionType };
  }
}

function applyLatestAction(
  logs: Array<{ metadata: unknown; userId: string | null; brokerId: string | null; listingId: string | null }>,
  match: (row: { metadata: unknown; userId: string | null; brokerId: string | null; listingId: string | null }, meta: EnforcementMetadata) => boolean
): RestrictionState {
  for (const row of logs) {
    const meta = readMeta(row.metadata);
    if (!isAdminEnforcement(meta) || !match(row, meta)) continue;
    const actionType = readString(meta.actionType) as ImmoAdminActionType | null;
    const reasonCode = readString(meta.reasonCode);
    const note = readString(meta.note);
    return restrictionFromAction(actionType, reasonCode, note);
  }
  return { blocked: false, code: null, message: null, actionType: null };
}

export async function getImmoContactRestriction(args: {
  listingId?: string | null;
  buyerUserId?: string | null;
  brokerId?: string | null;
  leadId?: string | null;
  conversationId?: string | null;
}) {
  const or = [
    args.listingId ? { listingId: args.listingId } : null,
    args.buyerUserId ? { userId: args.buyerUserId } : null,
    args.brokerId ? { brokerId: args.brokerId } : null,
  ].filter((value): value is { listingId: string } | { userId: string } | { brokerId: string } => value !== null);

  if (or.length === 0) {
    return { blocked: false, reasons: [] as string[], active: [] as RestrictionState[] };
  }

  const rows = await prisma.immoContactLog.findMany({
    where: { OR: or },
    orderBy: { actionAt: "desc" },
    take: 200,
    select: {
      metadata: true,
      userId: true,
      brokerId: true,
      listingId: true,
    },
  });

  const listingState = args.listingId
    ? applyLatestAction(rows, (row) => row.listingId === args.listingId)
    : { blocked: false, code: null, message: null, actionType: null };
  const buyerState = args.buyerUserId
    ? applyLatestAction(rows, (row) => row.userId === args.buyerUserId)
    : { blocked: false, code: null, message: null, actionType: null };
  const brokerState = args.brokerId
    ? applyLatestAction(rows, (row) => row.brokerId === args.brokerId)
    : { blocked: false, code: null, message: null, actionType: null };

  const active = [listingState, buyerState, brokerState].filter((state) => state.blocked);
  return {
    blocked: active.length > 0,
    reasons: active.map((state) => state.message ?? "Admin restriction active."),
    active,
  };
}

export async function recordImmoAdminAction(args: {
  actorAdminId: string;
  actionType: ImmoAdminActionType;
  reasonCode: string;
  note: string;
  listingId?: string | null;
  listingKind?: string | null;
  buyerUserId?: string | null;
  targetUserId?: string | null;
  brokerId?: string | null;
  leadId?: string | null;
  conversationId?: string | null;
}) {
  await logImmoContactEvent({
    userId: args.buyerUserId ?? null,
    targetUserId: args.targetUserId ?? null,
    brokerId: args.brokerId ?? null,
    hub: "admin",
    listingId: args.listingId ?? null,
    listingKind: args.listingKind ?? null,
    contactType: ImmoContactEventType.MESSAGE,
    metadata: {
      eventType: "ADMIN_ENFORCEMENT",
      actionType: args.actionType,
      reasonCode: args.reasonCode,
      note: args.note,
      leadId: args.leadId ?? null,
      conversationId: args.conversationId ?? null,
      actorAdminId: args.actorAdminId,
    },
    policy: {
      sourceHub: "admin",
      channel: "api",
      leadId: args.leadId ?? undefined,
      feature: args.actionType.toLowerCase(),
    },
  });

  if (args.actionType === "ARCHIVE_THREAD" && args.conversationId) {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: args.conversationId },
      data: { isArchived: true },
    });
    await prisma.messageEvent.create({
      data: {
        conversationId: args.conversationId,
        actorId: args.actorAdminId,
        type: "CONVERSATION_ARCHIVED",
        metadata: {
          source: "admin_enforcement",
          reasonCode: args.reasonCode,
          note: args.note,
          leadId: args.leadId ?? null,
        },
      },
    });
  }
}
