import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { runOfferStrategy } from "@/modules/offer-strategy/offer-strategy.engine";
import { buildOfferStrategyContext } from "@/modules/offer-strategy/offer-strategy-context.service";

/**
 * If the conversation is tied to a lead with a deal for this broker, returns the top offer-strategy rec key.
 */
export async function getOfferStrategyHintsForConversation(
  conversationId: string,
  brokerId: string
): Promise<{ topRecKey: string | null; competitiveLevel: "low" | "medium" | "high" } | null> {
  try {
    const lead = await prisma.lead.findFirst({
      where: { platformConversationId: conversationId },
      select: { deal: { select: { id: true, brokerId: true } } },
    });
    if (!lead?.deal || lead.deal.brokerId !== brokerId) return null;
    const ctx = await buildOfferStrategyContext({ dealId: lead.deal.id, brokerId });
    const s = runOfferStrategy(ctx);
    return {
      topRecKey: s.recommendations[0]?.key ?? null,
      competitiveLevel: s.competitiveRisk.level,
    };
  } catch {
    return null;
  }
}
