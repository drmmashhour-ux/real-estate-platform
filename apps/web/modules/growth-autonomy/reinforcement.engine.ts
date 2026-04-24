import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { GrowthChannel } from "./growth.types";

const TAG = "[growth-engine]";

/**
 * Updates playbook memory based on experiment outcomes.
 */
export async function reinforceGrowthTactic(args: {
  strategyKey: string;
  channel: GrowthChannel;
  success: boolean;
  lift?: number;
}) {
  // @ts-ignore
  const memory = await prisma.growthPlaybookMemory.findUnique({
    where: { strategyKey: args.strategyKey },
  });

  const delta = args.lift ? Math.min(0.1, args.lift / 100) : 0.05;
  const newScore = memory 
    ? (args.success ? Math.min(1, memory.score + delta) : Math.max(0, memory.score - delta))
    : (args.success ? 0.6 : 0.4);

  // @ts-ignore
  await prisma.growthPlaybookMemory.upsert({
    where: { strategyKey: args.strategyKey },
    create: {
      strategyKey: args.strategyKey,
      channel: args.channel,
      score: newScore,
      wins: args.success ? 1 : 0,
      losses: args.success ? 0 : 1,
    },
    update: {
      score: newScore,
      wins: args.success ? { increment: 1 } : undefined,
      losses: !args.success ? { increment: 1 } : undefined,
    },
  });

  logInfo(`${TAG} tactic_${args.success ? "promoted" : "demoted"}`, { 
    strategy: args.strategyKey, 
    newScore 
  });
}
