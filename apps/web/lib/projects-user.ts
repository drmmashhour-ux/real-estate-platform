/**
 * Current user id for projects features (favorites, alerts, reservations).
 * Uses guest cookie when auth not wired; replace with real auth when ready.
 */

import { cookies } from "next/headers";

const GUEST_ID_COOKIE = "lecipm_guest_id";
const MOCK_USER_ID = "demo-user";

export async function getProjectsUserId(): Promise<string> {
  try {
    const c = await cookies();
    const guestId = c.get(GUEST_ID_COOKIE)?.value;
    if (guestId && guestId.trim()) return guestId.trim();
  } catch {}
  return MOCK_USER_ID;
}
