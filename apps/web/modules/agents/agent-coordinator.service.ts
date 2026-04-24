import { prisma } from "@/lib/db";
import { logAgent } from "./agent-logger";
import { updateAgentExposure } from "./competition.engine";

/**
 * Propose a new strategy from an agent.
 */
export async function proposeAgentStrategy(args: {
  agentId: string;
  strategyKey: string;
  description: string;
  payloadJson: any;
}) {
  // @ts-ignore
  const agent = await prisma.aiAgent.findUnique({
    where: { id: args.agentId },
  });

  if (!agent || agent.status !== "ACTIVE") {
    throw new Error("Agent not found or inactive");
  }

  // Safety Layer: Policy caps (conceptual)
  // In a real system, we'd validate payloadJson against domain-specific caps
  
  // @ts-ignore
  const strategy = await prisma.aiAgentStrategy.create({
    data: {
      agentId: args.agentId,
      strategyKey: args.strategyKey,
      description: args.description,
      payloadJson: args.payloadJson,
    },
  });

  logAgent("strategy_proposed", {
    agentId: args.agentId,
    strategyKey: args.strategyKey,
  });

  return strategy;
}

/**
 * Record outcome for an agent strategy.
 */
export async function recordAgentOutcome(strategyId: string, success: boolean) {
  // @ts-ignore
  const strategy = await prisma.aiAgentStrategy.findUnique({
    where: { id: strategyId },
    include: { agent: true },
  });

  if (!strategy) return;

  // @ts-ignore
  await prisma.aiAgentStrategy.update({
    where: { id: strategyId },
    data: {
      successCount: success ? { increment: 1 } : undefined,
      failureCount: !success ? { increment: 1 } : undefined,
    },
  });

  // Recompute win rate for strategy
  // @ts-ignore
  const updated = await prisma.aiAgentStrategy.findUnique({
    where: { id: strategyId },
  });
  
  if (updated) {
    const total = updated.successCount + updated.failureCount;
    const winRate = total > 0 ? updated.successCount / total : 0;
    
    // @ts-ignore
    await prisma.aiAgentStrategy.update({
      where: { id: strategyId },
      data: { winRate },
    });
  }

  // Trigger agent exposure update for the domain
  await updateAgentExposure(strategy.agent.domain);
}
