import { PlatformRole } from "@prisma/client";

/** Founder proxy (ADMIN) + investor relations role. */
export function canViewCompanyInvestorDashboard(role: PlatformRole): boolean {
  return role === PlatformRole.ADMIN || role === PlatformRole.INVESTOR;
}
