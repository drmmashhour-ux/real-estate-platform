import type { LecipmBrokerMessageSenderRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canViewThread, type ThreadViewer } from "@/lib/messages/permissions";

function rolesToMarkForViewer(viewer: ThreadViewer): LecipmBrokerMessageSenderRole[] {
  if (viewer.kind === "broker" || viewer.kind === "admin") {
    return ["customer", "guest"];
  }
  return ["broker", "admin"];
}

export async function markLecipmBrokerThreadRead(threadId: string, viewer: ThreadViewer): Promise<{ ok: boolean }> {
  const thread = await prisma.lecipmBrokerListingThread.findUnique({ where: { id: threadId } });
  if (!thread || !canViewThread(thread, viewer)) return { ok: false };

  const roles = rolesToMarkForViewer(viewer);
  const now = new Date();

  await prisma.lecipmBrokerListingMessage.updateMany({
    where: {
      threadId,
      senderRole: { in: roles },
      isRead: false,
    },
    data: { isRead: true, readAt: now },
  });

  return { ok: true };
}
