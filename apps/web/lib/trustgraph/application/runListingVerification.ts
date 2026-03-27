import { runFsboListingVerificationPipeline } from "@/lib/trustgraph/infrastructure/services/verificationPipeline";

/** Full listing + declaration ruleset for `VerificationEntityType.LISTING` cases. */
export async function runListingVerification(args: {
  caseId: string;
  listingId: string;
  actorUserId?: string | null;
}) {
  return runFsboListingVerificationPipeline(args);
}
