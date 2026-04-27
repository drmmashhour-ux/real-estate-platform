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

/** API body when {@link requireHostIdentityForShortTermPublish} blocks (COMPLIANCE_HARD_LOCK). */
export const HOST_PUBLISH_IDENTITY_ERROR_MESSAGE =
  "Identity verification required before publishing" as const;

export class HostPublishIdentityError extends Error {
  readonly status = 403 as const;
  override readonly name = "HostPublishIdentityError";
  constructor() {
    super(HOST_PUBLISH_IDENTITY_ERROR_MESSAGE);
  }
}

/**
 * Throws {@link HostPublishIdentityError} when the listing owner is not email+phone verified
 * and `COMPLIANCE_HARD_LOCK` is on. No-ops when the flag is off.
 * Uses a dynamic import so test doubles (vi.spyOn on the export) apply.
 */
export async function requireHostIdentityForShortTermPublish(listingOwnerUserId: string): Promise<void> {
  const m = await import("./identityGateForPublish");
  const r = await m.assertUserEmailPhoneVerifiedForPublish(listingOwnerUserId);
  if (!r.ok) {
    throw new HostPublishIdentityError();
  }
}
