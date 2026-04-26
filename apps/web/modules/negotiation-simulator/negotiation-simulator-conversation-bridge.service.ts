import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { runNegotiationSimulator } from "./negotiation-simulator.engine";
import { buildNegotiationSimulatorContext } from "./negotiation-simulator-context.service";

/**
 * If the thread is linked to a deal for this broker, returns the safest and highest-upside approach keys.
 */
export async function getNegotiationSimulatorHintsForConversation(
  conversationId: string,
  brokerId: string
): Promise<{ safestApproach: string | null; highestUpsideApproach: string | null; momentumLevel: "low" | "medium" | "high" } | null> {
  try {
    const lead = await prisma.lead.findFirst({
      where: { platformConversationId: conversationId },
      select: { deal: { select: { id: true, brokerId: true } } },
    });
    if (!lead?.deal || lead.deal.brokerId !== brokerId) return null;
    const ctx = await buildNegotiationSimulatorContext({ dealId: lead.deal.id, brokerId });
    const o = runNegotiationSimulator(ctx);
    return {
      safestApproach: o.safestApproach,
      highestUpsideApproach: o.highestUpsideApproach,
      momentumLevel: o.momentumRisk.level,
    };
  } catch {
    return null;
  }
}
