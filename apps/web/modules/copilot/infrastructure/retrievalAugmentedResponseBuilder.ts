import { prisma } from "@/lib/db";
import { retrieveKnowledge } from "@/modules/ai-training/application/retrieveKnowledge";
import { callCopilotTool, COPILOT_TOOLS } from "./toolRegistry";
import { assembleGroundedAnswer } from "./groundedAnswerAssembler";

export async function buildRetrievalAugmentedResponse(input: {
  query: string;
  userId?: string | null;
  workspaceId?: string | null;
  listingId?: string | null;
  leadId?: string | null;
  city?: string | null;
  intent?: string;
}) {
  const knowledge = await retrieveKnowledge(prisma, {
    userId: input.userId ?? undefined,
    workspaceId: input.workspaceId ?? undefined,
    listingId: input.listingId ?? undefined,
    city: input.city ?? undefined,
    query: input.query,
    limit: 12,
  });

  const tools = await Promise.all([
    callCopilotTool(COPILOT_TOOLS.getListing, {
      listingId: input.listingId ?? undefined,
    }),
    callCopilotTool(COPILOT_TOOLS.getTrustScore, {
      listingId: input.listingId ?? undefined,
    }),
    callCopilotTool(COPILOT_TOOLS.getDealScore, {
      listingId: input.listingId ?? undefined,
    }),
    callCopilotTool(COPILOT_TOOLS.getFraudScore, {
      listingId: input.listingId ?? undefined,
    }),
    callCopilotTool(COPILOT_TOOLS.getLeadInsights, {
      leadId: input.leadId ?? undefined,
    }),
    callCopilotTool(COPILOT_TOOLS.getPricingAdvice, {
      listingId: input.listingId ?? undefined,
    }),
    callCopilotTool(COPILOT_TOOLS.getPortfolioSummary, {
      userId: input.userId ?? undefined,
    }),
    callCopilotTool(COPILOT_TOOLS.getSeoDraftContext, {
      city: input.city ?? undefined,
      workspaceId: input.workspaceId ?? undefined,
    }),
  ]);

  const deterministic = {
    listing: tools[0],
    trust: tools[1],
    deal: tools[2],
    fraud: tools[3],
    leadInsights: tools[4],
    pricing: tools[5],
    portfolio: tools[6],
    seoDraftContext: tools[7],
    intent: input.intent ?? null,
  };

  const composed = await assembleGroundedAnswer({
    query: input.query,
    deterministicToolPayload: deterministic,
    retrievedContext: knowledge.map((k) => ({ memoryType: k.memoryType, content: k.content })),
  });

  return {
    summary: composed.summary,
    grounded: composed.grounded,
    deterministic,
    retrievedKnowledge: knowledge,
  };
}
