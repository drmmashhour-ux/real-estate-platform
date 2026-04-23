import type { Prisma } from "@prisma/client";
import {
  LecipmDisputeCaseCategory,
  LecipmDisputeCaseEntityType,
  LecipmDisputeCaseEventType,
  LecipmDisputeCasePriority,
  LecipmDisputeCaseStatus,
  PlatformRole,
} from "@prisma/client";

import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { prisma } from "@/lib/db";
import { loadPreDisputeRiskAttachmentForEntity } from "@/modules/risk-engine/risk-prevention.service";

import { notifyDisputeEvent } from "./dispute-case-notify";
import {
  inferAgainstUserId,
  userCanAccessRelatedEntity,
  userCanViewCase,
} from "./dispute-case-permissions";
import { buildDisputeTimeline } from "./dispute-case-timeline";

const DISPUTE_COMPLIANCE_FOOTER =
  "This workflow is facilitative and does not provide legal advice or automatic fault finding. " +
  "Decisions are recorded for audit. Personal data is handled in line with platform privacy practices (e.g. Law 25).";

export { DISPUTE_COMPLIANCE_FOOTER };

export type CreateDisputeInput = {
  relatedEntityType: LecipmDisputeCaseEntityType;
  relatedEntityId: string;
  title: string;
  description: string;
  category: LecipmDisputeCaseCategory;
  priority?: LecipmDisputeCasePriority;
  againstUserId?: string | null;
  evidenceAttachments?: Prisma.JsonValue;
};

