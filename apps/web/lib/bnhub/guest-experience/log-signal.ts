import { prisma } from "@/lib/db";
import { BNHUB_GUEST_EXPERIENCE_RULE, type GuestExperienceOutcomeType } from "./constants";

export async function logGuestExperienceOutcome(input: {
  hostId: string;
  listingId: string;
  bookingId: string;
  guestId: string;
  outcomeType: GuestExperienceOutcomeType;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.aiOutcomeSignal.create({
    data: {
      hostId: input.hostId,
      listingId: input.listingId,
      bookingId: input.bookingId,
      ruleName: BNHUB_GUEST_EXPERIENCE_RULE,
      actionType: "guest_retention",
      outcomeType: input.outcomeType,
      metadata: {
        guestId: input.guestId,
        ...(input.metadata ?? {}),
      } as object,
    },
  });
}

export async function hasGuestExperienceOutcome(
  bookingId: string,
  outcomeType: GuestExperienceOutcomeType
): Promise<boolean> {
  const hit = await prisma.aiOutcomeSignal.findFirst({
    where: {
      bookingId,
      ruleName: BNHUB_GUEST_EXPERIENCE_RULE,
      outcomeType,
    },
    select: { id: true },
  });
  return Boolean(hit);
}

export async function getGuestExperienceOutcomeCreatedAt(
  bookingId: string,
  outcomeType: GuestExperienceOutcomeType
): Promise<Date | null> {
  const row = await prisma.aiOutcomeSignal.findFirst({
    where: {
      bookingId,
      ruleName: BNHUB_GUEST_EXPERIENCE_RULE,
      outcomeType,
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return row?.createdAt ?? null;
}
