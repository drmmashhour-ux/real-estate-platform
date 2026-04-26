import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export type RecommendationAuditKind =
  | "audit:profile_built"
  | "audit:generated"
  | "audit:clicked"
  | "audit:converted"
  | "audit:opt_out";

export async function recordRecommendationAudit(args: {
  userId: string;
  kind: RecommendationAuditKind;
  mode?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.lecipmPersonalizedRecommendationEvent.create({
    data: {
      userId: args.userId,
      mode: args.mode ?? "SYSTEM",
      eventKind: args.kind,
      metadata: args.metadata ?? undefined,
    },
  });
}
