import { prisma } from "@/lib/db";
import { canViewThread, type ThreadViewer } from "@/lib/messages/permissions";

export async function closeLecipmBrokerThread(threadId: string, viewer: ThreadViewer): Promise<{ ok: boolean; error?: string }> {
  if (viewer.kind !== "broker" && viewer.kind !== "admin") {
    return { ok: false, error: "Only the broker or an admin can close this conversation" };
  }

  const thread = await prisma.lecipmBrokerListingThread.findUnique({ where: { id: threadId } });
  if (!thread) return { ok: false, error: "Not found" };
  if (!canViewThread(thread, viewer)) return { ok: false, error: "Forbidden" };

  await prisma.lecipmBrokerListingThread.update({
    where: { id: threadId },
    data: { status: "closed" },
  });

  return { ok: true };
}
