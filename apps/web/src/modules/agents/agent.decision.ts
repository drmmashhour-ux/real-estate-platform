import { prisma } from "@/lib/db";
import { marketplaceAiV5Flags } from "@/config/feature-flags";
import type { ExplainableAgentDecision, MarketplaceAgentKind } from "./agent.types";

export async function logAgentDecision(args: {
  agentKind: MarketplaceAgentKind;
  subjectType?: string | null;
  subjectId?: string | null;
  decisionType: string;
  decision: ExplainableAgentDecision;
  requiresApproval?: boolean;
}): Promise<{ id: string } | null> {
  if (!marketplaceAiV5Flags.agentSystemV1) return null;

  const row = await prisma.marketplaceAgentV5DecisionLog.create({
    data: {
      agentKind: args.agentKind,
      subjectType: args.subjectType ?? undefined,
      subjectId: args.subjectId ?? undefined,
      decisionType: args.decisionType,
      inputJson: {},
      outputJson: {
        decision: args.decision.decision,
        suggestions: args.decision.suggestions,
      } as object,
      reasoning: args.decision.reasoning.join("\n"),
      confidence: args.decision.confidence,
      dataUsedSummary: args.decision.dataUsed.join("; "),
      requiresApproval: args.requiresApproval ?? true,
    },
  });
  return { id: row.id };
}
