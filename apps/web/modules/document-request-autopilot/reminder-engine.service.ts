import { DealRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Draft reminder records — broker sends via communications layer. */
export async function buildOverdueReminders(dealId: string) {
  const now = new Date();
  const reqs = await prisma.dealRequest.findMany({
    where: {
      dealId,
      dueAt: { lt: now },
      status: {
        in: [
          DealRequestStatus.SENT,
          DealRequestStatus.AWAITING_RESPONSE,
          DealRequestStatus.PARTIALLY_FULFILLED,
          DealRequestStatus.READY,
        ],
      },
    },
    include: { items: true },
  });
  return reqs.map((r) => ({
    dealRequestId: r.id,
    title: `Reminder: ${r.title}`,
    body: `Due date passed (${r.dueAt?.toISOString().slice(0, 10) ?? "unknown"}). Status: ${r.status}.`,
    channel: "EMAIL_DRAFT" as const,
  }));
}
