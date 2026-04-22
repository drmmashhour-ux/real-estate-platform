import { PlatformRole } from "@prisma/client";

import type { MobileAuthUser } from "@/lib/mobile/mobileAuth";
import { prisma } from "@/lib/db";
import { canAccessAdminDashboard, resolveSeniorHubAccess } from "@/lib/senior-dashboard/role";

import type { SoinsViewerContext, SoinsViewerRole } from "./soins.types";

export function isSoinsAdmin(auth: MobileAuthUser): boolean {
  return auth.role === PlatformRole.ADMIN;
}

/** LECIPM dashboard admin shell (same gate as `/dashboard/admin`). */
export async function isLecipmPlatformAdminUser(actorId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: actorId },
    select: { role: true },
  });
  if (!u) return false;
  const access = await resolveSeniorHubAccess(actorId, u.role);
  return canAccessAdminDashboard(access);
}

/** Admin shell or residence operator. */
export async function canManageCareResidence(actorId: string, residenceId: string): Promise<boolean> {
  if (await isLecipmPlatformAdminUser(actorId)) return true;
  return userOperatesResidence(actorId, residenceId);
}

export async function userOperatesResidence(userId: string, residenceId: string): Promise<boolean> {
  const r = await prisma.careResidence.findFirst({
    where: { id: residenceId, operatorId: userId },
    select: { id: true },
  });
  return !!r;
}

/** Who is this user in the Soins graph for a given resident row. */
export async function resolveViewerForResident(
  auth: MobileAuthUser,
  residentId: string,
): Promise<{ context: SoinsViewerContext; role: SoinsViewerRole } | null> {
  if (isSoinsAdmin(auth) || (await isLecipmPlatformAdminUser(auth.id))) {
    return { role: "admin", context: { role: "admin" } };
  }

  const profile = await prisma.residentProfile.findUnique({
    where: { id: residentId },
    select: { id: true, userId: true, residenceId: true },
  });
  if (!profile) return null;

  if (profile.userId === auth.id) {
    return {
      role: "resident",
      context: { role: "resident", residentId: profile.id },
    };
  }

  const family = await prisma.familyAccess.findUnique({
    where: {
      residentId_familyUserId: { residentId: profile.id, familyUserId: auth.id },
    },
    select: { id: true },
  });
  if (family) {
    return {
      role: "family",
      context: { role: "family", residentId: profile.id, familyUserId: auth.id },
    };
  }

  if (await userOperatesResidence(auth.id, profile.residenceId)) {
    return {
      role: "operator",
      context: { role: "operator", residenceId: profile.residenceId },
    };
  }

  return null;
}

export async function resolveViewerForResidence(
  auth: MobileAuthUser,
  residenceId: string,
): Promise<{ canRead: boolean; canMutate: boolean }> {
  if (isSoinsAdmin(auth) || (await isLecipmPlatformAdminUser(auth.id))) {
    return { canRead: true, canMutate: true };
  }
  const operates = await userOperatesResidence(auth.id, residenceId);
  if (operates) return { canRead: true, canMutate: true };
  return { canRead: true, canMutate: false };
}
