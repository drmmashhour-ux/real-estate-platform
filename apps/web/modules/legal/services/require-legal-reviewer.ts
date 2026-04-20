import { PlatformRole } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/get-session";

/**
 * Review queue: platform admin or broker (human review — no automation).
 */
export function isLegalHubReviewer(user: SessionUser): boolean {
  return user.role === PlatformRole.ADMIN || user.role === PlatformRole.BROKER;
}

export function requireLegalHubReviewer(user: SessionUser): { ok: true } | { ok: false; reason: string } {
  if (!isLegalHubReviewer(user)) {
    return { ok: false, reason: "Broker or administrator access required" };
  }
  return { ok: true };
}
