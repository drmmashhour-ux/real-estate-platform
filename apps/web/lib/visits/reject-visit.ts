import { prisma } from "@/lib/db";
import { formatVisitSummaryLine } from "@/lib/visits/format-lines";
import { notifyCustomerOnVisitUpdate } from "@/lib/visits/notify";
import { appendLecipmVisitThreadMessage } from "@/lib/visits/thread-message";

export async function rejectVisitRequest(
  requestId: string,
  brokerUserId: string,
  brokerNote?: string | null
): Promise<void> {
  const req = await prisma.lecipmVisitRequest.findFirst({
    where: { id: requestId, brokerUserId, status: "pending" },
    include: { listing: { select: { title: true } } },
  });
  if (!req) throw new Error("Request not found or already handled");

  await prisma.lecipmVisitRequest.update({
    where: { id: req.id },
    data: { status: "rejected", brokerNote: brokerNote?.trim() || null },
  });

  const title = req.listing?.title ?? "Listing";
  if (req.threadId) {
    await appendLecipmVisitThreadMessage(
      req.threadId,
      formatVisitSummaryLine({
        kind: "rejected",
        listingTitle: title,
        start: req.requestedStart,
        end: req.requestedEnd,
      })
    );
  }

  notifyCustomerOnVisitUpdate({
    customerUserId: req.customerUserId,
    guestEmail: req.guestEmail,
    message: "Your visit request was declined.",
  });
}
