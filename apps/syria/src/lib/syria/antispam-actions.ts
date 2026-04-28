import { prisma } from "@/lib/db";
import { recomputeReputationScoreForUser } from "@/lib/syria/user-reputation";

/** Rolling window for “too many listings quickly” auto-flag. */
export const SPAM_BURST_WINDOW_MS = 15 * 60 * 1000;
/** When owner already has at least this many listings in the window, the next publish is held for review. */
export const SPAM_BURST_LISTING_THRESHOLD = 3;

/** Same-user message burst (authenticated senders) → flag. */
const MESSAGE_BURST_WINDOW_MS = 60 * 60 * 1000;
const MESSAGE_BURST_MIN_INQUIRIES = 8;

export async function countOwnerListingsSince(ownerId: string, since: Date): Promise<number> {
  return prisma.syriaProperty.count({
    where: { ownerId, createdAt: { gte: since } },
  });
}

/** True when publishing another listing should go to NEEDS_REVIEW and flag the owner. */
export async function shouldAutoHoldListingForBurst(ownerId: string): Promise<boolean> {
  const since = new Date(Date.now() - SPAM_BURST_WINDOW_MS);
  const n = await countOwnerListingsSince(ownerId, since);
  return n >= SPAM_BURST_LISTING_THRESHOLD;
}

export async function flagOwnerForAntispam(userId: string): Promise<void> {
  await prisma.syriaAppUser.update({
    where: { id: userId },
    data: { flagged: true },
  });
  await recomputeReputationScoreForUser(userId);
}

/**
 * After an inquiry row exists — flag heavy cross-listing messagers (bypasses IP rotation).
 */
export async function evaluateMessageSpamFollowUp(fromUserId: string | null | undefined): Promise<void> {
  const uid = fromUserId?.trim();
  if (!uid) return;
  const since = new Date(Date.now() - MESSAGE_BURST_WINDOW_MS);
  const n = await prisma.syriaInquiry.count({
    where: { fromUserId: uid, createdAt: { gte: since } },
  });
  if (n >= MESSAGE_BURST_MIN_INQUIRIES) {
    await flagOwnerForAntispam(uid);
  }
}
