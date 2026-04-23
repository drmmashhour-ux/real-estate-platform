import type { LecipmDisputeCase, LecipmDisputeCaseEntityType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { buildDisputeTimeline, type TimelineRow } from "@/modules/dispute-room/dispute-case-timeline";

import type { UnifiedTimelineRow } from "./dispute.types";

function asUnified(
  row: TimelineRow,
  channel: UnifiedTimelineRow["channel"]
): UnifiedTimelineRow {
  const src = row.source === "dispute_case" ? "dispute_case" : "related_entity";
  return { ...row, source: src, channel };
}

/**
 * Merges core dispute timeline with BNHub booking audit, deal transitions,
 * AI suggestion logs, and BNHub autopilot actions for the linked stay listing.
 */
export async function buildUnifiedDisputeTimeline(caseRow: {
  id: string;
  relatedEntityType: LecipmDisputeCaseEntityType;
  relatedEntityId: string;
  createdAt: Date;
}): Promise<UnifiedTimelineRow[]> {
  const base = await buildDisputeTimeline({
    disputeId: caseRow.id,
    relatedEntityType: caseRow.relatedEntityType,
    relatedEntityId: caseRow.relatedEntityId,
    openedAt: caseRow.createdAt,
  });

  const unified: UnifiedTimelineRow[] = base.map((r) =>
    asUnified(
      r,
      r.source === "dispute_case" ? "dispute_case" : mapKindToChannel(r.kind)
    )
  );

  const extra: UnifiedTimelineRow[] = [];

  if (caseRow.relatedEntityType === "BOOKING") {
    const [events, booking] = await Promise.all([
      prisma.bnhubBookingEvent.findMany({
        where: { bookingId: caseRow.relatedEntityId },
        orderBy: { createdAt: "asc" },
        take: 80,
      }),
      prisma.booking.findUnique({
        where: { id: caseRow.relatedEntityId },
        select: { listingId: true },
      }),
    ]);

    for (const ev of events) {
      extra.push({
        id: `bk-ev-${ev.id}`,
        at: ev.createdAt.toISOString(),
        kind: "booking_event",
        label: `Booking · ${ev.eventType}`,
        detail: ev.actorId ? `actor ${ev.actorId.slice(0, 8)}…` : "system",
        source: "related_entity",
        channel: "booking",
      });
    }

    if (booking?.listingId) {
      const autopilot = await prisma.aiAutopilotAction.findMany({
        where: { listingId: booking.listingId },
        orderBy: { createdAt: "asc" },
        take: 40,
        select: {
          id: true,
          createdAt: true,
          actionType: true,
          status: true,
          reasonSummary: true,
        },
      });
      for (const a of autopilot) {
        extra.push({
          id: `ap-${a.id}`,
          at: a.createdAt.toISOString(),
          kind: "autopilot",
          label: `Autopilot · ${a.actionType}`,
          detail: `${a.status}${a.reasonSummary ? ` — ${a.reasonSummary.slice(0, 120)}` : ""}`,
          source: "related_entity",
          channel: "autopilot",
        });
      }
    }
  }

  if (caseRow.relatedEntityType === "DEAL") {
    const [transitions, suggestions] = await Promise.all([
      prisma.dealStateTransition.findMany({
        where: { dealId: caseRow.relatedEntityId },
        orderBy: { createdAt: "asc" },
        take: 60,
      }),
      prisma.suggestionDecisionLog.findMany({
        where: { dealId: caseRow.relatedEntityId },
        orderBy: { createdAt: "asc" },
        take: 40,
        select: {
          id: true,
          createdAt: true,
          suggestionType: true,
          action: true,
        },
      }),
    ]);

    for (const t of transitions) {
      extra.push({
        id: `dst-${t.id}`,
        at: t.createdAt.toISOString(),
        kind: "deal_transition",
        label: `Deal state · ${t.fromState} → ${t.toState}`,
        detail: t.reason?.slice(0, 160),
        source: "related_entity",
        channel: "deal",
      });
    }

    for (const s of suggestions) {
      extra.push({
        id: `sg-${s.id}`,
        at: s.createdAt.toISOString(),
        kind: "assistant",
        label: `Assistant decision · ${s.suggestionType}`,
        detail: s.action,
        source: "related_entity",
        channel: "assistant",
      });
    }
  }

  const merged = [...unified, ...extra];
  merged.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return merged;
}

function mapKindToChannel(kind: string): UnifiedTimelineRow["channel"] {
  if (kind.includes("booking")) return "booking";
  if (kind.includes("deal")) return "deal";
  if (kind.includes("payment")) return "payment";
  return "related_entity";
}
