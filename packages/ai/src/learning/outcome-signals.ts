import { prisma } from "@/lib/db";
import { getScore, type OutcomeType } from "./feedback-score";
import { updateHostPreferenceProfileFromOutcome } from "./host-behavior";

export type LogOutcomeInput = {
  hostId: string;
  listingId?: string | null;
  bookingId?: string | null;
  ruleName: string;
  actionType: string;
  outcomeType: OutcomeType;
  /** When set, drives per-host template learning. */
  templateKey?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logOutcome(input: LogOutcomeInput): Promise<void> {
  const score = getScore(input.outcomeType);
  const extra =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata : {};
  const metadata = { score, ...extra };

  await prisma.aiOutcomeSignal.create({
    data: {
      hostId: input.hostId,
      listingId: input.listingId ?? null,
      bookingId: input.bookingId ?? null,
      ruleName: input.ruleName,
      actionType: input.actionType,
      outcomeType: input.outcomeType,
      metadata,
    },
  });

  try {
    await updateHostPreferenceProfileFromOutcome(
      input.hostId,
      input.ruleName,
      input.templateKey ?? null,
      input.outcomeType
    );
  } catch {
    /* host profile learning must not break outcome logging */
  }
}