function parseEnum<T extends string>(v: string, allowed: readonly T[]): T | null {
  return (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

export const ENTITY_TYPES: LecipmDisputeCaseEntityType[] = [
  "BOOKING",
  "DEAL",
  "LISTING",
  "PAYMENT",
];
export const CATEGORIES: LecipmDisputeCaseCategory[] = [
  "NO_SHOW",
  "PAYMENT",
  "MISLEADING_LISTING",
  "OTHER",
];
export const STATUSES: LecipmDisputeCaseStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "REJECTED",
  "ESCALATED",
];
export const PRIORITIES: LecipmDisputeCasePriority[] = ["LOW", "MEDIUM", "HIGH"];

export async function createDisputeCase(input: {
  openedByUserId: string;
  role: PlatformRole;
  body: CreateDisputeInput;
}) {
  const can = await userCanAccessRelatedEntity({
    userId: input.openedByUserId,
    role: input.role,
    relatedEntityType: input.body.relatedEntityType,
    relatedEntityId: input.body.relatedEntityId,
  });
  if (!can) {
    return { ok: false as const, error: "forbidden_or_invalid_reference" };
  }

  let against = input.body.againstUserId?.trim() || null;
  if (!against) {
    against = await inferAgainstUserId({
      relatedEntityType: input.body.relatedEntityType,
      relatedEntityId: input.body.relatedEntityId,
      openedByUserId: input.openedByUserId,
    });
  }

  const row = await prisma.lecipmDisputeCase.create({
    data: {
      relatedEntityType: input.body.relatedEntityType,
      relatedEntityId: input.body.relatedEntityId,
      openedByUserId: input.openedByUserId,
      againstUserId: against,
      status: "OPEN",
      priority: input.body.priority ?? "MEDIUM",
      category: input.body.category,
      title: input.body.title.trim().slice(0, 280),
      description: input.body.description.trim(),
    },
  });

  const preDisputeRisk = await loadPreDisputeRiskAttachmentForEntity(
    row.relatedEntityType,
    row.relatedEntityId
  );

  await prisma.lecipmDisputeCaseEvent.create({
    data: {
      disputeId: row.id,
      eventType: "CREATED",
      payload: {
        relatedEntityType: row.relatedEntityType,
        relatedEntityId: row.relatedEntityId,
        preDisputeRisk,
      },
      actorUserId: input.openedByUserId,
    },
  });

  if (input.body.evidenceAttachments != null) {
    await prisma.lecipmDisputeCaseMessage.create({
      data: {
        disputeId: row.id,
        senderId: input.openedByUserId,
        message:
          "Evidence references submitted with this case (files stored per your upload flow — only references are kept here).",
        attachments: input.body.evidenceAttachments as Prisma.InputJsonValue,
      },
    });
    await prisma.lecipmDisputeCaseEvent.create({
      data: {
        disputeId: row.id,
        eventType: "EVIDENCE_ADDED",
        payload: { phase: "opening" },
        actorUserId: input.openedByUserId,
      },
    });
  }

  await recordAuditEvent({
    actorUserId: input.openedByUserId,
    action: "DISPUTE_CASE_CREATED",
    payload: { disputeId: row.id, entityType: row.relatedEntityType },
  });

  const recipients: string[] = [];
  if (against) recipients.push(against);

  await notifyDisputeEvent({
    disputeId: row.id,
    title: "New dispute case opened",
    message: row.title,
    recipientUserIds: recipients,
    actorUserId: input.openedByUserId,
    priority: row.priority === "HIGH" ? "HIGH" : "NORMAL",
  });

  return { ok: true as const, dispute: row };
}

export async function postDisputeMessage(input: {
  disputeId: string;
  senderId: string;
  role: PlatformRole;
  message: string;
  attachments?: Prisma.JsonValue | null;
}) {
  const c = await prisma.lecipmDisputeCase.findUnique({ where: { id: input.disputeId } });
  if (!c) return { ok: false as const, error: "not_found" };
  if (!userCanViewCase(input.senderId, input.role, c)) {
    return { ok: false as const, error: "forbidden" };
  }
  if (c.status === "RESOLVED" || c.status === "REJECTED") {
    return { ok: false as const, error: "case_closed" };
  }

  const msg = await prisma.lecipmDisputeCaseMessage.create({
    data: {
      disputeId: c.id,
      senderId: input.senderId,
      message: input.message.trim(),
      attachments: input.attachments ?? undefined,
    },
  });

  await prisma.lecipmDisputeCaseEvent.create({
    data: {
      disputeId: c.id,
      eventType: "MESSAGE_ADDED",
      payload: { messageId: msg.id, hasAttachments: Boolean(input.attachments) },
      actorUserId: input.senderId,
    },
  });

  if (input.attachments) {
    await prisma.lecipmDisputeCaseEvent.create({
      data: {
        disputeId: c.id,
        eventType: "EVIDENCE_ADDED",
        payload: { messageId: msg.id },
        actorUserId: input.senderId,
      },
    });
  }

  await recordAuditEvent({
    actorUserId: input.senderId,
    action: "DISPUTE_CASE_MESSAGE",
    payload: { disputeId: c.id, messageId: msg.id },
  });

  const recipients = [c.openedByUserId, c.againstUserId].filter(
    (id): id is string => Boolean(id) && id !== input.senderId
  );

  await notifyDisputeEvent({
    disputeId: c.id,
    title: "New message on your dispute",
    message: input.message.trim().slice(0, 200),
    recipientUserIds: recipients,
    actorUserId: input.senderId,
  });

  return { ok: true as const, message: msg };
}

export async function setDisputeStatus(input: {
  disputeId: string;
  actorUserId: string;
  role: PlatformRole;
  nextStatus: LecipmDisputeCaseStatus;
  resolutionNotes?: string | null;
  internalAdminNotes?: string | null;
}) {
  const c = await prisma.lecipmDisputeCase.findUnique({ where: { id: input.disputeId } });
  if (!c) return { ok: false as const, error: "not_found" };

  const isAdmin = input.role === "ADMIN";
  if (!isAdmin) {
    return { ok: false as const, error: "admin_only" };
  }

  const prev = c.status;
  const updates: Prisma.LecipmDisputeCaseUpdateInput = {
    status: input.nextStatus,
    resolutionNotes:
      input.resolutionNotes !== undefined ? input.resolutionNotes : undefined,
    internalAdminNotes:
      input.internalAdminNotes !== undefined ? input.internalAdminNotes : undefined,
  };

  if (input.nextStatus === "RESOLVED" || input.nextStatus === "REJECTED") {
    updates.resolvedAt = new Date();
    updates.resolvedByUserId = input.actorUserId;
  }

  const row = await prisma.lecipmDisputeCase.update({
    where: { id: c.id },
    data: updates,
  });

  await prisma.lecipmDisputeCaseEvent.create({
    data: {
      disputeId: c.id,
      eventType: "STATUS_CHANGE",
      payload: { from: prev, to: input.nextStatus },
      actorUserId: input.actorUserId,
    },
  });

  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: "DISPUTE_CASE_STATUS",
    payload: { disputeId: c.id, from: prev, to: input.nextStatus },
  });

  const recipients = [c.openedByUserId, c.againstUserId].filter(Boolean) as string[];
  await notifyDisputeEvent({
    disputeId: c.id,
    title: "Dispute status updated",
    message: `Status is now ${input.nextStatus}.`,
    recipientUserIds: recipients,
    actorUserId: input.actorUserId,
    priority: "HIGH",
  });

  return { ok: true as const, dispute: row };
}

