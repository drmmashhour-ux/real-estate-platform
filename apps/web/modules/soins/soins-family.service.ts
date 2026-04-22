import type { MobileAuthUser } from "@/lib/mobile/mobileAuth";
import { prisma } from "@/lib/db";

import { canManageCareResidence, isSoinsAdmin } from "./soins-access.service";

export type FamilyPermissionKey = "camera" | "chat" | "alerts";

export async function familyAccessRecord(residentId: string, familyUserId: string) {
  return prisma.familyAccess.findUnique({
    where: {
      residentId_familyUserId: { residentId, familyUserId },
    },
  });
}

export async function assertFamilyPermission(
  auth: MobileAuthUser,
  residentId: string,
  permission: FamilyPermissionKey,
): Promise<boolean> {
  if (isSoinsAdmin(auth) || (await isLecipmPlatformAdminUser(auth.id))) return true;

  const row = await familyAccessRecord(residentId, auth.id);
  if (!row) return false;

  if (permission === "camera") return row.canViewCamera;
  if (permission === "chat") return row.canChat;
  return row.canReceiveAlerts;
}

export async function upsertFamilyAccess(params: {
  residentId: string;
  familyUserId: string;
  canViewCamera?: boolean;
  canChat?: boolean;
  canReceiveAlerts?: boolean;
  actingUser: MobileAuthUser;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { residentId, familyUserId } = params;
  const resident = await prisma.residentProfile.findUnique({
    where: { id: residentId },
    select: { id: true, residenceId: true },
  });
  if (!resident) return { ok: false, error: "Resident not found" };

  const allowed =
    isSoinsAdmin(params.actingUser) ||
    (await canManageCareResidence(params.actingUser.id, resident.residenceId));

  if (!allowed) return { ok: false, error: "Forbidden" };

  await prisma.familyAccess.upsert({
    where: {
      residentId_familyUserId: { residentId, familyUserId },
    },
    create: {
      residentId,
      familyUserId,
      canViewCamera: params.canViewCamera ?? false,
      canChat: params.canChat ?? true,
      canReceiveAlerts: params.canReceiveAlerts ?? true,
    },
    update: {
      ...(params.canViewCamera !== undefined ? { canViewCamera: params.canViewCamera } : {}),
      ...(params.canChat !== undefined ? { canChat: params.canChat } : {}),
      ...(params.canReceiveAlerts !== undefined ? { canReceiveAlerts: params.canReceiveAlerts } : {}),
    },
  });

  return { ok: true };
}

export async function revokeFamilyAccess(
  residentId: string,
  familyUserId: string,
  actingUser: MobileAuthUser,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const resident = await prisma.residentProfile.findUnique({
    where: { id: residentId },
    select: { residenceId: true },
  });
  if (!resident) return { ok: false, error: "Resident not found" };

  const allowed =
    isSoinsAdmin(actingUser) || (await canManageCareResidence(actingUser.id, resident.residenceId));

  if (!allowed) return { ok: false, error: "Forbidden" };

  await prisma.familyAccess.deleteMany({ where: { residentId, familyUserId } });
  return { ok: true };
}
