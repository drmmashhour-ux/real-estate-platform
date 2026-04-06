import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { marketingJsonError } from "@/lib/marketing/http-response";

/** Admin layout allows ADMIN + ACCOUNTANT; API matches that surface. */
export async function requireAdminSurfaceApi(): Promise<Response | null> {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdminSurface(userId))) {
    return marketingJsonError(401, "Unauthorized", "UNAUTHORIZED");
  }
  return null;
}
