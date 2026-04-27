import { monolithPrisma } from "@/lib/db";

import { validateListingGate } from "./checks";
import { auditHardLockListingPublish } from "./hardLockAudit";
import { assertUserEmailPhoneVerifiedForPublish } from "./identityGateForPublish";
import { flags } from "@/lib/flags";

export {
  assertUserEmailPhoneVerifiedForPublish,
  requireHostIdentityForShortTermPublish,
  HostPublishIdentityError,
  HOST_PUBLISH_IDENTITY_ERROR_MESSAGE,
} from "./identityGateForPublish";

const AUDIT_KEY_BLOCKED = "oaciq.crm_listing.go_live_blocked";
const AUDIT_KEY_SUCCESS = "oaciq.crm_listing.go_live_success";

/**
 * Single path to turn `crmMarketplaceLive` on after OACIQ DS validation + audit.
 * Uses monolith Prisma only (independent of `USE_NEW_DB` / `prisma` alias on db-core).
 */
export async function setListingLive(listingId: string, userId: string): Promise<void> {
  const result = await validateListingGate(listingId);

  if (!result.ok) {
    await monolithPrisma.complianceAuditLog.create({
      data: {
        actorUserId: userId,
        actionKey: AUDIT_KEY_BLOCKED,
        payload: { listingId, reason: result.message },
      },
    });
    throw new Error(result.message);
  }

  if (flags.COMPLIANCE_HARD_LOCK) {
    const row = await monolithPrisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    });
    if (row) {
      const idn = await assertUserEmailPhoneVerifiedForPublish(row.userId);
      if (!idn.ok) {
        await monolithPrisma.complianceAuditLog.create({
          data: {
            actorUserId: userId,
            actionKey: "oaciq.crm_listing.go_live_identity_blocked",
            payload: { listingId, reason: idn.message },
          },
        });
        throw new Error(idn.message);
      }
    }
  }

  await monolithPrisma.listing.update({
    where: { id: listingId },
    data: { crmMarketplaceLive: true },
  });

  await monolithPrisma.complianceAuditLog.create({
    data: {
      actorUserId: userId,
      actionKey: AUDIT_KEY_SUCCESS,
      payload: { listingId, reason: "DS valid" },
    },
  });

  void auditHardLockListingPublish({ listingId, actorUserId: userId });
}
