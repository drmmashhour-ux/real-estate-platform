import type { RoleOption } from "@/components/layouts/dashboard-shell";
import type { ResolvedSeniorHubAccess } from "@/lib/senior-dashboard/role";
import {
  ADMIN_NAV,
  ADMIN_QUICK_ACTIONS,
  filterNavigationForAccess,
  filterQuickActions,
  getNavFeatureFlags,
  MANAGEMENT_NAV,
  MANAGEMENT_QUICK_ACTIONS,
  RESIDENCE_NAV,
  RESIDENCE_QUICK_ACTIONS,
  type AccessFlags,
  type LecipmShellRole,
} from "@/config/navigation.config";

export type LecipmShellPayload = {
  shellRole: LecipmShellRole;
  roleLabel: string;
  sections: ReturnType<typeof filterNavigationForAccess>;
  quickActions: ReturnType<typeof filterQuickActions>;
  roleOptions: RoleOption[];
};

function accessFlags(access: ResolvedSeniorHubAccess): AccessFlags {
  return {
    residence:
      access.kind === "platform_admin" ||
      access.kind === "residence_operator",
    management: access.kind === "platform_admin" || access.kind === "residence_manager",
    admin: access.kind === "platform_admin",
  };
}

export function buildRoleSwitcherOptions(base: string, access: ResolvedSeniorHubAccess): RoleOption[] {
  const flags = accessFlags(access);
  const opts: RoleOption[] = [];
  if (flags.residence) opts.push({ role: "RESIDENCE", label: "Residence", href: `${base}/residence` });
  if (flags.management) opts.push({ role: "MANAGEMENT", label: "Management", href: `${base}/management` });
  if (flags.admin) opts.push({ role: "ADMIN", label: "Admin", href: `${base}/admin` });
  return opts;
}

export function buildLecipmShellPayload(
  base: string,
  shellRole: LecipmShellRole,
  access: ResolvedSeniorHubAccess,
): LecipmShellPayload {
  const flags = accessFlags(access);
  const featureFlags = getNavFeatureFlags();

  const navConfig =
    shellRole === "RESIDENCE" ? RESIDENCE_NAV : shellRole === "MANAGEMENT" ? MANAGEMENT_NAV : ADMIN_NAV;

  const quickSrc =
    shellRole === "RESIDENCE"
      ? RESIDENCE_QUICK_ACTIONS
      : shellRole === "MANAGEMENT"
        ? MANAGEMENT_QUICK_ACTIONS
        : ADMIN_QUICK_ACTIONS;

  return {
    shellRole,
    roleLabel: navConfig.label,
    sections: filterNavigationForAccess(navConfig, flags, featureFlags),
    quickActions: filterQuickActions(quickSrc, flags),
    roleOptions: buildRoleSwitcherOptions(base, access),
  };
}

/** Used when layout does not have async user — flags derived from role only (admin UX). */
export async function shellUserDisplayName(userId: string): Promise<string | undefined> {
  const { prisma } = await import("@/lib/db");
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return u?.name ?? u?.email ?? undefined;
}
