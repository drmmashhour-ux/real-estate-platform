import { prisma } from "@/lib/db";
import { growthV3Flags } from "@/config/feature-flags";

export async function getBrainMemory(scopeKey: string): Promise<{ weights: Record<string, number>; stats: Record<string, number> }> {
  if (!growthV3Flags.growthBrainV1) {
    return { weights: {}, stats: {} };
  }
  const row = await prisma.growthBrainMemory.findUnique({ where: { scopeKey } });
  const w = (row?.weightsJson as Record<string, number>) ?? {};
  const s = (row?.statsJson as Record<string, number>) ?? {};
  return { weights: w, stats: s };
}

export async function upsertBrainMemory(
  scopeKey: string,
  patch: { weights?: Record<string, number>; stats?: Record<string, number> }
): Promise<void> {
  if (!growthV3Flags.growthBrainV1) return;
  const existing = await prisma.growthBrainMemory.findUnique({ where: { scopeKey } });
  const weights = { ...((existing?.weightsJson as object) ?? {}), ...patch.weights } as Record<string, number>;
  const stats = { ...((existing?.statsJson as object) ?? {}), ...patch.stats } as Record<string, number>;
  await prisma.growthBrainMemory.upsert({
    where: { scopeKey },
    create: { scopeKey, weightsJson: weights, statsJson: stats },
    update: { weightsJson: weights, statsJson: stats },
  });
}
