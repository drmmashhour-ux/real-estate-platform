/**
 * App-layer API guards (Prisma does not enforce Postgres RLS on the server connection).
 */
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export type GuardFailure = { ok: false; response: Response };
export type GuardOk<T extends Record<string, unknown> = { userId: string }> = { ok: true } & T;

async function loadRole(userId: string): Promise<PlatformRole | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role ?? null;
}

/** Any signed-in user. */
export async function requireUser(): Promise<GuardFailure | GuardOk> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Sign in required" }, { status: 401 }) };
  }
  return { ok: true, userId };
}

/** BNHub host capabilities (hosts and platform admins). */
export async function requireHost(): Promise<GuardFailure | GuardOk<{ userId: string; role: PlatformRole }>> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const role = await loadRole(userId);
  if (role !== PlatformRole.HOST && role !== PlatformRole.ADMIN) {
    return { ok: false, response: Response.json({ error: "Host access only" }, { status: 403 }) };
  }
  return { ok: true, userId, role: role! };
}

/** Residential / CRM broker workspace (brokers and admins). */
export async function requireBroker(): Promise<GuardFailure | GuardOk<{ userId: string; role: PlatformRole }>> {
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const role = await loadRole(userId);
  if (role !== PlatformRole.BROKER && role !== PlatformRole.ADMIN) {
    return { ok: false, response: Response.json({ error: "Broker access only" }, { status: 403 }) };
  }
  return { ok: true, userId, role: role! };
}

/** Platform admin only — JSON API variant of requireAdminSession. */
export async function requireAdmin(): Promise<GuardFailure | GuardOk> {
  const s = await requireAdminSession();
  if (!s.ok) {
    return {
      ok: false,
      response: Response.json({ error: s.error }, { status: s.status }),
    };
  }
  return { ok: true, userId: s.userId };
}
