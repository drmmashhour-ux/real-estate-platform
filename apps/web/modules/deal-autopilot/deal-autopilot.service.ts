import { prisma } from "@/lib/db";

/**
 * Loads deal facts for autopilot — server-side only.
 */
export async function loadDealForAutopilot(dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      documents: { take: 80, orderBy: { createdAt: "desc" } },
      complianceCases: true,
      dealClosingConditions: true,
      dealRequests: { include: { items: true }, take: 40 },
      lecipmDealPayments: { take: 30 },
      notaryCoordination: true,
      bankCoordination: true,
      signatureSessions: { take: 20 },
      lecipmFormInstances: { include: { template: true }, take: 20 },
      negotiationThreads: { take: 5 },
      negotiationSuggestions: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });
}
