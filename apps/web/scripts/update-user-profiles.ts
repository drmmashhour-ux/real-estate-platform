/**
 * Rebuild `UserSearchProfile` from recent `SearchEvent` rows (cron / manual).
 * Usage: pnpm ai:update-profiles
 */

import { prisma } from "../lib/db";
import { buildUserSearchProfileFromEvents } from "../lib/ai/search/buildUserProfile";

async function main() {
  const since = new Date(Date.now() - 120 * 86400000);
  const distinctUsers = await prisma.searchEvent.findMany({
    where: { userId: { not: null }, createdAt: { gte: since } },
    select: { userId: true },
    distinct: ["userId"],
  });

  const userIds = distinctUsers.map((r) => r.userId).filter((x): x is string => Boolean(x));
  let ok = 0;
  for (const userId of userIds) {
    try {
      await buildUserSearchProfileFromEvents(userId);
      ok += 1;
    } catch (e) {
      console.error("profile update failed", userId, e);
    }
  }

  console.log(JSON.stringify({ usersConsidered: userIds.length, profilesUpdated: ok }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
