/**
 * Batch BNHUB intelligence evaluation (snapshots + autopilot pipeline).
 * Usage: pnpm ai:run  |  BNHUB_HOST_USER_ID=<hostUserId> pnpm ai:run:host
 */

import { ListingStatus } from "@prisma/client";
import { prisma } from "../lib/db";
import { evaluateListingForAutopilot } from "../lib/ai/autopilot/evaluateListingForAutopilot";

async function main() {
  const hostOnly = process.argv.includes("--host");
  const hostUserId = process.env.BNHUB_HOST_USER_ID?.trim();

  const where: { listingStatus: typeof ListingStatus.PUBLISHED; ownerId?: string } = {
    listingStatus: ListingStatus.PUBLISHED,
  };
  if (hostOnly) {
    if (!hostUserId) {
      console.error("Set BNHUB_HOST_USER_ID when using --host");
      process.exit(1);
    }
    where.ownerId = hostUserId;
  }

  const listings = await prisma.shortTermListing.findMany({
    where,
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  let ok = 0;
  for (const l of listings) {
    try {
      await evaluateListingForAutopilot(l.id);
      ok += 1;
    } catch (e) {
      console.error("failed", l.id, e);
    }
  }

  console.log(JSON.stringify({ total: listings.length, evaluated: ok, hostOnly }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
