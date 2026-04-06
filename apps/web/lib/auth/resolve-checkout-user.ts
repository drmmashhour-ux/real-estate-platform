import { getGuestId } from "@/lib/auth/session";
import { getMobileAuthUser } from "@/lib/mobile/mobileAuth";

/**
 * Web cookie session first, then `Authorization: Bearer` (Expo / mobile app).
 */
export async function resolveCheckoutUserId(request: Request): Promise<string | null> {
  const fromCookie = await getGuestId();
  if (fromCookie) return fromCookie;
  const mobile = await getMobileAuthUser(request);
  return mobile?.id ?? null;
}
