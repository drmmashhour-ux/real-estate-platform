import { prisma } from "@repo/db";
import { runDealCloser } from "@/modules/deal-closer/deal-closer.engine";
import { buildDealCloserContext } from "@/modules/deal-closer/deal-closer-context.service";

/**
 * If this conversation is linked to a CRM lead with a deal, returns a light hint for messaging.
 * Never throws; safe when no deal.
 */
export async function getDealCloserHintsForConversation(
  conversationId: string,
  brokerId: string
): Promise<{ topActionKey: string | null; prematurePushRisk: "low" | "medium" | "high" } | null> {
  try {
    const lead = await prisma.lead.findFirst({
      where: { platformConversationId: conversationId },
      select: { deal: { select: { id: true, brokerId: true } } },
    });
    if (!lead?.deal || lead.deal.brokerId !== brokerId) return null;
    const ctx = await buildDealCloserContext({ dealId: lead.deal.id, brokerId });
    const o = runDealCloser(ctx);
    return {
      topActionKey: o.nextActions[0]?.key ?? null,
      prematurePushRisk: o.prematurePushRisk,
    };
  } catch {
    return null;
  }
}
