import { getGuestId } from "@/lib/auth/session";

import { SubscriptionRequiredError, type SubscriptionVertical } from "./subscription.types";
import { hasActiveSubscription } from "./subscription.service";

/** Throws SubscriptionRequiredError when the user lacks an active subscription for `type`. */
export async function requireSubscription(userId: string, type: SubscriptionVertical): Promise<void> {
  const ok = await hasActiveSubscription(userId, type);
  if (!ok) throw new SubscriptionRequiredError(type);
}

/** Same as `requireSubscription` using the signed-in user (API routes / RSC). */
export async function requireSubscriptionForSessionUser(type: SubscriptionVertical): Promise<void> {
  const userId = await getGuestId();
  if (!userId) throw new Error("AUTH_REQUIRED");
  await requireSubscription(userId, type);
}

/** Server-friendly result instead of throw. */
export async function ensureSubscription(
  userId: string,
  type: SubscriptionVertical,
): Promise<{ ok: true } | { ok: false; vertical: SubscriptionVertical }> {
  const ok = await hasActiveSubscription(userId, type);
  return ok ? { ok: true } : { ok: false, vertical: type };
}
