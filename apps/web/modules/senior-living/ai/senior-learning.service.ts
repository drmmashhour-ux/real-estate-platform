/**
 * AI learning audit + safe delegation to core `learning.service` (matching weights).
 */
import { prisma } from "@/lib/db";
import { logSeniorAi } from "@/lib/senior-ai/log";
import { runMatchingLearning } from "../learning.service";

export async function recordAiLearningEvent(args: {
  eventType: string;
  profileId?: string | null;
  residenceId?: string | null;
  leadId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.seniorLearningEvent.create({
    data: {
      eventType: args.eventType.slice(0, 32),
      profileId: args.profileId ?? undefined,
      residenceId: args.residenceId ?? undefined,
      leadId: args.leadId ?? undefined,
      metadataJson: args.metadata ?? undefined,
    },
  });
  logSeniorAi("[senior-learning]", args.eventType, {});
}

/** Delegates to deterministic+capped weight update when enough funnel data exists. */
export async function updateLearningFromOutcomes(): Promise<{ ok: boolean; message: string }> {
  try {
    await runMatchingLearning();
    await recordAiLearningEvent({ eventType: "WEIGHT_UPDATE_RUN", metadata: { source: "orchestrator" } });
    return { ok: true, message: "Learning step completed (if data thresholds met)." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "failed" };
  }
}
