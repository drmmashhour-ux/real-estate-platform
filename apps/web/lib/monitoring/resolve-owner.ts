import { PlatformRole } from "@prisma/client";

export type MonitoringOwner = { ownerType: string; ownerId: string };

/**
 * Maps session user to monitoring owner scope (`solo_broker` vs `platform`).
 * Agency-scoped owners can be added later without renaming rows.
 */
export function monitoringOwner(userId: string, role: PlatformRole | null | undefined): MonitoringOwner {
  if (role === PlatformRole.BROKER) {
    return { ownerType: "solo_broker", ownerId: userId };
  }
  return { ownerType: "platform", ownerId: userId };
}
