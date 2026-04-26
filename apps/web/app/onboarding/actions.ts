"use server";

import { redirect } from "next/navigation";

import { getGuestId } from "@/lib/auth/session";
import { trackEarlyUser } from "@/lib/growth/earlyUsers";

const DEFAULT_NEXT = "/listings";

/**
 * Continues from guided onboarding: records signed-in user in the early cohort, then moves to exploration.
 */
export async function continueOnboarding() {
  const userId = await getGuestId();
  if (userId) {
    await trackEarlyUser(userId);
  }
  redirect(DEFAULT_NEXT);
}
