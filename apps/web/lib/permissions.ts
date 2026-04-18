/**
 * Permission-style helpers: combine feature gates with role checks without replacing existing guards.
 */
import { jsonFailure, jsonForbidden } from "@/lib/api-response";
import type { PlatformRole } from "@prisma/client";

import { isPlatformAdmin } from "@/lib/access-control";

export function requireFeatureOrForbidden(
  enabled: boolean,
  code = "FEATURE_DISABLED",
): Response | null {
  if (!enabled) {
    return jsonFailure("This feature is not available.", 403, code);
  }
  return null;
}

/** Admin-only shortcut for new routes; prefer domain-specific policies when they exist. */
export function assertAdminRole(role: PlatformRole): Response | null {
  if (!isPlatformAdmin(role)) {
    return jsonForbidden("Admin access required.");
  }
  return null;
}
