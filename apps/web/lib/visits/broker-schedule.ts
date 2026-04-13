import { prisma } from "@/lib/db";

/** Throws if broker already has a scheduled visit or pending request overlapping [start, end). */
export async function assertBrokerSlotFree(
  brokerUserId: string,
  start: Date,
  end: Date,
  opts?: { excludeVisitRequestId?: string }
): Promise<void> {
  const visit = await prisma.lecipmVisit.findFirst({
    where: {
      brokerUserId,
      status: "scheduled",
      AND: [{ startDateTime: { lt: end } }, { endDateTime: { gt: start } }],
    },
    select: { id: true },
  });
  if (visit) {
    throw new Error("That time is no longer available.");
  }

  const pending = await prisma.lecipmVisitRequest.findFirst({
    where: {
      brokerUserId,
      status: "pending",
      ...(opts?.excludeVisitRequestId ? { id: { not: opts.excludeVisitRequestId } } : {}),
      AND: [{ requestedStart: { lt: end } }, { requestedEnd: { gt: start } }],
    },
    select: { id: true },
  });
  if (pending) {
    throw new Error("That time is no longer available.");
  }
}
