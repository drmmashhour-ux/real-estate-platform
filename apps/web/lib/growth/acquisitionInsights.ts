import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";
import { type AcquisitionInsights, buildAcquisitionInsightsFromUserRows } from "@/lib/growth/acquisitionInsightsRollup";
import { PlatformRole } from "@prisma/client";

const prisma = getLegacyDB();

export type { AcquisitionChannelInsight, AcquisitionInsights } from "@/lib/growth/acquisitionInsightsRollup";
export { buildAcquisitionInsightsFromUserRows } from "@/lib/growth/acquisitionInsightsRollup";

/**
 * Channel performance from **first-touch signup attribution** on `User.signupAttributionJson`
 * (one user = one row — no multi-touch inflation). Counts **distinct users** per normalized source.
 *
 * Optional funnel: onboarding + at least one guest booking in `CONFIRMED` | `COMPLETED`.
 */
export async function getAcquisitionInsights(): Promise<AcquisitionInsights> {
  const users = await prisma.user.findMany({
    where: {
      NOT: { role: PlatformRole.VISITOR },
    },
    select: {
      id: true,
      signupAttributionJson: true,
      launchOnboardingCompletedAt: true,
    },
  });

  const guestIdsWithBooking = await prisma.booking.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    select: { guestId: true },
    distinct: ["guestId"],
  });
  const convertedSet = new Set(guestIdsWithBooking.map((b) => b.guestId));

  return buildAcquisitionInsightsFromUserRows(users, convertedSet);
}
