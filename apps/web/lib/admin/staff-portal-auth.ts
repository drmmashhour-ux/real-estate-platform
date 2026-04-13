import type { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/** Non-admin operators — scoped team workspace. */
export const OPS_TEAM_ROLES: readonly PlatformRole[] = [
  "CONTENT_OPERATOR",
  "LISTING_OPERATOR",
  "OUTREACH_OPERATOR",
  "SUPPORT_AGENT",
] as const;

export function isOpsTeamRole(role: PlatformRole): boolean {
  return (OPS_TEAM_ROLES as readonly string[]).includes(role);
}

export function isStaffPortalUser(role: PlatformRole): boolean {
  return role === "ADMIN" || isOpsTeamRole(role);
}

/**
 * ADMIN or internal ops — `/admin/team` and team APIs.
 */
export async function requireStaffPortalSession(): Promise<
  { ok: true; userId: string; role: PlatformRole } | { ok: false; status: number; error: string }
> {
  const id = await getGuestId();
  if (!id) return { ok: false, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!u) return { ok: false, status: 401, error: "User not found" };
  if (!isStaffPortalUser(u.role)) return { ok: false, status: 403, error: "Team workspace only" };
  return { ok: true, userId: id, role: u.role };
}

/** Full admin — assign tasks to others, set targets, view all performance. */
export async function requireAdminOnlySession(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  const id = await getGuestId();
  if (!id) return { ok: false, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false, status: 403, error: "Administrator only" };
  return { ok: true, userId: id };
}
