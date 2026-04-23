import type { LecipmDisputeCaseEntityType } from "@prisma/client";

import { prisma } from "@/lib/db";

export type TimelineRow = {
  id: string;
  at: string;
  kind: string;
  label: string;
  detail?: string;
  source: "dispute_case" | "related_entity";
};

export async function buildDisputeTimeline(input: {
  disputeId: string;
  relatedEntityType: LecipmDisputeCaseEntityType;
  relatedEntityId: string;
  openedAt: Date;
}): Promise<TimelineRow[]> {
  const rows: TimelineRow[] = [];

  const [messages, events, bookingCtx, dealCtx, payCtx] = await Promise.all([
    prisma.lecipmDisputeCaseMessage.findMany({
      where: { disputeId: input.disputeId },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, message: true },
    }),
    prisma.lecipmDisputeCaseEvent.findMany({
      where: { disputeId: input.disputeId },
      orderBy: { createdAt: "asc" },
      select: { id: true, eventType: true, payload: true, createdAt: true },
    }),
    input.relatedEntityType === "BOOKING" ?
      prisma.booking.findUnique({
        where: { id: input.relatedEntityId },
        select: {
          createdAt: true,
          status: true,
          updatedAt: true,
          payment: { select: { status: true, updatedAt: true } },
        },
      })
    : Promise.resolve(null),
    input.relatedEntityType === "DEAL" ?
      prisma.deal.findUnique({
        where: { id: input.relatedEntityId },
        select: {
          createdAt: true,
          updatedAt: true,
          status: true,
          crmStage: true,
        },
      })
    : Promise.resolve(null),
    input.relatedEntityType === "PAYMENT" ?
      prisma.platformPayment.findUnique({
        where: { id: input.relatedEntityId },
        select: { createdAt: true, updatedAt: true, status: true, amountCents: true },
      })
    : Promise.resolve(null),
  ]);

  if (bookingCtx) {
    rows.push({
      id: `rel-bk-created`,
      at: bookingCtx.createdAt.toISOString(),
      kind: "booking",
      label: "Booking record created",
      detail: `status ${bookingCtx.status}`,
      source: "related_entity",
    });
    rows.push({
      id: `rel-bk-pay`,
      at: (bookingCtx.payment?.updatedAt ?? bookingCtx.updatedAt).toISOString(),
      kind: "payment",
      label: "Payment snapshot (linked)",
      detail: bookingCtx.payment ? `payment status ${bookingCtx.payment.status}` : "No linked payment row",
      source: "related_entity",
    });
  }

  if (dealCtx) {
    rows.push({
      id: `rel-deal-created`,
      at: dealCtx.createdAt.toISOString(),
      kind: "deal",
      label: "Deal opened",
      detail: `${dealCtx.status} · ${dealCtx.crmStage ?? "crm n/a"}`,
      source: "related_entity",
    });
    rows.push({
      id: `rel-deal-updated`,
      at: dealCtx.updatedAt.toISOString(),
      kind: "deal",
      label: "Deal last updated",
      detail: dealCtx.status,
      source: "related_entity",
    });
  }

  if (payCtx) {
    rows.push({
      id: `rel-pay`,
      at: payCtx.createdAt.toISOString(),
      kind: "payment",
      label: "Platform payment recorded",
      detail: `status ${payCtx.status} · ${payCtx.amountCents} cents`,
      source: "related_entity",
    });
  }

  for (const e of events) {
    const payload = e.payload as Record<string, unknown> | null;
    const note =
      typeof payload?.note === "string" ? payload.note
      : typeof payload?.from === "string" && typeof payload?.to === "string" ?
        `${payload.from} → ${payload.to}`
      : undefined;
    if (e.eventType === "MESSAGE_ADDED") continue;
    rows.push({
      id: `evt-${e.id}`,
      at: e.createdAt.toISOString(),
      kind: e.eventType.toLowerCase(),
      label: formatEventLabel(e.eventType),
      detail: note,
      source: "dispute_case",
    });
  }

  for (const m of messages) {
    rows.push({
      id: `msg-${m.id}`,
      at: m.createdAt.toISOString(),
      kind: "message",
      label: "Message posted",
      detail: m.message.slice(0, 160),
      source: "dispute_case",
    });
  }

  rows.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return rows;
}

function formatEventLabel(t: string): string {
  switch (t) {
    case "CREATED":
      return "Case created (audit)";
    case "STATUS_CHANGE":
      return "Status updated";
    case "MESSAGE_ADDED":
      return "Message recorded";
    case "EVIDENCE_ADDED":
      return "Evidence reference added";
    case "ESCALATED":
      return "Escalated for arbitration";
    case "ADMIN_NOTE":
      return "Operator note";
    case "RESOLUTION_PROPOSED":
      return "Resolution pathway proposed";
    default:
      return t;
  }
}
