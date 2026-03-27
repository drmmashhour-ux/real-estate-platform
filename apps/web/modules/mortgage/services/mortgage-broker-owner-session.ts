import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

/** Logged-in user's `MortgageBroker` row (no verification gate — used for onboarding APIs). */
export async function getMortgageBrokerOwnerSession() {
  const userId = await getGuestId();
  if (!userId) return { ok: false as const, status: 401 as const, error: "Sign in required" };

  const broker = await prisma.mortgageBroker.findUnique({
    where: { userId },
  });
  if (!broker) return { ok: false as const, status: 403 as const, error: "No mortgage broker profile" };

  return { ok: true as const, userId, broker };
}
