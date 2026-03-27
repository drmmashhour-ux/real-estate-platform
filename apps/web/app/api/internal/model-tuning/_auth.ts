import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";

export async function requirePlatformAdmin(): Promise<{ ok: true; userId: string } | { ok: false; status: number }> {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return { ok: false, status: 403 };
  }
  return { ok: true, userId };
}
