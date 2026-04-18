import { prisma } from "@/lib/db";
import { toPrismaJson } from "@/lib/types/prisma-json";
import { fraudTrustV1Flags } from "@/config/feature-flags";

/**
 * Persists explainable snapshots to `fraud_action_logs` (internal audit — not public).
 */
export async function logTrustEngineEvaluation(args: {
  entityType: string;
  entityId: string;
  kind: "user_trust" | "listing_trust" | "public_badge";
  resultJson: Record<string, unknown>;
}): Promise<{ id: string } | null> {
  if (!fraudTrustV1Flags.trustSystemV1) return null;

  const row = await prisma.fraudActionLog.create({
    data: {
      entityType: args.entityType,
      entityId: args.entityId,
      actionType: `trust_engine_v1_${args.kind}`,
      resultJson: toPrismaJson(args.resultJson),
    },
  });
  return { id: row.id };
}