export async function escalateDispute(input: {
  disputeId: string;
  actorUserId: string;
  role: PlatformRole;
  note?: string | null;
}) {
  const c = await prisma.lecipmDisputeCase.findUnique({ where: { id: input.disputeId } });
  if (!c) return { ok: false as const, error: "not_found" };
  if (!userCanViewCase(input.actorUserId, input.role, c)) {
    return { ok: false as const, error: "forbidden" };
  }
  if (c.status === "RESOLVED" || c.status === "REJECTED") {
    return { ok: false as const, error: "case_closed" };
  }

  const row = await prisma.lecipmDisputeCase.update({
    where: { id: c.id },
    data: {
      status: "ESCALATED",
      escalatedAt: new Date(),
      priority: c.priority === "LOW" ? "MEDIUM" : c.priority,
    },
  });

  await prisma.lecipmDisputeCaseEvent.create({
    data: {
      disputeId: c.id,
      eventType: "ESCALATED",
      payload: { note: input.note ?? null },
      actorUserId: input.actorUserId,
    },
  });

  await recordAuditEvent({
    actorUserId: input.actorUserId,
    action: "DISPUTE_CASE_ESCALATED",
    payload: { disputeId: c.id },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
    take: 80,
  });

  await notifyDisputeEvent({
    disputeId: c.id,
    title: "Dispute escalated",
    message: c.title,
    recipientUserIds: admins.map((a) => a.id),
    actorUserId: input.actorUserId,
    priority: "URGENT",
  });

  const parties = [c.openedByUserId, c.againstUserId].filter(Boolean) as string[];
  await notifyDisputeEvent({
    disputeId: c.id,
    title: "Your dispute was escalated",
    message: "An operator will review shortly.",
    recipientUserIds: parties.filter((id) => id !== input.actorUserId),
    actorUserId: input.actorUserId,
    priority: "HIGH",
  });

  return { ok: true as const, dispute: row };
}

export async function proposeResolution(input: {
  disputeId: string;
  actorUserId: string;
  role: PlatformRole;
  proposal: string;
}) {
  if (input.role !== "ADMIN") return { ok: false as const, error: "admin_only" };
  const c = await prisma.lecipmDisputeCase.findUnique({ where: { id: input.disputeId } });
  if (!c) return { ok: false as const, error: "not_found" };

  await prisma.lecipmDisputeCaseEvent.create({
    data: {
      disputeId: c.id,
      eventType: "RESOLUTION_PROPOSED",
      payload: { text: input.proposal.slice(0, 8000) },
      actorUserId: input.actorUserId,
    },
  });

  const recipients = [c.openedByUserId, c.againstUserId].filter(Boolean) as string[];
  await notifyDisputeEvent({
    disputeId: c.id,
    title: "Resolution pathway proposed",
    message: input.proposal.slice(0, 200),
    recipientUserIds: recipients,
    actorUserId: input.actorUserId,
  });

  return { ok: true as const };
}

export async function getDisputeDetailForUser(input: {
  disputeId: string;
  userId: string;
  role: PlatformRole;
}) {
  const c = await prisma.lecipmDisputeCase.findUnique({
    where: { id: input.disputeId },
    include: {
      openedBy: { select: { id: true, name: true, email: true } },
      againstUser: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!c) return { ok: false as const, error: "not_found" };
  if (!userCanViewCase(input.userId, input.role, c)) {
    return { ok: false as const, error: "forbidden" };
  }

  const timeline = await buildDisputeTimeline({
    disputeId: c.id,
    relatedEntityType: c.relatedEntityType,
    relatedEntityId: c.relatedEntityId,
    openedAt: c.createdAt,
  });

  return { ok: true as const, dispute: c, timeline };
}

export async function listDisputesForUser(input: {
  userId: string;
  role: PlatformRole;
  status?: LecipmDisputeCaseStatus;
  priority?: LecipmDisputeCasePriority;
  category?: LecipmDisputeCaseCategory;
}) {
  const where: Prisma.LecipmDisputeCaseWhereInput =
    input.role === "ADMIN" ?
      {}
    : {
        OR: [{ openedByUserId: input.userId }, { againstUserId: input.userId }],
      };

  if (input.status) where.status = input.status;
  if (input.priority) where.priority = input.priority;
  if (input.category) where.category = input.category;

  const rows = await prisma.lecipmDisputeCase.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      openedBy: { select: { id: true, name: true, email: true } },
      againstUser: { select: { id: true, name: true, email: true } },
    },
  });

  return rows;
}

