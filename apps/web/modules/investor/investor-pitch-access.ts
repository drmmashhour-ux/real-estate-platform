import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { lecipmLaunchInvestorFlags, launchSystemV1Flags } from "@/config/feature-flags";
import { getExecutiveSession } from "@/modules/owner-access/executive-visibility.service";
import { isPlatformScope } from "@/lib/launch-investor-api-auth";

/**
 * Server components / routes: whether the current user may load live platform investor metrics.
 */
export async function canViewLiveInvestorPitchDashboard(): Promise<boolean> {
  const launchConsoleEnabled =
    lecipmLaunchInvestorFlags.lecipmLaunchInvestorSystemV1 || launchSystemV1Flags.launchSystemV1;
  if (!launchConsoleEnabled) return false;
  const userId = await getGuestId();
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;
  const session = await getExecutiveSession(userId, user.role);
  return !!session && isPlatformScope(session);
}
