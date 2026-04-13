/**
 * Batch BNHUB AI autopilot evaluation (run via cron or CI).
 * Usage: pnpm --filter @lecipm/web exec tsx scripts/run-ai-autopilot.ts
 */

import { ListingStatus } from "@prisma/client";
import { prisma } from "../lib/db";
import { evaluateListingForAutopilot } from "../lib/ai/autopilot/evaluateListingForAutopilot";

async function main() {
  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    select: { id: true, ownerId: true },
  });

  let totalS = 0;
  let totalA = 0;
  for (const l of listings) {
    const r = await evaluateListingForAutopilot(l.id);
    totalS += r.suggestionsCreated;
    totalA += r.actionsCreated;
  }

  console.log(
    JSON.stringify({
      ok: true,
      listings: listings.length,
      suggestionsCreated: totalS,
      actionsCreated: totalA,
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
