import { growthV3Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";

export type BestSendWindow = {
  hourUtc: number;
  confidence: number;
  explanation: string[];
};

/**
 * Heuristic best hour from recent activity timestamps — not personalized medical/legal advice.
 */
export async function predictBestSendTime(userId: string): Promise<BestSendWindow> {
  if (!growthV3Flags.orchestrationEngineV1) {
    return {
      hourUtc: 14,
      confidence: 0.2,
      explanation: ["Orchestration off — default mid-day UTC."],
    };
  }

  const rows = await prisma.userBehaviorEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { createdAt: true },
  });
  if (!rows.length) {
    return {
      hourUtc: 15,
      confidence: 0.25,
      explanation: ["No behavior timestamps — neutral default hour UTC."],
    };
  }

  const hours = rows.map((r) => r.createdAt.getUTCHours());
  const tally = new Map<number, number>();
  for (const h of hours) tally.set(h, (tally.get(h) ?? 0) + 1);
  let best = 14;
  let bestC = 0;
  for (const [h, c] of tally) {
    if (c > bestC) {
      best = h;
      bestC = c;
    }
  }

  return {
    hourUtc: best,
    confidence: Math.min(0.85, 0.35 + bestC / rows.length),
    explanation: [
      `Mode UTC hour ${best} from ${rows.length} recent behavior events.`,
      "Use with frequency caps and user timezone preference when available.",
    ],
  };
}
