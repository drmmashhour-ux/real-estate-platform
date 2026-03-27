import type { PrismaClient } from "@prisma/client";

/**
 * Marks a profile as applied (audit). Does not alter engine defaults unless ops sets `isActive` + runtime loader.
 */
/** Audit-only apply — does not change code defaults. Sets `isActive` for optional runtime loading. */
export async function markTuningProfileApplied(
  db: PrismaClient,
  profileId: string,
  appliedBy: string,
  options?: { deactivateOthers?: boolean; supersedesId?: string | null },
) {
  const deactivate = options?.deactivateOthers !== false;

  if (deactivate) {
    await db.tuningProfile.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  return db.tuningProfile.update({
    where: { id: profileId },
    data: {
      appliedAt: new Date(),
      appliedBy,
      isActive: true,
      supersedesId: options?.supersedesId ?? undefined,
    },
  });
}

export async function rollbackActiveTuningProfile(db: PrismaClient, profileId: string, appliedBy: string) {
  await db.tuningProfile.updateMany({ where: { isActive: true }, data: { isActive: false } });
  return db.tuningProfile.update({
    where: { id: profileId },
    data: { isActive: true, appliedAt: new Date(), appliedBy },
  });
}
