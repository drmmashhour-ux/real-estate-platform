import { prisma } from "@/lib/db";

export type DealInvestorMatchLearningEventType =
  | "INVESTOR_MATCHED"
  | "PACKET_PREPARED"
  | "PACKET_VIEWED"
  | "INVESTOR_INTERESTED"
  | "INVESTOR_COMMITTED"
  | "DEAL_FUNDED";

export async function recordDealInvestorMatchLearning(input: {
  dealId: string;
  investorId: string;
  eventType: DealInvestorMatchLearningEventType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.dealInvestorMatchLearningEvent.create({
      data: {
        dealId: input.dealId,
        investorId: input.investorId,
        eventType: input.eventType,
        metadata: input.metadata ?? {},
      },
    });
  } catch {
    // non-fatal
  }
}
