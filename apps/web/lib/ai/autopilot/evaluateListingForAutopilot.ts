import "server-only";

import { getLegacyDB } from "@/lib/db/legacy";
import { getListingSignalsForAutopilot } from "@/lib/ai/listings-for-autopilot";

const prisma = getLegacyDB();

export type AutopilotEvaluationResult = {
  listingId: string;
  suggestionsCreated: number;
  actionsCreated: number;
  signals: Awaited<ReturnType<typeof getListingSignalsForAutopilot>>;
};

/**
 * Host/admin autopilot evaluation hook. Counts are reserved for when suggestion/action rows are
 * written in a follow-up; today returns signals + zero counts so routes and batch scripts resolve.
 */
export async function evaluateListingForAutopilot(listingId: string): Promise<AutopilotEvaluationResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true },
  });
  if (!listing) {
    throw new Error(`Listing not found: ${listingId}`);
  }
  const signals = await getListingSignalsForAutopilot(listingId);
  return {
    listingId,
    suggestionsCreated: 0,
    actionsCreated: 0,
    signals,
  };
}
