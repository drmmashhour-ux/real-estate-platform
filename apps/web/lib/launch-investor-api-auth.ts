import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { lecipmLaunchInvestorFlags, launchSystemV1Flags } from "@/config/feature-flags";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import type { ExecutiveSession } from "@/modules/owner-access/owner-access.types";

export type LaunchInvestorAuth =
  | { ok: true; userId: string; session: ExecutiveSession }
  | { ok: false; response: Response };

/**
 * Founder / platform executive APIs — real metrics only; investor exports require platform scope (admin).
 */
export async function requireLaunchInvestorSession(): Promise<LaunchInvestorAuth> {
  const launchConsoleEnabled =
    lecipmLaunchInvestorFlags.lecipmLaunchInvestorSystemV1 || launchSystemV1Flags.launchSystemV1;
  if (!launchConsoleEnabled) {
    return {
      ok: false,
      response: Response.json({ error: "Launch console disabled" }, { status: 403 }),
    };
  }
  const userId = await getGuestId();
  if (!userId) {
    return { ok: false, response: Response.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    return { ok: false, response: Response.json({ error: "User not found" }, { status: 401 }) };
  }
  const session = await getExecutiveSession(userId, user.role);
  if (!session) {
    return { ok: false, response: Response.json({ error: "Executive access required" }, { status: 403 }) };
  }
  return { ok: true, userId, session };
}

export function isPlatformScope(session: ExecutiveSession): boolean {
  return session.scope.kind === "platform";
}

export type PlatformLaunchAuth =
  | { ok: true; userId: string; session: ExecutiveSession }
  | { ok: false; response: Response };

/** Platform-wide traction + investor exports (ADMIN scope) — prevents cross-tenant scraping. */
export async function requirePlatformLaunchInvestor(): Promise<PlatformLaunchAuth> {
  const r = await requireLaunchInvestorSession();
  if (!r.ok) return r;
  if (!isPlatformScope(r.session)) {
    return { ok: false, response: Response.json({ error: "Platform scope required" }, { status: 403 }) };
  }
  return r;
}
