import { createVerificationCase, getLatestCaseForEntity } from "@/lib/trustgraph/application/createVerificationCase";
import { runShortTermListingVerificationPipeline } from "@/lib/trustgraph/infrastructure/services/bnhubVerificationPipeline";

export async function runShortTermListingVerification(args: { listingId: string; actorUserId?: string | null }) {
  let c = await getLatestCaseForEntity("SHORT_TERM_LISTING", args.listingId);
  if (!c) {
    c = await createVerificationCase({
      entityType: "SHORT_TERM_LISTING",
      entityId: args.listingId,
      createdBy: args.actorUserId ?? null,
    });
  }
  return runShortTermListingVerificationPipeline({
    caseId: c.id,
    listingId: args.listingId,
    actorUserId: args.actorUserId,
  });
}