export async function buildAssistiveSummary(input: {
  disputeId: string;
  userId: string;
  role: PlatformRole;
}) {
  const detail = await getDisputeDetailForUser({
    disputeId: input.disputeId,
    userId: input.userId,
    role: input.role,
  });
  if (!detail.ok) return detail;

  const { dispute, timeline } = detail;
  const hints: string[] = [
    "Confirm dates and amounts against primary records (booking, deal, payment).",
    "Ask both parties the same factual questions in writing.",
    "Offer neutral options (refund path, reschedule, mediation) without assigning blame.",
  ];

  const summary =
    `Assistive summary (not a decision): Case “${dispute.title}” ` +
    `(${dispute.category}, ${dispute.status}). ` +
    `Related: ${dispute.relatedEntityType} ${dispute.relatedEntityId}. ` +
    `Timeline entries: ${timeline.length}.`;

  await prisma.lecipmDisputeCase.update({
    where: { id: dispute.id },
    data: {
      aiAssistSummary: summary,
      aiAssistHintsJson: hints,
      aiAssistGeneratedAt: new Date(),
    },
  });

  return {
    ok: true as const,
    assist: {
      label: "Assistive only — does not decide outcome",
      summary,
      suggestedNeutralOptions: hints,
      keyTimelineKinds: [...new Set(timeline.map((t) => t.kind))].slice(0, 12),
    },
  };
}

export async function getDisputeMetrics(input: { role: PlatformRole }) {
  if (input.role !== "ADMIN") return { ok: false as const, error: "admin_only" };

  const since30 = new Date(Date.now() - 30 * 86400000);
  const [total, byStatus, byCategory, resolved, bookings30] = await Promise.all([
    prisma.lecipmDisputeCase.count(),
    prisma.lecipmDisputeCase.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.lecipmDisputeCase.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
    prisma.lecipmDisputeCase.findMany({
      where: { status: "RESOLVED", resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 500,
      orderBy: { resolvedAt: "desc" },
    }),
    prisma.booking.count({ where: { createdAt: { gte: since30 } } }),
  ]);

  const resolutionMs = resolved
    .map((r) => (r.resolvedAt!.getTime() - r.createdAt.getTime()) / 86400000)
    .filter((x) => Number.isFinite(x) && x >= 0);
  const avgDays =
    resolutionMs.length > 0 ?
      resolutionMs.reduce((a, b) => a + b, 0) / resolutionMs.length
    : null;

  const disputesBooking30 = await prisma.lecipmDisputeCase.count({
    where: {
      relatedEntityType: "BOOKING",
      createdAt: { gte: since30 },
    },
  });

  return {
    ok: true as const,
    metrics: {
      totalOpen: await prisma.lecipmDisputeCase.count({
        where: { status: { in: ["OPEN", "IN_REVIEW", "ESCALATED"] } },
      }),
      total,
      byStatus,
      byCategory,
      avgResolutionDays: avgDays,
      sampleSize: resolutionMs.length,
      disputesLast30dBooking: disputesBooking30,
      bookingsLast30d: bookings30,
      disputeRatePerBooking30d:
        bookings30 > 0 ? disputesBooking30 / bookings30 : null,
    },
  };
}

export function parseDisputeCreateBody(raw: unknown):
  | { ok: true; value: CreateDisputeInput }
  | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "invalid_body" };
  const o = raw as Record<string, unknown>;
  const relatedEntityType = parseEnum(String(o.relatedEntityType ?? ""), ENTITY_TYPES);
  const relatedEntityId = String(o.relatedEntityId ?? "").trim();
  const title = String(o.title ?? "").trim();
  const description = String(o.description ?? "").trim();
  const category = parseEnum(String(o.category ?? ""), CATEGORIES);
  const priority = o.priority ? parseEnum(String(o.priority), PRIORITIES) : null;
  const againstUserId =
    o.againstUserId === null || o.againstUserId === undefined ?
      null
    : String(o.againstUserId).trim() || null;
  const evidenceAttachments = o.evidenceAttachments ?? undefined;

  if (!relatedEntityType || !relatedEntityId) return { ok: false, error: "missing_entity" };
  if (!title || !description || !category) return { ok: false, error: "missing_fields" };
  if (priority === null && o.priority) return { ok: false, error: "bad_priority" };

  return {
    ok: true,
    value: {
      relatedEntityType,
      relatedEntityId,
      title,
      description,
      category,
      priority: priority ?? undefined,
      againstUserId,
      evidenceAttachments: evidenceAttachments as Prisma.JsonValue,
    },
  };
}

export function parseStatusBody(raw: unknown):
  | { ok: true; status: LecipmDisputeCaseStatus; resolutionNotes?: string | null }
  | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "invalid_body" };
  const o = raw as Record<string, unknown>;
  const status = parseEnum(String(o.status ?? ""), STATUSES);
  if (!status) return { ok: false, error: "bad_status" };
  const resolutionNotes =
    o.resolutionNotes === undefined ? undefined : String(o.resolutionNotes ?? "") || null;
  return { ok: true, status, resolutionNotes };
}
