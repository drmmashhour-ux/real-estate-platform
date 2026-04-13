import { prisma } from "@/lib/db";

export async function findAutopilotActionForBroker(
  actionId: string,
  brokerUserId: string,
  isAdmin: boolean
) {
  return prisma.lecipmBrokerAutopilotAction.findFirst({
    where: { id: actionId, ...(isAdmin ? {} : { brokerUserId }) },
    include: {
      lead: {
        select: {
          id: true,
          threadId: true,
          guestName: true,
          guestEmail: true,
          listing: { select: { id: true, title: true, listingCode: true } },
          customer: { select: { name: true, email: true } },
        },
      },
    },
  });
}
