import { Prisma, type PrismaClient } from "@prisma/client";
import { normalizeTrafficSplit, parseTrafficSplitJson } from "@/lib/experiments/validators";

type Db = PrismaClient | Prisma.TransactionClient;

function pickVariantKey(weights: Record<string, number>, variantKeys: string[]): string {
  const keys = variantKeys.filter((k) => (weights[k] ?? 0) > 0);
  if (keys.length === 0) return variantKeys[0] ?? "control";
  let total = 0;
  for (const k of keys) total += weights[k] ?? 0;
  if (total <= 0) return keys[0];
  let r = Math.random() * total;
  for (const k of keys) {
    r -= weights[k] ?? 0;
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

/**
 * Creates or returns the persisted assignment for (experiment, browser session).
 * Optionally links `userId` when the visitor is logged in.
 */
export async function assignVariantForSession(
  db: Db,
  params: {
    experimentId: string;
    sessionId: string;
    userId: string | null;
    trafficSplitJson: unknown;
    variants: { id: string; variantKey: string }[];
    stoppedVariantKeys: unknown;
  },
) {
  const { experimentId, sessionId, userId, trafficSplitJson, variants, stoppedVariantKeys } = params;

  const stopped = Array.isArray(stoppedVariantKeys)
    ? new Set(stoppedVariantKeys.filter((x): x is string => typeof x === "string"))
    : new Set<string>();

  const splitRaw = parseTrafficSplitJson(trafficSplitJson);
  const normalized = normalizeTrafficSplit(splitRaw);

  const eligible = variants.filter((v) => !stopped.has(v.variantKey));
  if (eligible.length === 0) {
    throw new Error("experiment_has_no_active_variants");
  }

  const weights: Record<string, number> = {};
  for (const v of eligible) {
    weights[v.variantKey] = normalized[v.variantKey] ?? 0;
  }

  const pickedKey = pickVariantKey(weights, eligible.map((v) => v.variantKey));
  const variant = eligible.find((v) => v.variantKey === pickedKey) ?? eligible[0];

  try {
    return await db.experimentAssignment.create({
      data: {
        experimentId,
        variantId: variant.id,
        sessionId,
        userId: userId ?? undefined,
      },
      include: { variant: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await db.experimentAssignment.findUnique({
        where: { experimentId_sessionId: { experimentId, sessionId } },
        include: { variant: true },
      });
      if (existing) {
        if (userId && !existing.userId) {
          return db.experimentAssignment.update({
            where: { id: existing.id },
            data: { userId },
            include: { variant: true },
          });
        }
        return existing;
      }
    }
    throw e;
  }
}
