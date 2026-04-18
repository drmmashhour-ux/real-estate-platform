import type { Prisma } from "@prisma/client";
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import { assertDealAccessForBroker, assertTeamAccess, visibilityAllows } from "./visibility.service";
import type { CreateThreadInput, PostMessageInput } from "./collaboration.types";

async function resolveThreadAccess(
  actorId: string,
  role: PlatformRole,
  thread: {
    id: string;
    teamId: string | null;
    dealId: string | null;
    createdById: string;
    visibilityScope: import("@prisma/client").BrokerCollaborationVisibilityScope;
  },
): Promise<boolean> {
  const isPlatformAdmin = role === PlatformRole.ADMIN;
  let isTeamMember = false;
  if (thread.teamId) {
    isTeamMember = await assertTeamAccess(actorId, thread.teamId, role);
  }
  let isDealParticipant = false;
  if (thread.dealId) {
    isDealParticipant = await assertDealAccessForBroker(actorId, thread.dealId, role);
  }
  return visibilityAllows(thread.visibilityScope, {
    actorId,
    threadCreatorId: thread.createdById,
    isPlatformAdmin,
    isTeamMember,
    isDealParticipant,
  });
}

export async function createThread(actorId: string, role: PlatformRole, input: CreateThreadInput) {
  if (input.teamId && !(await assertTeamAccess(actorId, input.teamId, role))) {
    return { error: "Team access denied" as const };
  }
  if (input.dealId && !(await assertDealAccessForBroker(actorId, input.dealId, role))) {
    return { error: "Deal access denied" as const };
  }

  const thread = await prisma.brokerCollaborationThread.create({
    data: {
      teamId: input.teamId ?? undefined,
      dealId: input.dealId ?? undefined,
      listingId: input.listingId ?? undefined,
      lecipmContactId: input.lecipmContactId ?? undefined,
      createdById: actorId,
      visibilityScope: input.visibilityScope,
      title: input.title ?? undefined,
    },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: actorId,
    actionKey: brokerWorkspaceAuditKeys.threadCreated,
    teamId: input.teamId,
    dealId: input.dealId,
    threadId: thread.id,
    payload: { visibilityScope: input.visibilityScope },
  });

  return { thread };
}

export async function postMessage(actorId: string, role: PlatformRole, threadId: string, input: PostMessageInput) {
  const thread = await prisma.brokerCollaborationThread.findUnique({ where: { id: threadId } });
  if (!thread) return { error: "Thread not found" as const };
  if (!(await resolveThreadAccess(actorId, role, thread))) return { error: "Forbidden" as const };

  const msg = await prisma.brokerCollaborationMessage.create({
    data: {
      threadId,
      authorId: actorId,
      body: input.body,
      messageType: input.messageType ?? "text",
      metadata: (input.metadata ?? {}) as object,
    },
  });

  await logBrokerWorkspaceEvent({
    actorUserId: actorId,
    actionKey: brokerWorkspaceAuditKeys.messagePosted,
    threadId,
    dealId: thread.dealId,
    teamId: thread.teamId,
    payload: { messageId: msg.id },
  });

  return { message: msg };
}

export async function getThread(actorId: string, role: PlatformRole, threadId: string) {
  const thread = await prisma.brokerCollaborationThread.findUnique({
    where: { id: threadId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!thread) return null;
  if (!(await resolveThreadAccess(actorId, role, thread))) return null;
  return thread;
}

export async function listThreads(actorId: string, role: PlatformRole, q: { teamId?: string; dealId?: string }) {
  const where: Prisma.BrokerCollaborationThreadWhereInput = {};
  if (q.teamId) {
    if (!(await assertTeamAccess(actorId, q.teamId, role))) return [];
    where.teamId = q.teamId;
  }
  if (q.dealId) {
    if (!(await assertDealAccessForBroker(actorId, q.dealId, role))) return [];
    where.dealId = q.dealId;
  }
  if (!q.teamId && !q.dealId) {
    where.OR = [{ createdById: actorId }, { team: { ownerBrokerId: actorId } }, { deal: { brokerId: actorId } }];
  }

  const threads = await prisma.brokerCollaborationThread.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { _count: { select: { messages: true } } },
  });

  const out: typeof threads = [];
  for (const t of threads) {
    if (await resolveThreadAccess(actorId, role, t)) out.push(t);
  }
  return out;
}
