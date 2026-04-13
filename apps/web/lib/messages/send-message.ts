import type { LecipmBrokerMessageSenderRole } from "@prisma/client";
import { scoreBrokerCrmLead } from "@/lib/broker-crm/score-lead";
import { prisma } from "@/lib/db";
import { notifyCustomerBrokerReplied } from "@/lib/messages/notify";
import { canViewThread, type ThreadViewer } from "@/lib/messages/permissions";
import { validateMessageBody } from "@/lib/messages/validators";

export type SendMessageInput = {
  threadId: string;
  body: unknown;
  viewer: ThreadViewer;
};

export type SendMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; status: number };

function senderRoleForViewer(viewer: ThreadViewer): LecipmBrokerMessageSenderRole {
  if (viewer.kind === "admin") return "admin";
  if (viewer.kind === "broker") return "broker";
  if (viewer.kind === "customer") return "customer";
  return "guest";
}

export async function sendLecipmBrokerMessage(input: SendMessageInput): Promise<SendMessageResult> {
  const parsed = validateMessageBody(input.body);
  if (!parsed.ok) return { ok: false, error: parsed.error, status: 400 };

  const thread = await prisma.lecipmBrokerListingThread.findUnique({
    where: { id: input.threadId },
  });
  if (!thread) return { ok: false, error: "Thread not found", status: 404 };

  const viewer = input.viewer;
  if (!canViewThread(thread, viewer)) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const senderRole = senderRoleForViewer(viewer);
  const senderUserId =
    viewer.kind === "broker" || viewer.kind === "customer" || viewer.kind === "admin" ? viewer.userId : null;

  const now = new Date();
  let newStatus = thread.status;
  if (senderRole === "broker" || senderRole === "admin") {
    newStatus = "replied";
  } else {
    newStatus = thread.status === "closed" ? "open" : "open";
  }

  const msg = await prisma.$transaction(async (tx) => {
    const m = await tx.lecipmBrokerListingMessage.create({
      data: {
        threadId: thread.id,
        senderUserId,
        senderRole,
        body: parsed.body,
        isRead: false,
      },
    });
    await tx.lecipmBrokerListingThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: now, status: newStatus, updatedAt: now },
    });
    return m;
  });

  if (senderRole === "broker" || senderRole === "admin") {
    void notifyCustomerBrokerReplied(thread);
  }

  const crmLead = await prisma.lecipmBrokerCrmLead.findFirst({ where: { threadId: thread.id } });
  if (crmLead) {
    if (senderRole === "broker" || senderRole === "admin") {
      await prisma.lecipmBrokerCrmLead.update({
        where: { id: crmLead.id },
        data: {
          lastContactAt: now,
          ...(crmLead.status === "new" ? { status: "contacted" as const } : {}),
        },
      });
    }
    void scoreBrokerCrmLead(crmLead.id).catch(() => {});
  }

  return { ok: true, messageId: msg.id };
}
