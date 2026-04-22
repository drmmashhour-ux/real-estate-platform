/**
 * Canonical imports for `/api/mobile/**` routes — Bearer JWT verification via Supabase.
 * Prefer this module over reaching into `@/lib/mobile/mobileAuth` directly so guards stay consistent.
 */

export type { MobileAuthUser, MobileAppRole } from "@/lib/mobile/mobileAuth";
export {
  assertBnhubHostOrAdmin,
  getMobileAuthUser,
  requireMobileAdmin,
  requireMobileUser,
  resolveMobileAppRole,
  resolveMobileAppRoleFromRequest,
} from "@/lib/mobile/mobileAuth";

import { requireMobileUser, type MobileAuthUser } from "@/lib/mobile/mobileAuth";

/** Alias for route handlers — throws 401-compatible Error with `.status`. */
export async function getMobileUserOrThrow(request: Request): Promise<MobileAuthUser> {
  return requireMobileUser(request);
}
