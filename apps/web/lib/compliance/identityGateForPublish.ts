import "server-only";

import { monolithPrisma } from "@/lib/db";
import { flags } from "@/lib/flags";

export type IdentityGateResult = { ok: true } | { ok: false; message: string };

/**
 * Sellers / listing publishers: email + phone verification (Law 25 / OACIQ readiness) when hard lock is on.
 */
export async function assertUserEmailPhoneVerifiedForPublish(userId: string): Promise<IdentityGateResult> {
  if (!flags.COMPLIANCE_HARD_LOCK) return { ok: true };

  const u = await monolithPrisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true, phoneVerifiedAt: true, phone: true },
  });
  if (!u) return { ok: false, message: "User not found" };
  if (!u.emailVerifiedAt) {
    return { ok: false, message: "Email verification required before listing can go live." };
  }
  if (!u.phone?.trim() || !u.phoneVerifiedAt) {
    return { ok: false, message: "Phone verification required before listing can go live." };
  }
  return { ok: true };
}
