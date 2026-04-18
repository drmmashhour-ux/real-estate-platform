import { marketplaceAiV5Flags } from "@/config/feature-flags";
import { runMarketplaceAgent } from "@/src/modules/agents/agent.engine";
import { recommendNegotiationForFsboListing } from "@/src/modules/negotiation/negotiation.engine";
import type { ExplainableAgentDecision } from "@/src/modules/agents/agent.types";

export type MultiAgentSession = {
  listingFsboId: string;
  buyerUserId: string;
  brokerUserId?: string;
};

export type OrchestratedAgentBundle = {
  buyer: ExplainableAgentDecision | null;
  seller: ExplainableAgentDecision | null;
  broker: ExplainableAgentDecision | null;
  negotiation: Awaited<ReturnType<typeof recommendNegotiationForFsboListing>>;
  notes: string[];
};

/**
 * Coordinates buyer/seller/broker agents for one listing — suggestions only, parallel safe.
 */
export async function runMultiAgentOrchestration(session: MultiAgentSession): Promise<OrchestratedAgentBundle | null> {
  if (!marketplaceAiV5Flags.agentSystemV1) return null;

  const [buyer, seller, broker, negotiation] = await Promise.all([
    runMarketplaceAgent("buyer", { type: "user", id: session.buyerUserId }),
    runMarketplaceAgent("seller", { type: "listing_fsbo", id: session.listingFsboId }),
    session.brokerUserId
      ? runMarketplaceAgent("broker", { type: "user", id: session.brokerUserId })
      : Promise.resolve(null),
    recommendNegotiationForFsboListing(session.listingFsboId),
  ]);

  return {
    buyer,
    seller,
    broker,
    negotiation,
    notes: [
      "Orchestrator does not send messages or file offers — approvals required for high-impact steps.",
      "Negotiation numbers are hints — parties must confirm with counsel/broker.",
    ],
  };
}
