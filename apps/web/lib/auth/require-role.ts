import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import type { AuthResult } from "@/lib/auth/require-user";
import { requireUser } from "@/lib/auth/require-user";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";

/**
 * Product roles for route guards (maps to `PlatformRole`).
 * - `guest` = signed-in **end user** (`USER` / `CLIENT`), not anonymous.
 * - `founder` = executive / brokerage office scope via `getExecutiveSession` (not just ADMIN).
 */
export type AppRouteRole = "guest" | "user" | "host" | "broker" | "admin" | "founder";

const ROLE_MAP: Record<"host" | "broker" | "admin", PlatformRole> = {
  admin: PlatformRole.ADMIN,
  broker: PlatformRole.BROKER,
  host: PlatformRole.HOST,
};

function roleSatisfies(userRole: PlatformRole, required: Exclude<AppRouteRole, "founder">): boolean {
  if (required === "guest") {
    return userRole === PlatformRole.USER || userRole === PlatformRole.CLIENT;
  }
  if (required === "user") {
    return (
      userRole === PlatformRole.USER ||
      userRole === PlatformRole.CLIENT ||
      userRole === PlatformRole.TESTER
    );
  }
  const need = ROLE_MAP[required];
  if (userRole === PlatformRole.ADMIN) return true;
  return userRole === need;
}

/**
 * Requires logged-in user and platform role. Admin may access role-gated routes.
 * `founder` requires an **executive session** (office owner / managing broker / platform admin path).
 */
export async function requireRole(required: AppRouteRole): Promise<AuthResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  if (required === "founder") {
    const ex = await getExecutiveSession(auth.user.id, auth.user.role);
    if (!ex) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Executive access only" }, { status: 403 }),
      };
    }
    return auth;
  }

  if (!roleSatisfies(auth.user.role, required)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden", requiredRole: required }, { status: 403 }),
    };
  }
  return auth;
}
