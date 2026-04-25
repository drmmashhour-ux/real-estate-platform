import { PlatformRole } from "@prisma/client";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/auth/get-session";

const FIELD_TEAM_ADMIN_ROLES: PlatformRole[] = [
  PlatformRole.ADMIN,
  PlatformRole.OUTREACH_OPERATOR,
  PlatformRole.AGENCY_EXECUTIVE,
  PlatformRole.CONTENT_OPERATOR,
  PlatformRole.SUPPORT_AGENT,
];

export function isFieldTeamAdmin(role: PlatformRole): boolean {
  return FIELD_TEAM_ADMIN_ROLES.includes(role);
}

/** Server components: redirect if not allowed. */
export function requireFieldTeamAdminPage(user: SessionUser | null, nextPath = "/admin/team"): asserts user is SessionUser {
  if (!user) {
    const q = encodeURIComponent(nextPath);
    redirect(`/auth/login?next=${q}`);
  }
  if (!isFieldTeamAdmin(user.role)) redirect("/");
}

/** API routes: boolean guard. */
export function assertFieldTeamApi(user: SessionUser | null): user is SessionUser {
  return !!user && isFieldTeamAdmin(user.role);
}
